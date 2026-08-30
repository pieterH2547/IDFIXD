import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import { categoryIndexDecision } from "@/lib/seo/indexability";
import {
  getCategoryBySlug,
  getDirectoryPage,
  getCategoriesWithCounts,
} from "@/lib/listings";
import { ListingList } from "@/components/listing-card";
import { Pagination } from "@/components/pagination";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { prisma } from "@/lib/db";

/**
 * A category page is the destination; `/directory?category=x` is a filter
 * state that canonicalises away. They render the same rows deliberately —
 * one is the document Google should hold, the other is a view.
 *
 * Both read `getDirectoryPage`, so the two can never disagree about which
 * listings belong to a category.
 */

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return categories.map((category) => ({ slug: category.slug }));
}

async function indexDecisionFor(slug: string) {
  const categories = await getCategoriesWithCounts({ includeUnpublished: true });
  const match = categories.find((category) => category.slug === slug);
  return match
    ? categoryIndexDecision(match)
    : { index: false, reason: "category not found" };
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category || !category.published) {
    return { title: "Niet gevonden", robots: { index: false, follow: false } };
  }

  return pageMetadata({
    title: category.seoTitle ?? category.name,
    description:
      category.seoDescription ??
      category.description ??
      `${category.name} in ${directory.siteName}.`,
    path: `/category/${category.slug}`,
    decision: await indexDecisionFor(slug),
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category || !category.published) notFound();

  const query = await searchParams;
  const rawPage = Array.isArray(query.page) ? query.page[0] : query.page;
  const parsed = Number.parseInt(rawPage ?? "1", 10);

  const result = await getDirectoryPage({
    category: category.slug,
    page: Number.isFinite(parsed) && parsed > 0 ? parsed : 1,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Categorieën", path: "/categories" },
          { name: category.name, path: `/category/${category.slug}` },
        ]}
      />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {category.name}
      </h1>
      {category.description ? (
        <p className="mt-2 max-w-2xl text-[var(--color-ink-muted)]">
          {category.description}
        </p>
      ) : null}
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        {result.total}{" "}
        {result.total === 1
          ? directory.listing.singularLower
          : directory.listing.pluralLower}
      </p>

      <div className="mt-6">
        <ListingList listings={result.listings} />
      </div>

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        params={{}}
        basePath={`/category/${category.slug}`}
      />
    </div>
  );
}
