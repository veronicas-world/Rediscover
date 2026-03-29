import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          {/* Brand + tagline */}
          <div className="max-w-xs">
            <p className="text-sm font-bold text-slate-900 font-heading mb-1">
              Rediscover{" "}
              <span style={{ color: "var(--accent)" }}>Women</span>
            </p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Built with care for women&apos;s health research.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-10 text-sm text-slate-500">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Explore
              </p>
              <Link
                href="/conditions"
                className="block hover:text-slate-900 transition-colors"
              >
                Conditions
              </Link>
              <Link
                href="/about"
                className="block hover:text-slate-900 transition-colors"
              >
                About
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            <strong className="text-slate-500">Medical Disclaimer:</strong>{" "}
            This is a research discovery tool, not medical advice. Signals are
            not treatment recommendations — they are starting points for further
            investigation. Always consult a qualified healthcare provider before
            making any medical decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
