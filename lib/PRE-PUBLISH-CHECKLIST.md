# Pre-Publish Checklist — resolve before flipping SIGNALS_PUBLISHED to true

This file lives next to `lib/site-config.ts` so it sits where whoever flips
the flag will see it. Every item below must be resolved before the site can
go live. The flag is currently **not safe to flip**.

---

## 1. TIER_CUTOFFS must be re-derived on the post-rescore lattice

**File:** `lib/substrate-helpers.mjs` — `TIER_CUTOFFS`

**Problem:** The current cutoffs (7.5 / 3.5) were set on the v1.3 lattice
(0–10, five dimensions). SCORING_SPEC §5 says "3.5 / 7.5 are not frozen" and
"will both move" when the scale drops to 0–8. On the v1.4 lattice (0–8,
four dimensions, integers 0–8), a cutoff at 7.5 means Strong requires a
score of 8 — all four dimensions at maximum with no consistency penalty.

Remapping the v1.3 snapshot onto the 0–8 scale puts **0 signals at score 8**
(with penalty) or **1 signal** (without penalty). The old 12 Strong signals
all remap to 6–7. Strong is empty or nearly empty under 7.5.

**3.5 is also wrong.** The remapped mode is 4 (54 signals), near-mode 5 (52).
Rule (b) says no cutoff on or adjacent to a modal value. 3.5 sits directly
adjacent to the mode. Both cutoffs were derived on the old lattice and both
need re-deriving.

**Structural findings from the remap** (run `python3 scripts/remap-snapshot-to-v14.py`):

- **The consistency penalty is inert.** It fires on 4 of 226 signals (1.8%).
  The other 222 get penalty 0. As a discriminator between tiers, it does
  nothing. The v1.4 rule needs direction-agreement data the snapshot doesn't
  carry (see `scripts/remap-snapshot-to-v14.py` docstring, WHAT IT DOES NOT DO).

- **Half the corpus is capped at 6.** 116 signals (51%) are single-source
  (corroboration = 0), so their arithmetic maximum on the 0–8 scale is 6
  (three dimensions at 2, corroboration at 0). Any Strong cutoff above 6
  excludes half the corpus by construction.

- **The top of the scale is structurally unreachable.** 4 signals score 7,
  0–1 score 8. The cliff at 6 (37 signals → 4 → 0) means no cutoff produces
  a Strong tier that is both non-trivial in size and sits in a sparse region.
  63% of signals are packed into scores 4–6. This is not a cutoff problem;
  it is a rubric question: whether four 0–2 dimensions can produce enough
  spread at the top to distinguish "strong" from "emerging."

- **The "pessimistic" scenario is NOT a lower bound.** Assigning -1 to all
  174 signals at old consistency = 1 would double-penalize single-source
  rows whose rationale reads "n/a" — penalizing them through corroboration
  (already 0) and consistency (−1) both. The v1.4 rule specifically exempts
  single-source signals from the penalty. Do not cite the pessimistic
  scenario as a bound.

**Action:** Run the rescore, derive new cutoffs on the post-rescore lattice
following SCORING_SPEC §5b rules (a) and (b), freeze them, and update
`TIER_CUTOFFS` here. This is the single most important blocker.

**Source:** SCORING_SPEC.md lines 272, 276–278, 322–324.
**Diagnostic:** `scripts/remap-snapshot-to-v14.py`

---

## 2. Components with local 4-tier types that shadow the shared helper

These components define their own `TierKey` type and/or `tierKey()` function
locally, so the 3-tier fix in `lib/substrate-helpers.mjs` does not propagate.
They will render 4 tiers (including Moderate) when the flag flips.

### 2a. `app/candidates/CandidateExplorer.tsx`
- **Local type:** `type TierKey = "strong" | "moderate" | "emerging" | "exploratory"` (line 41)
- **Local function:** `tierKey()` (line 43) — shadows the imported helper, still recognizes "moderate"
- **Local constants:** `TIER_ORDER` (line 54), `TIER_LABELS` (line 56), `TIER_RANK` (line 61) — all include "moderate"
- **Logic:** Line 120 checks `it.tier === "moderate"` in a filter condition
- **Prose:** Lines 114, 418 reference "moderate" in descriptive text
- **Fix:** Remove "moderate" from type, function, constants, and filter logic. Update prose.

### 2b. `app/components/SourceSankey.tsx`
- **Local type:** `export type TierKey = "strong" | "moderate" | "emerging" | "exploratory"` (line 7)
- **Local config:** Tier row with `id: "moderate"` (line 34)
- **Fix:** Remove "moderate" from type and config.

### 2c. `app/components/TierHeatmap.tsx`
- **Local type:** `export type TierKey = "strong" | "moderate" | "emerging" | "exploratory"` (line 6)
- **Local config:** Tier row with `key: "moderate"` (line 18), color config (line 28)
- **Fix:** Remove "moderate" from type and config.

### 2d. `app/conditions/ConditionsList.tsx`
- **Local type:** `type TierKey = "strong" | "moderate" | "emerging" | "exploratory"` (line 3)
- **Local constants:** `TIER_BAR` (line 19), `TIER_ORDER` (line 24) — include "moderate"
- **Prose:** Line 132 renders `{c.tierCounts.moderate} moderate` in the condition summary
- **Fix:** Remove "moderate" from type, constants, and prose.

---

## 3. Components with local tier labels/counts (no local type, but "moderate" in display data)

These components don't define a local `TierKey` type, but they have
hardcoded "moderate" in `TIER_ORDER`, `TIER_LABELS`, count objects, or
prose. They will show a Moderate column/label that is always 0 or stale.

### 3a. `app/candidates/page.tsx`
- **Local type:** `type Tier` derived from local `TIER_ORDER` (line 19) — includes "moderate"
- **Local constants:** `TIER_ORDER` (line 18), `TIER_LABELS` (line 21) — include "moderate"
- **Count objects:** Lines 54, 67 — `counts: { strong: 0, moderate: 0, ... }` and `totalByTier`
- **Fix:** Remove "moderate" from `TIER_ORDER`, `TIER_LABELS`, and all count objects.

### 3b. `app/access/preview/page.tsx`
- **Local constants:** `TIER_ORDER` (line 19), `TIER_LABELS` (line 22) — include "moderate"
- **Fix:** Remove "moderate" from both.

### 3c. `app/access/preview/[signalId]/page.tsx`
- **Local constant:** `TIER_LABELS` (line 24) — includes `moderate: "Moderate"`
- **Fix:** Remove "moderate" entry.

### 3d. `app/components/CandidateCard.tsx`
- **Spanning tier handling:** Line 202 handles "strong–moderate" spans
- **Label map:** Line 206 includes `moderate: "Moderate tier"`
- **Fix:** Remove "moderate" from span handling and label map.

### 3e. `app/components/HomeTierMatrix.tsx`
- **Type:** `MatrixRow` (line 11) includes `moderate: number`
- **Config:** Tier row with `key: "moderate"` (line 19), data row (line 27)
- **Fix:** Remove "moderate" from type and config.

### 3f. `app/conditions/page.tsx`
- **Count objects:** Line 23 `EMPTY` and line 31 `tierCounts` — include "moderate"
- **Fix:** Remove "moderate" from count objects.

### 3g. `app/page.tsx` (home)
- **Count objects:** Line 107 `EMPTY`, line 119 `tierCounts` mapping — include "moderate"
- **Label map:** Line 140 includes `moderate: "Moderate"`
- **Fix:** Remove "moderate" from count objects and label map.

### 3h. `app/featured/page.tsx`
- **Label map:** Line 63 includes `moderate: "Moderate"`
- **Section heading:** Line 346 "Why Moderate and not Strong"
- **Fix:** Remove "moderate" from label map. Update section heading to reflect 3-tier taxonomy.

### 3i. `app/featured/anastrozole-endometriosis/page.tsx`
- **Label map:** Line 77 includes `moderate: "Moderate"`
- **Fix:** Remove "moderate" entry. (Note: this page renders from live signal data and is gated.)

### 3j. `app/api/mcp/route.ts`
- **Zod schema:** Line 34 `z.enum(["strong", "moderate", "emerging", "exploratory"])`
- **Fix:** Remove "moderate" from the enum.

### 3k. `app/candidates/ConditionAccordion.tsx`
- **Comment:** Line 10 mentions "moderate" in a JSDoc example
- **Fix:** Update comment to use 3-tier example.

---

## 4. Summary

| Category | Count | Risk when flag flips |
|---|---|---|
| TIER_CUTOFFS re-derivation | 1 | Strong tier is empty or nearly empty under 7.5 on 0–8 scale |
| Local 4-tier types (shadow helper) | 4 | Renders 4 tiers including Moderate; local tierKey() overrides shared fix |
| Local tier labels/counts (no local type) | 11 | Shows Moderate column/label stuck at 0 or stale |
| **Total components to fix** | **15** | |

**The flag is not safe to flip until all 15 are resolved and the rescore has
produced new cutoffs.**
