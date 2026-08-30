import type { Metadata } from "next";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import { filteredViewDecision } from "@/lib/seo/indexability";
import {
  getCategoriesWithCounts,
  getCountries,
  getDirectoryPage,
} from "@/lib/listings";
import { ListingList } from "@/components/listing-card";
import { DirectoryFilters } from "@/components/directory-filters";
import { Pagination } from "@/components/pagination";
import { Breadcrumbs } from "@/components/breadcrumbs";

/**
 * The directory index is also the search results page and also the filter
 * surface. One route, one query, one list component.
 *
 * Splitting search onto its own route would mean two list renderers, two
 * empty states and two sets of metadata rules that have to agree about
 * indexability. This way there is one of each, and the filter state lives
 * where it belongs: in the query string, which never gets indexed.
 */

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasQuery = Object.values(params).some((value) => first(value));

  return pageMetadata({
    title: `All ${directory.listing.pluralLower}`,
    description: `Browse every ${directory.listing.singularLower} in ${directory.siteName}.`,
    // The canonical is always the unfiltered index: `canonical()` drops the
    // query string, so every filter combination points back here.
    path: "/directory",
    decision: filteredViewDecision(hasQuery),
  });
}

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const q = first(params.q);
  const category = first(params.category);
  const country = first(params.country);
  const page = Number.parseInt(first(params.page) ?? "1", 10);

  const [result, categories, countries] = await Promise.all([
    getDirectoryPage({
      q,
      category,
      country,
      page: Number.isFinite(page) && page > 0 ? page : 1,
    }),
    getCategoriesWithCounts(),
    getCountries(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: directory.listing.plural, path: "/directory" },
        ]}
      />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {directory.listing.plural}
      </h1>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        {result.total}{" "}
        {result.total === 1
          ? directory.listing.singularLower
          : directory.listing.pluralLower}
        {q ? ` matching “${q}”` : ""}
      </p>

      <div className="mt-6">
        <DirectoryFilters
          categories={categories}
          countries={countries}
          current={{ q, category, country }}
        />
      </div>

      <div className="mt-4">
        <ListingList listings={result.listings} />
      </div>

      <Pagination
        page={result.page}
        pageCount={result.pageCount}
        params={{ q, category, country }}
        basePath="/directory"
      />
    </div>
  );
}
