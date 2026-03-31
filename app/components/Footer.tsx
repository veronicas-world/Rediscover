import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#2E3B2E", color: "#fff" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <p className="font-heading text-base font-bold mb-2" style={{ color: "#fff" }}>
              Repertus
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              Research tool for women&apos;s health. Not medical advice.
            </p>
          </div>

          {/* Explore */}
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-4"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Explore
            </p>
            <div className="space-y-3">
              <Link
                href="/conditions"
                className="block text-sm transition-opacity hover:opacity-70"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                Browse Conditions
              </Link>
              <Link
                href="/about"
                className="block text-sm transition-opacity hover:opacity-70"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                About
              </Link>
            </div>
          </div>

          {/* Disclaimer */}
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-4"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Important Notice
            </p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
              For research purposes only. Always consult a healthcare provider before making treatment decisions.
            </p>
          </div>
        </div>

        {/* Bottom row */}
        <div
          className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            © 2026 Repertus
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            For research and educational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
