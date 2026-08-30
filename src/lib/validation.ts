import { z } from "zod";
import { attributesSchema } from "@/config/attributes";
import { isValidSlug, slugify } from "@/lib/slug";

/**
 * One validation layer, used by the importer and the forms.
 *
 * SQLite has no enum type, so Prisma stores `status` and `kind` as strings.
 * These schemas are what actually constrains them — which means anything
 * writing to the database has to go through here, and the importer does.
 */

export const LISTING_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const listingStatusSchema = z.enum(LISTING_STATUSES);
export type ListingStatus = z.infer<typeof listingStatusSchema>;

export const SUBMISSION_KINDS = ["CLAIM", "SUGGESTION"] as const;
export const submissionKindSchema = z.enum(SUBMISSION_KINDS);
export type SubmissionKind = z.infer<typeof submissionKindSchema>;

/**
 * A URL we are willing to put in an `href`.
 *
 * The protocol check is the point: `javascript:` and `data:` parse as valid
 * URLs, and a directory built from a spreadsheet someone else filled in is
 * exactly where one would arrive.
 */
export const httpUrlSchema = z
  .string()
  .trim()
  .url("must be a valid URL")
  .refine(
    (value) => {
      try {
        const protocol = new URL(value).protocol;
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "must be an http(s) URL" },
  );

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional();

const optionalUrl = z
  .union([z.literal(""), httpUrlSchema])
  .transform((value) => (value === "" ? undefined : value))
  .optional();

/** An ISO date, or a plain YYYY-MM-DD as a spreadsheet would produce. */
const optionalDate = z
  .union([z.literal(""), z.string().trim()])
  .transform((value, ctx) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      ctx.addIssue({ code: "custom", message: `not a date: "${value}"` });
      return z.NEVER;
    }
    return parsed;
  })
  .optional();

/**
 * One row as it arrives from CSV or JSON, before it becomes a database row.
 *
 * `slug` is optional: leaving it out derives one from the name, which is
 * what you want for a fresh dataset. Setting it explicitly is what you want
 * once pages are published and a name gets corrected — the slug is the
 * thing other people linked to, so it survives the rename.
 */
export const listingInputSchema = z
  .object({
    name: z.string().trim().min(1, "name is required").max(200),
    slug: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined))
      .refine((value) => value === undefined || isValidSlug(value), {
        message: "slug must be lowercase, hyphen-separated, no accents",
      }),
    status: listingStatusSchema.default("PUBLISHED"),

    shortDescription: optionalText(300),
    description: optionalText(20_000),
    websiteUrl: optionalUrl,
    logoUrl: optionalUrl,

    country: optionalText(80),
    city: optionalText(80),
    pricingText: optionalText(300),

    featured: z.boolean().default(false),
    verified: z.boolean().default(false),

    attributes: attributesSchema.default({}),

    publishedAt: optionalDate,
    lastVerifiedAt: optionalDate,

    /** Category slugs. Unknown ones are created by the importer. */
    categories: z.array(z.string().trim().min(1)).default([]),
    tags: z.array(z.string().trim().min(1)).default([]),
    sources: z
      .array(
        z.object({
          url: httpUrlSchema,
          label: optionalText(160),
          checkedAt: optionalDate,
        }),
      )
      .default([]),
  })
  .strict()
  .transform((row) => ({
    ...row,
    slug: row.slug ?? slugify(row.name),
  }))
  .refine((row) => row.slug.length > 0, {
    message: "name produced an empty slug; set an explicit slug",
    path: ["slug"],
  });

export type ListingInput = z.infer<typeof listingInputSchema>;

export const categoryInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    slug: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined))
      .refine((value) => value === undefined || isValidSlug(value), {
        message: "slug must be lowercase, hyphen-separated, no accents",
      }),
    description: optionalText(600),
    seoTitle: optionalText(160),
    seoDescription: optionalText(320),
    published: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
  })
  .strict()
  .transform((row) => ({ ...row, slug: row.slug ?? slugify(row.name) }));

export type CategoryInput = z.infer<typeof categoryInputSchema>;

/**
 * Both public forms. `listingSlug` is set for claims and absent otherwise.
 *
 * `organisation` carries different weight in each: on a claim it is the
 * sender's role ("founder", "their agency") and optional; on a suggestion
 * it is the name of the thing being suggested, without which the
 * submission says nothing. The refine below enforces that, so the server
 * agrees with the `required` attribute on the form rather than trusting it
 * — a `required` attribute is a hint to a browser, not a validation.
 */
export const submissionSchema = z
  .object({
    kind: submissionKindSchema,
    listingSlug: z.string().trim().max(120).optional(),
    name: z.string().trim().min(1, "Your name is required").max(160),
    email: z.string().trim().email("A valid email address is required").max(200),
    organisation: optionalText(200),
    websiteUrl: optionalUrl,
    message: optionalText(4_000),
  })
  .refine(
    (value) => value.kind !== "SUGGESTION" || Boolean(value.organisation),
    { message: "A name is required", path: ["organisation"] },
  );

export type SubmissionInput = z.infer<typeof submissionSchema>;
