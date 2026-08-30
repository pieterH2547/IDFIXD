/**
 * `npm run import` — the command a new directory runs after replacing the
 * CSVs in `data/`.
 *
 * Three properties matter more than anything else here:
 *
 * 1. **It validates before it writes.** Every row is parsed and checked
 *    first; a single bad row aborts the whole run before the database is
 *    touched. A half-applied import is much worse than a rejected one.
 *
 * 2. **It is safe to rerun.** Everything is upserted on `slug`, so running
 *    it twice produces the same database as running it once. That is what
 *    makes "fix a typo in the CSV and re-import" a normal thing to do.
 *
 * 3. **It never deletes listings.** Rerunning with a shorter file updates
 *    what it finds and leaves the rest alone. Removing a listing is
 *    `status: ARCHIVED` in the CSV, which unpublishes the page and drops it
 *    from the sitemap while keeping the row and its sources. Deletion by
 *    omission would make a truncated download destroy a directory.
 *
 * Relations are replaced rather than merged: the CSV is the source of
 * truth for a listing's categories, so a category removed from the row is
 * removed from the listing.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import {
  formatErrors,
  parseCategoriesCsv,
  parseListingsCsv,
  parseListingsJson,
} from "../src/lib/import";
import type { CategoryInput, ListingInput } from "../src/lib/validation";

const ROOT = process.cwd();
const DATA = join(ROOT, "data");

const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  "file:./prisma/dev.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const prisma = new PrismaClient({
  adapter: new PrismaLibSql(authToken ? { url, authToken } : { url }),
});

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function readListings(): ListingInput[] {
  const csvPath = join(DATA, "listings.csv");
  const jsonPath = join(DATA, "listings.json");

  if (existsSync(csvPath)) {
    const result = parseListingsCsv(readFileSync(csvPath, "utf8"));
    if (!result.ok) {
      fail(
        `data/listings.csv has ${result.errors.length} problem(s):\n${formatErrors(result.errors)}`,
      );
    }
    return result.rows;
  }

  if (existsSync(jsonPath)) {
    const result = parseListingsJson(readFileSync(jsonPath, "utf8"));
    if (!result.ok) {
      fail(
        `data/listings.json has ${result.errors.length} problem(s):\n${formatErrors(result.errors)}`,
      );
    }
    return result.rows;
  }

  fail("No data/listings.csv or data/listings.json found.");
}

function readCategories(): CategoryInput[] {
  const path = join(DATA, "categories.csv");
  if (!existsSync(path)) return [];

  const result = parseCategoriesCsv(readFileSync(path, "utf8"));
  if (!result.ok) {
    fail(
      `data/categories.csv has ${result.errors.length} problem(s):\n${formatErrors(result.errors)}`,
    );
  }
  return result.rows;
}

async function main() {
  const listings = readListings();
  const declaredCategories = readCategories();

  console.log(
    `Validated ${listings.length} listing(s) and ${declaredCategories.length} declared category/categories.`,
  );

  // Categories the CSV declares, with their descriptions and SEO copy.
  for (const category of declaredCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        description: category.description ?? null,
        axis: category.axis,
        seoTitle: category.seoTitle ?? null,
        seoDescription: category.seoDescription ?? null,
        published: category.published,
        sortOrder: category.sortOrder,
      },
      update: {
        name: category.name,
        description: category.description ?? null,
        axis: category.axis,
        seoTitle: category.seoTitle ?? null,
        seoDescription: category.seoDescription ?? null,
        published: category.published,
        sortOrder: category.sortOrder,
      },
    });
  }

  // Categories a listing references but categories.csv never declared. They
  // are created with a title-cased name so the site is never broken by a
  // typo in one cell — but they are reported, because an unexpected
  // category here usually *is* a typo.
  const declaredSlugs = new Set(declaredCategories.map((c) => c.slug));
  const referenced = new Set(listings.flatMap((listing) => listing.categories));
  const implicit = [...referenced].filter((slug) => !declaredSlugs.has(slug));

  for (const slug of implicit) {
    await prisma.category.upsert({
      where: { slug },
      create: { slug, name: titleCase(slug) },
      update: {},
    });
  }

  if (implicit.length > 0) {
    console.log(
      `Created ${implicit.length} category/categories not in categories.csv: ${implicit.join(", ")}`,
    );
  }

  let created = 0;
  let updated = 0;

  for (const listing of listings) {
    const existing = await prisma.listing.findUnique({
      where: { slug: listing.slug },
      select: { id: true },
    });

    const scalars = {
      name: listing.name,
      status: listing.status,
      shortDescription: listing.shortDescription ?? null,
      description: listing.description ?? null,
      websiteUrl: listing.websiteUrl ?? null,
      logoUrl: listing.logoUrl ?? null,
      country: listing.country ?? null,
      city: listing.city ?? null,
      pricingText: listing.pricingText ?? null,
      featured: listing.featured,
      verified: listing.verified,
      attributes: JSON.stringify(listing.attributes),
      // A listing published without an explicit date is published now.
      publishedAt:
        listing.publishedAt ??
        (listing.status === "PUBLISHED" ? new Date() : null),
      lastVerifiedAt: listing.lastVerifiedAt ?? null,
    };

    const record = await prisma.listing.upsert({
      where: { slug: listing.slug },
      create: { slug: listing.slug, ...scalars },
      update: scalars,
    });

    if (existing) updated += 1;
    else created += 1;

    await syncCategories(record.id, listing.categories);
    await syncTags(record.id, listing.tags);
    await syncSources(record.id, listing.sources);
  }

  console.log(
    `\n✔ Import complete: ${created} created, ${updated} updated, 0 deleted.`,
  );
  console.log("  Run `npm run dev` and check the pages before deploying.\n");
}

async function syncCategories(listingId: string, slugs: string[]) {
  const categories = await prisma.category.findMany({
    where: { slug: { in: slugs } },
    select: { id: true },
  });

  await prisma.listingCategory.deleteMany({ where: { listingId } });
  if (categories.length === 0) return;

  await prisma.listingCategory.createMany({
    data: categories.map((category) => ({
      listingId,
      categoryId: category.id,
    })),
  });
}

async function syncTags(listingId: string, slugs: string[]) {
  await prisma.listingTag.deleteMany({ where: { listingId } });
  if (slugs.length === 0) return;

  for (const slug of slugs) {
    const tag = await prisma.tag.upsert({
      where: { slug },
      create: { slug, name: titleCase(slug) },
      update: {},
    });
    await prisma.listingTag.create({ data: { listingId, tagId: tag.id } });
  }
}

async function syncSources(
  listingId: string,
  sources: { url: string; label?: string; checkedAt?: Date }[],
) {
  await prisma.source.deleteMany({ where: { listingId } });
  if (sources.length === 0) return;

  await prisma.source.createMany({
    data: sources.map((source) => ({
      listingId,
      url: source.url,
      label: source.label ?? null,
      checkedAt: source.checkedAt ?? null,
    })),
  });
}

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });

