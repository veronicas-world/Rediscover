import Link from"next/link";

export const metadata = {
 title:"Cross-Condition Signals",
};

export default function CrossConditionPage() {
 return (
 <main className="flex-1" style={{ backgroundColor:"#F5F3EF" }}>
 <div style={{ backgroundColor:"#fff", borderBottom:"1px solid #E0DDD8" }}>
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <nav className="text-xs mb-4" style={{ color:"#999" }}>
 <Link href="/" className="hover:underline">Home</Link>
 <span className="mx-2">›</span>
 <Link href="/about" className="hover:underline">About</Link>
 <span className="mx-2">›</span>
 <span style={{ color:"#4D5E4D" }}>Cross-Condition Signals</span>
 </nav>
 <h1
 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3"
 style={{ color:"#1a1a1a" }}
 >
 Cross-Condition Signals
 </h1>
 <p className="text-base" style={{ color:"#555" }}>
 Drugs developed for other conditions that may incidentally help
 </p>
 </div>
 </div>

 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <div className="space-y-14">

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color:"#1a1a1a" }}>
 What it is
 </h2>
 <p className="text-sm leading-relaxed" style={{ color:"#555" }}>
 Studies where a drug was developed for one condition but women reported unexpected improvements in symptoms related to our six conditions. These are indirect signals. The drug was not being tested for this condition, but the data suggests a connection worth investigating.
 </p>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color:"#1a1a1a" }}>
 Data sources
 </h2>
 <p className="text-sm leading-relaxed" style={{ color:"#555" }}>
 FDA Adverse Event Reporting System (FAERS), a public database of real world patient reports submitted to the FDA. When a woman on a statin reports that her period pain improved, that appears here. We also pull from published population studies and observational research.
 </p>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color:"#1a1a1a" }}>
 How signals are chosen
 </h2>
 <p className="text-sm leading-relaxed" style={{ color:"#555" }}>
 We query FAERS for female patients taking specific drug classes (statins, GLP1 agonists, dopamine agonists, anti TNF biologics, and others) and look for any reported effects related to our six conditions. We then use AI to identify patterns across thousands of reports. Signals with 2 or more supporting reports are included. We err on the side of inclusion because filtering based on current assumptions is exactly the kind of bias this tool exists to counter.
 </p>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color:"#1a1a1a" }}>
 Why it matters
 </h2>
 <p className="text-sm leading-relaxed" style={{ color:"#555" }}>
 This is the least explored category in women&apos;s health research. Women often do not report incidental improvements in clinical trials unless the trial is designed to capture them. FAERS captures real world reports that would otherwise never be aggregated or analyzed.
 </p>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color:"#1a1a1a" }}>
 What the raw data looks like
 </h2>
 <p className="text-sm leading-relaxed" style={{ color:"#555" }}>
 Each signal card shows reaction counts (e.g. &ldquo;Pain n=11&rdquo;) drawn from FAERS reports. The n= number reflects how many reports in our sampled dataset mentioned that reaction. Citations link directly to the live FDA database query so anyone can verify.
 </p>
 </section>

 <div style={{ borderTop:"1px solid #E0DDD8", paddingTop:"2rem" }}>
 <Link
 href="/"
 className="text-sm font-medium transition-opacity hover:opacity-70"
 style={{ color:"#4D5E4D" }}
 >
 ← Back to home
 </Link>
 </div>

 </div>
 </div>
 </main>
 );
}
