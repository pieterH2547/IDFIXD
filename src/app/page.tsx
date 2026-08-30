import type { Metadata } from "next";
import Link from "next/link";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import {
  countPublishedListings,
  getCategoriesWithCounts,
  getCitiesWithCounts,
  getSelectedListings,
} from "@/lib/listings";
import { ListingList } from "@/components/listing-card";

/**
 * The homepage answers three questions and then gets out of the way: what
 * this covers, which job you have, and where you are. No testimonial strip
 * and no promises about the companies listed — the one thing a directory of
 * real businesses cannot afford is a claim it has not checked.
 *
 * Which is why the last block says plainly what has and has not been
 * verified. Competing sites open with "every professional is certified and
 * insured"; we would have to have checked that, and we have not.
 */

export const metadata: Metadata = pageMetadata({
  title: directory.siteName,
  description: directory.siteDescription,
  path: "/",
  decision: { index: true, reason: "homepage" },
});

/**
 * The jobs people actually search for, in the order they search for them.
 *
 * Hardcoded slugs rather than "the first four categories": this is an
 * editorial ordering, and sorting by listing count would put whichever
 * category was tagged most often at the top regardless of demand. A slug
 * that no longer exists simply drops out.
 */
const HEADLINE_SERVICES = [
  { slug: "boom-snoeien", blurb: "Onderhoud, kroonreductie of knotten." },
  { slug: "boom-vellen", blurb: "Vellen of gecontroleerd demonteren." },
  { slug: "stronk-verwijderen", blurb: "Stobbe frezen of uitgraven." },
  { slug: "boomonderzoek", blurb: "Boomveiligheidscontrole en VTA." },
];

export default async function HomePage() {
  const [categories, cities, selected, total] = await Promise.all([
    getCategoriesWithCounts(),
    getCitiesWithCounts(10),
    getSelectedListings(6),
    countPublishedListings(),
  ]);

  const bySlug = new Map(categories.map((category) => [category.slug, category]));
  const services = HEADLINE_SERVICES.flatMap((service) => {
    const category = bySlug.get(service.slug);
    return category ? [{ ...service, category }] : [];
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Boomverzorgers in en rond Antwerpen
        </h1>
        <p className="mt-3 text-lg text-[var(--color-ink-muted)]">
          {total} bedrijven op een rij, met standplaats en werkgebied. Wij
          bemiddelen niet en verkopen geen leads — u belt of mailt het bedrijf
          zelf.
        </p>

        {directory.features.search ? (
          <form method="get" action="/directory" className="mt-6 flex gap-2">
            <label htmlFor="home-search" className="sr-only">
              Zoek in {directory.listing.pluralLower}
            </label>
            <input
              id="home-search"
              name="q"
              type="search"
              placeholder={`Zoek op naam of gemeente`}
              className="w-full rounded-md border border-[var(--color-line)] px-3.5 py-2.5 text-sm"
            />
            <button
              type="submit"
              className="rounded-md bg-[var(--color-accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
            >
              Zoeken
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

      {services.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-lg font-semibold">Welke klus heeft u?</h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <li key={service.slug}>
                <Link
                  href={`/category/${service.slug}`}
                  className="block h-full rounded-lg border border-[var(--color-line)] p-4 hover:border-[var(--color-accent)]"
                >
                  <span className="block font-medium">
                    {service.category.name}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--color-ink-muted)]">
                    {service.blurb}
                  </span>
                  <span className="mt-2 block text-xs text-[var(--color-ink-muted)]">
                    {/*
                      "0 boomverzorgers" is true and useless: it reads as a
                      broken site rather than as work in progress. Nobody has
                      been assigned to a service yet, because which company
                      does what is not something to guess.
                    */}
                    {service.category.listingCount > 0
                      ? `${service.category.listingCount} ${
                          service.category.listingCount === 1
                            ? directory.listing.singularLower
                            : directory.listing.pluralLower
                        }`
                      : "toewijzing volgt"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">
            <Link
              href="/categories"
              className="text-[var(--color-accent)] hover:underline"
            >
              Alle categorieën, per as →
            </Link>
          </p>
        </section>
      ) : null}

      {cities.length > 0 ? (
        <section className="mt-14">
          <h2 className="text-lg font-semibold">Waar zit u?</h2>
          <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
            Standplaats van het bedrijf. Veel boomverzorgers werken ruimer dan
            hun eigen gemeente — dat staat op hun pagina.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {cities.map((city) => (
              <li key={city.city}>
                <Link
                  href={`/directory?q=${encodeURIComponent(city.city)}`}
                  className="inline-flex items-baseline gap-1.5 rounded-md border border-[var(--color-line)] px-3 py-1.5 text-sm hover:border-[var(--color-accent)]"
                >
                  {city.city}
                  <span className="text-xs text-[var(--color-ink-muted)] tabular-nums">
                    {city.listingCount}
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
            <h2 className="text-lg font-semibold">Recent toegevoegd</h2>
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

      <section className="mt-14 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="text-lg font-semibold">Wat deze gids wel en niet zegt</h2>
        <dl className="mt-4 grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-sm font-medium">Wat vaststaat</dt>
            <dd className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Naam en standplaats van elk bedrijf. Waar een website staat, is
              die aan de bedrijfsnaam gekoppeld via openbare zoekresultaten.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">Wat nog niet</dt>
            <dd className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Diensten, certificaten, materieel en klanttypes zijn niet
              geverifieerd. Elke bedrijfspagina zegt zelf hoever dat staat.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium">Wat wij niet doen</dt>
            <dd className="mt-1 text-sm text-[var(--color-ink-muted)]">
              Geen rangschikking op betaling, geen offertebemiddeling en geen
              beoordeling van vakmanschap die wij niet kunnen onderbouwen.
            </dd>
          </div>
        </dl>
        {directory.features.claims || directory.features.suggestions ? (
          <p className="mt-4 text-sm">
            Bent u boomverzorger?{" "}
            <Link
              href="/suggest"
              className="text-[var(--color-accent)] hover:underline"
            >
              Meld uw bedrijf aan of corrigeer uw gegevens
            </Link>
            .
          </p>
        ) : null}
      </section>
    </div>
  );
}
