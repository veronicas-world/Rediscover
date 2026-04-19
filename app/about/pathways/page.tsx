import Link from "next/link";
import BackLink from "../../components/BackLink";

export const metadata = {
  title: "Pathway Insights",
};

export default function PathwaysPage() {
  return (
    <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav className="text-xs mb-4" style={{ color: "#111" }}>
            <Link href="/" className="hover:underline">Home</Link>
            <span className="mx-2">›</span>
            <Link href="/about" className="hover:underline">About</Link>
            <span className="mx-2">›</span>
            <span style={{ color: "#4D5E4D" }}>Pathway Insights</span>
          </nav>
          <h1
            className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ color: "#1a1a1a" }}
          >
            Pathway Insights
          </h1>
          <p className="text-base" style={{ color: "#111" }}>
            Signals derived from biological pathway and target analysis, including drugs with mechanistic or genetic evidence of relevance to a condition, and adverse event patterns that reveal underlying disease biology.
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
              Pathway Insights looks for drugs with mechanistic or target level evidence of biological relevance to a condition, including drugs whose adverse effects reveal which pathways are driving the disease. The original framing of this arm was narrower: drugs that worsen conditions. The reframe is more accurate. Understanding what makes a condition worse is often a legitimate path to understanding what might make it better, because adverse effects are data about mechanism. But this arm also includes drugs with genetic and pathway level evidence of relevance that would not show up in direct clinical trials, because the research simply has not caught up yet.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              Data sources
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
              The primary source for Pathway Insights is the Open Targets Platform (platform.opentargets.org), developed by EMBL-EBI, the Wellcome Sanger Institute, and GlaxoSmithKline. Open Targets aggregates evidence across six categories: genetic associations (GWAS and rare variant data), somatic mutations, known drug target interactions, affected pathways (via Reactome), differential gene expression (via Expression Atlas), and animal model data. WHEL queries the Open Targets GraphQL API for each condition using standardized EFO and MONDO disease ontology identifiers. Additional signals in this arm come from FDA drug labeling (via Drugs@FDA at www.accessdata.fda.gov), published case reports in PubMed documenting adverse gynecological effects, and EMA assessment reports (European Medicines Agency, ema.europa.eu) which contain subgroup analyses and sex disaggregated adverse event data that rarely surfaces in journal publications.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              An example
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
              Tamoxifen is a breast cancer drug that works by blocking estrogen receptors. It is documented in case reports and retrospective studies to cause or worsen adenomyosis in some patients. This is pharmacologically informative: if blocking estrogen receptors exacerbates adenomyosis, estrogen receptor pathways are central to adenomyosis biology. That tells us what drug classes are worth investigating as treatments and why conditions that disrupt estrogen signaling more broadly may co-occur with adenomyosis. A separate example from the Open Targets data: Filgrastim, a G-CSF receptor agonist approved for neutropenia, appears in the endometriosis arm because G-CSF modulates immune tolerance and has been explored in recurrent implantation failure. The immune dysregulation hypothesis in endometriosis may involve altered myeloid cell function, a connection that would not be visible without target level pathway analysis.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              What to look for
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
              Pathway Insights signals that implicate a well characterized biological pathway (estrogen receptors, inflammatory cascades, dopamine signaling, immune tolerance) are more interpretable than purely empirical associations. The Pathway Insight field on each signal card names the specific mechanism. Signals with Open Targets evidence scores above 0.5 reflect stronger genetic or clinical association between the drug target and the condition.
            </p>
          </section>

          <div style={{ borderTop: "1px solid #E0DDD8", paddingTop: "2rem" }}>
            <BackLink href="/" label="Back to home" />
          </div>

        </div>
      </div>
    </main>
  );
}
