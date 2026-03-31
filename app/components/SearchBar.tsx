"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface ConditionResult {
  type: "condition";
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface ConditionRef {
  id: string;
  name: string;
  slug: string;
}

interface CompoundResult {
  type: "compound";
  id: string;
  name: string;
  generic_name: string | null;
  drug_class: string | null;
  conditions: ConditionRef[];
}

type Result = ConditionResult | CompoundResult;

async function runSearch(query: string): Promise<Result[]> {
  const q = `%${query}%`;

  const [conditionsRes, compoundsRes] = await Promise.all([
    supabase
      .from("conditions")
      .select("id, name, slug, description")
      .or(`name.ilike.${q},description.ilike.${q}`)
      .limit(4),
    supabase
      .from("compounds")
      .select("id, name, generic_name, drug_class")
      .or(`name.ilike.${q},generic_name.ilike.${q},drug_class.ilike.${q}`)
      .limit(5),
  ]);

  const conditions: ConditionResult[] = (conditionsRes.data ?? []).map((c) => ({
    type: "condition",
    ...c,
  }));

  const compoundRows = compoundsRes.data ?? [];

  // Fetch which conditions have signals for the matched compounds, in one query
  const conditionsByCompound: Record<string, ConditionRef[]> = {};
  if (compoundRows.length > 0) {
    const ids = compoundRows.map((c) => c.id);
    const signalsRes = await supabase
      .from("repurposing_signals")
      .select("compound_id, conditions(id, name, slug)")
      .in("compound_id", ids)
      .eq("status", "active");

    for (const row of signalsRes.data ?? []) {
      const cid = row.compound_id as string;
      // Supabase returns embedded relations as array or object depending on cardinality;
      // cast through unknown to handle either shape.
      const raw = row.conditions as unknown;
      const cond: ConditionRef | null = Array.isArray(raw) ? (raw[0] ?? null) : (raw as ConditionRef | null);
      if (!cond) continue;
      if (!conditionsByCompound[cid]) conditionsByCompound[cid] = [];
      if (!conditionsByCompound[cid].some((c) => c.id === cond.id)) {
        conditionsByCompound[cid].push(cond);
      }
    }
  }

  const compounds: CompoundResult[] = compoundRows.map((c) => ({
    type: "compound",
    id: c.id,
    name: c.name,
    generic_name: c.generic_name,
    drug_class: c.drug_class,
    conditions: conditionsByCompound[c.id] ?? [],
  }));

  return [...conditions, ...compounds];
}

interface SearchBarProps {
  size?: "sm" | "lg";
}

export default function SearchBar({ size = "sm" }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const hits = await runSearch(val.trim());
      setResults(hits);
      setOpen(true);
      setLoading(false);
    }, 220);
  }

  function navigateToCondition(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(`/conditions/${slug}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") setOpen(false);
  }

  const conditionResults = results.filter((r): r is ConditionResult => r.type === "condition");
  const compoundResults  = results.filter((r): r is CompoundResult  => r.type === "compound");
  const hasResults = results.length > 0;

  const isLg = size === "lg";

  return (
    <div ref={containerRef} className={`relative ${isLg ? "w-full max-w-xl" : "w-56 sm:w-72"}`}>
      {/* Input */}
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "#999" }}
        >
          <svg
            width={isLg ? 18 : 15}
            height={isLg ? 18 : 15}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="9" cy="9" r="6" />
            <line x1="14.5" y1="14.5" x2="19" y2="19" />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={isLg ? "Search conditions, drugs, drug classes…" : "Search…"}
          className={`
            w-full rounded-md transition focus:outline-none
            ${isLg ? "pl-10 pr-4 py-3 text-base" : "pl-8 pr-3 py-2 text-sm"}
          `}
          style={{
            border: "1px solid #E0DDD8",
            backgroundColor: "#fff",
            color: "#333",
          }}
        />
        {loading && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "#ccc" }}
          >
            …
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1 w-full bg-white rounded-xl overflow-hidden shadow-lg"
          style={{ border: "1px solid #E0DDD8" }}
        >
          {!hasResults ? (
            <p className="px-4 py-3 text-sm" style={{ color: "#999" }}>
              No results found.
            </p>
          ) : (
            <div>
              {/* Conditions section */}
              {conditionResults.length > 0 && (
                <div>
                  <p
                    className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "#999" }}
                  >
                    Conditions
                  </p>
                  {conditionResults.map((r) => (
                    <button
                      key={r.id}
                      onMouseDown={() => navigateToCondition(r.slug)}
                      className="w-full text-left px-4 py-2.5 transition-colors"
                      style={{ color: "#333" }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F3EF")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <p className="text-sm font-medium">{r.name}</p>
                      {r.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "#999" }}>
                          {r.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Compounds section */}
              {compoundResults.length > 0 && (
                <div style={conditionResults.length > 0 ? { borderTop: "1px solid #F0EDE8" } : {}}>
                  <p
                    className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "#999" }}
                  >
                    Compounds
                  </p>
                  {compoundResults.map((compound) => (
                    <div key={compound.id}>
                      {/* Compound header — not a nav target itself */}
                      <div className="px-4 pt-2 pb-1">
                        <p className="text-sm font-medium" style={{ color: "#333" }}>
                          {compound.name}
                        </p>
                        {(compound.generic_name || compound.drug_class) && (
                          <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                            {[compound.generic_name, compound.drug_class]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>

                      {/* Condition sub-links */}
                      {compound.conditions.length > 0 ? (
                        <div className="pb-1.5">
                          {compound.conditions.map((cond) => (
                            <button
                              key={cond.id}
                              onMouseDown={() => navigateToCondition(cond.slug)}
                              className="w-full text-left flex items-center gap-2 pl-7 pr-4 py-1.5 transition-colors"
                              style={{ color: "#5C6B5D" }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F5F3EF")}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="shrink-0"
                                style={{ color: "#aaa" }}
                              >
                                <polyline points="9 18 15 12 9 6" />
                              </svg>
                              <span className="text-xs">{cond.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="pl-7 pr-4 pb-2.5 text-xs" style={{ color: "#bbb" }}>
                          No signals indexed yet
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
