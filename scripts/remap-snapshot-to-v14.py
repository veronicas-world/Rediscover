#!/usr/bin/env python3
"""
remap-snapshot-to-v14.py
=======================

Remaps the v1.3 scoring snapshot onto the v1.4 four-dimension 0-8 scale and
reports the penalty distribution, score frequency, and tier split under
whatever cutoffs are currently in TIER_CUTOFFS.

THE PROBLEM THIS EXISTS TO SOLVE
--------------------------------
The v1.3 snapshot was scored on five dimensions (0-2 each, arm_strength 0-10).
The v1.4 rubric has four scored dimensions (corroboration, rigor, specificity,
plausibility, 0-2 each, summing to 0-8) plus a downgrade-only consistency
penalty (0, -1, or -2). The cutoffs in TIER_CUTOFFS were set on the v1.3 lattice
and may be wrong for the 0-8 scale. This script lets you see the shape of the
distribution before and after the rescore, without spending API credits.

WHAT IT DOES
------------
1. Reads lib/scoring-v13-snapshot.json (226 signals with per-dimension scores).
2. Reads TIER_CUTOFFS from lib/substrate-helpers.mjs (parses the JS literal,
   does not retype the numbers).
3. Computes the v1.4 arm_strength for each signal:
     base = corroboration + rigor + specificity + plausibility  (0-8)
     arm_strength = max(0, base + consistency_penalty)
4. Classifies the consistency penalty using the v1.4 rule from
   lib/rubric-anchors.mjs:
     0   sources agree, or single-source (not assessable)
    -1   mixed direction across sources
    -2   direct conflict on the primary outcome
5. Prints:
     - penalty distribution (0 / -1 / -2 / unclassifiable)
     - score frequency 0 through 8
     - tier split under the current TIER_CUTOFFS
     - the old v1.3 tier distribution for comparison

CLASSIFICATION LOGIC AND ITS LIMITS
----------------------------------
The classification uses these snapshot fields:

  scores.corroboration   0 = single source, 1 = one synthesis or two sources,
                          2 = three or more. Used to identify single-source
                          signals (penalty 0, not assessable).
  scores.consistency     Old v1.3 score (0-2). 0 = single source / not
                          assessable, 1 = agree or n/a, 2 = all agree.
                          CONFLATES source count with direction agreement.
  num_contradictions     Formal database contradiction rows. Tracks at least
                          three different things: (a) direction disagreement
                          within a signal's sources, (b) benefit-vs-harm
                          tension across outcomes for the same drug, and
                          (c) cross-signal contradictions between different
                          signals for the same drug/condition. Only (a) is what
                          the v1.4 consistency rule asks about.
  rationales.consistency Free-form text. Keyword-matched for "mixed",
                          "conflict", "agree", "complex", "single source".

Decision rules (in order):

  1. corroboration = 0                     -> penalty 0 (single source, not assessable)
  2. corroboration > 0, consistency = 0    -> penalty -2 (rationales confirm "directly
                                              conflict" / "internally contradictory")
  3. num_contradictions > 0, rationale
     says "mixed" or "comparator-dependent" -> penalty -1
  4. num_contradictions > 0, rationale
     ambiguous                              -> UNCLASSIFIABLE (provisional 0)
  5. everything else                        -> penalty 0 (assumed agree)

WHAT IT DOES NOT DO
-------------------
- It does NOT model the v1.4 consistency penalty accurately. The snapshot
  lacks a "direction agreement" field. The old consistency score conflates
  source count with direction. The num_contradictions field tracks formal DB
  rows, not the v1.4 concept of "mixed direction across sources." The
  rationales are free-form text. The penalty fires on 4 of 226 signals; it is
  currently inert as a discriminator.

- It does NOT produce a lower bound. The "pessimistic" scenario (old
  consistency = 1 -> -1) is NOT a valid bound because it would double-penalize
  single-source rows whose rationale reads "n/a" — the v1.4 rule specifically
  exempts single-source signals from the penalty.

- It does NOT set or recommend cutoffs. The cutoffs are read from
  substrate-helpers.mjs and reported as-is. Cutoffs must be re-derived on
  the post-rescore lattice.

- It does NOT replace the rescore. The remap is a diagnostic that shows the
  shape of the distribution on the 0-8 scale. The actual arm_strength values
  will change when the rescore re-evaluates every signal against the v1.4
  rubric, including the consistency penalty.

SAFETY
------
Reads two local files. Writes nothing. No database access, no API calls.

USAGE
-----
    python3 scripts/remap-snapshot-to-v14.py

Re-runnable against post-rescore data: once the rescore produces a new
snapshot (same JSON structure), point SNAPSHOT_PATH at it and re-run.
"""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parent.parent
SNAPSHOT_PATH = REPO_ROOT / "lib" / "scoring-v13-snapshot.json"
HELPERS_PATH = REPO_ROOT / "lib" / "substrate-helpers.mjs"


# ── Read TIER_CUTOFFS from the .mjs file ──────────────────────────────────────

def read_tier_cutoffs(path: Path) -> list[dict]:
    """Parse TIER_CUTOFFS from the .mjs source. Returns [{cut, upper, lower}, ...]."""
    text = path.read_text()
    match = re.search(
        r"export\s+const\s+TIER_CUTOFFS\s*=\s*\[(.*?)\];",
        text,
        re.DOTALL,
    )
    if not match:
        sys.exit(f"Could not find TIER_CUTOFFS in {path}")
    body = match.group(1)
    cutoffs = []
    for entry_match in re.finditer(
        r"\{\s*cut:\s*([\d.]+)\s*,\s*upper:\s*\"(\w+)\"\s*,\s*lower:\s*\"(\w+)\"\s*\}",
        body,
    ):
        cutoffs.append({
            "cut": float(entry_match.group(1)),
            "upper": entry_match.group(2),
            "lower": entry_match.group(3),
        })
    if not cutoffs:
        sys.exit(f"Could not parse any cutoffs from {path}")
    return cutoffs


# ── Consistency penalty classification ───────────────────────────────────────

def classify_penalty(signal: dict) -> tuple[int | None, str]:
    """
    Returns (penalty, reason).
    penalty is 0, -1, -2, or None for unclassifiable.
    """
    sc = signal["scores"]
    corr = sc["corroboration"]
    cons = sc["consistency"]
    ncontra = signal.get("num_contradictions", 0)
    rationale = signal.get("rationales", {}).get("consistency", "")
    r = rationale.lower()

    # Rule 1: single source -> penalty 0 (not assessable)
    if corr == 0:
        return 0, "single source (corroboration=0) -> 0 (not assessable)"

    # Rule 2: multiple sources but consistency=0 -> direct conflict
    # Rationales for these signals say "directly conflict" / "internally contradictory"
    if cons == 0:
        return -2, "corroboration>0 + consistency=0 -> -2 (rationale confirms direct conflict)"

    # Rule 3: contradictions + rationale says "mixed" -> -1
    if ncontra > 0:
        if "mixed" in r or "comparator-dependent" in r:
            return -1, "contradictions + rationale says 'mixed' -> -1"
        # Rule 4: contradictions + ambiguous rationale -> unclassifiable
        if any(w in r for w in ["agree", "uniformly", "consistently", "concordant"]):
            return None, "contradictions + rationale says 'agree' -> UNCLASSIFIABLE (provisional 0)"
        if any(w in r for w in ["complex", "balance"]):
            return None, "contradictions + rationale says 'complex balance' -> UNCLASSIFIABLE (provisional 0)"
        if "single source" in r or "n/a" in r:
            return None, "contradictions + rationale says 'single source' -> UNCLASSIFIABLE (provisional 0)"
        return None, "contradictions + unclear rationale -> UNCLASSIFIABLE (provisional 0)"

    # Rule 5: everything else -> 0 (assumed agree)
    return 0, f"corroboration={corr}, consistency={cons}, no contradictions -> 0 (assumed agree)"


# ── Main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    if not SNAPSHOT_PATH.exists():
        sys.exit(f"Snapshot not found: {SNAPSHOT_PATH}")
    if not HELPERS_PATH.exists():
        sys.exit(f"Helpers not found: {HELPERS_PATH}")

    with open(SNAPSHOT_PATH) as f:
        data = json.load(f)

    signals = data["signals"]
    n = len(signals)
    cutoffs = read_tier_cutoffs(HELPERS_PATH)

    # Classify penalties
    penalties: list[int | None] = []
    reasons: list[str] = []
    for s in signals:
        p, reason = classify_penalty(s)
        penalties.append(p)
        reasons.append(reason)

    # Compute v1.4 arm_strength
    new_scores: list[int] = []
    for s, p in zip(signals, penalties):
        sc = s["scores"]
        base = sc["corroboration"] + sc["rigor"] + sc["specificity"] + sc["plausibility"]
        penalty = p if p is not None else 0  # provisional 0 for unclassifiable
        new_scores.append(max(0, base + penalty))

    # ── Report ────────────────────────────────────────────────────────────────

    print(f"Snapshot: {SNAPSHOT_PATH.name} ({n} signals)")
    print(f"Cutoffs (from {HELPERS_PATH.name}):")
    for c in cutoffs:
        print(f"  {c['upper']:>12} > {c['cut']}  |  {c['lower']} <= {c['cut']}")
    print()

    # Penalty distribution
    print("=== Penalty distribution ===")
    pen_dist = Counter(p if p is not None else "unclassifiable" for p in penalties)
    for p in sorted([x for x in pen_dist if isinstance(x, int)], reverse=True):
        print(f"  penalty {p:+d}: {pen_dist[p]} signals")
    if "unclassifiable" in pen_dist:
        print(f"  unclassifiable: {pen_dist['unclassifiable']} signals")
    print()

    # Unclassifiable details
    unclass = [(s, reasons[i]) for i, s in enumerate(signals) if penalties[i] is None]
    if unclass:
        print("=== Unclassifiable signals ===")
        for s, reason in unclass:
            print(f"  {s['drug']} / {s['condition']} / {s['arm']} / {s['aspect']}: {reason}")
            print(f"    rationale: {s['rationales']['consistency'][:150]}")
        print()

    # Score frequency
    print("=== Score frequency 0-8 ===")
    freq = Counter(new_scores)
    for i in range(9):
        print(f"  {i}: {freq.get(i, 0)}")
    print()

    # Tier split under current cutoffs
    print("=== Tier split under current TIER_CUTOFFS ===")
    # cutoffs are highest-first: [{cut, upper, lower}, ...]
    # upper tier: score > cut
    # for middle tiers: lower <= score <= cut (but need to handle the next cutoff)
    tiers = []
    for i, c in enumerate(cutoffs):
        if i == 0:
            count = sum(1 for s in new_scores if s > c["cut"])
            tiers.append((c["upper"], count, f"> {c['cut']}"))
        # The lower tier of this cutoff is the upper tier of the next
    for i, c in enumerate(cutoffs):
        if i < len(cutoffs) - 1:
            next_cut = cutoffs[i + 1]["cut"]
            count = sum(1 for s in new_scores if next_cut <= s <= c["cut"])
            tiers.append((c["lower"], count, f"{next_cut} - {c['cut']}"))
    last = cutoffs[-1]
    count = sum(1 for s in new_scores if s < last["cut"])
    tiers.append((last["lower"], count, f"< {last['cut']}"))

    for tier, count, band in tiers:
        print(f"  {tier:>12}: {count:>4} ({count/n*100:.1f}%)  [{band}]")
    print()

    # Old v1.3 tier distribution for comparison
    print("=== Old v1.3 tier distribution (for comparison) ===")
    old_tiers = Counter(s["confidence_tier"] for s in signals)
    for tier in ["Strong", "Moderate", "Emerging", "Exploratory"]:
        count = old_tiers.get(tier, 0)
        print(f"  {tier:>12}: {count:>4} ({count/n*100:.1f}%)")
    print()

    # Single-source note
    single = sum(1 for s in signals if s["scores"]["corroboration"] == 0)
    print(f"=== Structural notes ===")
    print(f"  Single-source (corroboration=0): {single} ({single/n*100:.1f}%)")
    print(f"  Their arithmetic maximum on 0-8: 6 (three dimensions at 2, corroboration at 0)")
    print(f"  Any Strong cutoff above 6 excludes {single} signals ({single/n*100:.1f}%) by construction")
    penalty_fired = sum(1 for p in penalties if p is not None and p < 0)
    print(f"  Consistency penalty fired: {penalty_fired} of {n} signals ({penalty_fired/n*100:.1f}%)")


if __name__ == "__main__":
    main()
