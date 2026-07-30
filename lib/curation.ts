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
