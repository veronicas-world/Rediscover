"""PRISMA-style flow record for one run.

Builds the identification-and-screening funnel from the retrieval manifest
(what the APIs returned) plus the working store (what the pipeline did with
it): records identified per source, duplicates removed, records screened,
excluded with reasons, documents included, claims extracted, claims entailed,
contradictions surfaced, and signals scored. One dated file per run.

This is the artifact that used to be reconstructed by hand. It now falls out
of the run (see rescore.py finalize).
"""
import json
from datetime import datetime, timezone


def _sum_events(events, source, *fields):
    """Sum one or more numeric fields across manifest events for a source."""
    tot = {f: 0 for f in fields}
    for e in events:
        if (e.get("event") == "run_start") or (e.get("source") != source):
            continue
        for f in fields:
            v = e.get(f)
            if isinstance(v, (int, float)):
                tot[f] += v
    return tuple(tot[f] for f in (fields if len(fields) > 1 else fields[0]))


def _source_identification(events):
    """Per source: records matching the query/filter, fetched, deduped out, inserted."""
    out = {}
    for e in events:
        src = e.get("source")
        if src is None or e.get("event") == "run_start":
            continue
        row = out.setdefault(src, {"records_matching": 0, "records_fetched": 0,
                                   "dedup_skipped": 0, "records_inserted": 0})
        for f in ("records_matching", "records_fetched", "dedup_skipped", "records_inserted"):
            v = e.get(f)
            if isinstance(v, (int, float)):
                row[f] += v
    return out


def build_flow(conn, events, run_id):
    """Compute the flow record. `conn` is the local work store; `events` the
    retrieval manifest events. Pure read of the store — no writes."""
    def count(sql, *args):
        try:
            return conn.execute(sql, args).fetchone()[0]
        except Exception:  # noqa: BLE001 — table may not exist in an empty store
            return 0

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    # ── Identification (per manifest) ───────────────────────────────────────
    identification = _source_identification(events)
    total_matching = sum(v["records_matching"] for v in identification.values())
    total_fetched = sum(v["records_fetched"] for v in identification.values())
    total_dedup = sum(v["dedup_skipped"] for v in identification.values())
    total_inserted = sum(v["records_inserted"] for v in identification.values())

    # ── Documents included / screened ───────────────────────────────────────
    doc_by_source = {}
    for r in conn.execute("SELECT source, COUNT(*) n FROM documents GROUP BY source"):
        doc_by_source[r["source"]] = r["n"]
    total_docs = sum(doc_by_source.values())

    spans_total = count("SELECT COUNT(*) FROM source_spans")
    # spans marked extracted with no claim AND not from a structured source were
    # excluded by the rule-based triage (no treatment-effect signal)
    triage_skipped = count(
        "SELECT COUNT(*) FROM source_spans s JOIN documents d ON s.document_id = d.id"
        " WHERE s.extracted = 1 AND d.source NOT IN ('opentargets','aems','sider')"
        " AND NOT EXISTS (SELECT 1 FROM claims c WHERE c.span_id = s.id)")
    spans_pending = count("SELECT COUNT(*) FROM source_spans WHERE extracted = 0")

    # ── Claims ──────────────────────────────────────────────────────────────
    claims_total = count("SELECT COUNT(*) FROM claims")
    claims_pv = count("SELECT COUNT(*) FROM claims WHERE provenance_verified = 1")
    claims_rejected = count("SELECT COUNT(*) FROM claims WHERE provenance_verified = 0")
    entailed = count("SELECT COUNT(*) FROM claims WHERE entailment_label = 'entailed' "
                     "AND provenance_verified = 1")
    neutral = count("SELECT COUNT(*) FROM claims WHERE entailment_label = 'neutral'")
    contradicted_claims = count("SELECT COUNT(*) FROM claims WHERE entailment_label = 'contradicted'")
    unlabeled = count("SELECT COUNT(*) FROM claims WHERE provenance_verified = 1 "
                      "AND entailment_label IS NULL")

    # ── Contradictions ──────────────────────────────────────────────────────
    contrad_rows = count("SELECT COUNT(*) FROM contradictions")

    # ── Signals ─────────────────────────────────────────────────────────────
    signals = {}
    try:
        for r in conn.execute("SELECT status, COUNT(*) n FROM substrate_signals GROUP BY status"):
            signals[r["status"]] = r["n"]
    except Exception:  # noqa: BLE001
        pass
    signals_active = signals.get("active", 0)
    signals_off_scope = signals.get("off_scope", 0)
    signals_off_topic = signals.get("off_topic", 0)
    signals_total = sum(signals.values())

    flow = {
        "artifact": "whel-prisma-flow",
        "run_id": run_id,
        "generated_at": now,
        "note": ("Whel's screening is automated (rule triage + NLI gates), not a "
                 "manual title/abstract screen; exclusion reasons are recorded per "
                 "stage below. Identification numbers come from the retrieval "
                 "manifest captured during the fetch stage."),
        "identification": {
            "total_records_matching": total_matching,
            "total_records_fetched": total_fetched,
            "duplicates_removed": total_dedup,
            "records_inserted": total_inserted,
            "per_source": identification,
        },
        "screening": {
            "documents_included": total_docs,
            "documents_by_source": doc_by_source,
            "spans_total": spans_total,
            "spans_pending_extraction": spans_pending,
            "spans_excluded_no_signal": triage_skipped,
            "exclusion_reasons": [
                {"reason": "no treatment-effect signal (rule-based triage)",
                 "count": triage_skipped},
                {"reason": "quote not found verbatim in span (provenance check)",
                 "count": claims_rejected},
                {"reason": "entailment neutral/overreach (NLI gate)",
                 "count": neutral},
                {"reason": "entailment contradicted (NLI gate)",
                 "count": contradicted_claims},
            ],
        },
        "claims": {
            "claims_extracted": claims_total,
            "provenance_verified": claims_pv,
            "entailed": entailed,
            "neutral": neutral,
            "contradicted": contradicted_claims,
            "unlabeled": unlabeled,
        },
        "contradictions": {
            "rows_after_rebuild": contrad_rows,
        },
        "signals_scored": {
            "total": signals_total,
            "active": signals_active,
            "off_scope": signals_off_scope,
            "off_topic": signals_off_topic,
        },
    }
    return flow


def write_flow(conn, events, run_id, path):
    """Build and persist the flow record. Returns the flow dict."""
    flow = build_flow(conn, events, run_id)
    path.write_text(json.dumps(flow, indent=2) + "\n")
    return flow


def render_flow(flow):
    """Compact human-readable rendering of the flow record (for the console)."""
    L = []
    ident = flow["identification"]
    L.append(f"  identified (records matching queries): {ident['total_records_matching']}"
             f"  | fetched: {ident['total_records_fetched']}"
             f"  | duplicates removed: {ident['duplicates_removed']}"
             f"  | inserted: {ident['records_inserted']}")
    for src, v in ident.get("per_source", {}).items():
        L.append(f"    {src:15s} matching={v['records_matching']} fetched={v['records_fetched']} "
                 f"dedup={v['dedup_skipped']} inserted={v['records_inserted']}")
    scr = flow["screening"]
    L.append(f"  screened: {scr['documents_included']} document(s) -> {scr['spans_total']} span(s)")
    for r in scr["exclusion_reasons"]:
        L.append(f"    excluded: {r['reason']} ({r['count']})")
    cl = flow["claims"]
    L.append(f"  claims extracted: {cl['claims_extracted']} (verified {cl['provenance_verified']}; "
             f"entailed {cl['entailed']}, neutral {cl['neutral']}, contradicted {cl['contradicted']})")
    L.append(f"  contradictions surfaced: {flow['contradictions']['rows_after_rebuild']}")
    sg = flow["signals_scored"]
    L.append(f"  signals scored: {sg['total']} (active {sg['active']}, off_scope {sg['off_scope']}, "
             f"off_topic {sg['off_topic']})")
    return "\n".join(L)
