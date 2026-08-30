import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { buildSitemap } from "@/lib/seo/sitemap";
import { getCategoriesWithCounts } from "@/lib/listings";

/**
 * The thin half. Fetch rows, hand them to `buildSitemap`, which applies the
 * same indexability decision the pages use.
 *
 * There is no try/catch. A sitemap that silently returns fewer URLs when
 * the database is unreachable is worse than one that fails the build: the
 * first ships a truncated sitemap to Google and looks fine, the second
 * tells you immediately.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, categories] = await Promise.all([
    prisma.listing.findMany({
      select: {
        slug: true,
        status: true,
        shortDescription: true,
        description: true,
        updatedAt: true,
      },
    }),
    getCategoriesWithCounts({ includeUnpublished: true }),
  ]);

  const categoryRows = await prisma.category.findMany({
    select: { slug: true, updatedAt: true },
  });
  const updatedBySlug = new Map(
    categoryRows.map((row) => [row.slug, row.updatedAt]),
  );

  const lastContentUpdate = listings.reduce<Date | undefined>(
    (latest, listing) =>
      !latest || listing.updatedAt > latest ? listing.updatedAt : latest,
    undefined,
  );

  return buildSitemap({
    listings,
    categories: categories.map((category) => ({
      slug: category.slug,
      published: category.published,
      listingCount: category.listingCount,
      updatedAt: updatedBySlug.get(category.slug) ?? new Date(),
    })),
    lastContentUpdate,
  });
}
