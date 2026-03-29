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

function CautionSignalCard({ signal }: { signal: Signal }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm">
      {/* Compound name + warning badge */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-amber-600 text-sm" aria-hidden="true">⚠</span>
        <h3 className="text-base font-semibold font-heading text-amber-900">
          {signal.compounds?.name ?? "Unknown compound"}
        </h3>
        {signal.evidence_strength && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            {signal.evidence_strength.charAt(0).toUpperCase() +
              signal.evidence_strength.slice(1)}
          </span>
        )}
      </div>

      {/* Compound meta */}
      {(signal.compounds?.drug_class || signal.compounds?.fda_status) && (
        <div className="flex flex-wrap gap-3 mb-4 text-xs text-amber-700">
          {signal.compounds.drug_class && (
            <span className="bg-amber-100 border border-amber-200 rounded px-2 py-0.5">
              {signal.compounds.drug_class}
            </span>
          )}
          {signal.compounds.fda_status && (
            <span className="bg-amber-100 border border-amber-200 rounded px-2 py-0.5">
              {signal.compounds.fda_status}
            </span>
          )}
        </div>
      )}

      {/* Signal body */}
      <div className="space-y-4">
        {signal.summary && (
          <p className="text-sm text-amber-900 leading-relaxed">
            {signal.summary}
          </p>
        )}
        {signal.mechanism_hypothesis && (
          <div className="border-l-2 border-amber-300 pl-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 block mb-1">
              Harm Mechanism
            </span>
            <p className="text-sm text-amber-800 leading-relaxed">
              {signal.mechanism_hypothesis}
            </p>
          </div>
        )}
      </div>

      {/* Sources */}
      {signal.sources && signal.sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-amber-200">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3">
            Sources
          </p>
          <ul className="space-y-3">
            {signal.sources.map((source) => (
              <li key={source.id} className="text-xs text-amber-800 leading-relaxed">
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline underline-offset-2 hover:text-amber-900"
                  >
                    {source.title ?? source.external_id ?? source.url}
                  </a>
                ) : (
                  <span className="font-medium">
                    {source.title ?? source.external_id ?? "Source"}
                  </span>
                )}
                {source.authors && (
                  <span className="text-amber-600"> — {source.authors}</span>
                )}
                {source.journal && (
                  <span className="text-amber-600 italic">, {source.journal}</span>
                )}
                {source.publication_date && (
                  <span className="text-amber-600">
                    {" "}({source.publication_date.slice(0, 4)})
                  </span>
                )}
                {source.external_id && source.source_type === "pubmed" && (
                  <span className="ml-1 text-amber-600">
                    · PMID {source.external_id}
                  </span>
                )}
                {source.key_finding_excerpt && (
                  <p className="mt-1.5 text-amber-700 italic leading-relaxed">
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
  const activeCautionStyle = {
    color: "#b45309",
    borderBottom: "2px solid #b45309",
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
          style={activeTab === "caution" ? activeCautionStyle : inactiveStyle}
          onClick={() => setActiveTab("caution")}
        >
          Caution Signals
          {cautionSignals.length > 0 && (
            <span className="ml-1.5 text-xs bg-amber-100 text-amber-600 rounded-full px-1.5 py-0.5">
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

      {/* Caution Signals tab */}
      {activeTab === "caution" && (
        <div>
          <div className="flex gap-3 items-start p-4 bg-amber-50 border border-amber-200 rounded-lg mb-6">
            <span className="text-amber-500 text-sm mt-0.5 shrink-0">⚠</span>
            <p className="text-sm text-amber-800 leading-relaxed">
              These drugs have been associated with worsening or triggering this
              condition. Important for patients currently taking these medications
              and clinicians considering treatment options.
            </p>
          </div>
          {cautionSignals.length === 0 ? (
            <p className="text-slate-400 text-sm italic py-4">
              No caution signals have been identified for this condition yet.
            </p>
          ) : (
            <div className="space-y-6">
              {cautionSignals.map((signal) => (
                <CautionSignalCard key={signal.id} signal={signal} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
