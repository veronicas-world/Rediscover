/**
 * Per-arm rubric anchor definitions, sourced from SCORING_SPEC §2.
 *
 * The spec is the authority; this is the machine-readable rendering source for
 * the signal-types page. If the spec changes, update this file — the page
 * renders from it, so a drift here is the only place drift can start.
 *
 * Anchor text is written for a clinician, not an implementer: plain sentences,
 * no internal jargon, no version numbers.
 */

export const RUBRIC_ANCHORS = {
  direct: {
    label: "Direct research",
    intro:
      "Published studies and registered clinical trials that investigate the condition itself.",
    dimensions: [
      {
        key: "corroboration",
        label: "Corroboration",
        means: "Independent replication — how many independent sources report the same effect.",
        anchors: [
          "A single primary study.",
          "A single systematic review or meta-analysis, or two independent studies.",
          "Three or more independent and consistent studies, or one large, well-powered, low-bias randomized trial.",
        ],
      },
      {
        key: "rigor",
        label: "Rigor",
        means: "Study design and risk of bias — the strength of the evidence type, not just its label.",
        anchors: [
          "Case report or preclinical data.",
          "Observational study, small trial, or a randomized trial with high risk of bias.",
          "A randomized trial at low risk of bias, a meta-analysis of such trials, or an active clinical guideline.",
        ],
      },
      {
        key: "specificity",
        label: "Specificity",
        means: "This drug, this condition, this outcome — not a proxy for any of the three.",
        anchors: [
          "Proxy only — a related drug or condition, not this pair.",
          "Drug and condition both named, but the outcome is a surrogate or indirect endpoint.",
          "Drug and condition named directly, and the outcome is the one patients care about.",
        ],
      },
      {
        key: "plausibility",
        label: "Plausibility",
        means: "Whether a credible biological mechanism connects the drug to the condition.",
        anchors: [
          "Asserted without support.",
          "Plausible but not demonstrated.",
          "Evidenced in relevant biology.",
        ],
      },
    ],
    consistency: {
      means: "Whether the sources agree in direction.",
      anchors: {
        "0": "No penalty — sources agree, or only one source (not assessable).",
        "−1": "Sources point in mixed directions.",
        "−2": "Direct conflict on the primary outcome.",
      },
    },
  },

  pathway: {
    label: "Pathway insights",
    intro:
      "Mechanistic evidence — target engagement, preclinical pharmacology, and side-effect signals.",
    dimensions: [
      {
        key: "corroboration",
        label: "Corroboration",
        means: "How many independent mechanistic lines of evidence converge — counted as lines, not as documents.",
        anchors: [
          "One line of evidence only.",
          "Two independent lines.",
          "Three or more independent lines.",
        ],
      },
      {
        key: "rigor",
        label: "Rigor",
        means: "Human relevance of the models used.",
        anchors: [
          "In vitro or cell-line data only, or computational prediction alone.",
          "Animal model, or human tissue ex vivo.",
          "Human in vivo data — target engagement, biomarker, or genetic association in people.",
        ],
      },
      {
        key: "specificity",
        label: "Specificity",
        means: "Selectivity of the drug's action on the named target.",
        anchors: [
          "The target is one of many the drug hits, or the drug–target link is merely asserted.",
          "The drug hits the target among a few others, and the link is measured.",
          "The drug acts selectively on the named target, with a measured affinity or engagement.",
        ],
      },
      {
        key: "plausibility",
        label: "Plausibility",
        means: "Whether hitting this target plausibly moves this condition.",
        anchors: [
          "The link to the condition is speculative.",
          "The target sits in a pathway implicated in the condition.",
          "The target is independently implicated in this condition's biology, from a source other than the drug's own record.",
        ],
      },
    ],
    consistency: {
      means: "Whether the mechanistic signals point the same way.",
      anchors: {
        "0": "No penalty — all lines agree, or only one line (not assessable).",
        "−1": "Lines point in mixed directions.",
        "−2": "One line predicts the opposite effect of another.",
      },
    },
  },

  community: {
    label: "Community reports",
    intro:
      "Patient-reported outcomes from online forums, scored on patient-report-appropriate criteria (the GRADE-CERQual approach), never on trial design.",
    dimensions: [
      {
        key: "corroboration",
        label: "Corroboration",
        means: "Independence of accounts — counted as distinct accounts, not as posts.",
        anchors: [
          "A single account, or signs of coordination.",
          "A few independent accounts.",
          "Many independent accounts across threads, communities, or time.",
        ],
      },
      {
        key: "rigor",
        label: "Rigor",
        means: "Specificity of the report — how clearly the patient describes what happened.",
        anchors: [
          "Vague (\"felt bad\").",
          "Symptom clear, but timing or dose fuzzy.",
          "Clear symptom, dose, and timing.",
        ],
      },
      {
        key: "specificity",
        label: "Specificity",
        means: "This drug, this outcome.",
        anchors: [
          "Drug or outcome vague.",
          "One is clear.",
          "Both clear and linked.",
        ],
      },
      {
        key: "plausibility",
        label: "Plausibility",
        means: "Whether the report fits the drug's known pharmacology.",
        anchors: [
          "Not explained by the drug's known mechanism.",
          "Loosely consistent.",
          "Directly fits known pharmacology.",
        ],
      },
    ],
    consistency: {
      means: "Whether reports agree (confirm vs. deny).",
      anchors: {
        "0": "No penalty — confirmations dominate and dose/timing coheres, or a single account (not assessable).",
        "−1": "Mixed, on the independence-weighted confirm-to-deny ratio.",
        "−2": "Substantive denials outweigh confirmations.",
      },
    },
  },
};

/**
 * The consistency penalty, explained once for the page. The triggers differ
 * per arm (see RUBRIC_ANCHORS[arm].consistency) but the principle is the same:
 * consistency can only subtract, never add.
 */
export const CONSISTENCY_PENALTY = {
  label: "The consistency penalty",
  summary:
    "Consistency is not a dimension that can inflate a score. It is a penalty that applies only when sources genuinely disagree. A single source is not evidence of inconsistency — it is simply not assessable — and scores 0. This follows GRADE, which never lets inconsistency add certainty.",
  rows: [
    { value: "0", meaning: "No penalty. Sources agree, or there is only one source (agreement is not assessable)." },
    { value: "−1", meaning: "Sources point in mixed directions." },
    { value: "−2", meaning: "Direct conflict on the primary outcome." },
  ],
};

/**
 * GRADE provenance: for each dimension, what it maps to in GRADE and whether
 * it is adapted or invented. Sourced from SCORING_SPEC §2 and the user's
 * explicit mapping. The summary sentence is the most important one on the page.
 */
export const GRADE_MAPPING = [
  {
    whel: "Rigor",
    grade: "GRADE risk of bias",
    status: "adapted",
    note: "Study design and risk of bias, scored together — the same construct GRADE uses.",
  },
  {
    whel: "Specificity",
    grade: "GRADE indirectness",
    status: "adapted",
    note: "Whether the evidence speaks to this drug, this condition, and this patient-relevant outcome.",
  },
  {
    whel: "Consistency",
    grade: "GRADE inconsistency",
    status: "adapted",
    note: "Downgrade-only, as GRADE does it: disagreement can subtract certainty, never add it.",
  },
  {
    whel: "Corroboration",
    grade: "No direct GRADE equivalent",
    status: "partial",
    note: "Related to GRADE precision and to the broader idea of replication. GRADE folds replication into certainty; Whel scores it separately.",
  },
  {
    whel: "Plausibility",
    grade: "Not a GRADE dimension",
    status: "novel",
    note: "GRADE grades clinical evidence and does not score mechanism. The closest precedent is the Bradford Hill criteria for causal inference.",
  },
  {
    whel: "Female-applicability multiplier",
    grade: "Not in GRADE",
    status: "novel",
    note: "No published evidence-grading framework adjusts for how far the evidence was generated in women. This is Whel's own extension.",
  },
];

export const GRADE_SUMMARY =
  "Three of these dimensions are adapted from GRADE, one is partial, and two are our own extensions that no published framework validates.";

/**
 * Source links for the rubric section. Same sources as SCORING_SPEC §10.
 */
export const RUBRIC_SOURCES = [
  { label: "GRADE Working Group", href: "https://www.gradeworkinggroup.org/" },
  { label: "GRADE (Guyatt et al., BMJ 2008)", href: "https://www.bmj.com/content/336/7650/924" },
  { label: "GRADE-CERQual (Lewin et al., PLOS Medicine 2015)", href: "https://doi.org/10.1371/journal.pmed.1001895" },
  { label: "Cochrane Handbook, ch. 8", href: "https://training.cochrane.org/handbook" },
  { label: "Oxford CEBM Levels of Evidence", href: "https://www.cebm.ox.ac.uk/resources/levels-of-evidence/ocebm-levels-of-evidence" },
];
