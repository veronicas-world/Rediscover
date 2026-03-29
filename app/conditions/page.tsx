import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Condition {
  id: string;
  name: string;
  slug: string;
  prevalence_summary: string | null;
  treatment_gap_summary: string | null;
}

export const metadata = {
  title: "Conditions",
};

export default async function ConditionsPage() {
  const { data: conditions, error } = await supabase
    .from("conditions")
    .select("id, name, slug, prevalence_summary, treatment_gap_summary")
    .order("name");

  if (error) {
    console.error("Failed to fetch conditions:", error.message);
  }

  return (
    <main className="max-w-6xl mx-auto w-full px-6 py-16">
      {/* Page header */}
      <div className="mb-12">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900 mb-2">
          Conditions
        </h1>
        <p className="text-slate-500 text-base max-w-xl">
          Women&apos;s health conditions with active drug repurposing research
          and evidence-based signal profiles.
        </p>
      </div>

      {!conditions || conditions.length === 0 ? (
        <p className="text-slate-400 text-sm">No conditions yet.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {conditions.map((condition: Condition) => (
            <Link
              key={condition.id}
              href={`/conditions/${condition.slug}`}
              className="group block bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all"
            >
              <h2
                className="font-heading text-lg font-semibold mb-3 group-hover:opacity-80 transition-opacity"
                style={{ color: "var(--accent)" }}
              >
                {condition.name}
              </h2>
              {condition.prevalence_summary && (
                <p className="text-xs text-slate-400 mb-3 leading-relaxed line-clamp-2">
                  {condition.prevalence_summary}
                </p>
              )}
              {condition.treatment_gap_summary && (
                <p className="text-sm text-slate-600 leading-snug line-clamp-3">
                  {condition.treatment_gap_summary}
                </p>
              )}
              <p
                className="mt-4 text-xs font-medium"
                style={{ color: "var(--accent)" }}
              >
                View signals →
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
