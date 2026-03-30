"use client";

import { useState } from "react";
import Link from "next/link";

interface Condition {
  id: string;
  name: string;
  slug: string;
  prevalence_summary: string | null;
  treatment_gap_summary: string | null;
}

export default function ConditionsList({ conditions }: { conditions: Condition[] }) {
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filtered =
    q.length < 2
      ? conditions
      : conditions.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.prevalence_summary?.toLowerCase().includes(q) ||
            c.treatment_gap_summary?.toLowerCase().includes(q)
        );

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-6">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#999" }}>
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="9" r="6" />
            <line x1="14.5" y1="14.5" x2="19" y2="19" />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search conditions, symptoms, or treatment gaps…"
          className="w-full max-w-lg rounded-md pl-9 pr-4 py-2.5 text-sm transition focus:outline-none"
          style={{
            border: "1px solid #E0DDD8",
            backgroundColor: "#fff",
            color: "#333",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#7A8B7A")}
          onBlur={(e) => (e.target.style.borderColor = "#E0DDD8")}
        />
      </div>

      {/* Count */}
      <p className="text-sm mb-8" style={{ color: "#999" }}>
        {filtered.length} condition{filtered.length !== 1 ? "s" : ""} found
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm italic" style={{ color: "#999" }}>No conditions match your search.</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((condition) => (
            <Link
              key={condition.id}
              href={`/conditions/${condition.slug}`}
              className="group block bg-white rounded-xl p-6 transition-all hover:shadow-sm"
              style={{ border: "1px solid #E0DDD8" }}
            >
              <h2
                className="font-heading text-lg font-bold mb-4 group-hover:opacity-75 transition-opacity"
                style={{ color: "#333" }}
              >
                {condition.name}
              </h2>

              {condition.prevalence_summary && (
                <div className="mb-3">
                  <p
                    className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                    style={{ color: "#999" }}
                  >
                    Prevalence
                  </p>
                  <p
                    className="text-sm leading-relaxed line-clamp-2"
                    style={{ color: "#666" }}
                  >
                    {condition.prevalence_summary}
                  </p>
                </div>
              )}

              {condition.treatment_gap_summary && (
                <div className="mb-4">
                  <p
                    className="text-[10px] uppercase tracking-widest font-semibold mb-1"
                    style={{ color: "#999" }}
                  >
                    Treatment Gap
                  </p>
                  <p
                    className="text-sm leading-relaxed line-clamp-2"
                    style={{ color: "#666" }}
                  >
                    {condition.treatment_gap_summary}
                  </p>
                </div>
              )}

              <p className="text-xs font-medium mt-4" style={{ color: "#7A8B7A" }}>
                View Research Signals →
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
