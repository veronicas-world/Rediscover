export const metadata = {
  title: "About",
};

export default function AboutPage() {
  return (
    <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
      {/* Page header */}
      <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <nav className="text-xs mb-4" style={{ color: "#999" }}>
            <span>Home</span>
            <span className="mx-2">›</span>
            <span style={{ color: "#4D5E4D" }}>About</span>
          </nav>
          <h1
            className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3"
            style={{ color: "#1a1a1a" }}
          >
            About
          </h1>
          <p className="text-base" style={{ color: "#555" }}>
            What this tool is, how it works, and why it exists.
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

      <div className="space-y-14">

        {/* Mission */}
        <section>
          <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
            Mission
          </h2>
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#555" }}>
            <p>
              Rediscover Women exists because women&apos;s health conditions are
              systematically underfunded relative to their prevalence and
              severity. Conditions like endometriosis, PMDD, vulvodynia, and
              adenomyosis affect hundreds of millions of people worldwide — yet
              receive a fraction of the research investment directed at conditions
              with comparable disease burden.
            </p>
            <p>
              This tool reverses the typical drug discovery question. Instead of
              asking <em>&ldquo;what does this drug treat?&rdquo;</em> it asks:{" "}
              <strong style={{ color: "#1a1a1a" }}>
                &ldquo;what existing drugs have shown unexpected promise for
                conditions that aren&apos;t getting enough research attention?&rdquo;
              </strong>
            </p>
            <p>
              Drug repurposing — finding new clinical uses for approved compounds
              — is faster, cheaper, and lower-risk than developing new drugs from
              scratch. For conditions where no approved treatment exists, a
              repurposed drug may be the fastest route to meaningful relief.
            </p>
          </div>
        </section>

        {/* Methodology */}
        <section>
          <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
            Methodology
          </h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "#555" }}>
            Signals are organized into three categories, each representing a
            different type of evidence and relationship between a drug and a
            condition.
          </p>
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E0DDD8" }}>
              <h3 className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                Direct Research
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                Published studies and clinical trials specifically targeting the
                condition — including randomized controlled trials, preclinical
                studies, computational repurposing analyses, and observational
                studies where a drug was investigated for its potential effects on
                that condition.
              </p>
            </div>
            <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E0DDD8" }}>
              <h3 className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                Cross-Condition Signals
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                Studies where drugs developed and approved for entirely different
                purposes showed incidental benefit for symptoms or biology related
                to a women&apos;s health condition. These are hypothesis-generating
                signals — not treatment evidence — but they identify compounds with
                plausible mechanisms and existing safety data that may warrant
                dedicated investigation.
              </p>
            </div>
            <div
              className="rounded-xl p-5"
              style={{ backgroundColor: "#FEFAF2", border: "1px solid #EAD9B0" }}
            >
              <h3 className="text-sm font-semibold mb-1.5" style={{ color: "#5D4B20" }}>
                Pathway Insights
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#7A6030" }}>
                Drugs observed to affect or worsen these conditions — documented
                through clinical observation, pharmacovigilance data, or mechanistic
                studies. Rather than serving solely as warnings, these signals offer
                insight into the biological pathways involved and may point toward
                new therapeutic approaches.
              </p>
            </div>
          </div>
        </section>

        {/* Data Sources */}
        <section>
          <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
            Data Sources
          </h2>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "#555" }}>
            All signals are sourced from peer-reviewed literature and regulatory
            databases. Every finding includes a cited PMID or primary source
            reference that can be independently verified.
          </p>
          <ul className="space-y-3">
            {[
              {
                name: "PubMed / MEDLINE",
                detail:
                  "The primary source for peer-reviewed biomedical literature, maintained by the National Library of Medicine. All PMIDs cited in this tool link directly to the original PubMed record.",
              },
              {
                name: "ClinicalTrials.gov",
                detail:
                  "The U.S. registry of publicly and privately funded clinical studies. Used to identify trial-level evidence and assess the investigational status of repurposing candidates.",
              },
              {
                name: "FDA Adverse Event Reporting System (FAERS)",
                detail:
                  "The FDA's pharmacovigilance database of post-market adverse event reports. Used to identify pathway signals where drugs have been associated with worsening specific conditions.",
              },
              {
                name: "FDA Drug Approvals Database",
                detail:
                  "Used to verify FDA approval status, approved indications, and labeling for all compounds listed on this site.",
              },
            ].map(({ name, detail }) => (
              <li
                key={name}
                className="bg-white rounded-xl p-5"
                style={{ border: "1px solid #E0DDD8" }}
              >
                <p className="text-sm font-semibold mb-1" style={{ color: "#1a1a1a" }}>
                  {name}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                  {detail}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Limitations & Disclaimer */}
        <section>
          <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
            Limitations &amp; Disclaimer
          </h2>
          <div
            className="rounded-xl p-5 mb-6"
            style={{ backgroundColor: "#EEF1EE", border: "1px solid #C8D8C8" }}
          >
            <p className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
              This is a research discovery tool, not medical advice.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "#5C6B5D" }}>
              Nothing on this site constitutes a treatment recommendation,
              diagnosis, or clinical guideline. Always consult a qualified
              healthcare provider before making any medical decisions.
            </p>
          </div>
          <ul className="space-y-3 text-sm leading-relaxed" style={{ color: "#555" }}>
            {[
              [
                "Signals are not recommendations.",
                "A repurposing signal means that published evidence suggests a drug warrants investigation for a condition — it does not mean the drug is safe or effective for that condition in clinical practice.",
              ],
              [
                "Evidence strength varies widely.",
                "Signals range from Phase III randomized controlled trial data (\"strong\") to computational analyses and small case series (\"preliminary\"). Evidence strength is labeled on every signal card.",
              ],
              [
                "No original research.",
                "This tool surfaces and organizes published research — it does not conduct original studies, generate new data, or provide expert clinical interpretation beyond what is cited in the primary literature.",
              ],
              [
                "The literature is incomplete.",
                "Published research itself reflects historical funding biases. Conditions with less research investment have fewer signals — not because effective treatments don't exist, but because they haven't been studied.",
              ],
            ].map(([title, body]) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 shrink-0" style={{ color: "#ccc" }}>—</span>
                <span>
                  <strong style={{ color: "#1a1a1a" }}>{title}</strong>{" "}
                  {body}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Why Women's Health */}
        <section>
          <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
            Why Women&apos;s Health?
          </h2>
          <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#555" }}>
            <p>
              The underfunding of women&apos;s health is not a recent phenomenon.
              Until 1993, women were routinely excluded from clinical trials — the
              NIH Revitalization Act that year mandated their inclusion for the
              first time. The downstream effects of decades of female exclusion
              persist in the evidence base today: dosing guidelines derived from
              male physiology, diagnostic criteria calibrated on male
              presentations, and drug safety profiles that didn&apos;t account for
              hormonal variability.
            </p>
            <p>
              Endometriosis affects an estimated 190 million people worldwide and
              takes an average of 7–10 years to diagnose. Vulvodynia affects 8–16%
              of women across the lifespan and has no FDA-approved treatment. PMDD
              affects 3–8% of women of reproductive age and was not recognized as a
              distinct DSM diagnosis until 2013.
            </p>
            <p>
              NIH funding per patient is substantially lower for conditions that
              predominantly affect women compared to conditions with equivalent
              disease burden in mixed-sex populations. A 2021 analysis estimated
              the annual U.S. economic burden of endometriosis alone at over $78
              billion — yet disease-specific federal research investment has
              remained chronically disproportionate to that scale.
            </p>
            <p>
              Rediscover Women is a small attempt to work within these constraints:
              to use what already exists in the published literature to surface
              overlooked evidence and direct attention — from patients, clinicians,
              and researchers — toward signals that deserve follow-up.
            </p>
          </div>
        </section>

      </div>
      </div>
    </main>
  );
}
