import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ResearchSignalsTabs, { type Signal } from "./ResearchSignalsTabs";

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

  const hasSecondaryInfo = condition.biology_summary || condition.underfunding_notes;

  return (
    <main className="max-w-4xl mx-auto w-full px-6 py-12">
      {/* Back link */}
      <Link
        href="/conditions"
        className="inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70 mb-8"
        style={{ color: "#7A8B7A" }}
      >
        ← All Conditions
      </Link>

      {/* Condition name */}
      <h1
        className="font-heading text-4xl font-bold tracking-tight mb-8 leading-tight"
        style={{ color: "#333" }}
      >
        {condition.name}
      </h1>

      {/* Two-column profile */}
      <div
        className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-10 pb-10"
        style={{ borderBottom: "1px solid #E0DDD8" }}
      >
        {/* Left: Definition */}
        {condition.description && (
          <div className="md:col-span-3">
            <p
              className="text-[10px] uppercase tracking-widest font-semibold mb-2"
              style={{ color: "#999" }}
            >
              Definition
            </p>
            <p className="text-base leading-relaxed" style={{ color: "#333" }}>
              {condition.description}
            </p>
          </div>
        )}

        {/* Right: Quick stats */}
        <div className={`${condition.description ? "md:col-span-2" : "md:col-span-5"} space-y-6`}>
          {condition.prevalence_summary && (
            <div>
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                style={{ color: "#999" }}
              >
                Prevalence
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
                {condition.prevalence_summary}
              </p>
            </div>
          )}
          {condition.treatment_gap_summary && (
            <div>
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-1.5"
                style={{ color: "#999" }}
              >
                Treatment Gap
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
                {condition.treatment_gap_summary}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Secondary info — full width */}
      {hasSecondaryInfo && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
          {condition.biology_summary && (
            <div>
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: "#999" }}
              >
                Biology
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
                {condition.biology_summary}
              </p>
            </div>
          )}
          {condition.underfunding_notes && (
            <div>
              <p
                className="text-[10px] uppercase tracking-widest font-semibold mb-2"
                style={{ color: "#999" }}
              >
                Research &amp; Funding Context
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
                {condition.underfunding_notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Repurposing Signals */}
      <div>
        <div className="mb-8">
          <h2
            className="font-heading text-2xl font-bold tracking-tight mb-1"
            style={{ color: "#333" }}
          >
            Repurposing Signals
          </h2>
          <p className="text-sm" style={{ color: "#666" }}>
            Existing drugs with published evidence supporting investigation for
            this condition.
          </p>
        </div>

        <ResearchSignalsTabs signals={(signals ?? []) as unknown as Signal[]} />
      </div>
    </main>
  );
}
