#!/usr/bin/env python3
"""Rescore driver — one command, end to end.

The pipeline has five stages and they MUST run in this order. A plain
invocation runs all five and emits the review artifacts (retrieval manifest,
PRISMA flow, seed migrations).

  0. FETCH + CHUNK           (fetch_pubmed / fetch_trials / fetch_community /
                              fetch_pathway.opentargets, then chunk.run)
     Retrieval runs against the caps in config.RETRIEVAL — a change is a
     config edit, not a code edit. Each query/dataset is recorded into the
     in-run manifest (PRISMA-S: query string, database, interface, timestamp,
     limits/filters, records returned). Re-running is safe: existing
     documents are skipped by content hash / external id, not refetched.

  1. RE-EXTRACT CLAIMS        (extract_claims.run)
     Re-extract atomic claims from source documents. Claim text, directions,
     and aspects can change when the extraction prompt is revised.

  2. RE-RUN ENTAILMENT        (verify_provenance.run)
     Re-score entailment labels, THEN fetch the dependent structured safety
     sources (AEMS + SIDER), which can only run once candidate drugs exist in
     the substrate from stage 0/1. Their claims are inserted pre-verified.

  3. REBUILD CONTRADICTIONS   (backup + DELETE + detect_contradictions.run)
     Back up existing rows to a timestamped JSON file, delete ALL rows from
     the contradictions table, then re-run detection against the current
     claim set. NOT optional and NOT idempotent with append.

  4. SCORE SIGNALS            (score_claims.run + export_signals)
     Score signals against the rebuilt contradictions table and emit the
     051 migration.

  FINALIZE (always, even on interruption — commit what exists):
     export_migration.run()      -> 047 seed + run log
     score_claims.export_signals()-> 051 signals seed
     write run-manifest-<run>.json    (retrieval record, PRISMA-S)
     write prisma-flow-<run>.json     (identification-and-screening funnel)

Running stages out of order (or skipping stage 3) produces signals scored
against stale contradiction data.

Usage (from repo root):
    python3 scripts/substrate/rescore.py                                   # full end-to-end
    python3 scripts/substrate/rescore.py --from-stage 3                    # resume from stage 3
    python3 scripts/substrate/rescore.py --dry-run                         # full dry run: every stage,
                                                                           # zero API calls, zero writes,
                                                                           # prints plan + cost estimate
    python3 scripts/substrate/rescore.py --check-integrity                 # standalone check
    python3 scripts/substrate/rescore.py --limit 5                         # stage 3, 5 NLI calls, NO DELETE
    python3 scripts/substrate/rescore.py --limit 5 --i-know-this-deletes   # stage 3, 5 NLI, WITH DELETE
    python3 scripts/substrate/rescore.py --restore-backup PATH             # restore rows from a backup

HARD RULE: if Anthropic credits run out mid-run, we STOP. We never fabricate
entailment, contradiction, or score output. Re-run with --from-stage to resume.
"""
import json
import os
import sys
import sqlite3
import argparse
from datetime import datetime, timezone
from pathlib import Path

import db
import chunk
import extract_claims
import verify_provenance
import detect_contradictions
import score_claims
import export_migration
import fetch_pubmed
import fetch_trials
import fetch_community
import fetch_pathway
import fetch_sider
import manifest
import flow as prisma_flow
from llm import usage_snapshot, CreditsExhausted
from config import (RETRIEVAL, MODEL, DRY_RUN_COST_ASSUMPTIONS, PRICE_IN, PRICE_OUT,
                    AUDIT_OUT, WORK_DB, CONDITIONS, load_dotenv)

# Backups (stage 3) keep the historical scripts/audit-output/ location so the
# runbook's restore paths stay valid; manifest + flow live in scripts/substrate/audit-output/.
AUDIT_DIR = Path(__file__).resolve().parent.parent / "audit-output"

# Columns in the contradictions table. The backup JSON includes joined
# claim fields (claim_a_text, etc.) that must be filtered out on restore.
CONTRADICTION_COLUMNS = (
    "id", "claim_a_id", "claim_b_id", "intervention_id", "condition_id",
    "nli_label", "nli_score", "rationale", "model_name", "created_at",
)

STAGE_NAMES = {
    0: "fetch+chunk",
    1: "extract",
    2: "entail (+ aems/sider)",
    3: "contradictions",
    4: "score",
}


def check_integrity():
    """Count contradiction rows whose claims are not currently entailed and
    provenance-verified. This number should always be zero. A non-zero count
    means the contradictions table holds rows from a previous claim set that
    has since been re-scored — the table needs to be rebuilt.

    Returns (stale_count, details_list).
    """
    conn = db.connect()
    stale = conn.execute(
        "SELECT c.id, c.claim_a_id, c.claim_b_id, "
        "ca.entailment_label AS ent_a, ca.provenance_verified AS pv_a, "
        "cb.entailment_label AS ent_b, cb.provenance_verified AS pv_b "
        "FROM contradictions c "
        "JOIN claims ca ON c.claim_a_id = ca.id "
        "JOIN claims cb ON c.claim_b_id = cb.id "
        "WHERE NOT (ca.provenance_verified = 1 AND ca.entailment_label = 'entailed' "
        "AND cb.provenance_verified = 1 AND cb.entailment_label = 'entailed')"
    ).fetchall()
    conn.close()
    return len(stale), [dict(r) for r in stale]


def _backup_contradictions():
    """Write all existing contradiction rows to a timestamped JSON file in
    audit-output/. Returns the backup path. This runs BEFORE the DELETE so
    the rows are recoverable if stage 3 dies partway.
    """
    conn = db.connect()
    rows = conn.execute(
        "SELECT c.*, ca.text AS claim_a_text, cb.text AS claim_b_text, "
        "ca.entailment_label AS ent_a, cb.entailment_label AS ent_b "
        "FROM contradictions c "
        "JOIN claims ca ON c.claim_a_id = ca.id "
        "JOIN claims cb ON c.claim_b_id = cb.id"
    ).fetchall()
    conn.close()

    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    ts = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = AUDIT_DIR / f"contradictions-backup-{ts}.json"
    path.write_text(json.dumps({
        "backed_up_at": datetime.now(timezone.utc).isoformat(),
        "row_count": len(rows),
        "rows": [dict(r) for r in rows],
    }, indent=2) + "\n")
    return path, len(rows)


def _restore_backup(path):
    """Read a contradictions-backup-*.json file and write those rows back
    to the contradictions table, replacing whatever is there. Returns the
    number of rows restored.
    """
    data = json.loads(Path(path).read_text())
    rows = data.get("rows", [])
    conn = db.connect()
    conn.execute("DELETE FROM contradictions")
    restored = 0
    for row in rows:
        values = {k: row.get(k) for k in CONTRADICTION_COLUMNS}
        cols = ", ".join(CONTRADICTION_COLUMNS)
        ph = ", ".join("?" for _ in CONTRADICTION_COLUMNS)
        conn.execute(
            f"INSERT OR REPLACE INTO contradictions ({cols}) VALUES ({ph})",
            [values[k] for k in CONTRADICTION_COLUMNS],
        )
        restored += 1
    conn.commit()
    conn.close()
    return restored


def _print_integrity():
    count, details = check_integrity()
    if count == 0:
        print("contradiction integrity: OK (0 stale rows)")
    else:
        print(f"contradiction integrity: FAIL ({count} stale row(s))")
        for d in details:
            print(f"  row {d['id']}: "
                  f"claim_a ent={d['ent_a']} pv={d['pv_a']}, "
                  f"claim_b ent={d['ent_b']} pv={d['pv_b']}")
    return count


def _print_usage(stage):
    u = usage_snapshot()
    print(f"  [usage after {stage}] {u['calls']} calls, "
          f"{u['input_tokens']}+{u['output_tokens']} tok, ~${u['est_cost_usd']:.4f}")


# ── Stage 0: fetch + chunk ─────────────────────────────────────────────────

def stage0_fetch():
    """Run the source fetchers (caps from config.RETRIEVAL), then chunk.
    Safe to re-run: documents dedup on content hash / external id."""
    print("\n[stage 0] Fetch (pubmed, trials, community, opentargets) + chunk ...")
    print("  (retrieval caps from config.RETRIEVAL; each query is recorded in the "
          "run manifest)")
    fetch_pubmed.run()
    fetch_trials.run()
    fetch_community.run()
    fetch_pathway.run(sources=("opentargets",))
    print(f"  {chunk.run()} new span(s)")
    print(f"  manifest: {manifest.write(_manifest_path())}")


# ── Stage 2 dependent fetches (AEMS + SIDER) ───────────────────────────────

def stage2_dependent_fetch():
    """AEMS + SIDER need candidate drugs from extracted claims, so they run
    after entailment. Structured renders are inserted pre-verified."""
    print("\n[stage 2.b] Fetch dependent structured sources (aems, sider) ...")
    fetch_pathway.run(sources=("aems",))
    fetch_sider.run()
    print(f"  manifest: {manifest.write(_manifest_path())}")


def _manifest_path():
    return AUDIT_OUT / f"run-manifest-{_RUN_ID}.json"


def _flow_path():
    return AUDIT_OUT / f"prisma-flow-{_RUN_ID}.json"


def finalize(stopped):
    """Export what exists + write the retrieval manifest and PRISMA flow.
    Runs even on interruption — commit what exists, honestly."""
    print("\n[finalize] Export + retrieval manifest + PRISMA flow ...")
    try:
        export_migration.run(usage=usage_snapshot())
    except Exception as e:  # noqa: BLE001
        print(f"  [warn] export_migration failed: {e}")
    try:
        score_claims.export_signals()
    except Exception as e:  # noqa: BLE001
        print(f"  [warn] export_signals failed: {e}")

    if WORK_DB.exists():
        conn = db.connect()
        try:
            flow = prisma_flow.write_flow(conn, manifest.events(), _RUN_ID, _flow_path())
            print(f"  flow: {_flow_path()}")
            print(prisma_flow.render_flow(flow))
        except Exception as e:  # noqa: BLE001
            print(f"  [warn] prisma flow failed: {e}")
        conn.close()
    manifest.write(_manifest_path())
    print(f"  manifest: {_manifest_path()}")


# ── Full dry run (zero API, zero LLM, zero writes) ──────────────────────────

def _ro_conn():
    """Read-only handle to the work store, or None if it doesn't exist yet.
    Deliberately does NOT create the file (dry run writes nothing)."""
    if not WORK_DB.exists():
        return None
    conn = sqlite3.connect(f"file:{WORK_DB}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


def _count_or(conn, sql, *args, default=0):
    if conn is None:
        return default
    try:
        return conn.execute(sql, args).fetchone()[0]
    except sqlite3.OperationalError:
        return default


def dry_run():
    """Full-pipeline dry run: every stage, zero API calls, zero writes, prints
    what it would do and what it would cost (planning estimates)."""
    print("== Whel pipeline dry run (no API, no LLM, no writes) ==")
    load_dotenv()
    conn = _ro_conn()
    if conn is None:
        print("  (empty work store — no database has been built yet; counts below are 0)")

    print(f"\n  run id would be: {_RUN_ID}")
    print(f"  model: {MODEL} (${PRICE_IN * 1e6:.0f}/M in, ${PRICE_OUT * 1e6:.0f}/M out)")
    print("  retrieval caps (from config.RETRIEVAL — a change is a config edit):")
    for src, p in RETRIEVAL.items():
        caps = ", ".join(f"{k}={v}" for k, v in p.items()
                         if k not in ("interface", "db") and not k.endswith("delay_s"))
        print(f"    {src:15s} [{p.get('interface')}]  {caps}")
    if not os.environ.get("REDDIT_CLIENT_ID") or not os.environ.get("REDDIT_CLIENT_SECRET"):
        print("    community  [WARNING] REDDIT_CLIENT_ID/SECRET not set in .env.local; "
              "the community stage would fail")

    # ── Stage 0 ──────────────────────────────────────────────────────────────
    print("\n[stage 0] fetch + chunk plan")
    docs_by_source = {}
    if conn is not None:
        try:
            docs_by_source = {r["source"]: r["n"] for r in conn.execute(
                "SELECT source, COUNT(*) n FROM documents GROUP BY source")}
        except sqlite3.OperationalError:
            pass
    ot_ids = fetch_pathway._ot_disease_ids()  # read-only file parse
    sources_present = [s for s in ("pubmed", "clinicaltrials", "reddit", "opentargets")
                       if docs_by_source.get(s)]
    for ck in CONDITIONS:
        p = RETRIEVAL["pubmed"]
        seeds = CONDITIONS[ck].get("seed_pmids") or []
        print(f"    {ck}: pubmed {len(CONDITIONS[ck]['queries'])} queries x retmax={p['retmax']}"
              f" (cap {p['max_documents']} docs/condition)"
              + (f" + {len(seeds)} seed PMID(s)" if seeds else "")
              + f"; trials cap={RETRIEVAL['clinicaltrials']['max_trials']}"
              + f"; reddit {RETRIEVAL['community']['max_posts']} posts x {RETRIEVAL['community']['max_comments']} comments"
              + (f"; opentargets id={ot_ids.get(ck.lower())}" if ot_ids.get(ck.lower()) else "; opentargets: not indexed"))
    if sources_present:
        print(f"    (store already holds docs from: {', '.join(sources_present)})")
    docs_pending = _count_or(conn,
        "SELECT COUNT(*) FROM documents d WHERE NOT EXISTS (SELECT 1 FROM source_spans s WHERE s.document_id = d.id)")
    print(f"    chunk: {docs_pending} document(s) lack spans (would be segmented)")

    # ── Stage 1 ──────────────────────────────────────────────────────────────
    print("\n[stage 1] extract plan (LLM calls = 1 per candidate span)")
    n_pending = _count_or(conn, "SELECT COUNT(*) FROM source_spans WHERE extracted = 0")
    n_candidates = 0
    if conn is not None and n_pending:
        try:
            rows = conn.execute(
                "SELECT s.id, s.text, d.source AS _source FROM source_spans s"
                " JOIN documents d ON s.document_id = d.id WHERE s.extracted = 0").fetchall()
            spans = [dict(r) for r in rows]
            n_candidates = sum(1 for s in spans if extract_claims._passes_triage(s))
        except sqlite3.OperationalError:
            n_candidates = 0
    print(f"    {n_pending} span(s) pending; ~{n_candidates} pass triage and would get an "
          f"extraction call; ~{n_pending - n_candidates} skipped (no treatment-effect signal)")

    # ── Stage 2 ──────────────────────────────────────────────────────────────
    print("\n[stage 2] entailment + dependent fetch plan (LLM calls = 1 per claim)")
    n_entail = _count_or(conn, "SELECT COUNT(*) FROM claims WHERE provenance_verified = 1"
                               " AND entailment_label IS NULL")
    print(f"    {n_entail} claim(s) need an entailment label")
    if conn is not None:
        try:
            drugs = {r["cond"]: r["n"] for r in conn.execute(
                "SELECT d.norm_key cond, COUNT(DISTINCT e.id) n"
                " FROM claims c JOIN entities e ON c.intervention_id = e.id"
                " JOIN entities d ON c.condition_id = d.id"
                " WHERE e.type='intervention' AND c.provenance_verified=1"
                " GROUP BY d.norm_key")}
        except sqlite3.OperationalError:
            drugs = {}
    aems_calls = sum(min(n, RETRIEVAL["aems"]["max_drugs"]) for n in drugs.values())
    print(f"    aems: {aems_calls} openFDA request(s) (~2 per candidate drug, "
          f"cap {RETRIEVAL['aems']['max_drugs']} drugs/condition)")
    print(f"    sider: local scan over matched STITCH ids (no network beyond the cached TSV)")

    # ── Stage 3 ──────────────────────────────────────────────────────────────
    print("\n[stage 3] contradictions plan (LLM calls = 1 per candidate pair)")
    n_pairs = _candidate_pairs_count(conn)
    print(f"    {n_pairs} candidate (intervention, condition) pairs would go to the NLI")

    # ── Stage 4 ──────────────────────────────────────────────────────────────
    print("\n[stage 4] score plan (LLM calls = 1 per (intervention, condition, aspect, arm))")
    n_groups = _score_groups_count(conn)
    print(f"    {n_groups} signal group(s) to score")

    # ── Finalize ─────────────────────────────────────────────────────────────
    print("\n[finalize] would write:")
    print(f"    {_manifest_path()}")
    print(f"    {_flow_path()}")
    print(f"    {export_migration.SEED_MIGRATION}")
    print(f"    {score_claims.SIGNALS_SEED}")

    # ── Cost estimate ────────────────────────────────────────────────────────
    print("\n  cost estimate (planning figures — assumptions in "
          "config.DRY_RUN_COST_ASSUMPTIONS; recalibrate after the first real run):")
    stages = [
        ("extract", n_candidates),
        ("entail", n_entail),
        ("contradiction", n_pairs),
        ("score", n_groups),
    ]
    tot_in = tot_out = 0
    for name, calls in stages:
        a = DRY_RUN_COST_ASSUMPTIONS[name]
        c_in = calls * a["input"]
        c_out = calls * a["output"]
        tot_in += c_in
        tot_out += c_out
        cost = c_in * PRICE_IN + c_out * PRICE_OUT
        print(f"      {name:14s} {calls:6d} calls  ~{c_in // 1000}k+{c_out // 1000}k tok  "
              f"~${cost:.2f}")
    total = tot_in * PRICE_IN + tot_out * PRICE_OUT
    print(f"      TOTAL ~{tot_in // 1000}k input + {tot_out // 1000}k output tokens, "
          f"~${total:.2f} (LLM only; retrieval APIs are free at this scale)")
    if conn is not None:
        conn.close()
    print("\n  DRY RUN COMPLETE — nothing was fetched, nothing was written.")
    return 0


def _candidate_pairs_count(conn):
    """Count (intervention, condition) claim pairs with conflicting directions
    that stage 3 would send to the NLI. Replicates detect_contradictions'
    grouping without any NLI call (SQL + combinations only)."""
    if conn is None:
        return 0
    from itertools import combinations
    try:
        rows = conn.execute(
            "SELECT id, intervention_id, condition_id, direction FROM claims"
            " WHERE provenance_verified = 1 AND aspect = 'efficacy'"
            " AND entailment_label = 'entailed'").fetchall()
    except sqlite3.OperationalError:
        return 0
    groups = {}
    for r in rows:
        groups.setdefault((r["intervention_id"], r["condition_id"]), []).append(r)
    conflict = {tuple(sorted(("positive", "negative"))),
                tuple(sorted(("positive", "null"))),
                tuple(sorted(("negative", "null")))}
    n = 0
    for claims in groups.values():
        for a, b in combinations(claims, 2):
            if tuple(sorted((a["direction"], b["direction"]))) in conflict:
                n += 1
    return n


def _score_groups_count(conn):
    """Distinct (intervention, condition, aspect, arm) groups that stage 4
    would score (claims already provenance-verified)."""
    if conn is None:
        return 0
    try:
        return len(score_claims._group_claims(conn))
    except sqlite3.OperationalError:
        return 0


# ── Main ───────────────────────────────────────────────────────────────────

def main():
    global _RUN_ID
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--from-stage", type=int, default=0, choices=[0, 1, 2, 3, 4],
                    help="resume from this stage (0=fetch+chunk, 1=extract, "
                         "2=entail+aems/sider, 3=contradictions, 4=score)")
    ap.add_argument("--check-integrity", action="store_true",
                    help="run only the contradiction integrity check and exit")
    ap.add_argument("--dry-run", action="store_true",
                    help="full-pipeline dry run: every stage planned, zero API "
                         "calls, zero LLM calls, zero writes; prints the plan "
                         "and a cost estimate")
    ap.add_argument("--limit", type=int, default=None,
                    help="stage 3 only: evaluate at most N candidate pairs "
                         "(N NLI calls). By default does NOT delete the table "
                         "(safe test). Use --i-know-this-deletes to run the "
                         "full backup + DELETE + regenerate.")
    ap.add_argument("--i-know-this-deletes", action="store_true",
                    help="with --limit: run the full stage 3 (backup + DELETE "
                         "+ regenerate with limit N). Without this flag, "
                         "--limit skips the DELETE and runs detection against "
                         "the existing table.")
    ap.add_argument("--restore-backup", type=str, default=None, metavar="PATH",
                    help="restore contradiction rows from a backup JSON file. "
                         "Replaces all existing rows. Runs the integrity check "
                         "afterward.")
    args = ap.parse_args()
    _RUN_ID = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    if args.check_integrity:
        count = _print_integrity()
        return 0 if count == 0 else 1

    if args.restore_backup:
        path = Path(args.restore_backup)
        if not path.exists():
            print(f"ERROR: backup file not found: {path}", file=sys.stderr)
            return 1
        print(f"== Restoring contradictions from {path} ==")
        restored = _restore_backup(path)
        print(f"  restored {restored} row(s)")
        _print_integrity()
        return 0

    if args.dry_run:
        return dry_run()

    # --limit without --i-know-this-deletes: safe test, no DELETE
    limit_is_test = args.limit is not None and not args.i_know_this_deletes
    if limit_is_test:
        print("== Stage 3 limited test (NO DELETE — existing rows preserved) ==")
        print(f"  --limit {args.limit}: evaluating {args.limit} candidate pairs")
        print(f"  (existing contradiction rows are NOT deleted. New findings")
        print(f"   will be appended. This is a test, not a rebuild.)")
        db.init_db()
        detect_contradictions.run(limit=args.limit)
        _print_integrity()
        print("\nTo do a full rebuild with this limit, add --i-know-this-deletes.")
        print("To restore the table afterward, use --restore-backup with the")
        print("backup file from audit-output/.")
        return 0

    print("== Whel pipeline (end to end) ==")
    manifest.start(_RUN_ID, RETRIEVAL, MODEL)
    db.init_db()

    # Pre-flight integrity check
    count, _ = check_integrity()
    if count > 0:
        print(f"\nWARNING: {count} stale contradiction row(s) detected. "
              f"Stage 3 will delete and rebuild them.")

    stopped = None
    backup_path = None
    try:
        if args.from_stage <= 0:
            stage0_fetch()

        if args.from_stage <= 1:
            print("\n[stage 1] Re-extract claims ...")
            extract_claims.run()
            _print_usage("extraction")

        if args.from_stage <= 2:
            print("\n[stage 2] Re-run entailment ...")
            verify_provenance.run()
            _print_usage("entailment")
            stage2_dependent_fetch()

        if args.from_stage <= 3:
            print("\n[stage 3] Rebuild contradictions (backup + DELETE + re-detect) ...")
            if args.limit is not None:
                print(f"  --limit {args.limit} --i-know-this-deletes: "
                      f"full rebuild with limited NLI calls")
            backup_path, n_old = _backup_contradictions()
            print(f"  backed up {n_old} row(s) to {backup_path}")
            conn = db.connect()
            conn.execute("DELETE FROM contradictions")
            conn.commit()
            conn.close()
            print(f"  deleted {n_old} existing contradiction row(s)")
            detect_contradictions.run(limit=args.limit)
            _print_usage("contradictions")

        if args.from_stage <= 4:
            print("\n[stage 4] Score signals ...")
            score_claims.run()
            _print_usage("scoring")

    except CreditsExhausted as e:
        stopped = str(e)

    finalize(stopped)

    # Post-run integrity check
    _print_integrity()

    if stopped:
        print("\n" + "!" * 64)
        print("CREDITS EXHAUSTED — pipeline stopped early. NOTHING was self-adjudicated.")
        print(f"  Anthropic: {stopped}")
        print("  What completed is committed/exported; un-run stages report NULL")
        print("  entailment_label / no contradictions / no scores — honestly reflecting the gap.")
        print("  Resume with: python3 scripts/substrate/rescore.py "
              f"--from-stage {min(args.from_stage, 4)}")
        print("  (Adjust --from-stage to the last stage that completed.)")
        if backup_path:
            print(f"  The pre-rescore contradictions are backed up in {backup_path}")
            print(f"  Restore with: python3 scripts/substrate/rescore.py "
                  f"--restore-backup {backup_path}")
        print("!" * 64)
        return 3

    print("\n== Pipeline complete ==")
    return 0


_RUN_ID = None

if __name__ == "__main__":
    sys.exit(main())
