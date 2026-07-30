// Display-time curation of the candidate index.
//
// The substrate surfaces some entries that are not clean single-molecule drug
// repurposing candidates: non-drug interventions and procedures, junk/vague
// extraction labels, multi-agent combination regimens, and supplements /
// herbals. This module classifies each candidate by its drug label so the
// public candidate index can show only real single-agent drug candidates,
// while combination regimens and supplements are segregated into their own
// views rather than graded as first-class candidates.
//
// This is a reversible, display-time filter — it does NOT modify the substrate.
// Tune the rules here. Drug CLASSES (e.g. "aromatase inhibitors", "SSRIs")
// are intentionally NOT reclassified here yet; resolving a class label to its
// specific molecules is a separate, data-level decision.
//
// Keep in sync with the copy in scripts/build-corpus-snapshot.mjs.

export type CurationClass = "drug" | "exclude" | "combination" | "supplement" | "class";

// Drug-CLASS resolution. Two cases:
//  1. A class dominated by one molecule that is the right single-agent
//     representative → relabel to that molecule (and dedup against any existing
//     row for the same molecule, keeping the stronger evidence).
//  2. A rollup of several molecules that ALREADY appear as their own candidates
//     → mark "class" and drop from the graded index (the molecule rows carry the
//     grade), so we don't double-count.
// Attribution note: mapping a class-level result onto its representative
// molecule is a judgement call — verify against the underlying claims.
export const CLASS_TO_MOLECULE: Record<string, string> = {
  "aromatase inhibitors": "Letrozole",   // most-studied AI in these indications
  "anti-androgens": "Spironolactone",    // dominant anti-androgen for PCOS/hirsutism
};
const CLASS_ROLLUP = new Set([
  "ssris", "snris", "ssri/snris", "snri/ssris",
  "gnrh agonist", "gnrh agonists", "gnrha",
  // Vague hormone-therapy rollups. The specific molecules (estradiol, estriol,
  // conjugated equine estrogen, etc.) are graded on their own rows, so keeping
  // these class labels double-counts and reads as un-curated.
  "hormonal therapy", "nonhormonal therapy", "hormone replacement therapy",
  "menopausal hormone therapy", "menopause hormone therapy",
  "estrogen therapy", "estrogen monotherapy", "estrogen",
  "bioidentical estrogens", "vaginal estrogen", "vaginal oestrogen",
  "low-dose vaginal estrogen", "estrogen therapy (intravaginal)",
]);

/**
 * Drug–condition pairs where the published randomized evidence is NEGATIVE.
 * These must never present as positive signals, however enthusiastic the
 * community reports are. Keyed `drug::conditionId` (lowercased).
 */
export const KNOWN_NEGATIVE: Record<string, string> = {
  "progesterone::pmdd":
    "Randomized placebo-controlled trials have consistently found progesterone no better than placebo for severe PMS/PMDD. Retained as a documented negative result, not a candidate.",
};

export function knownNegativeNote(drug: string, conditionId: string): string | null {
  return KNOWN_NEGATIVE[`${String(drug).trim().toLowerCase()}::${String(conditionId).trim().toLowerCase()}`] ?? null;
}

/**
 * Detects rationales whose own cited evidence reports a NEGATIVE or NULL result
 * (the trial found no benefit), so the pair is never presented as a positive
 * signal. Deliberately conservative: it matches explicit no-effect findings
 * only.
 *
 * It intentionally does NOT match comparative or weak-positive language
 * ("less effective than", "inferior to", "second-line"), because those describe
 * a drug that does work, just not best in class. Capping those would be an
 * over-correction that misrepresents the evidence in the other direction.
 *
 * Auto-detection is a safety net, not a substitute for review: anything it
 * flags is surfaced on the card so a false positive is visible and correctable.
 */
const NEGATIVE_EVIDENCE_RE = new RegExp(
  [
    // "did not reduce pain", "the data do not support", "does not improve"
    String.raw`\b(did|do|does|was|were)\s+not\s+(reduce|improve|differ|decrease|change|support|show|demonstrate|outperform|exceed)`,
    // "no better than placebo", "not superior to placebo"
    String.raw`no\s+(better|greater)\s+than\s+placebo`,
    String.raw`not\s+(superior|better)\s+to\s+placebo`,
    String.raw`no\s+more\s+effective\s+than\s+placebo`,
    // "no significant difference/improvement/effect/benefit/reduction"
    String.raw`no\s+(statistically\s+)?significant\s+(difference|improvement|effect|benefit|reduction|change)`,
    // "failed to demonstrate/meet"
    String.raw`failed\s+to\s+(show|demonstrate|reduce|improve|meet|achieve)`,
    // outright null verdicts
    String.raw`\bineffective\b`,
    String.raw`(was|were)\s+not\s+effective`,
    String.raw`no\s+evidence\s+(of|for)\s+(benefit|efficacy|effect)`,
  ].join("|"),
  "i",
);

/**
 * Preference-ranking idiom: "evidence does not support X preferentially to Y",
 * "X is not preferred over Y", "not recommended as first-line". These compare
 * two treatments that BOTH work and must not be read as a null result. Note the
 * override is deliberately narrow so it cannot swallow a true negative that
 * merely mentions its placebo comparator ("did not reduce pain compared with
 * placebo" stays flagged).
 */
const PREFERENCE_RANKING_RE =
  /not\s+(be\s+)?(support(ed)?|prefer(red)?|recommended)[^.]{0,90}?(preferentially|over\s+(the\s+)?\w|rather\s+than|in\s+preference|as\s+(a\s+)?first[- ]line)/i;

export function negativeEvidenceDetected(...text: (string | undefined | null)[]): boolean {
  const t = text.filter(Boolean).join("  ");
  if (PREFERENCE_RANKING_RE.test(t)) return false;
  return NEGATIVE_EVIDENCE_RE.test(t);
}

/**
 * True when every verbatim claim behind a signal is a community/patient report
 * (no published literature or trial registry source). Such signals are
 * hypothesis-generating only: the rubric's corroboration and rigor dimensions
 * cannot be satisfied by anecdote, so they are capped at `exploratory`.
 */
export function isCommunityOnly(claims: { src?: string }[] | undefined): boolean {
  if (!claims || claims.length === 0) return false;
  return claims.every((c) => /community|reddit/i.test(String(c?.src ?? "")));
}

/**
 * Normalize a raw drug label for display. Upstream drug databases store names
 * in ALL CAPS ("DIENOGEST", "GONADOTROPIN, CHORIONIC"); the substrate's own
 * labels are lowercase. Presenting both side by side reads as a database dump,
 * so all-caps names are title-cased and inverted "SURNAME, MODIFIER" forms are
 * flipped back into reading order. Mixed-case labels are left untouched.
 */
export function normalizeDrugName(drug: string | null | undefined): string {
  const raw = String(drug ?? "").trim();
  if (!raw) return raw;
  // Only touch labels that are entirely upper-case (ignoring punctuation/digits).
  const letters = raw.replace(/[^A-Za-z]/g, "");
  if (!letters || letters !== letters.toUpperCase()) return raw;

  // "GONADOTROPIN, CHORIONIC" -> "Chorionic Gonadotropin"
  let s = raw;
  const parts = s.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 2 && !/\d/.test(parts[1])) s = `${parts[1]} ${parts[0]}`;

  const KEEP_UPPER = /^(HCG|FSH|LH|DHEA|CoQ10|TENS|SMC021|G-CSF)$/i;
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w) =>
      KEEP_UPPER.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1),
    )
    .join(" ");
}

/** Resolve a drug-class label. Returns {molecule} to relabel, {rollup:true} to
 *  segregate as "class", or null if the label is not a handled class. */
export function resolveDrugClass(drug: string | null | undefined):
  | { molecule: string }
  | { rollup: true }
  | null {
  const s = String(drug ?? "").trim().toLowerCase();
  if (s in CLASS_TO_MOLECULE) return { molecule: CLASS_TO_MOLECULE[s] };
  if (CLASS_ROLLUP.has(s)) return { rollup: true };
  return null;
}

// 1 · not drugs — procedures, non-pharmacologic interventions, junk labels
const EXCLUDE_RE =
  /acupuncture|reflexolog|cognitive[- ]behav|\bcbt\b|hypnother|physioth|physical therapy|biofeedback|\btens\b|dilators?|laser therap|vestibulectomy|laparoscop|surgical|cold knife|excision|electromyograph|\bdiet\b|natural compound|non-?pharmacolog/i;
const EXCLUDE_EXACT = new Set([
  "unspecified treatment", "unspecified treatment groups", "unspecified",
  "interventions", "multiple interventions", "various treatments", "various",
  "treatments", "drug therapy", "hormonal treatment", "nonhormonal treatment",
  "daily use",
]);

// 3 · combination regimens / fixed-combination products → segregate
const COMBO_RE =
  /combined with|combination|with or without| plus |\bplus\b|\+| and |\bcocp?\b|combined oral contracept/i;

// 4 · supplements / herbals / homeopathy → adjunct list (inositols are NOT
// here on purpose — they are evidence-backed lead candidates, not adjuncts)
const SUPPLEMENT_RE =
  /vitamin|vitex|chasteberry|nux vomica|\blysine\b|fatty acid|evening primrose|\bomega\b|st\.? ?john|isoflavone|red clover|\bclover\b|curcumin|resveratrol|quercetin|folic acid|ergocalciferol|ubidecarenone|coenzyme|\bcoq|creatine|pterostilbene/i;

/** Classify a candidate by its drug label. Precedence: exclude > combination > supplement > drug. */
export function classifyCuration(drug: string | null | undefined): CurationClass {
  const d = String(drug ?? "");
  const s = d.trim().toLowerCase();
  if (EXCLUDE_EXACT.has(s) || EXCLUDE_RE.test(d)) return "exclude";
  if (COMBO_RE.test(d)) return "combination";
  if (SUPPLEMENT_RE.test(d)) return "supplement";
  return "drug";
}
