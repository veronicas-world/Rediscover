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
    <div className="border-l-2 border-slate-200 pl-4">
      <h3
        className="text-xs font-semibold uppercase tracking-widest mb-2"
        style={{ color: "var(--accent)" }}
      >
        {label}
      </h3>
      <p className="text-slate-700 text-sm leading-relaxed">{content}</p>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await supabase
    .from("conditions")
    .select("name")
    .eq("slug", slug)
    .single();
  return { title: data?.name ?? "Condition" };
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
    <main className="max-w-3xl mx-auto w-full px-6 py-12">
      {/* Back link */}
      <Link
        href="/conditions"
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors mb-8"
      >
        ← All Conditions
      </Link>

      {/* Condition header */}
      <div className="mb-10 pb-8 border-b border-slate-200">
        <h1
          className="font-heading text-4xl font-bold tracking-tight mb-3 leading-tight"
          style={{ color: "var(--accent-dark, #0d3d7a)" }}
        >
          {condition.name}
        </h1>
        {condition.description && (
          <p className="text-slate-600 text-base leading-relaxed">
            {condition.description}
          </p>
        )}
      </div>

      {/* Condition profile */}
      <div className="space-y-7 mb-16">
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
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900 mb-1">
            Repurposing Signals
          </h2>
          <p className="text-slate-500 text-sm">
            Existing drugs with published evidence supporting investigation for
            this condition.
          </p>
        </div>

        <ResearchSignalsTabs signals={(signals ?? []) as unknown as Signal[]} />
      </div>
    </main>
  );
}
