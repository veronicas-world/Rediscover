import type { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { getCandidates } from "@/lib/substrate-candidates";

/**
 * Data-driven sitemap: every public page the site intends to be indexed.
 * Redirect stubs for superseded URLs and the private _team folder are
 * deliberately absent. The drill-downs are the reference index — the whole
 * point of open-to-read access — so each signal id is listed.
 */
const BASE = "https://whel.bio";

const STATIC_ROUTES = [
  "",
  "/platform",
  "/conditions",
  "/candidates",
  "/signal-types",
  "/search",
  "/manifesto",
  "/about",
  "/about/roadmap",
  "/about/contact",
  "/about/technical-architecture",
  "/about/what-we-count",
  "/about/external-references",
  "/about/methodology",
  "/about/methodology/changelog",
  "/access",
  "/featured",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [{ data: conditionsRaw }, candidates] = await Promise.all([
    supabase.from("conditions").select("slug").order("name"),
    getCandidates(),
  ]);

  return [
    ...STATIC_ROUTES.map((p) => ({
      url: `${BASE}${p}`,
      changeFrequency: "monthly" as const,
      priority: p === "" ? 1 : 0.7,
    })),
    ...(conditionsRaw ?? []).map((c) => ({
      url: `${BASE}/conditions/${c.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...candidates.map((c) => ({
      url: `${BASE}/access/preview/${c.signalId}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
