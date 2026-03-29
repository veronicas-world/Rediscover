import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Condition {
  id: string;
  name: string;
  slug: string;
  prevalence_summary: string | null;
  treatment_gap_summary: string | null;
}

export default async function ConditionsPage() {
  const { data: conditions, error } = await supabase
    .from("conditions")
    .select("id, name, slug, prevalence_summary, treatment_gap_summary")
    .order("name");

  if (error) {
    console.error("Failed to fetch conditions:", error.message);
  }

  return (
    <main className="max-w-5xl mx-auto w-full px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-stone-900 mb-2">
          Conditions
        </h1>
        <p className="text-stone-500 text-base">
          Women&apos;s health conditions with active drug repurposing research.
        </p>
      </div>

      {!conditions || conditions.length === 0 ? (
        <p className="text-stone-500 text-sm">No conditions yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {conditions.map((condition: Condition) => (
            <Link
              key={condition.id}
              href={`/conditions/${condition.slug}`}
              className="block bg-white border border-stone-200 rounded-lg p-6 hover:border-stone-400 hover:shadow-sm transition-all"
            >
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: "#6b2737" }}
              >
                {condition.name}
              </h2>
              {condition.prevalence_summary && (
                <p className="text-xs text-stone-500 mb-3 leading-relaxed">
                  {condition.prevalence_summary}
                </p>
              )}
              {condition.treatment_gap_summary && (
                <p className="text-sm text-stone-700 leading-snug line-clamp-2">
                  {condition.treatment_gap_summary}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
