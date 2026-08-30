import type { MetadataRoute } from "next";
import { directory } from "@/config/directory";
import { canonical } from "@/lib/seo/canonical";
import {
  categoryIndexDecision,
  legalIndexDecision,
  listingIndexDecision,
} from "@/lib/seo/indexability";

/**
 * Building the sitemap is separated from fetching the rows so the rule can
 * be tested without a database — and so the rule is visibly the same one
 * the pages use. `app/sitemap.ts` is the thin half: it queries, then calls
 * this.
 *
 * Nothing here is hardcoded. `lastModified` comes from the row's
 * `updatedAt`, never from a constant someone has to remember to bump —
 * a hand-maintained timestamp is accurate exactly until the first time it
 * is forgotten, and then it lies silently.
 */

export type SitemapListing = {
  slug: string;
  status: string;
  shortDescription: string | null;
  description: string | null;
  updatedAt: Date;
};

export type SitemapCategory = {
  slug: string;
  published: boolean;
  listingCount: number;
  updatedAt: Date;
};

export type SitemapInput = {
  listings: SitemapListing[];
  categories: SitemapCategory[];
  /** Newest listing update, used as the homepage's lastModified. */
  lastContentUpdate?: Date;
};

export function buildSitemap({
  listings,
  categories,
  lastContentUpdate,
}: SitemapInput): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    {
      url: canonical("/"),
      lastModified: lastContentUpdate,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: canonical("/directory"),
      lastModified: lastContentUpdate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: canonical("/categories"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  if (directory.features.suggestions) {
    entries.push({
      url: canonical("/suggest"),
      changeFrequency: "yearly",
      priority: 0.2,
    });
  }

  // Legal pages enter the sitemap only once their text exists — the same
  // condition that makes them indexable, read from the same function.
  for (const [path, body] of [
    ["/terms", directory.legal.terms],
    ["/privacy", directory.legal.privacy],
  ] as const) {
    if (!legalIndexDecision(body).index) continue;
    entries.push({
      url: canonical(path),
      changeFrequency: "yearly",
      priority: 0.2,
    });
  }

  for (const category of categories) {
    if (!categoryIndexDecision(category).index) continue;
    entries.push({
      url: canonical(`/category/${category.slug}`),
      lastModified: category.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  for (const listing of listings) {
    if (!listingIndexDecision(listing).index) continue;
    entries.push({
      url: canonical(`/directory/${listing.slug}`),
      lastModified: listing.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  return entries;
}
