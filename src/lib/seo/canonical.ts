import { SITE_URL } from "@/config/directory";

/**
 * One place that decides what a canonical URL looks like.
 *
 * Two rules, both learned the expensive way:
 *
 * 1. **Never declare a canonical in the root layout.** In the App Router
 *    that value is inherited by every page that does not set its own, so a
 *    root-level `canonical: "https://example.com"` tells Google that the
 *    directory index, every category and every listing are duplicates of
 *    the homepage. Pages that canonicalise to the homepage get dropped
 *    from the index. Every page here states its own.
 *
 * 2. **Query strings never survive.** `?q=`, `?page=`, `?utm_source=` and
 *    `?category=` describe how someone arrived or what they filtered, not
 *    a separate document. Indexing them multiplies one page into hundreds
 *    of near-duplicates that compete with each other.
 */

export { SITE_URL };

/** Absolute canonical URL for a path. Query and fragment are dropped. */
export function canonical(path: string): string {
  if (!path || path === "/") return `${SITE_URL}/`;

  const withoutQuery = path.split("?")[0] ?? "";
  const clean = withoutQuery.split("#")[0] ?? "";
  const withSlash = clean.startsWith("/") ? clean : `/${clean}`;

  // No trailing slash on sub-paths. `trailingSlash: false` in next.config.ts
  // is the other half of this: the server and the canonical have to agree.
  const trimmed =
    withSlash.length > 1 ? withSlash.replace(/\/+$/, "") : withSlash;

  return `${SITE_URL}${trimmed}`;
}

/** Shorthand for a Metadata `alternates` block. */
export function canonicalAlternates(path: string) {
  return { canonical: canonical(path) };
}
