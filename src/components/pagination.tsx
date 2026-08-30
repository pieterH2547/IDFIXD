import Link from "next/link";

/**
 * Previous/next links that preserve the active filters.
 *
 * `rel="prev"`/`rel="next"` are there for people and for crawlers that
 * still use them to understand a sequence. The pages themselves are
 * `noindex` and canonicalise to `/directory` — see `filteredViewDecision`
 * — so this navigation exists for reading, not for ranking.
 */
export function Pagination({
  page,
  pageCount,
  params,
  basePath,
}: {
  page: number;
  pageCount: number;
  params: Record<string, string | undefined>;
  basePath: string;
}) {
  if (pageCount <= 1) return null;

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return query ? `${basePath}?${query}` : basePath;
  };

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-between border-t border-[var(--color-line)] pt-5 text-sm"
    >
      {page > 1 ? (
        <Link
          rel="prev"
          href={hrefFor(page - 1)}
          className="text-[var(--color-accent)] hover:underline"
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}

      <span className="text-[var(--color-ink-muted)]">
        Page {page} of {pageCount}
      </span>

      {page < pageCount ? (
        <Link
          rel="next"
          href={hrefFor(page + 1)}
          className="text-[var(--color-accent)] hover:underline"
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
