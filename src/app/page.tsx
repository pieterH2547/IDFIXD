import type { Metadata } from "next";
import Link from "next/link";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import {
  countPublishedListings,
  getCategoriesWithCounts,
  getSelectedListings,
} from "@/lib/listings";
import { ListingList } from "@/components/listing-card";

/**
 * The homepage answers three questions and then gets out of the way:
 * what this directory covers, why it is useful, and where to start
 * browsing. There is no marketing hero, no feature grid and no testimonial
 * strip, because none of those help someone who came here to find a
 * supplier.
 */

export const metadata: Metadata = pageMetadata({
  title: directory.siteName,
  description: directory.siteDescription,
  path: "/",
  decision: { index: true, reason: "homepage" },
});

export default async function HomePage() {
  const [categories, selected, total] = await Promise.all([
    getCategoriesWithCounts(),
    getSelectedListings(6),
    countPublishedListings(),
  ]);

  const mainCategories = categories.filter((c) => c.listingCount > 0).slice(0, 8);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {directory.directoryName}
        </h1>
        <p className="mt-3 text-lg text-[var(--color-ink-muted)]">
          {directory.siteDescription}
        </p>

        {directory.features.search ? (
          <form method="get" action="/directory" className="mt-6 flex gap-2">
            <label htmlFor="home-search" className="sr-only">
              Search {directory.listing.pluralLower}
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder={`Search ${total} ${directory.listing.pluralLower}`}
              className="w-full rounded-md border border-[var(--color-line)] px-3.5 py-2.5 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
            >
              Search
            </button>
          </form>
        ) : (
          <Link
            href={directory.primaryCta.href}
            className="mt-6 inline-block rounded-md bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            {directory.primaryCta.label}
          </Link>
        )}
      </section>

      {mainCategories.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-lg font-semibold">Browse by category</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {mainCategories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/category/${category.slug}`}
                  className="block rounded-lg border border-[var(--color-line)] p-4 hover:border-[var(--color-accent)]"
                >
                  <span className="block font-medium">{category.name}</span>
                  <span className="mt-0.5 block text-sm text-[var(--color-ink-muted)]">
                    {category.listingCount}{" "}
                    {category.listingCount === 1
                      ? directory.listing.singularLower
                      : directory.listing.pluralLower}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {selected.length > 0 ? (
        <section className="mt-14">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">
              Selected {directory.listing.pluralLower}
            </h2>
            <Link
              href="/directory"
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              {directory.primaryCta.label} →
            </Link>
          </div>
          <div className="mt-2">
            <ListingList listings={selected} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
