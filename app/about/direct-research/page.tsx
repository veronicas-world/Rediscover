import Link from "next/link";

export const metadata = {
  title: "Direct Research",
};

export default function DirectResearchPage() {
  return (
    <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav className="text-xs mb-4" style={{ color: "#999" }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/about" className="hover:underline">About</Link>
            <span className="mx-2">›</span>
            <span style={{ color: "#4D5E4D" }}>Direct Research</span>
          </nav>
          <h1
            className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ color: "#1a1a1a" }}
          >
            Direct Research
          </h1>
          <p className="text-base" style={{ color: "#555" }}>
            Published studies targeting these conditions directly
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="space-y-14">

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              What it is
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              Clinical trials, case reports, and peer reviewed studies where researchers specifically studied a drug&apos;s effect on the condition. This is the most straightforward evidence. Researchers set out to answer the question and published their findings.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              Data sources
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              PubMed and MEDLINE (the primary database of biomedical literature) and ClinicalTrials.gov (registry of clinical studies). We query these using condition specific search terms and surface studies where a compound showed measurable benefit.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              How signals are chosen
            </h2>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "#555" }}>
              We look for studies where a drug showed statistically significant or clinically meaningful improvement in condition specific outcomes. Evidence is rated across three levels:
            </p>
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E0DDD8" }}>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>Strong</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                  Randomized controlled trials or multiple replicated studies.
                </p>
              </div>
              <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E0DDD8" }}>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>Moderate</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                  Smaller trials or observational studies with consistent findings.
                </p>
              </div>
              <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E0DDD8" }}>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>Preliminary</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                  Case reports, pilot studies, or mechanistic evidence without clinical confirmation.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              Why it matters
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              Even within direct research, important findings are often buried in databases that patients and many clinicians never access. We surface them in one place, organized by condition.
            </p>
          </section>

          <div style={{ borderTop: "1px solid #E0DDD8", paddingTop: "2rem" }}>
            <Link
              href="/"
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "#4D5E4D" }}
            >
              ← Back to home
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
