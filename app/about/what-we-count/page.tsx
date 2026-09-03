import Link from "next/link";

export const metadata = {
  title: "What we count, and how | Whel",
  description:
    "Whel's counting conventions, evidence provenance vocabulary, and how the same problems are handled by Open Targets, CTD, DisGeNET, Pharos and ChEMBL.",
};

const MONO: React.CSSProperties = {
  fontFamily: "var(--font-plex-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
};

const EYEBROW: React.CSSProperties = {
  ...MONO,
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 12,
};

const H2: React.CSSProperties = {
  fontSize: "1.4rem",
  fontWeight: 500,
  lineHeight: 1.2,
  letterSpacing: "-0.01em",
  color: "var(--ink)",
  margin: "0 0 6px",
};

const KICKER: React.CSSProperties = {
  ...MONO,
  fontSize: 10,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "var(--muted)",
  marginBottom: 10,
};

const P: React.CSSProperties = {
  fontSize: "0.95rem",
  lineHeight: 1.75,
  color: "var(--ink-2)",
  maxWidth: "68ch",
  margin: "14px 0 0",
};

const LINK: React.CSSProperties = {
  color: "var(--green-mid)",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

const TD: React.CSSProperties = {
  ...MONO,
  fontSize: 12,
  padding: "9px 14px 9px 0",
  borderBottom: "1px solid var(--rule)",
  color: "var(--ink-2)",
  verticalAlign: "top",
};

const TH: React.CSSProperties = {
  ...TD,
  color: "var(--muted)",
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  borderBottom: "1px solid var(--rule-strong, var(--rule))",
};

const NUM: React.CSSProperties = { ...TD, textAlign: "right", color: "var(--ink)" };

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ borderTop: "1px solid var(--rule)", paddingTop: 34, marginTop: 40 }}>
      <div style={KICKER}>{kicker}</div>
      <h2 className="font-heading" style={H2}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderLeft: "2px solid var(--rule-strong, var(--rule))",
        paddingLeft: 16,
        margin: "20px 0 0",
        maxWidth: "68ch",
      }}
    >
      <p style={{ ...P, margin: 0, fontSize: "0.9rem", color: "var(--muted)" }}>{children}</p>
    </div>
  );
}

export default function WhatWeCountPage() {
  return (
    <main className="flex-1" style={{ backgroundColor: "var(--bg)" }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "var(--paper)", borderBottom: "1px solid var(--rule)" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <nav
            style={{
              ...MONO,
              fontSize: "11px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--muted)",
              marginBottom: 20,
            }}
          >
            <Link href="/" style={{ color: "var(--muted)" }}>Home</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <Link href="/about" style={{ color: "var(--muted)" }}>About</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>›</span>
            <span style={{ color: "var(--ink)" }}>What we count</span>
          </nav>

          <div style={{ ...EYEBROW, marginBottom: 16 }}>
            Counting conventions &middot; evidence provenance
          </div>

          <h1
            className="font-heading"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              marginBottom: 20,
              maxWidth: "34ch",
            }}
          >
            What we count, and how.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--ink-2)", maxWidth: "66ch" }}>
            Every evidence database has to decide what its unit is. Count papers and
            you understate a systematic review that aggregates two hundred trials.
            Count trials and you claim credit for appraisal you did not do. Count
            assertions and the number balloons for reasons that have nothing to do
            with how much is known. This page states which unit Whel uses, why, what
            the current numbers actually are, and how the same problem is handled by
            the databases this field already trusts. It exists so that anyone auditing
            this work can reproduce the counts rather than guess at them.
          </p>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* 1. The numbers */}
        <div style={KICKER}>01 &middot; The numbers</div>
        <h2 className="font-heading" style={H2}>
          Where the evidence comes from
        </h2>
        <p style={P}>
          Whel holds 344 source documents in total. Not all of them carry quotable
          prose: the Open Targets, AEMS and SIDER records are structured database
          rows, which matters for how they are counted and is the subject of section
          four.
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", margin: "22px 0 0" }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: "left" }}>Source</th>
              <th style={{ ...TH, textAlign: "right" }}>Documents</th>
              <th style={{ ...TH, textAlign: "left", paddingLeft: 20 }}>Form</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Reddit", 146, "patient accounts, prose"],
              ["Open Targets", 64, "structured association records"],
              ["AEMS (formerly FAERS)", 54, "adverse-event reports"],
              ["PubMed", 30, "journal articles, prose"],
              ["ClinicalTrials.gov", 30, "trial registrations, prose"],
              ["SIDER", 20, "structured label-derived records"],
            ].map(([a, b, c]) => (
              <tr key={String(a)}>
                <td style={TD}>{a}</td>
                <td style={NUM}>{b}</td>
                <td style={{ ...TD, paddingLeft: 20, color: "var(--muted)" }}>{c}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...TD, color: "var(--ink)" }}>Total</td>
              <td style={NUM}>344</td>
              <td style={{ ...TD, paddingLeft: 20 }} />
            </tr>
          </tbody>
        </table>

        <p style={P}>
          The layer that carries verbatim quotes, the one behind every claim on this
          site that shows you a sentence, is smaller and is the number we lead with:
          <strong style={{ color: "var(--ink)" }}> 295 claims drawn from 48 documents.</strong>
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", margin: "22px 0 0" }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: "left" }}>Quoted-evidence frame</th>
              <th style={{ ...TH, textAlign: "right" }}>Documents</th>
              <th style={{ ...TH, textAlign: "right" }}>Claims</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["PubMed papers", 27, 266],
              ["ClinicalTrials.gov records", 7, 15],
              ["Reddit posts", 14, 14],
            ].map(([a, b, c]) => (
              <tr key={String(a)}>
                <td style={TD}>{a}</td>
                <td style={NUM}>{b}</td>
                <td style={NUM}>{c}</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...TD, color: "var(--ink)" }}>Total</td>
              <td style={NUM}>48</td>
              <td style={NUM}>295</td>
            </tr>
          </tbody>
        </table>

        <p style={P}>
          Those 27 peer-reviewed papers break down as 17 systematic reviews,
          meta-analyses or umbrella reviews, 2 narrative reviews, and 8 primary
          studies including 2 randomised trials. Across the whole platform there are
          226 active drug-condition signals, distributed across the six conditions as
          menopause 64, PCOS 46, endometriosis 42, vulvodynia 29, PMDD 24, adenomyosis
          21.
        </p>

        {/* 2. Units */}
        <Section kicker="02 · Units" title="Records, reports, and studies are three different things">
          <p style={P}>
            The vocabulary here is not ours. It comes from{" "}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8005924/" style={LINK} target="_blank" rel="noopener noreferrer">
              PRISMA 2020
            </a>
            , which defines a <em>record</em> as a title or abstract indexed in a
            database, a <em>report</em> as a document supplying information about a
            study, and a <em>study</em> as the investigation itself. One study can
            produce several reports. The{" "}
            <a href="https://training.cochrane.org/handbook/current/chapter-04" style={LINK} target="_blank" rel="noopener noreferrer">
              Cochrane Handbook
            </a>{" "}
            devotes a section to the distinction, titled &ldquo;Studies (not reports)
            as the unit of interest&rdquo;.
          </p>
          <p style={P}>
            In that vocabulary, Whel holds 48 <em>reports</em>. Our headline count is
            reports and claims, never studies, because a claim is pinned to a passage
            in a document rather than to an investigation. Where a trial registration
            and a journal article describe the same trial, that is one study and two
            reports, and it is counted as two documents.
          </p>
        </Section>

        {/* 3. Reviews */}
        <Section kicker="03 · Depth" title="What sits behind 17 evidence syntheses">
          <p style={P}>
            Seventeen of our peer-reviewed sources are systematic reviews,
            meta-analyses or umbrella reviews, each aggregating many primary trials.
            When this database reports that menopausal hormone therapy was harmful for
            stroke across 17 trials and 37,272 women, that is one document and
            seventeen trials. The document count understates the trial evidence sitting
            behind the quote.
          </p>
          <p style={P}>
            There is an established way to report that, and an established way to get
            it wrong. Summing each review&apos;s included-study count double counts
            every trial that appears in two reviews. The{" "}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC9361065/" style={LINK} target="_blank" rel="noopener noreferrer">
              PRIOR statement
            </a>{" "}
            for overviews of reviews makes describing that overlap a checklist
            requirement, and the standard metric is the corrected covered area from{" "}
            <a href="https://pubmed.ncbi.nlm.nih.gov/24581293/" style={LINK} target="_blank" rel="noopener noreferrer">
              Pieper et al. 2014
            </a>
            , CCA = (N &minus; r) / ((r &times; c) &minus; r), where N is total
            appearances, r is unique primary studies and c is the number of reviews.
          </p>
          <Callout>
            We do not currently publish an underlying-trial count. Producing one
            honestly means extracting the included-study list from all 17 reviews,
            deduplicating, and computing overlap per condition rather than pooled,
            since reviews of metformin in PCOS and of gabapentin in vulvodynia cannot
            overlap and pooling them would falsely read as an independent evidence
            base. Until that work is done, the number we report is documents. We quote
            the reviews. We have not appraised the trials inside them, and we do not
            claim to have.
          </Callout>
        </Section>

        {/* 4. Two kinds of evidence */}
        <Section kicker="04 · Provenance" title="Quoted evidence and structured associations are different kinds, not different grades">
          <p style={P}>
            Of the 226 active signals, 139 are backed by a verbatim quote with
            character offsets and an entailment check confirming the passage supports
            the claim. The other 87 rest on structured records from Open Targets, SIDER
            and AEMS, with no quotable sentence behind them.
          </p>
          <p style={P}>
            It would be easy to read that as 139 good ones and 87 weak ones. That
            reading is wrong, and the field says so.{" "}
            <a href="https://platform-docs.opentargets.org/associations" style={LINK} target="_blank" rel="noopener noreferrer">
              Open Targets weights text-mined literature at 0.2
            </a>
            , the lowest weight in its scoring model, while curated structured sources
            such as ClinVar, Reactome and its clinical-precedence data are weighted
            1.0. A sentence in an abstract is cheap to produce. A curated database
            record is not.
          </p>
          <p style={P}>
            Structured evidence also has a formal name. The Evidence and Conclusions
            Ontology defines{" "}
            <a href="https://www.evidenceontology.org/term/ECO:0007636/" style={LINK} target="_blank" rel="noopener noreferrer">
              ECO:0007636, &ldquo;curator inference from database&rdquo;
            </a>
            , as a first-class evidence class: inference from information located in a
            queryable resource. The{" "}
            <a href="https://geneontology.org/docs/guide-go-evidence-codes/" style={LINK} target="_blank" rel="noopener noreferrer">
              Gene Ontology
            </a>{" "}
            has carried the same idea for twenty-five years in its IEA code, inferred
            from electronic annotation, which is the single largest class of annotation
            in GO. Its description of such evidence is the phrasing we have adopted:
            it cannot generally be traced to an experimental source.
          </p>
          <p style={P}>
            This matters most for exactly the conditions Whel covers. Open Targets
            states the problem plainly in its own documentation: under-studied diseases
            are unlikely to produce high-scoring targets because the evidence does not
            exist yet, and in such diseases a relatively low-scoring target may still be
            the most interesting lead available. Endometriosis, PCOS, PMDD,
            adenomyosis, vulvodynia and menopause are under-researched and underfunded.
            Discarding the signals that only exist in structured data would remove
            precisely the candidates nobody is looking at.
          </p>
        </Section>

        {/* 5. How others count */}
        <Section kicker="05 · Comparison" title="How other databases count and label the same things">
          <p style={P}>
            Almost none of the major resources lead with a document count. Their
            headline units are associations, evidence items or entity pairs, and the
            ones that do publish a document count report it separately from their
            inferred content rather than blending the two.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", margin: "22px 0 0" }}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: "left" }}>Resource</th>
                <th style={{ ...TH, textAlign: "left" }}>Headline unit</th>
                <th style={{ ...TH, textAlign: "left" }}>Provenance vocabulary</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={TD}>
                  <a href="https://platform-docs.opentargets.org/evidence" style={LINK} target="_blank" rel="noopener noreferrer">
                    Open Targets
                  </a>
                </td>
                <td style={TD}>evidence strings, associations</td>
                <td style={{ ...TD, color: "var(--muted)" }}>
                  data type per source; literature weighted 0.2, curated 1.0; missing
                  types render as absent, never as a penalty
                </td>
              </tr>
              <tr>
                <td style={TD}>
                  <a href="https://ctdbase.org/help/geneDiseaseDetailHelp.jsp" style={LINK} target="_blank" rel="noopener noreferrer">
                    CTD
                  </a>
                </td>
                <td style={TD}>direct interactions, inferences</td>
                <td style={{ ...TD, color: "var(--muted)" }}>
                  curated vs inferred, kept as separate totals; inferred associations
                  display the bridging chemical that produced them
                </td>
              </tr>
              <tr>
                <td style={TD}>
                  <a href="https://academic.oup.com/nar/article/48/D1/D845/5611674" style={LINK} target="_blank" rel="noopener noreferrer">
                    DisGeNET
                  </a>
                </td>
                <td style={TD}>gene-disease associations</td>
                <td style={{ ...TD, color: "var(--muted)" }}>
                  curated subset browsable separately; supporting PMIDs and a quoted
                  text excerpt shipped with each association
                </td>
              </tr>
              <tr>
                <td style={TD}>
                  <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7778974/" style={LINK} target="_blank" rel="noopener noreferrer">
                    Pharos / TCRD
                  </a>
                </td>
                <td style={TD}>targets by development level</td>
                <td style={{ ...TD, color: "var(--muted)" }}>
                  Tclin / Tchem / Tbio / Tdark, a knowledge-maturity axis. Tdark means
                  nobody has looked, not that the target is uninteresting
                </td>
              </tr>
              <tr>
                <td style={TD}>
                  <a href="https://chembl.gitbook.io/chembl-interface-documentation/frequently-asked-questions/chembl-data-questions" style={LINK} target="_blank" rel="noopener noreferrer">
                    ChEMBL
                  </a>
                </td>
                <td style={TD}>activities, assays, compounds</td>
                <td style={{ ...TD, color: "var(--muted)" }}>
                  target-assignment confidence 0 to 9, a curation-specificity score
                  rather than a claim about biology
                </td>
              </tr>
            </tbody>
          </table>
          <p style={P}>
            The common pattern is layered, labelled counts. Curated and inferred are
            reported separately and never merged into one headline. That is the
            convention this page follows.
          </p>
        </Section>

        {/* 6. Adverse-event data */}
        <Section kicker="06 · Reported signals" title="Adverse-event data is hypothesis-generating, and we say so">
          <p style={P}>
            Part of the structured layer comes from adverse-event reporting, on the
            repurposing logic that an unexpected beneficial effect showing up as a
            reported side effect is a lead worth following. Pharmacovigilance has a
            precise vocabulary for this, and we use it. A disproportionality result is
            a <em>signal of disproportionate reporting</em>, never a risk.
          </p>
          <p style={P}>
            The{" "}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11116242/" style={LINK} target="_blank" rel="noopener noreferrer">
              READUS-PV
            </a>{" "}
            reporting guideline requires stating that such analyses are
            hypothesis-generating. The{" "}
            <a href="https://www.fda.gov/drugs/fda-adverse-event-monitoring-system-aems/fda-adverse-event-monitoring-system-aems-public-dashboard" style={LINK} target="_blank" rel="noopener noreferrer">
              FDA
            </a>{" "}
            states that the existence of a report does not establish causation, that
            information in reports is unverified, and that rates of occurrence cannot
            be established from them. Known biases include confounding by indication,
            the Weber effect skewing toward newly marketed drugs, and notoriety bias
            following media attention, all catalogued by{" "}
            <a href="https://www.frontiersin.org/journals/drug-safety-and-regulation/articles/10.3389/fdsfr.2023.1323057/full" style={LINK} target="_blank" rel="noopener noreferrer">
              Fusaroli et al. 2023
            </a>
            .
          </p>
          <p style={P}>
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4702794/" style={LINK} target="_blank" rel="noopener noreferrer">
              SIDER
            </a>{" "}
            is a different case and a stronger one: its core content is drawn from
            approved drug labels, which are regulatory artefacts reflecting phase III
            monitoring, not spontaneous reports.
          </p>
        </Section>

        {/* 7. Calibration */}
        <Section kicker="07 · Calibration" title="Whether 27 papers is a lot or a little">
          <p style={P}>
            It is reasonable to ask whether a corpus this size is serious. The honest
            answer is that it is early-stage, and that the comparison most people
            reach for is misleading.
          </p>
          <p style={P}>
            The median Cochrane review contains{" "}
            <a href="https://pubmed.ncbi.nlm.nih.gov/12602082/" style={LINK} target="_blank" rel="noopener noreferrer">
              six trials
            </a>
            . The median meta-analysis inside one contains{" "}
            <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3247075/" style={LINK} target="_blank" rel="noopener noreferrer">
              three studies
            </a>
            , and the authors of that analysis concluded that the number of studies
            eligible for meta-analysis is typically very small across all medical
            areas. Twenty-seven papers spread across six conditions is roughly the
            reference base of one thorough single-question systematic review. In a
            field where the questions are well funded that would be thin. In
            endometriosis, vulvodynia and PMDD it is closer to what exists.
          </p>
          <p style={P}>
            We would rather state that plainly than obscure it. The corpus grows by
            running more retrieval, and nothing in the architecture caps it at this
            size.
          </p>
        </Section>

        {/* 8. What we do not claim */}
        <Section kicker="08 · Limits" title="What this page does not claim">
          <ul style={{ ...P, paddingLeft: 20, listStyle: "disc" }}>
            <li style={{ margin: "0 0 10px" }}>
              That we have appraised the primary trials inside the reviews we quote. We
              quote the reviews.
            </li>
            <li style={{ margin: "0 0 10px" }}>
              That a structured association is equivalent to a read and verified
              sentence. It is a different kind of evidence, and which kind is recorded
              per signal.
            </li>
            <li style={{ margin: "0 0 10px" }}>
              That an adverse-event signal is a measured effect. It is a reporting
              pattern.
            </li>
            <li style={{ margin: "0 0 10px" }}>
              That 48 documents constitutes coverage of these six conditions. It does
              not, and the number is published here so that nobody has to infer it.
            </li>
          </ul>
        </Section>

        {/* 9. Reproducibility */}
        <Section kicker="09 · Audit" title="Reproducing these counts">
          <p style={P}>
            The figures on this page were transcribed from a database run completed
            in August 2026. They are not re-derived on each page load. Each is
            defined by a specific filter so that an outside reviewer can recompute
            it rather than take it on trust, but the counts shown here are a
            dated snapshot, not a live query.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", margin: "22px 0 0" }}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: "left" }}>Figure</th>
                <th style={{ ...TH, textAlign: "left" }}>Definition</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["344 documents", "every row in the documents table"],
                [
                  "295 claims",
                  "claims behind an active signal, model_name = claude-sonnet-4-6, provenance_verified = true",
                ],
                ["48 documents", "distinct document_id across those 295 claims"],
                ["226 signals", "substrate_signals where status = active"],
                [
                  "139 quoted-backed",
                  "active signals with at least one claim in the frame above",
                ],
                [
                  "87 structured-only",
                  "active signals whose only claims are pathway-rendered readouts",
                ],
              ].map(([a, b]) => (
                <tr key={String(a)}>
                  <td style={{ ...TD, color: "var(--ink)", whiteSpace: "nowrap" }}>{a}</td>
                  <td style={{ ...TD, color: "var(--muted)" }}>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={P}>
            Claims generated by rendering a structured record into a sentence are
            excluded from the quoted-evidence frame throughout. Checking such a
            sentence against the record it was generated from proves nothing, so those
            rows are never counted as quoted evidence and never enter our entailment
            figures.
          </p>
          <Callout>
            If you are conducting an external review of this database and a count here
            does not reconcile with what you find, that is a finding and we want it.
            The definitions above are the ones we used.
          </Callout>
        </Section>

        {/* footer nav */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            borderTop: "1px solid var(--rule)",
            marginTop: 44,
            paddingTop: 24,
          }}
        >
          <Link
            href="/about/technical-architecture"
            style={{
              ...MONO,
              fontSize: "12px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--muted)",
              textDecoration: "none",
            }}
            className="transition-opacity hover:opacity-90"
          >
            ← Technical architecture
          </Link>
          <Link
            href="/about/external-references"
            style={{
              ...MONO,
              fontSize: "12px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--ink)",
              padding: "10px 4px",
              borderBottom: "1px solid var(--ink)",
              textDecoration: "none",
            }}
          >
            External references
          </Link>
        </div>
      </div>
    </main>
  );
}
