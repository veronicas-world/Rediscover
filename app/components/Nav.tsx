import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-stone-900">
          Re<span style={{ color: "#6b2737" }}>Discover</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-stone-600">
          <Link href="/conditions" className="hover:text-stone-900 transition-colors">
            Conditions
          </Link>
        </nav>
      </div>
    </header>
  );
}
