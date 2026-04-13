"use client";

import { useState } from "react";

const CARDS = [
 {
 key: "direct",
 title: "Direct Research",
 oneLine: "Published studies and active clinical trials specifically investigating each condition.",
 paragraphs: [
 "Direct Research is the most straightforward arm: it pulls studies and trials that were explicitly designed to investigate the condition in question. Data sources are PubMed (via the NCBI Entrez API) and ClinicalTrials.gov.",
 "This arm is intentionally sparse for most conditions in the database — and the sparseness is itself data. Endometriosis affects up to 10% of women of reproductive age, yet a search of the direct research arm returns a relatively small number of results, most of them recent. That is not a gap in WHEL. That is a reflection of how little targeted research exists.",
 "Evidence in this arm includes randomized controlled trials, observational studies, systematic reviews, and registered clinical trials (active, recruiting, or completed). Each signal is classified by evidence strength: Strong, Moderate, Preliminary, or Theoretical. Classification is based on study design, sample size, and consistency of findings.",
 "What to look for: A small number of strong evidence signals suggests the condition is genuinely understudied at the clinical trial level. A cluster of preliminary evidence signals may indicate an emerging research area worth watching.",
 ],
 },
 {
 key: "cross",
 title: "Cross-Condition Signals",
 oneLine: "Drugs developed for other conditions where women incidentally reported benefit.",
 paragraphs: [
 "Cross-Condition Signals is the arm that drug repurposing is built on. It looks for drugs that were developed or trialed for an entirely different purpose, where female patients incidentally reported benefit — or where secondary endpoints in large trials suggest an unexpected effect on a condition we are tracking.",
 "Data sources include the FDA Adverse Event Reporting System (FAERS), population level epidemiological studies, and secondary endpoints buried in trials designed to study something else. The FDA FAERS database is particularly useful because it captures not just adverse events but off label use patterns and unexpected outcomes.",
 "A concrete example: several large statin trials (statins are cholesterol lowering drugs) included significant female populations. Buried in the secondary endpoints, women on statins reported reduced dysmenorrhea — painful periods, which is a hallmark symptom of endometriosis. Is this a proven treatment? No. Is it a hypothesis worth formal investigation? Yes. That is exactly what this arm is designed to surface.",
 "Drug classes of particular interest in this arm include statins, SSRIs, dopamine agonists (cabergoline, bromocriptine), and GLP-1 receptor agonists. GLP-1s are especially active right now: the wave of Ozempic and Wegovy trials has generated an enormous amount of data about hormonal and inflammatory effects in women, and researchers are only beginning to analyze what that secondary data contains.",
 "What to look for: Cross-condition signals with multiple independent sources (FAERS reports plus a secondary trial endpoint, for example) are stronger candidates for follow-up than signals from a single source.",
 ],
 },
 {
 key: "pathways",
 title: "Pathway Insights",
 oneLine: "What adverse effects reveal about the underlying biology of a condition.",
 paragraphs: [
 "Pathway Insights started as Caution Signals and was reframed — which was the right call. The original framing focused on drugs that worsen conditions. The reframe focuses on what those adverse effects tell us about the biology driving the condition in the first place.",
 "The core insight is pharmacological: if a drug reliably worsens a condition, that is information about mechanism. Understanding what makes something worse is often a legitimate path to understanding what might make it better.",
 "A clear example is Tamoxifen. Tamoxifen is a breast cancer drug that works by blocking estrogen receptors. It is also documented to cause or worsen adenomyosis in some patients. This sounds purely negative, and for those patients it is. But from a research perspective, it is informative: if blocking estrogen receptors exacerbates adenomyosis, that tells us estrogen receptor pathways are central to adenomyosis biology. That in turn suggests what classes of drugs might be worth investigating as treatments — and it suggests why conditions that disrupt estrogen signaling more broadly may co-occur with adenomyosis.",
 "This arm draws on case reports, retrospective studies, pharmacovigilance data, and mechanistic literature. Signals here are not treatment recommendations — they are biological hypotheses derived from observed drug effects.",
 "What to look for: A Pathway Insights signal pointing to a well characterized biological pathway (estrogen receptors, inflammatory cascades, dopamine signaling) is more interpretable than a purely empirical association. The mechanism column on each signal card indicates what pathway is implicated.",
 ],
 },
 {
 key: "community",
 title: "Community Forum Reports",
 oneLine: "Consistent treatment patterns reported across patient communities on Reddit.",
 paragraphs: [
 "Community Forum Reports is the arm that required the most internal debate, and it is the one that needs the clearest labeling: this is community signal, not clinical evidence. It is included because ignoring it would mean discarding a meaningful and systematically underrepresented source of information about what is actually happening to patients.",
 "Here is the problem this arm addresses: women often do not report positive side effects in clinical trials unless the trial is specifically designed to capture them. If you are enrolled in a statin trial and your periods improve, that is not a primary endpoint. It is not something the researchers are looking for, and it may not end up in the published data. But you might post about it on r/Endo. And if two hundred women do that over three years, it is a signal — imprecise, uncontrolled, but real.",
 "The pipeline searches subreddits specific to each condition (r/Endo, r/PCOS, r/PMDD, r/Menopause, r/adenomyosis, r/vulvodynia) for mentions of specific medications and treatments, using eight treatment focused search queries per subreddit. It stores individual post permalinks and groups citations by subreddit. The tool is not pulling anecdotes uncritically — it is looking for consistent patterns across many posts, which is different from a single person's experience.",
 "One early finding from this arm: Meloxicam, an NSAID, is mentioned consistently across multiple endometriosis communities as more effective for pelvic pain than standard ibuprofen. This is pharmacologically plausible (Meloxicam has a different COX inhibitor profile than ibuprofen), but there are very few formal studies on it specifically for endometriosis. That gap between community reported experience and formal research is exactly what this arm is designed to make visible.",
 "What to look for: Community signals that align with a mechanistically plausible hypothesis (the drug has a known biological reason to interact with the condition) are stronger candidates for follow-up than purely anecdotal patterns.",
 ],
 },
];

export default function SignalTypesAccordion() {
 const [activeKey, setActiveKey] = useState<string | null>(null);

 function toggle(key: string) {
 setActiveKey((prev) => (prev === key ? null : key));
 }

 return (
 <div className="space-y-3">
 {CARDS.map((card) => {
 const isActive = activeKey === card.key;
 return (
 <div
 key={card.key}
 style={{
 border: "1px solid #E0DDD8",
 borderLeft: isActive ? "3px solid #4D5E4D" : "1px solid #E0DDD8",
 backgroundColor: "#fff",
 transition: "border-left 0.15s ease",
 }}
 >
 <button
 onClick={() => toggle(card.key)}
 className="w-full text-left flex items-start justify-between gap-6 p-6 sm:p-8"
 aria-expanded={isActive}
 >
 <div className="flex-1 min-w-0">
 <h2
 className="font-heading text-xl font-bold mb-1.5"
 style={{ color: isActive ? "#4D5E4D" : "#1a1a1a" }}
 >
 {card.title}
 </h2>
 <p className="text-sm leading-relaxed" style={{ color: "#111" }}>
 {card.oneLine}
 </p>
 </div>
 <span
 className="shrink-0 text-lg font-light mt-0.5"
 style={{ color: "#4D5E4D", lineHeight: 1 }}
 aria-hidden="true"
 >
 {isActive ? "−" : "+"}
 </span>
 </button>

 {isActive && (
 <div
 className="px-6 sm:px-8 pb-8 space-y-4"
 style={{ borderTop: "1px solid #E0DDD8" }}
 >
 <div className="pt-6 space-y-4 text-sm leading-relaxed" style={{ color: "#111" }}>
 {card.paragraphs.map((p, i) => (
 <p key={i}>{p}</p>
 ))}
 </div>
 </div>
 )}
 </div>
 );
 })}
 </div>
 );
}
