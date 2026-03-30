import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto" style={{ backgroundColor: "#EDEAE4", borderTop: "1px solid #E0DDD8" }}>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          {/* Brand + tagline */}
          <div className="max-w-xs">
            <p className="font-heading text-sm font-bold mb-1" style={{ color: "#333" }}>
              Rediscover Women
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#888" }}>
              A condition-first research tool for overlooked women&apos;s health signals.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-10 text-sm">
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: "#999" }}>
                Explore
              </p>
              <Link
                href="/conditions"
                className="block text-sm transition-opacity hover:opacity-70"
                style={{ color: "#666" }}
              >
                Browse Conditions
              </Link>
              <Link
                href="/about"
                className="block text-sm transition-opacity hover:opacity-70"
                style={{ color: "#666" }}
              >
                About
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-8 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ borderTop: "1px solid #D8D5CF" }}>
          <p className="text-xs" style={{ color: "#999" }}>
            © 2026 Rediscover Women
          </p>
          <p className="text-xs" style={{ color: "#999" }}>
            Not intended as medical advice. Always consult a qualified healthcare provider.
          </p>
        </div>
      </div>
    </footer>
  );
}
