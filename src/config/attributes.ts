import { z } from "zod";

/**
 * The niche-specific half of a listing.
 *
 * Everything in `Listing`'s columns is there because every directory needs
 * it. Everything a *particular* directory needs — assets under management,
 * certifications, minimum deal size, delivery radius — goes here, as a
 * validated JSON object.
 *
 * Two rules keep this from becoming an EAV system:
 *
 * 1. This schema is edited per directory. It is not open-ended: an unknown
 *    key is a bug in the CSV, and the importer says so.
 * 2. Nothing you need to filter, sort or index on lives here. SQLite cannot
 *    index inside a JSON string. If a field drives a query, promote it to a
 *    real column in schema.prisma — that is a normal thing to do, not a
 *    failure of the design.
 *
 * The base fields below are the ones that turned out to be near-universal
 * across the directories we expect to build. Keep them, extend them, or
 * replace them wholesale.
 */

/** Rendered as a bulleted list when `features.prosCons` is on. */
const stringList = z.array(z.string().trim().min(1)).max(12);

export const attributesSchema = z
  .object({
    /** Short claims in the listing's favour. */
    pros: stringList.optional(),
    /** Short caveats. Leave empty rather than inventing balance. */
    cons: stringList.optional(),

    /** e.g. "2015". A string, because "founded" is sometimes approximate. */
    founded: z.string().trim().min(1).max(40).optional(),
    /** e.g. "11-50". A band, not a number: exact headcounts go stale. */
    teamSize: z.string().trim().min(1).max(40).optional(),

    /**
     * Free-form key/value rows rendered in the "Details" table. The escape
     * hatch for facts that do not deserve a schema field of their own.
     */
    details: z.record(z.string().trim().min(1), z.string().trim().min(1)).optional(),
  })
  .strict();

export type ListingAttributes = z.infer<typeof attributesSchema>;

export const EMPTY_ATTRIBUTES: ListingAttributes = {};

/**
 * Read attributes off a database row.
 *
 * Never throws. A row whose JSON is corrupt renders as a listing without
 * attributes, which is a slightly poorer page; throwing here would take
 * down a page that is otherwise entirely fine. The importer is where bad
 * attributes are supposed to be caught, and it fails loudly.
 */
export function parseAttributes(raw: string | null | undefined): ListingAttributes {
  if (!raw) return EMPTY_ATTRIBUTES;
  try {
    const parsed = attributesSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_ATTRIBUTES;
  } catch {
    return EMPTY_ATTRIBUTES;
  }
}

/** True when there is nothing worth rendering a section for. */
export function hasAttributes(attributes: ListingAttributes): boolean {
  return Object.values(attributes).some((value) =>
    Array.isArray(value)
      ? value.length > 0
      : typeof value === "object" && value !== null
        ? Object.keys(value).length > 0
        : value !== undefined,
  );
}
