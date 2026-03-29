import Link from "next/link";

export default function Home() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-5xl font-bold tracking-tight text-stone-900 mb-4">
          Re<span style={{ color: "#6b2737" }}>Discover</span>
        </h1>
        <p className="text-xl font-medium text-stone-600 mb-8">
          Surfacing overlooked drug treatments for women&apos;s health
        </p>
        <p className="text-base leading-relaxed text-stone-600 mb-12 max-w-xl mx-auto">
          ReDiscover mines published medical literature to identify existing,
          approved drugs that may hold promise for undertreated or
          under-researched women&apos;s health conditions — making the case for
          repurposing compounds that are already proven safe.
        </p>
        <Link
          href="/conditions"
          className="inline-block px-8 py-3 rounded-md text-white font-semibold text-sm tracking-wide transition-opacity hover:opacity-90"
          style={{ backgroundColor: "#6b2737" }}
        >
          Browse Conditions
        </Link>
      </div>
    </main>
  );
}
