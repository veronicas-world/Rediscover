#!/usr/bin/env python3
"""
repair-claim-spans.py
=====================

Widens under-quoted claim spans so each verbatim quote actually carries the
claim it is attached to.

WHY
---
The entailment audit over claims behind active signals found 78 claims labelled
`neutral` (roughly 28% of the 283 scored, LLM-extracted claims). Inspection
showed these are not fabrications: the claim is plausible given the paper, but
the stored `exact_quote` is cropped too tightly to establish it. Typical case:

    claim  : "MHT was beneficial for vertebral fracture"
    quote  : "sexual function, vertebral and nonvertebral fracture"

The quote names the outcome but contains none of the direction the claim
asserts, so the entailment check correctly declines to call it entailed.

WHAT THIS DOES
--------------
For every `neutral` claim behind an active signal whose document has
`raw_text`, ask Claude for the MINIMAL VERBATIM SPAN (one or two complete
sentences) from that document which supports the claim, then:

  1. verify the returned span occurs character-for-character in raw_text
     (a model that invents text fails this check and is discarded),
  2. recompute quote_start_char / quote_end_char from the real match,
  3. emit a reviewable SQL migration.

Naive sentence-splitting was tried first and rejected: biomedical abstracts are
full of decimals, confidence intervals and abbreviations, so splitting on "."
produces fragments like "002), and more significant improvement in FMD".

A `NOT_SUPPORTED` response is a genuine finding, not a failure: it means the
document does not support the claim attached to it. Those are reported and
left untouched for human review rather than silently rewritten.

This also repairs stale offsets: ~15% of sampled claims had
raw_text[start:end] != exact_quote before this run.

SAFETY
------
Local-only. Writes nothing to Supabase. Produces:
  scripts/audit-output/claim-span-repairs.json   (full run log)
  supabase/migrations/046_repair_claim_spans.sql (reviewable migration)

Nothing changes in the database until you read the migration and run it
yourself.

USAGE
-----
    export ANTHROPIC_API_KEY=...            # or put it in .env.local
    python3 scripts/repair-claim-spans.py --limit 10     # smoke test
    python3 scripts/repair-claim-spans.py                # full run
    python3 scripts/repair-claim-spans.py --resume       # after an interruption
"""

from __future__ import annotations

import argparse
import json
import os
import re
import socket
import sys
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DOTENV_PATH = REPO / ".env.local"
RUN_LOG_PATH = REPO / "scripts" / "audit-output" / "claim-span-repairs.json"
MIGRATION_PATH = REPO / "supabase" / "migrations" / "046_repair_claim_spans.sql"

DEFAULT_MODEL = "claude-sonnet-5"
MAX_ATTEMPTS = 4
USER_AGENT = "whel-span-repair/1.0 (research tooling; contact vla2117@columbia.edu)"

SYSTEM_PROMPT = """You locate supporting evidence in scientific source text.

You are given a CLAIM and the SOURCE TEXT it was extracted from. Return the
minimal verbatim span from SOURCE TEXT that supports the claim.

Rules, all mandatory:
- Copy the span EXACTLY as it appears in SOURCE TEXT, character for character.
  Do not fix typos, expand abbreviations, change punctuation, or re-wrap.
- Return one or two COMPLETE sentences. The span must contain the direction of
  the effect the claim asserts (improved / reduced / no difference / harmful),
  not merely the outcome name or a bare statistic.
- Prefer the shortest span that fully supports the claim.
- If SOURCE TEXT does not actually support the claim, return exactly:
  NOT_SUPPORTED
- Return ONLY the span (or NOT_SUPPORTED). No preamble, quotes, or commentary.
"""

USER_TEMPLATE = """CLAIM:
{claim}

SOURCE TEXT:
{raw_text}
"""


@dataclass
class Repair:
    claim_id: str
    document_id: str
    source: str
    external_id: str
    status: str  # repaired | not_supported | span_not_found | api_failed | skipped
    old_quote: str = ""
    new_quote: str = ""
    old_start: int | None = None
    old_end: int | None = None
    new_start: int | None = None
    new_end: int | None = None
    old_offsets_valid: bool | None = None
    entailment_score: float | None = None
    error: str | None = None


# ── env ──────────────────────────────────────────────────────────────────────

def load_dotenv() -> None:
    if not DOTENV_PATH.exists():
        return
    for line in DOTENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def sb_get(base: str, headers: dict, path: str, params: str) -> list:
    url = f"{base}/rest/v1/{path}?{params}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read())


# ── Anthropic ────────────────────────────────────────────────────────────────

def call_claude(api_key: str, model: str, claim: str, raw_text: str) -> tuple[str | None, str | None]:
    body = json.dumps({
        "model": model,
        "max_tokens": 600,
        "system": SYSTEM_PROMPT,
        "messages": [{"role": "user", "content": USER_TEMPLATE.format(
            claim=claim, raw_text=raw_text[:12000])}],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "user-agent": USER_AGENT,
        },
    )
    last_err = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read())
            content = data.get("content") or []
            text = next((c.get("text") for c in content if c.get("type") == "text"), None)
            if not text:
                return None, "no text content in response"
            return text.strip(), None
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = e.read().decode("utf-8", errors="replace")[:300]
            except Exception:
                pass
            last_err = f"HTTP {e.code}: {detail}"
            if e.code != 429 and e.code < 500:
                return None, last_err
        except (socket.timeout, TimeoutError) as e:
            last_err = f"read timeout: {e}"
        except urllib.error.URLError as e:
            last_err = f"url error: {e}"
        except OSError as e:
            last_err = f"connection error: {e}"
        if attempt < MAX_ATTEMPTS:
            backoff = 2 ** attempt
            print(f"      retry {attempt}/{MAX_ATTEMPTS - 1} after {backoff}s ({last_err})", flush=True)
            time.sleep(backoff)
    return None, last_err or "request failed"


# ── span matching ────────────────────────────────────────────────────────────

def locate(span: str, raw: str) -> tuple[int, int] | None:
    """Find `span` in `raw`. Exact match first; then a whitespace-tolerant
    match, since source text often contains newlines where the model returns
    single spaces. Returns (start, end) into the ORIGINAL raw text, or None."""
    i = raw.find(span)
    if i >= 0:
        return i, i + len(span)

    # Whitespace-insensitive search: build a regex from the span where any run
    # of whitespace matches any run of whitespace in the source.
    pattern = r"\s+".join(re.escape(tok) for tok in span.split())
    m = re.search(pattern, raw)
    if m:
        return m.start(), m.end()
    return None


def sql_escape(s: str) -> str:
    return s.replace("'", "''")


def comment_safe(s: str, limit: int) -> str:
    """Flatten text for embedding in a `--` SQL comment.

    Source quotes routinely contain newlines (abstracts are stored wrapped).
    A raw newline inside a `--` comment ends the comment, so the remainder of
    the quote is then parsed as SQL and the migration fails. Collapse all
    whitespace to single spaces before truncating.
    """
    return " ".join(str(s).split())[:limit]


def write_migration(repairs: list[Repair]) -> None:
    applied = [r for r in repairs if r.status == "repaired"]
    MIGRATION_PATH.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "-- 046_repair_claim_spans.sql",
        "--",
        "-- Widens under-quoted claim spans so each verbatim quote carries the claim",
        "-- it supports. Generated by scripts/repair-claim-spans.py; full run log in",
        "-- scripts/audit-output/claim-span-repairs.json.",
        "--",
        "-- Every new span below was verified to occur character-for-character in the",
        "-- source document's raw_text, and the offsets were recomputed from that match.",
        "-- Claims the model reported as NOT_SUPPORTED are deliberately NOT rewritten;",
        "-- they are listed at the foot of this file for human review.",
        "--",
        f"-- Generated: {datetime.now(timezone.utc).isoformat(timespec='seconds')}",
        f"-- Claims repaired: {len(applied)}",
        "",
        "BEGIN;",
        "",
    ]
    for r in applied:
        lines += [
            f"-- claim {r.claim_id}  [{r.source} {r.external_id}]  entailment was {r.entailment_score}",
            f"--   old ({len(r.old_quote)} chars): {comment_safe(r.old_quote, 120)}",
            f"--   new ({len(r.new_quote)} chars): {comment_safe(r.new_quote, 120)}",
            "UPDATE claims SET",
            f"  exact_quote = '{sql_escape(r.new_quote)}',",
            f"  quote_start_char = {r.new_start},",
            f"  quote_end_char = {r.new_end},",
            "  entailment_label = NULL,",
            "  entailment_score = NULL",
            f"WHERE id = '{r.claim_id}';",
            "",
        ]
    lines += [
        "COMMIT;",
        "",
        "-- Entailment label/score are cleared above so the next entailment pass",
        "-- re-scores these claims against their widened spans rather than carrying",
        "-- forward a verdict computed on the old, narrower quote.",
        "",
        "-- Verify:",
        "--   SELECT count(*) FILTER (WHERE entailment_label IS NULL) AS awaiting_rescore,",
        "--          count(*) AS total",
        "--   FROM claims;",
        "",
    ]
    unsupported = [r for r in repairs if r.status == "not_supported"]
    if unsupported:
        lines.append("-- NOT_SUPPORTED — the source document does not support these claims.")
        lines.append("-- Left unchanged; review individually.")
        for r in unsupported:
            lines.append(f"--   {r.claim_id}  [{r.source} {r.external_id}]  quote: {comment_safe(r.old_quote, 90)}")
        lines.append("")
    MIGRATION_PATH.write_text("\n".join(lines))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Anthropic model id. Default: {DEFAULT_MODEL}")
    parser.add_argument("--limit", type=int, default=None, help="Process at most N claims (smoke test).")
    parser.add_argument("--resume", action="store_true", help="Reuse results from the previous run log.")
    parser.add_argument("--label", default="neutral",
                        help="Entailment label to repair. Default: neutral.")
    args = parser.parse_args()

    load_dotenv()
    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not base or not key:
        print("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY.", file=sys.stderr)
        return 1
    if not api_key:
        print("Missing ANTHROPIC_API_KEY.", file=sys.stderr)
        return 1
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}

    print("loading active signals…")
    signals = sb_get(base, headers, "substrate_signals", "select=claim_ids&status=eq.active")
    referenced: set[str] = set()
    for s in signals:
        for cid in (s.get("claim_ids") or []):
            referenced.add(str(cid))
    print(f"  {len(referenced)} claim ids referenced by active signals")

    print(f"loading claims labelled '{args.label}'…")
    claims = sb_get(
        base, headers, "claims",
        "select=id,text,exact_quote,quote_start_char,quote_end_char,"
        f"entailment_label,entailment_score,document_id&entailment_label=eq.{args.label}",
    )
    claims = [c for c in claims if str(c["id"]) in referenced]
    print(f"  {len(claims)} '{args.label}' claims behind active signals")

    doc_ids = sorted({c["document_id"] for c in claims if c.get("document_id")})
    docs: dict[str, dict] = {}
    for i in range(0, len(doc_ids), 40):
        chunk = doc_ids[i:i + 40]
        in_list = ",".join(f'"{d}"' for d in chunk)
        rows = sb_get(base, headers, "documents",
                      f"select=id,source,external_id,raw_text&id=in.({in_list})")
        for d in rows:
            docs[d["id"]] = d
    print(f"  {len(docs)} source documents loaded")

    done: dict[str, Repair] = {}
    if args.resume and RUN_LOG_PATH.exists():
        try:
            prior = json.loads(RUN_LOG_PATH.read_text())
            for rec in prior.get("results", []):
                if rec.get("status") in {"repaired", "not_supported", "span_not_found"}:
                    done[str(rec["claim_id"])] = Repair(**rec)
            if done:
                print(f"  resuming: {len(done)} claim(s) already processed")
        except Exception as e:
            print(f"  (could not read prior log, starting fresh: {e})")

    targets = claims[: args.limit] if args.limit else claims
    print(f"repairing spans for {len(targets)} claim(s) using {args.model}…")

    repairs: list[Repair] = []

    def checkpoint() -> None:
        RUN_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        RUN_LOG_PATH.write_text(json.dumps({
            "schema_version": "1.0",
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "model": args.model,
            "status": "in_progress",
            "results": [asdict(r) for r in repairs],
        }, indent=2) + "\n")

    for i, c in enumerate(targets, start=1):
        if i % 10 == 1:
            print(f"  · {i} / {len(targets)} …", flush=True)
        cid = str(c["id"])
        if cid in done:
            repairs.append(done[cid])
            continue

        doc = docs.get(c.get("document_id"))
        old_quote = (c.get("exact_quote") or "").strip()
        if not doc or not (doc.get("raw_text") or "").strip():
            repairs.append(Repair(
                claim_id=cid, document_id=str(c.get("document_id") or ""),
                source=(doc or {}).get("source", "?"), external_id=(doc or {}).get("external_id", ""),
                status="skipped", old_quote=old_quote,
                error="document has no raw_text"))
            continue

        raw = doc["raw_text"]
        # Was the existing offset pair even valid?
        old_valid = None
        if isinstance(c.get("quote_start_char"), int) and isinstance(c.get("quote_end_char"), int):
            old_valid = raw[c["quote_start_char"]:c["quote_end_char"]].strip() == old_quote

        span, err = call_claude(api_key, args.model, c.get("text") or "", raw)
        if err:
            repairs.append(Repair(
                claim_id=cid, document_id=doc["id"], source=doc.get("source", "?"),
                external_id=doc.get("external_id", ""), status="api_failed",
                old_quote=old_quote, old_offsets_valid=old_valid, error=err))
            continue

        if span.strip() == "NOT_SUPPORTED":
            repairs.append(Repair(
                claim_id=cid, document_id=doc["id"], source=doc.get("source", "?"),
                external_id=doc.get("external_id", ""), status="not_supported",
                old_quote=old_quote, old_offsets_valid=old_valid,
                entailment_score=c.get("entailment_score")))
            continue

        span = span.strip().strip('"').strip()
        pos = locate(span, raw)
        if pos is None:
            # The model returned text that is not verbatim in the source. Reject.
            repairs.append(Repair(
                claim_id=cid, document_id=doc["id"], source=doc.get("source", "?"),
                external_id=doc.get("external_id", ""), status="span_not_found",
                old_quote=old_quote, new_quote=span[:400], old_offsets_valid=old_valid,
                entailment_score=c.get("entailment_score"),
                error="returned span not found verbatim in raw_text"))
            continue

        start, end = pos
        repairs.append(Repair(
            claim_id=cid, document_id=doc["id"], source=doc.get("source", "?"),
            external_id=doc.get("external_id", ""), status="repaired",
            old_quote=old_quote, new_quote=raw[start:end],
            old_start=c.get("quote_start_char"), old_end=c.get("quote_end_char"),
            new_start=start, new_end=end, old_offsets_valid=old_valid,
            entailment_score=c.get("entailment_score")))

        if i % 20 == 0:
            checkpoint()

    counts: dict[str, int] = {}
    for r in repairs:
        counts[r.status] = counts.get(r.status, 0) + 1

    RUN_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    RUN_LOG_PATH.write_text(json.dumps({
        "schema_version": "1.0",
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": args.model,
        "summary": {"total": len(repairs), "by_status": counts},
        "results": [asdict(r) for r in repairs],
    }, indent=2) + "\n")
    write_migration(repairs)

    widened = [r for r in repairs if r.status == "repaired"]
    grew = [r for r in widened if len(r.new_quote) > len(r.old_quote)]
    stale = [r for r in repairs if r.old_offsets_valid is False]

    print()
    print("=" * 64)
    print("Whel · claim span repair summary")
    print("=" * 64)
    print(f"Model: {args.model}")
    print(f"Total claims processed: {len(repairs)}")
    print()
    for k in sorted(counts):
        print(f"  {k:<20} {counts[k]}")
    if widened:
        avg_old = sum(len(r.old_quote) for r in widened) / len(widened)
        avg_new = sum(len(r.new_quote) for r in widened) / len(widened)
        print()
        print(f"  mean quote length: {avg_old:.0f} -> {avg_new:.0f} chars ({len(grew)} widened)")
    if stale:
        print(f"  stale offsets repaired: {len(stale)}")
    print()
    print(f"wrote {RUN_LOG_PATH.relative_to(REPO)}")
    print(f"wrote {MIGRATION_PATH.relative_to(REPO)}")
    print()
    print("Next steps:")
    print("  1. Read the migration; spot-check a few old -> new spans in the comments")
    print("  2. Review any NOT_SUPPORTED claims listed at the foot of the file")
    print("  3. Apply it in Supabase Studio -> SQL Editor")
    print("  4. Re-run the entailment pass so the widened spans get re-scored")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
