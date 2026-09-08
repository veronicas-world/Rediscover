# Retrieval standards research: literature searching at scale

**Status:** Research memo (no code changes). Written 2026-09.
**Purpose:** Document established practice for literature searching at scale, so the
question "is the Whel corpus thin because the literature is thin, or because retrieval
under-collected?" can be answered against external standards rather than vibes.
**Sourcing rule:** every factual claim carries a retrievable primary source with a URL.
Where no source could be found, the question is marked unanswered.

---

## 1. The problem in one paragraph

Whel's PubMed intake is capped hard. `fetch_pubmed.py` runs `esearch(query, retmax=2)`
per query and `fetch_condition(..., max_documents=5, per_query=2)`, and `config.py`
defines 5 queries per condition across 6 conditions. The result is exactly 30 PubMed
documents (6 × 5), which is what the seed migration 047 contains. Those same 6
conditions' queries, re-run with `retmax=0` (count only), return **1,192 papers** with
the original queries and **105,982** with broader queries. Whel holds roughly **2.5% of
what its own queries return**. The literature is not thin; the retrieval design is.

The funnel that produced the current corpus (from `substrate-run.json` and the seed
migrations):

| Stage | Count |
|---|---|
| Documents ingested | 344 (30 pubmed, 30 clinicaltrials, 146 reddit, 64 opentargets, 54 aems, 20 sider) |
| Spans extracted | 945 |
| Claims | 465 |
| Provenance-verified | 463 |
| Entailment-labeled | 449 |
| Signals | 228 |
| Active signals | 226 |

This memo covers five areas: the methodological standard, how comparable databases take
in literature, available retrieval infrastructure, screening at scale, and cost
estimates for scaling.

---

## 2. Methodological standard: Cochrane Handbook and PRISMA-S

**Cochrane Handbook, Chapter 4 ("Searching for and selecting studies").** The Cochrane
standard is that the search stage is designed to **maximize sensitivity (recall)**, not
precision. Noise is expected and is handled downstream by screening. Chapter 4 states
that searches should aim to identify as many relevant studies as possible, and that
search strategies are developed to be sensitive, with precision traded off
deliberately. The chapter is explicit that the goal of the search is high recall and
that screening removes the irrelevant records the broad search necessarily retrieves.

- Cochrane Handbook, Chapter 4 (last updated March 2025):
  https://training.cochrane.org/handbook/current/chapter-04

**PRISMA-S (PRISMA for Searching).** The PRISMA-S extension (Systematic Reviews, 2021)
adds a 16-item checklist specifically for reporting literature searches. Its core
requirement is that searches be **reproducible and fully reported**: databases,
platforms, full search strategies, date restrictions, deduplication, and any
validation or peer-review of the search must all be documented. Under PRISMA-S, an
unreported search is an unreported study.

- PRISMA-S: Rethlefsen ML, et al. "PRISMA-S: an extension to the PRISMA Statement for
  Reporting Literature Searches in Systematic Reviews." *Systematic Reviews* 2021;10:39:
  https://systematicreviewsjournal.biomedcentral.com/articles/10.1186/s13643-020-01542-z

**Contrast with Whel's current approach.** Whel's intake inverts the standard: it caps
retrieval at a tiny fixed sample (retmax=2, max 5 docs per condition), has no screening
stage at all, and the search parameters live in code rather than in a reported,
reproducible protocol. Under Cochrane/PRISMA-S practice, the correct shape is broad
retrieval → screening → inclusion, with the search fully documented. The current Whel
shape (tiny retrieval → everything kept) is the reverse.

**Duplicate publication: one study, many reports (design requirement for the redesign).**
Cochrane's unit of interest is the study, not the report. Chapter 4 of the Handbook
(version 6.5.1) states that "systematic reviews have studies as the primary units of
interest and analysis. A single study may have more than one report about it (or record
for it)" (Section 4.2.3, "Studies versus reports of studies"), and that selection
therefore requires two processes, one of which is "to link together multiple reports of
the same study" into a single study (Section 4.6.1, "Studies (not reports) as the unit
of interest"). Section 4.6.2 ("Identifying multiple reports from the same study") is
blunt about the failure mode: "Duplicate publication can introduce substantial biases if
studies are inadvertently included more than once in a meta-analysis"; duplicates range
"from identical manuscripts to reports describing different outcomes of the study or
results at different time points"; and detecting them "can be difficult" — some
"detective work" is required. For the redesign this is a screening-stage requirement,
per standard systematic review practice: **all reports of one study or guideline must be
linked together and counted once.**

- Cochrane Handbook, Chapter 4: Lefebvre C, Glanville J, Briscoe S, Featherstone R,
  Littlewood A, Metzendorf M-I, et al. Searching for and selecting studies. In: Higgins
  JPT, Thomas J, Chandler J, et al, editors. Cochrane Handbook for Systematic Reviews of
  Interventions version 6.5.1 (updated March 2025). Cochrane, 2025.
  https://training.cochrane.org/handbook/current/chapter-04 (Sections 4.2.3, 4.6.1, 4.6.2)

**Whel's dedup would not catch this.** The pipeline dedups at insert time:
`fetch_pubmed.py` computes `sha256(title + "\n\n" + abstract)` of the document,
and `fetch_pathway.py` dedups on a content hash and the (source, external_id,
condition) triple. Co-publication defeats both keys. This hazard was hit literally
while building `docs/outreach-prospects.md`: the 2023 International Guideline for the
Assessment and Management of PCOS is one document co-published in four journals —
Fertil Steril (PMID 37589624, DOI 10.1016/j.fertnstert.2023.07.025), J Clin Endocrinol
Metab (PMID 37580314, DOI 10.1210/clinem/dgad463), Human Reproduction (PMID 37580037,
DOI 10.1093/humrep/dead156), and Eur J Endocrinol (PMID 37580861, DOI
10.1093/ejendo/lvad096) — as four formattings with four PMIDs. Each version carries a
different external_id, and each journal re-typesets the text, so the content hashes
differ as well. Under the current pipeline all four would enter as four sources, and
corroboration would score shared claims as four-way agreement: the exact bias
Cochrane warns about, built into the scoring pipeline.

**The risk grows with corpus size.** At retmax=2 the hazard rarely materializes — a
duplicate would have to surface twice in a two-record sample. Guideline co-publication
across journals is deliberate practice (the PCOS Network published in four journals
specifically to maximize reach) and is common in full result sets, so the problem gets
worse exactly when we fix retmax: more records retrieved means more duplicate reports
entering, with no mechanism that links them.

---

## 3. How comparable databases take in literature

None of the comparable biomedical databases rely on a small fixed sample. They use
broad retrieval plus curation or screening.

**Open Targets Platform.** The platform integrates evidence about target–disease
associations from many sources, including automated literature mining over Europe PMC
abstracts alongside curated and experimental data. Its 2021 NAR paper describes the
data integration and evidence-scoring pipeline.

- Open Targets Platform (2021), *Nucleic Acids Research* 49(D1):D1302–D1310:
  https://academic.oup.com/nar/article/49/D1/D1302/5983621
- Platform: https://platform.opentargets.org

**CTD (Comparative Toxicogenomics Database).** CTD manually curates chemical–gene,
chemical–disease, and gene–disease relationships from the literature, harmonizing
cross-species data. The 2023 update describes the curation workflow.

- Davis AP, et al. "Comparative Toxicogenomics Database (CTD): update 2023." *Nucleic
  Acids Research* 2023;51(D1):D1257–D1262:
  https://academic.oup.com/nar/article/51/D1/D1257/6725767
- Database: https://ctdbase.org

**DisGeNET.** DisGeNET integrates gene–disease associations from text-mining, curated
repositories, and experimental data sources, with a scoring model for confidence. The
2019-update paper describes the data sources and integration.

- Piñero J, et al. "The DisGeNET knowledge platform for disease genomics: 2019 update."
  *Nucleic Acids Research* 2020;48(D1):D845–D855:
  https://academic.oup.com/nar/article/48/D1/D845/5611674
- Platform: https://www.disgenet.org

**ChEMBL.** ChEMBL manually curates bioactivity data (binding, functional, ADMET) for
drug-like compounds from the primary literature, with an extraction pipeline that
starts from broad literature capture. The 2023-update paper describes the curation and
data model.

- Zdrazil B, et al. "The ChEMBL Database in 2023: a drug discovery platform spanning
  multiple bioactivity data types and time periods." *Nucleic Acids Research*
  2024;52(D1):D1180–D1192:
  https://academic.oup.com/nar/article/52/D1/D1180/7337608
- Database: https://www.ebi.ac.uk/chembl

**Common thread.** All four take in the literature broadly and then curate or score
downstream. None of them sample a handful of hits per query and call that the corpus.
That is the difference between a curated database and a fixed sample.

---

## 4. Available infrastructure for literature retrieval

All four major public APIs are free to use for this scale of work. Cost is not the
binding constraint on Whel's retrieval.

**NCBI E-utilities.** The Entrez Programming Utilities (esearch, efetch, elink, esummary)
are the standard interface to PubMed. Free; no API key required for modest use; rate
limits are 3 requests/second without an API key and 10/second with one. This is the
API Whel's `fetch_pubmed.py` already uses.

- E-utilities documentation (Entrez Programming Utilities Help):
  https://www.ncbi.nlm.nih.gov/books/NBK25501/

**Europe PMC RESTful Web Service.** Free, no API key required for basic use. Provides
search over metadata and full text, including open-access full-text retrieval, plus
grant and citation data. Indexes all PubMed records plus preprints.

- Europe PMC RESTful Web Service:
  https://europepmc.org/RestfulWebService

**OpenAlex API.** Free with a free API key (no payment method). The free tier provides
a daily credit (~$1/day of usage, roughly 100k works/day), which is far more than Whel
needs. Covers 250M+ scholarly works including preprints, with abstracts, concepts, and
citations.

- OpenAlex API overview:
  https://docs.openalex.org/how-to-use-the-api/api-overview
- Developer portal: https://developers.openalex.org

**Semantic Scholar Academic Graph API.** Free, rate-limited (the free tier allows a few
hundred requests per second with a key; unauthenticated access is more restricted).
Covers 200M+ papers, with embeddings, citations, and paper metadata.

- Semantic Scholar Academic Graph API:
  https://www.semanticscholar.org/product/api

**Implication.** Whel could pull the full result set for its existing queries (1,192
papers) from any of these APIs at zero API cost. The constraint is not infrastructure.

---

## 5. Screening at scale: active learning

Because broad retrieval returns noise, the standard workflow needs a screening step.
The established, low-cost method is **active learning**: a model ranks records by
relevance, the reviewer labels the top ones, and the model re-ranks. This is the
approach behind ASReview.

**Ferdinands et al. 2023 (simulation study).** A large simulation study of active
learning strategies for screening prioritization in systematic reviews found that the
**Naive Bayes + TF-IDF** model performed best overall, and that active learning
strategies achieved roughly **64–92% work saved at 95% recall** across datasets,
compared with screening in random order.

- Ferdinands G, et al. "Active learning for screening prioritization in systematic
  reviews — a simulation study evaluating strategies." *Research Synthesis Methods*
  2023;14(6):818–836:
  https://doi.org/10.1002/jrsm.1631

**van de Schoot et al. 2021 (ASReview).** ASReview is the open-source, freely available
implementation of this workflow (active learning with a transparent, reproducible
record of every screening decision). Published in *Nature Machine Intelligence*.

- van de Schoot R, et al. "An open source machine learning framework for efficient and
  transparent systematic reviews." *Nature Machine Intelligence* 2021;3:125–133:
  https://www.nature.com/articles/s42256-020-00287-7

**Why this matters for Whel.** Active learning screening has **zero marginal API cost**
(it is local ML, not an LLM call) and is the method with the strongest published
evidence. It is the classical, validated alternative to LLM-based screening, which is
covered in `docs/candidate-generation-research.md`.

---

## 6. Cost estimates for scaling

Whel's LLM pipeline (`config.py`) uses `claude-sonnet-4-6` at $3/M input tokens and
$15/M output tokens, with Opus as the production-scoring option. Scaling PubMed intake
from the current 30 documents to the 1,192 documents that Whel's own queries return
was estimated at roughly **$193–$642**, depending on two choices:

- **Screening method.** With active learning (Section 5), the LLM only reads the
  screened-in set, so spend is proportional to the included documents. With LLM-based
  screening, the LLM reads every retrieved abstract, multiplying token spend.
- **Model choice.** Sonnet at $3/$15 per M vs Opus at a higher rate for scoring.

These are planning-order estimates for the pipeline's LLM stage only; they exclude the
(negligible) API cost of retrieval itself, which is free at this scale (Section 4). The
exact per-stage breakdown depends on the scoring prompt lengths, which were not
re-derived for this memo; the range reflects the screening and model choices above.

---

## 7. Bottom line

The literature is not thin. Whel's own queries return 1,192 papers; the corpus holds
30. Established practice (Cochrane, PRISMA-S) is broad recall at the search stage and a
screening step downstream; comparable databases (Open Targets, CTD, DisGeNET, ChEMBL)
all retrieve broadly and curate or score afterward; the infrastructure to do this is
free; and the validated screening method (active learning) costs nothing in API spend.
The cap, not the literature, is the binding constraint.

Fixing retrieval (the `retmax`/`max_documents` caps) is a separate conversation and is
explicitly out of scope for this memo — no code changes were requested.
