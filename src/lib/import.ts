import { z } from "zod";
import { parseBoolean, parseCsv, splitList } from "@/lib/csv";
import { slugify } from "@/lib/slug";
import {
  categoryInputSchema,
  listingInputSchema,
  type CategoryInput,
  type ListingInput,
} from "@/lib/validation";

/**
 * Turning a spreadsheet into validated records — the pure half of the
 * importer. `scripts/import.ts` is the half that touches the database.
 *
 * Separated so the rules can be tested without one, and because "did this
 * CSV parse" and "did this write succeed" are different questions that
 * deserve different error messages.
 *
 * Everything here fails loudly. A row that cannot be validated stops the
 * import; it does not get skipped with a warning. A silently skipped row
 * becomes a page that never appears, and nobody notices for a month.
 */

export type RowError = { row: number; field: string; message: string };

export type ParseResult<T> =
  | { ok: true; rows: T[] }
  | { ok: false; errors: RowError[] };

function collect(error: z.ZodError, rowNumber: number): RowError[] {
  return error.issues.map((issue) => ({
    row: rowNumber,
    field: issue.path.join(".") || "(row)",
    message: issue.message,
  }));
}

/**
 * CSV column → listing field.
 *
 * `attributes_json` takes a JSON object for the niche-specific fields;
 * `pros` and `cons` are lifted out as their own columns because they are
 * the two people most often want and typing JSON into a spreadsheet cell
 * is miserable.
 */
function csvRowToListing(record: Record<string, string>): unknown {
  const attributesRaw = record.attributes_json?.trim();
  const attributes: Record<string, unknown> = attributesRaw
    ? JSON.parse(attributesRaw)
    : {};

  const pros = splitList(record.pros);
  const cons = splitList(record.cons);
  if (pros.length > 0) attributes.pros = pros;
  if (cons.length > 0) attributes.cons = cons;

  const sources = splitList(record.sources).map((url) => ({ url }));

  return {
    name: record.name ?? "",
    slug: record.slug,
    status: record.status?.trim().toUpperCase() || "PUBLISHED",
    shortDescription: record.short_description,
    description: record.description,
    websiteUrl: record.website_url,
    logoUrl: record.logo_url,
    country: record.country,
    city: record.city,
    pricingText: record.pricing_text,
    featured: parseBoolean(record.featured),
    verified: parseBoolean(record.verified),
    attributes,
    publishedAt: record.published_at,
    lastVerifiedAt: record.last_verified_at,
    categories: splitList(record.categories).map(slugify),
    tags: splitList(record.tags).map(slugify),
    sources,
  };
}

export function parseListingsCsv(csv: string): ParseResult<ListingInput> {
  const records = parseCsv(csv);
  const rows: ListingInput[] = [];
  const errors: RowError[] = [];

  records.forEach((record, index) => {
    // +2: header is line 1, and humans count from 1.
    const rowNumber = index + 2;

    let candidate: unknown;
    try {
      candidate = csvRowToListing(record);
    } catch {
      errors.push({
        row: rowNumber,
        field: "attributes_json",
        message: "not valid JSON",
      });
      return;
    }

    const parsed = listingInputSchema.safeParse(candidate);
    if (parsed.success) rows.push(parsed.data);
    else errors.push(...collect(parsed.error, rowNumber));
  });

  const duplicates = findDuplicateSlugs(rows);
  errors.push(...duplicates);

  return errors.length > 0 ? { ok: false, errors } : { ok: true, rows };
}

export function parseListingsJson(json: string): ParseResult<ListingInput> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return {
      ok: false,
      errors: [{ row: 0, field: "(file)", message: "not valid JSON" }],
    };
  }

  if (!Array.isArray(parsed)) {
    return {
      ok: false,
      errors: [
        { row: 0, field: "(file)", message: "expected an array of listings" },
      ],
    };
  }

  const rows: ListingInput[] = [];
  const errors: RowError[] = [];

  parsed.forEach((entry, index) => {
    const result = listingInputSchema.safeParse(entry);
    if (result.success) rows.push(result.data);
    else errors.push(...collect(result.error, index + 1));
  });

  errors.push(...findDuplicateSlugs(rows));

  return errors.length > 0 ? { ok: false, errors } : { ok: true, rows };
}

export function parseCategoriesCsv(csv: string): ParseResult<CategoryInput> {
  const records = parseCsv(csv);
  const rows: CategoryInput[] = [];
  const errors: RowError[] = [];

  records.forEach((record, index) => {
    const rowNumber = index + 2;
    const parsed = categoryInputSchema.safeParse({
      name: record.name ?? "",
      slug: record.slug,
      description: record.description,
      axis: record.axis?.trim() || undefined,
      seoTitle: record.seo_title,
      seoDescription: record.seo_description,
      published: record.published ? parseBoolean(record.published) : true,
      sortOrder: record.sort_order ? Number(record.sort_order) : 0,
    });

    if (parsed.success) rows.push(parsed.data);
    else errors.push(...collect(parsed.error, rowNumber));
  });

  const seen = new Set<string>();
  rows.forEach((row, index) => {
    if (seen.has(row.slug)) {
      errors.push({
        row: index + 2,
        field: "slug",
        message: `duplicate category slug "${row.slug}"`,
      });
    }
    seen.add(row.slug);
  });

  return errors.length > 0 ? { ok: false, errors } : { ok: true, rows };
}

/**
 * Two rows resolving to the same slug is always a mistake, and always
 * silent if you let it through: the second row overwrites the first, one
 * listing vanishes, and the row count still looks right.
 *
 * The common cause is two genuinely different entities with names that
 * slugify identically ("Meridian Systems" and "Meridian systems."). The
 * fix is an explicit `slug` column on one of them, which the message says.
 */
export function findDuplicateSlugs(rows: { slug: string }[]): RowError[] {
  const firstSeenAt = new Map<string, number>();
  const errors: RowError[] = [];

  rows.forEach((row, index) => {
    const previous = firstSeenAt.get(row.slug);
    if (previous !== undefined) {
      errors.push({
        row: index + 2,
        field: "slug",
        message: `duplicate slug "${row.slug}", already used by row ${previous}; set an explicit slug on one of them`,
      });
    } else {
      firstSeenAt.set(row.slug, index + 2);
    }
  });

  return errors;
}

export function formatErrors(errors: RowError[]): string {
  return errors
    .map((error) => `  row ${error.row}: ${error.field} — ${error.message}`)
    .join("\n");
}
