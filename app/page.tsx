import Link from "next/link";

const CARD_STYLE = {
  border: "1px solid #E0DDD8",
  borderRadius: "10px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
};

const METHODOLOGY = [
  {
    title: "Direct Research",
    description:
      "Published studies and trials directly testing a drug for this condition.",
    href: "/about/direct-research",
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
    href: "/about/cross-condition",
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
    href: "/about/pathways",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="3" />
        <path d="M11 2v2M11 20v2M2 11h2M20 11h2" />
        <path d="m14.5 7.5 1.5-1.5M8 14l-1.5 1.5M14.5 14.5l1.5 1.5M8 8 6.5 6.5" />
      </svg>
    ),
  },
  {
    title: "Community Forum Reports",
    description:
      "Patient communities have generated real world treatment knowledge for decades. We surface recurring treatment reports from condition-specific forums as hypothesis generating signals.",
    href: "/about/community-reports",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="section-label mb-4">Research Tool</p>
            <h1
              className="font-heading text-4xl sm:text-5xl mb-6 leading-tight"
              style={{ color: "#1a1a1a" }}
            >
              Surfacing overlooked drug signals for women&apos;s health
            </h1>
            <p
              className="text-base sm:text-lg mb-8 leading-relaxed"
              style={{ color: "#555" }}
            >
              Women&apos;s health conditions are chronically underfunded and underresearched. This tool surfaces existing drugs and compounds that published evidence suggests may be relevant to six of the most neglected conditions in women&apos;s medicine. Every signal is drawn from real data sources and linked to its original reference.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/conditions"
                className="inline-flex items-center justify-center px-6 py-3 text-white text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "#4D5E4D", borderRadius: "6px" }}
              >
                Browse Conditions
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "transparent", border: "1px solid #4D5E4D", color: "#4D5E4D", borderRadius: "6px" }}
              >
                Search Database
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Methodology ──────────────────────────────────────────────────── */}
      <section style={{ backgroundColor: "#EDEAE4", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="mb-10">
            <p className="section-label mb-3">Signal Types</p>
            <h2
              className="font-heading text-2xl sm:text-3xl"
              style={{ color: "#1a1a1a" }}
            >
              How signals are categorized
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {METHODOLOGY.map(({ title, description, href }) => (
              <Link
                key={title}
                href={href}
                className="group flex flex-col bg-white p-6 sm:p-8 transition-shadow hover:shadow-md"
                style={CARD_STYLE}
              >
                <h3 className="font-heading text-lg mb-2 group-hover:opacity-75 transition-opacity" style={{ color: "#1a1a1a" }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed mb-5" style={{ color: "#666" }}>
                  {description}
                </p>
                <p className="text-sm font-semibold mt-auto" style={{ color: "#4D5E4D" }}>
                  Learn more
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>


    </main>
  );
}
