import type { Metadata } from "next";
import Link from "next/link";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import { getCategoriesWithCounts } from "@/lib/listings";
import { Breadcrumbs } from "@/components/breadcrumbs";

/**
 * The category index exists for internal linking as much as for people:
 * without it, category pages are reachable only from the homepage's top
 * eight and from individual listings, which leaves the long tail of
 * categories with almost no internal links pointing at them.
 */

export const metadata: Metadata = pageMetadata({
  title: "Categories",
  description: `Every category in ${directory.siteName}.`,
  path: "/categories",
  decision: { index: true, reason: "category hub" },
});

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Categories", path: "/categories" },
        ]}
      />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">Categories</h1>

      {categories.length === 0 ? (
        <p className="mt-6 text-[var(--color-ink-muted)]">
          No categories yet.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
          {categories.map((category) => (
            <li key={category.slug} className="py-4">
              <Link
                href={`/category/${category.slug}`}
                className="font-medium hover:text-[var(--color-accent)] hover:underline"
              >
                {category.name}
              </Link>
              <span className="ml-2 text-sm text-[var(--color-ink-muted)]">
                {category.listingCount}{" "}
                {category.listingCount === 1
                  ? directory.listing.singularLower
                  : directory.listing.pluralLower}
              </span>
              {category.description ? (
                <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                  {category.description}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
