// Typed re-export of lib/rubric-anchors.mjs, the rendering source for the
// signal-types rubric section. Pattern matches lib/scoring-history.ts.

import * as impl from "./rubric-anchors.mjs";

export interface AnchorDimension {
  key: string;
  label: string;
  means: string;
  anchors: [string, string, string];
}

export interface AnchorConsistency {
  means: string;
  anchors: Record<string, string>;
}

export interface ArmAnchors {
  label: string;
  intro: string;
  dimensions: AnchorDimension[];
  consistency: AnchorConsistency;
}

export const RUBRIC_ANCHORS = impl.RUBRIC_ANCHORS as unknown as Record<
  "direct" | "pathway" | "community",
  ArmAnchors
>;

export const CONSISTENCY_PENALTY = impl.CONSISTENCY_PENALTY as unknown as {
  label: string;
  summary: string;
  rows: { value: string; meaning: string }[];
};

export const GRADE_MAPPING = impl.GRADE_MAPPING as unknown as {
  whel: string;
  grade: string;
  status: "adapted" | "partial" | "novel";
  note: string;
}[];

export const GRADE_SUMMARY = impl.GRADE_SUMMARY as unknown as string;

export const RUBRIC_SOURCES = impl.RUBRIC_SOURCES as unknown as {
  label: string;
  href: string;
}[];
