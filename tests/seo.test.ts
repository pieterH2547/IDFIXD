import { describe, expect, it } from "vitest";
import { canonical } from "@/lib/seo/canonical";
import {
  categoryIndexDecision,
  filteredViewDecision,
  listingIndexDecision,
  robotsFor,
} from "@/lib/seo/indexability";
import { buildSitemap } from "@/lib/seo/sitemap";
import { directory, SITE_URL } from "@/config/directory";

describe("canonical URLs", () => {
  it("makes a root-relative path absolute", () => {
    expect(canonical("/directory/northstar-partners")).toBe(
      `${SITE_URL}/directory/northstar-partners`,
    );
  });

  it("drops the query string, so filter states cannot self-canonicalise", () => {
    expect(canonical("/directory?q=advisory&page=3")).toBe(
      `${SITE_URL}/directory`,
    );
  });

  it("drops the fragment", () => {
    expect(canonical("/directory#results")).toBe(`${SITE_URL}/directory`);
  });

  it("keeps the trailing slash on the root and nowhere else", () => {
    expect(canonical("/")).toBe(`${SITE_URL}/`);
    expect(canonical("/directory/")).toBe(`${SITE_URL}/directory`);
  });

  it("tolerates a path given without a leading slash", () => {
    expect(canonical("directory")).toBe(`${SITE_URL}/directory`);
  });
});

describe("indexability decisions", () => {
  const published = {
    status: "PUBLISHED",
    shortDescription: "Corporate finance advisory.",
    description: null,
  };

  it("indexes a published listing that has a description", () => {
    expect(listingIndexDecision(published).index).toBe(true);
  });

  it("refuses a draft listing", () => {
    const decision = listingIndexDecision({ ...published, status: "DRAFT" });
    expect(decision.index).toBe(false);
    expect(decision.reason).toContain("DRAFT");
  });

  it("refuses a published listing with no prose at all", () => {
    const decision = listingIndexDecision({
      status: "PUBLISHED",
      shortDescription: "   ",
      description: null,
    });
    expect(decision.index).toBe(false);
    expect(decision.reason).toContain("thin");
  });

  it("refuses an unpublished category", () => {
    expect(
      categoryIndexDecision({ published: false, listingCount: 50 }).index,
    ).toBe(false);
  });

  it("refuses a category below the configured minimum", () => {
    const minimum = directory.indexing.minListingsPerCategory;
    expect(
      categoryIndexDecision({ published: true, listingCount: minimum - 1 })
        .index,
    ).toBe(false);
    expect(
      categoryIndexDecision({ published: true, listingCount: minimum }).index,
    ).toBe(true);
  });

  it("never indexes a filtered view", () => {
    expect(filteredViewDecision(true).index).toBe(false);
    expect(filteredViewDecision(false).index).toBe(true);
  });

  it("keeps following links out of pages it will not index", () => {
    expect(robotsFor(filteredViewDecision(true))).toEqual({
      index: false,
      follow: true,
    });
  });
});

describe("sitemap", () => {
  const updatedAt = new Date("2026-08-01T00:00:00Z");

  const listings = [
    {
      slug: "northstar-partners",
      status: "PUBLISHED",
      shortDescription: "Corporate finance advisory.",
      description: null,
      updatedAt,
    },
    {
      slug: "wexford-analytics",
      status: "DRAFT",
      shortDescription: "Market analytics.",
      description: null,
      updatedAt,
    },
    {
      slug: "no-copy",
      status: "PUBLISHED",
      shortDescription: null,
      description: null,
      updatedAt,
    },
  ];

  const categories = [
    { slug: "advisory", published: true, listingCount: 10, updatedAt },
    { slug: "hidden", published: false, listingCount: 10, updatedAt },
    { slug: "sparse", published: true, listingCount: 0, updatedAt },
  ];

  const urls = buildSitemap({ listings, categories }).map((entry) => entry.url);

  it("includes an indexable listing", () => {
    expect(urls).toContain(`${SITE_URL}/directory/northstar-partners`);
  });

  it("excludes an unpublished listing", () => {
    expect(urls).not.toContain(`${SITE_URL}/directory/wexford-analytics`);
  });

  it("excludes a published listing too thin to index", () => {
    expect(urls).not.toContain(`${SITE_URL}/directory/no-copy`);
  });

  it("applies the same category rule the page metadata applies", () => {
    expect(urls).toContain(`${SITE_URL}/category/advisory`);
    expect(urls).not.toContain(`${SITE_URL}/category/hidden`);
    expect(urls).not.toContain(`${SITE_URL}/category/sparse`);
  });

  it("never lists a filtered or paginated URL", () => {
    expect(urls.every((url) => !url.includes("?"))).toBe(true);
  });

  it("always includes the hubs", () => {
    expect(urls).toContain(`${SITE_URL}/`);
    expect(urls).toContain(`${SITE_URL}/directory`);
    expect(urls).toContain(`${SITE_URL}/categories`);
  });

  it("never lists the claim form", () => {
    expect(urls.some((url) => url.includes("/claim/"))).toBe(false);
  });
});
