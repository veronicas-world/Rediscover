// Rubric version history, for pages that explain how a grade was reached.
//
// THE PROBLEM THIS SOLVES
// Editorial prose that hardcodes a numeric argument next to live figures is
// self-refuting on the next rescore. The featured walkthrough used to read
// "consistency scores 2 ... that one point is the whole difference between an 8.0
// Strong and a 7.0 Moderate" directly above a live score breakdown. When v1.4
// rescored the corpus the figures updated and the paragraph did not, so the page
// would have displayed new numbers above an explanation of the old ones.
//
// The rule: if a section needs to explain how a score was reached, it must RENDER
// that explanation from data. Nothing here returns prose containing a number —
// callers get structured rows and derive their own labels.
//
// lib/scoring-v13-snapshot.json is the frozen pre-v1.4 pass (see
// scripts/snapshot-scoring-v13.mjs). It is write-once; substrate_signals is
// rescored in place, so it is the only copy of what v1.3 said.

// Plain JSON import, matching lib/corpus-query.ts: the Next compiler resolves it,
// and a Node import attribute is not understood by every bundler target.
import v13 from "./scoring-v13-snapshot.json";

export const SPEC_VERSIONS = {
  "v1.3": {
    label: "v1.3",
    dimensionCount: 5,
    // five 0-2 dimensions
    armStrengthMax: 10,
    tieredOn: "arm_score",
    tiers: ["Strong", "Moderate", "Emerging", "Exploratory"],
    consistencyRange: [0, 2],
    summary:
      "Five 0-2 dimensions summed to a strength of 0-10, discounted by the " +
      "female-applicability multiplier, then cut into four tiers on the discounted score.",
  },
  "v1.4": {
    label: "v1.4",
    dimensionCount: 4,
    // four 0-2 dimensions plus a downgrade-only consistency penalty
    armStrengthMax: 8,
    tieredOn: "arm_strength",
    tiers: ["Strong", "Emerging", "Exploratory"],
    consistencyRange: [-2, 0],
    summary:
      "Four 0-2 dimensions summed to a strength of 0-8, with consistency reduced to a " +
      "downgrade-only penalty that can subtract certainty but never add it. Tiers are cut " +
      "on the undiscounted strength; the multiplier moves rank and display only.",
  },
};

export const CURRENT_SPEC = SPEC_VERSIONS["v1.4"];
export const PREVIOUS_SPEC = SPEC_VERSIONS["v1.3"];

export const DIM_ORDER = ["corroboration", "rigor", "specificity", "plausibility", "consistency"];

/** The frozen v1.3 row for a pair, or null. `arm` defaults to the anchor arm. */
export function frozenV13(interventionId, conditionId, arm = "direct") {
  if (!interventionId || !conditionId) return null;
  return (
    v13.signals.find(
      (s) => s.intervention_id === interventionId && s.condition_id === conditionId && s.arm === arm
    ) ?? null
  );
}

/** Frozen v1.3 row from a `${interventionId}__${conditionId}` signal id. */
export function frozenV13BySignalId(signalId, arm = "direct") {
  const [iv, cd] = String(signalId ?? "").split("__");
  return frozenV13(iv, cd, arm);
}

export const v13Distribution = v13.distribution;
export const v13Meta = v13.meta;

/**
 * Compare a live dimension breakdown against the frozen v1.3 row.
 *
 * `liveDims` is the shape produced by substrate-candidates: [{key, label, score}].
 * Returns structured rows only — never a sentence — so prose cannot go stale.
 *
 * `rescored` asks whether the live corpus has actually been regraded under the
 * current spec yet. It is derived from the data rather than a hand-maintained
 * flag: a v1.4 consistency score is <= 0 by construction, and any change to the
 * summed strength also proves a regrade. The one blind spot is a signal whose
 * v1.3 consistency was already 0 and whose other dimensions did not move; such a
 * signal reports `rescored: false` because nothing observable changed, which is
 * the honest answer for that row.
 */
export function rubricDelta(liveDims, frozen) {
  if (!frozen || !Array.isArray(liveDims) || liveDims.length === 0) return null;

  const live = new Map(liveDims.map((d) => [d.key, d]));
  const rows = DIM_ORDER.filter((k) => live.has(k) || k in frozen.scores).map((key) => {
    const l = live.get(key);
    const before = frozen.scores[key] ?? null;
    const after = l ? l.score : null;
    return {
      key,
      label: l?.label ?? key.charAt(0).toUpperCase() + key.slice(1),
      before,
      after,
      changed: before !== null && after !== null && before !== after,
      // consistency is the only dimension whose SCALE changed, not just its value
      rescaled: key === "consistency",
      rationale: l?.rationale ?? frozen.rationales?.[key] ?? null,
    };
  });

  const strengthAfter = rows.reduce((sum, r) => sum + (r.after ?? 0), 0);
  const consistencyAfter = rows.find((r) => r.key === "consistency")?.after ?? null;
  const rescored =
    (consistencyAfter !== null && consistencyAfter < 0) ||
    Math.max(0, strengthAfter) !== frozen.arm_strength;

  return {
    rows,
    rescored,
    before: {
      spec: PREVIOUS_SPEC,
      strength: frozen.arm_strength,
      max: PREVIOUS_SPEC.armStrengthMax,
      score: frozen.arm_score,
      tier: frozen.confidence_tier,
    },
    after: {
      spec: CURRENT_SPEC,
      strength: Math.max(0, strengthAfter),
      max: CURRENT_SPEC.armStrengthMax,
    },
    /** Dimensions whose value moved, for a caller that wants to name them. */
    movedKeys: rows.filter((r) => r.changed).map((r) => r.key),
  };
}

/**
 * Compare two pairs under both specs — the "these two were separated by one
 * dimension, and now they are not" case. Returns null unless both are frozen.
 */
export function contrastV13(aFrozen, bFrozen) {
  if (!aFrozen || !bFrozen) return null;
  const diverging = DIM_ORDER.filter((k) => (aFrozen.scores[k] ?? null) !== (bFrozen.scores[k] ?? null));
  const shared = DIM_ORDER.filter((k) => !diverging.includes(k));
  return {
    diverging,
    shared,
    a: { strength: aFrozen.arm_strength, score: aFrozen.arm_score, tier: aFrozen.confidence_tier },
    b: { strength: bFrozen.arm_strength, score: bFrozen.arm_score, tier: bFrozen.confidence_tier },
    /** True when every difference sat in dimensions the current spec no longer scores that way. */
    onlyRescaledDims: diverging.length > 0 && diverging.every((k) => k === "consistency"),
  };
}
