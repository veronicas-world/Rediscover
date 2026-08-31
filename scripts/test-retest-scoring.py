#!/usr/bin/env python3
"""
test-retest-scoring.py
=====================

Measures the stability of the scoring layer across repeated runs.

THE PROBLEM THIS EXISTS TO SOLVE
--------------------------------
The five 0-2 dimension scores that determine every tier on the site are produced
by a single LLM call per (intervention, condition, aspect, arm) group. The
entailment judge's self-consistency is measured at 99.1% unanimous across three
votes. The scoring layer has never been measured the same way.

An independent feasibility study of Elicit (Research Synthesis Methods) found
that supporting quotes matched on 200 of 448 extractions across accounts,
dropping to 51 of 463 after a vendor model change, with reasoning narratives
matching in zero cases. A reviewer will ask for test-retest across runs, across
seeds, and across model versions. This script provides the first two.

WHAT IT DOES
------------
Fetches a sample of active signals from Supabase, reconstructs the scoring
prompt for each (same SYSTEM prompt, same claims, same arm rubric), calls the
model N times per signal (default 3), applies the same deterministic rules
(female_band, apply_imprecision, tier_for, corroboration_ceiling), and reports:

  - Per-dimension agreement rate across runs (each of the 5 scores)
  - Tier agreement rate across runs (the thing the site displays)
  - Synthesis summary agreement (exact match and token-overlap)
  - Facts agreement rate (sample size, % female, etc.)
  - The specific signals where runs disagree

A signal is "stable" if all N runs produce the same tier. A signal is "dimension-
stable" if all N runs produce the same 5 scores. Tier can be stable even when
individual dimensions flip, if the flips cancel in the sum.

SAFETY
------
Reads from Supabase and writes one local JSON file. Nothing in the database is
modified. No production score is overwritten.

USAGE
-----
    python3 scripts/test-retest-scoring.py --limit 10    # smoke test
    python3 scripts/test-retest-scoring.py               # full run (50 signals)
    python3 scripts/test-retest-scoring.py --runs 5      # 5 runs per signal
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

REPO = Path(__file__).resolve().parent.parent
DOTENV_PATH = REPO / ".env.local"
OUT_PATH = REPO / "scripts" / "audit-output" / "scoring-test-retest.json"

# Import the deterministic rules and prompt from score_claims.py.
# These are pure functions; the module's top-level imports (db, llm, config)
# have no import-time side effects.
sys.path.insert(0, str(REPO / "scripts" / "substrate"))
from score_claims import (
    ARM_RUBRIC, SYSTEM, arm_for_source, female_band, apply_imprecision,
    tier_for, corroboration_ceiling,
)
from llm import complete_json, usage_snapshot

DEFAULT_MODEL = "claude-sonnet-4-6"
DEFAULT_RUNS = 3
DEFAULT_SAMPLE = 50


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


def build_user_prompt(iv_label: str, cd_label: str, aspect: str, arm: str,
                      claims: list[dict]) -> str:
    """Replicates score_claims._user_prompt but works from Supabase data."""
    lines = [f"Intervention: {iv_label}", f"Condition: {cd_label}",
             f"Aspect: {aspect}", f"Evidence arm: {arm}", "", "Verified claims:"]
    for i, c in enumerate(claims, 1):
        src = c.get("doc_title") or c.get("doc_external_id") or "source"
        lines.append(f'{i}. [{c.get("direction", "")}] {c.get("text", "")}')
        lines.append(f'   quote: "{c.get("exact_quote", "")}"  (source: {src})')
    return "\n".join(lines)


def score_one_signal(api_key: str, model: str, system: str, user: str) -> dict | None:
    """Call the scoring model once and return the parsed response."""
    try:
        res = complete_json(system, user, max_tokens=1500, model=model, temperature=0.0)
        return res
    except Exception as e:
        return {"_error": str(e)}


def apply_deterministic(res: dict, arm: str, claims: list[dict]) -> dict:
    """Apply the same deterministic rules as score_claims.py.run()."""
    if res is None or "_error" in res:
        return {"error": res.get("_error") if res else "no response"}

    try:
        dims = {d: max(0, min(2, int(res[d]["score"]))) for d in
                ("corroboration", "rigor", "specificity", "plausibility", "consistency")}
    except (KeyError, TypeError, ValueError) as e:
        return {"error": f"malformed scores: {e}"}

    facts = res.get("facts") or {}

    # Corroboration ceiling for direct/pathway arms
    if arm in ("direct", "pathway"):
        ceiling = corroboration_ceiling(claims)
        if dims["corroboration"] > ceiling:
            dims["corroboration"] = ceiling

    # Imprecision caps
    dims, precision_note, needs_ft = apply_imprecision(dims, facts, arm)

    # Female applicability
    band, mult, fa_rationale = female_band(facts)

    strength = sum(dims.values())
    score = round(min(10.0, strength * mult), 1)
    tier = tier_for(score)

    return {
        "dims": dims,
        "facts": facts,
        "tier": tier,
        "score": score,
        "strength": strength,
        "multiplier": mult,
        "band": band,
        "synthesis": (res.get("synthesis_summary") or "").strip(),
        "mechanism": (res.get("mechanism_hypothesis") or "").strip(),
        "on_topic": res.get("on_topic", True),
    }


def token_overlap(a: str, b: str) -> float:
    """Jaccard overlap of word tokens between two strings."""
    ta = set(re.findall(r"[a-z0-9]+", a.lower()))
    tb = set(re.findall(r"[a-z0-9]+", b.lower()))
    if not ta and not tb:
        return 1.0
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--runs", type=int, default=DEFAULT_RUNS, help="Number of runs per signal (default 3)")
    p.add_argument("--limit", type=int, default=DEFAULT_SAMPLE, help="Sample size (default 50)")
    p.add_argument("--workers", type=int, default=8)
    args = p.parse_args()

    load_dotenv()
    base = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip("/")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not (base and key and api_key):
        print("Missing NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / ANTHROPIC_API_KEY", file=sys.stderr)
        return 1
    headers = {"apikey": key, "Authorization": f"Bearer {key}", "Accept": "application/json"}

    # Fetch active signals (sample)
    sigs = sb_get(base, headers, "substrate_signals",
                  "select=id,intervention_id,condition_id,aspect,arm,claim_ids,"
                  "confidence_tier,arm_score&status=eq.active&order=arm_score.desc")
    if args.limit and len(sigs) > args.limit:
        import random
        rng = random.Random(20260831)
        sigs = rng.sample(sigs, args.limit)

    print(f"Test-retest over {len(sigs)} signals, {args.runs} runs each "
          f"({len(sigs) * args.runs} calls)...")

    # Fetch entity labels
    ents = sb_get(base, headers, "entities", "select=id,label")
    label = {e["id"]: e["label"] for e in ents}

    # Fetch all claims (with document join for source/title)
    all_claims = sb_get(base, headers, "claims",
                        "select=id,text,exact_quote,direction,document_id,"
                        "documents(source,external_id,title)")
    claim_map = {}
    for c in all_claims:
        doc = c.get("documents")
        if isinstance(doc, list):
            doc = doc[0] if doc else {}
        claim_map[str(c["id"])] = {
            "text": c.get("text", ""),
            "exact_quote": c.get("exact_quote", ""),
            "direction": c.get("direction", ""),
            "document_id": c.get("document_id", ""),
            "doc_source": (doc or {}).get("source", ""),
            "doc_title": (doc or {}).get("title", ""),
            "doc_external_id": (doc or {}).get("external_id", ""),
        }

    # For each signal: construct prompt, call model N times, apply rules, compare
    results = []

    def process_signal(sig):
        iv, cd = sig["intervention_id"], sig["condition_id"]
        arm = sig.get("arm", "direct")
        aspect = sig.get("aspect", "efficacy")
        iv_label = label.get(iv, iv)
        cd_label = label.get(cd, cd)

        claim_ids = sig.get("claim_ids") or []
        if isinstance(claim_ids, str):
            import json as _json
            try:
                claim_ids = _json.loads(claim_ids)
            except Exception:
                claim_ids = []
        claims = [claim_map[str(cid)] for cid in claim_ids if str(cid) in claim_map]
        if not claims:
            return {"signal_id": sig["id"], "error": "no claims found", "runs": []}

        system = SYSTEM.replace("{rubric}", ARM_RUBRIC.get(arm, ARM_RUBRIC["direct"]))
        user = build_user_prompt(iv_label, cd_label, aspect, arm, claims)

        runs = []
        for r in range(args.runs):
            raw = score_one_signal(api_key, args.model, system, user)
            processed = apply_deterministic(raw, arm, claims)
            runs.append(processed)

        return {
            "signal_id": sig["id"],
            "intervention": iv_label,
            "condition": cd_label,
            "arm": arm,
            "aspect": aspect,
            "stored_tier": sig.get("confidence_tier"),
            "stored_score": sig.get("arm_score"),
            "runs": runs,
        }

    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        for i, r in enumerate(pool.map(process_signal, sigs), start=1):
            results.append(r)
            if i % 10 == 1 or i == len(sigs):
                print(f"  · {i} / {len(sigs)} ...", flush=True)

    # Analysis
    valid = [r for r in results if not r.get("error") and all("dims" in run for run in r["runs"])]
    dim_names = ["corroboration", "rigor", "specificity", "plausibility", "consistency"]

    def all_runs_agree(runs, key):
        vals = [run.get(key) for run in runs]
        return all(v == vals[0] for v in vals if v is not None)

    def all_dims_agree(runs):
        for d in dim_names:
            vals = [run["dims"].get(d) for run in runs]
            if any(v is None for v in vals):
                return False
            if len(set(vals)) > 1:
                return False
        return True

    tier_stable = sum(1 for r in valid if all_runs_agree(r["runs"], "tier"))
    dims_stable = sum(1 for r in valid if all_dims_agree(r["runs"]))
    synthesis_identical = sum(1 for r in valid
                             if len(set(run.get("synthesis", "") for run in r["runs"])) == 1)
    facts_stable = sum(1 for r in valid
                      if len(set(json.dumps(run.get("facts", {}), sort_keys=True)
                                for run in r["runs"])) == 1)

    # Per-dimension agreement
    dim_agree = {}
    for d in dim_names:
        agree = sum(1 for r in valid
                    if len(set(run["dims"].get(d) for run in r["runs"])) == 1)
        dim_agree[d] = agree

    # Synthesis token overlap (average pairwise)
    overlaps = []
    for r in valid:
        runs = r["runs"]
        for i in range(len(runs)):
            for j in range(i + 1, len(runs)):
                overlaps.append(token_overlap(
                    runs[i].get("synthesis", ""),
                    runs[j].get("synthesis", "")))

    # Median arm_score spread across runs (the measurement that contextualises
    # the tier-stability figure: a 1-point wobble on a 2-point-wide band is
    # a boundary artifact, not a scoring failure).
    import statistics
    spreads = []
    for r in valid:
        scores = [run.get("score") for run in r["runs"] if run.get("score") is not None]
        if len(scores) >= 2:
            spreads.append(max(scores) - min(scores))
    median_spread = statistics.median(spreads) if spreads else 0
    max_spread = max(spreads) if spreads else 0

    # Disagreements
    tier_disagree = [r for r in valid if not all_runs_agree(r["runs"], "tier")]
    dim_disagree = [r for r in valid if not all_dims_agree(r["runs"])]

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps({
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": args.model,
        "runs": args.runs,
        "n_signals": len(valid),
        "n_errors": len(results) - len(valid),
        "tier_agreement": {
            "stable": tier_stable,
            "unstable": len(valid) - tier_stable,
            "rate": round(100 * tier_stable / len(valid), 1) if valid else 0,
        },
        "arm_score_spread": {
            "median": round(median_spread, 2),
            "max": round(max_spread, 2),
        },
        "dimension_agreement": {
            "all_five_stable": {
                "stable": dims_stable,
                "rate": round(100 * dims_stable / len(valid), 1) if valid else 0,
            },
            "per_dimension": {d: {
                "stable": dim_agree[d],
                "rate": round(100 * dim_agree[d] / len(valid), 1) if valid else 0,
            } for d in dim_names},
        },
        "synthesis_agreement": {
            "identical": synthesis_identical,
            "identical_rate": round(100 * synthesis_identical / len(valid), 1) if valid else 0,
            "mean_token_overlap": round(sum(overlaps) / len(overlaps), 3) if overlaps else 0,
        },
        "facts_agreement": {
            "stable": facts_stable,
            "rate": round(100 * facts_stable / len(valid), 1) if valid else 0,
        },
        "tier_disagreements": [{
            "signal_id": r["signal_id"],
            "intervention": r["intervention"],
            "condition": r["condition"],
            "arm": r["arm"],
            "stored_tier": r["stored_tier"],
            "run_tiers": [run.get("tier") for run in r["runs"]],
            "run_scores": [run.get("score") for run in r["runs"]],
        } for r in tier_disagree],
        "dimension_disagreements": [{
            "signal_id": r["signal_id"],
            "intervention": r["intervention"],
            "condition": r["condition"],
            "arm": r["arm"],
            "run_dims": [run["dims"] for run in r["runs"]],
        } for r in dim_disagree],
        "results": results,
    }, indent=2) + "\n")

    # Print summary
    print()
    print("=" * 64)
    print("Whel · scoring test-retest")
    print("=" * 64)
    print(f"model: {args.model}")
    print(f"signals scored: {len(valid)} of {len(results)}")
    print(f"runs per signal: {args.runs}")
    print()
    print("TIER STABILITY (the thing the site displays):")
    print(f"  stable:   {tier_stable}/{len(valid)} = {100*tier_stable/len(valid):.1f}%")
    print(f"  unstable: {len(valid) - tier_stable}/{len(valid)} = {100*(len(valid)-tier_stable)/len(valid):.1f}%")
    print(f"  median arm_score spread: {median_spread:.2f} / 10  (max {max_spread:.2f})")
    print(f"  context: bands are 2.0–2.5 points wide; a {median_spread:.1f}-point wobble crosses")
    print(f"  a cutoff when the score sits within {median_spread:.1f} of it.")
    print()
    print("DIMENSION STABILITY (per dimension, across runs):")
    for d in dim_names:
        print(f"  {d:15s} {dim_agree[d]}/{len(valid)} = {100*dim_agree[d]/len(valid):.1f}%")
    print(f"  {'all five':15s} {dims_stable}/{len(valid)} = {100*dims_stable/len(valid):.1f}%")
    print()
    print("SYNTHESIS SUMMARY STABILITY:")
    print(f"  identical:      {synthesis_identical}/{len(valid)} = {100*synthesis_identical/len(valid):.1f}%")
    print(f"  mean overlap:   {sum(overlaps)/len(overlaps):.3f}" if overlaps else "  mean overlap:   n/a")
    print()
    print("FACTS STABILITY (sample size, % female, etc.):")
    print(f"  stable: {facts_stable}/{len(valid)} = {100*facts_stable/len(valid):.1f}%")

    if tier_disagree:
        print(f"\n  TIER DISAGREEMENTS ({len(tier_disagree)}):")
        for r in tier_disagree[:10]:
            run_tiers = [run.get("tier") for run in r["runs"]]
            run_scores = [run.get("score") for run in r["runs"]]
            print(f"    {r['intervention'][:20]} → {r['condition'][:15]} ({r['arm']})")
            print(f"      stored: {r['stored_tier']}  runs: {run_tiers}  scores: {run_scores}")
        if len(tier_disagree) > 10:
            print(f"    ... and {len(tier_disagree) - 10} more")

    u = usage_snapshot()
    print(f"\n  [usage] {u['calls']} calls, {u['input_tokens']}+{u['output_tokens']} tok, ~${u['est_cost_usd']:.4f}")
    print(f"  wrote {OUT_PATH.relative_to(REPO)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
