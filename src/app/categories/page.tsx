import type { Metadata } from "next";
import Link from "next/link";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import {
  getCategoriesWithCounts,
  groupCategoriesByAxis,
} from "@/lib/listings";
import { Breadcrumbs } from "@/components/breadcrumbs";

/**
 * The category index exists for internal linking as much as for people:
 * without it, category pages are reachable only from the homepage's top
 * eight and from individual listings, which leaves the long tail of
 * categories with almost no internal links pointing at them.
 *
 * It is grouped by axis because this taxonomy is not one list. Someone
 * looking for a job to be done and someone looking for a certificate are
 * asking different questions, and one alphabetical column of thirty entries
 * answers neither.
 */

export const metadata: Metadata = pageMetadata({
  title: "Categorieën",
  description: `Elke categorie in ${directory.siteName}, gegroepeerd per as.`,
  path: "/categories",
  decision: { index: true, reason: "category hub" },
});

export default async function CategoriesPage() {
  const categories = await getCategoriesWithCounts();
  const groups = groupCategoriesByAxis(categories);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Categorieën", path: "/categories" },
        ]}
      />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Categorieën
      </h1>
      <p className="mt-2 max-w-prose text-[var(--color-ink-muted)]">
        De gids is opgedeeld langs zeven assen. Een bedrijf hoort in meerdere
        tegelijk: een klus, een specialisatie, een certificaat, materieel, een
        klanttype, beschikbaarheid en het soort aanbieder.
      </p>

      {groups.length === 0 ? (
        <p className="mt-6 text-[var(--color-ink-muted)]">
          Nog geen categorieën.
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-9">
          {groups.map((group) => (
            <section key={group.axis}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)]">
                {group.label}
              </h2>

              <ul className="mt-3 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
                {group.categories.map((category) => (
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
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
