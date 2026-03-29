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

interface CompoundResult {
  type: "compound";
  id: string;
  name: string;
  generic_name: string | null;
  drug_class: string | null;
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
      .limit(4),
  ]);

  const conditions: ConditionResult[] = (conditionsRes.data ?? []).map((c) => ({
    type: "condition",
    ...c,
  }));

  const compounds: CompoundResult[] = (compoundsRes.data ?? []).map((c) => ({
    type: "compound",
    ...c,
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

  // Close on outside click
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

  function navigate(result: Result) {
    setOpen(false);
    setQuery("");
    if (result.type === "condition") {
      router.push(`/conditions/${result.slug}`);
    } else {
      router.push("/conditions");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const conditions = results.filter((r): r is ConditionResult => r.type === "condition");
  const compounds = results.filter((r): r is CompoundResult => r.type === "compound");
  const hasResults = results.length > 0;

  const isLg = size === "lg";

  return (
    <div ref={containerRef} className={`relative ${isLg ? "w-full max-w-xl" : "w-56 sm:w-72"}`}>
      {/* Input */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
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
            w-full rounded-md border border-slate-200 bg-white text-slate-900
            placeholder-slate-400 focus:outline-none focus:border-blue-300
            focus:ring-1 focus:ring-blue-100 transition
            ${isLg ? "pl-10 pr-4 py-3 text-base" : "pl-8 pr-3 py-1.5 text-sm"}
          `}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-xs">
            …
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-slate-400">No results found.</p>
          ) : (
            <div>
              {conditions.length > 0 && (
                <div>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Conditions
                  </p>
                  {conditions.map((r) => (
                    <button
                      key={r.id}
                      onMouseDown={() => navigate(r)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900">{r.name}</p>
                      {r.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {r.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {compounds.length > 0 && (
                <div className={conditions.length > 0 ? "border-t border-slate-100" : ""}>
                  <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                    Compounds
                  </p>
                  {compounds.map((r) => (
                    <button
                      key={r.id}
                      onMouseDown={() => navigate(r)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-slate-900">{r.name}</p>
                      {(r.generic_name || r.drug_class) && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[r.generic_name, r.drug_class].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="px-4 py-2 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  {compounds.length > 0
                    ? "Compound results link to the conditions list."
                    : null}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
