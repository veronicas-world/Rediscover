"use client";

import { useState } from "react";

interface Source {
  id: string;
  source_type: string | null;
  external_id: string | null;
  title: string | null;
  authors: string | null;
  journal: string | null;
  publication_date: string | null;
  url: string | null;
  key_finding_excerpt: string | null;
}

export interface Signal {
  id: string;
  signal_type: string | null;
  evidence_strength: string | null;
  summary: string | null;
  mechanism_hypothesis: string | null;
  status: string | null;
  compounds: {
    name: string;
    generic_name: string | null;
    drug_class: string | null;
    fda_status: string | null;
  } | null;
  sources: Source[];
}

// Evidence badge: sage green bg + white text, UPPERCASE + "EVIDENCE" suffix
function EvidenceBadge({ strength }: { strength: string | null }) {
  const key = (strength ?? "").toLowerCase();

  const configs: Record<string, { label: string; bg: string; color: string; border?: string }> = {
    strong: { label: "STRONG EVIDENCE", bg: "#5C6B5D", color: "#fff" },
    moderate: { label: "MODERATE EVIDENCE", bg: "#7A8B7A", color: "#fff" },
    preliminary: {
      label: "PRELIMINARY EVIDENCE",
      bg: "#EEF1EE",
      color: "#5C6B5D",
      border: "#7A8B7A",
    },
  };

  const config = configs[key] ?? {
    label: (strength ?? "UNKNOWN").toUpperCase(),
    bg: "#EEF1EE",
    color: "#5C6B5D",
    border: "#7A8B7A",
  };

  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded tracking-wider whitespace-nowrap"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        border: config.border ? `1px solid ${config.border}` : undefined,
      }}
    >
      {config.label}
    </span>
  );
}

// Derive a display label from a signal's sources array
function getSourceLabel(sources: Source[]): string | null {
  const types = new Set(sources.map((s) => s.source_type));
  if (types.has("faers")) return "FDA FAERS";
  if (types.has("pubmed")) return "PubMed";
  return null;
}

// Small source badge shown on signal cards
function SourceBadge({ sources }: { sources: Source[] }) {
  const label = getSourceLabel(sources);
  if (!label) return null;
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded tracking-wide whitespace-nowrap"
      style={{ backgroundColor: "#F0EDE8", color: "#888", border: "1px solid #E0DDD8" }}
    >
      Source: {label}
    </span>
  );
}

// Section field label inside cards
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#999" }}>
      {children}
    </p>
  );
}

// Collapsible citations with configurable colors.
// PubMed sources render as linked paper titles with authors/journal.
// FAERS sources render as reaction-category rows with report counts.
function CollapsibleSources({
  sources,
  linkColor = "#7A8B7A",
  textColor = "#666",
  mutedColor = "#999",
  borderColor = "#E0DDD8",
}: {
  sources: Source[];
  linkColor?: string;
  textColor?: string;
  mutedColor?: string;
  borderColor?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;

  const pubmedSources = sources.filter((s) => s.source_type === "pubmed");
  const faersSources  = sources.filter((s) => s.source_type === "faers");
  const otherSources  = sources.filter((s) => s.source_type !== "pubmed" && s.source_type !== "faers");

  return (
    <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${borderColor}` }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-70"
        style={{ color: linkColor }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
        {open ? "Hide" : "View"} Citations ({sources.length})
      </button>

      {open && (
        <div className="mt-3 space-y-4">

          {/* PubMed sources */}
          {pubmedSources.length > 0 && (
            <div>
              {(faersSources.length > 0 || otherSources.length > 0) && (
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: mutedColor }}>
                  Published Research
                </p>
              )}
              <ul className="space-y-3">
                {pubmedSources.map((source) => (
                  <li key={source.id} className="text-xs leading-relaxed" style={{ color: textColor }}>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline underline-offset-2"
                        style={{ color: linkColor }}
                      >
                        {source.title ?? source.external_id ?? source.url}
                      </a>
                    ) : (
                      <span className="font-medium" style={{ color: "#333" }}>
                        {source.title ?? source.external_id ?? "Source"}
                      </span>
                    )}
                    {source.authors && (
                      <span style={{ color: mutedColor }}> — {source.authors}</span>
                    )}
                    {source.journal && (
                      <span style={{ color: mutedColor }} className="italic">
                        , {source.journal}
                      </span>
                    )}
                    {source.publication_date && (
                      <span style={{ color: mutedColor }}>
                        {" "}({source.publication_date.slice(0, 4)})
                      </span>
                    )}
                    {source.external_id && (
                      <span className="ml-1" style={{ color: mutedColor }}>
                        · PMID {source.external_id}
                      </span>
                    )}
                    {source.key_finding_excerpt && (
                      <p className="mt-1.5 italic leading-relaxed" style={{ color: mutedColor }}>
                        &ldquo;{source.key_finding_excerpt}&rdquo;
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* FAERS sources — query summary + reaction categories with counts */}
          {faersSources.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: mutedColor }}>
                FDA Adverse Event Reports (FAERS)
              </p>
              {(() => {
                const querySummary = faersSources.find((s) =>
                  (s.external_id ?? "").startsWith("FAERS-QUERY-")
                );
                const reactionRows = faersSources.filter((s) =>
                  !(s.external_id ?? "").startsWith("FAERS-QUERY-")
                );
                return (
                  <>
                    {/* Volume summary row */}
                    {querySummary && (
                      <div
                        className="rounded px-3 py-2 mb-2 text-xs leading-snug"
                        style={{ backgroundColor: "#F5F3EF", border: "1px solid #E0DDD8", color: textColor }}
                      >
                        <span style={{ color: mutedColor }}>
                          {/* Strip "FDA FAERS Database Query: " prefix for a tighter label */}
                          {(querySummary.title ?? "").replace(/^FDA FAERS Database Query:\s*/i, "")}
                        </span>
                        {querySummary.url && (
                          <a
                            href={querySummary.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 hover:underline underline-offset-2 whitespace-nowrap"
                            style={{ color: mutedColor, fontSize: "10px" }}
                          >
                            FDA FAERS ↗ (raw FDA data)
                          </a>
                        )}
                      </div>
                    )}
                    {/* Per-reaction pill rows */}
                    {reactionRows.length > 0 && (
                      <ul className="space-y-1.5">
                        {reactionRows.map((source) => (
                          <li
                            key={source.id}
                            className="flex items-center justify-between text-xs rounded px-3 py-1.5"
                            style={{ backgroundColor: "#F5F3EF", border: "1px solid #E0DDD8" }}
                          >
                            <span style={{ color: textColor }}>
                              {(source.title ?? "").replace(/^FAERS:\s*/i, "")}
                            </span>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-3 shrink-0 hover:underline underline-offset-2 whitespace-nowrap"
                                style={{ color: mutedColor, fontSize: "10px" }}
                              >
                                verify ↗ (raw FDA data)
                              </a>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {/* Inclusion note */}
                    <p className="mt-2 text-[10px] leading-relaxed" style={{ color: mutedColor }}>
                      Reactions with 2+ reports shown. Unexpected patterns may indicate biological connections.
                    </p>
                  </>
                );
              })()}
            </div>
          )}

          {/* Other / unknown source types */}
          {otherSources.length > 0 && (
            <ul className="space-y-3">
              {otherSources.map((source) => (
                <li key={source.id} className="text-xs leading-relaxed" style={{ color: textColor }}>
                  <span className="font-medium" style={{ color: "#333" }}>
                    {source.title ?? source.external_id ?? "Source"}
                  </span>
                  {source.journal && (
                    <span style={{ color: mutedColor }} className="italic">
                      , {source.journal}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

        </div>
      )}
    </div>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E0DDD8" }}>
      {/* Compound name + evidence badge */}
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <h3 className="font-heading text-lg font-bold leading-tight" style={{ color: "#333" }}>
          {signal.compounds?.name ?? "Unknown compound"}
        </h3>
        {signal.evidence_strength && (
          <EvidenceBadge strength={signal.evidence_strength} />
        )}
      </div>

      {/* Compound meta tags + source badge */}
      {(signal.compounds?.drug_class || signal.compounds?.fda_status || signal.sources.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-5">
          {signal.compounds?.drug_class && (
            <span
              className="text-[11px] px-2.5 py-0.5 rounded"
              style={{ backgroundColor: "#F5F3EF", color: "#666", border: "1px solid #E0DDD8" }}
            >
              {signal.compounds.drug_class}
            </span>
          )}
          {signal.compounds?.fda_status && (
            <span
              className="text-[11px] px-2.5 py-0.5 rounded"
              style={{ backgroundColor: "#F5F3EF", color: "#666", border: "1px solid #E0DDD8" }}
            >
              {signal.compounds.fda_status}
            </span>
          )}
          <SourceBadge sources={signal.sources} />
        </div>
      )}

      {/* Body */}
      <div className="space-y-4">
        {signal.summary && (
          <div>
            <FieldLabel>Summary</FieldLabel>
            <p className="text-sm leading-relaxed" style={{ color: "#333" }}>
              {signal.summary}
            </p>
          </div>
        )}
        {signal.mechanism_hypothesis && (
          <div>
            <FieldLabel>Mechanism Hypothesis</FieldLabel>
            <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
              {signal.mechanism_hypothesis}
            </p>
          </div>
        )}
      </div>

      <CollapsibleSources sources={signal.sources} />
    </div>
  );
}

// Pathway signal_types — these always win regardless of source
const PATHWAY_SIGNAL_TYPES = new Set(["pathway_signal", "caution_signal"]);

// Source types that belong in Cross-Condition
const CROSS_SOURCE_TYPES = new Set(["faers", "sider"]);

// Source types that belong in Direct Research
const DIRECT_SOURCE_TYPES = new Set(["pubmed", "clinical_trial"]);

function getSignalTab(signal: Signal): "direct" | "cross" | "caution" {
  // Pathway signal_type overrides everything
  if (PATHWAY_SIGNAL_TYPES.has(signal.signal_type ?? "")) return "caution";

  const sourceTypes = signal.sources.map((s) => s.source_type).filter(Boolean);

  // If any source is FAERS or SIDER → Cross-Condition
  if (sourceTypes.some((t) => CROSS_SOURCE_TYPES.has(t!))) return "cross";

  // If any source is PubMed or ClinicalTrials → Direct Research
  if (sourceTypes.some((t) => DIRECT_SOURCE_TYPES.has(t!))) return "direct";

  // No sources or unknown source type → Direct Research (default)
  return "direct";
}

// Muted amber palette for Pathway signals
const amber = {
  bg: "#FEFAF2",
  border: "#EAD9B0",
  heading: "#5D4B20",
  body: "#7A6030",
  label: "#A08040",
  tagBg: "#F5E8C0",
  tagBorder: "#D4B870",
  link: "#8B6914",
};

function PathwaySignalCard({ signal }: { signal: Signal }) {
  return (
    <div
      className="rounded-xl p-6"
      style={{ backgroundColor: amber.bg, border: `1px solid ${amber.border}` }}
    >
      {/* Compound name + badge */}
      <div className="flex flex-wrap items-start gap-3 mb-4">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-1.5 shrink-0"
          style={{ color: amber.label }}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="3" />
          <path d="M11 2v2M11 20v2M2 11h2M20 11h2" />
          <path d="m14.5 7.5 1.5-1.5M8 14l-1.5 1.5M14.5 14.5l1.5 1.5M8 8 6.5 6.5" />
        </svg>
        <h3 className="font-heading text-lg font-bold leading-tight" style={{ color: amber.heading }}>
          {signal.compounds?.name ?? "Unknown compound"}
        </h3>
        {signal.evidence_strength && (
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded tracking-wider"
            style={{
              backgroundColor: amber.tagBg,
              color: amber.link,
              border: `1px solid ${amber.tagBorder}`,
            }}
          >
            {signal.evidence_strength.toUpperCase()}
          </span>
        )}
      </div>

      {/* Meta tags + source badge */}
      {(signal.compounds?.drug_class || signal.compounds?.fda_status || signal.sources.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-5">
          {signal.compounds?.drug_class && (
            <span
              className="text-[11px] px-2.5 py-0.5 rounded"
              style={{ backgroundColor: amber.tagBg, color: amber.body, border: `1px solid ${amber.tagBorder}` }}
            >
              {signal.compounds.drug_class}
            </span>
          )}
          {signal.compounds?.fda_status && (
            <span
              className="text-[11px] px-2.5 py-0.5 rounded"
              style={{ backgroundColor: amber.tagBg, color: amber.body, border: `1px solid ${amber.tagBorder}` }}
            >
              {signal.compounds.fda_status}
            </span>
          )}
          <SourceBadge sources={signal.sources} />
        </div>
      )}

      {/* Body */}
      <div className="space-y-4">
        {signal.summary && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: amber.label }}>
              Summary
            </p>
            <p className="text-sm leading-relaxed" style={{ color: amber.heading }}>
              {signal.summary}
            </p>
          </div>
        )}
        {signal.mechanism_hypothesis && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: amber.label }}>
              Pathway Insight
            </p>
            <p className="text-sm leading-relaxed" style={{ color: amber.body }}>
              {signal.mechanism_hypothesis}
            </p>
          </div>
        )}
      </div>

      <CollapsibleSources
        sources={signal.sources}
        linkColor={amber.link}
        textColor={amber.body}
        mutedColor={amber.label}
        borderColor={amber.border}
      />
    </div>
  );
}

type Tab = "direct" | "cross" | "caution";

export default function ResearchSignalsTabs({ signals }: { signals: Signal[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("direct");

  const directSignals = signals.filter((s) => getSignalTab(s) === "direct");
  const cautionSignals = signals.filter((s) => getSignalTab(s) === "caution");
  const crossSignals = signals.filter((s) => getSignalTab(s) === "cross");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "direct", label: "Direct Research", count: directSignals.length },
    { key: "cross", label: "Cross-Condition", count: crossSignals.length },
    { key: "caution", label: "Pathways", count: cautionSignals.length },
  ];

  function tabStyle(key: Tab) {
    const isActive = activeTab === key;
    const isPathway = key === "caution";

    if (isActive && isPathway) {
      return {
        backgroundColor: amber.tagBg,
        color: amber.link,
        border: `1px solid ${amber.tagBorder}`,
      };
    }
    if (isActive) {
      return {
        backgroundColor: "#EEF1EE",
        color: "#5C6B5D",
        border: "1px solid #7A8B7A",
      };
    }
    return {
      backgroundColor: "transparent",
      color: "#666",
      border: "1px solid #E0DDD8",
    };
  }

  return (
    <div>
      {/* Pill tab bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="px-4 py-2 text-sm font-medium rounded-full transition-all"
            style={tabStyle(key)}
          >
            {label}
            {count > 0 && (
              <span
                className="ml-1.5 text-xs rounded-full px-1.5 py-0.5"
                style={
                  activeTab === key && key === "caution"
                    ? { backgroundColor: amber.bg, color: amber.label }
                    : activeTab === key
                    ? { backgroundColor: "#D8E5D8", color: "#5C6B5D" }
                    : { backgroundColor: "#F0EDE8", color: "#888" }
                }
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Direct Research tab */}
      {activeTab === "direct" && (
        <div>
          {directSignals.length === 0 ? (
            <p className="text-sm italic py-4" style={{ color: "#999" }}>
              No direct signals identified yet.
            </p>
          ) : (
            <div className="space-y-5">
              {directSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cross-Condition tab */}
      {activeTab === "cross" && (
        <div>
          <div
            className="flex gap-3 items-start p-4 rounded-lg mb-6"
            style={{ backgroundColor: "#EEF1EE", border: "1px solid #D0DAD0" }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0"
              style={{ color: "#7A8B7A" }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm leading-relaxed" style={{ color: "#5C6B5D" }}>
              Drugs approved for other conditions that showed incidental benefit for shared biology. Hypothesis-generating, not treatment evidence.
            </p>
          </div>
          {crossSignals.length === 0 ? (
            <p className="text-sm italic py-4" style={{ color: "#999" }}>
              No cross-condition signals identified yet.
            </p>
          ) : (
            <div className="space-y-5">
              {crossSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pathways tab */}
      {activeTab === "caution" && (
        <div>
          <div
            className="flex gap-3 items-start p-4 rounded-lg mb-6"
            style={{ backgroundColor: amber.bg, border: `1px solid ${amber.border}` }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-0.5 shrink-0"
              style={{ color: amber.label }}
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="3" />
              <path d="M11 2v2M11 20v2M2 11h2M20 11h2" />
              <path d="m14.5 7.5 1.5-1.5M8 14l-1.5 1.5M14.5 14.5l1.5 1.5M8 8 6.5 6.5" />
            </svg>
            <p className="text-sm leading-relaxed" style={{ color: amber.body }}>
              Drugs observed to affect or worsen this condition. These signals reveal which biological pathways are involved and may point toward new treatment approaches.
            </p>
          </div>
          {cautionSignals.length === 0 ? (
            <p className="text-sm italic py-4" style={{ color: "#999" }}>
              No pathway signals identified yet.
            </p>
          ) : (
            <div className="space-y-5">
              {cautionSignals.map((signal) => (
                <PathwaySignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
