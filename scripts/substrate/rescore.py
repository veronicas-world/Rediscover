#!/usr/bin/env python3
"""Rescore driver — enforces the required order for a full rescore.

The rescore sequence has four stages, and they MUST run in this order:

  1. RE-EXTRACT CLAIMS      (extract_claims.run)
     Re-extract atomic claims from source documents. Claim text, directions,
     and aspects can change when the extraction prompt is revised.

  2. RE-RUN ENTAILMENT      (verify_provenance.run)
     Re-score entailment labels. A claim that was "entailed" may move to
     "neutral" or "contradicted" when the entailment prompt or guard changes.
     This is the stage that invalidates existing contradiction rows: a
     contradiction row references two claims, and if either claim's
     entailment_label is no longer "entailed", the row is stale.

  3. REBUILD CONTRADICTIONS  (backup + DELETE + detect_contradictions.run)
     Back up existing rows to a timestamped JSON file, delete ALL rows from
     the contradictions table, then re-run detection against the current
     claim set. This step is NOT optional and NOT idempotent with append:
     detect_contradictions.py skips pairs that already have a row, so
     without the delete, stale rows survive and score_claims.py reads
     contradictions computed against a claim set that no longer exists.

     TRANSACTION NOTE: The DELETE and the regeneration CANNOT be wrapped in
     a single SQLite transaction. detect_contradictions.run() opens its own
     connection via db.connect() and commits after each found contradiction.
     A transaction on a different connection would not protect the DELETE.
     Safety relies on the JSON backup: if stage 3 dies partway, the backup
     has the pre-rescore rows and the table has a partial set from the
     current run. Re-running --from-stage 3 starts fresh (see below).

     RE-RUN SAFETY: --from-stage 3 is safe to re-run against a partially
     rebuilt table. It backs up whatever rows exist (from the failed run),
     deletes them, and re-runs detection from scratch. All candidate pairs
     are re-evaluated because the table is empty after the DELETE. The cost
     is that NLI calls from the failed run are repeated.

  4. SCORE SIGNALS           (score_claims.run)
     Score signals against the rebuilt contradictions table.

Running stages out of order (or skipping stage 3) produces signals scored
against stale contradiction data. The integrity check
(`--check-integrity`) catches this after the fact but does not fix it.

Usage (from repo root):
    python3 scripts/substrate/rescore.py                     # full rescore
    python3 scripts/substrate/rescore.py --from-stage 3      # resume from stage 3
    python3 scripts/substrate/rescore.py --check-integrity   # standalone check
    python3 scripts/substrate/rescore.py --dry-run           # list stage 3 candidates, no NLI
    python3 scripts/substrate/rescore.py --limit 5           # stage 3 with 5 NLI calls only

HARD RULE: if Anthropic credits run out mid-run, we STOP. We never fabricate
entailment or contradiction output. Re-run with --from-stage to resume.
"""
import json
import sys
import argparse
from datetime import datetime, timezone
from pathlib import Path

import db
import extract_claims
import verify_provenance
import detect_contradictions
import score_claims
from llm import usage_snapshot, CreditsExhausted

AUDIT_DIR = Path(__file__).resolve().parent.parent / "audit-output"


STAGES = [
    (1, "re-extract claims", "extract_claims"),
    (2, "re-run entailment", "verify_provenance"),
    (3, "rebuild contradictions", "detect_contradictions"),
    (4, "score signals", "score_claims"),
]


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


def _print_usage(stage):
    u = usage_snapshot()
    print(f"  [usage after {stage}] {u['calls']} calls, "
          f"{u['input_tokens']}+{u['output_tokens']} tok, ~${u['est_cost_usd']:.4f}")


def main():
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--from-stage", type=int, default=1, choices=[1, 2, 3, 4],
                    help="resume from this stage (1=extract, 2=entailment, "
                         "3=contradictions, 4=score)")
    ap.add_argument("--check-integrity", action="store_true",
                    help="run only the contradiction integrity check and exit")
    ap.add_argument("--dry-run", action="store_true",
                    help="list stage 3 candidate pairs without calling NLI "
                         "(zero credits). Does not modify the database.")
    ap.add_argument("--limit", type=int, default=None,
                    help="stage 3 only: evaluate at most N candidate pairs "
                         "(N NLI calls). Useful for verifying the pipeline "
                         "without spending full credits.")
    args = ap.parse_args()

    if args.check_integrity:
        count, details = check_integrity()
        if count == 0:
            print("contradiction integrity: OK (0 stale rows)")
            return 0
        print(f"contradiction integrity: FAIL ({count} stale row(s))")
        for d in details:
            print(f"  row {d['id']}: "
                  f"claim_a ent={d['ent_a']} pv={d['pv_a']}, "
                  f"claim_b ent={d['ent_b']} pv={d['pv_b']}")
        print("\nRebuild the contradictions table:")
        print("  python3 scripts/substrate/rescore.py --from-stage 3")
        return 1

    # --dry-run: list stage 3 candidates without NLI calls or DELETE
    if args.dry_run:
        print("== Stage 3 dry run (no NLI, no DELETE) ==")
        db.init_db()
        detect_contradictions.run(dry_run=True)
        print("\nDRY RUN — nothing was modified. Re-run without --dry-run to apply.")
        return 0

    print("== Whel rescore ==")
    db.init_db()

    # Pre-flight integrity check
    count, _ = check_integrity()
    if count > 0:
        print(f"\nWARNING: {count} stale contradiction row(s) detected. "
              f"Stage 3 will delete and rebuild them.")

    stopped = None
    try:
        if args.from_stage <= 1:
            print("\n[stage 1] Re-extract claims ...")
            extract_claims.run()
            _print_usage("extraction")

        if args.from_stage <= 2:
            print("\n[stage 2] Re-run entailment ...")
            verify_provenance.run()
            _print_usage("entailment")

        if args.from_stage <= 3:
            print("\n[stage 3] Rebuild contradictions (backup + DELETE + re-detect) ...")
            # Back up existing rows before DELETE
            backup_path, n_old = _backup_contradictions()
            print(f"  backed up {n_old} row(s) to {backup_path}")
            # Delete all rows
            conn = db.connect()
            conn.execute("DELETE FROM contradictions")
            conn.commit()
            conn.close()
            print(f"  deleted {n_old} existing contradiction row(s)")
            # Regenerate
            detect_contradictions.run(limit=args.limit)
            _print_usage("contradictions")

        if args.from_stage <= 4:
            print("\n[stage 4] Score signals ...")
            score_claims.run()
            _print_usage("scoring")

    except CreditsExhausted as e:
        stopped = str(e)

    # Post-run integrity check
    count, details = check_integrity()
    if count > 0:
        print(f"\nWARNING: {count} stale contradiction row(s) remain after rescore. "
              f"This should not happen — investigate.")
        for d in details:
            print(f"  row {d['id']}: "
                  f"claim_a ent={d['ent_a']} pv={d['pv_a']}, "
                  f"claim_b ent={d['ent_b']} pv={d['pv_b']}")
    else:
        print("\ncontradiction integrity: OK (0 stale rows)")

    if stopped:
        print("\n" + "!" * 64)
        print("CREDITS EXHAUSTED — rescore stopped early. NOTHING was self-adjudicated.")
        print(f"  Anthropic: {stopped}")
        print("  Resume with: python3 scripts/substrate/rescore.py "
              f"--from-stage {min(args.from_stage, 4)}")
        print("  (Adjust --from-stage to the last stage that completed.)")
        print("  The pre-rescore contradictions are backed up in audit-output/.")
        print("!" * 64)
        return 3

    print("\n== Rescore complete ==")
    return 0


if __name__ == "__main__":
    sys.exit(main())
