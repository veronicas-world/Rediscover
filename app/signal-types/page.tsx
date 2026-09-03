import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import SignalTypesAccordion from "./SignalTypesAccordion";
import { tierRanges } from "@/lib/substrate-helpers";
import {
  RUBRIC_ANCHORS,
  CONSISTENCY_PENALTY,
  GRADE_MAPPING,
  GRADE_SUMMARY,
  RUBRIC_SOURCES,
} from "@/lib/rubric-anchors";

export const metadata: Metadata = {
  title: "Signal types & scoring criteria | Whel",
  description:
    "Whel reads each drug-condition pair through three evidence arms (direct research, pathway insights, and community forum reports), each scored on four evidence dimensions plus a downgrade-only consistency penalty, then sorted into a confidence tier on the undiscounted strength.",
};

const INLINE: React.CSSProperties = {
  color: "var(--moss)",
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

function A({ h, children }: { h: string; children: ReactNode }) {
  return (
    <a href={h} target="_blank" rel="noopener noreferrer" style={INLINE}>
      {children}
    </a>
  );
}

// Female-applicability bands (SCORING_SPEC §3).
const BANDS: { band: string; shows: string; mult: string }[] = [
  { band: "F1 · Female-generated", shows: "female-specific condition, or studied in women / ≥80% female", mult: "×1.00" },
  { band: "F2 · Represented & equivalent", shows: "≥50% female and a sex-stratified analysis found no meaningful difference", mult: "×1.00" },
  { band: "F3 · Represented, not analyzed", shows: "≥50% female but results not broken out by sex", mult: "×0.90" },
  { band: "F4 · Underrepresented / extrapolated", shows: "<50% female, or mixed with no sex analysis", mult: "×0.75" },
  { band: "F5 · Male-derived / female-excluded", shows: "<30% female or male-only, applied to a female context", mult: "×0.60" },
  { band: "F6 · Sex-dependent disadvantage", shows: "verified evidence the drug behaves worse in women", mult: "×0.50 ⚠" },
];

// Meanings are editorial; the cutoffs are NOT written here. They come from
// lib/substrate-helpers so a recalibration cannot leave this table stating numbers
// the engine no longer uses (SCORING_SPEC §5b). Tiers absent from the current ladder
// simply do not render.
const TIER_MEANING: Record<string, string> = {
  strong: "guideline-grade: independently replicated, low-bias, in women",
  moderate: "good evidence, not yet definitive",
  emerging: "a real early lead worth watching",
  exploratory: "thin or single-source; surfaced with heavy caveat",
};

const TIERS: { tier: string; cut: string; meaning: string }[] = tierRanges().map((r) => ({
  tier: r.tier.charAt(0).toUpperCase() + r.tier.slice(1),
  cut: r.label,
  meaning: TIER_MEANING[r.tier] ?? "",
}));

export default function SignalTypesPage() {
  return (
    <main style={{ background: "var(--bone)" }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="surface-ink" style={{ paddingTop: 44, paddingBottom: 60 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
            <span className="sep">/</span>
            <Link href="/about">About</Link>
            <span className="sep">/</span>
            <span className="here">Signal types &amp; scoring</span>
          </div>
          <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>How the evidence is read and scored</div>
          <h1
            className="display"
            style={{ color: "var(--on-ink)", fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)", lineHeight: 1.07, maxWidth: "22ch" }}
          >
            Signal types and scoring.
          </h1>
          <p className="lede" style={{ color: "var(--on-ink-2)", marginTop: 24, maxWidth: "64ch" }}>
            Whel reads each drug-condition pair through three evidence arms, each pulling a
            different kind of source and held to its own scoring bar. Every arm is scored on
            four evidence dimensions plus a downgrade-only consistency penalty, with each
            dimension interpreted on that arm&rsquo;s terms, so a patient report is never
            judged on clinical-trial criteria. The arm strength is sorted into a confidence
            tier, and a female-applicability multiplier is then applied to rank and display.
          </p>
        </div>
      </section>

      {/* ── Framing + arms ────────────────────────────────────────────────── */}
      <section className="surface-bone section">
        <div className="container">
          <div style={{ maxWidth: 800, marginBottom: 44 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>The three arms</div>
            <h2 className="h2" style={{ marginBottom: 18, maxWidth: "22ch" }}>
              Three arms, scored separately and reported side by side.
            </h2>
            <p className="lede" style={{ color: "var(--body)" }}>
              A published trial, a mechanistic link, and a community report each carry a different
              kind of information and a different kind of error. Whel reads all three, scores each
              against its own bar, and reports them side by side. The strongest <em>Direct</em>{" "}
              reading anchors the headline, and the others corroborate beside it. They are never
              averaged into one number. Expand each arm below for its full scoring criteria.
            </p>
          </div>

          <div style={{ maxWidth: 940 }}>
            <SignalTypesAccordion />
          </div>
        </div>
      </section>

      {/* ── The rubric ───────────────────────────────────────────────────── */}
      <section className="surface-paper section tight">
        <div className="container" style={{ maxWidth: 940 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>The rubric</div>
          <h2 className="h2" style={{ marginBottom: 16, maxWidth: "30ch" }}>
            Four evidence dimensions, scored per arm, plus a downgrade-only consistency penalty.
          </h2>
          <p className="lede" style={{ color: "var(--body)", marginBottom: 28, maxWidth: "72ch" }}>
            Each arm is scored on the same four dimensions, but what each dimension measures is
            tuned to the arm. A randomized trial and a patient forum post are not judged with the
            same ruler: rigor for a trial means low risk of bias, while rigor for a patient report
            means the patient described the symptom, dose, and timing clearly. Every score carries
            a short rationale citing the claims behind it, so the number is never opaque.
          </p>

          {/* ── Per-arm anchor tables, rendered from RUBRIC_ANCHORS ────────── */}
          {Object.entries(RUBRIC_ANCHORS).map(([armKey, arm]) => (
            <div key={armKey} style={{ marginBottom: 32 }}>
              <h3
                className="font-heading"
                style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 6 }}
              >
                {arm.label}
              </h3>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--muted)", marginBottom: 14, maxWidth: "68ch" }}>
                {arm.intro}
              </p>
              <div style={{ overflowX: "auto", border: "1px solid var(--line)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: 640 }}>
                  <thead>
                    <tr style={{ background: "var(--bone-2)", borderBottom: "1px solid var(--line)" }}>
                      {["Dimension", "What it measures", "0", "1", "2"].map((h) => (
                        <th key={h} style={{ textAlign: h === "0" || h === "1" || h === "2" ? "center" : "left", padding: "9px 12px", fontFamily: "var(--font-plex-mono, monospace)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {arm.dimensions.map((d) => (
                      <tr key={d.key} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                        <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>{d.label}</td>
                        <td style={{ padding: "10px 12px", color: "var(--body)", maxWidth: "22ch" }}>{d.means}</td>
                        <td style={{ padding: "10px 12px", color: "var(--muted)", textAlign: "center" }}>{d.anchors[0]}</td>
                        <td style={{ padding: "10px 12px", color: "var(--body)", textAlign: "center" }}>{d.anchors[1]}</td>
                        <td style={{ padding: "10px 12px", color: "var(--ink)", textAlign: "center" }}>{d.anchors[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* ── Consistency penalty ───────────────────────────────────────── */}
          <div style={{ marginTop: 36, marginBottom: 32 }}>
            <h3
              className="font-heading"
              style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 10 }}
            >
              {CONSISTENCY_PENALTY.label}
            </h3>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--body)", marginBottom: 18, maxWidth: "72ch" }}>
              {CONSISTENCY_PENALTY.summary}
            </p>
            <div style={{ overflowX: "auto", border: "1px solid var(--line)", marginBottom: 18 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: 480 }}>
                <thead>
                  <tr style={{ background: "var(--bone-2)", borderBottom: "1px solid var(--line)" }}>
                    {["Value", "What it means"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "9px 12px", fontFamily: "var(--font-plex-mono, monospace)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONSISTENCY_PENALTY.rows.map((r) => (
                    <tr key={r.value} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                      <td style={{ padding: "10px 12px", fontFamily: "var(--font-plex-mono, monospace)", color: "var(--ink)", whiteSpace: "nowrap" }}>{r.value}</td>
                      <td style={{ padding: "10px 12px", color: "var(--body)" }}>{r.meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "var(--muted)", marginBottom: 6, maxWidth: "72ch" }}>
              The trigger for each penalty depends on the arm:
            </p>
            <div style={{ overflowX: "auto", border: "1px solid var(--line)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: 640 }}>
                <thead>
                  <tr style={{ background: "var(--bone-2)", borderBottom: "1px solid var(--line)" }}>
                    {["Arm", "0 (no penalty)", "−1", "−2"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "9px 12px", fontFamily: "var(--font-plex-mono, monospace)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(RUBRIC_ANCHORS).map(([armKey, arm]) => (
                    <tr key={armKey} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap" }}>{arm.label}</td>
                      <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{arm.consistency.anchors["0"]}</td>
                      <td style={{ padding: "10px 12px", color: "var(--body)" }}>{arm.consistency.anchors["−1"]}</td>
                      <td style={{ padding: "10px 12px", color: "var(--ink)" }}>{arm.consistency.anchors["−2"]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── GRADE provenance ──────────────────────────────────────────── */}
          <div style={{ marginTop: 36, marginBottom: 32 }}>
            <h3
              className="font-heading"
              style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 10 }}
            >
              How this maps to GRADE
            </h3>
            <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--body)", marginBottom: 18, maxWidth: "72ch" }}>
              GRADE is the standard framework for grading the certainty of evidence. Whel&rsquo;s
              rubric is not GRADE, but it is built on GRADE where GRADE applies. The table below
              states, for each dimension, what it maps to in GRADE and whether it is adapted or
              invented.
            </p>
            <div style={{ overflowX: "auto", border: "1px solid var(--line)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", minWidth: 620 }}>
                <thead>
                  <tr style={{ background: "var(--bone-2)", borderBottom: "1px solid var(--line)" }}>
                    {["Whel dimension", "GRADE equivalent", "Status"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "9px 12px", fontFamily: "var(--font-plex-mono, monospace)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {GRADE_MAPPING.map((g) => (
                    <tr key={g.whel} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--ink)" }}>{g.whel}</td>
                      <td style={{ padding: "10px 12px", color: "var(--body)" }}>{g.grade}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          fontFamily: "var(--font-plex-mono, monospace)",
                          fontSize: "10px",
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: g.status === "adapted" ? "var(--moss)" : g.status === "partial" ? "var(--khaki)" : "var(--brick)",
                        }}>
                          {g.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {GRADE_MAPPING.filter((g) => g.note).length > 0 && (
              <div style={{ marginTop: 14 }}>
                {GRADE_MAPPING.filter((g) => g.note).map((g) => (
                  <p key={g.whel} style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "var(--muted)", marginBottom: 4, maxWidth: "72ch" }}>
                    <strong style={{ color: "var(--ink)" }}>{g.whel}:</strong> {g.note}
                  </p>
                ))}
              </div>
            )}
            <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--ink)", fontWeight: 500, marginTop: 18, maxWidth: "72ch" }}>
              {GRADE_SUMMARY}
            </p>
          </div>

          {/* ── Sources ───────────────────────────────────────────────────── */}
          <div style={{ marginTop: 28 }}>
            <h3
              className="font-heading"
              style={{ fontSize: "1.25rem", fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em", marginBottom: 10 }}
            >
              Sources
            </h3>
            <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--muted)", maxWidth: "72ch" }}>
              The rubric draws on the following frameworks and sources:
            </p>
            <ul style={{ marginTop: 8, paddingLeft: 18, fontSize: "0.85rem", lineHeight: 1.8, color: "var(--body)" }}>
              {RUBRIC_SOURCES.map((s) => (
                <li key={s.href}>
                  <A h={s.href}>{s.label}</A>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Female-applicability multiplier ───────────────────────────────── */}
      <section className="surface-paper section tight">
        <div className="container" style={{ maxWidth: 940 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>The female-applicability multiplier</div>
          <h2 className="h2" style={{ marginBottom: 16, maxWidth: "26ch" }}>
            Every arm&rsquo;s score is discounted by how far its evidence was generated in women.
          </h2>
          <p className="lede" style={{ color: "var(--body)", marginBottom: 12, maxWidth: "70ch" }}>
            This is the correction the rest of drug development skips. Each arm&rsquo;s strength
            is sorted into a confidence tier, and the multiplier is then applied to rank and
            display — judged on whether <em>that arm&rsquo;s</em> evidence is in or about women.
            The same drug can carry a different multiplier in different arms: a women&rsquo;s-health
            forum is inherently female (F1), while a male-derived trial sits at F5.
          </p>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--body)", marginBottom: 20, maxWidth: "70ch" }}>
            The bands follow the reporting standards that ask for sex to be analyzed, not assumed:
            the <A h="https://doi.org/10.1186/s41073-016-0007-6">SAGER guidelines</A> for sex and
            gender reporting, and Region Stockholm&rsquo;s{" "}
            <A h="https://www.janusinfo.se/inenglish/janusmedsexandgender.4.728d7bf216544e2a85e3b8.html">Janusmed Sex and Gender</A>{" "}
            database of clinically relevant sex differences. Two guardrails hold throughout:{" "}
            <strong>it discounts, it never excludes</strong> (the floor is ×0.50, so a male-derived
            drug still surfaces, clearly marked), and <strong>absence is not inferiority</strong>.
            Only F6 means a known disadvantage (the kind the{" "}
            <A h="https://www.fda.gov/drugs/drug-safety-and-availability/fda-drug-safety-communication-risk-next-morning-impairment-after-use-insomnia-drugs-fda-requires">zolpidem dose reduction</A>{" "}
            eventually formalized); F4 and F5 simply mean &ldquo;not yet shown in women.&rdquo;
          </p>
          <div style={{ overflowX: "auto", border: "1px solid var(--line)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem", minWidth: 620 }}>
              <thead>
                <tr style={{ background: "var(--bone-2)", borderBottom: "1px solid var(--line)" }}>
                  {["Band", "What the evidence shows", "Multiplier"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontFamily: "var(--font-plex-mono, monospace)", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BANDS.map((b) => (
                  <tr key={b.band} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                    <td style={{ padding: "11px 14px", fontWeight: 600, color: "var(--ink)" }}>{b.band}</td>
                    <td style={{ padding: "11px 14px", color: "var(--body)" }}>{b.shows}</td>
                    <td style={{ padding: "11px 14px", fontFamily: "var(--font-plex-mono, monospace)", color: "var(--ink)", whiteSpace: "nowrap" }}>{b.mult}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--muted)", marginTop: 14, maxWidth: "70ch" }}>
            <strong>Current state:</strong> In the present corpus, only F1 (&times;1.00, evidence
            generated in women) and F4 (&times;0.75, female representation not stated) have been
            assigned. F2, F3, F5 and F6 require sex-stratified analysis or male-only population
            data that the current source documents do not report. Pathway records (Open Targets,
            SIDER, AEMS) carry no sex data at all, so pathway arms always land at F4. The multiplier
            is therefore effectively &ldquo;evidence in women&rdquo; (F1) versus &ldquo;sex data
            absent&rdquo; (F4) today. The six-band framework is designed for the corpus to grow into;
            the scoring code implements all six bands and will assign them as the evidence base
            expands to include studies that report sex breakdowns.
          </p>
        </div>
      </section>

      {/* ── Confidence tiers ──────────────────────────────────────────────── */}
      <section className="surface-bone section tight">
        <div className="container" style={{ maxWidth: 940 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>Confidence tiers</div>
          <h2 className="h2" style={{ marginBottom: 16, maxWidth: "24ch" }}>
            Arm strength × multiplier determines the tier.
          </h2>
          <p className="lede" style={{ color: "var(--body)", marginBottom: 20, maxWidth: "70ch" }}>
            Arm strength (0–8) sorts into three tiers; the female-applicability multiplier moves
            rank and display only, applied after tiering. The cutoffs were set on reason, then
            frozen against the real score distribution and hand-judged boundary pairs, so they
            carve the board where the confidence boundaries actually fall.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, background: "var(--line)", border: "1px solid var(--line)" }}>
            {TIERS.map((t) => (
              <div key={t.tier} style={{ background: "var(--paper)", padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-newsreader, Georgia, serif)", fontSize: "1.25rem", fontWeight: 500, color: "var(--ink)" }}>{t.tier}</span>
                  <span style={{ fontFamily: "var(--font-plex-mono, monospace)", fontSize: "0.85rem", color: "var(--moss)" }}>{t.cut}</span>
                </div>
                <p style={{ fontSize: "0.875rem", lineHeight: 1.55, color: "var(--body)", margin: 0 }}>{t.meaning}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--muted)", marginTop: 18, maxWidth: "70ch" }}>
            A spanning badge (e.g. Moderate–Emerging) reads at its lower tier: the score sits within
            the noise band of a cutoff, so the grade holds at the lower bound until regrade rather
            than claiming a precision the run-to-run spread does not support.
          </p>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.7, color: "var(--muted)", marginTop: 18, maxWidth: "70ch" }}>
            Contradictions in the underlying evidence cap the consistency score and are shown
            explicitly rather than averaged away, following the{" "}
            <A h="https://training.cochrane.org/handbook">Cochrane</A> and{" "}
            <A h="https://www.cebm.ox.ac.uk/resources/levels-of-evidence/ocebm-levels-of-evidence">CEBM</A>{" "}
            view that disagreement is meaningful information.
          </p>
        </div>
      </section>

      {/* ── Cross-condition: a derived lens, not an arm ───────────────────── */}
      <section className="surface-paper section tight">
        <div className="container" style={{ maxWidth: 940 }}>
          <div className="eyebrow" style={{ marginBottom: 14 }}>What changed: cross-condition</div>
          <h2 className="h2" style={{ marginBottom: 16, maxWidth: "28ch" }}>
            Cross-condition is a derived lens.
          </h2>
          <p className="lede" style={{ color: "var(--body)", maxWidth: "72ch" }}>
            An earlier version of Whel scored cross-condition signals as a fourth evidence arm. It
            was demoted because it is <em>inferential</em>: no source directly says &ldquo;this drug
            treats condition Y,&rdquo; so scoring it on the same observed-evidence dimensions would
            dress up a prediction as evidence. Cross-condition reasoning still matters, since the six
            conditions converge on shared biology (estrogen signaling, inflammation, metabolic
            regulation, pain processing), but it now sits on top of the three evidence arms as a
            clearly-labelled derived-hypotheses layer, never blended into a pair&rsquo;s score.
          </p>
        </div>
      </section>

      {/* ── Continue ──────────────────────────────────────────────────────── */}
      <section className="surface-bone" style={{ paddingBottom: 72, paddingTop: 8 }}>
        <div className="container">
          <div style={{ borderTop: "1px solid var(--line)", paddingTop: 28, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link href="/about/technical-architecture" className="btn btn-primary">
              Technical architecture <span className="arr">&rarr;</span>
            </Link>
            <Link href="/about/external-references" className="btn btn-ghost">External references</Link>
            <Link href="/candidates" className="btn btn-ghost">View candidates</Link>
          </div>
        </div>
      </section>

    </main>
  );
}
