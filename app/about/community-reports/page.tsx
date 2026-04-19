import Link from "next/link";
import BackLink from "../../components/BackLink";

export const metadata = {
  title: "Community Forum Reports",
};

export default function CommunityReportsPage() {
  return (
    <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav className="text-xs mb-4" style={{ color: "#111" }}>
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
          <p className="text-base" style={{ color: "#111" }}>
            Patient communities as a legitimate source of treatment knowledge.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="space-y-14">

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              What it is
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
              Community Forum Reports is the arm that required the most internal debate, and it is the one that needs the clearest labeling: this is community signal, not clinical evidence. It is included because ignoring it would mean discarding a meaningful and systematically underrepresented source of information about what is actually happening to patients. Women often do not report positive side effects in clinical trials unless the trial is specifically designed to capture them. If you are enrolled in a statin trial and your periods improve, that is not a primary endpoint, it is not something the researchers are looking for, and it may not end up in the published data. But you might post about it on a condition specific forum. And if enough women do that over several years, it is a signal: imprecise, uncontrolled, but real.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              Data sources
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
              WHEL pulls Community Forum Reports from Reddit using the Reddit public JSON API. The pipeline queries six condition specific subreddits: r/Endo (endometriosis), r/PCOS, r/PMDD, r/Menopause, r/adenomyosis, and r/vulvodynia. For each condition, eight treatment focused search queries are run per subreddit to identify posts discussing specific medications or interventions. The pipeline stores individual post permalinks (validated to contain /comments/ to confirm post level rather than subreddit level URLs) and groups citations by subreddit in the display. WHEL is not pulling anecdotes uncritically. It is looking for consistent patterns across a large number of posts over time, which is different from a single person&apos;s experience. Each citation links directly to the source post.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              An example
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
              Meloxicam, an NSAID, is mentioned consistently across multiple endometriosis communities as more effective for pelvic pain than standard ibuprofen. This is pharmacologically plausible: Meloxicam is a preferential COX-2 inhibitor with a different selectivity profile than ibuprofen, which is a non-selective COX inhibitor. The distinction matters because COX-2 is the isoform primarily responsible for the prostaglandin synthesis that drives endometriosis related pain. There are very few formal studies on Meloxicam specifically for endometriosis. The gap between what patients are reporting and what has been formally studied is exactly what this arm is designed to make visible.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              What to look for
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
              Community signals that align with a mechanistically plausible hypothesis are stronger candidates for follow-up than purely anecdotal patterns. A signal appearing across multiple subreddits for the same condition, or across multiple conditions, is more likely to reflect a real pharmacological effect than a single community observation.
            </p>
          </section>

          <div
            className="p-5"
            style={{ backgroundColor: "#F0F5FB", border: "1px solid #B8CEDD" }}
          >
            <p className="text-sm font-semibold mb-1.5" style={{ color: "#2C3E50" }}>
              Community reports are not clinical evidence.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#44596A" }}>
              They reflect self reported experiences and may be influenced by placebo effects, individual variation, or confirmation bias. They should be used to generate hypotheses and inform conversations with healthcare providers, not to make treatment decisions independently.
            </p>
          </div>

          <div style={{ borderTop: "1px solid #E0DDD8", paddingTop: "2rem" }}>
            <BackLink href="/" label="Back to home" />
          </div>

        </div>
      </div>
    </main>
  );
}
