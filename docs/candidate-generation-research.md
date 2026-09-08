# Candidate generation research: LLM screening and repurposing candidate generation

**Status:** Research memo (no code changes). Written 2026-09.
**Purpose:** Two follow-up questions to `docs/retrieval-standards-research.md`:
(1) what is the evidence for LLM-based screening versus classical active learning?
(2) how do drug-repurposing platforms actually generate candidates — knowledge graphs
or literature alone?
**Sourcing rule:** every factual claim carries a retrievable primary source with a URL.
Where no source could be found, the question is marked unanswered.

---

## 1. LLM-based screening: the state of the evidence

**Lieberum et al. 2025 (scoping review of 37 studies).** A scoping review of the
literature on using large language models for systematic-review tasks concluded that
LLMs are "on the rise, but not yet ready for use." The review found that studies report
promising but inconsistent results, that there is no validated, ready-to-deploy LLM
screening workflow, and that the evidence base is too early-stage to support replacing
human or classical-machine screening. The review's title is its conclusion.

- Lieberum J-L, et al. "Large language models for conducting systematic reviews: on the
  rise, but not yet ready for use – a scoping review." *Journal of Clinical
  Epidemiology* 2025 (published online 2025-02-01):
  https://pubmed.ncbi.nlm.nih.gov/40021099/

**Sciurti et al. 2025 (compact LLMs).** An assessment of compact LLMs for title and
abstract screening in systematic reviews, published in *Research Synthesis Methods*.
It evaluates feasibility, accuracy, and workload reduction. The paper reports that
compact LLMs can reduce workload, but the reported precision is low (below ~10% in the
evaluated settings), meaning the models still require substantial human screening to
catch what they miss — the opposite of a validated replacement.

- Sciurti A, et al. "Compact large language models for title and abstract screening in
  systematic reviews: an assessment of feasibility, accuracy, and workload reduction."
  *Research Synthesis Methods* 2025;17(2):
  https://pubmed.ncbi.nlm.nih.gov/41635943/

**Contrast with classical active learning.** The validated, low-cost alternative is
active learning (ASReview-style), which achieves roughly 64–92% work saved at 95%
recall using a Naive Bayes + TF-IDF model, at zero LLM API cost:

- Ferdinands G, et al. "Active learning for screening prioritization in systematic
  reviews — a simulation study evaluating strategies." *Research Synthesis Methods*
  2023;14(6):818–836: https://doi.org/10.1002/jrsm.1631
- van de Schoot R, et al. "An open source machine learning framework for efficient and
  transparent systematic reviews." *Nature Machine Intelligence* 2021;3:125–133:
  https://www.nature.com/articles/s42256-020-00287-7

**Verdict.** LLM screening is early-stage and not validated; the classical active
learning method is the better tool today. This matches the conclusion in
`docs/retrieval-standards-research.md` §5.

---

## 2. How repurposing platforms generate candidates

**Knowledge-graph methods dominate.** The major repurposing platforms and research
systems generate candidates by integrating many data sources into a graph and scoring
drug–disease (or target–disease) pairs, not by reading literature alone.

- **Open Targets Platform** integrates target–disease evidence from curated,
  experimental, and automated literature-mined sources into a scored knowledge base:
  https://academic.oup.com/nar/article/49/D1/D1302/5983621 (NAR 2021) and
  https://platform.opentargets.org
- **Hetionet / Project Rephetio** (Himmelstein et al. 2017) built a heterogeneous
  biomedical knowledge graph (drugs, diseases, genes, pathways, etc.) and used machine
  learning on that graph to prioritize drug–disease pairs for repurposing at scale:
  https://elifesciences.org/articles/26726 (*eLife* 2017)
- **Every Cure / MATRIX** is an open-source project (Apache-2.0) whose public
  repository describes a pipeline that ingests and merges biomedical knowledge graphs
  (RTX-KG2, ROBOKOP), stores them in a Neo4j graph database, generates graph
  embeddings, builds drug–disease association matrices, and trains machine-learning
  models to produce predictions. Candidate generation is therefore by knowledge-graph
  link prediction. This is inferred from the repository itself, because no published
  methods paper was found for MATRIX (see Gaps, §4). Whel cross-references the MATRIX
  dataset on `/about/external-references` as an independent biological-plausibility
  layer, shown beside Whel's own grades rather than blended into them:
  https://github.com/everycure-org/matrix

**Manual curation is the other established route.** ReDO_DB (Repurposing Drugs in
Oncology Database) is a manually curated database of repurposing candidates in
oncology, built by expert review of the literature rather than automated discovery:

- Pantziarka P, et al. "ReDO_DB: the repurposing drugs in oncology database."
  *ecancermedicalscience* 2018;12:886:
  https://ecancer.org/en/journal/article/886-redo-db-the-repurposing-drugs-in-oncology-database

**The only automated literature-alone method found is new and unvalidated.** Liang et
al. 2025 describe generating de novo drug-repurposing candidates from literature data
alone (published in *BMC Bioinformatics*, 2025). It is the only automated,
literature-only candidate-generation method found in this research, and it is recent
and unvalidated — there is no evidence yet that it produces reliable candidates.

- Liang et al. "Literature data-based de novo candidates for drug repurposing." *BMC
  Bioinformatics* 2025;26:200:
  https://link.springer.com/article/10.1186/s12859-025-06237-7

**Verdict.** No production repurposing platform generates candidates from literature
alone. The established routes are (a) knowledge-graph integration with scoring (Open
Targets, Hetionet, Every Cure's MATRIX) or (b) expert manual curation (ReDO_DB). The
single automated literature-only method found (Liang 2025) is new and unvalidated.

---

## 3. Implication for Whel

Whel's candidate list is **curated, not discovered**. It was assembled from a fixed,
capped sample (see `docs/retrieval-standards-research.md` §1) plus seed PMIDs and
manually chosen sources, not produced by an automated candidate-generation system. The
README note added alongside this memo states this explicitly. If Whel later wants
automated candidate generation, the evidence points to knowledge-graph integration
(Open Targets, Hetionet, Every Cure's MATRIX) as the established method — not
literature-alone extraction.

---

## 4. Gaps and unanswered questions

- **Every Cure / MATRIX methods paper.** No published, peer-reviewed methods paper was
  found for MATRIX. The statement that candidate generation is by knowledge-graph link
  prediction is inferred from the public repository (README, pipeline layout, the
  Neo4j + graph-embedding stack) and is marked as inference, not as a documented
  method. If a methods paper exists, this memo should be updated to cite it. This is a
  finding about a project Whel compares itself against, not a gap in our sourcing.
