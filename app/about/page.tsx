export const metadata = {
 title: "About",
};

export default function AboutPage() {
 return (
 <main className="flex-1" style={{ backgroundColor: "#F5F3EF" }}>
 <div style={{ backgroundColor: "#fff", borderBottom: "1px solid #E0DDD8" }}>
 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <nav className="text-xs mb-4" style={{ color: "#111" }}>
 <span>Home</span>
 <span className="mx-2">›</span>
 <span style={{ color: "#4D5E4D" }}>About</span>
 </nav>
 <h1
 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight mb-3"
 style={{ color: "#1a1a1a" }}
 >
 About
 </h1>
 </div>
 </div>

 <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
 <div className="space-y-4 text-sm leading-relaxed" style={{ color: "#111" }}>
 <p>
 WHEL began with a personal experience. A few years ago, I was diagnosed with a prolactinoma — a noncancerous tumor of the pituitary gland that disrupts hormonal regulation. The standard treatment is dopamine agonists like cabergoline or bromocriptine, which are effective but, for many patients including myself, quite rough. Common side effects include extreme nausea, psychiatric symptoms, and impulse control disorders. The drugs work, but &ldquo;working&rdquo; is not the same as &ldquo;working well,&rdquo; and for many people who take them over years, the calculation is not clean.
 </p>
 <p>
 I got through it. And I am aware, acutely, that I had it relatively easy. A prolactinoma is not endometriosis, or PMDD, or eight years of being told your pain is normal, to come back in six months, to try exercise. I had a diagnosis, a treatment, a surgery, and a recovery. Many women with reproductive and hormonal conditions do not get that clean of an arc.
 </p>
 <p>
 That realization — along with a lot of late night PubMed rabbit holes and conversations with my mother, who is a psychiatrist and has spent a long time thinking about women&apos;s hormonal conditions — eventually turned into this project. WHEL is a drug repurposing research tool that mines scattered signals from clinical trials, adverse event databases, and patient community forums to investigate whether drugs we already have might help conditions that are chronically underresearched. We built it together.
 </p>
 <p>
 Drug repurposing asks a different question than traditional drug discovery. Instead of designing a new drug from scratch, you look at what is already on the market — where the safety profile is at least partially known — and search for unexpected benefits or patterns in existing data that suggest a new use case. The surprising thing is that the signal is often already there. Somewhere in a published trial, an adverse event database, or a Reddit thread from two years ago, someone noticed that women on statins were reporting reduced period pain. The data exists. It is just scattered, and no one has built a clean tool that pulls it together specifically for women&apos;s hormonal health.
 </p>
 <p>
 Medical knowledge has structural blind spots. The NIH did not require inclusion of women in clinical research until 1993. Conditions that affect women most severely have historically been underfunded, and where a research base exists at all, it is thin. Endometriosis affects up to 10% of women of reproductive age, with an average diagnostic delay of 7 to 10 years, and in 2026 there is still no pharmaceutical treatment that addresses the underlying condition rather than suppressing symptoms. PMDD, adenomyosis, vulvodynia, and PCOS are chronically underrepresented in the research literature. The problem is not that researchers do not care — it is a feedback loop: poorly characterized mechanisms make conditions harder to study, which makes them less fundable, which means the mechanisms remain poorly characterized.
 </p>
 <p>
 Drug repurposing is one way to interrupt that loop. WHEL currently covers six conditions — endometriosis, PMDD, PCOS, adenomyosis, vulvodynia, and menopause — and organizes evidence into four research arms: Direct Research (published studies and active clinical trials), Cross-Condition Signals (drugs developed for other purposes where women incidentally reported benefit), Pathway Insights (adverse effects that reveal underlying biology), and Community Forum Reports (consistent patterns in patient community posts). This is a starting point. The plan is to expand the condition set and refine the pipelines as the tool grows.
 </p>
 <p>
 WHEL is free, open, and not a monetization project. Nothing here is medical advice. It is a research signal aggregator, built by a philosophy student and her psychiatrist mother, and we hope it is useful to someone.
 </p>
 </div>
 </div>
 </main>
 );
}
