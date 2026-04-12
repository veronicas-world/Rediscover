"use client";

import { useState, useEffect, useRef } from"react";
import Link from"next/link";
import { supabase } from"@/lib/supabase";

interface Condition {
 id: string;
 name: string;
 slug: string;
}

interface ConditionResult {
 type:"condition";
 id: string;
 name: string;
 slug: string;
}

interface CompoundResult {
 type:"compound";
 id: string;
 name: string;
 generic_name: string | null;
 drug_class: string | null;
 conditions: { id: string; name: string; slug: string }[];
}

interface SignalResult {
 type:"signal";
 id: string;
 summary: string;
 condition: { id: string; name: string; slug: string };
}

type SearchResult = ConditionResult | CompoundResult | SignalResult;

async function runSearch(query: string): Promise<SearchResult[]> {
 const q = query.trim();
 if (q.length < 2) return [];

 const [conditionsRes, compoundsRes, signalsRes] = await Promise.all([
 supabase
 .from("conditions")
 .select("id, name, slug")
 .or(`name.ilike.%${q}%,description.ilike.%${q}%,biology_summary.ilike.%${q}%`)
 .limit(5),

 supabase
 .from("compounds")
 .select("id, name, generic_name, drug_class")
 .or(`name.ilike.%${q}%,generic_name.ilike.%${q}%,drug_class.ilike.%${q}%,mechanism_of_action.ilike.%${q}%`)
 .limit(6),

 supabase
 .from("repurposing_signals")
 .select("id, summary, conditions(id, name, slug)")
 .or(`summary.ilike.%${q}%,mechanism_hypothesis.ilike.%${q}%`)
 .eq("status","active")
 .limit(5),
 ]);

 console.log("[conditions search] query:", q);
 console.log("[conditions search] conditions →", conditionsRes.data,"| error:", conditionsRes.error?.message);
 console.log("[conditions search] compounds →", compoundsRes.data,"| error:", compoundsRes.error?.message);
 console.log("[conditions search] signals →", signalsRes.data,"| error:", signalsRes.error?.message);

 const conditions: ConditionResult[] = (conditionsRes.data ?? []).map((c) => ({
 type:"condition",
 id: c.id,
 name: c.name,
 slug: c.slug,
 }));

 const compoundRows = compoundsRes.data ?? [];
 const conditionsByCompound: Record<string, { id: string; name: string; slug: string }[]> = {};

 if (compoundRows.length > 0) {
 const { data: signalRows, error: signalLinkErr } = await supabase
 .from("repurposing_signals")
 .select("compound_id, conditions(id, name, slug)")
 .in("compound_id", compoundRows.map((c) => c.id))
 .eq("status","active");

 console.log("[conditions search] compound→condition links →", signalRows,"| error:", signalLinkErr?.message);

 for (const row of signalRows ?? []) {
 const cid = row.compound_id as string;
 const raw = row.conditions as unknown;
 const cond = (Array.isArray(raw) ? raw[0] : raw) as { id: string; name: string; slug: string } | null;
 if (!cond?.id) continue;
 if (!conditionsByCompound[cid]) conditionsByCompound[cid] = [];
 if (!conditionsByCompound[cid].some((c) => c.id === cond.id)) {
 conditionsByCompound[cid].push(cond);
 }
 }
 }

 const compounds: CompoundResult[] = compoundRows.map((c) => ({
 type:"compound",
 id: c.id,
 name: c.name,
 generic_name: c.generic_name ?? null,
 drug_class: c.drug_class ?? null,
 conditions: conditionsByCompound[c.id] ?? [],
 }));

 const signalMap = new Map<string, SignalResult>();
 for (const row of signalsRes.data ?? []) {
 const raw = row.conditions as unknown;
 const cond = (Array.isArray(raw) ? raw[0] : raw) as { id: string; name: string; slug: string } | null;
 if (!cond?.id) continue;
 if (!signalMap.has(row.id)) {
 signalMap.set(row.id, {
 type:"signal",
 id: row.id,
 summary: row.summary,
 condition: cond,
 });
 }
 }
 const signals = Array.from(signalMap.values());

 return [...conditions, ...compounds, ...signals];
}

export default function ConditionsList({ conditions }: { conditions: Condition[] }) {
 const [query, setQuery] = useState("");
 const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
 const [loading, setLoading] = useState(false);
 const [searched, setSearched] = useState(false);
 const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 const isSearching = query.trim().length >= 2;

 useEffect(() => {
 if (debounceRef.current) clearTimeout(debounceRef.current);

 if (query.trim().length < 2) {
 setSearchResults([]);
 setSearched(false);
 return;
 }

 debounceRef.current = setTimeout(async () => {
 setLoading(true);
 try {
 const hits = await runSearch(query.trim());
 setSearchResults(hits);
 setSearched(true);
 } finally {
 setLoading(false);
 }
 }, 220);

 return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
 }, [query]);

 const conditionResults = searchResults.filter((r): r is ConditionResult => r.type ==="condition");
 const compoundResults = searchResults.filter((r): r is CompoundResult => r.type ==="compound");
 const signalResults = searchResults.filter((r): r is SignalResult => r.type ==="signal");

 return (
 <div>
 {/* Search bar */}
 <div className="relative mb-8 max-w-lg">
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color:"#111" }}>
 <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <circle cx="9" cy="9" r="6" />
 <line x1="14.5" y1="14.5" x2="19" y2="19" />
 </svg>
 </span>
 <input
 type="search"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 placeholder="Search conditions, symptoms, or medications…"
 className="w-full pl-10 pr-4 py-3 text-sm transition focus:outline-none"
 style={{ border:"1px solid #D8D5CF", backgroundColor:"#fff", color:"#333" }}
 onFocus={(e) => (e.target.style.borderColor ="#4D5E4D")}
 onBlur={(e) => (e.target.style.borderColor ="#D8D5CF")}
 />
 {loading && (
 <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs" style={{ color:"#111" }}>…</span>
 )}
 </div>

 {/* Not searching: show full conditions grid */}
 {!isSearching && (
 <>
 <p className="text-sm mb-8" style={{ color:"#111" }}>
 {conditions.length} condition{conditions.length !== 1 ?"s" :""}
 </p>
 <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
 {conditions.map((condition) => (
 <Link
 key={condition.id}
 href={`/conditions/${condition.slug}`}
 className="group block bg-white p-6 sm:p-8 transition-shadow hover:shadow-md"
 style={{ border:"1px solid #E0DDD8", borderRadius:"0", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}
 >
 <h2
 className="font-heading text-xl mb-4 group-hover:opacity-75 transition-opacity"
 style={{ color:"#1a1a1a" }}
 >
 {condition.name}
 </h2>
 <p className="text-sm font-semibold" style={{ color:"#4D5E4D" }}>
 View research signals
 </p>
 </Link>
 ))}
 </div>
 </>
 )}

 {/* Searching: show grouped results */}
 {isSearching && searched && searchResults.length === 0 && (
 <p className="text-sm" style={{ color:"#111" }}>No results for &ldquo;{query}&rdquo;.</p>
 )}

 {isSearching && searched && searchResults.length > 0 && (
 <div className="space-y-10">

 {/* Conditions */}
 {conditionResults.length > 0 && (
 <div>
 <p className="section-label mb-5">
 Conditions
 </p>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {conditionResults.map((r) => (
 <Link
 key={r.id}
 href={`/conditions/${r.slug}`}
 className="group block bg-white p-6 transition-shadow hover:shadow-md"
 style={{ border:"1px solid #E0DDD8", borderRadius:"0", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}
 >
 <h2 className="font-heading text-lg mb-3 group-hover:opacity-75 transition-opacity" style={{ color:"#1a1a1a" }}>
 {r.name}
 </h2>
 <p className="text-sm font-medium" style={{ color:"#4D5E4D" }}>{"View Research Signals →︎"}</p>
 </Link>
 ))}
 </div>
 </div>
 )}

 {/* Medications */}
 {compoundResults.length > 0 && (
 <div>
 <p className="section-label mb-5">
 Medications
 </p>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {compoundResults.map((r) => (
 <div key={r.id} className="bg-white p-6" style={{ border:"1px solid #E0DDD8", borderRadius:"0", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}>
 <p className="font-heading text-xl font-bold mb-1" style={{ color:"#1a1a1a" }}>{r.name}</p>
 {(r.generic_name || r.drug_class) && (
 <p className="text-xs mb-3" style={{ color:"#111" }}>
 {[r.generic_name, r.drug_class].filter(Boolean).join(" ·")}
 </p>
 )}
 {r.conditions.length > 0 ? (
 <div className="space-y-1.5 mt-3">
 {r.conditions.map((cond) => (
 <Link
 key={cond.id}
 href={`/conditions/${cond.slug}`}
 className="block text-sm font-medium transition-opacity hover:opacity-70"
 style={{ color:"#4D5E4D" }}
 >
 {"→︎"} {cond.name}
 </Link>
 ))}
 </div>
 ) : (
 <p className="text-xs mt-3" style={{ color:"#111" }}>No active signals yet.</p>
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Signals */}
 {signalResults.length > 0 && (
 <div>
 <p className="section-label mb-5">
 Signals
 </p>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {signalResults.map((r) => (
 <Link
 key={r.id}
 href={`/conditions/${r.condition.slug}`}
 className="group block bg-white p-6 transition-shadow hover:shadow-md"
 style={{ border:"1px solid #E0DDD8", borderRadius:"0", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" }}
 >
 <p className="text-sm leading-relaxed mb-3 line-clamp-3" style={{ color:"#444" }}>{r.summary}</p>
 <p className="text-sm font-medium group-hover:opacity-75 transition-opacity" style={{ color:"#4D5E4D" }}>
 {"→︎"} {r.condition.name}
 </p>
 </Link>
 ))}
 </div>
 </div>
 )}

 </div>
 )}
 </div>
 );
}
