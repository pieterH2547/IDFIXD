import { directory } from "@/config/directory";

/**
 * The one place that decides whether a page may be indexed.
 *
 * Both consumers call this and neither reimplements it:
 *
 * - a page's `generateMetadata` turns the decision into `robots`;
 * - `sitemap.ts` turns the same decision into inclusion or exclusion.
 *
 * That is the whole point. When those two disagree — a page marked
 * `noindex` that is still in the sitemap, or a healthy page quietly missing
 * from it — the site is telling Google two different things and the bug is
 * invisible until traffic has already gone. One function, two callers, no
 * way to drift.
 *
 * It is deliberately made of thresholds rather than judgement. Every rule
 * here answers one question: *if someone landed on this page from a search
 * result, would it answer them?*
 */

export type PageKind = "home" | "static" | "listing" | "category" | "legal";

export type IndexDecision = {
  index: boolean;
  /** Always populated, including on success — this is what you log. */
  reason: string;
};

const INDEX: IndexDecision = { index: true, reason: "meets the threshold" };

export type ListingIndexInput = {
  status: string;
  /** A listing with no summary is a name and a link. That is not a page. */
  shortDescription?: string | null;
  description?: string | null;
};

export type CategoryIndexInput = {
  published: boolean;
  /** Count of *published* listings, not all listings. */
  listingCount: number;
};

export function listingIndexDecision(listing: ListingIndexInput): IndexDecision {
  if (listing.status !== "PUBLISHED") {
    return { index: false, reason: `status is ${listing.status}` };
  }

  const hasProse = Boolean(
    listing.shortDescription?.trim() || listing.description?.trim(),
  );
  if (!hasProse) {
    return { index: false, reason: "no description; the page would be thin" };
  }

  return INDEX;
}

export function categoryIndexDecision(
  category: CategoryIndexInput,
): IndexDecision {
  if (!category.published) {
    return { index: false, reason: "category is unpublished" };
  }

  const minimum = directory.indexing.minListingsPerCategory;
  if (category.listingCount < minimum) {
    return {
      index: false,
      reason: `${category.listingCount} published ${directory.listing.pluralLower}, fewer than the ${minimum} required`,
    };
  }

  return INDEX;
}

/**
 * A legal page is indexable exactly when its text exists.
 *
 * Deriving this from the text rather than from a separate flag is the whole
 * design: an unwritten terms page that is nevertheless indexed is a real
 * cost — it ranks for the site's own name, and what it shows a visitor
 * looking for the terms is that there are none.
 */
export function legalIndexDecision(body: string | null): IndexDecision {
  return body && body.trim().length > 0
    ? INDEX
    : { index: false, reason: "document not published yet" };
}

/**
 * Any URL carrying a query string.
 *
 * `/directory?q=advisory&page=3` is a filter state, not a document. It
 * renders, it works, people can link to it — it just canonicalises to
 * `/directory` and never enters the index. This is why the directory index
 * uses `searchParams` for filtering instead of `/directory/filter/...`
 * routes: a filter that lives in the path would have to be individually
 * argued out of the index, and one of them eventually would not be.
 */
export function filteredViewDecision(hasQuery: boolean): IndexDecision {
  return hasQuery
    ? { index: false, reason: "filtered view; canonicalises to the base page" }
    : INDEX;
}

/** Turn a decision into the `robots` block Next's Metadata expects. */
export function robotsFor(decision: IndexDecision) {
  return decision.index
    ? { index: true, follow: true }
    : // `follow` stays true: the page should not be indexed, but the links
      // out of it to listings that *should* be are still worth crawling.
      { index: false, follow: true };
}
