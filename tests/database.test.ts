import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTempDatabase, type TempDatabase } from "./helpers/temp-database";

/**
 * The queries, against a real database.
 *
 * A mocked Prisma client would let a wrong relation, a wrong join or a
 * forgotten `status` filter pass — and those are exactly the bugs that
 * publish a draft listing. So this pushes the real schema to a throwaway
 * SQLite file and runs the real query layer against it.
 *
 * It costs a few seconds. The alternative costs a draft page on Google.
 */

let db: typeof import("@/lib/db").prisma;
let queries: typeof import("@/lib/listings");
let temp: TempDatabase;

beforeAll(async () => {
  temp = await createTempDatabase();

  // Set before importing `@/lib/db`, which reads the environment once at
  // module load. Clearing the Turso variables is what guarantees the query
  // layer cannot reach a real database from a test run.
  process.env.DATABASE_URL = temp.url;
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;

  ({ prisma: db } = await import("@/lib/db"));
  queries = await import("@/lib/listings");

  const advisory = await db.category.create({
    data: { name: "Advisory", slug: "advisory", sortOrder: 10 },
  });
  const operations = await db.category.create({
    data: { name: "Operations", slug: "operations", sortOrder: 20 },
  });
  const hidden = await db.category.create({
    data: { name: "Hidden", slug: "hidden", published: false },
  });

  await db.listing.create({
    data: {
      name: "Northstar Partners",
      slug: "northstar-partners",
      status: "PUBLISHED",
      shortDescription: "Corporate finance advisory.",
      country: "Netherlands",
      featured: true,
      verified: true,
      categories: {
        create: [
          { categoryId: advisory.id },
          { categoryId: operations.id },
        ],
      },
      sources: { create: [{ url: "https://example.com/northstar" }] },
    },
  });

  await db.listing.create({
    data: {
      name: "Oakridge Advisory",
      slug: "oakridge-advisory",
      status: "PUBLISHED",
      shortDescription: "Operational due diligence.",
      country: "United Kingdom",
      categories: { create: [{ categoryId: advisory.id }] },
    },
  });

  await db.listing.create({
    data: {
      name: "Wexford Analytics",
      slug: "wexford-analytics",
      status: "DRAFT",
      shortDescription: "Market analytics.",
      categories: { create: [{ categoryId: hidden.id }] },
    },
  });
}, 120_000);

afterAll(async () => {
  await db?.$disconnect();
  temp?.cleanup();
});

describe("category and listing relations", () => {
  it("returns a listing with its categories, tags and sources", async () => {
    const listing = await queries.getListingBySlug("northstar-partners");
    expect(listing).not.toBeNull();
    expect(listing?.categories.map((entry) => entry.category.slug).sort()).toEqual(
      ["advisory", "operations"],
    );
    expect(listing?.sources).toHaveLength(1);
  });

  it("counts only published listings per category", async () => {
    const categories = await queries.getCategoriesWithCounts();
    const bySlug = new Map(categories.map((c) => [c.slug, c]));

    expect(bySlug.get("advisory")?.listingCount).toBe(2);
    expect(bySlug.get("operations")?.listingCount).toBe(1);
    // The draft's category would show 1 if the count ignored status.
    expect(bySlug.has("hidden")).toBe(false);
  });

  it("filters the directory index by category", async () => {
    const page = await queries.getDirectoryPage({ category: "operations" });
    expect(page.listings.map((l) => l.slug)).toEqual(["northstar-partners"]);
  });

  it("relates listings through shared categories, excluding itself", async () => {
    const listing = await queries.getListingBySlug("northstar-partners");
    const related = await queries.getRelatedListings(listing!.id, ["advisory"]);
    expect(related.map((l) => l.slug)).toEqual(["oakridge-advisory"]);
  });

  it("returns nothing rather than padding when there is no relation", async () => {
    const listing = await queries.getListingBySlug("northstar-partners");
    expect(await queries.getRelatedListings(listing!.id, [])).toEqual([]);
  });
});

describe("unknown and unpublished slugs", () => {
  it("returns null for a slug that does not exist, so the page 404s", async () => {
    expect(await queries.getListingBySlug("no-such-listing")).toBeNull();
  });

  it("returns null for a draft listing", async () => {
    expect(await queries.getListingBySlug("wexford-analytics")).toBeNull();
  });

  it("still finds a draft listing for the claim form", async () => {
    expect(await queries.listingExists("wexford-analytics")).toBe(true);
    expect(await queries.listingExists("no-such-listing")).toBe(false);
  });

  it("keeps drafts out of every list", async () => {
    const page = await queries.getDirectoryPage({});
    expect(page.listings.map((l) => l.slug)).not.toContain(
      "wexford-analytics",
    );
    expect(page.total).toBe(2);
  });
});

describe("search", () => {
  it("matches on name", async () => {
    const page = await queries.getDirectoryPage({ q: "Northstar" });
    expect(page.listings.map((l) => l.slug)).toEqual(["northstar-partners"]);
  });

  it("matches on short description", async () => {
    const page = await queries.getDirectoryPage({ q: "due diligence" });
    expect(page.listings.map((l) => l.slug)).toEqual(["oakridge-advisory"]);
  });

  it("matches on category name", async () => {
    const page = await queries.getDirectoryPage({ q: "Operations" });
    expect(page.listings.map((l) => l.slug)).toEqual(["northstar-partners"]);
  });

  it("is case-insensitive", async () => {
    const page = await queries.getDirectoryPage({ q: "NORTHSTAR" });
    expect(page.total).toBe(1);
  });

  it("returns an empty page rather than everything when nothing matches", async () => {
    const page = await queries.getDirectoryPage({ q: "zzzzz" });
    expect(page.listings).toEqual([]);
    expect(page.total).toBe(0);
  });

  it("sorts featured listings first", async () => {
    const page = await queries.getDirectoryPage({});
    expect(page.listings[0]?.slug).toBe("northstar-partners");
  });

  it("lists the countries present in published listings", async () => {
    expect(await queries.getCountries()).toEqual([
      "Netherlands",
      "United Kingdom",
    ]);
  });
});
