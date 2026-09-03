// Typed re-export of lib/scoring-history.mjs, which is the single source of truth.
// (Pattern matches lib/curation.ts and lib/substrate-helpers.ts: allowJs makes a
// .d.ts beside the .mjs get ignored, so a thin .ts wrapper carries the types.)

import * as impl from "./scoring-history.mjs";

export type DimKey =
  | "corroboration"
  | "rigor"
  | "specificity"
  | "plausibility"
  | "consistency";

export interface SpecVersion {
  label: string;
  dimensionCount: number;
  armStrengthMax: number;
  tieredOn: "arm_score" | "arm_strength";
  tiers: string[];
  consistencyRange: [number, number];
  summary: string;
}

export interface FrozenSignal {
  id: string;
  drug: string;
  condition: string;
  intervention_id: string;
  condition_id: string;
  aspect: string | null;
  arm: string;
  scores: Record<DimKey, number>;
  rationales: Record<DimKey, string | null>;
  arm_strength: number;
  arm_score: number;
  confidence_tier: string;
  female_applicability_band: string | null;
  female_applicability_multiplier: number;
  contradiction_flag: boolean | null;
  num_contradictions: number | null;
  model_name: string | null;
  prompt_hash: string | null;
}

export interface DeltaRow {
  key: DimKey;
  label: string;
  before: number | null;
  after: number | null;
  changed: boolean;
  rescaled: boolean;
  rationale: string | null;
}

export interface RubricDelta {
  rows: DeltaRow[];
  rescored: boolean;
  before: { spec: SpecVersion; strength: number; max: number; score: number; tier: string };
  after: { spec: SpecVersion; strength: number; max: number };
  movedKeys: DimKey[];
}

export interface Contrast {
  diverging: DimKey[];
  shared: DimKey[];
  a: { strength: number; score: number; tier: string };
  b: { strength: number; score: number; tier: string };
  onlyRescaledDims: boolean;
}

// The .mjs is inferred by allowJs rather than treated as untyped, so each binding is
// re-asserted through `unknown` to the contract declared above. The .mjs stays the
// single source of truth; this file only names its shape for callers.
export const SPEC_VERSIONS = impl.SPEC_VERSIONS as unknown as Record<string, SpecVersion>;
export const CURRENT_SPEC = impl.CURRENT_SPEC as unknown as SpecVersion;
export const PREVIOUS_SPEC = impl.PREVIOUS_SPEC as unknown as SpecVersion;
export const DIM_ORDER = impl.DIM_ORDER as unknown as DimKey[];
export const v13Distribution = impl.v13Distribution as unknown as Record<string, unknown>;
export const v13Meta = impl.v13Meta as unknown as Record<string, unknown>;

export const frozenV13 = impl.frozenV13 as unknown as (
  interventionId: string | undefined,
  conditionId: string | undefined,
  arm?: string
) => FrozenSignal | null;

export const frozenV13BySignalId = impl.frozenV13BySignalId as unknown as (
  signalId: string,
  arm?: string
) => FrozenSignal | null;

export const rubricDelta = impl.rubricDelta as unknown as (
  liveDims: { key: string; label: string; score: number; rationale?: string }[],
  frozen: FrozenSignal | null
) => RubricDelta | null;

export const contrastV13 = impl.contrastV13 as unknown as (
  a: FrozenSignal | null,
  b: FrozenSignal | null
) => Contrast | null;
