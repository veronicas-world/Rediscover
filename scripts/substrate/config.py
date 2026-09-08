"""Shared config for the Whel substrate pipeline (scripts/substrate/).

Mirrors the conventions of the existing repo scripts (extract-key-findings.py):
stdlib only, reads ANTHROPIC_API_KEY and the Supabase anon creds from ../../.env.local.
The pipeline writes NOTHING to the database directly; it builds a local working
store and emits supabase/migrations/047_substrate_seed_pmdd.sql for review + apply
in Supabase Studio.
"""
import os
import pathlib

REPO = pathlib.Path(__file__).resolve().parent.parent.parent     # rediscover/
SUBSTRATE_DIR = REPO / "scripts" / "substrate"
DOTENV = REPO / ".env.local"
MIGRATIONS_DIR = REPO / "supabase" / "migrations"
SEED_MIGRATION = MIGRATIONS_DIR / "047_substrate_seed_pmdd.sql"
RUN_LOG = SUBSTRATE_DIR / "audit-output" / "substrate-run.json"

# Local working store (SQLite). NOT the production DB. Kept off the mounted/FUSE
# workspace folder in sandboxed runs (SQLite locking fails there) via the env
# override; defaults to a repo-local .work/ dir for normal local runs.
WORK_DIR = pathlib.Path(os.environ.get("WHEL_SUBSTRATE_WORK", str(SUBSTRATE_DIR / ".work")))
WORK_DB = WORK_DIR / "substrate-work.db"
WORK_DIR.mkdir(parents=True, exist_ok=True)
AUDIT_OUT = SUBSTRATE_DIR / "audit-output"
AUDIT_OUT.mkdir(parents=True, exist_ok=True)


# ── Retrieval parameters (PRISMA-S) ──────────────────────────────────────────
# ONE place to see and change every limit/filter the fetchers apply. Changing a
# value here is a config edit; the fetchers have no other hard-coded caps. The
# values below reproduce EXACTLY the behaviour of the original fetchers
# (retmax=2, max 5 docs per condition, etc.). The retmax/max_documents decision
# is pending — nothing here has been raised.
RETRIEVAL = {
    "pubmed": {
        "interface": "NCBI E-utilities (esearch/efetch)",
        "db": "pubmed",
        "retmax": 2,             # PMIDs requested per esearch (was esearch default)
        "per_query": 2,          # effective per-query fetch cap (was fetch_condition default)
        "max_documents": 5,      # document cap per condition (was fetch_condition default)
        "sort": "relevance",
        "esearch_delay_s": 0.4,
        "efetch_delay_s": 0.5,
    },
    "clinicaltrials": {
        "interface": "ClinicalTrials.gov API v2",
        "max_trials": 15,        # page size AND per-condition cap (was run default)
        "agg_filter": "studyType:int",
        "delay_s": 0.4,
    },
    "community": {
        "interface": "Reddit OAuth JSON API",
        "max_posts": 15,         # top posts per condition (was run default)
        "max_comments": 20,      # comments per post (was run default)
        "search_limit": 25,      # per-search limit (was _search default)
        "sort": "top",
        "time_range": "all",
        "delay_s": 1.5,
    },
    "opentargets": {
        "interface": "Open Targets Platform GraphQL API v4",
        "max_drugs": 15,         # candidate drugs per condition (was run default)
        "delay_s": 0.5,
    },
    "aems": {
        "interface": "openFDA drug/event API",
        "max_drugs": 10,         # candidate drugs per condition (was min(max_drugs, 10))
        "max_events_per_drug": 3,
        "patient_sex_filter": "patientsex:2",
        "delay_s": 1.6,
    },
    "sider": {
        "interface": "SIDER 4.1 bulk TSV (cached download)",
        "max_drugs": 10,         # candidate drugs per condition (was run default)
        "max_events_per_drug": 3,
        "source_version": "SIDER 4.1 (2015)",
    },
}


# ── Dry-run cost assumptions (planning estimates only) ───────────────────────
# No historical usage exists yet (the previous run log recorded empty usage), so
# per-call token budgets below are informed guesses to be recalibrated from the
# first real run. Cost = calls x tokens x PRICE_IN/OUT (config.MODEL prices).
DRY_RUN_COST_ASSUMPTIONS = {
    "extract":       {"input": 600,  "output": 250},   # per candidate span
    "entail":        {"input": 500,  "output": 200},   # per claim needing a label
    "contradiction": {"input": 900,  "output": 200},   # per candidate pair
    "score":         {"input": 2500, "output": 800},   # per (intervention, condition, aspect, arm) group
}

# Single LLM backbone. The model is a commodity; the substrate is the moat.
MODEL = "claude-sonnet-4-6"
ANTHROPIC_VERSION = "2023-06-01"

# Sonnet list price (USD per token) for rough live cost tracking.
PRICE_IN = 3.0 / 1_000_000
PRICE_OUT = 15.0 / 1_000_000

USER_AGENT = "Whel-Substrate-Pipeline/0.1 (https://whel.bio; mailto:vla2117@columbia.edu)"

# ── The six conditions Whel covers. The substrate is built one condition at a
# time; the fetcher tags each document with its condition key (in meta), and the
# extractor reads that tag to focus claim extraction. `synonyms` feed both the
# triage filter and the extraction prompt; `seed_pmids` are deterministic papers
# known to contain surfaceable disagreement (optional, may be empty). ──
CONDITIONS = {
    "PMDD": {
        "label": "PMDD or PMS (premenstrual dysphoric disorder / premenstrual syndrome)",
        "canonical": "PMDD",
        "synonyms": ["premenstrual dysphoric disorder", "premenstrual syndrome", "PMDD", "PMS"],
        "seed_pmids": ["28178022", "23136064"],
        "queries": [
            "premenstrual syndrome vitamin B6 pyridoxine systematic review",
            "Vitex agnus castus premenstrual dysphoric disorder review",
            "premenstrual syndrome essential fatty acids evening primrose",
            "premenstrual dysphoric disorder SSRI efficacy adverse effects",
            "premenstrual syndrome calcium magnesium randomized",
        ],
    },
    "endometriosis": {
        "label": "endometriosis",
        "canonical": "endometriosis",
        "synonyms": ["endometriosis", "endometriotic"],
        "seed_pmids": [],
        "queries": [
            "endometriosis pain dienogest randomized controlled trial",
            "endometriosis aromatase inhibitor letrozole efficacy",
            "endometriosis NSAID treatment systematic review",
            "endometriosis GnRH agonist adverse effects review",
            "endometriosis pentoxifylline systematic review",
        ],
    },
    "PCOS": {
        "label": "PCOS (polycystic ovary syndrome)",
        "canonical": "PCOS",
        "synonyms": ["polycystic ovary syndrome", "PCOS", "polycystic ovarian"],
        "seed_pmids": [],
        "queries": [
            "polycystic ovary syndrome metformin systematic review",
            "PCOS inositol myo-inositol randomized trial",
            "polycystic ovary syndrome spironolactone hirsutism efficacy",
            "PCOS letrozole ovulation induction review",
            "polycystic ovary syndrome lifestyle metformin adverse effects",
        ],
    },
    "menopause": {
        "label": "menopause (menopausal / perimenopausal symptoms)",
        "canonical": "menopause",
        "synonyms": ["menopause", "menopausal", "perimenopausal", "vasomotor symptoms", "hot flashes"],
        "seed_pmids": [],
        "queries": [
            "menopause hot flashes SSRI SNRI efficacy randomized",
            "menopausal vasomotor symptoms gabapentin trial",
            "menopause hormone therapy systematic review benefits risks",
            "menopause black cohosh systematic review",
            "menopausal symptoms oxybutynin randomized",
        ],
    },
    "vulvodynia": {
        "label": "vulvodynia (incl. provoked vestibulodynia)",
        "canonical": "vulvodynia",
        "synonyms": ["vulvodynia", "vestibulodynia", "vulvar pain"],
        "seed_pmids": [],
        "queries": [
            "vulvodynia amitriptyline treatment efficacy",
            "vulvodynia gabapentin randomized controlled trial",
            "vulvodynia topical lidocaine systematic review",
            "provoked vestibulodynia treatment review",
            "vulvodynia tricyclic antidepressant adverse effects",
        ],
    },
    "adenomyosis": {
        "label": "adenomyosis",
        "canonical": "adenomyosis",
        "synonyms": ["adenomyosis", "adenomyotic"],
        "seed_pmids": [],
        "queries": [
            "adenomyosis dienogest treatment efficacy",
            "adenomyosis levonorgestrel intrauterine system review",
            "adenomyosis GnRH agonist systematic review",
            "adenomyosis ulipristal treatment",
            "adenomyosis medical management randomized",
        ],
    },
}

DEFAULT_CONDITION = "PMDD"  # legacy documents with no condition tag fall back to this

# Sources whose records are STRUCTURED (not free text). The substrate renders each
# record into a deterministic sentence and constructs the claim from it without a
# model; everything else (pubmed, reddit) is text. Single source of truth for the
# text-vs-structured distinction — no DB column. See ARMS_SPEC.md §1.
STRUCTURED_SOURCES = {"opentargets", "aems", "sider"}


# ── Condition normalization ────────────────────────────────────────────────
# Extraction (and the structured arms) surface condition labels verbatim from the
# source, so the same disease shows up under many names: "vasomotor symptoms",
# "hot flashes", "perimenopause" are all menopause; "PMS" and "premenstrual
# anxiety" are PMDD; "vestibulodynia" is vulvodynia. Left alone, these fragment
# the evidence across dozens of near-duplicate condition rows. `canonical_condition`
# folds a free-text label into one of the six canonical keys, or returns None when
# the label is genuinely outside Whel's scope (so callers can mark it off_scope
# rather than inventing a seventh condition). Matching is case/space-insensitive.
#
# This is intentionally a curated allow-list, NOT fuzzy matching: an unrecognized
# label returns None (off-scope) so nothing is silently mis-bucketed.
_CONDITION_NORMALIZE = {
    # canonical six (identity) — every key is stored lowercased/stripped
    "pmdd": "PMDD",
    "pms": "PMDD",
    "pms/pmdd": "PMDD",
    "pmdd/pms": "PMDD",
    "premenstrual syndrome": "PMDD",
    "premenstrual dysphoric disorder": "PMDD",
    "premenstrual dysphoric disorder (pmdd)": "PMDD",
    "premenstrual anxiety": "PMDD",
    "premenstrual": "PMDD",
    "premenstrual symptoms": "PMDD",
    "premenstrual mood symptoms": "PMDD",
    "luteal phase symptoms": "PMDD",

    "endometriosis": "endometriosis",
    "endometriotic": "endometriosis",
    "deep infiltrating endometriosis": "endometriosis",
    "pelvic endometriosis": "endometriosis",

    "pcos": "PCOS",
    "polycystic ovary syndrome": "PCOS",
    "polycystic ovarian syndrome": "PCOS",
    "polycystic ovary syndrome (pcos)": "PCOS",

    "menopause": "menopause",
    "menopausal": "menopause",
    "menopausal symptoms": "menopause",
    "postmenopause": "menopause",
    "postmenopausal": "menopause",
    "perimenopause": "menopause",
    "perimenopausal": "menopause",
    "vasomotor symptoms": "menopause",
    "vasomotor symptoms in menopausal women": "menopause",
    "vasomotor symptoms of menopause": "menopause",
    "hot flashes": "menopause",
    "hot flushes": "menopause",
    "hot flash": "menopause",
    "hot flush": "menopause",
    "night sweats": "menopause",
    "genitourinary syndrome of menopause": "menopause",
    "genitourinary symptoms": "menopause",
    "genitourinary syndrome": "menopause",
    "vulvovaginal atrophy": "menopause",
    "vaginal atrophy": "menopause",

    "vulvodynia": "vulvodynia",
    "vestibulodynia": "vulvodynia",
    "provoked vestibulodynia": "vulvodynia",
    "provoked vulvodynia": "vulvodynia",
    "localized provoked vulvodynia": "vulvodynia",
    "vulvar pain": "vulvodynia",
    "vulvar vestibulitis": "vulvodynia",
    "vulvar vestibulitis syndrome": "vulvodynia",

    "adenomyosis": "adenomyosis",
    "adenomyotic": "adenomyosis",
}


def canonical_condition(name):
    """Fold a free-text condition label into one of the six canonical keys.

    Returns the canonical key (e.g. "menopause") for any recognized synonym, or
    None when the label is outside Whel's six conditions (off-scope). Matching is
    case-insensitive and whitespace-trimmed; unrecognized labels return None so the
    caller can decide (mark off_scope, fall back to a doc tag, etc.) rather than
    creating a spurious new condition.
    """
    if not name:
        return None
    key = " ".join(str(name).strip().lower().split())
    return _CONDITION_NORMALIZE.get(key)


def load_dotenv(path: pathlib.Path = DOTENV) -> None:
    if not path.exists():
        return
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        k, v = k.strip(), v.strip().strip('"').strip("'")
        # Fill in when absent OR empty (some environments pre-export empty vars).
        if k and not os.environ.get(k):
            os.environ[k] = v


def anthropic_key() -> str:
    load_dotenv()
    key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        raise RuntimeError("ANTHROPIC_API_KEY not set (in .env.local or environment)")
    return key
