// Shared constants and pure helpers for candidate assembly — SINGLE SOURCE OF TRUTH.
//
// Both lib/substrate-candidates.ts (the Next.js server) and
// scripts/build-corpus-snapshot.mjs (the offline snapshot builder) use these
// to convert substrate signal rows into the SubstrateArm / Candidate shape.
// Extracting them here eliminates the hand-maintained duplicate that had no
// sync enforcement — a change to one copy would silently diverge from the other.
//
// Imported by:
//   lib/substrate-candidates.ts  (typed re-export / direct use)
//   scripts/build-corpus-snapshot.mjs  (direct use)

export const ARMS = ["direct", "pathway", "community"];

export const DIMS = [
  { key: "corroboration", label: "Corroboration" },
  { key: "rigor", label: "Rigor" },
  { key: "specificity", label: "Specificity" },
  { key: "plausibility", label: "Plausibility" },
  { key: "consistency", label: "Consistency" },
];

// Substrate condition labels are the canonical six; five match the `conditions`
// table by name, but "menopause" is filed under the slug "perimenopause-menopause".
export const SLUG_OVERRIDE = { menopause: "perimenopause-menopause" };

// MATRIX condition names differ from the substrate's canonical labels for one
// condition; alias the substrate label (lowercased) to MATRIX's condition name.
export const COND_ALIAS = { menopause: "perimenopause & menopause" };

export const SIGNAL_COLS =
  "id, intervention_id, condition_id, aspect, arm," +
  " corroboration_score, rigor_score, specificity_score, plausibility_score, consistency_score," +
  " corroboration_rationale, rigor_rationale, specificity_rationale, plausibility_rationale, consistency_rationale," +
  " arm_strength, arm_score, confidence_tier," +
  " female_applicability_band, female_applicability_multiplier, female_applicability_rationale," +
  " contradiction_flag, num_contradictions, precision_note, needs_fulltext," +
  " synthesis_summary, mechanism_hypothesis, claim_ids, status";

// ── Small pure helpers ──────────────────────────────────────────────────────

export function num(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}

export function tierLc(t) {
  const k = String(t ?? "").toLowerCase();
  return k === "strong" || k === "moderate" || k === "emerging" ? k : "exploratory";
}

// Normalize a display tier (which may span, e.g., "strong–moderate") to the
// lower tier for indexing/counting/ranking purposes.
export function tierKey(t) {
  const k = String(t ?? "").toLowerCase();
  const lower = k.includes("–") ? k.split("–").pop() : k;
  return tierLc(lower);
}

// ── Noise-band tier display ─────────────────────────────────────────────────
// The scoring layer's test-retest (scripts/test-retest-scoring.py) found a
// median arm_score spread of 1.00 point across 3 runs. When a score sits within
// that band of a tier cutoff, the tier is not stable — the same signal can
// land on either side across runs. Rather than hiding this behind a single
// tier badge, we display the span (e.g., "strong–moderate") so the reader sees
// the uncertainty. For ranking, the stored tier (the lower one) is used.
//
// The noise band should be updated after the temperature=0.0 re-run. If
// temperature pinning reduces the median spread, fewer signals will span.
export const NOISE_BAND = 1.0;

const TIER_CUTOFFS = [
  { cut: 8.0, upper: "strong", lower: "moderate" },
  { cut: 6.0, upper: "moderate", lower: "emerging" },
  { cut: 3.5, upper: "emerging", lower: "exploratory" },
];

export function tierDisplay(score, storedTier) {
  const s = Number(score);
  if (!Number.isFinite(s)) return storedTier;
  for (const { cut, upper, lower } of TIER_CUTOFFS) {
    if (Math.abs(s - cut) < NOISE_BAND) {
      return `${upper}–${lower}`;
    }
  }
  return storedTier;
}

export function lvl(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "—";
  return n >= 2 ? "High" : n >= 1 ? "Medium" : "Low";
}

export function clip(s, n) {
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

// ── Provenance: render a substrate document into a source label + link ───────

export function sourceLabel(doc) {
  if (!doc) return "Source on file";
  const type = String(doc.source ?? "").toLowerCase();
  const ext = doc.external_id ? String(doc.external_id) : "";
  if (type === "pubmed") return ["PubMed", ext && `PMID ${ext}`].filter(Boolean).join(" · ");
  if (type === "clinicaltrials") return ["ClinicalTrials.gov", ext].filter(Boolean).join(" · ");
  if (type === "reddit") return "Community report · Reddit";
  if (type === "opentargets") return "Open Targets · mechanistic";
  if (type === "aems") return "AEMS · adverse-event report";
  if (type === "sider") return "SIDER · label side-effect";
  return clip(type || "source", 32);
}

export function sourceHref(doc) {
  if (!doc) return undefined;
  const url = doc.url ? String(doc.url).trim() : "";
  if (url) return url;
  const type = String(doc.source ?? "").toLowerCase();
  const ext = doc.external_id ? String(doc.external_id).trim() : "";
  if (!ext) return undefined;
  if (type === "pubmed") return `https://pubmed.ncbi.nlm.nih.gov/${ext}/`;
  if (type === "clinicaltrials") return `https://clinicaltrials.gov/study/${ext}`;
  return undefined;
}

export function claimRank(doc) {
  const t = String(doc?.source ?? "").toLowerCase();
  if (t === "pubmed") return 0;
  if (t === "clinicaltrials") return 1;
  if (t === "opentargets" || t === "aems" || t === "sider") return 2;
  return 3; // reddit / community
}

// ── Arm assembly (SCORING_SPEC §6) ──────────────────────────────────────────

export function toArm(sig) {
  const dims = DIMS.map((d) => ({
    key: d.key,
    label: d.label,
    score: Math.max(0, Math.min(2, num(sig[`${d.key}_score`]))),
    rationale: sig[`${d.key}_rationale`] ? String(sig[`${d.key}_rationale`]) : "",
  }));
  return {
    arm: String(sig.arm),
    aspect: String(sig.aspect ?? "efficacy"),
    armScore: num(sig.arm_score),
    strength: num(sig.arm_strength),
    tier: tierLc(sig.confidence_tier),
    isAnchor: false,
    dimensions: dims,
    female: {
      band: sig.female_applicability_band ? String(sig.female_applicability_band) : "—",
      multiplier: num(sig.female_applicability_multiplier, 1),
      rationale: sig.female_applicability_rationale ? String(sig.female_applicability_rationale) : "",
    },
    synthesis: sig.synthesis_summary ? String(sig.synthesis_summary) : undefined,
    mechanism: sig.mechanism_hypothesis ? String(sig.mechanism_hypothesis) : undefined,
    precisionNote: sig.precision_note ? String(sig.precision_note) : undefined,
    needsFulltext: !!sig.needs_fulltext,
    contradictionFlag: !!sig.contradiction_flag,
    numContradictions: num(sig.num_contradictions),
  };
}

export function deriveHeadline(arms) {
  // 1. A non-trivial Direct arm anchors the pair → clinical.
  const direct = arms.find((a) => a.arm === "direct" && a.strength >= 3);
  if (direct) return { status: "clinical", anchor: direct };
  // strongest available arm by arm_score
  const strongest = [...arms].sort((a, b) => b.armScore - a.armScore)[0];
  // 2. Direct thin/absent but arms converge → surfaced, hedged.
  // 3. A single weak arm → preliminary.
  const nonTrivial = arms.length >= 2 || strongest.tier !== "exploratory";
  return { status: nonTrivial ? "unvalidated_signal" : "preliminary", anchor: strongest };
}

export function formatMatrixPercentile(qr) {
  return `Top ${Math.max(1, Math.round(qr * 100))}%`;
}
