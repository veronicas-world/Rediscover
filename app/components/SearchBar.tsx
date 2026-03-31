"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

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

// ── Search function ────────────────────────────────────────────────────────────

async function runSearch(query: string): Promise<Result[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // Build separate ilike filters — avoids edge-case issues with .or() and %
  const [conditionsRes, compoundsRes] = await Promise.all([
    supabase
      .from("conditions")
      .select("id, name, slug, description")
      .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
      .limit(4),
    supabase
      .from("compounds")
      .select("id, name, generic_name, drug_class")
      .or(`name.ilike.%${q}%,generic_name.ilike.%${q}%,drug_class.ilike.%${q}%`)
      .limit(6),
  ]);

  const conditions: ConditionResult[] = (conditionsRes.data ?? []).map((c) => ({
    type: "condition",
    ...c,
  }));

  const compoundRows = compoundsRes.data ?? [];

  // For each matched compound, look up which conditions have active signals
  const conditionsByCompound: Record<string, ConditionRef[]> = {};

  if (compoundRows.length > 0) {
    const ids = compoundRows.map((c) => c.id);

    // Each signal row has one condition (many-to-one FK). We collect all
    // distinct (compound_id → condition) pairs.
    const { data: signalRows } = await supabase
      .from("repurposing_signals")
      .select("compound_id, condition_id, conditions(id, name, slug)")
      .in("compound_id", ids)
      .eq("status", "active");

    for (const row of signalRows ?? []) {
      const cid = row.compound_id as string;
      // Supabase may return the embedded FK as an object or a single-element array
      const raw = row.conditions as unknown;
      const cond: ConditionRef | null = Array.isArray(raw)
        ? ((raw[0] as ConditionRef) ?? null)
        : (raw as ConditionRef | null);
      if (!cond?.id) continue;

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
    generic_name: c.generic_name ?? null,
    drug_class: c.drug_class ?? null,
    conditions: conditionsByCompound[c.id] ?? [],
  }));

  return [...conditions, ...compounds];
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface SearchBarProps {
  /** "sm" = compact nav variant  |  "lg" = large hero variant */
  size?: "sm" | "lg";
  onNavigate?: () => void; // called after navigation (e.g. to close a mobile menu)
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function SearchBar({ size = "sm", onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [searched, setSearched] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isLg = size === "lg";

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

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setQuery("");
      setResults([]);
      setSearched(false);
      router.push(path);
      onNavigate?.();
    },
    [router, onNavigate]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) {
      setResults([]);
      setOpen(false);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const hits = await runSearch(val.trim());
        setResults(hits);
        setSearched(true);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 220);
  }

  // Build a flat list of navigable items for keyboard nav
  function getNavigableItems(): { path: string }[] {
    const items: { path: string }[] = [];
    for (const r of results) {
      if (r.type === "condition") {
        items.push({ path: `/conditions/${r.slug}` });
      } else {
        if (r.conditions.length === 1) {
          items.push({ path: `/conditions/${r.conditions[0].slug}` });
        }
        for (const cond of r.conditions) {
          if (r.conditions.length > 1) {
            items.push({ path: `/conditions/${cond.slug}` });
          }
        }
      }
    }
    return items;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    const items = getNavigableItems();
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      navigate(items[activeIndex].path);
    }
  }

  const conditionResults = results.filter((r): r is ConditionResult => r.type === "condition");
  const compoundResults = results.filter((r): r is CompoundResult => r.type === "compound");

  return (
    <div
      ref={containerRef}
      className={`relative ${isLg ? "w-full max-w-xl" : "w-full"}`}
    >
      {/* Input */}
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: isLg ? "#999" : "rgba(255,255,255,0.5)" }}
        >
          <svg
            width={isLg ? 17 : 14}
            height={isLg ? 17 : 14}
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
          ref={inputRef}
          type="search"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searched && setOpen(true)}
          placeholder={isLg ? "Search conditions, drugs, drug classes…" : "Search…"}
          className={`w-full rounded transition focus:outline-none ${
            isLg ? "pl-10 pr-4 py-3 text-base" : "pl-8 pr-3 py-2 text-sm"
          }`}
          style={
            isLg
              ? {
                  border: "1px solid #D8D5CF",
                  backgroundColor: "#fff",
                  color: "#333",
                }
              : {
                  border: "1px solid rgba(255,255,255,0.2)",
                  backgroundColor: "rgba(255,255,255,0.12)",
                  color: "#fff",
                }
          }
        />
        {loading && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: isLg ? "#ccc" : "rgba(255,255,255,0.4)" }}
          >
            …
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && searched && (
        <div
          className="absolute z-50 mt-1.5 w-full bg-white rounded-lg overflow-hidden"
          style={{
            border: "1px solid #E0DDD8",
            boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
            minWidth: "260px",
          }}
        >
          {/* No results message */}
          {results.length === 0 && (
            <div className="px-4 py-4">
              <p className="text-sm font-medium mb-1" style={{ color: "#333" }}>
                No results found
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#999" }}>
                No signals for this compound yet. Database is continuously expanding.
              </p>
            </div>
          )}

          {/* Conditions section */}
          {conditionResults.length > 0 && (
            <div>
              <p
                className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#aaa" }}
              >
                Conditions
              </p>
              {conditionResults.map((r) => (
                <button
                  key={r.id}
                  onMouseDown={() => navigate(`/conditions/${r.slug}`)}
                  className="w-full text-left px-4 py-2.5 transition-colors"
                  style={{ color: "#1a1a1a" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "#F5F3EF")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <p className="text-sm font-medium">{r.name}</p>
                  {r.description && (
                    <p
                      className="text-xs mt-0.5 line-clamp-1"
                      style={{ color: "#999" }}
                    >
                      {r.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Compounds section */}
          {compoundResults.length > 0 && (
            <div
              style={
                conditionResults.length > 0
                  ? { borderTop: "1px solid #F0EDE8" }
                  : {}
              }
            >
              <p
                className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest"
                style={{ color: "#aaa" }}
              >
                Compounds / Drugs
              </p>
              {compoundResults.map((compound) => {
                const singleCondition =
                  compound.conditions.length === 1
                    ? compound.conditions[0]
                    : null;

                return (
                  <div key={compound.id}>
                    {/* Compound row — clickable if it maps to exactly one condition */}
                    {singleCondition ? (
                      <button
                        onMouseDown={() =>
                          navigate(`/conditions/${singleCondition.slug}`)
                        }
                        className="w-full text-left px-4 pt-2.5 pb-1 transition-colors"
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#F5F3EF")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = "transparent")
                        }
                      >
                        <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
                          {compound.name}
                        </p>
                        {(compound.generic_name || compound.drug_class) && (
                          <p className="text-xs mt-0.5" style={{ color: "#999" }}>
                            {[compound.generic_name, compound.drug_class]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                        <p className="text-xs mt-1" style={{ color: "#4D5E4D" }}>
                          → {singleCondition.name}
                        </p>
                      </button>
                    ) : (
                      <div className="px-4 pt-2.5 pb-1">
                        <p className="text-sm font-medium" style={{ color: "#1a1a1a" }}>
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
                    )}

                    {/* Condition sub-links */}
                    {compound.conditions.length > 1 && (
                      <div className="pb-1.5">
                        {compound.conditions.map((cond) => (
                          <button
                            key={cond.id}
                            onMouseDown={() =>
                              navigate(`/conditions/${cond.slug}`)
                            }
                            className="w-full text-left flex items-center gap-2 pl-7 pr-4 py-1.5 transition-colors"
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor = "#F5F3EF")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                            }
                          >
                            <svg
                              width="9"
                              height="9"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ color: "#bbb", flexShrink: 0 }}
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                            <span className="text-xs" style={{ color: "#4D5E4D" }}>
                              {cond.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* No signals yet */}
                    {compound.conditions.length === 0 && (
                      <p
                        className="pl-4 pr-4 pb-3 text-xs leading-relaxed"
                        style={{ color: "#999" }}
                      >
                        No signals for this compound yet.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Spacer at bottom */}
          <div className="h-1.5" />
        </div>
      )}
    </div>
  );
}
