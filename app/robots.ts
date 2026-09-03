import type { MetadataRoute } from "next";

/**
 * While SIGNALS_PUBLISHED is false, the site is in a pre-publication state:
 * signal-rendering routes show a ComingSoon placeholder and the sitemap
 * still lists gated URLs that return thin content. Disallow all crawling
 * until the flag flips to true, then change back to allow: "/".
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
    sitemap: "https://whel.bio/sitemap.xml",
  };
}
