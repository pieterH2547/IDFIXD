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
    /** `%s` is replaced by the page title. */
    titleTemplate: string;
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
    { label: "Suggest a listing", href: "/suggest" },
  ],

  seo: {
    titleTemplate: "%s | Directory Starter",
    defaultOgImage: null,
    twitterHandle: null,
    organizationType: "Organization",
  },

  social: {},

  contactEmail: "hello@example.com",

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
 * Reads the environment first so one build can serve a preview deployment
 * and production without the canonical URLs lying about which one it is.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? directory.siteUrl
).replace(/\/+$/, "");
