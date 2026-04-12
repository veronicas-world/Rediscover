"use client";

import { useState } from"react";

interface Compound {
 id: string;
 name: string;
 generic_name: string | null;
 drug_class: string | null;
}

export default function NoSignalsDisclosure({ compounds }: { compounds: Compound[] }) {
 const [open, setOpen] = useState(false);

 if (compounds.length === 0) return null;

 return (
 <div className="mt-8">
 <button
 onClick={() => setOpen((v) => !v)}
 className="flex items-center gap-2 text-sm font-medium mb-2 transition-opacity hover:opacity-70"
 style={{ color:"#111" }}
 >
 <svg
 width="12"
 height="12"
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2.5"
 strokeLinecap="round"
 strokeLinejoin="round"
 style={{ transition:"transform 0.15s", transform: open ?"rotate(90deg)" :"none", flexShrink: 0 }}
 >
 <polyline points="9 18 15 12 9 6" />
 </svg>
 In Database: No Signals Yet ({compounds.length})
 </button>

 {open && (
 <div>
 <p className="text-xs mb-4" style={{ color:"#111" }}>
 These compounds matched your search but have no repurposing signals identified yet.
 </p>
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {compounds.map((c) => (
 <div key={c.id} className="bg-white p-5 sm:p-6" style={{ border:"1px solid #E8E5E0" }}>
 <p className="font-heading text-lg font-bold mb-1" style={{ color:"#111" }}>{c.name}</p>
 {(c.generic_name || c.drug_class) && (
 <p className="text-xs" style={{ color:"#111" }}>
 {[c.generic_name, c.drug_class].filter(Boolean).join(" ·")}
 </p>
 )}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
