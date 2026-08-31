// Display-time curation — typed re-export from the plain-JS source of truth.
//
// The logic lives in lib/curation.mjs so that scripts/build-corpus-snapshot.mjs
// can import the same code without a build step. This file adds TypeScript types
// on top and is what the Next.js app imports.
//
// This is a reversible, display-time filter — it does NOT modify the substrate.

export type CurationClass = "drug" | "exclude" | "combination" | "supplement" | "class";

import {
  classifyCuration as _classifyCuration,
  resolveDrugClass as _resolveDrugClass,
  normalizeDrugName as _normalizeDrugName,
  isCommunityOnly as _isCommunityOnly,
  knownNegativeNote as _knownNegativeNote,
  negativeEvidenceDetected as _negativeEvidenceDetected,
  CLASS_TO_MOLECULE as _CLASS_TO_MOLECULE,
  KNOWN_NEGATIVE as _KNOWN_NEGATIVE,
} from "./curation.mjs";

export const CLASS_TO_MOLECULE: Record<string, string> = _CLASS_TO_MOLECULE;
export const KNOWN_NEGATIVE: Record<string, string> = _KNOWN_NEGATIVE;

export function knownNegativeNote(drug: string, conditionId: string): string | null {
  return _knownNegativeNote(drug, conditionId);
}

export function negativeEvidenceDetected(...text: (string | undefined | null)[]): boolean {
  return _negativeEvidenceDetected(...text);
}

export function isCommunityOnly(claims: { src?: string }[] | undefined): boolean {
  return _isCommunityOnly(claims);
}

export function normalizeDrugName(drug: string | null | undefined): string {
  return _normalizeDrugName(drug);
}

export function resolveDrugClass(drug: string | null | undefined):
  { molecule: string } | { rollup: true } | null {
  return _resolveDrugClass(drug) as { molecule: string } | { rollup: true } | null;
}

export function classifyCuration(drug: string | null | undefined): CurationClass {
  return _classifyCuration(drug) as CurationClass;
}
