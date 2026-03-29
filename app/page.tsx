import Link from "next/link";
import SearchBar from "./components/SearchBar";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Pick a condition",
    description:
      "Browse conditions that are understudied, underfunded, or lack approved treatments — from endometriosis to vulvodynia.",
  },
  {
    step: "02",
    title: "Explore the signals",
    description:
      "See direct research, cross-condition findings, and safety cautions — all sourced from published, peer-reviewed literature.",
  },
  {
    step: "03",
    title: "Follow the research",
    description:
      "Every signal links to its original PubMed record. The evidence is transparent, citable, and verifiable.",
  },
];

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <h1 className="font-heading text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 mb-5 leading-tight">
            Rediscover{" "}
            <span style={{ color: "var(--accent)" }}>Women</span>
          </h1>
          <p className="text-xl text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Reexamining overlooked drug treatments for women&apos;s health.
          </p>

          <div className="flex justify-center mb-10">
            <SearchBar size="lg" />
          </div>

          <Link
            href="/conditions"
            className="inline-block px-8 py-3 rounded-md text-white text-sm font-semibold tracking-wide transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--accent)" }}
          >
            Browse Conditions
          </Link>
        </div>
      </section>

      {/* About in one line */}
      <section className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center">
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Rediscover Women mines published medical literature to identify
            existing, approved drugs that may hold promise for undertreated
            women&apos;s health conditions — making the case for repurposing
            compounds that are already proven safe.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="font-heading text-2xl font-bold text-slate-900 text-center mb-12">
            How It Works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ step, title, description }) => (
              <div key={step} className="text-center sm:text-left">
                <div
                  className="inline-block text-xs font-bold tracking-widest mb-3 px-2.5 py-1 rounded"
                  style={{
                    backgroundColor: "#e8f0fa",
                    color: "var(--accent)",
                  }}
                >
                  {step}
                </div>
                <h3 className="font-heading text-base font-semibold text-slate-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signal types explained */}
      <section className="bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <h2 className="font-heading text-2xl font-bold text-slate-900 text-center mb-3">
            Three types of signals
          </h2>
          <p className="text-sm text-slate-500 text-center mb-12 max-w-lg mx-auto">
            Every condition profile organizes evidence into three distinct
            categories.
          </p>
          <div className="grid sm:grid-cols-3 gap-5">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Direct Research
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Clinical trials and studies specifically targeting the condition,
                including RCTs and preclinical evidence.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                Cross-Condition
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Drugs developed for other conditions that showed incidental
                benefit in women&apos;s health contexts.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 p-6 shadow-sm bg-amber-50">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-2">
                ⚠ Caution Signals
              </p>
              <p className="text-sm text-amber-800 leading-relaxed">
                Drugs associated with worsening or triggering a condition —
                important safety information for patients and clinicians.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
