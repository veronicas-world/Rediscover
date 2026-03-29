import Link from "next/link";
import SearchBar from "./SearchBar";

export default function Nav() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 shrink-0 font-heading"
        >
          Rediscover{" "}
          <span style={{ color: "var(--accent)" }}>Women</span>
        </Link>

        {/* Search — center, flexible width */}
        <div className="flex-1 max-w-md">
          <SearchBar size="sm" />
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-5 text-sm font-medium text-slate-500 shrink-0">
          <Link
            href="/conditions"
            className="hover:text-slate-900 transition-colors"
          >
            Conditions
          </Link>
          <Link
            href="/about"
            className="hover:text-slate-900 transition-colors"
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
