import { directory } from "@/config/directory";
import type { CategoryWithCount } from "@/lib/listings";

/**
 * Search and filters as a plain `<form method="get">`.
 *
 * No `"use client"`, no state, no fetch, no JavaScript at all. The browser
 * submits the form, Next renders the page on the server with the new
 * `searchParams`, and the URL is shareable and back-button-correct for
 * free. A React-controlled filter panel would ship a bundle to do worse.
 *
 * `page` is deliberately not a hidden field: changing a filter should
 * return you to page 1, and omitting it does that without any code.
 */
export function DirectoryFilters({
  categories,
  countries,
  current,
}: {
  categories: CategoryWithCount[];
  countries: string[];
  current: { q?: string; category?: string; country?: string };
}) {
  const showCountry = directory.features.locations && countries.length > 0;

  return (
    <form
      method="get"
      action="/directory"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
    >
      {directory.features.search ? (
        <div className="min-w-56 flex-1">
          <label
            htmlFor="q"
            className="mb-1 block text-xs font-medium text-[var(--color-ink-muted)]"
          >
            Search
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={current.q ?? ""}
            placeholder={`Search ${directory.listing.pluralLower}`}
            className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
          />
        </div>
      ) : null}

      <div className="min-w-44">
        <label
          htmlFor="category"
          className="mb-1 block text-xs font-medium text-[var(--color-ink-muted)]"
        >
          Category
        </label>
        <select
          id="category"
          name="category"
          defaultValue={current.category ?? ""}
          className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name} ({category.listingCount})
            </option>
          ))}
        </select>
      </div>

      {showCountry ? (
        <div className="min-w-40">
          <label
            htmlFor="country"
            className="mb-1 block text-xs font-medium text-[var(--color-ink-muted)]"
          >
            Country
          </label>
          <select
            id="country"
            name="country"
            defaultValue={current.country ?? ""}
            className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm"
          >
            <option value="">All countries</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <button
        type="submit"
        className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
      >
        Apply
      </button>
    </form>
  );
}
