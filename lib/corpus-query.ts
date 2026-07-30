// Read-only query layer over the committed corpus snapshot, for the deployed
// MCP endpoint (app/api/mcp). Mirrors mcp/whel-corpus/corpus.mjs. Descriptive
// research context, human-in-the-loop; NOT clinical or regulatory advice.
import snapshot from "@/lib/corpus-snapshot.json";

type Candidate = Record<string, unknown> & {
  id: string; signalId: string; drug: string; condition: string; conditionId: string;
  curationClass?: string; tier: string; score: number; signalType?: string;
  validationStatus?: string; direction?: string; rationale?: string; mechanism?: string;
  drugClass?: string; matrixPercentile?: string;
  indication?: { label_relationship?: string; approved_indication_excerpt?: string; label_url?: string };
  orangeBook?: { supply?: string; generic_available?: boolean };
  trialStatus?: { trial_count?: number; highest_phase_label?: string };
  claims?: unknown[]; dimBreakdown?: unknown[]; sexPk?: unknown; cyclePhase?: unknown;
};

const SNAP = snapshot as unknown as { candidates: Candidate[]; _meta: Record<string, unknown> };
const CANDIDATES: Candidate[] = SNAP.candidates ?? [];
const META = SNAP._meta ?? {};

const DISCLAIMER =
  `Whel curated corpus (built ${(META as { built?: string }).built ?? "unknown"}). ` +
  `Descriptive research context, human-in-the-loop; NOT clinical or regulatory advice.`;

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

const byId = new Map(CANDIDATES.map((c) => [c.id.toLowerCase(), c]));
const bySignal = new Map(CANDIDATES.map((c) => [c.signalId.toLowerCase(), c]));
const byPair = new Map(CANDIDATES.map((c) => [`${c.drug}::${c.condition}`.toLowerCase(), c]));

function summarize(c: Candidate) {
  return {
    id: c.id, signalId: c.signalId, drug: c.drug, condition: c.condition,
    curationClass: c.curationClass ?? "drug", tier: c.tier, score: c.score, arm: c.signalType,
    validationStatus: c.validationStatus,
    labelRelationship: c.indication?.label_relationship ?? null,
    genericAvailable: c.orangeBook?.generic_available ?? null,
    supply: c.orangeBook?.supply ?? null,
    trialCount: c.trialStatus?.trial_count ?? 0,
    highestPhase: c.trialStatus?.highest_phase_label ?? null,
    matrix: c.matrixPercentile ?? null,
    contradiction: c.direction === "contradicts",
  };
}

type Sel = { signalId?: string; id?: string; drug?: string; condition?: string };
function resolve(sel: Sel = {}): Candidate | null {
  if (sel.signalId) return bySignal.get(norm(sel.signalId)) ?? null;
  if (sel.id) return byId.get(norm(sel.id)) ?? null;
  if (sel.drug && sel.condition) return byPair.get(`${norm(sel.drug)}::${norm(sel.condition)}`) ?? null;
  if (sel.drug) return CANDIDATES.find((c) => norm(c.drug) === norm(sel.drug)) ?? null;
  return null;
}

export function meta() {
  return { ...META, disclaimer: DISCLAIMER };
}

export function list(opts: {
  condition?: string; tier?: string; regulatory?: string; drug?: string; arm?: string;
  curationClass?: string; limit?: number; offset?: number;
} = {}) {
  const { condition, tier, regulatory, drug, arm, curationClass, limit = 50, offset = 0 } = opts;
  let rows: Candidate[] =
    curationClass && curationClass !== "all"
      ? CANDIDATES.filter((c) => (c.curationClass ?? "drug") === curationClass)
      : curationClass === "all"
        ? CANDIDATES
        : CANDIDATES.filter((c) => (c.curationClass ?? "drug") === "drug");
  if (condition) {
    const q = norm(condition);
    rows = rows.filter((c) => norm(c.condition) === q || norm(c.conditionId) === q || norm(c.conditionId).includes(q) || norm(c.condition).includes(q));
  }
  if (tier) rows = rows.filter((c) => norm(c.tier) === norm(tier));
  if (arm) rows = rows.filter((c) => norm(c.signalType) === norm(arm));
  if (drug) rows = rows.filter((c) => norm(c.drug).includes(norm(drug)));
  if (regulatory) {
    const r = norm(regulatory);
    rows = rows.filter((c) => {
      if (r === "on-label" || r === "on_label") return c.indication?.label_relationship === "on_label";
      if (r === "off-label" || r === "off_label") return c.indication?.label_relationship === "off_label";
      if (r === "generic") return !!c.orangeBook?.generic_available;
      if (r === "no-label" || r === "no_fda_label") return c.indication?.label_relationship === "no_fda_label";
      return true;
    });
  }
  const total = rows.length;
  const page = rows.slice(offset, offset + limit).map(summarize);
  return { total, offset, limit, count: page.length, candidates: page, disclaimer: DISCLAIMER };
}

export function get(sel: Sel = {}) {
  const c = resolve(sel);
  if (!c) return { error: "No candidate matched. Provide signalId, id, or drug+condition.", disclaimer: DISCLAIMER };
  return { candidate: c, disclaimer: DISCLAIMER };
}

export function evidence(sel: Sel = {}) {
  const c = resolve(sel);
  if (!c) return { error: "No candidate matched.", disclaimer: DISCLAIMER };
  return {
    id: c.id, signalId: c.signalId, drug: c.drug, condition: c.condition, tier: c.tier, score: c.score,
    rationale: c.rationale, mechanism: c.mechanism, dimensions: c.dimBreakdown, claims: c.claims,
    matrix: c.matrixPercentile ?? null,
    regulatory: {
      labelRelationship: c.indication?.label_relationship ?? null,
      approvedIndicationExcerpt: c.indication?.approved_indication_excerpt ?? null,
      labelUrl: c.indication?.label_url ?? null,
      supply: c.orangeBook?.supply ?? null,
      genericAvailable: c.orangeBook?.generic_available ?? null,
      trials: c.trialStatus ?? null,
    },
    sexPk: c.sexPk ?? null, cyclePhase: c.cyclePhase ?? null, disclaimer: DISCLAIMER,
  };
}

export function search(query: string, limit = 25) {
  const q = norm(query);
  if (!q) return { error: "Empty query.", disclaimer: DISCLAIMER };
  const terms = q.split(/\s+/).filter(Boolean);
  const scored: { c: Candidate; hits: number }[] = [];
  for (const c of CANDIDATES) {
    const hay = [c.drug, c.condition, c.rationale, c.mechanism, c.origin, c.drugClass, ...(c.claims ?? []).map((cl) => (cl as { text?: string }).text)]
      .join("  ").toLowerCase();
    let hits = 0;
    for (const t of terms) if (hay.includes(t)) hits += 1;
    if (hits) scored.push({ c, hits });
  }
  scored.sort((a, b) => b.hits - a.hits || b.c.score - a.c.score);
  return { total: scored.length, count: Math.min(limit, scored.length), candidates: scored.slice(0, limit).map((x) => summarize(x.c)), disclaimer: DISCLAIMER };
}

export function conditionSummary(condition?: string) {
  const conds = condition ? [norm(condition)] : [...new Set(CANDIDATES.map((c) => c.conditionId))];
  const out: Record<string, unknown> = {};
  for (const cond of conds) {
    const rows = CANDIDATES.filter((c) => norm(c.conditionId) === norm(cond) || norm(c.condition) === norm(cond) || norm(c.conditionId).includes(norm(cond)));
    if (!rows.length) continue;
    const dist: Record<string, number> = { strong: 0, moderate: 0, emerging: 0, exploratory: 0 };
    for (const c of rows) dist[c.tier] = (dist[c.tier] ?? 0) + 1;
    out[rows[0].conditionId] = {
      condition: rows[0].condition, total: rows.length, tier_distribution: dist,
      candidates: rows.map((c) => ({ drug: c.drug, curationClass: c.curationClass ?? "drug", tier: c.tier, score: c.score, labelRelationship: c.indication?.label_relationship ?? null, arm: c.signalType })),
    };
  }
  return { conditions: out, disclaimer: DISCLAIMER };
}
