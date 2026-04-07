import Link from "next/link";

export const metadata = {
  title: "Community Forum Reports",
};

export default function CommunityReportsPage() {
  return (
    <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav className="text-xs mb-4" style={{ color: "#999" }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/about" className="hover:underline">About</Link>
            <span className="mx-2">›</span>
            <span style={{ color: "#4D5E4D" }}>Community Forum Reports</span>
          </nav>
          <h1
            className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ color: "#1a1a1a" }}
          >
            Community Forum Reports
          </h1>
          <p className="text-base" style={{ color: "#555" }}>
            Patient communities as a legitimate source of treatment knowledge
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
              Patient communities on Reddit and other forums have been sharing treatment knowledge for years, filling gaps left by underfunded research. This tab surfaces recurring treatment reports from condition-specific communities. When multiple women independently report that a drug or supplement helped their symptoms, that pattern is worth noting even without a clinical trial to confirm it.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              Data sources
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              Reddit communities including r/Endo, r/PCOS, r/PMDD, r/Menopause, r/Perimenopause, r/vulvodynia, r/PelvicFloor, and r/TwoXChromosomes. We surface posts where women discuss specific treatments, filter for recurring mentions across multiple independent posts, and use AI to identify patterns across the community.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              How signals are chosen
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              We only include treatments mentioned by 2 or more people in the same community. A single report is anecdotal. Recurring independent reports across a patient community suggest a pattern worth investigating. All community signals are rated preliminary and clearly labeled as patient reported rather than clinically verified.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              Why it matters
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
              Women have always helped each other navigate undertreated conditions because the medical system has not done so. These communities represent years of real world experimentation and observation. Surfacing that knowledge in a structured way treats patient experience as a legitimate data source, which it is.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              Important limitations
            </h2>
            <div
              className="rounded-xl p-5 mb-6"
              style={{ backgroundColor: "#F0F5FB", border: "1px solid #B8CEDD" }}
            >
              <p className="text-sm font-semibold mb-1.5" style={{ color: "#2C3E50" }}>
                Community reports are not clinical evidence.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#44596A" }}>
                They reflect self reported experiences and may be influenced by placebo effects, individual variation, or confirmation bias. They should be used to generate hypotheses and inform conversations with healthcare providers, not to make treatment decisions independently.
              </p>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed" style={{ color: "#555" }}>
              {[
                [
                  "Not a substitute for medical advice.",
                  "Nothing in this section should replace a conversation with a qualified healthcare provider about your specific situation.",
                ],
                [
                  "Self-selection bias is real.",
                  "People who post about treatments are more likely to have had notable experiences, positive or negative. Silent majority effects mean treatments that work quietly may be underrepresented.",
                ],
                [
                  "Dosing and context are missing.",
                  "Forum posts rarely include complete information about dose, duration, other medications, or individual health history. The same treatment may work very differently for different people.",
                ],
                [
                  "These signals evolve.",
                  "Community reports are updated periodically as we rerun the pipeline. Signal counts and summaries may change as more data is collected.",
                ],
              ].map(([title, body]) => (
                <li key={title as string} className="flex gap-3">
                  <span className="mt-0.5 shrink-0" style={{ color: "#9DBAD4" }}>·</span>
                  <span>
                    <strong style={{ color: "#1a1a1a" }}>{title}</strong>{" "}
                    {body}
                  </span>
                </li>
              ))}
            </ul>
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
