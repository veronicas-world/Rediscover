import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ResearchSignalsTabs, { type Signal } from "./ResearchSignalsTabs";

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

        <ResearchSignalsTabs signals={(signals ?? []) as unknown as Signal[]} />
      </div>
    </main>
  );
}
