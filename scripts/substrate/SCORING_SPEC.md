# Whel substrate scoring model — v1.4 spec (arm-aware)

*v1.2 adds thread-structure handling to the community arm (§2): the unit is the distinct
account, confirming replies are discounted for independence, disagreeing replies feed
consistency and surface as patient-reported contradictions (§4), and manipulation signals
cap the score.*

*v1.3 (after the first PMDD validation pass): a single systematic review caps at
corroboration 1 (§2 direct), and an `on_topic` guard suppresses signals whose claims don't
actually concern the pair, or whose intervention can't be resolved (§7).*

*v1.4 (after the scoring test-retest and the lattice/degeneracy analysis): tiers drop from
four to three and are assigned on `arm_strength`, with the female-applicability multiplier
applied **after** tiering to rank and display only (§1, §5). The v1.3 cutoff freeze is
**unfrozen and its "natural empty gaps" claim corrected** — two of three cutoffs sat on
achievable values, one of them the mode (§5b). Two binding cutoff-placement rules are added.
§5c–5e record the measured dimension degeneracy: three of five dimensions carry almost no
information, the 74% middle tier is a mechanical consequence, and the instrument has three
working dimensions, not five. A downgrade-only redefinition of consistency is proposed but
**not yet adopted** (§5d).*


*Status: DRAFT for review. Nothing in this file runs a model; it is the blueprint the
migration (`050_substrate_signals.sql`) and the scoring step (`score_claims.py`)
implement. Once approved, it is the single source of truth for how a verified set of
claims becomes a scored signal.*

**What changed from v1 (and why).** v1 ran every kind of evidence through one identical
five-dimension rubric. That is methodologically wrong: a randomized trial and a patient
forum thread cannot be judged with the same ruler, and under v1 a strongly-corroborated
patient pattern would floor at zero and look like noise. The established discipline
(GRADE for trials, GRADE-CERQual for patient-reported/qualitative evidence, Cochrane
mixed-methods) is to **score each kind of evidence on criteria appropriate to it, then
integrate the streams without averaging them.** Whel already has the right structure for
this — the four **evidence arms** — so v1.1 makes scoring *arm-aware*.

This layer sits on top of the substrate. The substrate (046–047, `scripts/substrate/`)
turns sources into **atomic claims, each pinned to a verbatim quote and independently
verified**. This scoring model reads *only verified claims* and produces the number and
words a clinician sees. Because it never sees anything but verified claims, it cannot
invent evidence or blend papers the way a free-text summary can.

---

## 1. The shape of it, in one line

Each arm is scored on its **own** five dimensions (0–2 each → an arm strength of 0–10),
then discounted by the female-applicability multiplier. The pair's headline is then built
by **anchoring on the strongest evidence and reporting the other arms beside it — never
averaging across arms.**

```
per arm:   arm_strength (0–10)  ×  female_applicability_multiplier (0.50–1.00)  =  arm_score
           tier is assigned from arm_strength (§5); arm_score drives rank and display only
per pair:  headline = anchor arm's score, with the other arms shown as separate
           corroborating strengths, plus a validation_status stamp (§6)
```

Three principles carry through, the first two unchanged from v1:

- **Female applicability can only discount, never inflate** (ceiling ×1.00). Full credit
  is earned by evidence generated *in women*; everything else is honestly marked down.
- **We surface disagreement, we do not average it.** Contradictions stay first-class.
- **Certainty and applicability are rated separately** (new in v1.4). The tier states how
  certain the evidence is; the multiplier states how well it transfers to women. Collapsing
  them into one number before tiering destroys the difference between *strong evidence that
  may not transfer* and *moderate evidence generated in women* — `arm_strength 8 × 0.75` and
  `arm_strength 6 × 1.00` both land on 6.0, and those are not the same claim. So **the tier
  is computed on `arm_strength`, and the multiplier is applied afterwards, to ranking and
  display.** This follows GRADE, which rates certainty of evidence independently of
  applicability to the population of interest, then reports both.

  Measured effect on the current corpus: 4 of 226 signals change tier (all `arm_strength 4
  × 0.75 = 3.0`, previously dropped to the bottom tier by the discount alone). The top
  cutoff moves nobody, because no signal above `arm_strength 7` currently carries a
  multiplier below 1.00. The change is therefore near-inert today and adopted for being
  structurally correct, not for its present effect size.

---

## 2. The three evidence arms and their dimensions

There are **three evidence arms — `direct`, `pathway`, `community`** — all verbatim-provenance
and observed. (Cross-condition is *not* an evidence arm; it is a derived-hypotheses lens
described in `ARMS_SPEC §4`, scored separately as a prediction, never on these dimensions.)

Every arm keeps a five-slot skeleton so the math and the UI stay uniform, but **what each
slot measures is tuned to the arm**. The five generalized slots are: **corroboration,
rigor, specificity, plausibility, consistency**. The table below is what each slot means
per arm. Every score still carries a 2–3 sentence rationale citing the claims behind it.

### Arm `direct` — Direct Research (clinical trials, observational studies, reviews)

| Slot | Means here | 0 | 1 | 2 |
|---|---|---|---|---|
| **corroboration** | independent corroboration | single primary study | a single systematic review / meta-analysis, **or** two independent studies | three+ independent and consistent, **or** one large well-powered RCT (low bias) |
| **rigor** | study design **and** risk of bias | case report / preclinical | observational, small trial, **or an RCT with high risk of bias** | RCT **at low risk of bias**, meta-analysis of such, or active guideline |
| **specificity** | this drug, this condition, **this outcome** | proxy only | drug named and condition adjacent, **or** both named but measured only on a surrogate / indirect endpoint | drug and condition named directly **and** the outcome is the patient-relevant endpoint |
| **plausibility** | mechanism | asserted | plausible | evidenced in relevant biology |
| **consistency** | *(downgrade-only, see §5d)* — do results agree in direction | `0` unanimous, **or** single-source and not assessable | `−1` mixed direction across sources | `−2` direct conflict on the primary outcome |

> **Change 1 (rigor) — added 2026-09-02, per GRADE risk of bias.** An RCT was previously worth
> 2 on design alone. Design and risk of bias are not the same thing: a randomised trial that is
> unblinded, heavily attrited, or selectively reported does not deliver the certainty its label
> implies, and GRADE downgrades it. A high-risk-of-bias RCT now scores 1, alongside sound
> observational work. Rigor is the only well-spread dimension in the corpus (§5c), so this
> refines a dimension that already works rather than rescuing a broken one.

> **Change 2 (specificity) — added 2026-09-02, per GRADE indirectness.** Specificity was
> saturated: 151 of 226 signals sat at 2 (§5c), because it asked only whether the drug and
> condition were named, which is nearly always true in a corpus assembled by drug–condition
> pair. It now also asks whether the *outcome* is the one patients care about. A trial showing
> a drug moves a biomarker is indirect evidence for symptom relief and scores 1; a trial
> measuring symptoms, function, or a clinical event scores 2. This is the one planned change
> expected to genuinely de-saturate a degenerate dimension.

> **Revised from v1 per the research:** corroboration is about *independent validation*,
> kept distinct from rigor (study design) and consistency (agreement) so we don't score the
> same fact twice. A **single source caps at corroboration 1** — a lone systematic review or
> meta-analysis is *one synthesis*, not independent replication, so the trials pooled inside
> it are **not** counted as separate sources. The top score (2) is reserved for three+
> genuinely independent, consistent studies, or one large, well-powered, low-bias pivotal
> RCT where design and size substitute for replication. (Refinement after the first PMDD
> validation, where a single review was over-credited to corroboration 2.)

### Arm `pathway` — Pathway Insights (mechanistic, target, preclinical, side-effect)

| Slot | Means here | 0 | 1 | 2 |
|---|---|---|---|---|
| **corroboration** | how many independent **mechanistic lines of evidence** converge — **counted as lines, never as documents** | one line only | two independent lines | three+ independent lines |
| **rigor** | human-relevance of the models | in-vitro / cell line only, or computational prediction alone | animal model, or human tissue *ex vivo* | human *in vivo* data — target engagement, biomarker, or genetic association in people |
| **specificity** | selectivity of the drug's action on the named target | target is one of many the drug hits, or the drug–target link is asserted | drug hits the target among a few others, link is measured | drug acts selectively on the named target, with a measured affinity or engagement |
| **plausibility** | target–phenotype fit: does hitting this target plausibly move *this* condition | link to the condition is speculative | target sits in a pathway implicated in the condition | the target is independently implicated in this condition's biology, from a source other than the drug's own record |
| **consistency** | *(downgrade-only, see §5d)* — do the mechanistic signals point the same way | `0` all lines agree, **or** only one line and so not assessable | `−1` lines point in mixed directions | `−2` one line predicts the opposite effect of another |

> **Change 4 (pathway anchors) — added 2026-09-02.** The pathway arm previously had no 0/1/2
> anchors at all, only a one-line gloss per slot, and it shows: pathway means are the lowest in
> the corpus on every dimension (corroboration 0.26, rigor 0.71, specificity 1.05 — §5c). Two
> specific failures these anchors fix:
>
> - **Corroboration must count lines, not documents.** A single Open Targets record can carry
>   target genetics, preclinical pharmacology, and a side-effect signal — three independent
>   lines in one document. Bounding that by document count measures the wrong object. This was
>   also a live bug in `corroboration_ceiling()`, now fixed: the pathway arm is exempt from the
>   document-count ceiling, as the community arm already was.
> - **The model never used the top of the scale.** 15 pathway signals have 3+ source documents,
>   the ceiling permitted 2 for all 15, and **all 15 scored 1** — so the ceiling was not even
>   the binding constraint; the absence of anchors was. An explicit "three+ independent lines
>   = 2" makes the top of the scale reachable and states what reaching it requires.

### Arm `community` — Community Forum Reports (patient-reported, online)

Scored on patient-report-appropriate criteria (the GRADE-CERQual idea), **never** on trial
design — so a real corroborated pattern reads as a *signal worth investigating*, not zero.

| Slot | Means here | 0 | 1 | 2 |
|---|---|---|---|---|
| **corroboration** | independence (weighted, see below) | single account / signs of coordination | a few independent accounts | many *independent* accounts across threads/communities/time |
| **rigor** | specificity of the report | vague ("felt bad") | symptom clear, timing/dose fuzzy | clear symptom + dose + timing |
| **specificity** | this drug, this outcome | drug or outcome vague | one clear | both clear and linked |
| **plausibility** | fits the drug's pharmacology | unexplained by mechanism | loosely consistent | directly fits known pharmacology |
| **consistency** | *(downgrade-only, see §5d)* — do reports agree (confirm vs. deny) | `0` confirms dominate and dose/timing coheres, **or** a single account and so not assessable | `−1` mixed, on the independence-weighted confirm:deny ratio | `−2` substantive denials outweigh confirms |

A community signal that scores high is labelled **"strong patient-reported signal"** — it
asserts that a credible, specific, mechanistically-plausible pattern is being independently
reported. It never asserts proven efficacy.

**Threads: the unit is the distinct account, not the post.** A Reddit thread is one
document; the original post and each reply are separate spans, each its own claim with its
own quote and *its own author*. How replies count:

- **Confirming replies count, but discounted for independence.** A reply written after
  reading the original post is anchored by it (response/anchoring bias; "me too" pile-ons),
  so it is *not* worth a fresh independent observation. Independence is tiered, highest to
  lowest: a separate post by a different account in a different community/time → a reply in
  a *different* thread → a same-thread reply. Same-thread confirmations are weighted at a
  fraction of an independent post (starting dial ≈ 0.3; **to be calibrated empirically** —
  no published number exists for medical forums). Only **independent** accounts push
  `corroboration` toward 2; a single thread of agreement, however long, cannot.
- **The same account replying in its own thread is not new corroboration.**
- **Disagreeing replies are signal, not noise — and do two jobs.** A substantive denial
  ("took it 3 weeks, no change") lowers `consistency` (we track the independence-weighted
  ratio of confirms to denials), **and**, when real and specific, registers as a
  community-level **contradiction** (§4) so the disagreement is shown, not averaged. Patient
  non-response is genuine treatment-effect heterogeneity, not error; negative reports are
  never hidden.
- **Manipulation caps independence.** Timing bursts, brand-new / low-karma accounts,
  near-duplicate phrasing, and lopsided voting cap the `corroboration` score (astroturfing
  a women's-health forum is a real risk). High upvotes are **not** a credibility signal —
  they track readability, not truth — and never inflate a score.
- **Model proposes, human spot-checks.** Stance ("is this reply agreeing or disagreeing?")
  is classified by the model as a *signal only*; automated stance detection is unreliable
  and biased on its own. The highest-disagreement pairs are flagged for a human glance
  before they surface.

> **Implemented (`score_claims.community_independence`):** for the community arm,
> `corroboration` is computed **deterministically in Python from thread metadata**, NOT by
> the model (which can't see author/thread/timing). Distinct independent accounts across
> distinct threads set the score (single account → 0; 2–4 → 1; 5+ across ≥2 threads → 2;
> 5+ in one thread is anchored → capped at 1); near-duplicate wording across accounts and
> sub-hour posting bursts cap it further. Account age/karma (which need extra per-author API
> calls) are a documented future add. The model still scores the other four community
> dimensions from the text.

### Imprecision (folded in, mainly affects `direct`)

LLMs are unreliable at judging statistical precision and abstracts often omit the numbers.
So imprecision is handled by **hard rules on extracted numbers, not model judgment**, and
it caps dimensions rather than adding one:

- Very small sample (rule of thumb: N < 30 per arm, or < 300 total events for a binary
  outcome) → `corroboration` and `rigor` cannot exceed 1 for that source; reason written
  into the rationale.
- Effect + p-value but **no N and no CI** → precision is *unknown*, not *good*; the scorer
  must not infer a CI; `needs_fulltext = true` and the rationale says so.
- `precision_note` records what was and wasn't available, so the judgment is auditable.

---

## 3. Female applicability — the bounded multiplier (per arm)

Applied to each arm's strength, judged on whether *that arm's* evidence is in/about women.
(For women's-health community forums the population is inherently female → usually F1; for
a male-derived clinical trial → F5. So the same drug–condition pair can carry a different
multiplier in different arms, which is correct.)

| Band | What the evidence shows | Multiplier |
|---|---|---|
| **F1 — Female-generated** | female-specific condition, or studied in women / ≥80% female | **1.00** |
| **F2 — Represented & equivalent** | ≥50% female **and** sex-stratified analysis found no meaningful difference | **1.00** |
| **F3 — Represented, not analyzed** | ≥50% female but results not broken out by sex | **0.90** |
| **F4 — Underrepresented / extrapolated** | < 50% female, or mixed with no sex analysis; uncertain | **0.75** |
| **F5 — Male-derived / female-excluded** | < 30% female, male-only, or women excluded, applied to a female context | **0.60** |
| **F6 — Evidence of a sex-dependent disadvantage** | verified evidence the drug behaves differently/worse in women | **0.50** + ⚠ flag |

Two guardrails, unchanged from v1: **it discounts, it never excludes** (floor ×0.50, so a
male-derived drug still surfaces, marked and labelled, never buried); and **absence ≠
inferiority** (F4/F5 mean "not yet shown in women," only F6 means a known disadvantage —
and the UI must say it that way). The existing sex-PK / cycle-phase layer becomes the
detailed view *behind* this band.

---

## 4. Contradictions — strict but prominent

(Decision already made.) The substrate's `contradictions` table flags only **genuine
head-to-head disagreement** on the same drug–condition pair. When present for a pair:
`contradiction_flag = true`, `num_contradictions = N`, a `!` marker on the card, and a full
**"Where the evidence disagrees"** section on the detail page with both verbatim quotes
intact. **A flagged pair must carry a consistency penalty of at least −1 in the affected arm**
(§5d). Contradictions do not by themselves trigger the female-applicability multiplier.

> **Restated 2026-09-02 for the downgrade-only scale.** The old rule was "a flagged pair cannot
> score `consistency = 2`," which let a pair with a recorded head-to-head contradiction sit at
> the neutral 1 and pay nothing for it. Under §5d a flagged pair now pays at least a point. This
> is strictly stronger, and it is the one place where the consistency change does add
> discrimination rather than only removing a constant.

Disagreement is surfaced at **two levels**, and the UI labels which: a *clinical*
contradiction (two studies disagree) reads differently from a *patient-reported* one
(patients in the `community` arm disagree — e.g. the original poster reports benefit but
substantive replies report none). Both keep both sides intact; neither is averaged. A
patient-reported contradiction is presented as heterogeneity of experience
("patients report varied outcomes"), never as a refutation of clinical evidence.

---

## 5. Tiers — three, assigned on `arm_strength`

| Tier | `arm_strength` | Signals (n=226, **pre-change scale**) |
|---|---|---|
| **Strong** | > 7.5 | 12 (5%) |
| **Emerging** | 3.5 – 7.5 | 167 (74%) |
| **Exploratory** | < 3.5 | 47 (21%) |

> **The cutoffs and the split above are measured on the v1.3 scale and will both move.** The
> §5d consistency change alone drops `arm_strength` from 0–10 to 0–8 and removes roughly a
> point from most signals; changes 1, 2 and 4 move it again. **3.5 / 7.5 are not frozen.** They
> are recorded as the values that satisfy rules (a) and (b) on the *current* lattice, to be
> re-derived on the post-rescore lattice and only then frozen. See §10a for the sequence.

Superseded the v1.3 four-tier scheme (Strong ≥8.0 / Moderate 6.0 / Emerging 3.5 /
Exploratory, cut on `arm_score`) for the three reasons below. The 12 / 167 / 47 split is
deliberately unbalanced and is **published as measured**. Placing a cutoff inside a
concentration to even out the buckets would manufacture discrimination that is not in the
data.

### 5a. Why three tiers, not four

Argued from the measured ceiling, not from aesthetics:

- **Measured tier stability is 58.5%** (`scripts/test-retest-scoring.py`, 50 signals × 3
  runs), with a median `arm_score` spread of 1.00/10 across runs. Four tiers claims finer
  resolution than the instrument delivers.
- **The external ceiling is lower than four tiers implies.** Human ROB2 risk-of-bias
  agreement runs at κ ≈ 0.40; RobotReviewer hits 71.0% against Cochrane's 78.3%; Claude-3.5
  Sonnet reaches micro-F1 0.71 on comparable grading. Four tiers asserts roughly twice the
  resolution trained humans achieve on a *simpler binary* task.
- **Three is the honest maximum:** two genuine precision levels plus an explicit uncertainty
  band. Two tiers is stable but discards the gradation that is Whel's point; a continuous
  score is honest but not actionable. Moving 4 → 3 drops boundary instability from ≈42% to
  ≈13%.

### 5b. Cutoff placement rules (binding)

The v1.3 record claimed all three cutoffs "land in natural empty gaps." **That was wrong,**
and it is corrected here. `arm_score` is a *lattice*, not a continuous variable — only 15
distinct values occur across 226 signals. Two of the three frozen cutoffs sat exactly on
achievable values, one of them the mode:

- `arm_score = 6.0` → **47 signals** (the modal value, 21% of the corpus) — and a cutoff.
- `arm_score = 8.0` → 8 signals — and a cutoff.
- **55 of 226 signals (24%) sat exactly on a cutoff.**

The dominant gap between adjacent achievable scores is 1.0, which is *exactly* the measured
run-to-run noise. Every observed tier flip was therefore structurally a boundary crossing,
not a judgement change. Two rules now bind all future cutoff placement:

> **(a) No cutoff may fall on an achievable score value.**
> **(b) No cutoff may fall on, or adjacent to, a modal value.**

3.5 and 7.5 satisfy both on the current `arm_strength` lattice (integers 0–9; mode 6,
near-mode 5; neither 3.5 nor 7.5 is achievable, and 7.5 is two steps from the mode).
**These cutoffs are provisional on the current scale.** Rubric changes 1, 2 and 4 and the
consistency change in §5d all move the achievable set and the mode, so rules (a) and (b)
must be re-applied to the post-change distribution before the cutoffs are refrozen.

### 5c. Why 74% land in the middle tier — a rubric property, not an evidence finding

A reader who sees three tiers without this section has the wrong picture of what the middle
tier means. It does **not** mean most evidence is moderate. It means the rubric has roughly
two working dimensions. Measured distribution over the 226 active signals:

| Dimension | 0 | 1 | 2 | mean | state |
|---|---|---|---|---|---|
| corroboration | 116 | 105 | **5** | 0.51 | effectively binary 0/1 |
| rigor | 49 | 94 | 83 | 1.15 | **the only well-spread dimension** |
| specificity | 32 | 43 | **151** | 1.53 | saturated, 67% at max |
| plausibility | 92 | 112 | 22 | 0.69 | 50% at 1 |
| consistency | 24 | **174** | 28 | 1.02 | near-constant, 77% at one value |

The arithmetic is mechanical: a near-fixed consistency of 1 plus a usually-2 specificity is a
**3-point floor before any real judgement happens**. Adding corroboration (0–1 in practice),
rigor (0–2) and plausibility (0–1 mostly) yields a range of 3–7 — which is precisely the
observed concentration (167 of 226 sit at `arm_strength` 4–7, and no signal has ever reached
10; the observed maximum is 9).

Per-arm means, which show the degeneracy is not uniform:

| Arm | n | corrob. | rigor | specif. | plaus. | consist. |
|---|---|---|---|---|---|---|
| direct | 129 | 0.69 | 1.52 | 1.89 | 0.47 | 1.09 |
| pathway | 87 | 0.26 | 0.71 | 1.05 | 0.95 | 0.93 |
| community | 10 | 0.30 | 0.20 | 1.00 | 1.30 | 0.90 |

### 5d. Root cause of each degenerate dimension (three different problems)

Established by joining `substrate_signals.claim_ids` → `claims.document_id`. **82% of
signals (186 of 226) rest on a single source document**; only 19 have 3+.

- **Corroboration is corpus-limited, not mis-specified.** `corroboration_ceiling()` caps 1–2
  documents → 1, so **207 of 226 signals (92%) cannot exceed 1 as arithmetic on the corpus**,
  before judgement. Only 19 signals are eligible for a 2 and 3 earned it. The bar is not
  unreachable and the ceiling is not a bug for the `direct` arm: 112 of 129 direct signals
  rest on one document, and one document is not replication. **What the dimension currently
  measures is corpus breadth — how many sources were ingested for that pair — which
  coincides with evidence replication only once ingestion is complete.** No rubric wording
  fixes this; only the breadth pass does.
  - *Two known bugs in the `pathway` arm.* (i) `corroboration_ceiling()` bounds by distinct
    *document* count, per its docstring "SCORING_SPEC §2 direct" — but §2 defines pathway
    corroboration as convergence of independent *mechanistic lines*, and one Open Targets
    record can carry several. Pathway must be exempted from the document-count ceiling, as
    community already is. (ii) The ceiling is not even binding there: 15 pathway signals
    have 3+ documents, all were permitted a 2, and **all 15 scored 1.** Change 4's pathway
    anchors must define corroboration by line count, not study count.
  - *Two stale artifacts.* Two `direct` signals carry corroboration 2 on only 2 documents.
    They predate the ceiling commit and the next rescore will correctly cap them to 1.
    Expect 5 → 3 signals at corroboration 2; that is a correction, not a regression.
- **Specificity is a rubric problem.** Saturated at max because a surrogate/indirect endpoint
  currently scores the same as a directly measured one. **Rubric change 2** (outcome and
  endpoint directness, per GRADE indirectness) splits it and should genuinely de-saturate it.
- **Consistency is a scoring-model problem.** It is not measuring agreement; it is tracking
  claim count. Direct: consistency=1 has n=114 of which **108 are single-document** (avg 1.8
  claims), while consistency=2 has n=13 (avg 4.7 claims). Pathway: consistency=0 has n=20,
  **all** single-document (avg 1.0 claims); consistency=2 has n=14, **none** single-document
  (avg 3.6 claims). Average claim count rises monotonically with the score in both arms. So
  the spec's "single study → scored neutral, not penalized" is contributing a **silent fixed
  +1 to the majority of the corpus** — the single largest contributor to the 3-point floor.

  **ADOPTED (2026-09-02): consistency is downgrade-only, following GRADE, which never lets
  inconsistency add certainty.**

  | Value | Meaning |
  |---|---|
  | `0` | no penalty — unanimous, **or** single-source and not assessable |
  | `−1` | mixed direction across sources |
  | `−2` | direct conflict on the primary outcome |

  `arm_strength` becomes `corroboration + rigor + specificity + plausibility` (0–8) plus the
  consistency penalty, floored at 0.

  **This is a coherence fix, not a discrimination fix, and must not be described as one.**
  Work the arithmetic: today consistency is 24 / 174 / 28 across 0 / 1 / 2, i.e. 77% at one
  value. After the change the 174 single-source signals and the 28 unanimous ones both map to
  penalty 0, and only the 24 disagreeing signals carry a penalty — **202 of 226 (89%) at one
  value.** As a variance contributor consistency becomes *more* degenerate, not less. What the
  change removes is a meaningless additive constant, which **lowers the floor by about a point
  and shifts the distribution left without spreading it.** The observed 4–7 concentration
  becomes a 3–6 concentration of the same shape. Discrimination has to come from rigor,
  specificity and plausibility, and of the planned rubric changes only change 2 (specificity)
  targets one of those.

  What the change is worth on its own terms: it stops inflating every score by a point it did
  not earn; it keeps the information that exists (the 24 genuinely disagreeing signals now
  cost something, where previously a single-source signal and a unanimous one were both
  credited above a conflicted one); and it resolves a definitional double-count, since direct
  corroboration=2 is *defined* as "three+ independent **and consistent** studies" while §2
  claims the dimensions are kept distinct so as not to score the same fact twice (at most 5
  signals overlap today, so this is an incoherence argument, not yet a numerical one). And it
  is legible to an external methodologist: downgrade-only inconsistency is recognised on
  sight, whereas "single study earns +1 for neutrality" is not defensible.

  Two rejected alternatives: *dropping* consistency from the sum discards the real
  disagreement signal, and declaring single studies "unscorable" is not buildable — it forces
  either per-signal renormalisation, which makes scores non-comparable across signals, or
  neutral treatment, which is the status quo.

  Storage note: `consistency_score` now holds −2…0. `arm_strength` is a Postgres **generated
  column** and its definition changes with it (migration 059), as does the `0 ≤ score ≤ 2`
  CHECK constraint. The redefinition `GREATEST(0, corr + rigor + spec + plaus + consistency)`
  is arithmetically identical to the old one for non-negative `consistency_score`, so it is
  safe to apply before the rescore and produces no change to existing rows.

### 5e. Honest count of working dimensions

After rubric changes 1, 2 and 4 and the §5d consistency change, the instrument has **three
working dimensions** (rigor, specificity, plausibility), one corpus-limited dimension
(corroboration, capped at ≤1 for 92% of signals until the breadth pass), and one
downgrade-only criterion (consistency, which is *more* concentrated after the change, not
less — §5d). **Not five.** Any external description of the model, on the site or in a methods
section, should say so.

Expected shape after the changes, stated in advance so it can be checked rather than
rationalised afterwards:

- The distribution **shifts left by roughly a point and keeps its shape.** The 4–7
  concentration becomes a 3–6 concentration. Neither the §5d change nor change 1 spreads it.
- **Change 2 is the only planned change that should widen the distribution**, by splitting the
  151 signals currently saturated at specificity 2 into surrogate-endpoint and
  patient-relevant-endpoint groups. If specificity is still ~67% at max after the rescore, the
  change did not work and should be reported as not having worked.
- **Change 4 should lift the pathway arm off the floor.** If pathway corroboration is still
  ≈0.26 and no pathway signal reaches 2, the anchors failed.
- **Nothing in this round can fix direct corroboration.** It is bounded by single-source
  ingestion, not by wording, and it will still read near-binary after the rescore. That is a
  corpus limitation and belongs in the validation methods as one (see
  `docs/validation-methods-draft.md`).

The honest summary is that this round buys **coherence and defensibility**, not
discrimination. Only change 2 targets discrimination, and one of five dimensions cannot be
fixed from the rubric at all.

---

## 6. Integration — anchor-and-corroborate, with Whel's surface-unvalidated rule

A drug–condition pair may have signals in several arms. We **never average across arms.**
Instead, per pair (computed in `lib/candidates.ts` from the per-arm rows):

1. **If the `direct` arm is present and non-trivial**, it **anchors** the headline. The
   other arms render beside it as separate corroborating strengths (the way MATRIX and
   Open Targets already do — reported, not blended). `validation_status = clinical`.

2. **If `direct` is thin or absent but other arms converge** (the common case for the
   under-studied female conditions Whel exists to serve), the pair **still surfaces**,
   headlined by the strongest available arm, and **stamped `validation_status =
   unvalidated_signal`** with plain-language framing: *"Hypothesis / patient-reported
   signal — not clinically validated."* This is Whel's deliberate departure from the
   textbook anchor-only rule, and it is core premise: thin direct research is the gap we
   fill, so mechanistic and community convergence is a *valid starting point*, never
   dressed up as proven.

3. **If only one weak arm is present**, it surfaces low in the ranking,
   `validation_status = preliminary`.

`validation_status` is the honesty stamp the UI keys off of. It is derived at read time
from which arms exist for the pair and their scores; the per-arm rows in
`substrate_signals` are the storage unit.

> Note on growing the `direct` base: the abstract-wide fetch across all six conditions
> (the cheap breadth pass) is what thickens the clinical arm over time. The
> surface-unvalidated rule keeps the platform from going dark on thin-evidence pairs in
> the meantime; it is not a permanent substitute for clinical evidence.

---

## 7. What a scored signal carries (feeds the frontend)

Per (intervention, condition, aspect, **arm**):

- `arm` (`direct` | `pathway` | `community` — the three evidence arms)
- Four scored dimension scores (0–2) **+ one consistency penalty (−2…0)**, each with a
  rationale string (slots interpreted per §2)
- `arm_strength` (**0–8**, the pre-multiplier sum: `GREATEST(0, corroboration + rigor +
  specificity + plausibility + consistency)`, where consistency is ≤ 0 per §5d)
- `female_applicability_band` (F1–F6), `female_applicability_multiplier` (0.50–1.00),
  `female_applicability_rationale`
- `arm_score` (0–10, strength × multiplier) — drives **rank and display only**
- `confidence_tier` — one of three (§5), assigned from `arm_strength`, **not** `arm_score`
- `contradiction_flag`, `num_contradictions`
- `precision_note`, `needs_fulltext`
- `source_tier` ('abstract' | 'fulltext')
- `synthesis_summary`, `mechanism_hypothesis`
- Audit: `model_name`, `prompt_hash`, `claim_ids[]`

Derived per pair at read time: the anchor arm, the corroborating arms, and
`validation_status` (`clinical` | `unvalidated_signal` | `preliminary`). The MATRIX
percentile, Open Targets graph, literature grade, and sex-PK / cycle-phase layers stay
**separate and unblended**, reported beside the score as they are today.

**Off-topic guard.** The scorer also judges `on_topic`: whether the verified claims actually
concern *this* intervention acting on *this* condition. A claim that turns out to be about a
different condition or drug, or whose intervention can't be resolved, is stored with
`status = 'off_topic'` and an `off_topic_reason`, and is **excluded from active surfacing**
(kept for audit, never shown as a signal). A deterministic backstop also suppresses any pair
whose intervention label is unresolved. This catches extraction leakage — e.g. an
"anxiety in older women" claim mistakenly attached to a premenstrual pair — without letting
it masquerade as weak evidence. (Added after the first PMDD validation surfaced three such
mis-attached claims, all of which the scorer itself had flagged in its rationales.)

---

## 8. Reliability guardrails (from the research)

1. **LLM extracts, rules decide.** The model extracts facts it is good at (% female, N,
   study design, direction, report counts — 80–90% accurate). Deterministic rules turn
   those into the precision caps and the female-applicability band wherever a rule can.
2. **Missing data is flagged, not guessed.** Anything the abstract can't answer sets
   `needs_fulltext` rather than getting a confident default.
3. **Validate before cutover (a recorded gate — see §9).** Nothing flips the feature
   flag until the calibration and validation in §9 has run and been reviewed.
4. **Label honestly in the UI.** `unvalidated_signal` reads as "not clinically validated";
   F4/F5 read as "applicability to women not yet established"; only F6 reads as a known
   disadvantage. The score adjusts *confidence*; it never reverses a safety conclusion.

---

## 9. Calibration & validation (a planned gate, runs after the first scoring pass, before cutover)

**STATUS: RUN AND REVIEWED 2026-06-16 — see `CALIBRATION_RECORD.md`. SUPERSEDED IN PART BY
v1.4 — the tier-cutoff portion of this record is withdrawn; see §5b.** The 2026-06-16 pass
froze cutoffs at 8.0 / 6.0 / 3.5 on `arm_score` and recorded that they "land in natural
empty gaps." Re-examination against the lattice showed that claim was false: 55 of 226
signals (24%) sat exactly on a cutoff, and `arm_score = 6.0` was simultaneously a cutoff and
the modal value. Cutoffs are now 3.5 / 7.5 on `arm_strength` and are **provisional**, to be
refrozen under rules (a) and (b) after rubric changes 1, 2, 4 and the §5d consistency
decision land. The remainder of the 2026-06-16 record stands. Female
multiplier kept (×1.0 / ×0.75); the corpus exercises only F1 and F4, collapsing the axis
to two levels, so the F5/F6 + Janusmed/FAERS external validation (§10b) is deferred until
cross-condition repurposing introduces male-derived drugs. Other dials (§10c)
spot-checked. The text below is retained as the original commitment.

The numeric thresholds in this spec were **deliberately provisional**. They were set on
reason, not yet on data, and several could only be settled once real scores existed. This
section is the recorded commitment to settle them; the feature flag does not flip until it
has run and been reviewed (§8.3).

### 10a. Tier cutoffs — recalibrate once against the real distribution

**Superseded by §5b.** The original commitment (place four cutoffs on the `arm_score`
distribution plus ~10 hand-judged anchor pairs, then freeze) was carried out on 2026-06-16
and is withdrawn on two counts. First, the multiplier argument that motivated cutting on
`arm_score` ("a male-derived 9 lands at 5.4 at ×0.60") is exactly the collision §1 now
rejects: that signal is strong evidence that may not transfer, and it should tier as Strong
and be *ranked* down, not tiered down. Second, eyeballing clusters is not sufficient when
the variable is a 15-value lattice whose adjacent-value gap equals the measured noise; rules
(a) and (b) replace the eyeball. **Remaining step:** re-derive 3.5 / 7.5 on the
post-rubric-change `arm_strength` lattice under rules (a) and (b), then refreeze. Done once;
not re-tuned per run.

### 10b. Female-applicability bands — validate the *separation*, not just the definitions

The bands F1–F6 are well-defined in principle, but whether the multiplier *values*
(×0.60 male-derived, ×0.75 underrepresented, ×0.90 represented-but-unanalyzed) produce
meaningful separation in practice is an empirical question. Two reference checks:

- **Janusmed.** Do our low-applicability bands flag the drugs Region Stockholm's Janusmed
  already classifies as having clinically relevant sex differences (its "C!" / "C" lists)?
  Misses mean the bands are too lenient.
- **Sex-stratified FAERS.** Do low-applicability pairs line up with adverse-event signals
  that are elevated in women in sex-stratified FAERS analysis? Convergence is evidence the
  discount is tracking something real.

If the separation comes out muddy, we **adjust the multiplier values, not the band
definitions** (the bands are the concept; the numbers are the dial).

### 10c. The other dials flagged in-spec

- **Community independence discount** (§2): the ≈0.3 weight on same-thread confirmations is
  a starting dial with no published medical-forum benchmark — calibrate on real threads.
- **Imprecision thresholds** (§2): the N < 30 / < 300-events rules are generic GRADE
  heuristics; sanity-check they behave on our conditions.
- **Community rubric**: spot-check against known astroturf vs. genuine signal before trust.

### 10d. What "reviewed" means

A short written calibration record (the distribution, the chosen cutoffs, the Janusmed and
FAERS check results, any multiplier adjustments) is produced and looked at by a human
before cutover. It is not a pass/fail script; it is a judgment gate with the evidence laid
out.

---

## 10. Sources

- GRADE-CERQual — appraising qualitative / patient-reported evidence on its own criteria
  (Lewin et al., PLOS Medicine, 2015).
- Cochrane Handbook ch. 8 — mixed methods: assess each evidence type appropriately,
  integrate rather than average.
- Social-media pharmacovigilance / patient-reported evidence (WEB-RADR; JAMIA reviews).
- A single large RCT may outweigh a meta-analysis of small trials (21st-century evidence).
- Oxford CEBM Levels of Evidence — study design over count.
- GRADE inconsistency / imprecision / indirectness guidance (guidelines 6, 7).
- FDA 2025 sex-differences guidance; SAGER guidelines; zolpidem precedent; Janusmed.
