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

const EVIDENCE_BADGE: Record<string, { label: string; classes: string }> = {
  strong: {
    label: "Strong",
    classes: "bg-green-50 text-green-700 border border-green-200",
  },
  moderate: {
    label: "Moderate",
    classes: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  preliminary: {
    label: "Preliminary",
    classes: "bg-slate-100 text-slate-500 border border-slate-200",
  },
};

function EvidenceBadge({ strength }: { strength: string | null }) {
  const key = (strength ?? "").toLowerCase();
  const badge = EVIDENCE_BADGE[key] ?? {
    label: strength ?? "Unknown",
    classes: "bg-slate-100 text-slate-400 border border-slate-200",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badge.classes}`}>
      {badge.label}
    </span>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      {/* Compound name + badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <h3
          className="text-base font-semibold font-heading"
          style={{ color: "var(--accent-dark, #0d3d7a)" }}
        >
          {signal.compounds?.name ?? "Unknown compound"}
        </h3>
        {signal.evidence_strength && (
          <EvidenceBadge strength={signal.evidence_strength} />
        )}
      </div>

      {/* Compound meta */}
      {(signal.compounds?.drug_class || signal.compounds?.fda_status) && (
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-400">
          {signal.compounds.drug_class && (
            <span className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
              {signal.compounds.drug_class}
            </span>
          )}
          {signal.compounds.fda_status && (
            <span className="bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
              {signal.compounds.fda_status}
            </span>
          )}
        </div>
      )}

      {/* Signal body */}
      <div className="space-y-4">
        {signal.summary && (
          <p className="text-sm text-slate-700 leading-relaxed">
            {signal.summary}
          </p>
        )}
        {signal.mechanism_hypothesis && (
          <div className="border-l-2 border-slate-200 pl-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1">
              Proposed Mechanism
            </span>
            <p className="text-sm text-slate-600 leading-relaxed">
              {signal.mechanism_hypothesis}
            </p>
          </div>
        )}
      </div>

      {/* Sources */}
      {signal.sources && signal.sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Sources
          </p>
          <ul className="space-y-3">
            {signal.sources.map((source) => (
              <li key={source.id} className="text-xs text-slate-600 leading-relaxed">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline underline-offset-2"
                    style={{ color: "var(--accent)" }}
                  >
                    {source.title ?? source.external_id ?? source.url}
                  </a>
                ) : (
                  <span className="font-medium text-slate-700">
                    {source.title ?? source.external_id ?? "Source"}
                  </span>
                )}
                {source.authors && (
                  <span className="text-slate-400"> — {source.authors}</span>
                )}
                {source.journal && (
                  <span className="text-slate-400 italic">, {source.journal}</span>
                )}
                {source.publication_date && (
                  <span className="text-slate-400">
                    {" "}({source.publication_date.slice(0, 4)})
                  </span>
                )}
                {source.external_id && source.source_type === "pubmed" && (
                  <span className="ml-1 text-slate-400">
                    · PMID {source.external_id}
                  </span>
                )}
                {source.key_finding_excerpt && (
                  <p className="mt-1.5 text-slate-500 italic leading-relaxed">
                    &ldquo;{source.key_finding_excerpt}&rdquo;
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
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

function ReverseSignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm">
      {/* Compound name + badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-slate-400 shrink-0"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="3" />
          <path d="M11 2v2M11 20v2M2 11h2M20 11h2" />
          <path d="m14.5 7.5 1.5-1.5M8 14l-1.5 1.5M14.5 14.5l1.5 1.5M8 8 6.5 6.5" />
          <line x1="11" y1="14" x2="11" y2="20" />
        </svg>
        <h3 className="text-base font-semibold font-heading text-slate-800">
          {signal.compounds?.name ?? "Unknown compound"}
        </h3>
        {signal.evidence_strength && (
          <EvidenceBadge strength={signal.evidence_strength} />
        )}
      </div>

      {/* Compound meta */}
      {(signal.compounds?.drug_class || signal.compounds?.fda_status) && (
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-slate-400">
          {signal.compounds.drug_class && (
            <span className="bg-white border border-slate-200 rounded px-2 py-0.5">
              {signal.compounds.drug_class}
            </span>
          )}
          {signal.compounds.fda_status && (
            <span className="bg-white border border-slate-200 rounded px-2 py-0.5">
              {signal.compounds.fda_status}
            </span>
          )}
        </div>
      )}

      {/* Signal body */}
      <div className="space-y-4">
        {signal.summary && (
          <p className="text-sm text-slate-700 leading-relaxed">
            {signal.summary}
          </p>
        )}
        {signal.mechanism_hypothesis && (
          <div className="border-l-2 border-slate-300 pl-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 block mb-1">
              Pathway Insight
            </span>
            <p className="text-sm text-slate-600 leading-relaxed">
              {signal.mechanism_hypothesis}
            </p>
          </div>
        )}
      </div>

      {/* Sources */}
      {signal.sources && signal.sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-200">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
            Sources
          </p>
          <ul className="space-y-3">
            {signal.sources.map((source) => (
              <li key={source.id} className="text-xs text-slate-600 leading-relaxed">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline underline-offset-2"
                    style={{ color: "var(--accent)" }}
                  >
                    {source.title ?? source.external_id ?? source.url}
                  </a>
                ) : (
                  <span className="font-medium text-slate-700">
                    {source.title ?? source.external_id ?? "Source"}
                  </span>
                )}
                {source.authors && (
                  <span className="text-slate-400"> — {source.authors}</span>
                )}
                {source.journal && (
                  <span className="text-slate-400 italic">, {source.journal}</span>
                )}
                {source.publication_date && (
                  <span className="text-slate-400">
                    {" "}({source.publication_date.slice(0, 4)})
                  </span>
                )}
                {source.external_id && source.source_type === "pubmed" && (
                  <span className="ml-1 text-slate-400">
                    · PMID {source.external_id}
                  </span>
                )}
                {source.key_finding_excerpt && (
                  <p className="mt-1.5 text-slate-500 italic leading-relaxed">
                    &ldquo;{source.key_finding_excerpt}&rdquo;
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
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

  const tabBase =
    "pb-3 text-sm font-medium transition-colors focus:outline-none whitespace-nowrap";
  const activeStyle = {
    color: "var(--accent)",
    borderBottom: "2px solid var(--accent)",
  };
  const activeReverseStyle = {
    color: "#475569",
    borderBottom: "2px solid #475569",
  };
  const inactiveStyle = {
    color: "#94a3b8",
    borderBottom: "2px solid transparent",
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-6 mb-8 border-b border-slate-200 overflow-x-auto">
        <button
          className={tabBase}
          style={activeTab === "direct" ? activeStyle : inactiveStyle}
          onClick={() => setActiveTab("direct")}
        >
          Direct Research
          {directSignals.length > 0 && (
            <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">
              {directSignals.length}
            </span>
          )}
        </button>
        <button
          className={tabBase}
          style={activeTab === "cross" ? activeStyle : inactiveStyle}
          onClick={() => setActiveTab("cross")}
        >
          Cross-Condition
          {crossSignals.length > 0 && (
            <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">
              {crossSignals.length}
            </span>
          )}
        </button>
        <button
          className={tabBase}
          style={activeTab === "caution" ? activeReverseStyle : inactiveStyle}
          onClick={() => setActiveTab("caution")}
        >
          Reverse Signals
          {cautionSignals.length > 0 && (
            <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5">
              {cautionSignals.length}
            </span>
          )}
        </button>
      </div>

      {/* Direct Research tab */}
      {activeTab === "direct" && (
        <div>
          {directSignals.length === 0 ? (
            <p className="text-slate-400 text-sm italic py-4">
              Research in progress — no direct signals identified yet.
            </p>
          ) : (
            <div className="space-y-6">
              {directSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cross-Condition Signals tab */}
      {activeTab === "cross" && (
        <div>
          <div className="flex gap-3 items-start p-4 bg-blue-50 border border-blue-100 rounded-lg mb-6">
            <span className="text-blue-400 text-sm mt-0.5 shrink-0">ℹ</span>
            <p className="text-sm text-slate-600 leading-relaxed">
              Drugs developed for other conditions that showed incidental benefit
              for symptoms related to this condition. These are hypothesis-generating
              signals — not treatment evidence — but they identify compounds worth
              investigating.
            </p>
          </div>
          {crossSignals.length === 0 ? (
            <p className="text-slate-400 text-sm italic py-4">
              Cross-condition signals are in progress for this condition.
            </p>
          ) : (
            <div className="space-y-6">
              {crossSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reverse Signals tab */}
      {activeTab === "caution" && (
        <div>
          <div className="flex gap-3 items-start p-4 bg-slate-50 border border-slate-200 rounded-lg mb-6">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400 mt-0.5 shrink-0"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="3" />
              <path d="M11 2v2M11 20v2M2 11h2M20 11h2" />
              <path d="m14.5 7.5 1.5-1.5M8 14l-1.5 1.5M14.5 14.5l1.5 1.5M8 8 6.5 6.5" />
              <line x1="11" y1="14" x2="11" y2="20" />
            </svg>
            <p className="text-sm text-slate-600 leading-relaxed">
              These drugs have been observed to affect or worsen this condition. Rather than serving solely as warnings, these signals provide valuable insight into the biological pathways involved in the condition — and may point toward new therapeutic approaches. Understanding what makes a condition worse can reveal what might make it better.
            </p>
          </div>
          {cautionSignals.length === 0 ? (
            <p className="text-slate-400 text-sm italic py-4">
              No reverse signals have been identified for this condition yet.
            </p>
          ) : (
            <div className="space-y-6">
              {cautionSignals.map((signal) => (
                <ReverseSignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
