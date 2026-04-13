import Link from "next/link";
import SignalTypesAccordion from "./SignalTypesAccordion";

export const metadata = {
 title: "Signal Types",
};

export default function SignalTypesPage() {
 return (
 <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
 <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <nav className="text-xs mb-4" style={{ color: "#111" }}>
 <Link href="/" className="hover:underline">Home</Link>
 <span className="mx-2">›</span>
 <span style={{ color: "#4D5E4D" }}>Signal Types</span>
 </nav>
 <h1
 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3"
 style={{ color: "#1a1a1a" }}
 >
 Signal Types
 </h1>
 <p className="text-base max-w-2xl" style={{ color: "#111" }}>
 WHEL organizes evidence into four arms. Select a signal type to read how it works and what to look for.
 </p>
 </div>
 </div>

 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <SignalTypesAccordion />
 </div>
 </main>
 );
}
