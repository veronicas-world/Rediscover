# Droid code + methodology review — 2026-08-30

Read-only review of the Whel codebase (whel.bio). No files were edited, no
database writes were run. This is an independent assessment by Droid.

A note on citations, since you asked: I checked the two arxiv URLs on the
technical-architecture page. Both resolve to real papers — `2604.00024`
(WHBench, Maurya/Govindgari/Kumar, Mar 2026) and `2604.27470` (HealthBench
Professional, Apr 2026). The WHBench abstract does state "the best model reaches
72.1 percent," so that number is real. I could **not** confirm from the
abstract alone that the 72.1% model was specifically "Opus 4.6" as the page
claims — the abstract does not name the top model. It may well be correct, but
I could not verify it from the source I could reach, so I am flagging it
rather than asserting it. The HealthBench Professional 55.8% / 51.9% figures I
also could not verify from the abstract; the paper exists, the specific
numbers I could not confirm. Everything below I did verify against the code.

---

## 1. What this system actually does (data flow)

There are two engines. The **legacy** one (`repurposing_signals` / `sources` /
`compounds`) is still in the database but nothing on the live site reads it.
The **substrate** engine is what serves every page. The cutover is described in
the code as done, but the legacy tables and 51 migrations of history are still
present.

### Where evidence enters

Evidence enters through Python ingestion scripts in `scripts/substrate/`,
orchestrated by `run.py`. There are two provenance modes:

- **Text sources** (PubMed, ClinicalTrials.gov, Reddit): `fetch_pubmed.py`,
  `fetch_trials.py`, `fetch_community.py` pull raw text via public APIs and
  store it as `documents.raw_text`.
- **Structured sources** (Open Targets, AEMS/openFDA, SIDER): `fetch_pathway.py`
  and `fetch_sider.py` pull structured records and **deterministically render**
  each one into a fixed-template sentence (`_render_ot`, `_render_aems` in
  `fetch_pathway.py`). That rendered sentence *is* the document's `raw_text`,
  and the claim *is* that sentence, constructed without an LLM call. This is
  the clever part: a database row becomes a quotable claim without faking a
  quote.

### What happens to it (the pipeline, in order)

1. **Chunk** (`chunk.py`): `documents.raw_text` → `source_spans` (sentences
   with character offsets computed in Python, never by the model).
2. **Extract** (`extract_claims.py`): each span → atomic claims via Claude
   (extraction model is `claude-sonnet-4-6` per `config.py`). Each claim must
   carry a verbatim quote; `_locate()` finds the quote in the span text and
   records offsets. A quote that can't be found verbatim is marked
   `provenance_verified = 0` and never surfaces. Community spans use a
   separate patient-report prompt that requires a reported outcome.
3. **Verify entailment** (`verify_provenance.py` / the newer
   `rescore-claim-entailment.py`): an NLI judge checks whether the quote
   *supports* the claim (entailed / neutral / contradicted). This is a second
   model pass. Structured/rendered claims are excluded as circular.
4. **Contradictions** (`detect_contradictions.py`): within each
   (intervention, condition) group, efficacy claims with conflicting
   directions are pair-checked by an NLI call and stored in `contradictions`.
5. **Score** (`score_claims.py`): verified claims are grouped by
   (intervention, condition, aspect, arm). One model call per group produces
   the five 0–2 dimension scores + rationales + structured facts (sample size,
   % female, etc.). **Then Python decides the deterministic parts**: imprecision
   caps (`apply_imprecision`), the female-applicability band → multiplier
   (`female_band`), the tier (`tier_for`), the contradiction flag, and
   community corroboration (`community_independence`, computed from thread
   metadata, not the model). `arm_score = sum(dimensions) × multiplier`.
6. **Export**: `score_claims.py` writes a reviewable SQL seed migration
   (`051_substrate_signals_seed.sql`) applied by hand in Supabase Studio.
   Nothing in the pipeline writes to production directly — this is enforced
   by design (the pipeline writes to a local SQLite working store only).

### What reaches a page

At request time, `lib/substrate-candidates.ts` `getAllCandidates()` runs 7
parallel Supabase queries: all active `substrate_signals`, all `entities`,
all `claims` (with joined `documents`), all `conditions`, all `compounds`,
plus `compound_pk` and `compound_condition_phase`. It then does everything
in memory:

- Groups signal rows by drug–condition pair.
- Collapses to one reading per arm (strongest efficacy/mechanistic arm).
- Derives the pair headline by **anchor-and-corroborate** (`deriveHeadline`):
  a non-trivial Direct arm (strength ≥ 3) anchors → `clinical`; otherwise the
  strongest arm anchors → `unvalidated_signal` or `preliminary`.
- Re-keys the independent side-layers (MATRIX, sex-PK, cycle-phase,
  ClinicalTrials.gov, Orange Book, DailyMed) to the substrate drug set.
- Applies display-time curation (`lib/curation.ts`): classifies each drug
  (drug/combination/supplement/exclude/class), resolves class→molecule
  rollups, caps community-only and negative-evidence pairs to `exploratory`.
- Deduplicates, sorts strongest-first, assigns positional `WHEL-C-###` IDs.

The homepage (`app/page.tsx`) and candidates page (`app/candidates/page.tsx`)
both call this. The detail page (`app/access/preview/[signalId]/page.tsx`)
calls `getCandidateBySignalId`, which calls `getAllCandidates()` and linear-
searches the result.

---

## 2. Code review — what is fragile, duplicated, or likely to break

### Critical: the candidate-assembly logic exists in two unsynchronized copies

`lib/substrate-candidates.ts` (`getAllCandidates`, ~lines 150–290) and
`scripts/build-corpus-snapshot.mjs` (`build()`, ~lines 180–300) are a
hand-maintained port of the *same* complex logic: arm collapsing,
anchor-and-corroborate, side-layer re-keying, curation, dedup, sort. The
snapshot builder even says `KEEP IN SYNC` at the top of its copied curation
block. There is no shared module and no test asserting the two produce the
same output. This is the single biggest maintainability hazard in the
codebase: any change to the scoring/display logic must be made in two
places, in two languages, with nothing enforcing they match. The corpus
snapshot served to the MCP/Science tooling will silently drift from the
live site the first time someone edits one copy and forgets the other.

### Critical: migration filename-number collisions

`supabase/migrations/` has four pairs of files sharing a prefix number:

- `046_repair_claim_spans.sql` (Jul 31) **and** `046_substrate_schema.sql` (Jun 12)
- `047_repair_claim_spans.sql` (Aug 1) **and** `047_substrate_seed_pmdd.sql` (Jun 21)
- `048_repair_claim_spans.sql` (Aug 2) **and** `048_substrate_grounding.sql` (Jun 12)
- `049_retire_pelvicfloor_vulvodynia_signals.sql` (Aug 2) **and** `049_access_requests.sql` (Jun 12)

Supabase applies migrations in filename order. Alphabetically,
`046_repair_claim_spans.sql` sorts **before** `046_substrate_schema.sql`, but
the repair migration operates on the `claims` table that
`046_substrate_schema.sql` creates. Anyone provisioning a fresh database
from this directory will hit a dependency-order failure. This presumably
works today only because the migrations were applied manually in Studio in
the correct order and the live DB is already past them. It will break on
the next clean environment. **Renumber the repair/retire migrations to
052+.**

### High: every page load re-runs the full assembly with no caching

`getAllCandidates()` fetches entire tables (`claims`, `entities`,
`compounds`, `conditions`, `substrate_signals`, two side tables) on every
request. Both `app/page.tsx` and `app/candidates/page.tsx` set
`dynamic = "force-dynamic"` and `revalidate = 0`. At 226 signals / 295
claims this is survivable, but it is O(corpus) in memory and DB round-trips
per request, with no incremental path. The homepage makes it worse:
`getSubstrateHomeData()` calls `getCandidates()` internally (~line 380) and
`getShowcasePair()` calls `getCandidates()` again (~line 410), so
`getAllCandidates()` (7 queries) runs **twice** per homepage load, plus
`getSubstrateHomeData`'s own 2 extra queries — ~16 Supabase round-trips to
render one page, most of it redundant. A single memoized
`getAllCandidates()` per request would cut this roughly in half; a cached
snapshot (you already build `corpus-snapshot.json`) would eliminate it.

### High: the deterministic rules depend on model-extracted facts

The "LLM extracts, rules decide" split is real, but the *facts* the rules
decide on (`max_sample_size`, `study_female_percent`,
`study_in_target_female_population`, `sex_stratified`, etc.) are extracted
by the same scoring model call (`score_claims.py` SYSTEM prompt). The spec
claims these are "80–90% accurate," but a wrong `% female` silently produces
the wrong female-applicability band and multiplier, and there is no
downstream check that catches it. The rule layer is deterministic; its
inputs are not.

### Medium: the entailment verifier is still the "v0 placeholder"

`scripts/substrate/verify_provenance.py` lines 5–7: *"v0 uses Claude as the
NLI judge. The Blueprint specifies PubMedBERT-NLI for this role; this is the
swappable placeholder with the same input/output contract."* It was never
swapped. The newer `rescore-claim-entailment.py` also uses Claude. So the
entailment check — the system's core provenance guarantee — is the same
model family that extracted the claims, judging its own output. The
validation protocol itself flags this as limitation #4 ("their errors are
correlated; majority-of-three reduces variance, not this bias"). It is
honestly disclosed, but it means the 97% entailment figure is a measure of
self-consistency, not independent verification.

### Medium: display-time curation can diverge from database truth

The community-only cap, negative-evidence cap, and class→molecule relabel
are applied in TypeScript at read time (`substrate-candidates.ts` ~lines
240–270, `lib/curation.ts`), not stored in the database. So the
`confidence_tier` in `substrate_signals` can be `Moderate` while the site
displays `exploratory`. Anyone querying the DB directly (an auditor, the
MCP corpus server) sees the un-capped tier unless they replicate the
TypeScript logic — which, per the first point, exists in two copies. The
"truth" about what tier a user sees lives in code, not data.

### Medium: `COMBO_RE` matches the bare word " and "

`lib/curation.ts` ~line 108: the combination regex includes `| and |`. Any
single drug whose name contains "and" (or any extraction that produces
"X and Y" where Y is a dosing form, not a second drug) will be classified
`combination` and segregated out of the candidate index. This is a silent
false-positive drop from the public index. The regex should require a
second drug-like token, not a bare conjunction.

### Medium: unstable display IDs

`WHEL-C-###` IDs are assigned by enumeration order after sort and dedup
(`substrate-candidates.ts` ~line 250, renumbered again in
`build-corpus-snapshot.mjs` ~line 290). They are positional, not content-
addressed. A candidate's displayed ID changes if anything upstream changes
sort order. The stable key is `signalId` (`${iid}__${cid}`), which the
detail page correctly uses — so the detail links survive, but any external
reference to a `WHEL-C-###` ID is fragile.

### Low: schema/code drift on the `cross` arm

`050_substrate_signals.sql` still allows `arm in
('direct','cross','pathway','community')`, but cross-condition was
explicitly dropped as an evidence arm and the read code filters it out
(`substrate-candidates.ts`: `if (!ARMS.includes(String(s.arm))) continue`).
The CHECK constraint is dead and misleading.

### Low: env non-null assertions

`lib/supabase.ts` lines 4–5 use `process.env.NEXT_PUBLIC_SUPABASE_URL!` —
a missing env var crashes at module import with an unhelpful error.

### Low: documentation model-name drift

The technical-architecture page says scoring is `claude-opus-4-8`;
`config.py` `MODEL = "claude-sonnet-4-6"` (the extraction default; scoring
is run with `--model` passed explicitly, per the calibration record — so
this is consistent, but only if you know that); `what-we-count` says claims
are `model_name = claude-sonnet-4-6`; the validation protocol says the
entailment judge under test is `claude-sonnet-5`; the homepage footer says
"methodology v4.1" while the technical-architecture page has a v4.2
changelog. None of these is necessarily wrong, but a reader cannot
reconstruct which model did what from the docs alone.

---

## 3. Technical debt, ranked by what hurts most if it stays

1. **Two unsynchronized copies of the assembly logic** (TS + MJS). This will
   cause a silent site-vs-snapshot divergence. It is the one most likely to
   bite you next, because any future change touches it. Fix: extract one
   shared module (or generate the snapshot from the TS path).

2. **Migration number collisions (046–049).** Will break the next clean
   database provisioning. Cheap to fix (renumber), expensive if discovered
   under pressure.

3. **No caching / full table scans per request.** Survivable now, becomes
   painful the moment the corpus grows or traffic arrives. You already
   build `corpus-snapshot.json` — serve the read path from it and refresh
   on a schedule.

4. **Display-time curation not persisted.** The DB tier ≠ the displayed
   tier. An auditor or the MCP server reading the DB gets a different answer
   than the site. Persist the final `display_tier` and `curation_class`
   as columns.

5. **Entailment verifier still same-family Claude.** The system's central
   guarantee is self-judged. Either swap to the specified PubMedBERT-NLI
   (or any independent model) or stop presenting the entailment rate as
   independent verification. The validation study, when it runs, will
   quantify this — but it has not run.

6. **Model-extracted facts driving deterministic rules with no validation.**
   The female-band and imprecision caps are only as good as the model's
   % female / sample-size extraction. Add a cheap audit: sample-extract and
   hand-check the facts behind the F-band assignments.

7. **Regex-based drug classification.** `curation.ts` will misclassify as
   the corpus grows. The ` and ` matcher is the immediate bug; the broader
   issue is that "is this a single-agent drug" is being decided by string
   matching on free-text extraction labels.

---

## 4. What is wrong with the approach itself

### The five-dimension scores are unvalidated LLM judgments presented as tiers

Every tier on the site — Strong, Moderate, Emerging, Exploratory — is the
output of a single LLM scoring pass. The validation study
(`docs/validation-protocol-DRAFT.md`) is pre-registered but **has not run**.
The calibration record (`CALIBRATION_RECORD.md`) calibrated the *cutoffs*
against the score distribution, not the *scores* against ground truth. So
the cutoffs are well-placed relative to the scores, but the scores
themselves have never been checked against expert judgment. The site is
honest about this in the limitations page, but the public tier badges carry
visual weight (color, the word "Strong") that the underlying evidence does
not yet support. This is the central conceptual risk: a clinician-researcher
who scans the tier badges is reading unvalidated model ratings.

### The female-applicability multiplier has collapsed to a binary flag

The calibration record states this plainly: only F1 (×1.0) and F4 (×0.75)
fire. F2, F3, F5, F6 never appear. The reason is structural — Open Targets
records carry no `% female` field, so *every* pathway signal defaults to F4.
The ×0.75 haircut on all 54 pathway signals is a data-availability penalty
dressed as a sex-applicability penalty. The homepage leads with "scored
for women" and "weighted for how far the evidence was generated in women,"
which implies more sex-awareness than the data supports: in the current
corpus, the multiplier is effectively "was this a clinical study in women
(×1.0) or is this mechanistic/structured data with no sex field (×0.75)."
That is a reasonable heuristic, but it is not the six-band sex-aware
scoring the public framing describes, and the F5/F6 machinery (the actual
sex-danger discounts) is inert. This is honestly recorded internally; it is
overstated externally.

### Anchor-and-corroborate means triangulation is visual, not numerical

The pair headline is the single strongest arm's score. Corroborating arms
are shown beside it but do not change the number a user sorts by. A pair
with a Moderate Direct arm and a Strong Pathway arm ranks as Moderate. This
is a defensible choice (do not average across evidence types), but it means
the thing the site sells — triangulation across literature, pathway, and
community — does not actually move a pair's rank. The multi-arm view is
presentational. If you want triangulation to matter, the integration step
needs a rule that lets convergence raise a headline (within bounds), not
just decorate it.

### The entailment guarantee is narrower than it sounds

The 97% entailment figure (a) excludes all structured/rendered claims by
construction (checking them is circular), and (b) is judged by the same
model family that extracted the claims. So it measures "of the text-extracted
claims, does the same model family agree its own quote supports its own
claim." That is a real and useful check — it catches overreach — but it is
not the independent verification the word "entailment" implies to a reader.
The validation protocol is designed to measure exactly this gap (false
omission rate), and until it runs, the 97% is a self-consistency metric.

### The whole thing is a snapshot presented with live numbers

The scope line on the homepage ("N graded pairs · M conditions · K
verbatim claims") is read live from the DB, but the underlying evidence was
frozen at "last pipeline run: June 2026." So the numbers feel current while
the evidence is not. This is disclosed in the limitations, but the
juxtaposition of live-counts-with-frozen-evidence is misleading on the
page where a user first lands.

---

## 5. What I would do next, in priority order

1. **Run the validation study.** It is pre-registered, well-designed, and
   honest about its own limitations. Until it runs, every tier on the site
   is an unvalidated model rating. This is the single highest-leverage
   action: it converts the central claim of the system from assertion to
   measurement. Nothing else matters more.

2. **Extract the candidate-assembly logic into one place.** Make
   `build-corpus-snapshot.mjs` import from (or be generated by) the same
   code path as `substrate-candidates.ts`, or move the shared logic into a
   single module both consume. Add a test that asserts the snapshot and the
   live path produce identical output. This kills the silent-divergence
   risk.

3. **Renumber the colliding migrations (046–049).** Ten-minute fix,
   prevents a clean-provisioning failure. Do it before you need to provision
   a new environment.

4. **Persist the display-tier and curation class to the database.** Move
   the community-only / negative-evidence / class-relabel logic out of
   read-time TypeScript and into the scoring export, so the DB is the single
   source of truth for what a user sees. Then the MCP corpus server and any
   auditor reading the DB gets the same answer as the site.

5. **Serve the read path from the corpus snapshot, not live queries.** You
   already build `corpus-snapshot.json`. Have the pages read from it (or a
   cached derivative) and refresh it on a schedule / on pipeline runs. This
   removes the per-request full-table-scan problem and the redundant
   `getCandidates()` double-calls on the homepage.

6. **Swap the entailment verifier to an independent model** (PubMedBERT-NLI
   as originally specified, or any non-Anthropic model). The validation study
   will measure the gap either way, but the live system should not have its
   core guarantee judged by the same model family that produced the claims.

7. **Fix the `COMBO_RE` " and " bug and audit the curation regexes.** This
   is silently dropping candidates from the public index. Run the regex
   against the current drug labels and inspect the `combination` and
   `exclude` buckets for false positives.

8. **Reconcile the public sex-awareness framing with the two-level reality.**
   Either say plainly that the current multiplier is "evidence in women vs
   sex-data-absent" (which is honest and still useful), or do the work to
   populate F2/F3 (sex-stratified analysis extraction) so the six-band
   framing is real. The current state — six bands advertised, two firing —
   is the kind of gap an external reviewer will catch immediately.

9. **Verify the WHBench Opus-4.6 attribution.** I could confirm the paper
   and the 72.1% figure but not that the top model was Opus 4.6. If you
   have the full text, confirm it; if not, soften the claim to "the best
   model reached 72.1%" without the model name. Given your history with a
   fabricated citation, this is worth the five minutes.

---

*Assessment by Droid, 2026-08-30. Read-only; no source files or database
state were modified. The one file written is this document.*
