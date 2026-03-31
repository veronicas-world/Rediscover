import Link from "next/link";
import { supabase } from "@/lib/supabase";

const METHODOLOGY = [
  {
    title: "Direct Research",
    description:
      "Published studies and trials directly testing a drug for this condition.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
  {
    title: "Cross-Condition Signals",
    description:
      "Drugs approved for other conditions that showed incidental benefit for shared biology.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
      "Drugs observed to worsen a condition, revealing which biological pathways are involved.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            <h1
              className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight"
              style={{ color: "#1a1a1a" }}
            >
              Surfacing overlooked drug signals for women&apos;s health
            </h1>
            <p
              className="text-base sm:text-lg mb-10 max-w-2xl leading-relaxed"
              style={{ color: "#555" }}
            >
              Existing drugs. Underresearched conditions. Published evidence you can verify.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/conditions"
                className="inline-flex items-center justify-center px-7 py-4 text-white text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 rounded"
                style={{ backgroundColor: "#4D5E4D" }}
              >
                Browse Conditions →
              </Link>
              <Link
                href="/conditions"
                className="inline-flex items-center justify-center px-7 py-4 text-white text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 rounded"
                style={{ backgroundColor: "#4D5E4D" }}
              >
                Search Database →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Conditions ───────────────────────────────────────────── */}
      {featuredConditions && featuredConditions.length > 0 && (
        <section style={{ backgroundColor: "#F5F3EF", borderBottom: "1px solid #E0DDD8" }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <div className="mb-10">
              <h2
                className="font-heading text-3xl sm:text-4xl font-bold mb-3"
                style={{ color: "#1a1a1a" }}
              >
                Featured Conditions
              </h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
              {featuredConditions.map((condition) => (
                <Link
                  key={condition.id}
                  href={`/conditions/${condition.slug}`}
                  className="group block bg-white rounded-lg p-6 sm:p-8 transition-shadow hover:shadow-md"
                  style={{ border: "1px solid #E0DDD8" }}
                >
                  <h3
                    className="font-heading text-2xl font-bold mb-3 group-hover:opacity-75 transition-opacity"
                    style={{ color: "#1a1a1a" }}
                  >
                    {condition.name}
                  </h3>
                  {condition.prevalence_summary && (
                    <p
                      className="text-sm mb-4 leading-relaxed"
                      style={{ color: "#666" }}
                    >
                      {condition.prevalence_summary}
                    </p>
                  )}
                  {condition.treatment_gap_summary && (
                    <p
                      className="text-sm leading-relaxed mb-6"
                      style={{ color: "#444" }}
                    >
                      {condition.treatment_gap_summary}
                    </p>
                  )}
                  <p
                    className="text-sm font-medium mt-auto"
                    style={{ color: "#4D5E4D" }}
                  >
                    View Research →
                  </p>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/conditions"
                className="text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: "#666" }}
              >
                View all conditions →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Methodology ──────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#EDEAE4", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="mb-10">
            <h2
              className="font-heading text-3xl sm:text-4xl font-bold mb-3"
              style={{ color: "#1a1a1a" }}
            >
              How signals are categorized
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {METHODOLOGY.map(({ title, description, icon }) => (
              <div
                key={title}
                className="bg-white rounded-lg p-6 sm:p-8"
                style={{ border: "1px solid #E0DDD8" }}
              >
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center mb-5"
                  style={{ backgroundColor: "#EDEAE4", color: "#4D5E4D" }}
                >
                  {icon}
                </div>
                <h3 className="font-heading text-xl font-bold mb-3" style={{ color: "#1a1a1a" }}>
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

    </main>
  );
}
