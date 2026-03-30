import Link from "next/link";

function FlaskIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 3h6" />
      <path d="M9 3v6.5L5.2 16A2 2 0 007 19h10a2 2 0 001.8-2.6L15 9.4V3" />
      <path d="M6.5 15h11" />
    </svg>
  );
}

export default function Nav() {
  return (
    <header className="sticky top-0 z-40" style={{ backgroundColor: "#5C6B5D" }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-white shrink-0">
          <FlaskIcon />
          <span className="font-heading text-lg font-bold tracking-tight">
            Rediscover Women
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/conditions"
            className="transition-opacity hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Browse Conditions
          </Link>
          <Link
            href="/about"
            className="transition-opacity hover:opacity-70"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
