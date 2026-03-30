import { supabase } from "@/lib/supabase";
import ConditionsList from "./ConditionsList";

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
      <div className="mb-10">
        <h1
          className="font-heading text-3xl font-bold tracking-tight mb-2"
          style={{ color: "#333" }}
        >
          Conditions
        </h1>
        <p className="text-base max-w-xl" style={{ color: "#666" }}>
          Women&apos;s health conditions with active drug repurposing research
          and evidence-based signal profiles.
        </p>
      </div>

      <ConditionsList conditions={conditions ?? []} />
    </main>
  );
}
