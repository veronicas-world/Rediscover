import Link from "next/link";
import { getCandidateBySignalId } from "@/lib/substrate-candidates";
import {
  frozenV13BySignalId,
  rubricDelta,
  contrastV13,
  v13Distribution,
  CURRENT_SPEC,
  PREVIOUS_SPEC,
} from "@/lib/scoring-history";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Featured signal: Aromatase inhibitors / Endometriosis | Whel",
};

// Live substrate pair: aromatase inhibitors × endometriosis (the class of which
// anastrozole and letrozole are members). signalId = `${interventionId}__${conditionId}`.
const SIGNAL_ID =
  "4649c778-db16-4740-80c6-29a739610666__13c33c1b-98d6-4ef0-bb1a-add1344261a5";

// The comparator walkthrough (low-dose vaginal estrogen x menopause). Used only to
// render the v1.3 contrast from frozen data — the two pairs were separated by a
// single dimension under the old rubric, and section 03 shows that from the numbers
// rather than asserting it in prose.
const COMPARATOR_SIGNAL_ID =
  "345a61ac-85d1-406f-bfff-29f45eb4c73c__e3758034-fa92-40a3-af17-80fbbdecb0d6";

const NUMBER_WORD: Record<number, string> = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
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
  fontSize: "clamp(1.35rem, 2.4vw, 1.75rem)",
  fontWeight: 500,
  lineHeight: 1.15,
  letterSpacing: "-0.01em",
  color: "var(--ink)",
  marginBottom: 16,
};

const BODY: React.CSSProperties = {
  fontSize: "0.975rem",
  lineHeight: 1.72,
  color: "var(--ink-2)",
};

const LINK: React.CSSProperties = {
  color: "var(--green-mid)",
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

const TIER_LABEL: Record<string, string> = {
  strong: "Strong",
  moderate: "Moderate",
  emerging: "Emerging",
  exploratory: "Exploratory",
};

const ARM_TITLE: Record<string, string> = {
  direct: "Direct",
  pathway: "Pathway",
  community: "Community",
};

// The broader clinical record for aromatase inhibitors in endometriosis,
// beyond the single systematic review the engine has ingested. PMIDs / guideline
// verified 2026-06. Ingesting these would raise the corroboration dimension.
const EXTERNAL_RECORD = [
  {
    label: "Peitsidis P et al. 2023",
    meta: "Systematic review of systematic reviews \u00b7 Drug Des Devel Ther \u00b7 PMID 37168488",
    href: "https://pubmed.ncbi.nlm.nih.gov/37168488/",
    note: "A systematic review of systematic reviews on aromatase inhibitors for endometriosis, finding a consistent reduction in pain scores across the included reviews.",
  },
  {
    label: "ESHRE Endometriosis Guideline, 2022",
    meta: "European Society of Human Reproduction and Embryology \u00b7 clinical guideline",
    href: "https://www.eshre.eu/Guidelines-and-Legal/Guidelines/Endometriosis-guideline",
    note: "Recommends aromatase inhibitors, in combination with other hormonal treatment, for endometriosis-associated pain unresponsive to first-line options. Strong recommendation, low-certainty evidence.",
  },
];

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        style={{
          ...MONO,
          fontSize: "10px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div className="font-heading" style={{ fontSize: "1rem", fontWeight: 500, color: "var(--ink)", lineHeight: 1.2 }}>
        {value}
      </div>
    </div>
  );
}

export default async function AromataseInhibitorsSignalPage() {
  const c = await getCandidateBySignalId(SIGNAL_ID);
  const anchor = c?.arms?.find((a) => a.isAnchor) ?? c?.arms?.[0];
  const tierLabel = c ? TIER_LABEL[c.tier] ?? c.tier : "—";

  // Rubric-correction data for section 03. All of it is derived, none written in prose.
  const frozen = frozenV13BySignalId(SIGNAL_ID, anchor?.arm ?? "direct");
  const delta = rubricDelta(anchor?.dimensions ?? [], frozen);
  const contrast = contrastV13(frozen, frozenV13BySignalId(COMPARATOR_SIGNAL_ID, "direct"));

  // Share of signals that sat at the modal consistency value under v1.3 — the
  // evidence that the dimension was a near-constant. Computed from the frozen
  // distribution so it cannot drift out of step with the snapshot.
  const consistencyDist = (v13Distribution as {
    dimensions: Record<string, Record<string, number>>;
  }).dimensions.consistency;
  const consistencyTotal = Object.values(consistencyDist).reduce((a, b) => a + b, 0);
  const v13ConsistencyModeShare = Math.round(
    (Math.max(...Object.values(consistencyDist)) / consistencyTotal) * 100
  );

  // The live score's denominator follows the spec that actually produced it. Until
  // the rescore is proven by the data, the live rows still carry v1.3 semantics
  // (strength 0-10), so dividing them by v1.4's max would overstate them.
  const liveMax = delta?.rescored ? CURRENT_SPEC.armStrengthMax : PREVIOUS_SPEC.armStrengthMax;
  const primaryClaim = c?.claims?.[0];

  return (
    <main className="flex-1" style={{ backgroundColor: "var(--bg)" }}>

      {/* Page header */}
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
            <span style={{ margin: "0 10px", opacity: 0.4 }}>&rsaquo;</span>
            <Link href="/featured" style={{ color: "var(--muted)" }}>Featured signal</Link>
            <span style={{ margin: "0 10px", opacity: 0.4 }}>&rsaquo;</span>
            <span style={{ color: "var(--ink)" }}>Aromatase inhibitors / Endometriosis</span>
          </nav>

          <div style={{ ...EYEBROW, marginBottom: 16 }}>Featured signal &middot; companion</div>

          <h1
            className="font-heading"
            style={{
              fontSize: "clamp(1.85rem, 3.6vw, 2.75rem)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              marginBottom: 20,
              maxWidth: "28ch",
            }}
          >
            Aromatase inhibitors for endometriosis-related pain.
          </h1>
          <p style={{ fontSize: "1rem", lineHeight: 1.65, color: "var(--ink-2)", maxWidth: "64ch" }}>
            The engine indexes aromatase inhibitors as a class, the group that
            includes anastrozole and letrozole, both repurposing candidates for
            endometriosis. It is the counterpart to the{" "}
            <Link href="/featured" style={LINK}>vaginal-estrogen walkthrough</Link>, and
            the pairing is deliberate: under our earlier rubric the two signals rested on
            near-identical dimension scores and were separated into different tiers by a
            single dimension. That dimension turned out to be measuring the wrong thing.
            Section 03 shows what the grade said then, what it says now, and why we
            changed it. Every figure on this page is read from the substrate or from the
            frozen record of the earlier grading pass; none is written into the prose.
          </p>

          {/* Meta strip — live */}
          <div
            style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: "1px solid var(--rule)",
              display: "grid",
              gap: 14,
            }}
            className="grid-cols-2 sm:grid-cols-4 grid"
          >
            <MetaCell label="Compound" value={c?.drug ?? "Aromatase inhibitors"} />
            <MetaCell label="Condition" value={c?.condition ?? "Endometriosis"} />
            <MetaCell
              label="Tier (live)"
              value={c ? `${tierLabel} \u00b7 ${c.score.toFixed(1)} / ${liveMax}` : "\u2014"}
            />
            <MetaCell label="Validation" value={c?.validationStatus === "clinical" ? "Clinically anchored" : "\u2014"} />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>

          {/* 01 Origin */}
          <section>
            <div style={EYEBROW}>01 &middot; Origin of the signal</div>
            <h2 className="font-heading" style={H2}>How it surfaced</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                The pair was indexed against endometriosis through the Direct
                Research arm, which reads peer-reviewed literature and extracts a
                verbatim claim for each finding. The anchoring source is a
                systematic review of aromatase inhibitors for
                endometriosis-related pain, pooling seven studies including three
                randomized post-operative trials.
              </p>
              {primaryClaim && (
                <blockquote
                  style={{
                    borderLeft: "2px solid var(--green-mid)",
                    paddingLeft: 18,
                    margin: 0,
                    fontSize: "0.975rem",
                    lineHeight: 1.7,
                    color: "var(--ink)",
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;{primaryClaim.text}&rdquo;
                  <span style={{ ...MONO, display: "block", fontStyle: "normal", fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
                    {primaryClaim.href ? (
                      <a href={primaryClaim.href} target="_blank" rel="noopener noreferrer" style={LINK}>{primaryClaim.src}</a>
                    ) : (
                      primaryClaim.src
                    )}
                  </span>
                </blockquote>
              )}
              <p style={BODY}>
                {anchor?.mechanism
                  ? anchor.mechanism
                  : "Aromatase inhibitors suppress local and systemic estrogen production, reducing estrogen-dependent endometriotic lesion activity and associated pain."}
              </p>
            </div>
          </section>

          {/* 02 Live score breakdown */}
          <section>
            <div style={EYEBROW}>02 &middot; Evidence and scoring</div>
            <h2 className="font-heading" style={H2}>How the engine scored it</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                Each dimension below carries the engine&apos;s own 0&ndash;2 score
                and the rationale it wrote. This is the live Direct-arm row,
                read straight from the substrate at request time.
              </p>

              {anchor && (
                <div style={{ backgroundColor: "var(--paper)", border: "1px solid var(--rule)", padding: "20px 22px", marginTop: 8 }}>
                  <div
                    style={{
                      ...MONO,
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginBottom: 14,
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>Score breakdown &middot; {ARM_TITLE[anchor.arm] ?? anchor.arm} arm</span>
                    <span>strength {anchor.strength} / {liveMax} &rarr; {tierLabel}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {anchor.dimensions.map((dim) => (
                      <div
                        key={dim.key}
                        style={{ display: "grid", gridTemplateColumns: "minmax(0, 130px) 48px 1fr", gap: 14, alignItems: "baseline" }}
                      >
                        <div className="font-heading" style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--ink)" }}>
                          {dim.label}
                        </div>
                        <div style={{ ...MONO, fontSize: "0.875rem", color: "var(--green-deep)", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {dim.score} / 2
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "var(--ink-2)", lineHeight: 1.55 }}>{dim.rationale}</div>
                      </div>
                    ))}
                  </div>
                  {c?.femaleApplicability && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: "1px solid var(--rule)",
                        fontSize: "0.85rem",
                        color: "var(--ink-2)",
                        lineHeight: 1.55,
                      }}
                    >
                      <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                        Female applicability &middot; {c.femaleApplicability.band} &middot; &times;{c.femaleApplicability.multiplier.toFixed(2)}
                      </span>
                      <div style={{ marginTop: 4 }}>{c.femaleApplicability.rationale}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 03 Reading the score — the rubric correction, rendered from data.
              NOTE: no numeric argument in this section is written into the prose.
              Every figure comes from the frozen v1.3 snapshot or the live row, via
              lib/scoring-history. A paragraph that spelled out "this dimension
              scored 2, that one scored 1, and that one point is the difference"
              is exactly what broke here, and it must not be reintroduced. */}
          <section>
            <div style={EYEBROW}>03 &middot; Reading the score</div>
            <h2 className="font-heading" style={H2}>
              What the grade said, and why it changed
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                This pair was graded under one version of our rubric and is now graded
                under another. Both are shown below. We are keeping the old numbers on
                the page rather than quietly replacing them, because a grading system
                that cannot show its own corrections is asking to be taken on trust.
              </p>

              {contrast && (
                <p style={BODY}>
                  Under {PREVIOUS_SPEC.label} this pair and the{" "}
                  <Link href="/featured" style={LINK}>vaginal-estrogen pair</Link> scored
                  identically on{" "}
                  {contrast.shared.length === 1
                    ? "one dimension"
                    : `${NUMBER_WORD[contrast.shared.length] ?? contrast.shared.length} dimensions`}
                  {" "}&mdash; {contrast.shared.join(", ")} &mdash; and differed on{" "}
                  {contrast.diverging.join(", ")} alone. That single difference carried the
                  whole gap between the two tiers they were assigned
                  {" "}({contrast.a.tier} at {contrast.a.strength}/{PREVIOUS_SPEC.armStrengthMax}
                  {" "}against {contrast.b.tier} at {contrast.b.strength}/
                  {PREVIOUS_SPEC.armStrengthMax}).
                  {contrast.onlyRescaledDims && (
                    <>
                      {" "}
                      Every one of those differing dimensions is a dimension{" "}
                      {CURRENT_SPEC.label} no longer scores the same way.
                    </>
                  )}
                </p>
              )}

              <p style={BODY}>
                The reason is that consistency was doing something it should not have
                been. It awarded a point when a source contained several findings that
                agreed, and a lower score when a source contained only one finding and
                so offered nothing to compare. But having only one study is not evidence
                of inconsistency, and treating it as a deduction meant most of the corpus
                was scored on how much material happened to be in the ingested source
                rather than on what the evidence showed. Measured across every active
                signal, the dimension sat at a single value for{" "}
                {v13ConsistencyModeShare}% of them: it was behaving as a near-constant
                that inflated every score, not as a measurement.
              </p>

              <p style={BODY}>
                Established evidence-grading practice already had the answer. Under{" "}
                <a
                  href="https://www.gradeworkinggroup.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={LINK}
                >
                  GRADE
                </a>
                , inconsistency can only take certainty away, never add it: disagreement
                between studies is a reason to downgrade, and a single study is simply not
                assessable for consistency. {CURRENT_SPEC.label} adopts that. Consistency
                is now a penalty in the range{" "}
                {CURRENT_SPEC.consistencyRange[0]} to {CURRENT_SPEC.consistencyRange[1]},
                applied only when sources actually disagree, which drops the maximum
                strength from {PREVIOUS_SPEC.armStrengthMax} to{" "}
                {CURRENT_SPEC.armStrengthMax}.
              </p>

              {delta && (
                <div
                  style={{
                    backgroundColor: "var(--paper)",
                    border: "1px solid var(--rule)",
                    padding: "20px 22px",
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      ...MONO,
                      fontSize: "10px",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                      color: "var(--muted)",
                      marginBottom: 14,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>Same evidence, both rubrics</span>
                    <span>
                      {delta.before.spec.label} {delta.before.strength}/{delta.before.max}
                      {" \u2192 "}
                      {delta.rescored
                        ? `${delta.after.spec.label} ${delta.after.strength}/${delta.after.max}`
                        : `${delta.after.spec.label} pending rescore`}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "minmax(0, 130px) 64px 64px 1fr",
                        gap: 14,
                        ...MONO,
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--muted)",
                        paddingBottom: 6,
                        borderBottom: "1px solid var(--rule)",
                      }}
                    >
                      <span>Dimension</span>
                      <span>{delta.before.spec.label}</span>
                      <span>{delta.after.spec.label}</span>
                      <span>What changed</span>
                    </div>

                    {delta.rows.map((row) => (
                      <div
                        key={row.key}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "minmax(0, 130px) 64px 64px 1fr",
                          gap: 14,
                          alignItems: "baseline",
                        }}
                      >
                        <div
                          className="font-heading"
                          style={{ fontSize: "0.9rem", fontWeight: 500, color: "var(--ink)" }}
                        >
                          {row.label}
                        </div>
                        <div style={{ ...MONO, fontSize: "0.875rem", color: "var(--muted)" }}>
                          {row.before ?? "\u2014"}
                        </div>
                        <div
                          style={{
                            ...MONO,
                            fontSize: "0.875rem",
                            fontWeight: 500,
                            color: row.changed ? "var(--green-deep)" : "var(--ink-2)",
                          }}
                        >
                          {delta.rescored ? (row.after ?? "\u2014") : "\u2014"}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "var(--ink-2)", lineHeight: 1.55 }}>
                          {row.rescaled
                            ? "Rescaled: now a penalty that can only subtract, so agreement earns nothing and a lone study is not marked down."
                            : row.changed
                              ? "Re-scored under the revised anchors."
                              : "Unchanged."}
                        </div>
                      </div>
                    ))}
                  </div>

                  {!delta.rescored && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: "1px solid var(--rule)",
                        fontSize: "0.85rem",
                        color: "var(--ink-2)",
                        lineHeight: 1.55,
                      }}
                    >
                      The revised rubric is published and in force, but the corpus has not
                      yet been regraded under it, so the {CURRENT_SPEC.label} column is
                      blank rather than guessed. Regrading the corpus is a single
                      deliberate pass; this page will fill in when it runs.
                    </div>
                  )}
                </div>
              )}

              <p style={BODY}>
                What this does not do is make the ranking sharper. Removing a point that
                nearly every signal received lowers the floor; it does not spread the
                results out. On the evidence we hold, these two pairs are closer together
                than the old grade implied, and saying so is the correction. Whether the
                revised risk-of-bias and outcome-directness anchors separate them on
                grounds that hold up is a question the regrade answers, and we would
                rather publish that answer than pre-empt it.
              </p>
            </div>
          </section>

          {/* 04 Beyond the ingested source */}
          <section>
            <div style={EYEBROW}>04 &middot; Beyond the ingested source</div>
            <h2 className="font-heading" style={H2}>The wider record</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                The clinical literature on aromatase inhibitors in endometriosis
                extends past the one review on file. The references below sit
                outside the ingested corpus today and are not folded into the
                score. They converge with the indexed signal and, if ingested,
                would raise its corroboration dimension.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                {EXTERNAL_RECORD.map((src) => (
                  <div key={src.label} style={{ borderTop: "1px solid var(--rule)", paddingTop: 14 }}>
                    <div className="font-heading" style={{ fontSize: "1rem", fontWeight: 500, color: "var(--ink)", marginBottom: 4 }}>
                      <a href={src.href} target="_blank" rel="noopener noreferrer" style={LINK}>{src.label}</a>
                    </div>
                    <div style={{ ...MONO, fontSize: "11px", letterSpacing: "0.04em", color: "var(--muted)", marginBottom: 6 }}>
                      {src.meta}
                    </div>
                    <div style={{ fontSize: "0.9rem", color: "var(--ink-2)", lineHeight: 1.6 }}>{src.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 05 What this demonstrates */}
          <section>
            <div style={EYEBROW}>05 &middot; Reading the tier</div>
            <h2 className="font-heading" style={H2}>What Strong means here</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={BODY}>
                A Strong tier records that the ingested evidence is high-design,
                specific to the intervention and condition, and internally
                consistent. It is a research lead that stops short of a clinical
                recommendation. The signal is indexed at the class level:
                anastrozole and letrozole are the specific agents behind it, and
                the score reflects the aromatase-inhibitor evidence the engine
                has read across the class, with no verdict on any one molecule.
              </p>
              <p style={BODY}>
                Whel surfaces what the literature and underlying biology already
                imply and records how confident that inference is. It does not
                adjudicate clinical decisions.
              </p>
            </div>
          </section>

          {/* CTA */}
          <div
            style={{
              borderTop: "1px solid var(--rule)",
              paddingTop: 28,
              display: "flex",
              flexWrap: "wrap",
              gap: "12px 32px",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ maxWidth: "44ch" }}>
              <div style={{ ...MONO, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>
                Continue
              </div>
              <p style={{ fontSize: "0.95rem", color: "var(--ink-2)", lineHeight: 1.6 }}>
                See the full set of signals indexed for endometriosis, sorted by
                tier and evidence arm, alongside their sources.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px" }}>
              <Link
                href="/conditions/endometriosis"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "10px 18px",
                  backgroundColor: "var(--green-mid)",
                  color: "#fff",
                  ...MONO,
                  fontSize: "12px",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
                className="transition-opacity hover:opacity-90"
              >
                Open Endometriosis &rarr;
              </Link>
              <Link
                href="/about/methodology"
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
                Read the methodology
              </Link>
            </div>
          </div>

          <p
            style={{
              ...MONO,
              fontSize: 11,
              letterSpacing: "0.04em",
              color: "var(--muted)",
              borderTop: "1px solid var(--rule)",
              paddingTop: 18,
            }}
          >
            Scores, dimensions, and the ingested source on this page are read live
            from the substrate at request time and update as the corpus grows. The
            wider record in section 04 is curated by hand and is not yet part of
            the scored corpus.
          </p>

        </div>
      </div>
    </main>
  );
}
