#!/usr/bin/env python3
"""
rescore-claim-entailment.py
===========================

Re-scores entailment for claims whose label was cleared, against Supabase.

WHY A NEW SCRIPT
----------------
The original entailment stage lives at whel-mvp/pipeline/verify_provenance.py,
but that pipeline reads and writes a LOCAL SQLite file (whel-mvp/data/whel.db)
via `conn.execute(... ?)`. Running it now would score an old local copy and
leave the live Supabase corpus untouched. This script keeps the same system
prompt, the same three labels, and the same output contract, but reads and
writes the production claims table.

WHAT IT SCORES
--------------
Exactly the claims the original stage would pick up:

    provenance_verified = true AND entailment_label IS NULL

After migration 046 that is the 77 repaired claims plus any that were never
scored. Nothing already labelled is touched, so this cannot silently rewrite
existing verdicts.

A located quote proves the text EXISTS in the source. It does not prove the
quote SUPPORTS the claim. That second question is what this checks.

SAFETY
------
Writes entailment_label and entailment_score only, one claim at a time, and
prints the before/after distribution. Nothing else is modified. Run with
--dry-run first to see the labels without writing.

USAGE
-----
    python3 scripts/rescore-claim-entailment.py --dry-run --limit 10
    python3 scripts/rescore-claim-entailment.py
"""

from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
DOTENV_PATH = REPO / ".env.local"
RUN_LOG_PATH = REPO / "scripts" / "audit-output" / "entailment-rescore.json"

DEFAULT_MODEL = "claude-sonnet-5"
MAX_ATTEMPTS = 4
PROMPT_VERSION = "verify_provenance/v1-supabase"

# Kept verbatim from whel-mvp/pipeline/verify_provenance.py so labels stay
# comparable with the scores already in the table.
SYSTEM = """You are a natural-language-inference (NLI) verifier for biomedical claims.
Given a PREMISE (a verbatim quote from a paper) and a HYPOTHESIS (a claim), decide whether the
premise supports the hypothesis. Judge ONLY against the premise text, not your own knowledge.

Labels:
- "entailed": the premise clearly supports the hypothesis.
- "neutral": the premise neither clearly supports nor contradicts it (the claim overreaches).
- "contradicted": the premise asserts the opposite.

Return ONLY JSON: {"label": "entailed"|"neutral"|"contradicted", "score": 0.0-1.0, "reason": str}
score = your confidence in the label."""

VALID = {"entailed", "neutral", "contradicted"}


def load_dotenv() -> None:
    if not DOTENV_PATH.exists():
        return
    for line in DOTENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def sb_request(method: str, url: str, headers: dict, payload=None):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=60) as resp:
        body = resp.read()
        return json.loads(body) if body else None


def call_nli(api_key: str, model: str, premise: str, hypothesis: str):
    user = f'PREMISE:\n"""{premise}"""\n\nHYPOTHESIS:\n"""{hypothesis}"""'
    body = json.dumps({
        "model": model,
        "max_tokens": 400,
        "system": SYSTEM,
        "messages": [{"role": "user", "content": user}],
    }).encode("utf-8")
    req = urllib.request.Request(
        "https://api.anthropic.com/v1/messages",
        data=body,
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
    )
    last_err = None
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = json.loads(resp.read())
            content = data.get("content") or []
            text = next((c.get("text") for c in content if c.get("type") == "text"), "")
            text = text.strip()
            if text.startswith("```"):
                text = text.split("```")[1].lstrip("json").strip()
            parsed = json.loads(text)
            label = str(parsed.get("label", "")).lower().strip()
            if label not in VALID:
                return None, f"invalid label: {label!r}"
            score = parsed.get("score")
            score = float(score) if isinstance(score, (int, float)) else None
            return {"label": label, "score": score, "reason": parsed.get("reason", "")}, None
        except urllib.error.HTTPError as e:
            detail = ""
            try:
                detail = e.read().decode("utf-8", errors="replace")[:200]
            except Exception:
                pass
            last_err = f"HTTP {e.code}: {detail}"
            if e.code != 429 and e.code < 500:
                return None, last_err
        except (socket.timeout, TimeoutError) as e:
            last_err = f"read timeout: {e}"
        except (urllib.error.URLError, OSError) as e:
            last_err = f"connection error: {e}"
        except json.JSONDecodeError as e:
            return None, f"unparseable JSON response: {e}"
        if attempt < MAX_ATTEMPTS:
            time.sleep(2 ** attempt)
    return None, last_err or "request failed"


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("--dry-run", action="store_true", help="Score but do not write to the database.")
    args = p.parse_args()

    load_dotenv()
    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not (base and key and api_key):
        print("Missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / ANTHROPIC_API_KEY", file=sys.stderr)
        return 1
    headers = {
        "apikey": key, "Authorization": f"Bearer {key}",
        "Accept": "application/json", "Content-Type": "application/json",
    }

    print("distribution BEFORE:")
    allrows = sb_request("GET", f"{base}/rest/v1/claims?select=entailment_label", headers)
    before = {}
    for r in allrows:
        k = r["entailment_label"] or "(unscored)"
        before[k] = before.get(k, 0) + 1
    for k in sorted(before):
        print(f"  {k:<14} {before[k]}")

    rows = sb_request(
        "GET",
        f"{base}/rest/v1/claims?select=id,text,exact_quote"
        f"&provenance_verified=is.true&entailment_label=is.null",
        headers,
    )
    rows = [r for r in rows if (r.get("exact_quote") or "").strip() and (r.get("text") or "").strip()]
    targets = rows[: args.limit] if args.limit else rows
    print(f"\nre-scoring {len(targets)} claim(s) using {args.model}"
          f"{' (DRY RUN, no writes)' if args.dry_run else ''}…")

    results, failures = [], []
    for i, c in enumerate(targets, start=1):
        if i % 10 == 1:
            print(f"  · {i} / {len(targets)} …", flush=True)
        verdict, err = call_nli(api_key, args.model, c["exact_quote"], c["text"])
        if err:
            failures.append({"id": c["id"], "error": err})
            continue
        results.append({"id": c["id"], **verdict})
        if not args.dry_run:
            sb_request(
                "PATCH", f"{base}/rest/v1/claims?id=eq.{c['id']}", headers,
                {"entailment_label": verdict["label"], "entailment_score": verdict["score"]},
            )

    counts = {}
    for r in results:
        counts[r["label"]] = counts.get(r["label"], 0) + 1

    RUN_LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    RUN_LOG_PATH.write_text(json.dumps({
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": args.model,
        "prompt_version": PROMPT_VERSION,
        "dry_run": args.dry_run,
        "summary": {"scored": len(results), "failed": len(failures), "by_label": counts},
        "results": results,
        "failures": failures,
    }, indent=2) + "\n")

    print()
    print("=" * 60)
    print("Whel · entailment re-score")
    print("=" * 60)
    print(f"scored: {len(results)}   failed: {len(failures)}")
    for k in sorted(counts):
        print(f"  {k:<14} {counts[k]}")
    if failures:
        print(f"\n  first failure: {failures[0]['error'][:120]}")
    print(f"\nwrote {RUN_LOG_PATH.relative_to(REPO)}")
    if args.dry_run:
        print("\nDRY RUN — nothing was written. Re-run without --dry-run to apply.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
