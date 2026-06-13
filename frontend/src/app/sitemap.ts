import type { MetadataRoute } from "next";

import { absoluteUrl, site } from "@/lib/site";

const sitemapRoutes = [
  site.routes.home,
  site.routes.renters,
  site.routes.landlords,
  site.routes.howItWorks,
  site.routes.privacy,
  site.routes.terms,
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapRoutes.map((route) => ({
    url: absoluteUrl(route),
    lastModified: new Date("2026-06-13"),
    changeFrequency: route === site.routes.home ? "weekly" : "monthly",
    priority: route === site.routes.home ? 1 : 0.8,
  }));
}
