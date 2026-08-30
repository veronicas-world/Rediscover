#!/usr/bin/env python3
"""
ablate-declared-context.py
==========================

Measures whether the judge actually obeys the limit placed on CONTEXT.

THE PROBLEM THIS EXISTS TO SOLVE
--------------------------------
The entailment judge is handed a CONTEXT block containing the source paper's
title and the condition the claim is filed under, with an instruction that it
may use this for exactly one purpose: settling which patient population the
quoted passage concerns. It must not take the intervention, the comparator, the
outcome, or the direction of effect from anywhere but the quote itself.

That instruction cannot be verified from the output. A label of "entailed" looks
identical whether the judge read the direction out of the quote or out of the
title. And the title very often contains the answer:

    "Efficacy of dienogest vs combined oral contraceptive on pain associated
     with endometriosis: Randomized clinical trial."

names the intervention, the comparator and the outcome. Research on instruction
hierarchies finds that models do not reliably respect scoping constraints of
this kind, so an unverified instruction is an assumption, not a control.

WHAT IT DOES
------------
Scores the same claims three ways and compares:

    A  none      no CONTEXT block at all (the pre-v2 behaviour)
    B  declared  the CONTEXT block as currently shipped
    C  masked    the same block with the intervention name and every
                 direction-of-effect word redacted from the title, leaving the
                 condition and the population intact

B is what production does. C gives the judge exactly the scoping information it
is entitled to and nothing else. So:

    B == C   the instruction is holding. Context is doing only its stated job.
    B >  C   the judge is reading findings out of the title. The instruction is
             leaking, and the leak is measured rather than assumed.
    A <  C   supplying the condition genuinely helps, which is the reason the
             CONTEXT block exists.

The interesting quantity is the B-minus-C gap. Report it whatever it turns out
to be; a gap of zero is a real result and so is a large one.

SAFETY
------
Reads from Supabase and writes one local JSON file. Nothing in the database is
modified, and no entailment label is overwritten.

USAGE
-----
    python3 scripts/ablate-declared-context.py --limit 20     # smoke test
    python3 scripts/ablate-declared-context.py                # full run
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _span_checks import DIRECTION_WORDS  # noqa: E402

REPO = Path(__file__).resolve().parent.parent
DOTENV_PATH = REPO / ".env.local"
OUT_PATH = REPO / "scripts" / "audit-output" / "context-ablation.json"

DEFAULT_MODEL = "claude-sonnet-5"
REDACTION = "███"


def load_dotenv() -> None:
    if not DOTENV_PATH.exists():
        return
    for line in DOTENV_PATH.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def sb_get(base: str, headers: dict, path: str, params: str):
    req = urllib.request.Request(f"{base}/rest/v1/{path}?{params}", headers=headers)
    with urllib.request.urlopen(req, timeout=90) as resp:
        return json.loads(resp.read())


def mask_title(title: str, intervention: str) -> str:
    """Redact the intervention and any direction-of-effect word from a title.

    Deliberately aggressive. If a word might carry the finding, it goes. An
    over-redacted title understates the leak, which is the safe direction to err
    in for a test whose purpose is to catch the judge using information it
    should not have.
    """
    out = title
    for w in re.findall(r"[A-Za-z]{4,}", intervention or ""):
        out = re.sub(rf"\b{re.escape(w[:6])}\w*", REDACTION, out, flags=re.I)
    parts = [p for p in re.split(r"[\s\-+]+", (intervention or "").strip()) if p]
    acronym = "".join(p[0] for p in parts)
    if len(acronym) >= 2:
        out = re.sub(rf"\b{re.escape(acronym)}s?\b", REDACTION, out, flags=re.I)
    return DIRECTION_WORDS.sub(REDACTION, out)


def build_block(doc: dict, condition: str, title: str | None) -> str:
    src = f"{doc.get('source', '?')} {doc.get('external_id', '')}".strip()
    lines = [f"Source: {src}", f"Title: {title}"]
    sub = re.search(r"/r/([A-Za-z0-9_]+)", str(doc.get("url") or ""))
    if sub:
        lines.append(f"Posted in: r/{sub.group(1)}")
    lines.append(f"Condition on record for this claim: {condition}")
    return "\n".join(lines)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--limit", type=int, default=None)
    p.add_argument("--workers", type=int, default=12)
    args = p.parse_args()

    load_dotenv()
    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not (base and key and api_key):
        print("Missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / ANTHROPIC_API_KEY", file=sys.stderr)
        return 1
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}

    import importlib.util
    spec = importlib.util.spec_from_file_location("rs", REPO / "scripts" / "rescore-claim-entailment.py")
    rs = importlib.util.module_from_spec(spec)
    sys.modules["rs"] = rs
    spec.loader.exec_module(rs)

    sigs = sb_get(base, headers, "substrate_signals", "select=claim_ids&status=eq.active")
    ref = {str(c) for s in sigs for c in (s.get("claim_ids") or [])}
    rows = [r for r in sb_get(base, headers, "claims",
                              "select=id,text,exact_quote,entailment_label,condition_id,"
                              "intervention_id,documents(title,source,external_id,url)"
                              "&model_name=eq.claude-sonnet-4-6&provenance_verified=is.true")
            if str(r["id"]) in ref and (r.get("exact_quote") or "").strip()]
    conds = {c["id"]: c["label"] for c in sb_get(base, headers, "entities", "select=id,label&type=eq.condition")}
    ivs = {c["id"]: c["label"] for c in sb_get(base, headers, "entities", "select=id,label&type=eq.intervention")}

    targets = rows[: args.limit] if args.limit else rows
    print(f"ablating CONTEXT over {len(targets)} claims, three conditions each "
          f"({3 * len(targets)} calls)…")

    def run(c):
        doc = c.get("documents") or {}
        if isinstance(doc, list):
            doc = doc[0] if doc else {}
        title = " ".join(str(doc.get("title") or "").split())
        cond = conds.get(c.get("condition_id")) or "(not recorded)"
        iv = ivs.get(c.get("intervention_id"), "")
        blocks = {
            "none": "",
            "declared": build_block(doc, cond, title),
            "masked": build_block(doc, cond, mask_title(title, iv)),
        }
        out = {"id": c["id"], "claim": " ".join(str(c["text"]).split()),
               "stored": c.get("entailment_label"), "intervention": iv,
               "masked_title": mask_title(title, iv)}
        for name, blk in blocks.items():
            v, err = rs.call_nli(api_key, args.model, blk or "(none provided)",
                                 c["exact_quote"], c["text"])
            out[name] = (v or {}).get("label") if not err else None
        return out

    results = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for i, r in enumerate(pool.map(run, targets), start=1):
            results.append(r)
            if i % 25 == 1 or i == len(targets):
                print(f"  · {i} / {len(targets)} …", flush=True)

    ok = [r for r in results if all(r.get(k) for k in ("none", "declared", "masked"))]
    def rate(k):
        return 100 * sum(1 for r in ok if r[k] == "entailed") / len(ok) if ok else 0.0
    leak = [r for r in ok if r["declared"] == "entailed" and r["masked"] != "entailed"]
    helped = [r for r in ok if r["masked"] == "entailed" and r["none"] != "entailed"]

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps({
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": args.model,
        "n": len(ok),
        "entailed_rate": {k: round(rate(k), 1) for k in ("none", "declared", "masked")},
        "leak_count": len(leak),
        "context_helped_count": len(helped),
        "results": results,
    }, indent=2) + "\n")

    print()
    print("=" * 64)
    print("Whel · declared-context ablation")
    print("=" * 64)
    print(f"scored under all three conditions: {len(ok)} of {len(results)}\n")
    print(f"  A  no context at all      entailed {rate('none'):.1f}%")
    print(f"  C  masked title           entailed {rate('masked'):.1f}%   <- the entitled amount")
    print(f"  B  declared (production)  entailed {rate('declared'):.1f}%")
    print()
    print(f"  B minus C = {rate('declared') - rate('masked'):+.1f} points  ({len(leak)} claims)")
    print("    Claims called entailed WITH the full title that are not entailed once the")
    print("    intervention and direction words are removed from it. These are cases where")
    print("    the judge took the finding from the title rather than the quote.")
    print()
    print(f"  C minus A = {rate('masked') - rate('none'):+.1f} points  ({len(helped)} claims)")
    print("    The legitimate benefit: claims the condition context genuinely resolves.")
    if leak:
        print("\n  leaking claims:")
        for r in leak[:8]:
            print(f"    {r['claim'][:58]}")
            print(f"      masked title: {r['masked_title'][:76]}")
        if len(leak) > 8:
            print(f"    ... and {len(leak) - 8} more")
    print(f"\nwrote {OUT_PATH.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
