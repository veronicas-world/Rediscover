# Validation study — methods section (draft)

Drafted from the pre-registered protocol (`docs/validation-protocol-DRAFT.md`).
Methods are locked by pre-registration; this draft puts them in paper form for
the institutional pitch and for rapid write-up once results are available.
Results and discussion are not drafted — the study has not run.

## Object of measurement

An automated entailment judge assigns each claim in the Whel database one of
three labels: entailed, neutral, or contradicted. The judge is a language model
(Claude Sonnet 4.6) operating under a published prompt with majority-of-three
voting and a lexical sufficiency guard. The same model family extracted the
claims, so the entailment rate is a self-consistency metric, not independent
verification.

This study measures the gap between the judge's labels and expert human
judgment. It is a diagnostic accuracy study (index test = the judge, reference
standard = adjudicated human label), reported against STARD 2015 and STARD-AI,
with a nested reliability study (human vs human) reported against GRRAS.

## Raters

Two raters:

- **R1** (Veronica Agudelo): built the database; not independent of the system
  under test. 99 claims in the current frame were already labelled in earlier
  rounds; these are excluded from R1's primary analysis.
- **R2** (licensed psychiatrist, MD, published in women's health): no prior
  exposure to the system. R2's labels are the primary reference standard.

R1's labels are reported as a secondary comparison and as a measure of author
bias.

## Materials

Each rater sees the CONTEXT block (source, title, subreddit where applicable,
condition on record), the QUOTE (verbatim passage from the source), and the
CLAIM (the atomic assertion extracted from the quote). The machine's label is
hidden until after the rater's judgment is recorded. Both raters use the same
interface (`scripts/label-claims.py`) and see identical materials.

## Codebook

A seven-step decision tree, frozen before scored labelling:

1. Does the quote name the intervention? If not, neutral.
2. Does the quote name the comparator, if the claim asserts one? If not, neutral.
3. Does the quote state the outcome? If not, neutral.
4. Does the quote state the direction of effect? If not, neutral.
5. Is the population qualifier satisfied (by the quote or by CONTEXT)? If not,
   neutral.
6. Does the quote assert the opposite direction? If so, contradicted.
7. Otherwise, entailed.

Specified rules for edge cases: a null result against a claim of benefit is
contradicted; a truncated quote is judged as it stands; degree words matter
("improved" ≠ "significantly improved"); a conjunctive finding supports a
claim about either component alone; a claim with two components, only one
supported, is neutral.

## Calibration phase (discarded)

30 items drawn from the frame, stratified the same way as the scored set, then
permanently excluded. Both raters label independently, then meet and reconcile
every disagreement against the codebook. R2 states her reading first. Gate: if
calibration agreement is below 70% raw, a second calibration round runs before
proceeding.

## Sampling

The frame is all claims behind active signals, LLM-extracted, provenance-
verified, carrying an entailment label. Template-rendered claims (pathway-
render/*) are excluded as circular. Frame frozen by timestamp; size recorded
before sampling.

Current frame: 295 claims from 48 source documents. Distribution: 273
entailed, 22 neutral, 0 contradicted.

Allocation:

- Neutral stratum: census (take all 22).
- Entailed stratum: simple random sample, document-clustered.
- Both raters label the same items, in independently randomised order.

## Endpoints

**Primary**: false omission rate — P(human = neutral | judge = entailed).
Estimated within the entailed stratum. Wilson interval, document-clustered
bootstrap.

**Co-primary**: precision on neutral — P(human = neutral | judge = neutral).
Estimated within the neutral stratum.

**Secondary**: human-vs-human raw agreement and Cohen's kappa (the reliability
ceiling); design-weighted corpus kappa (Horvitz-Thompson, document-clustered
bootstrap); ratio of human-machine to human-human agreement; full confusion
matrices; prevalence and bias indices (Byrt, Bishop & Carlin 1993); p_pos /
p_neg (Feinstein & Cicchetti 1990); judge test-retest across 5 re-runs;
intra-rater agreement on a re-shown 15% at ≥2 weeks.

## Adjudication

Where R1 and R2 disagree, both view the item together and record a consensus
label. The machine label stays hidden. Where consensus is not reached, R2's
label stands. Consensus labels form the reference standard for the accuracy
endpoints. They are never used to recompute inter-rater reliability.

## Decision rule

Stated before any data is seen:

- False omission rate ≤ 5%: the judge is fit for the site as it stands.
- 5–15%: publishable with the rate stated prominently beside the entailment
  figure.
- > 15%: the entailment figure is withdrawn from the site until fixed.

## Analysis

All bootstraps resample source documents, not claims (48 clusters, mean 6.1
claims/document, max 25). Wild cluster bootstrap preferred to naive pairs
bootstrap in the few-clusters regime. Finite population correction applied.
Skip handling: primary analysis counts a skip as a disagreement; sensitivity
analysis excludes them; skip rate reported per rater and per stratum.

## Scoring layer test-retest (pre-registered addition, August 2026)

The five 0–2 dimension scores that determine every tier on the site are
produced by a single LLM call per signal group. Before any human validation of
the scoring layer, we measured the scoring layer's stability across repeated
runs on the same inputs.

Method: 50 active signals sampled, each scored 3 times with the same model
(Claude Sonnet 4.6), same prompt, same claims. Dimension scores, derived
tiers, synthesis summaries, and structured facts compared across runs.

Result: tier agreement 58.5% (24/41 stable). Median arm_score spread across
runs was 1.00 point out of 10 (max 2.00). Corroboration was 100% stable
(deterministically capped by document count). Plausibility (75.6%) and
specificity (78.0%) were the least stable dimensions. Synthesis summaries
were identical in 2.4% of cases. Structured facts were stable in 75.6%.

The 58.5% tier-stability figure must be read alongside the median spread. The
model wobbles by about 1 point on a 0–10 scale. The tier system turns that into
a category change because the bands are 2.0–2.5 points wide with hard
thresholds. Every tier flip in the test was a boundary crossing (8.0→7.0
across the Strong cutoff, 3.0→4.0 across Emerging, 7.0→5.2 across Moderate),
not a wholesale disagreement about evidence quality. The deterministic
backstops (corroboration ceiling, community independence) are stable; the
model-assigned dimensions are not.

A subsequent run with temperature pinned to 0.0 (the original pass used
temperature=None, a workaround for Opus 4.8 that left Sonnet sampling at the
API default of 1.0) is pending API credit replenishment. If temperature
pinning reduces the median spread, the noise band narrows and fewer signals
span.

This is a live-site finding, not just a study-design one. The tiers currently
published on whel.bio are one draw from this distribution. A signal displayed
as "Strong" may score 7.0 on a re-run — still strong evidence, but not the
tier the badge claims. The noise-band spanning display (showing
"strong–moderate" when the score is within the measured noise band of a
cutoff) makes this uncertainty visible to the reader rather than hiding it
behind a false-precision badge.

## What the scoring rubric consists of at validation time

Stated explicitly because a reader who is told the model scores "five dimensions"
will assume five working dimensions and form a false picture of what was
validated. Measured over the 226 active signals in the corpus being validated,
the rubric has:

- **Three working dimensions** — rigor, specificity, plausibility. These carry
  the discrimination.
- **One corpus-limited dimension** — corroboration. **186 of 226 signals (82%)
  rest on a single source document, and 207 of 226 (92%) therefore cannot exceed
  a corroboration score of 1 as arithmetic on the corpus, before any judgement is
  applied.** Five signals have ever scored 2. For the great majority of the
  corpus this dimension is measuring **how many sources were ingested for that
  drug–condition pair, not whether the finding replicated.** Those two things
  coincide only once ingestion is complete, and it is not.
- **One downgrade-only penalty term** — consistency. It cannot raise a score
  (SCORING_SPEC v1.4 §5d), and 89% of signals carry no penalty, so it contributes
  almost no variance.

That is what is being validated. It is not five independent dimensions.

**The sequencing tension, stated rather than discovered later.** Fixing
corroboration requires ingestion breadth, and coverage expansion is deliberately
sequenced *after* validation — validating a smaller corpus first is the right
order, because expanding coverage before knowing whether the extraction layer is
trustworthy would multiply an unmeasured error rate. The consequence is that this
study measures a rubric with one structurally dead dimension. That is a known and
accepted limitation of validating at this stage, not an oversight, and it bounds
what a positive result licenses: it would support the claim that the *extraction
and entailment* layer is sound, not that the five-dimension score is
well-discriminating.

## Limitations

1. R1 built the system and has already seen 99 claims in the frame.
2. Two raters, both recruited personally.
3. 48 source documents is the real unit of generalisation.
4. The judge and the claim extractor are the same model family; their errors
   are correlated. Majority-of-three reduces variance, not this bias.
5. Some NLI disagreement is irreducible (Pavlick & Kwiatkowski 2019).
6. The scoring layer is unstable across runs (see above).
7. The rubric under validation has three working dimensions, not five (see
   above). Corroboration is capped at ≤1 for 92% of signals by single-source
   ingestion and is effectively binary; consistency is a downgrade-only term
   that is inactive for 89% of signals. Any claim about the *scoring* layer's
   discrimination is bounded by this, independently of how the entailment
   endpoints come out.
