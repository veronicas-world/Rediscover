import Link from"next/link";

export const metadata = {
 title:"Pathway Insights",
};

export default function PathwaysPage() {
 return (
 <main className="flex-1" style={{ backgroundColor:"#F5F3EF" }}>
 <div style={{ backgroundColor:"#fff", borderBottom:"1px solid #E0DDD8" }}>
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <nav className="text-xs mb-4" style={{ color:"#999" }}>
 <Link href="/" className="hover:underline">Home</Link>
 <span className="mx-2">›</span>
 <Link href="/about" className="hover:underline">About</Link>
 <span className="mx-2">›</span>
 <span style={{ color:"#4D5E4D" }}>Pathway Insights</span>
 </nav>
 <h1
 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3"
 style={{ color:"#1a1a1a" }}
 >
 Pathway Insights
 </h1>
 <p className="text-base" style={{ color:"#555" }}>
 What drugs that worsen conditions reveal about their biology
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
 Drugs that are known to affect or worsen one of our six conditions. Rather than serving as warnings alone, these signals reveal something important about the biological pathways involved in the condition. Understanding what makes a condition worse can point toward what might make it better.
 </p>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color:"#1a1a1a" }}>
 Data sources
 </h2>
 <p className="text-sm leading-relaxed" style={{ color:"#555" }}>
 Published clinical literature, FDA drug labeling, and case reports documenting adverse gynecological effects. Example: Tamoxifen (a widely used breast cancer drug) is known to cause or worsen adenomyosis. This tells us that estrogen receptor pathways are central to adenomyosis biology, which in turn suggests what therapeutic approaches might work.
 </p>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color:"#1a1a1a" }}>
 How signals are chosen
 </h2>
 <p className="text-sm leading-relaxed" style={{ color:"#555" }}>
 We include drugs where peer reviewed literature or FDA labeling documents a meaningful association with worsening or triggering a condition. Each signal includes a Pathway Insight section explaining what the drug&apos;s effect on the condition reveals about its underlying biology.
 </p>
 </section>

 <section>
 <h2 className="font-heading text-xl font-bold mb-5" style={{ color:"#1a1a1a" }}>
 Why it matters
 </h2>
 <p className="text-sm leading-relaxed" style={{ color:"#555" }}>
 Knowing what makes a condition worse is medically valuable in two ways. For safety, patients and clinicians should know. For research, the mechanism of harm often mirrors the mechanism of potential treatment.
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
