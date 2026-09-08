# Whel

**A free, open, graded evidence database for drug repurposing in six women's health
conditions — the first systematic assembly of the evidence that exists.**

Live at [whel.bio](https://whel.bio). Built by Veronica Agudelo (Columbia, philosophy)
in collaboration with AI coding agents. This document is the orientation text for
anyone, human or agent, picking the project up. It is long on purpose. Read it before
writing code.

---

## 1. What this is

Endometriosis affects roughly one in ten women. It takes years to diagnose and has a
handful of approved treatments, most of them hormonal and poorly tolerated. PMDD,
adenomyosis, vulvodynia, PCOS and menopause are in similar positions: common,
debilitating, under-funded, and with limited treatment options relative to burden.

Meanwhile there are thousands of drugs already approved for other indications, with
known safety profiles, whose potential in these conditions has never been systematically
examined. The evidence that *does* exist is scattered across PubMed abstracts, trial
registries, pharmacological databases, adverse-event reports, and patient forums. No
one has assembled it.

Whel assembles it. For each drug–condition pair it surfaces, the database holds the
specific sentence in the specific source that supports each claim, the character
offsets locating that sentence in the stored source text, and a machine check on
whether the sentence actually supports the claim it is attached to.

The product is not a recommendation engine. It is a **research database**. The output
is a ranked, auditable set of repurposing candidates with the evidence trail attached,
aimed at researchers and women's-health teams who would otherwise have to do this
reading themselves.

## 2. Why the design is what it is

Three commitments shape every technical decision here.

**Every claim is traceable to a sentence.** Not a citation, a sentence, with offsets.
If a claim says "dienogest had a better safety profile than COC," you can see the
words in the abstract that say so. Most comparable databases store an association and
a PMID. Whel stores the span.

**The evidence is graded, and the grading is disclosed.** A drug with one retrospective
study and a drug with three randomised trials do not look the same on the page. The
scoring rubric, its limits, and its known failures are published rather than hidden.

**Nothing is claimed that has not been checked.** This principle has cost the project
real numbers. The headline entailment rate has been revised downward three times as
checks got stricter, each time publicly. That is the intended behaviour.

## 3. Long-term vision

In rough order of ambition:

1. **Complete the validation.** Convert the central claim from "our model rates these
   as strong" to "these ratings were measured against expert human judgement, and here
   is the agreement." The protocol is written and pre-registered. It has not run.
2. **Expand coverage.** 27 peer-reviewed papers across six conditions is early-stage.
   Nothing in the architecture caps it. The constraint is retrieval volume, not design.
3. **Make triangulation count.** Right now convergence across literature, pathway and
   community evidence is displayed but does not move a candidate's rank. It should.
4. **Become the reference source for repurposing in these conditions**, in the sense
   that a researcher starting work on PMDD checks Whel first the way a geneticist
   checks Open Targets.
5. **Be machine-readable.** An MCP server (`mcp/whel-corpus/`, and a deployed endpoint
   at `app/api/mcp`) already exposes the corpus so external tools can query the graded
   evidence directly.
6. **Be independently audited.** The counting page publishes query definitions so an
   outside reviewer can recompute every number. That invitation is sincere.

One thing to be clear about: the candidate list is **curated, not discovered**. It was
assembled from a fixed, capped sample of sources (see
`docs/retrieval-standards-research.md`), not produced by an automated
candidate-generation system. The evidence on how repurposing platforms actually
generate candidates, and why Whel's list is a curated set rather than a discovery
result, is in `docs/candidate-generation-research.md`.

## 4. Current state

Numbers as of 2026-08-30 (v1.3 rubric, pre-rescore). The corpus has not been
rescored under v1.4 (four dimensions, 0–8, three tiers). Tier distribution and
entailment figures below are from the v1.3 pass and will change. Signal-rendering
routes are gated behind `SIGNALS_PUBLISHED = false` until the rescore completes.

| | |
|---|---|
| Active drug–condition signals | 226 (v1.3, pre-rescore) |
| Tiers (v1.3, four-tier) | Strong 12, Moderate 79, Emerging 84, Exploratory 51 |
| Tiers (v1.4, three-tier) | pending rescore |
| By condition | menopause 64, PCOS 46, endometriosis 42, vulvodynia 29, PMDD 24, adenomyosis 21 |
| Documents in database | 344 |
| Quoted-evidence frame | 295 claims from 48 documents |
| Of those documents | 27 PubMed (17 evidence syntheses), 14 Reddit, 7 ClinicalTrials.gov |
| Entailment (v1.3) | 273 entailed, 22 neutral, 0 contradicted (92.5%) — pending revalidation |
| Signals with quoted evidence | 139 |
| Signals on structured data only | 87 |
| Human labels collected | 100 (rounds 1 and 2, single rater) |

### Working on

Be clear-eyed about this. An agent that reads only the marketing copy will overstate
the project's maturity.

- **The tiers are unvalidated model judgements.** Strong / Emerging /
  Exploratory (v1.4 three-tier taxonomy; the v1.3 "Moderate" tier has been
  eliminated) come from a single LLM scoring pass. Cutoffs were calibrated against the
  score *distribution*, never against ground truth. The validation study exists to fix
  this and has not run.
- **The entailment figure is a self-consistency metric.** It excludes structured claims
  by construction, and the judge shares a model family with the extractor. It catches
  overreach. It is not independent verification.
- **The sex-applicability multiplier has collapsed to a binary.** Six bands are
  described; two fire. Open Targets records carry no `% female` field, so every pathway
  signal defaults to F4 (×0.75). That is a data-availability penalty wearing a
  sex-applicability label. Internally recorded, externally overstated.
- **Triangulation is presentational.** The pair headline is the single strongest arm.
  Corroborating arms decorate; they do not change rank.
- **The deterministic rules depend on model-extracted facts.** The `% female` and
  sample-size values that drive the sex-applicability band and the imprecision caps are
  extracted by the same scoring model call they then constrain. A wrong `% female`
  silently produces the wrong multiplier and nothing downstream catches it. The Python
  logic is deterministic; its inputs are not.
- **Live counts, frozen evidence.** The scope line reads from the database at request
  time, but the last full pipeline run was June 2026.
- **48 source documents is not coverage.** It is a start, and the counting page says so.

## 5. Architecture

### Two engines

The **legacy** engine (`repurposing_signals`, `sources`, `compounds`) is still in the
database. **Nothing on the live site reads it.** The **substrate** engine
(`substrate_signals`, `claims`, `documents`, `source_spans`, `entities`) serves every
page. See [`docs/provenance-tables.md`](docs/provenance-tables.md). Confusing the two
is the single most common mistake a new agent makes on this repo, and it has cost real
hours.

### Ingestion (`scripts/substrate/`, orchestrated by `run.py`)

Two provenance modes:

- **Text sources** (PubMed, ClinicalTrials.gov, Reddit) are fetched as raw text into
  `documents.raw_text`.
- **Structured sources** (Open Targets, AEMS, SIDER) are deterministically rendered
  into a fixed-template sentence by `fetch_pathway.py` / `fetch_sider.py`. That
  rendered sentence *is* the document text and *is* the claim, constructed with no LLM
  call. A database row becomes a quotable claim without faking a quote. These are
  tagged `model_name = pathway-render/*` and are **excluded from every entailment
  figure**, because checking a generated sentence against the record it was generated
  from proves nothing.

### Pipeline order

1. **Chunk** (`chunk.py`) — raw text to `source_spans` with character offsets computed
   in Python, never by a model.
2. **Extract** (`extract_claims.py`) — spans to atomic claims via Claude. Each claim
   carries a verbatim quote; if the quote cannot be located verbatim in the span, the
   claim is marked `provenance_verified = 0` and never surfaces.
3. **Verify entailment** (`verify_provenance.py`, now
   `scripts/rescore-claim-entailment.py`) — an NLI pass labels each claim
   entailed / neutral / contradicted against its own quote.
4. **Detect contradictions** (`detect_contradictions.py`) — conflicting directions
   within an (intervention, condition) group are pair-checked.
5. **Score** (`score_claims.py`) — one model call per (intervention, condition, aspect,
   arm) group produces four 0–2 dimension scores. **Python then decides everything
   deterministic**: imprecision caps, the sex-applicability multiplier, the tier, the
   contradiction flag, community corroboration.
6. **Export** — a reviewable SQL seed migration, applied by hand in Supabase Studio.
   The pipeline writes to a local SQLite store only. **Nothing writes to production
   automatically.** This is deliberate and should stay that way.

### Read path

`lib/substrate-candidates.ts` → `getAllCandidates()` runs seven parallel Supabase
queries and assembles candidates in memory: groups by drug–condition pair, collapses
arms, derives the headline by anchor-and-corroborate, re-keys side layers (MATRIX,
sex-PK, cycle phase, ClinicalTrials.gov, Orange Book, DailyMed), applies display-time
curation from `lib/curation.ts`, dedupes, sorts, assigns `WHEL-C-###` IDs.

## 6. Data sources

| Source | Contributes | Evidence basis | Known limits |
|---|---|---|---|
| PubMed | 27 documents, 266 claims | quoted | mostly reviews; abstract-only for many |
| ClinicalTrials.gov | 7 documents, 15 claims | quoted | registrations state what will be studied, not what was found |
| Reddit | 14 documents, 14 claims | quoted | n=1 patient reports; condition comes from the subreddit |
| Open Targets | 64 documents | structured | no `% female` field; association ≠ efficacy |
| AEMS (formerly FAERS) | 54 documents | reported signal | reporting bias, confounding by indication, Weber effect |
| SIDER | 20 documents | structured | label-derived; indication terms stripped upstream |

Regulatory and status layers (Orange Book, DailyMed, ClinicalTrials.gov status) are
committed JSON snapshots in `lib/`, reported beside the score and never folded into it.

## 7. Vocabulary

Use these terms precisely. They are defined publicly at `/about/what-we-count`.

- **Record / report / study** — PRISMA 2020 definitions. Whel counts *reports* and
  *claims*, never studies. 48 documents means 48 reports.
- **Evidence basis** — *quoted* (a passage states it), *structured* (a database record
  implies it, ECO:0007636), *reported signal* (adverse-event disproportionality).
  These are **kinds, not grades**. Open Targets weights text-mined literature at 0.2
  and curated structured sources at 1.0; a readable sentence is not automatically the
  stronger evidence.
- **Signal of disproportionate reporting (SDR)** — the correct term for an
  adverse-event finding. Never "risk." READUS-PV requires calling these
  hypothesis-generating.
- **Arm** — one evidence type (direct, pathway, community) for one drug–condition pair.
- **Anchor-and-corroborate** — how a pair headline is derived from its strongest arm.

## 8. Standards this project holds itself to

Not aspirational. These have already changed decisions.

- **PRISMA 2020** for counting units.
- **PRIOR** and **corrected covered area** (Pieper 2014) for overlap between reviews,
  which is why no underlying-trial count is published yet.
- **GRRAS** for the reliability study, **STARD 2015 / STARD-AI** for the accuracy study.
  The validation protocol is structured against both.
- **READUS-PV** and FDA AEMS limitations language for adverse-event data.
- **ECO** and **GO evidence codes** for evidence-basis vocabulary.

## 9. How to work on this project

This section is the professionalism bar. It exists because the project has been burned.

**Verify before asserting.** An agent working on this repo previously fabricated a
GitHub README quote, a URL, and an arXiv ID to support a claim about a dataset being
superseded. None of it existed. Another mischaracterised a real ACL paper to justify a
technical decision. If you cite something, fetch it. If you cannot fetch it, say you
could not.

**Distinguish what you verified from what you inferred.** Say which is which, every
time, without being asked.

**Do not be agreeable.** The value you add is catching what is wrong. Reassurance is
worse than useless here because it gets published.

**Own errors plainly and immediately.** Several scripts in this repo carry docstrings
documenting their own earlier mistakes and why those approaches were wrong. That is the
house style. Preserve it, and add to it when you get something wrong.

**Numbers get worse before they get better, and that is fine.** Entailment has gone
97.3 → 93.5 → 84.6 → 92.5 as checks got stricter and one bug was found. Never tune a
check to make a number look better.

**Do not overfit to the human labels.** A guard was once tuned against 50 hand-labelled
claims and broke immediately on a claim type absent from that sample. If you tune
against a validation set, say so, and treat the result as unvalidated until it is
tested on fresh data.

**Never publish a validation figure until the study that produces it has run.** Draft
site copy stating unvalidated kappa values was written and then reverted for this
reason. It lives in `docs/methodology-v4.3-DRAFT.*`.

**Migrations are applied by hand.** Generate reviewable SQL. Never write to production
from a script.

## 10. Comparable projects

Where Whel sits, and what it borrows.

| Project | What it does | Relationship |
|---|---|---|
| [Open Targets](https://platform.opentargets.org) | Target–disease associations at massive scale, harmonic-sum scoring over ~20 sources | The closest architectural model. Whel is a data source consumer and borrows the datatype-scoring idea. Open Targets has no quoted spans. |
| [CTD](https://ctdbase.org) | Curated vs inferred chemical–gene–disease relationships | The model for separating curated from inferred counts, and for showing the join path behind an inference. |
| [DisGeNET](https://www.disgenet.org) | Gene–disease associations with supporting PMIDs and text excerpts | Ships quoted excerpts alongside structured records, which is structurally what Whel's quoted layer does. |
| [Pharos / TCRD](https://pharos.nih.gov) | Targets by development level (Tclin/Tchem/Tbio/Tdark) | The precedent that "nobody has looked" is a knowledge-maturity axis, not a quality verdict. Directly relevant to under-researched conditions. |
| [ChEMBL](https://www.ebi.ac.uk/chembl/) | Bioactivity data with assay-confidence scores | Confidence-as-curation-specificity, not confidence-as-truth. |
| [Every Cure / MATRIX](https://everycure.org) | Knowledge-graph repurposing across all diseases | Nearest in mission. Operates over KG edges at millions-of-pairs scale; no quoted evidence layer. Whel cross-references their dataset. |
| [Epistemonikos](https://www.epistemonikos.org) | Links systematic reviews to their included primary studies | The model for the underlying-trial counting problem Whel has not yet solved. |

**Calibration.** The median Cochrane review contains six trials; the median
meta-analysis within one contains three studies. Whel's 27 papers across six conditions
is roughly one thorough single-question review's reference base. Early-stage, and the
site says so.

## 11. Work queue

Ordered by leverage. Revised 2026-08-30 after an independent Droid review
([`docs/droid-review-2026-08.md`](docs/droid-review-2026-08.md)) and a second pass that
challenged the ordering.

1. **Run the validation study.** Pre-registered in
   [`docs/validation-protocol-DRAFT.md`](docs/validation-protocol-DRAFT.md). Until it
   runs, every tier on the site is an unvalidated model rating. The infrastructure
   exists; the blocker is human time. Prerequisite: rater identity in
   `scripts/label-claims.py` so two people can label the same items and a
   human-to-human ceiling can be computed.
2. **Add a decorrelated second entailment judge as a measurement instrument.**
   Note the framing carefully: *add*, not *swap*. Swapping buys almost nothing on
   published benchmarks (Bespoke-MiniCheck-7B scores 77.4 balanced accuracy on
   LLM-AggreFact against Claude-3.5-Sonnet's 77.2, and on the ExpertQA slice every
   model on the board sits between 59 and 61). Replacing one judge with another
   relocates the correlated-error problem rather than solving it. Running two judges
   from different families and reporting their disagreement rate converts the problem
   into a measured quantity. Sequencing also matters: the 100 human labels already
   collected refer to the current judge's output, so change the live judge only after
   the study that measures it has run.
3. **Persist display tier and curation class to the database.** `confidence_tier` in
   `substrate_signals` can say `Moderate` while the site displays `Exploratory`, because
   the community-only, negative-evidence, safety-anchored and class-relabel rules run in
   read-time TypeScript. An auditor reading the database, or the MCP server feeding
   external tools, gets a different answer than a visitor. This project publishes query
   definitions and invites external recomputation; that invitation is not honest while
   the displayed truth lives only in code. Prerequisite for item 4.
4. **Serve reads from the corpus snapshot** rather than a full assembly per request.
5. **Fix `COMBO_RE` matching the bare word " and "**, which silently drops candidates
   from the public index. Small blast radius today (2 labels, 1 correctly matched), but
   it fails silently and in the direction of hiding evidence.
6. **Reconcile the sex-awareness framing with the two-level reality.** Six bands
   described, two firing. Either describe the multiplier honestly as "evidence in women
   versus sex-data-absent," which is defensible and still useful, or populate F2/F3 so
   the six-band framing is real. This is the same class of overstatement as publishing
   a claim count with no document denominator, and it is on the homepage.
7. **Review the five off-scope condition labels** (anxiety, breast cancer,
   cardiovascular disease, dysmenorrhea, latent hyperprolactinaemia) for the filing
   drift that produced the r/PelvicFloor mis-filing.

### Recently completed

Kept here so the queue is not read as the whole story.

- **WHBench Opus-4.6 attribution verified.** The full paper (arXiv:2604.00024v1,
  Table 3, row 1) explicitly names "Claude Opus 4.6" as the top model at 72.1% (95% CI
  69.6-74.4). The abstract does not name the model, but the results table and body text
  do. No softening needed; the site claim stands.
- **Declared-context ablation run.** 295 claims scored three ways (single-pass, no
  majority vote). Net leak: 3 of 295 claims, within the run's own noise floor (2
  reverse flips from non-determinism). No leak detectable above noise. The CONTEXT
  block's scoping instruction is holding. Absolute rates are not comparable to
  production (single-pass vs. majority-of-3 plus guard); only the between-condition
  differences are supported.
- **Candidate assembly unified.** `build-corpus-snapshot.mjs` now imports from
  `lib/substrate-helpers.mjs` instead of hand-porting the logic. Verified.
- **Migration numbering fixed.** No prefix collisions remain. Verified.
- **Security pass** (commit `c955095`), which the read-only review did not cover: RLS
  enabled on all 13 substrate tables with correct anon policies, `access_requests`
  insert-only, four internal tables deny-all, `substrate_signals` anon policy restricted
  to `status='active'`, MCP auth moved from query string to Bearer header with
  constant-time comparison, `documents` columns restricted.
- **Safety-anchored correctness fix.** Pairs whose only evidence was adverse-event data
  were displaying a harm signal as *support*. Now capped to exploratory and displayed as
  contradicting. This was a live correctness bug, not a presentation issue.

## 12. Running it

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # always run before considering a change done
npx tsc --noEmit       # type check
```

Requires `.env.local` (gitignored, never committed):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
WHEL_MCP_KEY=
```

### Validation and audit scripts

```bash
python3 scripts/label-claims.py                     # hand-label a blinded sample
python3 scripts/label-claims.py --report            # agreement, kappa, baselines
python3 scripts/rescore-claim-entailment.py --all --votes 3 --workers 12
python3 scripts/repair-claim-spans.py --missing-drug --tag NNN
python3 scripts/ablate-declared-context.py          # context-leak check (run, no leak above noise)
```

Span-repair and rescore scripts emit reviewable SQL into `supabase/migrations/`.
Apply by hand in Supabase Studio, then re-score.

### Ingestion pipelines

Legacy-era pipelines that output SQL to stdout:

```bash
node scripts/research-pipeline.js "endometriosis" > output.sql
node scripts/opentargets-pipeline.js "endometriosis" > output.sql
node scripts/clinicaltrials-pipeline.js "metformin" > output.sql
node scripts/sider-pipeline.js "spironolactone" > output.sql
node scripts/openfda-pipeline.js "statins" > output.sql
```

The current substrate pipeline lives in `scripts/substrate/`, orchestrated by `run.py`.

## 13. Guardrails

- Never write to Supabase from a script. Generate SQL for hand review.
- Never publish a validation number before the study producing it has run.
- Never fold regulatory or status data into the score. It is reported beside it.
- Never count `pathway-render/*` claims in an entailment figure.
- Never commit `.env.local` or anything under `scripts/audit-output/` except
  `human-labels.json`, which is tracked deliberately because it is irreplaceable human
  work.
- Do not describe evidence tiers on the site that the product does not display.

## 14. Map

```
app/                          Next.js App Router
  about/what-we-count/        counting conventions, public and citable
  about/technical-architecture/  scoring rubric, limitations, revision history
  about/methodology/changelog/   dated methodology revisions
  api/mcp/                    MCP endpoint, key-gated
lib/
  substrate-candidates.ts     the read path; getAllCandidates()
  curation.ts                 display-time classification and guards
  *-snapshot.{json,ts}        committed regulatory/status layers
scripts/
  substrate/                  the live ingestion pipeline
  label-claims.py             human labelling tool
  rescore-claim-entailment.py entailment scoring, majority vote plus guard
  repair-claim-spans.py       widens under-quoted spans
  ablate-declared-context.py  context-leak measurement (run, no leak above noise)
  _span_checks.py             shared deterministic span tests
  _entailment_context.py      shared CONTEXT block for judge and rater
docs/
  validation-protocol-DRAFT.md   pre-registered study design
  droid-review-2026-08.md        independent code and methodology review
  provenance-tables.md           which table is live and which is legacy
mcp/whel-corpus/              MCP server exposing the graded corpus
supabase/migrations/          hand-applied SQL, numbered
```

---

*If a number in this document does not reconcile with what you find in the database,
the database is right and this file is stale. Fix the file.*
