import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { directory } from "@/config/directory";
import {
  CATEGORY_AXES,
  CATEGORY_AXIS_LABELS,
  type CategoryAxis,
} from "@/lib/validation";

/**
 * Every read the site performs, in one file.
 *
 * Pages do not talk to Prisma directly. That is not ceremony — it is what
 * makes "published" mean one thing. `PUBLISHED_ONLY` appears here and
 * nowhere else, so a draft listing cannot leak onto a page because one
 * route forgot the filter.
 *
 * Search is `LIKE` against SQLite. That is a deliberate ceiling: it is
 * fine to a few thousand rows, needs no service, no index to keep warm and
 * no API key. If a directory outgrows it, the fix is an FTS5 virtual table
 * in the same database, not a third-party search vendor.
 *
 * (SQLite's `LIKE` is already case-insensitive for ASCII, which is why
 * there is no `mode: "insensitive"` here — Prisma does not support it on
 * SQLite, and it is not needed.)
 */

const PUBLISHED_ONLY = { status: "PUBLISHED" } as const;

/** Everything a listing card needs, and nothing else. */
export const listingCardSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  logoUrl: true,
  country: true,
  city: true,
  featured: true,
  verified: true,
  categories: {
    select: { category: { select: { name: true, slug: true } } },
  },
} satisfies Prisma.ListingSelect;

export type ListingCard = Prisma.ListingGetPayload<{
  select: typeof listingCardSelect;
}>;

export type ListingDetail = NonNullable<
  Awaited<ReturnType<typeof getListingBySlug>>
>;

export type DirectoryQuery = {
  q?: string;
  category?: string;
  country?: string;
  page?: number;
};

function searchWhere(query: DirectoryQuery): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { ...PUBLISHED_ONLY };

  const term = query.q?.trim();
  if (term) {
    where.OR = [
      { name: { contains: term } },
      { shortDescription: { contains: term } },
      { categories: { some: { category: { name: { contains: term } } } } },
      ...(directory.features.tags
        ? [{ tags: { some: { tag: { name: { contains: term } } } } }]
        : []),
    ];
  }

  if (query.category) {
    where.categories = { some: { category: { slug: query.category } } };
  }

  if (query.country && directory.features.locations) {
    where.country = query.country;
  }

  return where;
}

export type DirectoryPage = {
  listings: ListingCard[];
  total: number;
  page: number;
  pageCount: number;
};

export async function getDirectoryPage(
  query: DirectoryQuery,
): Promise<DirectoryPage> {
  const perPage = directory.listingsPerPage;
  const where = searchWhere(query);
  const page = Math.max(1, query.page ?? 1);

  const [total, listings] = await Promise.all([
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      select: listingCardSelect,
      // Featured first, then alphabetical. `name` breaks the tie so the
      // order is stable across requests — an unstable sort makes page 2
      // silently repeat or skip rows.
      orderBy: [{ featured: "desc" }, { name: "asc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return {
    listings,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getListingBySlug(slug: string) {
  return prisma.listing.findFirst({
    where: { slug, ...PUBLISHED_ONLY },
    include: {
      categories: {
        select: { category: { select: { name: true, slug: true } } },
      },
      tags: { select: { tag: { select: { name: true, slug: true } } } },
      sources: {
        select: { url: true, label: true, checkedAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

/** Used by /claim/[slug], which must work for a listing in any state. */
export async function listingExists(slug: string): Promise<boolean> {
  const found = await prisma.listing.findUnique({
    where: { slug },
    select: { id: true },
  });
  return found !== null;
}

/**
 * Other listings in the same categories.
 *
 * Falls back to nothing rather than to "any published listing": a related
 * block padded with unrelated rows is worse than an absent one, and it
 * dilutes the internal linking the category pages are doing properly.
 */
export async function getRelatedListings(
  listingId: string,
  categorySlugs: string[],
  limit = 4,
): Promise<ListingCard[]> {
  if (categorySlugs.length === 0) return [];

  return prisma.listing.findMany({
    where: {
      ...PUBLISHED_ONLY,
      id: { not: listingId },
      categories: { some: { category: { slug: { in: categorySlugs } } } },
    },
    select: listingCardSelect,
    orderBy: [{ featured: "desc" }, { name: "asc" }],
    take: limit,
  });
}

export type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  axis: string;
  published: boolean;
  sortOrder: number;
  listingCount: number;
};

/**
 * Categories with their published-listing counts.
 *
 * The count is what `categoryIndexDecision` thresholds on, so it has to
 * count the same rows the category page will actually render — published
 * only. Counting every listing would let a category full of drafts look
 * healthy to the sitemap and empty to a visitor.
 */
export async function getCategoriesWithCounts(options?: {
  includeUnpublished?: boolean;
}): Promise<CategoryWithCount[]> {
  const categories = await prisma.category.findMany({
    where: options?.includeUnpublished ? {} : { published: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      axis: true,
      published: true,
      sortOrder: true,
      _count: { select: { listings: { where: { listing: PUBLISHED_ONLY } } } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map(({ _count, ...category }) => ({
    ...category,
    listingCount: _count.listings,
  }));
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

/**
 * Categories grouped by axis, in the order `CATEGORY_AXES` declares.
 *
 * Grouping happens here rather than in the page because two consumers need
 * the same order — the category index and the filters — and an axis that
 * sorts differently in the two of them reads as two different taxonomies.
 * An axis with no categories is dropped rather than rendered empty.
 */
export type CategoryAxisGroup = {
  axis: CategoryAxis;
  label: string;
  categories: CategoryWithCount[];
};

export function groupCategoriesByAxis(
  categories: CategoryWithCount[],
): CategoryAxisGroup[] {
  return CATEGORY_AXES.map((axis) => ({
    axis,
    label: CATEGORY_AXIS_LABELS[axis],
    categories: categories.filter((category) => category.axis === axis),
  })).filter((group) => group.categories.length > 0);
}

export async function getCountries(): Promise<string[]> {
  if (!directory.features.locations) return [];

  const rows = await prisma.listing.findMany({
    where: { ...PUBLISHED_ONLY, country: { not: null } },
    select: { country: true },
    distinct: ["country"],
    orderBy: { country: "asc" },
  });

  return rows
    .map((row) => row.country)
    .filter((country): country is string => Boolean(country));
}

/** Homepage strip. Featured first, newest next, capped. */
export async function getSelectedListings(limit = 6): Promise<ListingCard[]> {
  return prisma.listing.findMany({
    where: PUBLISHED_ONLY,
    select: listingCardSelect,
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { name: "asc" }],
    take: limit,
  });
}

export async function countPublishedListings(): Promise<number> {
  return prisma.listing.count({ where: PUBLISHED_ONLY });
}
