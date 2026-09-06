# Where Whel sits in drug repurposing

Research note, 2026-08-30. Compiled from two independent research passes, both
held to a verify-or-flag standard. Sources are linked; anything unverified is
marked as such. This exists so the project builds toward the field rather than
beside it.

---

## 1. Three roles AI plays in this project, and why the distinction matters

Conflating these is the single easiest way to misdescribe Whel, to a reviewer
or to yourself.

**AI as builder.** Claude and Droid wrote most of this codebase. That is
authorship. It is checkable by reading the code, and the code behaves the same
way on every run. It does not appear in the output.

**AI as judge inside the pipeline.** There are exactly four LLM call sites:

| file | what the model decides |
|---|---|
| `scripts/substrate/extract_claims.py` | what counts as a claim, and which sentence supports it |
| `scripts/substrate/verify_provenance.py` | entailed / neutral / contradicted |
| `scripts/substrate/detect_contradictions.py` | whether two claims conflict |
| `scripts/substrate/score_claims.py` | the four 0–2 dimension scores, plus extracted facts (`% female`, sample size) |

Everything downstream is deterministic Python: `female_band`,
`apply_imprecision`, `tier_for`, `community_independence`,
`corroboration_ceiling`, plus character offsets and verbatim quote location.

This is epistemic, not merely operational. It is *in the output*. It cannot be
verified by reading the code, only by validating results against human
judgement. That is what the validation study exists for.

**AI as the product claim.** Whel does not claim an AI discovers drugs. It
claims an AI assembled and graded existing evidence, with the sentence attached
so a reader can check. That is a deliberate and defensible position, and it
should stay explicit.

---

## 2. What the field actually does

Six method families, distinguished mostly by what they take as ground truth.

| family | representative systems | core limitation |
|---|---|---|
| Knowledge-graph link prediction | [Hetionet/Rephetio](https://doi.org/10.7554/eLife.26726), [PrimeKG](https://doi.org/10.1038/s41597-023-01960-3), [TxGNN](https://doi.org/10.1038/s41591-024-03233-x), [Every Cure MATRIX](https://github.com/everycure-org/matrix) | degree bias; a degree-only null model nearly matches SOTA on standard benchmarks ([arXiv:2405.14985](https://arxiv.org/abs/2405.14985)) |
| Transcriptomic signature reversal | [CMap / LINCS L1000](https://doi.org/10.1101/136168) | 81% of transcripts are imputed, not measured; cell context rarely matches disease tissue |
| Structure-based / docking | [CANDO](https://doi.org/10.1016/j.drudis.2021.08.002) | "docking scores often correlate poorly with experimental binding affinities" ([PMC12766319](https://pmc.ncbi.nlm.nih.gov/articles/PMC12766319/)) |
| Mechanism / genetics | Open Targets | target plausibility is not indication efficacy |
| Real-world evidence / EHR | [STEDR](https://doi.org/10.1145/3690624.3709418), target trial emulation | confounding by indication; channelling bias |
| Literature-based discovery | SemRep/SemMedDB, SKiM | SemRep recall is 0.42; co-occurrence cannot distinguish support from refutation |

**One finding worth internalising.** [Minikel et al., *Nature* 2024](https://doi.org/10.1038/s41586-024-07316-0)
report that drug mechanisms with genetic support succeed 2.6× more often, and
that the advantage "improves with increasing confidence in the causal gene, but
is largely unaffected by genetic effect size." *Confidence in the evidence
predicts success; the size of the effect does not.* That is close to a direct
empirical argument for evidence grading.

---

## 3. The translation gap, and why it matters here

Computational repurposing produces many predictions and few approved drugs.

- A PRISMA review of validation practice ([Pillai & Wu](https://cdr.lib.unc.edu/downloads/n009wg54k))
  screened 732 papers at full text and **excluded 603 for containing no
  experimental validation at all**. Roughly 3–4% carry wet-lab work.
- **166 studies used literature support as their sole validation**, making
  literature search "the most prevalent method of validation" in the field.
- The field's own reviewers are scathing about how that is done. Schuler et al.
  ([PMC10014214](https://pmc.ncbi.nlm.nih.gov/articles/PMC10014214/)): "It is
  relatively easy with this approach to find examples that support preformed
  conclusions, and report only those... **Selective literature corroboration is
  neither systematic nor hypothesis driven.**"
- The rigorous version — an expert literature survey with quality assessment —
  appeared in **2 of 732 papers**.
- [NHS England suspended its national Medicines Repurposing Programme](https://www.england.nhs.uk/medicines-2/medicines-repurposing-programme/)
  in April 2025, concluding that "**Very few repurposed medicines have a strong
  enough evidence base to support a licence variation.**" Contested in
  [*BMJ* 2025;390:r1309](https://doi.org/10.1136/bmj.r1309), but the tension
  stands: the binding constraint was evidence quality, not hypothesis supply.
- The economics explain the gap. [NBER WP 34222](https://doi.org/10.3386/w34222):
  where IP is unenforceable, "research investment and commercialization nearly
  cease." The EMA says the same in plainer words: marketing authorisation
  holders "lack the incentives or the commercial interest."

**Implication.** Nobody is paid to assemble the evidence case for an off-patent
drug in a new indication. That is the gap Whel occupies, and it is a documented
gap rather than an assumed one.

---

## 4. The open slot: graded certainty of evidence

Across everything verified, **no drug-repurposing platform applies GRADE or any
certainty-of-evidence scale to drug–disease pairs.**

- ChEMBL uses maximum clinical phase.
- Open Targets explicitly disclaims that its association score is a confidence
  score.
- Every Cure's tiers grade *what is needed next*, not *how certain the evidence
  is*.
- [ReDO_DB](https://data.tp53.org.uk/redo_db.php) (373 drugs) uses a boolean
  flag matrix across study types, with no certainty scale and no quotes.

Formal evidence grading exists in precision oncology and in evidence-based
medicine. It has not been transplanted into repurposing.

**The design to copy is [CIViC](https://doi.org/10.1038/ng.3774)'s two axes**:
an Evidence Level describing study-type robustness, and a separate Evidence
Rating that, in their words, "does not rate the journal, publication, or
Evidence Source itself, but instead evaluates in isolation the components of
evidence extracted from the Evidence Source." Note that CIViC's statements are
curator-authored summaries, not verbatim quotes.

[Boca et al., *JCO Precision Oncology* 2018](https://doi.org/10.1200/PO.17.00175)
frame the whole question: systematic review and biocuration "must come
together... instead of continuing to proceed on parallel paths." Whel is
describable as exactly that convergence, applied to repurposing.

---

## 5. Where Whel is not ahead

Important to know before claiming novelty.

**Character offsets are standard, not novel.** BioC and
[PubTator 3.0](https://academic.oup.com/nar/article/52/W1/W540/7640526) are the
canonical infrastructure. Anthropic's Citations API returns the same structure
(`cited_text`, `start_char_index`, `end_char_index`). Framing offsets as
innovative loses credibility in one sentence. The defensible claim is narrower:
preserving offsets *through an entailment check into a graded output*.

**Claim-plus-evidence display already ships commercially.**
[Nested Knowledge](https://about.nested-knowledge.com/docs/artificial-intelligence-in-nested-knowledge/)
has Insight → Claim → Evidence with highlighted supporting text, plus AI
first-pass risk-of-bias assessment that a human verifies.

**The scoring layer is more aggressive than any comparator.** Every serious
system draws the line in the same place — models answer local, evidence-anchored
questions; deterministic code or a human aggregates:

- [ROBoto2](https://arxiv.org/abs/2511.03048): LLM answers signaling questions,
  code implements the RoB2 flowchart.
- [GRADErater](https://gradeai.med.up.pt/about/) automates only the domains
  derivable from meta-analytic inputs and **explicitly declines** per-study risk
  of bias and indirectness. All ratings human-modifiable.
- Nested Knowledge: AI first pass, "which a human reviewer then verifies."
- Trialstreamer: RoB model was well calibrated (Brier 0.10, c-stat 0.80) but
  F1 0.45, so the authors used it **only to rank**, never to label.

Whel's five dimension scores are LLM-assigned with no human verification step.
That is outside the consensus and must be disclosed prominently, not buried.
The [RAISE recommendations](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.ED000178/full),
endorsed jointly by Cochrane, Campbell, JBI and CEE in 2025, require it: "Any
use of AI or automation that makes or suggests judgements should be fully and
transparently reported."

---

## 6. What the ceiling actually looks like

[ROBoto2](https://arxiv.org/abs/2511.03048) is the closest published benchmark
to Whel's scoring layer, and the numbers set expectations honestly.

- Best model, Claude 3.5 Sonnet with full paper context: **micro-F1 0.71**. The
  authors call this "considerable room for improvement."
- **Human expert-to-expert agreement was Cohen's κ = 0.40.** Any single-rater
  gold standard is itself unstable.
- The model was **systematically conservative**: human raters called 47 of 276
  trials high risk; the LLM-only pipeline called 101.
- Conclusion: "Model performance cannot be substituted for human judgment."

Note the failure mode. A deterministic aggregator faithfully propagated a biased
input distribution. Determinism downstream does not fix bias upstream.

---

## 7. The reproducibility finding to act on

An independent feasibility study of Elicit
([*Research Synthesis Methods*](https://www.cambridge.org/core/journals/research-synthesis-methods/article/using-elicit-ai-research-assistant-for-data-extraction-in-systematic-reviews-a-feasibility-study-across-environmental-and-life-sciences/C97DAEC70C3173A260F0B12E729E7250))
ran identical extractions from two accounts across seven reviews. Extracted
values mostly agreed. **The supporting quotes did not**: 200 of 448 matched.
After a vendor model change, only 51 of 463 matched, and the reasoning
narratives matched in **zero** cases.

Whel already measures judge self-consistency (99.1% unanimous across three
votes). The scoring layer has never been measured the same way. A reviewer will
ask for test–retest across runs, across seeds, and across model versions. That
is a cheap measurement and it should exist before anyone else asks for it.

---

## 8. Where the field is going

- **Money has moved from prediction to validation.** ARPA-H's Every Cure award
  ([$124M](https://arpa-h.gov/explore-funding/awards/1141)) states that Phase 2
  "advances at least 30 top repurposing opportunities to preclinical and
  clinical validation." Phase 2 adds up to $76M for preclinical work on ≥20 and
  clinical trials on 10.
- **Evaluation reform is the live methodological argument.** Time-split
  validation, real negatives ([repoDB](https://doi.org/10.1038/sdata.2017.29)),
  realistic class imbalance, degree correction, and calls for prospective
  blinded assessment on the CASP model. No such community challenge exists yet.
- **Causal real-world evidence is the second pillar**, with target trial
  emulation positioned between a graph prediction and a trial. NCATS/FDA's
  CURE ID does this institutionally, and its stated methods include **curation
  of published literature**.
- **Agents are real but semi-autonomous.** FutureHouse's Robin identified
  ripasudil for dry AMD; humans ran the bench work. Counterweight:
  [SerenQA](https://arxiv.org/abs/2511.12472) finds frontier models "still
  struggle to identify genuinely surprising and valuable discoveries."

---

## 9. Three implications

1. **The positioning is defensible and the gap is documented.** The field's own
   reviewers call its dominant literature-validation practice unsystematic and
   confirmation-bias-prone; the rigorous version appeared in 2 of 732 papers.
   Whel is building the thing the field's critics ask for.
2. **The unfilled slot is graded certainty of evidence for repurposing.** Copy
   CIViC's two-axis design rather than GRADE wholesale. Minikel gives the
   empirical backing: success tracks confidence in the evidence, not effect
   size.
3. **Lead with the right differentiator.** Not offsets, which are standard. Not
   claim-plus-evidence display, which ships commercially. The claim is: an
   explicit certainty-of-evidence grade for repurposing candidates, with the
   supporting sentence preserved through an entailment check into the grade,
   in a domain where nobody grades at all.

---

## Unverified, flagged

- Pillai & Wu contains an internal inconsistency (PRISMA diagram says n=25; the
  results text describes 266 + 123 + 27). Cite the 603/732 exclusion and the
  "27 with both" figure; do not cite "25 of 732."
- Several LLM risk-of-bias papers (Rose et al. 2025, Taneri et al. 2025, JMIR
  2025;27:e70450) were paywalled or returned empty. Their reported figures are
  unconfirmed.
- No head-to-head LLM-versus-knowledge-graph repurposing benchmark was found.
  Do not assert one exists.
- Wellcome Trust's position on repurposing could not be retrieved.
- RobotReviewer and Trialstreamer appear dormant (DNS failures, repos last
  pushed 2022). The science is citable; the services may not be live.
