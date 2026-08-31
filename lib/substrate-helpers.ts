// Typed re-export from the plain-JS source of truth (lib/substrate-helpers.mjs).
//
// The logic lives in the .mjs file so that scripts/build-corpus-snapshot.mjs can
// import the same code without a build step. This file adds TypeScript types on
// top and is what the Next.js app imports.

import type { SubstrateArm } from "@/app/components/CandidateCard";

import {
  ARMS as _ARMS, DIMS as _DIMS, SLUG_OVERRIDE as _SLUG_OVERRIDE,
  COND_ALIAS as _COND_ALIAS, SIGNAL_COLS as _SIGNAL_COLS,
  num as _num, tierLc as _tierLc, lvl as _lvl, clip as _clip,
  sourceLabel as _sourceLabel, sourceHref as _sourceHref, claimRank as _claimRank,
  toArm as _toArm, deriveHeadline as _deriveHeadline,
  formatMatrixPercentile as _formatMatrixPercentile,
} from "./substrate-helpers.mjs";

export type ArmKey = "direct" | "pathway" | "community";

export const ARMS: ArmKey[] = _ARMS as ArmKey[];
export const DIMS: { key: string; label: string }[] = _DIMS;
export const SLUG_OVERRIDE: Record<string, string> = _SLUG_OVERRIDE;
export const COND_ALIAS: Record<string, string> = _COND_ALIAS;
export const SIGNAL_COLS: string = _SIGNAL_COLS;

export function num(v: unknown, d = 0): number { return _num(v, d); }
export function tierLc(t: unknown): "strong" | "moderate" | "emerging" | "exploratory" {
  return _tierLc(t) as "strong" | "moderate" | "emerging" | "exploratory";
}
export function lvl(score: unknown): string { return _lvl(score); }
export function clip(s: string, n: number): string { return _clip(s, n); }
export function sourceLabel(doc: Record<string, unknown> | null): string { return _sourceLabel(doc); }
export function sourceHref(doc: Record<string, unknown> | null): string | undefined { return _sourceHref(doc); }
export function claimRank(doc: Record<string, unknown> | null): number { return _claimRank(doc); }
export function toArm(sig: Record<string, unknown>): SubstrateArm { return _toArm(sig) as SubstrateArm; }
export function deriveHeadline(arms: SubstrateArm[]): {
  status: "clinical" | "unvalidated_signal" | "preliminary";
  anchor: SubstrateArm;
} {
  return _deriveHeadline(arms) as { status: "clinical" | "unvalidated_signal" | "preliminary"; anchor: SubstrateArm };
}
export function formatMatrixPercentile(qr: number): string { return _formatMatrixPercentile(qr); }
