import Link from "next/link";
import BackLink from "../../components/BackLink";

export const metadata = {
 title: "Contact",
};

export default function ContactPage() {
 return (
 <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
 <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <nav className="text-xs mb-4" style={{ color: "#111" }}>
 <Link href="/" className="hover:underline">Home</Link>
 <span className="mx-2">›</span>
 <Link href="/about" className="hover:underline">About</Link>
 <span className="mx-2">›</span>
 <span style={{ color: "#4D5E4D" }}>Contact</span>
 </nav>
 <h1
 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight"
 style={{ color: "#1a1a1a" }}
 >
 Contact
 </h1>
 </div>
 </div>

 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <div className="space-y-14">

 <section>
 <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
 For questions, research collaborations, or feedback, reach out at{" "}
 <a
 href="mailto:vla2117@columbia.edu"
 className="font-medium hover:underline underline-offset-2"
 style={{ color: "#4D5E4D" }}
 >
 vla2117@columbia.edu
 </a>
 .
 </p>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color: "#1a1a1a" }}>
 Project Background
 </h2>
 <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
 A detailed account of how this project was conceived and built is available in the{" "}
 <a
 href="https://veronicaagudelo.substack.com/p/my-first-project-womens-health-evidence"
 target="_blank"
 rel="noopener noreferrer"
 className="font-medium underline underline-offset-2 hover:opacity-75"
 style={{ color: "#4D5E4D" }}
 >
 project write-up
 </a>
 .
 </p>
 </section>

 <div style={{ borderTop: "1px solid #E0DDD8", paddingTop: "2rem" }}>
 <BackLink href="/" label="Back to home" />
 </div>

 </div>
 </div>
 </main>
 );
}
