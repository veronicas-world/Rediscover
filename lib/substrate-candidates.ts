/**
 * Substrate data layer — the NEW evidence engine behind the public site.
 *
 * Reads `substrate_signals` (the arm-aware scored signals, migration 050/051) joined
 * to `entities`, groups the per-arm rows by drug–condition PAIR, and derives the
 * pair headline by SCORING_SPEC §6 anchor-and-corroborate (never averaging across
 * arms). Provenance is the substrate's own verbatim-verified `claims`. This replaces
 * lib/candidates.ts (the legacy `repurposing_signals` reader) at cutover; it exposes
 * the same function surface so the swap is a one-line import change.
 *
 * Independent side-layers (MATRIX, sex-PK, cycle-phase) are re-keyed to the
 * substrate drug set here (Stage 1.5): they resolve a substrate drug/condition
 * label back to the legacy compound_id/condition_id (sex-PK, cycle-phase) or by
 * name (MATRIX), and are reported beside the score, never folded into it. The
 * L-grade and the Open Targets graph chip are intentionally dropped — the
 * substrate's own `rigor` dimension and Pathway arm supersede them.
 */
import { supabase } from "@/lib/supabase";
import type { Candidate, Claim, SubstrateArm } from "@/app/components/CandidateCard";
import { MATRIX_PAIR_SNAPSHOT, formatMatrixPercentile } from "@/lib/matrix-pair-scores-snapshot";
import { getTrialStatusForPair } from "@/lib/clinicaltrials-status-snapshot";
import { getOrangeBookForDrug } from "@/lib/orangebook-status-snapshot";
import { getIndicationForPair } from "@/lib/dailymed-indication-snapshot";
import {
  classifyCuration, resolveDrugClass, normalizeDrugName, isCommunityOnly, knownNegativeNote,
  negativeEvidenceDetected,
} from "@/lib/curation";
import {
  ARMS, DIMS, SLUG_OVERRIDE, COND_ALIAS, SIGNAL_COLS,
  num, tierLc, lvl, clip, sourceLabel, sourceHref, claimRank,
  toArm, deriveHeadline, tierDisplay, tierKey,
} from "./substrate-helpers";

type Row = Record<string, unknown>;
type ArmKey = "direct" | "pathway" | "community";

// ── Independent side-layers ──────────────────────────────────────────────────
// Reported beside the score, never folded in. MATRIX is name-keyed; sex-PK and
// cycle-phase are id-keyed (legacy compound_id / condition_id), so we resolve a
// substrate drug/condition label back to its legacy id below.

export type SexPkFact = { parameter: string; sex: string; direction?: string; magnitude?: string; source?: string; sourceUrl?: string; note?: string };
export type PhaseFact = { cyclePhase: string; pattern?: string; dosingNote?: string; source?: string; sourceUrl?: string };

// Case-insensitive `${compound}::${condition}` → MATRIX score, built once.
const MATRIX_INDEX: Map<string, (typeof MATRIX_PAIR_SNAPSHOT.per_pair)[number]> = (() => {
  const m = new Map<string, (typeof MATRIX_PAIR_SNAPSHOT.per_pair)[number]>();
  for (const p of MATRIX_PAIR_SNAPSHOT.per_pair) {
    m.set(`${String(p.compound_name).toLowerCase()}::${String(p.condition_name).toLowerCase()}`, p);
  }
  return m;
})();

function matrixForPair(drug: string, condition: string) {
  const condKey = COND_ALIAS[condition.toLowerCase()] ?? condition.toLowerCase();
  const m = MATRIX_INDEX.get(`${drug.toLowerCase()}::${condKey}`);
  if (!m) return { matrixPercentile: undefined, matrixDetail: undefined } as const;
  return {
    matrixPercentile: m.quantile_rank != null ? formatMatrixPercentile(m.quantile_rank) : undefined,
    matrixDetail: {
      transformedScore: m.transformed_score ?? undefined,
      sourceId: m.matrix_source_id ?? undefined,
      mondo: m.matrix_mondo ?? undefined,
    },
  } as const;
}

/** compound_id → documented sex-specific PK facts (migration 058). */
async function getSexPkMap(): Promise<Map<string, SexPkFact[]>> {
  const map = new Map<string, SexPkFact[]>();
  const { data, error } = await supabase
    .from("compound_pk")
    .select("compound_id, parameter, sex, direction, magnitude, source_ref, source_url, note");
  if (error || !data) return map;
  for (const row of data as Row[]) {
    const cid = row.compound_id ? String(row.compound_id) : "";
    if (!cid) continue;
    const fact: SexPkFact = {
      parameter: String(row.parameter ?? ""),
      sex: String(row.sex ?? ""),
      direction: row.direction ? String(row.direction) : undefined,
      magnitude: row.magnitude ? String(row.magnitude) : undefined,
      source: row.source_ref ? String(row.source_ref) : undefined,
      sourceUrl: row.source_url ? String(row.source_url) : undefined,
      note: row.note ? String(row.note) : undefined,
    };
    (map.get(cid) ?? map.set(cid, []).get(cid)!).push(fact);
  }
  return map;
}

/** `${compound_id}::${condition_id}` → cycle-phase dependence (migration 060). */
async function getPhaseMap(): Promise<Map<string, PhaseFact[]>> {
  const map = new Map<string, PhaseFact[]>();
  const { data, error } = await supabase
    .from("compound_condition_phase")
    .select("compound_id, condition_id, cycle_phase, pattern, dosing_note, source_ref, source_url");
  if (error || !data) return map;
  for (const row of data as Row[]) {
    const cid = row.compound_id ? String(row.compound_id) : "";
    const condId = row.condition_id ? String(row.condition_id) : "";
    if (!cid || !condId) continue;
    const fact: PhaseFact = {
      cyclePhase: String(row.cycle_phase ?? ""),
      pattern: row.pattern ? String(row.pattern) : undefined,
      dosingNote: row.dosing_note ? String(row.dosing_note) : undefined,
      source: row.source_ref ? String(row.source_ref) : undefined,
      sourceUrl: row.source_url ? String(row.source_url) : undefined,
    };
    (map.get(`${cid}::${condId}`) ?? map.set(`${cid}::${condId}`, []).get(`${cid}::${condId}`)!).push(fact);
  }
  return map;
}

// ── Load + assemble ──────────────────────────────────────────────────────────

type ClaimRec = { quote: string; direction: string; src: string; href?: string; rank: number };

async function getAllCandidates(): Promise<Candidate[]> {
  const [sigRes, entRes, claimRes, condRes, compRes, sexMap, phaseMap] = await Promise.all([
    supabase.from("substrate_signals").select(SIGNAL_COLS).eq("status", "active"),
    supabase.from("entities").select("id, type, label"),
    supabase.from("claims").select("id, exact_quote, text, direction, documents(source, external_id, url, title)"),
    supabase.from("conditions").select("id, name, slug"),
    supabase.from("compounds").select("id, name, fda_status, original_indication, drug_class"),
    getSexPkMap(),
    getPhaseMap(),
  ]);

  const signals = (sigRes.data ?? []) as unknown as Row[];
  if (!signals.length) return [];

  // entity id -> label
  const label = new Map<string, string>();
  for (const e of (entRes.data ?? []) as Row[]) label.set(String(e.id), String(e.label));

  // condition display-name(lower) -> slug + legacy id (for the id-keyed layers)
  const slugByName = new Map<string, string>();
  const condIdByName = new Map<string, string>();
  for (const c of (condRes.data ?? []) as Row[]) {
    if (c.name && c.slug) slugByName.set(String(c.name).toLowerCase(), String(c.slug));
    if (c.name && c.id) condIdByName.set(String(c.name).toLowerCase(), String(c.id));
  }
  // compound name(lower) -> origin meta + legacy id (for the id-keyed layers)
  const compByName = new Map<string, Row>();
  const compIdByName = new Map<string, string>();
  for (const c of (compRes.data ?? []) as Row[]) {
    compByName.set(String(c.name).toLowerCase(), c);
    if (c.id) compIdByName.set(String(c.name).toLowerCase(), String(c.id));
  }

  // claim id -> rendered provenance record (verbatim quote)
  const claimById = new Map<string, ClaimRec>();
  for (const c of (claimRes.data ?? []) as unknown as Row[]) {
    const doc = (Array.isArray(c.documents) ? c.documents[0] : c.documents) as Row | null;
    claimById.set(String(c.id), {
      quote: String(c.exact_quote || c.text || "").trim(),
      direction: String(c.direction ?? ""),
      src: sourceLabel(doc),
      href: sourceHref(doc),
      rank: claimRank(doc),
    });
  }

  // group signals by pair
  const pairs = new Map<string, Row[]>();
  for (const s of signals) {
    if (!ARMS.includes(String(s.arm) as ArmKey)) continue; // ignore any legacy 'cross'
    const key = `${s.intervention_id}::${s.condition_id}`;
    (pairs.get(key) ?? pairs.set(key, []).get(key)!).push(s);
  }

  const out: Candidate[] = [];
  let n = 0;
  for (const [key, rows] of pairs) {
    const [iid, cid] = key.split("::");
    const drug = label.get(iid) ?? "Unknown compound";
    const condition = label.get(cid) ?? "—";
    const slug =
      SLUG_OVERRIDE[condition.toLowerCase()] ??
      slugByName.get(condition.toLowerCase()) ??
      condition.toLowerCase();

    const allArms = rows.map(toArm);
    // Safety is a separate readout (tolerability) — never blended into the "does it
    // work" headline. The headline is driven by efficacy + mechanistic ('other') arms.
    const safetyArms = allArms.filter((a) => a.aspect === "safety");
    const headlineSrc = allArms.filter((a) => a.aspect !== "safety");
    // Collapse to ONE reading per arm (the strongest efficacy/mechanistic signal),
    // so the UI shows a single Direct / Pathway / Community strength, not duplicates.
    const byArm = new Map<ArmKey, SubstrateArm>();
    for (const a of (headlineSrc.length ? headlineSrc : safetyArms)) {
      const cur = byArm.get(a.arm);
      if (!cur || a.armScore > cur.armScore) byArm.set(a.arm, a);
    }
    const arms = [...byArm.values()];
    const { status, anchor } = deriveHeadline(arms);
    for (const a of arms) a.isAnchor = a === anchor;

    // provenance: claim_ids across all arms, best sources first, top 4 (verbatim)
    const claimIds = new Set<string>();
    for (const r of rows) {
      const ids = Array.isArray(r.claim_ids) ? (r.claim_ids as unknown[]).map(String) : [];
      ids.forEach((id) => claimIds.add(id));
    }
    const claims: Claim[] = [...claimIds]
      .map((id) => claimById.get(id))
      .filter((c): c is ClaimRec => !!c && !!c.quote)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 4)
      .map((c) => ({ type: "extract", text: c.quote, src: c.src, href: c.href }));

    const comp = compByName.get(drug.toLowerCase()) ?? null;
    const origin = comp
      ? [comp.fda_status ? String(comp.fda_status) : "Approved",
         comp.original_indication ? clip(String(comp.original_indication), 60) : ""].filter(Boolean).join(" · ")
      : "Existing drug · repurposing candidate";

    const anyContradiction = arms.some((a) => a.contradictionFlag);
    const dims: Record<string, string> = {};
    for (const d of anchor.dimensions) dims[d.key] = lvl(d.score);

    // ── Independent side-layers, re-keyed to the substrate drug/condition ──
    const compoundId = compIdByName.get(drug.toLowerCase());
    const conditionId = condIdByName.get(condition.toLowerCase());
    const sexPk = compoundId ? sexMap.get(compoundId) : undefined;
    const cyclePhase = compoundId && conditionId ? phaseMap.get(`${compoundId}::${conditionId}`) : undefined;
    const { matrixPercentile, matrixDetail } = matrixForPair(drug, condition);
    const trialStatus = getTrialStatusForPair(drug, condition) ?? undefined;
    const orangeBook = getOrangeBookForDrug(drug) ?? undefined;
    const indication = getIndicationForPair(drug, condition) ?? undefined;

    // Drug-class resolution (see lib/curation.ts): relabel a class to its
    // representative molecule, or mark a multi-molecule rollup as "class".
    // All lookups above used the original `drug`; only the display label changes.
    const cls = resolveDrugClass(drug);
    const displayDrug = normalizeDrugName(cls && "molecule" in cls ? cls.molecule : drug);
    const curationClass = cls
      ? ("molecule" in cls ? "drug" : "class")
      : classifyCuration(drug);

    // Evidence-integrity guards, applied to the headline the site shows.
    //  1. Community-only signals (every claim an anecdotal patient report) are
    //     hypothesis-generating; they cannot satisfy corroboration/rigor, so they
    //     are capped at `exploratory` however enthusiastic the reports are.
    //  2. Pairs with negative published randomized evidence never present as
    //     positive signals: capped and marked as a contradiction.
    //  3. The cited evidence itself reports no benefit: never present as positive.
    //  4. Safety-anchored pairs (the only evidence is adverse-event / tolerability
    //     data, with no efficacy or mechanistic arm) must never display "supports"
    //     or an inflated tier — adverse-event data is not efficacy evidence, and
    //     a harm signal presented as "Evidence supports" is actively dangerous.
    //     Capped to `exploratory` and labelled as a safety signal.
    const communityOnly = isCommunityOnly(claims);
    const negativeNote = knownNegativeNote(drug, slug);
    // Check the structured direction field on all claims behind this signal
    // (more reliable than regex on quote text). The extraction pipeline already
    // classifies each claim as positive/negative/null/unclear.
    const allClaimRecs = [...claimIds]
      .map((id) => claimById.get(id))
      .filter((c): c is ClaimRec => !!c && !!c.quote);
    const hasNegativeDirection = allClaimRecs.some(
      (c) => c.direction === "negative" || c.direction === "null",
    );
    const negativeEvidence = !negativeNote && (
      hasNegativeDirection ||
      negativeEvidenceDetected(
        anchor.synthesis,
        ...(claims ?? []).map((cl) => cl.text),
      )
    );
    const safetyAnchored = anchor.aspect === "safety";
    const demote = communityOnly || !!negativeNote || negativeEvidence || safetyAnchored;
    // Apply noise-band spanning display before curation demotion: a score
    // within ~1 point of a cutoff is not stable across runs (test-retest
    // found 58.5% tier stability, median spread 1.0/10). Display the span
    // so the reader sees the uncertainty rather than a false-precision badge.
    const scoreTier = tierDisplay(anchor.armScore, anchor.tier);
    const displayTier = demote && scoreTier !== "exploratory" ? "exploratory" : scoreTier;

    n += 1;
    out.push({
      id: `WHEL-C-${String(n).padStart(3, "0")}`,
      signalId: `${iid}__${cid}`,
      drug: displayDrug,
      condition,
      conditionId: slug,
      curationClass,
      tier: displayTier,
      score: Math.round(anchor.armScore * 10) / 10,
      origin,
      pathway: displayTier === "exploratory"
        ? "Hypothesis-generation · pre-validation"
        : "505(b)(2) · existing active ingredient, new indication",
      direction: (anyContradiction || negativeNote || negativeEvidence || safetyAnchored)
        ? "contradicts"
        : displayTier === "exploratory" ? "silent" : "supports",
      evidenceCaveat: negativeNote
        ?? (negativeEvidence
          ? "Negative or null result: the evidence cited for this pair reports no benefit over placebo or control. Recorded as a documented negative, not a candidate to pursue."
          : safetyAnchored
            ? "Safety signal only: this pair has no efficacy or mechanistic evidence on file — only adverse-event or tolerability data. Shown as a documented safety signal, not an efficacy candidate; capped at exploratory."
            : communityOnly
              ? "Community-reported only: every source behind this signal is an anecdotal patient report, with no published trial or literature corroboration. Hypothesis-generating, capped at exploratory."
              : undefined),
      rationale: negativeNote
        ? `${negativeNote} ${anchor.synthesis ?? ""}`.trim()
        : anchor.synthesis || `${displayDrug} surfaced as a substrate signal for ${condition}.`,
      mechanism: anchor.mechanism || "Mechanism not yet characterized in the substrate.",
      dims,
      dimBreakdown: anchor.dimensions.map((d) => ({ key: d.key, label: d.label, score: d.score, level: lvl(d.score) })),
      // Reconciliation payload for documented negatives: the pre-demotion
      // reading on the anchor arm, so the display can show what the tier was
      // before the contradiction rule applied instead of just "Exploratory".
      negativeResult: negativeNote || negativeEvidence
        ? {
            anchorTier: anchor.tier,
            anchorStrength: Math.round(anchor.armScore * 10) / 10,
            anchorArm: anchor.arm,
          }
        : undefined,
      documentedNegative: !!(negativeNote || negativeEvidence),
      signalType: anchor.arm,
      evidenceStrength: displayTier,
      claims,
      // ── substrate fields ──
      validationStatus: status,
      femaleApplicability: anchor.female,
      arms,
      safetyArms: safetyArms.length ? safetyArms : undefined,
      // ── independent side-layers (reported beside the score, not folded in) ──
      matrixPercentile,
      matrixDetail,
      sexPk: sexPk && sexPk.length ? sexPk : undefined,
      cyclePhase: cyclePhase && cyclePhase.length ? cyclePhase : undefined,
      trialStatus,
      orangeBook,
      indication,
    });
  }

  // Collapse duplicates created by class→molecule relabeling (e.g. an
  // "aromatase inhibitors" row relabeled to Letrozole merging with an existing
  // Letrozole row): keep the higher-scored candidate per drug + condition.
  const bestByKey = new Map<string, Candidate>();
  const deduped: Candidate[] = [];
  for (const c of out) {
    if (c.curationClass !== "drug") { deduped.push(c); continue; }
    const key = `${c.drug.toLowerCase()}::${c.conditionId}`;
    const prev = bestByKey.get(key);
    if (!prev) { bestByKey.set(key, c); deduped.push(c); }
    else if (c.score > prev.score) {
      deduped[deduped.indexOf(prev)] = c;
      bestByKey.set(key, c);
    }
  }

  // headline ranking: anchor score desc, then clinical-validated first on ties
  const vWeight = { clinical: 2, unvalidated_signal: 1, preliminary: 0 } as const;
  deduped.sort((a, b) =>
    b.score - a.score ||
    (vWeight[b.validationStatus ?? "preliminary"] - vWeight[a.validationStatus ?? "preliminary"]) ||
    a.drug.localeCompare(b.drug));
  return deduped;
}

// The public candidate INDEX is the clean single-agent drug set. Combination
// regimens and supplements/herbals are segregated (below) rather than graded as
// first-class candidates; non-drug/procedure/junk entries are dropped. This is a
// display-time filter over the substrate (see lib/curation.ts) — the substrate
// itself is unchanged.
export async function getCandidates(): Promise<Candidate[]> {
  return (await getAllCandidates()).filter((c) => (c.curationClass ?? "drug") === "drug");
}

/** Combination regimens (multi-agent), segregated from the single-agent index. */
export async function getCombinationCandidates(): Promise<Candidate[]> {
  return (await getAllCandidates()).filter((c) => c.curationClass === "combination");
}

/** Supplements / herbals, shown as an adjunct list rather than graded candidates. */
export async function getAdjunctCandidates(): Promise<Candidate[]> {
  return (await getAllCandidates()).filter((c) => c.curationClass === "supplement");
}

export async function getFeaturedCandidates(n = 3): Promise<Candidate[]> {
  return (await getCandidates()).slice(0, n);
}

export async function getCandidateBySignalId(signalId: string): Promise<Candidate | null> {
  // Search ALL classes so a direct link to a combination/adjunct pair still resolves.
  const all = await getAllCandidates();
  return all.find((c) => c.signalId === signalId) ?? null;
}

/** One representative (strongest) candidate per condition. */
export async function getSampleCandidates(): Promise<Candidate[]> {
  const all = await getCandidates();
  const seen = new Set<string>();
  const sample: Candidate[] = [];
  for (const c of all) {
    const k = c.conditionId ?? c.condition;
    if (seen.has(k)) continue;
    seen.add(k);
    sample.push(c);
  }
  return sample;
}

export async function getShowcaseCandidates(): Promise<Candidate[]> {
  return getSampleCandidates();
}

export async function getFlagshipCandidate(): Promise<Candidate | null> {
  const all = await getCandidates();
  return all.find((c) => c.conditionId === "pmdd") ?? all[0] ?? null;
}

/**
 * Homepage hero pair: the strongest signal plus a deliberately contrasting one
 * (different condition, and ideally a different validation status) so the homepage
 * shows the score's RANGE and the honesty stamps, not two perfect scores.
 */
export async function getShowcasePair(): Promise<Candidate[]> {
  const all = await getCandidates(); // sorted strongest-first
  const lead = all[0];
  if (!lead) return [];
  const diff = (c: Candidate) => (c.conditionId ?? c.condition) !== (lead.conditionId ?? lead.condition);
  const contrast =
    all.find((c) => diff(c) && c.validationStatus === "unvalidated_signal") ??
    all.find((c) => diff(c) && c.tier !== lead.tier) ??
    all.find(diff);
  return contrast ? [lead, contrast] : [lead];
}

/** Real corpus counts for dynamic scope copy ("N signals across M conditions"). */
export async function getCorpusScope(): Promise<{ signals: number; conditions: number }> {
  const all = await getCandidates();
  const conds = new Set(all.map((c) => c.conditionId ?? c.condition));
  return { signals: all.length, conditions: conds.size };
}

export interface HomeConditionStat {
  strong: number; moderate: number; emerging: number; exploratory: number; total: number;
}

/**
 * Homepage statistics, all from the substrate: the pair count, per-condition
 * confidence-tier distribution (by each pair's headline tier), and the provenance
 * volume (distinct verbatim claims and source documents behind the active signals).
 */
export async function getSubstrateHomeData(): Promise<{
  totalPairs: number;
  byCondition: Map<string, HomeConditionStat>;
  claims: number;
  documents: number;
  /**
   * Entailment audit over the claims behind active signals. Reported for the
   * LLM-EXTRACTED claims only: the pathway readouts (Open Targets, AEMS, SIDER)
   * are rendered from the same structured records they describe, so verifying
   * them against their own source is circular and would inflate the rate.
   */
  entailment: {
    extracted: number;      // LLM-extracted claims behind active signals
    scored: number;         // of those, carrying an entailment label
    entailed: number;
    neutral: number;
    contradicted: number;
    rendered: number;       // template-rendered claims, excluded from the rate
    entailedPct: number | null;
  };
}> {
  const all = await getCandidates();
  const byCondition = new Map<string, HomeConditionStat>();
  for (const c of all) {
    const slug = c.conditionId ?? c.condition.toLowerCase();
    let s = byCondition.get(slug);
    if (!s) { s = { strong: 0, moderate: 0, emerging: 0, exploratory: 0, total: 0 }; byCondition.set(slug, s); }
    s[tierKey(c.tier)] += 1;
    s.total += 1;
  }
  // Provenance volume: distinct verbatim claims and source documents that actually
  // back the active signals (claim_ids on the signals → claims → documents).
  const [sigRes, claimRes] = await Promise.all([
    supabase.from("substrate_signals").select("claim_ids").eq("status", "active"),
    supabase.from("claims").select("id, document_id, model_name, entailment_label"),
  ]);
  const referenced = new Set<string>();
  for (const s of (sigRes.data ?? []) as unknown as Row[]) {
    const ids = Array.isArray(s.claim_ids) ? (s.claim_ids as unknown[]).map(String) : [];
    ids.forEach((id) => referenced.add(id));
  }
  const docs = new Set<string>();
  let claims = 0;
  const ent = { extracted: 0, scored: 0, entailed: 0, neutral: 0, contradicted: 0, rendered: 0 };
  for (const cl of (claimRes.data ?? []) as Row[]) {
    if (!referenced.has(String(cl.id))) continue;
    claims += 1;
    if (cl.document_id) docs.add(String(cl.document_id));

    // Split rendered readouts from genuine extractions before counting.
    if (String(cl.model_name ?? "").startsWith("pathway-render")) {
      ent.rendered += 1;
      continue;
    }
    ent.extracted += 1;
    const label = cl.entailment_label ? String(cl.entailment_label) : null;
    if (!label) continue;
    ent.scored += 1;
    if (label === "entailed") ent.entailed += 1;
    else if (label === "neutral") ent.neutral += 1;
    else if (label === "contradicted") ent.contradicted += 1;
  }

  return {
    totalPairs: all.length,
    byCondition,
    claims,
    documents: docs.size,
    entailment: {
      ...ent,
      entailedPct: ent.scored > 0 ? Math.round((ent.entailed / ent.scored) * 1000) / 10 : null,
    },
  };
}
