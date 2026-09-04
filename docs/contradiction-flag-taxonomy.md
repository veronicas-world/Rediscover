# contradiction_flag taxonomy

## What the flag is

`contradiction_flag` is a boolean column on `substrate_signals`. It is set to
`true` when `num_contradictions > 0` — that is, when the `contradictions` table
contains at least one row for the same `(intervention_id, condition_id)` pair.

The `contradictions` table is populated by `detect_contradictions.py`, which
compares **efficacy claims only** (aspect = 'efficacy', entailment = 'entailed')
within each `(intervention, condition)` group, looking for pairs with
conflicting directions (positive vs negative, positive vs null, negative vs
null), and confirming each candidate with an NLI check (score >= 0.6).

The flag is written by `scripts/substrate/score_claims.py` line 582:
`1 if nco > 0 else 0`, where `nco = _num_contradictions(conn, iv, cd)` counts
rows in `contradictions WHERE intervention_id=? AND condition_id=?`.

## The three things the flag conflates

The flag counts ALL contradiction rows for the drug/condition pair, regardless
of which signal's sources they come from. The contradiction detection only
compares efficacy claims, but the penalty is applied to ALL signals for the
pair, including safety and "other" aspects. This means the flag conflates
three distinct things:

### 1. Direction disagreement between sources on one outcome (2 of 7)

Two efficacy claims about the same drug/condition have conflicting directions
(positive vs negative or null), confirmed by NLI as a genuine contradiction.

This IS what the v1.4 consistency penalty rule asks about: "mixed direction
across sources" (penalty -1) or "direct conflict on the primary outcome"
(penalty -2).

**Example:** `anti-androgens + lifestyle / PCOS / direct / efficacy`
— rationale: "Results are mixed: anti-androgens + lifestyle were superior to
metformin + lifestyle for hirsutism and SHBG but NOT superior to placebo +
lifestyle for the same outcomes."

**Count:** 2 of 7 flagged signals.

### 2. Benefit-versus-harm across outcomes for the same drug (3 of 7, all MHT/menopause)

The drug has beneficial effects on some outcomes (e.g., vasomotor symptom
relief, fracture reduction) and harmful effects on others (e.g., stroke,
VTE). The contradiction detection compares efficacy claims across ALL
outcomes for the same drug/condition — a claim saying "MHT reduces
vasomotor symptoms" (positive) can be flagged against a claim saying "MHT
does not improve cognitive function" (null). These are different outcomes,
not source disagreement on the same outcome.

The v1.4 consistency rule asks about direction agreement **for a given
outcome**. Sources can agree on every individual outcome (penalty 0) while
the drug still has a contradiction flag because some outcomes are beneficial
and others are not.

**Example:** `menopausal hormone therapy / menopause / direct / safety`
— rationale: "Two independent reviews agree on direction: MHT increases
stroke risk... Findings are concordant across sources for the principal
harms." Sources agree on direction for the safety outcome, but the flag is
set because of a contradiction between efficacy claims about different
outcomes for the same drug.

**Count:** 3 of 7 flagged signals.

### 3. Cross-signal or cross-aspect tension (2 of 7)

The contradiction is between different signals for the same drug/condition,
not between sources within one signal. The `_num_contradictions` function
counts ALL contradiction rows for the `(intervention_id, condition_id)` pair,
so a contradiction between two efficacy claims affects the `contradiction_flag`
on the safety signal and the community signal for the same pair, even though
those signals' own sources agree.

**Example:** `metformin / PCOS / direct / safety` — rationale: "Only a single
source is provided, so directional consistency across studies cannot be
assessed and is scored as n/a (1)." The safety signal has one source and
cannot have direction disagreement, but it inherits the flag from a
contradiction between efficacy claims for metformin/PCOS.

**Count:** 2 of 7 flagged signals.

## How the flag is used

### Scoring (arm_strength)

`score_claims.py` line 519-520:
```python
nco = _num_contradictions(conn, iv, cd)
if nco > 0:
    dims["consistency"] = min(dims["consistency"], -1)
```

The flag DOES feed `arm_strength` through the consistency penalty. When
there are any contradiction rows for the drug/condition pair, the consistency
score is capped at -1. Since `arm_strength = max(0, sum(dims.values()))`,
this reduces arm_strength by at least 1.

In the v1.3 run, the old code capped consistency at 1 (not -1), so signals
already at consistency = 1 paid nothing. In the v1.4 rescore, the new code
sets consistency = min(consistency, -1), which is a 2-point drop for signals
currently at consistency = 1.

**Scoring bug:** The penalty is applied to ALL signals for the
drug/condition pair, including safety and "other" aspects whose own sources
agree on direction. MHT/menopause/direct/safety will be scored down in the
v1.4 rescore for a contradiction between efficacy claims, even though the
safety signal's sources agree that MHT increases stroke risk.

### Display (gated)

`CandidateCard.tsx` line 601:
```tsx
{c.arms.some((a) => a.contradictionFlag) && (
  <span className="m" style={{ color: "var(--brick)" }}>
    <b>⚠ Contradiction</b>
  </span>
)}
```

`CandidateCard.tsx` line 220-222 (RelBadge):
```tsx
const labels = { supports: "Evidence supports",
                 contradicts: "Contradiction present",
                 silent: "Evidence silent" };
```

`conditions/[slug]/substrate/page.tsx` lines 246-294: renders a
"Contradictions surfaced" count and list from the `contradictions` table.

All on gated pages (candidates, featured, access/preview,
conditions/[slug]/substrate).

### Ranking/sort

`contradiction_flag` does NOT feed ranking or sort order. The sort uses
`negLast` which is based on `documentedNegative` (from
`negativeNote`/`negativeEvidence`), not `anyContradiction`.

## Where the flag gets set

**Writer:** `scripts/substrate/score_claims.py`
- `_num_contradictions(conn, iv, cd)` counts rows in `contradictions` for
  this `(intervention_id, condition_id)` pair
- `1 if nco > 0 else 0` writes `contradiction_flag`
- `nco` writes `num_contradictions`

**Detection:** `scripts/substrate/detect_contradictions.py`
- Only compares efficacy claims (aspect = 'efficacy', entailment = 'entailed')
- Only compares claims with conflicting directions (positive vs
  negative/null)
- NLI check confirms genuine contradiction (score >= 0.6)
- Records in `contradictions` table

**What it tests at write time:** "Are there any rows in the `contradictions`
table for this drug/condition pair?" It does NOT test direction agreement
within this signal's own sources. It tests whether ANY two efficacy claims
for this drug/condition have been flagged as contradicting each other by the
NLI check.

## Summary

| Thing the flag conflates | Count | v1.4 consistency? | Scoring impact |
|---|---|---|---|
| Direction disagreement on one outcome | 2/7 | Yes — this is what the rule asks about | Correct penalty |
| Benefit-vs-harm across outcomes | 3/7 | No — sources agree on each outcome | Incorrect penalty |
| Cross-signal/cross-aspect tension | 2/7 | No — signal's own sources agree | Incorrect penalty |

The flag fires on 7 of 226 signals. Only 2 of those 7 are what the v1.4
consistency rule asks about. The other 5 are measuring something different.
The rescore will apply the -1 consistency penalty to all 7, penalizing 5
signals for something that is not direction disagreement.
