import Link from "next/link";

const MONO = "var(--font-plex-mono, ui-monospace, monospace)";

/**
 * Shared placeholder shown by every signal-rendering route while
 * SIGNALS_PUBLISHED is false. Explains that grades are being regraded
 * under methodology v4.3 and will publish when the regrade completes.
 * Links to the pages that stay visible during the regrade.
 */
export default function ComingSoon() {
  return (
    <main style={{ background: "var(--bone)" }}>
      <section className="surface-ink" style={{ paddingTop: 44, paddingBottom: 60 }}>
        <div className="container">
          <div className="crumbs on-ink">
            <Link href="/">Home</Link>
          </div>
          <div className="eyebrow on-ink" style={{ marginBottom: 18 }}>Regrade in progress</div>
          <h1
            className="display"
            style={{
              color: "var(--on-ink)",
              fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)",
              lineHeight: 1.07,
              maxWidth: "20ch",
            }}
          >
            Grades are being regraded.
          </h1>
          <p className="lede" style={{ color: "var(--on-ink-2)", marginTop: 24, maxWidth: "60ch" }}>
            The scoring rubric was revised under methodology v4.3. Every signal in the
            index is being regraded under the new rubric in a single deliberate pass.
            Grades, tiers, candidate cards, and the condition index will publish here
            when the regrade completes.
          </p>
        </div>
      </section>

      <section className="surface-bone section">
        <div className="container" style={{ maxWidth: 720 }}>
          <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--body)", marginBottom: 24 }}>
            While the regrade runs, the methodology, scoring criteria, and revision
            history remain available:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Link
              href="/signal-types"
              style={{
                fontFamily: MONO,
                fontSize: "12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--paper)",
                background: "var(--ink)",
                padding: "11px 18px",
                textDecoration: "none",
              }}
            >
              Scoring criteria →
            </Link>
            <Link
              href="/about/methodology/changelog"
              style={{
                fontFamily: MONO,
                fontSize: "12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink)",
                border: "1px solid var(--rule-strong)",
                padding: "11px 18px",
                textDecoration: "none",
              }}
            >
              Methodology changelog →
            </Link>
            <Link
              href="/about"
              style={{
                fontFamily: MONO,
                fontSize: "12px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--ink)",
                border: "1px solid var(--rule-strong)",
                padding: "11px 18px",
                textDecoration: "none",
              }}
            >
              About Whel →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
