import Link from "next/link";

export const metadata = {
  title: "Direct Research",
};

export default function DirectResearchPage() {
  return (
    <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav className="text-xs mb-4" style={{ color: "#111" }}>
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
          <p className="text-base" style={{ color: "#111" }}>
            Published studies and active clinical trials specifically investigating each condition.
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
              Direct Research is the most literal arm: it pulls studies and trials that were explicitly designed to investigate the condition in question. If a researcher set out to study endometriosis, or registered a clinical trial for PMDD, it belongs here. This arm is intentionally sparse for most conditions in the database, and the sparseness is itself data. Endometriosis affects up to 10% of women of reproductive age, yet the direct research arm returns a relatively small number of results, most of them recent. That is not a gap in WHEL. That is a reflection of how little targeted research exists.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              Data sources
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
              WHEL pulls Direct Research signals from two sources. PubMed (via the NCBI Entrez API) is the primary database for published biomedical literature, maintained by the National Library of Medicine. Searches are condition specific and filtered for relevance to drug or therapeutic intervention. ClinicalTrials.gov (via the ClinicalTrials.gov REST API v2) is the NIH registry of publicly and privately funded clinical studies. WHEL captures active, completed, and recruiting trials, including trial phase, intervention type, and enrollment status. Each signal is analyzed by a language model for evidence strength classification: Strong, Moderate, Preliminary, or Theoretical.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              An example
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
              Several small randomized controlled trials have examined melatonin supplementation for endometriosis related pain. These appear in the Direct Research arm because they were specifically designed to investigate endometriosis. The evidence is preliminary — small sample sizes, limited follow-up — but the signal is there, and it is the kind of signal that should be informing the next generation of trial designs. The fact that melatonin is rarely mentioned in clinical conversations about endometriosis treatment is exactly what this arm is designed to make visible.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              What to look for
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
              A small number of strong evidence signals for a given condition suggests it is genuinely understudied at the trial level. A cluster of preliminary signals may indicate an emerging research area. The evidence strength label on each card reflects study design and sample size, not just whether results were positive.
            </p>
          </section>

          <div style={{ borderTop: "1px solid #E0DDD8", paddingTop: "2rem" }}>
            <Link
              href="/"
              className="text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: "#4D5E4D" }}
            >
              {"←︎"} Back to home
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
