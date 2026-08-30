/**
 * Slugs are the one identifier that leaks into URLs, sitemaps, canonical
 * tags and other people's links. They have to be deterministic: importing
 * the same CSV twice must produce the same slugs, or the second import
 * silently orphans every page the first one published.
 */

/** Combining diacritical marks, left over after NFKD normalisation. */
const COMBINING_MARKS = /[̀-ͯ]/g;
/** Straight and typographic apostrophes: dropped, not turned into hyphens. */
const APOSTROPHES = /['’]/g;

/**
 * Turn a name into a URL segment.
 *
 * Unicode is normalised and stripped of combining marks, so "Zürich Kapital"
 * and "Zurich Kapital" collapse to the same slug rather than producing two
 * listings that look identical to a reader.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(APOSTROPHES, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

/** A slug is valid if slugifying it changes nothing. */
export function isValidSlug(value: string): boolean {
  return value.length > 0 && slugify(value) === value;
}
