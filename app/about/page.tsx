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
                Women&apos;s health conditions are systematically underfunded relative to their prevalence and severity. Endometriosis, PMDD, vulvodynia, and adenomyosis affect hundreds of millions of people worldwide and receive a fraction of the research investment directed at conditions with comparable disease burden.
              </p>
              <p>
                Women&apos;s Health Evidence Lab (WHEL) asks a different question: what existing drugs have shown unexpected promise for conditions that aren&apos;t getting enough research attention? Drug repurposing is faster, cheaper, and lower risk than developing new drugs from scratch. For conditions with no approved treatment, a repurposed drug may be the fastest route to meaningful relief.
              </p>
            </div>
          </section>

          {/* Methodology */}
          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              How Signals Are Categorized
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E0DDD8" }}>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                  Direct Research
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                  Published studies and trials specifically targeting the condition. Includes randomized controlled trials, preclinical studies, and observational studies where a drug was investigated for its potential effects.
                </p>
              </div>
              <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E0DDD8" }}>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                  Cross-Condition Signals
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                  Drugs developed for other conditions that showed incidental benefit for related biology. These are hypothesis-generating signals, not treatment evidence. They identify compounds with plausible mechanisms and existing safety data that may warrant dedicated investigation.
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
                  Drugs observed to affect or worsen a condition. These signals reveal which biological pathways are involved and may point toward new therapeutic approaches.
                </p>
              </div>
              <div
                className="rounded-xl p-5"
                style={{ backgroundColor: "#F0F5FB", border: "1px solid #B8CEDD" }}
              >
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: "#2C3E50" }}>
                  Community Forum Reports
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#44596A" }}>
                  Patient communities on Reddit and condition specific forums have generated real world treatment knowledge for decades, filling gaps left by underfunded research. We surface recurring treatment reports from these communities as hypothesis generating signals. When multiple women independently report that a drug or supplement helped their symptoms, that pattern is worth noting even without a clinical trial to confirm it. All community signals are clearly labeled as preliminary and patient reported rather than clinically verified.
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
              All signals are sourced from peer reviewed literature and regulatory databases. Every finding includes a cited PMID or primary source reference.
            </p>
            <ul className="space-y-3">
              {[
                {
                  name: "PubMed / MEDLINE",
                  detail: "Primary source for peer reviewed biomedical literature. All PMIDs link directly to the original PubMed record.",
                },
                {
                  name: "ClinicalTrials.gov",
                  detail: "U.S. registry of clinical studies. Used to identify trial-level evidence and assess investigational status.",
                },
                {
                  name: "FDA Adverse Event Reporting System (FAERS)",
                  detail: "Postmarket adverse event reports. Used to identify pathway signals where drugs have been associated with worsening specific conditions.",
                },
                {
                  name: "FDA Drug Approvals Database",
                  detail: "Used to verify approval status and labeled indications for all compounds listed.",
                },
                {
                  name: "Reddit Community Forums",
                  detail: "Condition specific communities including r/Endo, r/endometriosis, r/PCOS, r/PMDD, r/Menopause, r/Perimenopause, and r/vulvodynia. Used exclusively for the Community Forum Reports signal category.",
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

          {/* Limitations */}
          <section>
            <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
              Limitations
            </h2>
            <div
              className="rounded-xl p-5 mb-6"
              style={{ backgroundColor: "#EEF1EE", border: "1px solid #C8D8C8" }}
            >
              <p className="text-sm font-semibold mb-1.5" style={{ color: "#1a1a1a" }}>
                For research purposes only. Not medical advice.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "#5C6B5D" }}>
                Nothing on this site is a treatment recommendation, diagnosis, or clinical guideline. Consult a qualified healthcare provider before making any medical decisions.
              </p>
            </div>
            <ul className="space-y-3 text-sm leading-relaxed" style={{ color: "#555" }}>
              {[
                [
                  "Signals are not recommendations.",
                  "A repurposing signal means published evidence suggests a drug warrants investigation. It does not mean the drug is safe or effective for that condition.",
                ],
                [
                  "Evidence strength varies.",
                  "Signals range from Phase III trial data to small case series. Strength is labeled on every signal card.",
                ],
                [
                  "No original research.",
                  "WHEL surfaces and organizes published research. It does not conduct studies or generate new data.",
                ],
                [
                  "The literature is incomplete.",
                  "Conditions with less research investment have fewer signals. Not because treatments don&apos;t exist, but because they haven&apos;t been studied.",
                ],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 shrink-0" style={{ color: "#ccc" }}>·</span>
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
                Until 1993, women were routinely excluded from clinical trials. The NIH Revitalization Act mandated their inclusion for the first time. The downstream effects persist today: dosing guidelines derived from male physiology, diagnostic criteria calibrated on male presentations, and drug safety profiles that didn&apos;t account for hormonal variability.
              </p>
              <p>
                Endometriosis affects an estimated 190 million people worldwide and takes an average of 7 to 10 years to diagnose. Vulvodynia affects 8 to 16% of women across the lifespan and has no FDA-approved treatment. PMDD was not recognized as a distinct DSM diagnosis until 2013.
              </p>
              <p>
                WHEL is a small attempt to work within these constraints. To use what already exists in the published literature to surface overlooked evidence and direct attention toward signals that deserve follow-up.
              </p>
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}
