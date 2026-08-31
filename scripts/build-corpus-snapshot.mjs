// Corpus export builder — dumps the FULL curated Whel corpus (everything the
// public site surfaces) into a single committed snapshot at
// lib/corpus-snapshot.json.
//
// This is a faithful, offline port of getCandidates() in
// lib/substrate-candidates.ts: it reads substrate_signals joined to entities,
// claims/documents, conditions, compounds, the sex-PK and cycle-phase tables,
// and folds in the committed side-layer snapshots (MATRIX, DailyMed, Orange
// Book, ClinicalTrials.gov) exactly the way the runtime does. The output is a
// name-stable, versioned corpus that the whel-corpus MCP server serves to
// Claude Science, so a research session reasons over Whel's CURATED reads
// (tiers, scores, verbatim claims, regulatory status) rather than raw APIs.
//
// Run locally with Supabase creds in the environment (same as the other
// snapshot builders):  node scripts/build-corpus-snapshot.mjs
//
// This is descriptive research context. Nothing here is clinical or regulatory
// advice, and it is a point-in-time export — re-run to refresh.

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Shared logic (single source of truth) ───────────────────────────────────
// Curation + helpers are imported from lib/ so the snapshot builder and the
// Next.js server (lib/substrate-candidates.ts) use the SAME code, not
// hand-maintained duplicates.
import {
  classifyCuration, resolveDrugClass, normalizeDrugName, isCommunityOnly,
  knownNegativeNote, negativeEvidenceDetected,
} from "../lib/curation.mjs";
import {
  ARMS, DIMS, SLUG_OVERRIDE, COND_ALIAS, SIGNAL_COLS,
  num, tierLc, lvl, clip, sourceLabel, sourceHref, claimRank,
  toArm, deriveHeadline, formatMatrixPercentile,
} from "../lib/substrate-helpers.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LIB = path.join(__dirname, "..", "lib");
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(LIB, f), "utf8"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in env.");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Committed side-layer snapshots (read directly) ───────────────────────────
const MATRIX = readJson("matrix-pair-scores-snapshot.json");
const DAILYMED = readJson("dailymed-indication-snapshot.json");
const ORANGEBOOK = readJson("orangebook-status-snapshot.json");
const TRIALS = readJson("clinicaltrials-status-snapshot.json");

const matrixIdx = new Map(
  (MATRIX.per_pair || []).map((p) => [`${String(p.compound_name).toLowerCase()}::${String(p.condition_name).toLowerCase()}`, p]),
);
const dailymedIdx = new Map(
  (DAILYMED.per_pair || []).map((r) => [`${r.compound_name}::${r.condition_name}`.toLowerCase(), r]),
);
const trialsIdx = new Map(
  (TRIALS.per_pair || []).map((r) => [`${r.compound_name}::${r.condition_name}`.toLowerCase(), r]),
);
const orangebookIdx = new Map(
  (ORANGEBOOK.per_drug || []).map((r) => [String(r.compound_name).toLowerCase(), r]),
);

function matrixForPair(drug, condition) {
  const condKey = COND_ALIAS[condition.toLowerCase()] ?? condition.toLowerCase();
  const m = matrixIdx.get(`${drug.toLowerCase()}::${condKey}`);
  if (!m) return { matrixPercentile: undefined, matrixDetail: undefined };
  return {
    matrixPercentile: m.quantile_rank != null ? formatMatrixPercentile(m.quantile_rank) : undefined,
    matrixDetail: {
      transformedScore: m.transformed_score ?? undefined,
      sourceId: m.matrix_source_id ?? undefined,
      mondo: m.matrix_mondo ?? undefined,
    },
  };
}
function getIndicationForPair(drug, condition) {
  const cond = COND_ALIAS[condition.toLowerCase()] ?? condition;
  return dailymedIdx.get(`${drug}::${cond}`.toLowerCase()) ?? undefined;
}
function getTrialStatusForPair(drug, condition) {
  const cond = COND_ALIAS[condition.toLowerCase()] ?? condition;
  const rec = trialsIdx.get(`${drug}::${cond}`.toLowerCase());
  if (!rec || rec.trial_count < 1) return undefined;
  return rec;
}
function getOrangeBookForDrug(drug) {
  return orangebookIdx.get(drug.toLowerCase()) ?? undefined;
}

async function getSexPkMap() {
  const map = new Map();
  const { data } = await supabase
    .from("compound_pk")
    .select("compound_id, parameter, sex, direction, magnitude, source_ref, source_url, note");
  for (const row of data ?? []) {
    const cid = row.compound_id ? String(row.compound_id) : "";
    if (!cid) continue;
    const fact = {
      parameter: String(row.parameter ?? ""),
      sex: String(row.sex ?? ""),
      direction: row.direction ? String(row.direction) : undefined,
      magnitude: row.magnitude ? String(row.magnitude) : undefined,
      source: row.source_ref ? String(row.source_ref) : undefined,
      sourceUrl: row.source_url ? String(row.source_url) : undefined,
      note: row.note ? String(row.note) : undefined,
    };
    (map.get(cid) ?? map.set(cid, []).get(cid)).push(fact);
  }
  return map;
}
async function getPhaseMap() {
  const map = new Map();
  const { data } = await supabase
    .from("compound_condition_phase")
    .select("compound_id, condition_id, cycle_phase, pattern, dosing_note, source_ref, source_url");
  for (const row of data ?? []) {
    const cid = row.compound_id ? String(row.compound_id) : "";
    const condId = row.condition_id ? String(row.condition_id) : "";
    if (!cid || !condId) continue;
    const fact = {
      cyclePhase: String(row.cycle_phase ?? ""),
      pattern: row.pattern ? String(row.pattern) : undefined,
      dosingNote: row.dosing_note ? String(row.dosing_note) : undefined,
      source: row.source_ref ? String(row.source_ref) : undefined,
      sourceUrl: row.source_url ? String(row.source_url) : undefined,
    };
    const key = `${cid}::${condId}`;
    (map.get(key) ?? map.set(key, []).get(key)).push(fact);
  }
  return map;
}

async function build() {
  const [sigRes, entRes, claimRes, condRes, compRes, sexMap, phaseMap] = await Promise.all([
    supabase.from("substrate_signals").select(SIGNAL_COLS).eq("status", "active"),
    supabase.from("entities").select("id, type, label"),
    supabase.from("claims").select("id, exact_quote, text, direction, documents(source, external_id, url, title)"),
    supabase.from("conditions").select("id, name, slug"),
    supabase.from("compounds").select("id, name, fda_status, original_indication, drug_class"),
    getSexPkMap(),
    getPhaseMap(),
  ]);

  const signals = sigRes.data ?? [];
  if (!signals.length) { console.error("No active signals returned."); process.exit(1); }

  const label = new Map();
  for (const e of entRes.data ?? []) label.set(String(e.id), String(e.label));

  const slugByName = new Map();
  const condIdByName = new Map();
  for (const c of condRes.data ?? []) {
    if (c.name && c.slug) slugByName.set(String(c.name).toLowerCase(), String(c.slug));
    if (c.name && c.id) condIdByName.set(String(c.name).toLowerCase(), String(c.id));
  }
  const compByName = new Map();
  const compIdByName = new Map();
  for (const c of compRes.data ?? []) {
    compByName.set(String(c.name).toLowerCase(), c);
    if (c.id) compIdByName.set(String(c.name).toLowerCase(), String(c.id));
  }

  const claimById = new Map();
  for (const c of claimRes.data ?? []) {
    const doc = Array.isArray(c.documents) ? c.documents[0] : c.documents;
    claimById.set(String(c.id), {
      quote: String(c.exact_quote || c.text || "").trim(),
      direction: String(c.direction ?? ""),
      src: sourceLabel(doc),
      href: sourceHref(doc),
      rank: claimRank(doc),
    });
  }

  const pairs = new Map();
  for (const s of signals) {
    if (!ARMS.includes(String(s.arm))) continue;
    const key = `${s.intervention_id}::${s.condition_id}`;
    (pairs.get(key) ?? pairs.set(key, []).get(key)).push(s);
  }

  const out = [];
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
    const safetyArms = allArms.filter((a) => a.aspect === "safety");
    const headlineSrc = allArms.filter((a) => a.aspect !== "safety");
    const byArm = new Map();
    for (const a of headlineSrc.length ? headlineSrc : safetyArms) {
      const cur = byArm.get(a.arm);
      if (!cur || a.armScore > cur.armScore) byArm.set(a.arm, a);
    }
    const arms = [...byArm.values()];
    const { status, anchor } = deriveHeadline(arms);
    for (const a of arms) a.isAnchor = a === anchor;

    const claimIds = new Set();
    for (const r of rows) {
      const ids = Array.isArray(r.claim_ids) ? r.claim_ids.map(String) : [];
      ids.forEach((id) => claimIds.add(id));
    }
    const claims = [...claimIds]
      .map((id) => claimById.get(id))
      .filter((c) => c && c.quote)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 4)
      .map((c) => ({ type: "extract", text: c.quote, src: c.src, href: c.href }));

    const comp = compByName.get(drug.toLowerCase()) ?? null;
    const origin = comp
      ? [comp.fda_status ? String(comp.fda_status) : "Approved",
         comp.original_indication ? clip(String(comp.original_indication), 60) : ""].filter(Boolean).join(" · ")
      : "Existing drug · repurposing candidate";

    const anyContradiction = arms.some((a) => a.contradictionFlag);
    const dims = {};
    for (const d of anchor.dimensions) dims[d.key] = lvl(d.score);

    const compoundId = compIdByName.get(drug.toLowerCase());
    const conditionId = condIdByName.get(condition.toLowerCase());
    const sexPk = compoundId ? sexMap.get(compoundId) : undefined;
    const cyclePhase = compoundId && conditionId ? phaseMap.get(`${compoundId}::${conditionId}`) : undefined;
    const { matrixPercentile, matrixDetail } = matrixForPair(drug, condition);
    const trialStatus = getTrialStatusForPair(drug, condition);
    const orangeBook = getOrangeBookForDrug(drug);
    const indication = getIndicationForPair(drug, condition);

    const cls = resolveDrugClass(drug);
    const displayDrug = normalizeDrugName(cls && cls.molecule ? cls.molecule : drug);
    const curationClass = cls ? (cls.molecule ? "drug" : "class") : classifyCuration(drug);
    const communityOnly = isCommunityOnly(claims);
    const negativeNote = knownNegativeNote(drug, slug);
    // Check the structured direction field on all claims behind this signal
    // (more reliable than regex on quote text). The extraction pipeline already
    // classifies each claim as positive/negative/null/unclear.
    const allClaimRecs = [...claimIds]
      .map((id) => claimById.get(id))
      .filter((c) => c && c.quote);
    const hasNegativeDirection = allClaimRecs.some(
      (c) => c.direction === "negative" || c.direction === "null",
    );
    const negativeEvidence = !negativeNote && (
      hasNegativeDirection ||
      negativeEvidenceDetected(anchor.synthesis, ...(claims ?? []).map((cl) => cl.text))
    );
    const safetyAnchored = anchor.aspect === "safety";
    const demote = communityOnly || !!negativeNote || negativeEvidence || safetyAnchored;
    const displayTier = demote && anchor.tier !== "exploratory" ? "exploratory" : anchor.tier;

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
      drugClass: comp && comp.drug_class ? String(comp.drug_class) : undefined,
      pathway: displayTier === "exploratory"
        ? "Hypothesis-generation · pre-validation"
        : "505(b)(2) · existing active ingredient, new indication",
      direction: (anyContradiction || negativeNote || negativeEvidence || safetyAnchored) ? "contradicts" : displayTier === "exploratory" ? "silent" : "supports",
      evidenceCaveat: negativeNote ?? (negativeEvidence
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
      dimBreakdown: anchor.dimensions.map((d) => ({ key: d.key, label: d.label, score: d.score, level: lvl(d.score), rationale: d.rationale })),
      signalType: anchor.arm,
      evidenceStrength: anchor.tier,
      claims,
      validationStatus: status,
      femaleApplicability: anchor.female,
      arms,
      safetyArms: safetyArms.length ? safetyArms : undefined,
      matrixPercentile,
      matrixDetail,
      sexPk: sexPk && sexPk.length ? sexPk : undefined,
      cyclePhase: cyclePhase && cyclePhase.length ? cyclePhase : undefined,
      trialStatus,
      orangeBook,
      indication,
    });
  }

  // collapse class→molecule duplicates (keep higher score per drug+condition)
  const bestByKey = new Map();
  const final = [];
  for (const c of out) {
    if (c.curationClass !== "drug") { final.push(c); continue; }
    const key = `${c.drug.toLowerCase()}::${c.conditionId}`;
    const prev = bestByKey.get(key);
    if (!prev) { bestByKey.set(key, c); final.push(c); }
    else if (c.score > prev.score) { final[final.indexOf(prev)] = c; bestByKey.set(key, c); }
  }

  const vWeight = { clinical: 2, unvalidated_signal: 1, preliminary: 0 };
  final.sort((a, b) =>
    b.score - a.score ||
    (vWeight[b.validationStatus ?? "preliminary"] - vWeight[a.validationStatus ?? "preliminary"]) ||
    a.drug.localeCompare(b.drug));
  // renumber WHEL-C ids in sorted (display) order to match the site
  final.forEach((c, i) => { c.id = `WHEL-C-${String(i + 1).padStart(3, "0")}`; });

  // tier + condition distributions for the meta block
  const byCondition = {};
  const tierTotals = { strong: 0, moderate: 0, emerging: 0, exploratory: 0 };
  const curationTotals = { drug: 0, combination: 0, supplement: 0, exclude: 0, class: 0 };
  for (const c of final) {
    tierTotals[c.tier] += 1;
    curationTotals[c.curationClass] += 1;
    const s = (byCondition[c.conditionId] ??= { strong: 0, moderate: 0, emerging: 0, exploratory: 0, total: 0 });
    s[c.tier] += 1; s.total += 1;
  }

  const snapshot = {
    _meta: {
      built: new Date().toISOString(),
      source: "Whel substrate (substrate_signals + entities + claims + compounds) with committed side-layers (MATRIX, DailyMed, Orange Book, ClinicalTrials.gov)",
      builder: "scripts/build-corpus-snapshot.mjs",
      note: "Full curated corpus as surfaced on the public site. Descriptive research context, human-in-the-loop; not clinical or regulatory advice. Point-in-time — re-run to refresh.",
      candidate_count: final.length,
      conditions: Object.keys(byCondition).sort(),
      tier_distribution: tierTotals,
      curation_distribution: curationTotals,
      curation_note: "curationClass: 'drug' = clean single-agent candidate (the public index); 'combination' = multi-agent regimen; 'supplement' = supplement/herbal (adjunct); 'exclude' = non-drug/procedure/junk. All are kept here so a client sees the full picture; the site shows only 'drug'.",
      by_condition: byCondition,
    },
    candidates: final,
  };

  const outPath = path.join(LIB, "corpus-snapshot.json");
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
  console.log(`Wrote ${final.length} candidates across ${Object.keys(byCondition).length} conditions to lib/corpus-snapshot.json`);
  console.log("Tier distribution:", tierTotals);
}

build().catch((e) => { console.error(e); process.exit(1); });
