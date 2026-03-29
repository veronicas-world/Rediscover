import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

interface Signal {
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

function SectionBlock({
  label,
  content,
}: {
  label: string;
  content: string | null;
}) {
  if (!content) return null;
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-1">
        {label}
      </h3>
      <p className="text-stone-700 text-sm leading-relaxed">{content}</p>
    </div>
  );
}

export default async function ConditionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data: condition, error: conditionError } = await supabase
    .from("conditions")
    .select("*")
    .eq("slug", slug)
    .single();

  if (conditionError || !condition) {
    notFound();
  }

  const { data: signals } = await supabase
    .from("repurposing_signals")
    .select(
      `
      id,
      signal_type,
      evidence_strength,
      summary,
      mechanism_hypothesis,
      status,
      compounds (
        name,
        generic_name,
        drug_class,
        fda_status
      ),
      sources (
        id,
        source_type,
        external_id,
        title,
        authors,
        journal,
        publication_date,
        url,
        key_finding_excerpt
      )
    `
    )
    .eq("condition_id", condition.id)
    .order("created_at");

  return (
    <main className="max-w-3xl mx-auto w-full px-6 py-16">
      <Link
        href="/conditions"
        className="text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors mb-8 inline-block"
      >
        ← Back to Conditions
      </Link>

      {/* Condition header */}
      <h1
        className="text-4xl font-bold tracking-tight mb-6"
        style={{ color: "#6b2737" }}
      >
        {condition.name}
      </h1>

      {/* Condition profile */}
      <div className="space-y-6 mb-16">
        <SectionBlock label="Overview" content={condition.description} />
        <SectionBlock
          label="Prevalence"
          content={condition.prevalence_summary}
        />
        <SectionBlock
          label="Treatment Gap"
          content={condition.treatment_gap_summary}
        />
        <SectionBlock label="Biology" content={condition.biology_summary} />
        <SectionBlock
          label="Research & Funding Context"
          content={condition.underfunding_notes}
        />
      </div>

      {/* Repurposing Signals */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-stone-900 mb-1">
          Repurposing Signals
        </h2>
        <p className="text-stone-500 text-sm mb-8">
          Existing drugs with evidence supporting investigation for this
          condition.
        </p>

        {!signals || signals.length === 0 ? (
          <p className="text-stone-500 text-sm italic">
            Research in progress — no signals identified yet.
          </p>
        ) : (
          <div className="space-y-8">
            {(signals as unknown as Signal[]).map((signal) => (
              <div
                key={signal.id}
                className="bg-white border border-stone-200 rounded-lg p-6"
              >
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
                {(signal.compounds?.drug_class ||
                  signal.compounds?.fda_status) && (
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
                        <li
                          key={source.id}
                          className="text-xs text-stone-600 leading-relaxed"
                        >
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
                            <span className="text-stone-400">
                              {" "}
                              — {source.authors}
                            </span>
                          )}
                          {source.journal && (
                            <span className="text-stone-400 italic">
                              , {source.journal}
                            </span>
                          )}
                          {source.publication_date && (
                            <span className="text-stone-400">
                              {" "}
                              ({source.publication_date.slice(0, 4)})
                            </span>
                          )}
                          {source.key_finding_excerpt && (
                            <p className="mt-1 text-stone-500 italic">
                              &ldquo;{source.key_finding_excerpt}&rdquo;
                            </p>
                          )}
                          {source.external_id &&
                            source.source_type === "pubmed" && (
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
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
