/**
 * The file you edit to turn this template into a specific directory.
 *
 * The test this file has to pass: launching a directory of acquisition
 * firms, of specialist consultants, of industrial suppliers or of AI
 * vendors should mean editing this file, the branding, the categories and
 * the CSV — and touching no component.
 *
 * That works because no component contains the word "listing" in text a
 * user reads. They all read `directory.listing.singular` and friends. If
 * you find yourself editing a component to rename something, the naming
 * belongs here instead.
 */

export type FeatureFlags = {
  /** Search box on the homepage and the directory index. */
  search: boolean;
  /** Country/city fields: filter on the index, location on the listing page. */
  locations: boolean;
  /** Show `pricingText` on the listing page. */
  pricing: boolean;
  /** Show `attributes.pros` / `attributes.cons` on the listing page. */
  prosCons: boolean;
  /** Enable /claim/[slug]. */
  claims: boolean;
  /** Enable /suggest. */
  suggestions: boolean;
  /** Show tags on listing pages and match them in search. */
  tags: boolean;
  /** Show the sources block and the last-verified date. */
  sources: boolean;
};

export type NavItem = { label: string; href: string };

export type DirectoryConfig = {
  siteName: string;
  siteDescription: string;
  /** No trailing slash. Overridden at runtime by NEXT_PUBLIC_SITE_URL. */
  siteUrl: string;
  /** BCP 47. One locale — see docs/ARCHITECTURE.md on why there is no i18n. */
  locale: string;

  directoryName: string;
  listing: {
    singular: string;
    plural: string;
    /** Mid-sentence forms, e.g. "no consultants match this filter". */
    singularLower: string;
    pluralLower: string;
  };

  /** Prefilled in the country filter. `null` = no default. */
  defaultCountry: string | null;

  primaryCta: NavItem;
  nav: NavItem[];
  footerNav: NavItem[];

  seo: {
    /**
     * `%s` is replaced by the page title. Omit it and the template is
     * derived from `siteName`, which is what you want — see
     * `TITLE_TEMPLATE` below for why a second copy of the brand name is a
     * trap. Set it only when the suffix genuinely differs from the name.
     */
    titleTemplate?: string;
    /** Absolute or root-relative path to the default social image. */
    defaultOgImage: string | null;
    twitterHandle: string | null;
    /** schema.org type for the site's publisher. */
    organizationType: "Organization" | "LocalBusiness" | "Corporation";
  };

  social: {
    linkedin?: string;
    x?: string;
    github?: string;
  };

  contactEmail: string;

  /**
   * Who legally publishes this directory.
   *
   * Rendered in the footer on every page. A directory that takes claims,
   * suggestions and email addresses is processing personal data, and in the
   * EU the publisher has to be identifiable — so this is not decoration.
   *
   * Never ship a placeholder VAT number. A fake registration number is
   * worse than none: it is checkable, and it fails the check.
   */
  company: {
    name: string;
    /** Registered office, as it appears in the company register. */
    registeredOffice: string;
    /** KBO/BTW/VAT, formatted as the register writes it. */
    vat: string;
  };

  legal: {
    /**
     * The full text of each page, or `null` while it is unwritten.
     *
     * `null` makes the page render a placeholder, stay out of the index and
     * stay out of the sitemap. Filling it in flips all three at once —
     * which is the point. A separate "published" flag would be a thing to
     * forget, and a forgotten one leaves an empty legal page indexed.
     *
     * Paragraphs are split on blank lines. This is not the place for a
     * generated text: have a lawyer write it, or link to one you already
     * have.
     */
    terms: string | null;
    privacy: string | null;
  };

  features: FeatureFlags;

  /** Rows per page on /directory. */
  listingsPerPage: number;

  indexing: {
    /**
     * A category page with fewer published listings than this is noindex.
     * A near-empty category page is a thin page, and thin pages drag the
     * whole domain down rather than just underperforming themselves.
     */
    minListingsPerCategory: number;
  };
};

export const directory: DirectoryConfig = {
  siteName: "Directory Starter",
  siteDescription:
    "A worked example of the directory starter: neutral demo data, real structure.",
  siteUrl: "https://example.com",
  locale: "en",

  directoryName: "Directory",
  listing: {
    singular: "Listing",
    plural: "Listings",
    singularLower: "listing",
    pluralLower: "listings",
  },

  defaultCountry: null,

  primaryCta: { label: "Browse the directory", href: "/directory" },
  nav: [
    { label: "Directory", href: "/directory" },
    { label: "Categories", href: "/categories" },
  ],
  footerNav: [
    { label: "Directory", href: "/directory" },
    { label: "Categories", href: "/categories" },
    // Entity-neutral on purpose: a label saying "Suggest a listing" would
    // still say "listing" after `listing.singular` became "Firm".
    { label: "Suggest an addition", href: "/suggest" },
  ],

  seo: {
    defaultOgImage: null,
    twitterHandle: null,
    organizationType: "Organization",
  },

  social: {},

  contactEmail: "hello@example.com",

  company: {
    name: "ID Fix BV",
    registeredOffice: "2547 Lint, België",
    vat: "BE 0776.358.207",
  },

  legal: {
    // Written by a lawyer, pasted here. Until then both pages say so
    // plainly and neither is indexed.
    terms: null,
    privacy: null,
  },

  features: {
    search: true,
    locations: true,
    pricing: true,
    prosCons: true,
    claims: true,
    suggestions: true,
    tags: true,
    sources: true,
  },

  listingsPerPage: 24,

  indexing: {
    minListingsPerCategory: 3,
  },
};

/**
 * The site's own origin, without a trailing slash.
 *
 * A preview deployment must never claim to be production. Both of the ways
 * people actually configure Vercel get that wrong if the origin is just
 * `NEXT_PUBLIC_SITE_URL ?? siteUrl`:
 *
 * - set `NEXT_PUBLIC_SITE_URL` for every environment, which is the obvious
 *   thing to do, and every preview page canonicalises into the live site;
 * - set it for Production only, and previews fall back to `siteUrl` — the
 *   template placeholder, so the canonical points at a domain you do not
 *   own.
 *
 * So a Vercel preview always uses its own deployment host, whatever the
 * environment variables say. Vercel additionally serves preview
 * deployments with `X-Robots-Tag: noindex` by default; this keeps the
 * canonical honest even if that is ever turned off.
 */
export function resolveSiteUrl(
  env: Record<string, string | undefined> = process.env,
): string {
  const isPreview =
    (env.NEXT_PUBLIC_VERCEL_ENV ?? env.VERCEL_ENV) === "preview";
  const deploymentHost = env.NEXT_PUBLIC_VERCEL_URL ?? env.VERCEL_URL;

  if (isPreview && deploymentHost) {
    return `https://${deploymentHost}`.replace(/\/+$/, "");
  }

  return (env.NEXT_PUBLIC_SITE_URL ?? directory.siteUrl).replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl();

/**
 * The `title.template` for the root layout.
 *
 * Derived from `siteName` rather than configured beside it. A separate
 * `titleTemplate: "%s | Directory Starter"` repeats the brand name, and
 * renaming the site while forgetting the second copy leaves every page
 * title carrying the old brand — silently, because nothing else on the
 * page looks wrong.
 */
export const TITLE_TEMPLATE =
  directory.seo.titleTemplate ?? `%s | ${directory.siteName}`;
