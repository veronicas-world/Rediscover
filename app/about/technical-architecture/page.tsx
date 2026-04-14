import Link from "next/link";

export const metadata = {
 title: "Technical Architecture",
};

export default function TechnicalArchitecturePage() {
 return (
 <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
 <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <nav className="text-xs mb-4" style={{ color: "#111" }}>
 <Link href="/" className="hover:underline">Home</Link>
 <span className="mx-2">›</span>
 <Link href="/about" className="hover:underline">About</Link>
 <span className="mx-2">›</span>
 <span style={{ color: "#4D5E4D" }}>Technical Architecture</span>
 </nav>
 <h1
 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight"
 style={{ color: "#1a1a1a" }}
 >
 Technical Architecture
 </h1>
 </div>
 </div>

 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <div className="space-y-14">

 {/* Data Pipelines */}
 <section>
 <h2 className="font-heading text-xl font-bold mb-8" style={{ color: "#1a1a1a" }}>
 Data Pipelines
 </h2>
 <p className="text-sm leading-relaxed mb-6" style={{ color: "#111" }}>
 WHEL runs six automated data pipelines that populate the database on demand.
           </p>
           <div className="space-y-4">
             {[
               {
                 name: "PubMed",
                 tag: "Direct Research",
                 body: "Queries the NCBI Entrez API for published studies directly investigating each condition. Searches are condition specific and filtered for relevance. Results are parsed for study type, date, and abstract, then passed to Claude (claude-sonnet) for signal extraction and evidence strength classification.",
               },
               {
                 name: "ClinicalTrials.gov",
                 tag: "Direct Research",
                 body: "Queries the ClinicalTrials.gov REST API v2 for active, completed, and recruiting trials targeting each condition. Trial phase, status, and intervention type are captured and stored alongside the primary signal.",
               },
               {
                 name: "FDA FAERS",
                 tag: "Cross-Condition Signals",
                 body: "Queries the FDA Adverse Event Reporting System public API using a two-pass approach: first targeting gynecological and hormonal terms, then broadening to general reaction terms. Female patient reports are filtered and analyzed for signals suggesting off label benefit. URL encoding and pagination are handled to maximize coverage across all six conditions.",
               },
               {
                 name: "Open Targets Platform",
                 tag: "Pathway Insights",
                 body: "Queries the Open Targets Platform GraphQL API (platform.opentargets.org) for each condition using standardized EFO and MONDO disease ontology identifiers. Retrieves drug candidates, mechanistic associations, and biological target scores aggregated from genetic association data, known drug target interactions, Reactome pathway analysis, and differential gene expression. Results are analyzed by Claude for pathway level repurposing hypotheses. No authentication required.",
               },
               {
                 name: "EudraVigilance EVDAS",
                 tag: "Cross-Condition Signals",
                 body: "Queries the European Medicines Agency adverse event database (dap.ema.europa.eu) via the Oracle BI Analytics API. Substance codes are resolved via the public adrreports.eu substance table. Female patient reaction data is filtered and grouped by condition. Requires a free registered EMA account for session authentication.",
               },
               {
                 name: "Reddit",
                 tag: "Community Forum Reports",
                 body: "Queries condition specific subreddits (r/Endo, r/PCOS, r/PMDD, r/Menopause, r/adenomyosis, r/vulvodynia) using eight treatment focused search queries per subreddit. Individual post permalinks are stored and validated — URLs must contain /comments/ to confirm they are post level, not subreddit level. Posts are grouped by subreddit in citation display. The pipeline looks for consistent patterns across many posts, not individual anecdotes.",
               },
             ].map(({ name, tag, body }) => (
 <div
 key={name}
 className="bg-white p-5"
 style={{ border: "1px solid #E0DDD8" }}
 >
 <div className="flex items-baseline gap-3 mb-2">
 <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>{name}</p>
 <span
 className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5"
 style={{ backgroundColor: "#EEF1EE", color: "#5C6B5D" }}
 >
 {tag}
 </span>
 </div>
 <p className="text-sm leading-relaxed" style={{ color: "#111" }}>{body}</p>
 </div>
 ))}
 </div>
 </section>

 {/* Signal Classification */}
 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
 Signal Classification
 </h2>
 <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
 Each signal extracted by the pipelines is classified by evidence strength: Strong Evidence, Moderate Evidence, Preliminary Evidence, or Theoretical/Mechanistic. Classification is performed by Claude (claude-sonnet) based on study design, sample size, consistency of findings, and source type. Community Forum Reports are always labeled as community signal, not clinical evidence.
 </p>
 </section>

 {/* Database and Infrastructure */}
 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
 Database and Infrastructure
 </h2>
 <div className="space-y-4">
 {[
 {
 label: "Database",
 body: "Supabase (PostgreSQL) with Row Level Security. Core tables include conditions, compounds, repurposing_signals, and sources. Signals are deduplicated at both the pipeline level (by post ID for Reddit, by compound and condition pair for all sources) and via database constraints.",
 },
 {
 label: "Frontend",
 body: "Next.js (TypeScript) with Tailwind CSS, hosted on Vercel. Analytics via Vercel Analytics.",
 },
 {
 label: "Source deduplication",
 body: "Sources are deduplicated by URL before storage. The frontend applies additional normalization to prevent the same compound appearing multiple times in the same evidence bucket.",
 },
 ].map(({ label, body }) => (
 <div key={label} className="bg-white p-5" style={{ border: "1px solid #E0DDD8" }}>
 <p className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>{label}</p>
 <p className="text-sm leading-relaxed" style={{ color: "#111" }}>{body}</p>
 </div>
 ))}
 </div>
 </section>

 {/* Limitations */}
 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
 Limitations
 </h2>
 <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
 WHEL is a signal aggregator, not a clinical recommendation engine. Evidence strength classifications are generated by a language model and should be treated as a starting point for further investigation, not a definitive assessment. Community Forum Reports reflect patient reported patterns and are explicitly not clinical evidence. The absence of signals in the Direct Research arm for a given condition is itself data — it reflects the current state of published research, not a gap in the tool.
 </p>
 </section>

 <div style={{ borderTop: "1px solid #E0DDD8", paddingTop: "2rem" }}>
 <Link
 href="/about"
 className="text-sm font-medium transition-opacity hover:opacity-70"
 style={{ color: "#4D5E4D" }}
 >
 {"\u2190\ufe0e"} Back to About
 </Link>
 </div>

 </div>
 </div>
 </main>
 );
}
