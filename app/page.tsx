import Link from "next/link";
import { supabase } from "@/lib/supabase";

const METHODOLOGY = [
  {
    title: "Direct Research",
    description:
      "Clinical trials and published studies specifically targeting the condition — including RCTs, preclinical evidence, and computational repurposing analyses.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    title: "Cross-Condition Signals",
    description:
      "Drugs approved for other conditions that showed incidental benefit for women's health conditions. Hypothesis-generating signals with established safety profiles.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 014-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 01-4 4H3" />
      </svg>
    ),
  },
  {
    title: "Pathway Insights",
    description:
      "Drugs observed to affect or worsen a condition — reframed as biological pathway signals that may point toward new therapeutic approaches.",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="3" />
        <path d="M11 2v2M11 20v2M2 11h2M20 11h2" />
        <path d="m14.5 7.5 1.5-1.5M8 14l-1.5 1.5M14.5 14.5l1.5 1.5M8 8 6.5 6.5" />
      </svg>
    ),
  },
];

export default async function Home() {
  const { data: featuredConditions } = await supabase
    .from("conditions")
    .select("id, name, slug, prevalence_summary, treatment_gap_summary")
    .order("name")
    .limit(3);

  return (
    <main className="flex-1 flex flex-col">
      {/* Hero */}
      <section style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h1
            className="font-heading text-5xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight"
            style={{ color: "#333" }}
          >
            A condition-first research tool for overlooked women&apos;s health signals
          </h1>
          <p
            className="text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
            style={{ color: "#666" }}
          >
            Rediscover Women mines published medical literature to identify
            existing, approved drugs that may hold promise for undertreated
            women&apos;s health conditions.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/conditions"
              className="px-7 py-3 rounded-md text-white text-sm font-semibold tracking-wide transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#7A8B7A" }}
            >
              Browse Conditions →
            </Link>
            <Link
              href="/conditions"
              className="px-7 py-3 rounded-md text-sm font-semibold tracking-wide transition-all hover:opacity-80"
              style={{
                backgroundColor: "#EEF1EE",
                color: "#5C6B5D",
                border: "1px solid #7A8B7A",
              }}
            >
              Search Database →
            </Link>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section style={{ backgroundColor: "#F5F3EF", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h2
            className="font-heading text-2xl font-bold text-center mb-3"
            style={{ color: "#333" }}
          >
            Methodology
          </h2>
          <p className="text-sm text-center mb-12 max-w-lg mx-auto" style={{ color: "#666" }}>
            Every condition profile organizes evidence into three distinct categories.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {METHODOLOGY.map(({ title, description, icon }) => (
              <div
                key={title}
                className="bg-white rounded-xl p-6"
                style={{ border: "1px solid #E0DDD8" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: "#EEF1EE", color: "#5C6B5D" }}
                >
                  {icon}
                </div>
                <h3 className="font-heading text-base font-bold mb-2" style={{ color: "#333" }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Conditions */}
      {featuredConditions && featuredConditions.length > 0 && (
        <section style={{ backgroundColor: "#fff" }}>
          <div className="max-w-5xl mx-auto px-6 py-20">
            <h2
              className="font-heading text-2xl font-bold mb-2"
              style={{ color: "#333" }}
            >
              Featured Conditions
            </h2>
            <p className="text-sm mb-10" style={{ color: "#666" }}>
              Start exploring research signals for these understudied conditions.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-8">
              {featuredConditions.map((condition) => (
                <Link
                  key={condition.id}
                  href={`/conditions/${condition.slug}`}
                  className="group block bg-white rounded-xl p-6 transition-all"
                  style={{ border: "1px solid #E0DDD8" }}
                >
                  <h3
                    className="font-heading text-lg font-bold mb-4 group-hover:opacity-75 transition-opacity"
                    style={{ color: "#333" }}
                  >
                    {condition.name}
                  </h3>
                  {condition.prevalence_summary && (
                    <div className="mb-3">
                      <p
                        className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                        style={{ color: "#999" }}
                      >
                        Prevalence
                      </p>
                      <p
                        className="text-sm line-clamp-2 leading-relaxed"
                        style={{ color: "#666" }}
                      >
                        {condition.prevalence_summary}
                      </p>
                    </div>
                  )}
                  <p
                    className="mt-4 text-xs font-medium"
                    style={{ color: "#7A8B7A" }}
                  >
                    View Research →
                  </p>
                </Link>
              ))}
            </div>
            <Link
              href="/conditions"
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "#7A8B7A" }}
            >
              View all conditions →
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
