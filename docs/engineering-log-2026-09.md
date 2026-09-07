# Engineering log — September 2026

Internal record of the hardening work done between the August 2026 independent
review (`docs/droid-review-2026-08.md`) and the pre-publish gate. This file is
for the maintainers and for any future agent picking the repo up. It records
what was found, what was changed, and why. It is not public-facing copy; the
public record lives in `app/about/methodology/changelog/page.tsx`.

Where a claim below says "verified," it was checked against the live database
or the committed code, not assumed.

---

## 1. Contradiction flag: investigation and fixes

### 1.1 What the flag is

`contradiction_flag` is a boolean on `substrate_signals`, set true when
`num_contradictions > 0`. The `contradictions` table is populated by
`detect_contradictions.py`, which compares entailed efficacy claims within
each `(intervention, condition)` group and confirms candidate pairs with an
NLI check.

### 1.2 What the database actually contained (verified 2026-09-03)

- **3 contradiction rows total.** All 3 are **intra-document** — both claims
  in each pair come from the same source document.
- **Zero cross-document contradictions.**
- **Row 1 (MHT/menopause) is stale:** both claims now have
  `entailment_label = "neutral"`, so a re-run of the detector would not form
  this pair. It remains in the table from an earlier run. It also fails two
  gates on substance: different outcomes (cardiovascular events vs all-cause
  mortality) and different populations.
- **Row 2 (anti-androgens + lifestyle / PCOS):** same outcome (hirsutism) but
  different comparators (metformin vs placebo). Fails the comparator gate.
- **Row 3 (metformin / PCOS):** different outcomes (hirsutism vs free androgen
  index). Fails the outcome gate.

Full detail in `docs/contradiction-flag-taxonomy.md`.

### 1.3 Coverage limitation, not consensus

The "zero cross-document contradictions" finding is a coverage limitation:

- **99 of 114** `(intervention, condition)` groups (87%) have entailed
  efficacy claims from a **single document**. There is no second source to
  disagree with.
- **15 groups** have 2+ documents. **221 cross-document pairs** were formed;
  **46 had opposing directions** and were sent to the NLI.
- The NLI **rejected all 46**. Zero cross-document contradictions confirmed.

### 1.4 Detector bias (v1)

The v1 detector did not distinguish intra-document from cross-document pairs:

| | Candidate pairs | Accepted | Acceptance rate |
|---|---|---|---|
| Cross-document | 46 | 0 | 0% |
| Intra-document | 77 | 2 | 2.6% |
| **Total** | **123** | **2** | **1.6%** |

Two biases, both pointing the same direction:

1. **Volume bias:** 77 of 123 candidates (63%) are intra-document. Review
   articles make multiple claims with different directions about the same
   drug, and all become intra-document candidates.
2. **Acceptance bias:** all accepted contradictions are within-source — the
   pairs that cannot constitute source disagreement.

The v1 detector preferentially surfaces within-source tensions.

### 1.5 Fixes applied

**Fix 1 — scope to the signal's own claims (commit `0c3d241`).**
`_num_contradictions` in `scripts/substrate/score_claims.py` originally
counted ALL contradiction rows for the `(intervention_id, condition_id)`
pair, so a safety signal inherited a contradiction between two efficacy
claims it didn't contain. It now counts only rows where at least one of the
two claims belongs to this signal's claim set. Effect: 3 of 7 flagged
signals survive.

**Fix 2 — exclude same-document rows (commit `bec92f1`).**
A within-source tension is not a between-source consistency signal.
`_num_contradictions` now joins the `claims` table and excludes rows where
`ca.document_id = cb.document_id` (both non-NULL and equal). Effect: all 3
surviving rows are intra-document, so the consistency penalty fires on
**0 signals**. The flag is inert in the current corpus.

**Fix 3 — detector v2 (commit `bec92f1`, not yet run).**
`detect_contradictions.py` v2 adds:
- **4 gates** (intervention, comparator, outcome, population) — a pair must
  pass all 4 before direction is checked;
- **`same_document` field** — recorded as a field, not a rejection;
- **JSONL rejection log** — every evaluated pair is logged with the gate
  that rejected it and a one-line rationale, so the rejection rate is
  auditable. A detector that can only output zeros needs its rejections to
  be inspectable.

The v2 prompt would have rejected all 3 existing rows. It has not been run
against the corpus yet (blocked on Anthropic credits).

### 1.6 Why the consistency penalty is now inert, and why that's correct

`score_claims.py` caps the consistency penalty at -1 (§5d of SCORING_SPEC.md)
when `num_contradictions > 0`. After Fix 1 + Fix 2, `num_contradictions` is
0 for every signal, so the penalty never fires. This is correct for the
current corpus: there are no cross-document contradictions to penalize, and
the 87% single-document coverage means the absence of contradictions is a
coverage property, not evidence of agreement. The penalty is not dead code;
it is dormant until the corpus has cross-document coverage.

---

## 2. Tier taxonomy: 4-tier → 3-tier propagation

### 2.1 Root cause

The v1.4 rubric (SCORING_SPEC.md §5) eliminated the "Moderate" tier:
three tiers on `arm_strength` (Strong / Emerging / Exploratory). The shared
type in `lib/substrate-helpers.ts` (`TierKey`) and the data layer were
corrected, but **17 components still carried local 4-tier definitions** —
local `TierKey`/`tierKey`/`TIER_ORDER`/`TIER_LABELS`/`TIER_RANK` constants
with a "moderate" entry, or local tier labels/counts. These shadowed the
shared helper and would have rendered a fourth tier (or a dead "moderate"
branch) once the flag flipped.

### 2.2 Fix (commits `020befb`, `6ef68e7`)

All 17 components fixed:

- **Server components** import `TierKey` from `@/lib/substrate-helpers`.
- **Client component `CandidateExplorer`** initially kept a local `tierKey()`
  with a WHY-comment, on the assumption that `.mjs` can't bundle for client
  components. Tested at runtime: the shared helper imports fine. The local
  copy was deleted (commit `6ef68e7`).
- **`lib/substrate-helpers.ts`:** `tierLc` return type corrected to
  `TierKey` (3-tier).
- **`lib/substrate-candidates.ts`:** `HomeConditionStat` interface corrected
  to 3-tier (no `moderate` field); initialization updated.
- **`app/signal-types/SignalTypesAccordion.tsx`:** prose "tops out at
  Moderate" → "tops out at Emerging".

Full per-component list in `lib/PRE-PUBLISH-CHECKLIST.md` sections 2 and 3.

### 2.3 Verification

`tsc --noEmit` passes. The 15-component checklist sections are marked
RESOLVED. Section 1 (TIER_CUTOFFS re-derivation) remains open and blocks the
flag flip.

---

## 3. The gate (`SIGNALS_PUBLISHED`) and its leaks

### 3.1 The gate

`lib/site-config.ts` defines `SIGNALS_PUBLISHED = false` — "NOT SAFE TO FLIP
YET — see PRE-PUBLISH-CHECKLIST.md". One flag gates every signal-rendering
route. While false, the site must not render v1.3 signal counts that will
change under the rescore, especially a "Strong-tier" count under a 3-tier
taxonomy that deleted "Moderate".

### 3.2 Three leaks found (Part 2 of the audit)

1. **`app/about/methodology/page.tsx`** rendered live signal counts
   (`getCandidates()`, `getSubstrateHomeData()`) ungated.
2. **`app/about/roadmap/page.tsx`** rendered a live signal count
   (`getCorpusScope()`) ungated.
3. **`app/sitemap.ts`** generated per-signal URLs (`getCandidates()`) ungated.

### 3.3 Fixes (commit `208ed3a`)

- **methodology:** `getCandidates()` and `getSubstrateHomeData()` gated
  behind `SIGNALS_PUBLISHED`. Signal counts render "pending revalidation"
  when gated. Protocol text stays visible; only live numbers are withheld.
  `home` may be null when gated — conditional rendering added.
- **roadmap:** `getCorpusScope()` gated. Signal count renders as null when
  gated; phase text omits the number. `buildPhases` parameter type widened to
  `number | null`.
- **sitemap:** `getCandidates()` gated. Per-signal URLs omitted when gated.
  Static and condition routes remain.

### 3.4 Re-check after fixes

Zero remaining callers of any signal-fetching function outside a
`SIGNALS_PUBLISHED` branch. `tsc --noEmit` passes. Flag still `false`.

---

## 4. Stale v1.3 language on visible pages (Part 1 of the audit)

Six files carried v1.3-era language that would mislead once the flag flips
(or misled even while gated, on pages that render regardless):

- `app/about/technical-architecture/page.tsx`: "Five-Dimension Scoring
  Framework" heading → "Four-Dimension". JSON-LD body with "Moderate-tier"
  prefixed with "(May 2026 audit, v1.3 era)" to read as historical.
- `app/access/preview/[signalId]/page.tsx`: "of 10" → "of 8".
- `app/featured/anastrozole-endometriosis/page.tsx`: comment "(strength
  0-10)" → "(strength 0-8)".
- `app/api/mcp/route.ts`: "five-dimension" → "four-dimension" (2 tool
  descriptions); Zod enum already 3-tier.
- `app/components/CandidateCard.tsx`: JSDoc "0–10" → "0–8", "five" → "four";
  moderate removed from tier badge labels.
- `docs/landscape-and-positioning.md`: "five 0–2 dimension scores" →
  "four".

All committed in `208ed3a`.

---

## 5. README claims audit (Part 3 of the audit)

The repo's self-account (README) was verified against the code. Of the
claims checked, **12 were supported** and **8 were stale or unsupported**.
The stale ones were fixed in `208ed3a`:

- Pipeline step 5: "five 0–2 dimension scores" → "four".
- Working-on section: "Strong / Moderate / Emerging / Exploratory" →
  "Strong / Emerging / Exploratory" (3-tier).
- §4 table: tier distribution and entailment figures dated "(v1.3,
  pre-rescore)" and "pending revalidation", matching the site's gating
  convention.
- Human-labels claim verified against `scripts/audit-output/2026-08-pre-validation/human-labels.json`:
  100 labels, 100 distinct claims, all from r1 (single rater), created
  2026-08-01, updated 2026-08-31. README's "100 human labels collected
  (rounds 1 and 2, single rater)" confirmed.

### 5.1 The case against the repo's self-account

What follows is the "case against" section from Part 3 of the audit,
preserved here so the reasoning is not lost when the README is later
rewritten. It argues against the repo's own account of itself, claim by
claim, with the file and line evidence. It is the record of what was
actually wrong, not a summary of what was fixed.

**Claim 1 — "five 0–2 dimension scores" (README §3, pipeline step 5).**
The v1.4 rubric has four scored dimensions (corroboration, rigor,
specificity, plausibility) plus a downgrade-only consistency penalty. The
README described five. This was the v1.3 scale leaking into the current
method's description. **Stale. Fixed.**

**Claim 2 — "Strong / Moderate / Emerging / Exploratory" (README §4,
working-on).** The v1.4 rubric has three tiers; "Moderate" was eliminated
(SCORING_SPEC.md §5). The README described four. **Stale. Fixed.**

**Claim 3 — "The Five-Dimension Scoring Framework" (technical-architecture
page heading).** Same four-vs-five error on a live page. **Stale. Fixed.**

**Claim 4 — JSON-LD "Moderate-tier" (technical-architecture page).** The
structured data described a tier that no longer exists in the taxonomy.
**Stale. Fixed** (prefixed as historical).

**Claim 5 — "of 10" (preview/[signalId] page).** The arm-strength scale is
0–8 under v1.4, not 0–10. **Stale. Fixed.**

**Claim 6 — "(strength 0-10)" (anastrozole-endometriosis page comment).**
Same 0–10 vs 0–8 error. **Stale. Fixed.**

**Claim 7 — "five-dimension" (MCP tool descriptions).** The MCP server
described a five-dimension rubric to external tools. **Stale. Fixed.**

**Claim 8 — "0–10" and "five dimensions" (CandidateCard JSDoc).** The
component's own documentation described the v1.3 scale. **Stale. Fixed.**

**Claims 9–20 — supported.** The remaining claims checked held up against
the code: the pipeline order (chunk → extract → verify → detect → score →
export), the two provenance modes (text vs structured render), the
exclusion of structured claims from entailment figures, the
anchor-and-corroborate headline derivation, the deterministic post-scoring
steps in Python, the hand-applied migrations, the single-flag gating of
signal routes, the 87% single-document coverage limitation, the inert
consistency penalty, the 3-tier taxonomy, the provisional TIER_CUTOFFS, and
the human-labels count. These are the claims the repo gets right, and they
are the ones it should keep saying.

**What cannot be verified without a human expert.** The audit could verify
what the code does and what the database holds. It could not verify the
medical substance: whether a tier assignment is clinically right, whether a
contradiction row reflects a real clinical disagreement, or whether the
single-document coverage hides undiscovered conflicts. Those are the
questions the validation study exists to answer, and it has not run. The
repo says so; the audit found no reason to soften that.

---

## 6. Diagnostic and driver scripts

### 6.1 `scripts/remap-snapshot-to-v14.py` (commit `75b221a`)

Re-runnable diagnostic that remaps the v1.3 scoring snapshot
(`lib/scoring-v13-snapshot.json`) onto the v1.4 four-dimension 0–8 scale
and reports penalty distribution, score frequency, and tier split under the
current `TIER_CUTOFFS`. Zero API credits. Used to establish that:

- **The consistency penalty is inert** (fires on 4 of 226 signals, 1.8%).
- **Half the corpus is capped at 6** (116 signals are single-source, so
  their arithmetic maximum on 0–8 is 6).
- **The top of the scale is structurally unreachable** (4 signals score 7,
  0–1 score 8).
- **The "pessimistic" scenario is NOT a lower bound** — assigning -1 to all
  174 signals at old consistency = 1 would double-penalize single-source
  rows whose rationale reads "n/a". Do not cite it as a bound.

### 6.2 `scripts/substrate/rescore.py` (commits `a42d732`, `1454880`, `a060e58`)

Four-stage driver enforcing the required rescore order:

```
1. re-extract claims      →  extract_claims.run()
2. re-run entailment      →  verify_provenance.run()
3. rebuild contradictions →  backup; DELETE FROM contradictions; detect_contradictions.run()
4. score signals          →  score_claims.run()
```

Safety properties:

- **Stage 3 is not optional and not idempotent with append.**
  `detect_contradictions.py` skips pairs that already have a row; without
  the DELETE, stale rows survive and `score_claims.py` reads contradictions
  computed against a claim set that no longer exists.
- **Backup before DELETE** (`1454880`): all existing rows written to a
  timestamped JSON in `scripts/audit-output/` before the DELETE.
- **`--dry-run`** (zero credits): lists candidate pairs without calling the
  NLI or modifying the database.
- **`--limit N` without `--i-know-this-deletes`** (`a060e58`): safe default.
  Does NOT delete the table. Runs `detect_contradictions.run(limit=N)`
  against the existing table. The cheapest way to test stage 3 should not
  also be the one that wipes the table.
- **`--limit N --i-know-this-deletes`**: destructive variant (backup +
  DELETE + regenerate with limit N).
- **`--restore-backup PATH`** (`a060e58`): reads a backup JSON, deletes
  existing rows, inserts the backed-up rows, prints the count, runs the
  integrity check.
- **`--check-integrity`** (zero credits): counts contradiction rows whose
  `claim_a` or `claim_b` is not currently entailed and provenance-verified.
  Should always be zero. As of 2026-09-04 it is **1** (the stale
  MHT/menopause row). Returns to zero after the next rescore runs stage 3.

Why no transaction: the DELETE and regeneration cannot be wrapped in a
single SQLite transaction because `detect_contradictions.run()` opens its
own connection and commits per contradiction. Safety relies on the JSON
backup. Full detail in `docs/rescore-runbook.md`.

---

## 7. Pre-publish checklist

`lib/PRE-PUBLISH-CHECKLIST.md` sits next to `lib/site-config.ts` so whoever
flips the flag sees it. Status:

- **Section 1 — TIER_CUTOFFS re-derivation: OPEN.** The current cutoffs
  (7.5 / 3.5) were set on the v1.3 lattice (0–10). On the v1.4 lattice
  (0–8), 7.5 means Strong requires a score of 8 — all four dimensions at
  maximum with no consistency penalty. The remap puts 0 signals at score 8
  (with penalty) or 1 (without). 3.5 is also wrong: the remapped mode is 4
  (54 signals), and rule (b) forbids a cutoff on or adjacent to a modal
  value. Blocked on the rescore.
- **Sections 2 and 3 — 15 components: RESOLVED.**
- **Follow-ups (noted, not blocking):** `app/globals.css` unused
  `--tier-moderate` rules; `lib/corpus-query.ts` `moderate: 0` bucket
  (gated, machine-facing, reads v1.3 snapshot values).

---

## 8. What remains before the flag can flip

1. **Run the rescore** (blocked on Anthropic credits) in the required order.
2. **Re-derive TIER_CUTOFFS** on the post-rescore lattice following
   SCORING_SPEC §5b rules (a) and (b); freeze them in
   `lib/substrate-helpers.mjs`.
3. **Run detector v2** against the corpus (3 NLI calls, cheap) and inspect
   the rejection log.
4. **Independent GRADE methodologist review** — gates the rubric.
5. **Re-run test-retest** with temperature=0.0 (blocked on credits).
6. Flip `SIGNALS_PUBLISHED` to true.

The flag is not safe to flip until TIER_CUTOFFS is re-derived. Nothing in
this log changes that.
