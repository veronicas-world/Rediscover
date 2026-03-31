"use client";

import { useState } from "react";
import Link from "next/link";

function FlaskIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 3h6" />
      <path d="M9 3v6.5L5.2 16A2 2 0 007 19h10a2 2 0 001.8-2.6L15 9.4V3" />
      <path d="M6.5 15h11" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="9" r="6" />
      <line x1="14.5" y1="14.5" x2="19" y2="19" />
    </svg>
  );
}

export default function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40" style={{ backgroundColor: "#4D5E4D" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white shrink-0"
          onClick={() => setMobileOpen(false)}
        >
          <FlaskIcon />
          <span className="font-heading text-base sm:text-lg font-bold tracking-tight">
            ReDiscover Women
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-7 text-sm font-medium">
          <Link
            href="/conditions"
            className="transition-opacity hover:opacity-75"
            style={{ color: "rgba(255,255,255,0.92)" }}
          >
            Browse Conditions
          </Link>
          <Link
            href="/conditions"
            className="flex items-center gap-1.5 transition-opacity hover:opacity-75"
            style={{ color: "rgba(255,255,255,0.75)" }}
          >
            <SearchIcon />
            <span>Search</span>
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col gap-1.5 p-2 text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span
            className="block w-5 h-px bg-white transition-all duration-200"
            style={{
              transform: mobileOpen ? "translateY(5px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block w-5 h-px bg-white transition-all duration-200"
            style={{ opacity: mobileOpen ? 0 : 1 }}
          />
          <span
            className="block w-5 h-px bg-white transition-all duration-200"
            style={{
              transform: mobileOpen ? "translateY(-5px) rotate(-45deg)" : "none",
            }}
          />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="sm:hidden"
          style={{ backgroundColor: "#3E4E3E", borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <nav className="flex flex-col px-4 py-4 gap-1">
            <Link
              href="/conditions"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-3 text-sm font-medium text-white border-b"
              style={{ borderColor: "rgba(255,255,255,0.1)" }}
            >
              Browse Conditions
            </Link>
            <Link
              href="/conditions"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-3 text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.75)" }}
            >
              <SearchIcon />
              Search
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 py-3 text-sm font-medium"
              style={{ color: "rgba(255,255,255,0.6)" }}
            >
              About
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
