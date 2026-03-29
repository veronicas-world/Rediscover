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
    classes: "bg-green-100 text-green-800 border border-green-200",
  },
  moderate: {
    label: "Moderate",
    classes: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  preliminary: {
    label: "Preliminary",
    classes: "bg-stone-100 text-stone-600 border border-stone-200",
  },
};

function EvidenceBadge({ strength }: { strength: string | null }) {
  const key = (strength ?? "").toLowerCase();
  const badge = EVIDENCE_BADGE[key] ?? {
    label: strength ?? "Unknown",
    classes: "bg-stone-100 text-stone-500 border border-stone-200",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${badge.classes}`}>
      {badge.label}
    </span>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg p-6">
      {/* Compound name + badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold text-stone-900">
          {signal.compounds?.name ?? "Unknown compound"}
        </h3>
        {signal.evidence_strength && (
          <EvidenceBadge strength={signal.evidence_strength} />
        )}
        {signal.signal_type && (
          <span className="text-xs text-stone-500 border border-stone-200 rounded px-2 py-0.5">
            {signal.signal_type}
          </span>
        )}
      </div>

      {/* Compound meta */}
      {(signal.compounds?.drug_class || signal.compounds?.fda_status) && (
        <div className="flex gap-4 mb-4 text-xs text-stone-500">
          {signal.compounds.drug_class && (
            <span>Class: {signal.compounds.drug_class}</span>
          )}
          {signal.compounds.fda_status && (
            <span>FDA: {signal.compounds.fda_status}</span>
          )}
        </div>
      )}

      {/* Signal body */}
      <div className="space-y-3">
        {signal.summary && (
          <p className="text-sm text-stone-700 leading-relaxed">
            {signal.summary}
          </p>
        )}
        {signal.mechanism_hypothesis && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">
              Proposed Mechanism
            </span>
            <p className="text-sm text-stone-600 leading-relaxed mt-0.5">
              {signal.mechanism_hypothesis}
            </p>
          </div>
        )}
      </div>

      {/* Sources */}
      {signal.sources && signal.sources.length > 0 && (
        <div className="mt-5 pt-4 border-t border-stone-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
            Sources
          </p>
          <ul className="space-y-2">
            {signal.sources.map((source) => (
              <li key={source.id} className="text-xs text-stone-600 leading-relaxed">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-2 hover:text-stone-900"
                  >
                    {source.title ?? source.external_id ?? source.url}
                  </a>
                ) : (
                  <span className="font-medium">
                    {source.title ?? source.external_id ?? "Source"}
                  </span>
                )}
                {source.authors && (
                  <span className="text-stone-400"> — {source.authors}</span>
                )}
                {source.journal && (
                  <span className="text-stone-400 italic">, {source.journal}</span>
                )}
                {source.publication_date && (
                  <span className="text-stone-400">
                    {" "}({source.publication_date.slice(0, 4)})
                  </span>
                )}
                {source.key_finding_excerpt && (
                  <p className="mt-1 text-stone-500 italic">
                    &ldquo;{source.key_finding_excerpt}&rdquo;
                  </p>
                )}
                {source.external_id && source.source_type === "pubmed" && (
                  <span className="ml-1 text-stone-400">
                    PMID: {source.external_id}
                  </span>
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

type Tab = "direct" | "cross";

export default function ResearchSignalsTabs({ signals }: { signals: Signal[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("direct");

  const crossSignals = signals.filter(
    (s) => s.signal_type && CROSS_CONDITION_TYPES.has(s.signal_type)
  );
  const directSignals = signals.filter(
    (s) => !CROSS_CONDITION_TYPES.has(s.signal_type ?? "")
  );

  const tabBase =
    "pb-2 text-sm font-medium transition-colors focus:outline-none";
  const activeStyle = {
    color: "#6b2737",
    borderBottom: "2px solid #6b2737",
  };
  const inactiveStyle = {
    color: "#78716c", // stone-500
    borderBottom: "2px solid transparent",
  };

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-6 mb-6 border-b border-stone-200">
        <button
          className={tabBase}
          style={activeTab === "direct" ? activeStyle : inactiveStyle}
          onClick={() => setActiveTab("direct")}
        >
          Direct Research
        </button>
        <button
          className={tabBase}
          style={activeTab === "cross" ? activeStyle : inactiveStyle}
          onClick={() => setActiveTab("cross")}
        >
          Cross-Condition Signals
        </button>
      </div>

      {/* Direct Research tab */}
      {activeTab === "direct" && (
        <div>
          {directSignals.length === 0 ? (
            <p className="text-stone-500 text-sm italic">
              Research in progress — no signals identified yet.
            </p>
          ) : (
            <div className="space-y-8">
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
          <p className="text-sm text-stone-600 leading-relaxed mb-6 p-4 bg-stone-50 border border-stone-200 rounded-lg">
            These signals come from studies where drugs developed for other
            conditions showed unexpected improvements in symptoms related to this
            condition. These are not direct clinical trials — they are indirect
            signals that suggest further research may be warranted.
          </p>
          {crossSignals.length === 0 ? (
            <p className="text-stone-500 text-sm italic">
              Cross-condition signal research is in progress for this condition.
            </p>
          ) : (
            <div className="space-y-8">
              {crossSignals.map((signal) => (
                <SignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
