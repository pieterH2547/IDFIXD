import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { directory } from "@/config/directory";
import { hasAttributes, parseAttributes } from "@/config/attributes";
import { pageMetadata, truncate } from "@/lib/seo/metadata";
import { listingIndexDecision } from "@/lib/seo/indexability";
import { getListingBySlug, getRelatedListings } from "@/lib/listings";
import { ListingList } from "@/components/listing-card";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { prisma } from "@/lib/db";

/**
 * One listing.
 *
 * Every section below is behind a "do we have this?" check, and several are
 * behind a config flag as well. That combination is what makes the page
 * work for a directory of investment firms (location, team size, no
 * pricing) and one of software vendors (pricing, no location) without
 * either of them editing this file.
 *
 * The rule when data is missing is to render nothing — never a heading
 * with an empty body, never "Not specified". A section that appears only
 * when it has something to say is why a sparse first import still looks
 * finished.
 */

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const listings = await prisma.listing.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return listings.map((listing) => ({ slug: listing.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  if (!listing) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }

  const description =
    listing.shortDescription ??
    (listing.description ? truncate(listing.description) : directory.siteDescription);

  return pageMetadata({
    title: listing.name,
    description,
    path: `/directory/${listing.slug}`,
    decision: listingIndexDecision(listing),
    type: "article",
  });
}

export default async function ListingPage({ params }: { params: Params }) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);

  // A draft, archived or non-existent slug is a 404, not a redirect and not
  // an empty page. Anything else leaves unpublished work reachable.
  if (!listing) notFound();

  const attributes = parseAttributes(listing.attributes);
  const categories = listing.categories.map((entry) => entry.category);
  const tags = listing.tags.map((entry) => entry.tag);
  const related = await getRelatedListings(
    listing.id,
    categories.map((category) => category.slug),
  );

  const location = [listing.city, listing.country].filter(Boolean).join(", ");
  const details = attributes.details ?? {};
  const showDetails =
    hasAttributes(attributes) &&
    (Object.keys(details).length > 0 || attributes.founded || attributes.teamSize);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: directory.listing.plural, path: "/directory" },
          { name: listing.name, path: `/directory/${listing.slug}` },
        ]}
      />

      <header className="mt-5 flex items-start gap-4">
        {listing.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- see listing-card.tsx
          <img
            src={listing.logoUrl}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded border border-[var(--color-line)] object-contain"
          />
        ) : null}

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {listing.name}
          </h1>
          {listing.shortDescription ? (
            <p className="mt-1.5 text-[var(--color-ink-muted)]">
              {listing.shortDescription}
            </p>
          ) : null}
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        {listing.verified ? (
          <span className="rounded bg-[var(--color-surface)] px-2 py-1 text-xs font-medium">
            Verified
          </span>
        ) : null}
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            className="rounded border border-[var(--color-line)] px-2 py-1 text-xs hover:border-[var(--color-accent)]"
          >
            {category.name}
          </Link>
        ))}
      </div>

      {listing.websiteUrl ? (
        <p className="mt-6">
          <a
            href={listing.websiteUrl}
            target="_blank"
            // noopener/noreferrer on every outbound link: these URLs come
            // from imported data, so they are not ours to vouch for.
            rel="noopener noreferrer"
            className="inline-block rounded-md bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
          >
            Visit website
          </a>
        </p>
      ) : null}

      {listing.description ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">About</h2>
          {listing.description.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="mt-3 text-[var(--color-ink-muted)]">
              {paragraph}
            </p>
          ))}
        </section>
      ) : null}

      {showDetails ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Details</h2>
          <dl className="mt-3 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)] text-sm">
            {attributes.founded ? (
              <Row label="Founded" value={attributes.founded} />
            ) : null}
            {attributes.teamSize ? (
              <Row label="Team size" value={attributes.teamSize} />
            ) : null}
            {Object.entries(details).map(([label, value]) => (
              <Row key={label} label={label} value={value} />
            ))}
          </dl>
        </section>
      ) : null}

      {directory.features.prosCons &&
      (attributes.pros?.length || attributes.cons?.length) ? (
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          {attributes.pros?.length ? (
            <div>
              <h2 className="text-lg font-semibold">Strengths</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[var(--color-ink-muted)]">
                {attributes.pros.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {attributes.cons?.length ? (
            <div>
              <h2 className="text-lg font-semibold">Considerations</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-[var(--color-ink-muted)]">
                {attributes.cons.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      ) : null}

      {directory.features.pricing && listing.pricingText ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Pricing</h2>
          <p className="mt-2 text-[var(--color-ink-muted)]">
            {listing.pricingText}
          </p>
        </section>
      ) : null}

      {directory.features.locations && location ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Location</h2>
          <p className="mt-2 text-[var(--color-ink-muted)]">{location}</p>
        </section>
      ) : null}

      {directory.features.tags && tags.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Tags</h2>
          <p className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-ink-muted)]">
            {tags.map((tag) => (
              <span
                key={tag.slug}
                className="rounded bg-[var(--color-surface)] px-2 py-1"
              >
                {tag.name}
              </span>
            ))}
          </p>
        </section>
      ) : null}

      {directory.features.sources && listing.sources.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Sources</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Where the information on this page came from.
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {listing.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  {source.label ?? new URL(source.url).hostname}
                </a>
                {source.checkedAt ? (
                  <span className="text-[var(--color-ink-muted)]">
                    {" "}
                    — checked {formatDate(source.checkedAt)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {directory.features.sources && listing.lastVerifiedAt ? (
        <p className="mt-8 text-sm text-[var(--color-ink-muted)]">
          Last verified {formatDate(listing.lastVerifiedAt)}.
        </p>
      ) : null}

      {directory.features.claims ? (
        <p className="mt-3 text-sm text-[var(--color-ink-muted)]">
          Is this your {directory.listing.singularLower}?{" "}
          <Link
            href={`/claim/${listing.slug}`}
            className="text-[var(--color-accent)] hover:underline"
          >
            Claim or correct this page
          </Link>
          .
        </p>
      ) : null}

      {related.length > 0 ? (
        <section className="mt-12 border-t border-[var(--color-line)] pt-6">
          <h2 className="text-lg font-semibold">
            Related {directory.listing.pluralLower}
          </h2>
          <div className="mt-2">
            <ListingList listings={related} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-2.5">
      <dt className="w-40 shrink-0 text-[var(--color-ink-muted)]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(directory.locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
