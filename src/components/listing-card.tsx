import Link from "next/link";
import type { ListingCard as ListingCardData } from "@/lib/listings";
import { directory } from "@/config/directory";

/**
 * One row in every list on the site: the directory index, category pages,
 * the homepage strip and the related block. One component, so a change to
 * how a listing summarises itself lands everywhere at once.
 *
 * Every optional field is guarded. A directory whose dataset has no logos,
 * no countries and no categories still renders a clean list rather than a
 * grid of empty boxes — which is what makes the same component work for a
 * 30-row first import and a 300-row mature one.
 */
export function ListingCard({ listing }: { listing: ListingCardData }) {
  const location = [listing.city, listing.country].filter(Boolean).join(", ");
  const categories = listing.categories.map((entry) => entry.category);

  return (
    <article className="flex gap-4 border-b border-[var(--color-line)] py-5 last:border-b-0">
      {listing.logoUrl ? (
        // Logo hosts vary per directory, and `next/image` refuses any host
        // not listed in `images.remotePatterns`. Using it here would mean a
        // new directory's first import renders broken images until someone
        // edits next.config.ts. Swap to `next/image` once your hosts are
        // known — the width and height are already set for it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={listing.logoUrl}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          className="mt-0.5 h-10 w-10 shrink-0 rounded border border-[var(--color-line)] object-contain"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold">
          <Link
            href={`/directory/${listing.slug}`}
            className="text-[var(--color-ink)] hover:text-[var(--color-accent)] hover:underline"
          >
            {listing.name}
          </Link>
        </h3>

        {listing.shortDescription ? (
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            {listing.shortDescription}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[var(--color-ink-muted)]">
          {listing.verified ? (
            <span className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 font-medium text-[var(--color-ink)]">
              Geverifieerd
            </span>
          ) : null}
          {listing.featured ? (
            <span className="rounded bg-[var(--color-surface)] px-1.5 py-0.5 font-medium text-[var(--color-ink)]">
              Uitgelicht
            </span>
          ) : null}

          {directory.features.locations && location ? (
            <span>{location}</span>
          ) : null}

          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="hover:text-[var(--color-ink)] hover:underline"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

export function ListingList({ listings }: { listings: ListingCardData[] }) {
  if (listings.length === 0) {
    return (
      <p className="py-10 text-sm text-[var(--color-ink-muted)]">
        Geen {directory.listing.pluralLower} gevonden voor deze selectie.
      </p>
    );
  }

  return (
    <div>
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}
