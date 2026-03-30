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

// Section field label inside cards
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "#999" }}>
      {children}
    </p>
  );
}

// Collapsible citations with configurable colors
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
        <ul className="mt-3 space-y-3">
          {sources.map((source) => (
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
              {source.external_id && source.source_type === "pubmed" && (
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

      {/* Compound meta tags */}
      {(signal.compounds?.drug_class || signal.compounds?.fda_status) && (
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

const CROSS_CONDITION_TYPES = new Set([
  "population_study",
  "side_effect_signal",
  "observational_study",
  "claims_data_analysis",
]);

const CAUTION_TYPE = "caution_signal";

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

      {/* Meta tags */}
      {(signal.compounds?.drug_class || signal.compounds?.fda_status) && (
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

  const cautionSignals = signals.filter((s) => s.signal_type === CAUTION_TYPE);
  const crossSignals = signals.filter(
    (s) => s.signal_type && CROSS_CONDITION_TYPES.has(s.signal_type)
  );
  const directSignals = signals.filter(
    (s) =>
      s.signal_type !== CAUTION_TYPE &&
      !CROSS_CONDITION_TYPES.has(s.signal_type ?? "")
  );

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
              Research in progress — no direct signals identified yet.
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
              Drugs developed for other conditions that showed incidental benefit
              for symptoms related to this condition. These are hypothesis-generating
              signals — not treatment evidence — but they identify compounds worth
              investigating.
            </p>
          </div>
          {crossSignals.length === 0 ? (
            <p className="text-sm italic py-4" style={{ color: "#999" }}>
              Cross-condition signals are in progress for this condition.
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
              These drugs have been observed to affect or worsen this condition.
              Rather than serving solely as warnings, these signals provide valuable
              insight into the biological pathways involved in the condition — and
              may point toward new therapeutic approaches. Understanding what makes
              a condition worse can reveal what might make it better.
            </p>
          </div>
          {cautionSignals.length === 0 ? (
            <p className="text-sm italic py-4" style={{ color: "#999" }}>
              No pathway signals have been identified for this condition yet.
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
