# Whel entailment-judge validation study — PROTOCOL v2 (DRAFT, pre-registration)

Status: **draft, revised after external audit. Not yet executed. No data collected under it.**
Drafted 2 Aug 2026. Revised 2 Aug 2026 following two independent methodological audits.

The point of writing this before running anything is that every analysis decision
made after seeing results is a decision that can be tuned toward a flattering
answer. This document fixes those decisions in advance.

**Changes from v1, all of them corrections:**

1. v1 named recall of the rare class as the primary endpoint and justified it as
   "invariant to the stratification." That is **false**. Simulation with a
   built-in truth of recall 0.50 / precision 0.70 returns naive recall of 0.51 at
   no enrichment and 0.72 at 4x, while precision returns 0.699 / 0.698. Recall
   inflates with enrichment; precision does not. Primary endpoint changed.
2. v1 proposed enriching the rare class 4x at N=150. The rare class contains
   about 11–20 items in total, so that allocation does not exist. Census instead.
3. v1 treated claims as independent. They are not: 295 claims come from 48 source
   documents, the largest contributing 25. Analysis is now clustered by document.
4. v1 did not account for R1 having already labelled 99 claims in the frame.

---

## 1. Object of measurement

An automated entailment judge assigns each claim one of three labels:

| label | meaning |
|---|---|
| `entailed` | the stored verbatim quote supports the claim |
| `neutral` | the quote neither supports nor contradicts it |
| `contradicted` | the quote asserts the opposite |

**Question this study answers:** of the claims this database publishes as
supported, what fraction would a qualified human say are not supported by the
quote attached to them?

**Question it does NOT answer:** whether the claims are true, or whether the
sources are good. Only whether the quote supports the claim.

**Framing.** This is a diagnostic accuracy study (index test = the judge,
reference standard = adjudicated human label), reported against STARD 2015 and
STARD-AI, with a nested reliability study (human vs human) reported against
GRRAS. v1 conflated the two.

## 2. Model under test, pinned

| | |
|---|---|
| model | `claude-sonnet-5`, exact snapshot recorded at run time |
| prompt | `verify_provenance/v2-declared-context`, full text in appendix |
| sampling | 3 draws, majority label; ties resolved to the weaker reading |
| post-check | lexical prefilter → focused sufficiency adjudicator (same model) |

The device under test is the **whole pipeline including the post-check**, since
that is what determines what appears on the site.

## 3. Raters

| | who | independent of build? | prior exposure |
|---|---|---|---|
| R1 | Veronica Agudelo, who built the database | **No** | **99 claims in the current frame already labelled**, 5 of them revised after unblinding |
| R2 | physician (DO) with qualitative and clinical research experience in perinatal psychiatry (NIMH- and PCORI-funded studies, 60+ semi-structured interviews, 40+ structured clinical interviews) | **No** (familial relationship to R1 — disclosed conflict of interest) | none |

R1's prior exposure is disqualifying for those 99 items and they are excluded
from R1's primary analysis. **R2's labels are the primary reference.** R1's are
reported as a secondary comparison and as a measure of author bias.

**Conflict of interest disclosure.** R2 is R1's mother. This is disclosed here
and in any published result. The familial relationship does not affect whether
the rubric produces consistent scores (the reliability question), but it does
affect the credibility of the inter-rater agreement number to external readers.
If the result is intended for publication, an independent R2 with no
relationship to R1 should be recruited. If the result is for internal
validation only (testing whether the rubric is usable before investing in a
formal study), the familial R2 is acceptable with the disclosure.

## 4. Materials shown to a rater

Identical to what the judge receives, no more and no less: the CONTEXT block
(source, title, subreddit where applicable, condition on record), the QUOTE, and
the CLAIM. Same interface for both raters.

## 5. Codebook

Frozen before scored labelling begins, versioned, dated. Applied as an ordered
decision tree:

1. Does the QUOTE name the intervention the claim is about? (a brand name,
   abbreviation, or unambiguous referent counts) — if no, `neutral`.
2. Does the QUOTE name the comparator, if the claim asserts one? — if no, `neutral`.
3. Does the QUOTE state the outcome the claim asserts? — if no, `neutral`.
4. Does the QUOTE state the direction of effect, including "no difference"? — if
   no, `neutral`.
5. Is the population qualifier satisfied, either by the QUOTE or by CONTEXT? —
   if no, `neutral`.
6. Does the QUOTE assert the opposite direction to the claim? — if yes,
   `contradicted`.
7. Otherwise `entailed`.

**Rules that v1 left unspecified and that this corpus will hit:**

- A null result ("no significant difference") against a claim of benefit is
  `contradicted`, not `neutral`. A claim of benefit against a quote that reports
  only that something was studied is `neutral`.
- A visibly truncated quote is judged as it stands. Do not mentally complete it.
- Degree words matter: "improved" does not support "significantly improved".
- A conjunctive finding ("both A and B improved X") supports a claim about A alone.
- A claim with two components, only one supported, is `neutral`.
- A quote from an abstract's Conclusions is an author interpretation. Treat it as
  a finding only if it states one.
- Reddit and ClinicalTrials.gov sources are judged by the same tree. A trial
  registration states what will be studied, not what was found.

Every item requires a **one-line free-text rationale**. This is the raw material
for adjudication and disagreement analysis.

The judge's prompt carries the identical decision tree. If the codebook changes,
the prompt changes with it, or the comparison is unfair to the judge.

## 6. Calibration phase (discarded)

- **30 items** drawn from the frame, stratified the same way, then **permanently
  excluded** from the scored set. IDs recorded in advance.
- Both raters label independently, then meet and reconcile every disagreement
  against the codebook. **R2 states her reading first**, since R1 wrote the codebook.
- Clarifications are recorded as a dated appendix. **The decision tree itself does
  not change after this point.**
- Calibration agreement is reported, not discarded, since the gap between
  calibration and scored agreement measures how learnable the codebook is.
- **Gate:** if calibration agreement is below 70% raw, run a second calibration
  round rather than proceeding.

## 7. Sampling

- **Frame:** claims behind active signals, LLM-extracted (`model_name =
  claude-sonnet-4-6`), provenance-verified, carrying an entailment label.
  Template-rendered rows (`pathway-render/*`) excluded as circular. Frame frozen
  by timestamp and its size recorded before sampling.
- Current frame: **295 claims from 48 source documents.** Distribution as of the
  last complete scoring pass: 212 `entailed`, 11 `neutral`, 72 awaiting re-score.
  **Stratum sizes are re-derived after the re-score and before N is fixed.**
- **Allocation:**
  - `neutral` stratum: **census**. Take all of them. There are too few to sample.
  - `entailed` stratum: simple random sample, document-clustered (see §9).
  - Rationale: the errors that matter to a reader live in the `entailed` stratum,
    and the `neutral` stratum is too small to sample from at all.
- Both raters label the same items, in independently randomised order.

## 8. Endpoints, fixed in advance

**Primary: false omission rate**, `P(human = neutral | judge = entailed)`.
Estimated entirely within the `entailed` stratum, so it is genuinely unaffected
by the allocation. This is the reader-facing risk: of the claims the site
publishes as supported, how many are not. Wilson interval, document-clustered.

**Co-primary: precision on `neutral`**, `P(human = neutral | judge = neutral)`.
Estimated within the `neutral` stratum. Also allocation-invariant.

**Secondary, all reported as estimation rather than hypothesis tests:**

1. Human-vs-human raw agreement and Cohen's kappa — **the reliability ceiling**.
   Without it no human-machine figure has a reference point.
2. Design-weighted corpus kappa, Horvitz-Thompson, document-clustered bootstrap.
   Reported with its honest width and labelled under-powered.
3. Ratio of human-machine to human-human agreement.
4. Full confusion matrices, unweighted, strata identified.
5. Prevalence and bias indices (Byrt, Bishop & Carlin 1993) and p_pos / p_neg
   (Feinstein & Cicchetti 1990), because 95/5 marginals guarantee the kappa paradox.
6. Judge test-retest across 5 re-runs at fixed settings. Costs no human time.
7. Intra-rater agreement, both raters, on a re-shown 15% at ≥2 weeks, unflagged.

**Reported alongside every agreement figure:** a judge answering `entailed` to
everything scores about 95% on this corpus.

## 9. Analysis

- **Clustering is the dominant variance issue and v1 ignored it.** 295 claims
  come from 48 documents, mean 6.1 per document, max 25; the top five documents
  hold 34% of all claims. At an ICC of 0.2 a nominal n=150 behaves like n≈74.
  **All bootstraps resample source documents, not claims.** With 48 clusters this
  is the few-clusters regime, so a wild cluster bootstrap is preferred to a naive
  pairs bootstrap.
- Report the claims-per-document distribution and the estimated ICC as results.
- Finite population correction applied: the sample is a large fraction of a small
  frame.
- **`skip` handling, pre-specified:** primary analysis counts a skip as a
  disagreement; sensitivity analysis excludes them; skip rate reported per rater
  and per stratum; raters record a reason. A skip rate above 10% for either rater
  is a protocol deviation and is reported as such.
- No multiplicity adjustment; secondaries are estimation only.

## 10. Adjudication

Where R1 and R2 disagree, both view the item together and record a consensus
label. **The machine label stays hidden during adjudication.** Where consensus is
not reached, R2's label stands, since R1 built the system. Consensus labels form
the reference standard for the accuracy endpoints. They are **never** used to
recompute inter-rater reliability, which is by definition a pre-adjudication
quantity. Both original labels and the consensus label are published per item.

## 11. Decision rule, fixed in advance

Stated before any data is seen, so the interpretation cannot be tuned afterwards:

- False omission rate **≤ 5%**: the judge is fit for the site as it stands.
- **5–15%**: publishable with the rate stated prominently beside the entailment figure.
- **> 15%**: the entailment figure is withdrawn from the site until fixed.

## 12. Functional check on `contradicted`

The judge has never emitted `contradicted` across the entire corpus. A three-way
instrument with a class that has never fired is a two-way instrument with an
untested branch. **20 adversarial items** are constructed where the quote plainly
contradicts the claim, and the judge is run on them. Reported separately as a
functional check, not folded into any estimate.

## 13. Known limitations, stated up front

1. R1 built the system and has already seen 99 claims in the frame.
2. Two raters, both recruited personally; the study estimates agreement with
   these two people, not with "expert clinicians" generally.
3. 48 source documents is the real unit of generalisation, not 295 claims.
4. The judge and the claim extractor are the same model family, so their errors
   are correlated. Majority-of-three reduces variance, not this bias.
5. Some NLI disagreement is irreducible (Pavlick & Kwiatkowski 2019); the
   human-human ceiling is a floor on what is achievable, not a target.
6. Prediction-powered inference was considered and rejected: at a labelled
   fraction above roughly 0.2 it has higher variance than simply analysing the
   labelled items, and here the fraction would be about 0.5.

## 14. Reporting

GRRAS (reliability), STARD 2015 + STARD-AI (accuracy), and the LLM-judge
reporting items: judgment scale, abstention handling, coverage, confusion matrix,
aggregation level. Item-level ratings, both raters' labels, machine labels,
strata, weights, the full prompt, the analysis code and the RNG seed are
published with the result.
