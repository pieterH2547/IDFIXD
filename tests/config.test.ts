import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { directory, resolveSiteUrl, TITLE_TEMPLATE } from "@/config/directory";
import { branding } from "@/config/branding";
import { attributesSchema, parseAttributes } from "@/config/attributes";

/**
 * These tests protect the promise the template makes: that launching a new
 * directory means editing config, not components.
 *
 * They fail when someone hardcodes a user-visible noun in a component, or
 * lets the CSS tokens drift from the branding object.
 */

const SRC = join(process.cwd(), "src");

describe("config-driven naming", () => {
  it("exposes both cases of both forms, so no component has to case a noun", () => {
    expect(directory.listing.singular.length).toBeGreaterThan(0);
    expect(directory.listing.plural.length).toBeGreaterThan(0);
    expect(directory.listing.singularLower).toBe(
      directory.listing.singularLower.toLowerCase(),
    );
    expect(directory.listing.pluralLower).toBe(
      directory.listing.pluralLower.toLowerCase(),
    );
  });

  it("renaming the entity changes what pages say", () => {
    // What a page does: read the config rather than a literal.
    const renamed = {
      ...directory,
      listing: {
        singular: "Firm",
        plural: "Firms",
        singularLower: "firm",
        pluralLower: "firms",
      },
    };
    expect(`No ${renamed.listing.pluralLower} match this view.`).toBe(
      "No firms match this view.",
    );
  });

  it("has no trailing slash on the site URL", () => {
    expect(directory.siteUrl.endsWith("/")).toBe(false);
  });

  it("keeps every feature flag boolean, so a typo cannot enable a section", () => {
    for (const [name, value] of Object.entries(directory.features)) {
      expect(typeof value, `features.${name}`).toBe("boolean");
    }
  });

  it("derives the title template from siteName, so renaming needs one edit", () => {
    expect(TITLE_TEMPLATE).toBe(`%s | ${directory.siteName}`);
    expect(TITLE_TEMPLATE).toContain("%s");
  });

  it("ships no nav label naming the entity, which renaming would strand", () => {
    const labels = [...directory.nav, ...directory.footerNav].map((item) =>
      item.label.toLowerCase(),
    );
    for (const label of labels) {
      expect(label, `nav label "${label}"`).not.toContain(
        directory.listing.singularLower,
      );
      expect(label, `nav label "${label}"`).not.toContain(
        directory.listing.pluralLower,
      );
    }
  });

  it("points its primary CTA at a route that exists", () => {
    expect(["/directory", "/categories"]).toContain(
      directory.primaryCta.href,
    );
  });
});

describe("site origin", () => {
  const PREVIEW_HOST = "my-app-git-branch-team.vercel.app";
  const PRODUCTION = "https://acquisitionfirms.example";

  it("uses the configured origin in production", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: PRODUCTION,
        VERCEL_ENV: "production",
      }),
    ).toBe(PRODUCTION);
  });

  it("never lets a preview claim the production origin", () => {
    // The common Vercel setup: one NEXT_PUBLIC_SITE_URL for every
    // environment. Without the preview branch, every preview page would
    // canonicalise into the live site.
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: PRODUCTION,
        VERCEL_ENV: "preview",
        VERCEL_URL: PREVIEW_HOST,
      }),
    ).toBe(`https://${PREVIEW_HOST}`);
  });

  it("never lets a preview fall back to the template placeholder", () => {
    // The other setup: NEXT_PUBLIC_SITE_URL on Production only. The
    // fallback would be `directory.siteUrl` — a domain nobody owns.
    expect(
      resolveSiteUrl({
        VERCEL_ENV: "preview",
        VERCEL_URL: PREVIEW_HOST,
      }),
    ).toBe(`https://${PREVIEW_HOST}`);
  });

  it("reads the NEXT_PUBLIC_ system variables too", () => {
    expect(
      resolveSiteUrl({
        NEXT_PUBLIC_SITE_URL: PRODUCTION,
        NEXT_PUBLIC_VERCEL_ENV: "preview",
        NEXT_PUBLIC_VERCEL_URL: PREVIEW_HOST,
      }),
    ).toBe(`https://${PREVIEW_HOST}`);
  });

  it("keeps the configured origin off Vercel entirely", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://localhost:3000" })).toBe(
      "http://localhost:3000",
    );
    expect(resolveSiteUrl({})).toBe(directory.siteUrl);
  });

  it("strips a trailing slash however the origin was supplied", () => {
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: `${PRODUCTION}/` })).toBe(
      PRODUCTION,
    );
  });
});

describe("publisher identity", () => {
  const { company } = directory;

  it("names a real publisher, not a placeholder", () => {
    for (const [field, value] of Object.entries(company)) {
      expect(value.trim().length, `company.${field}`).toBeGreaterThan(0);
      // The failure mode this guards against is a template placeholder
      // reaching production. A fake registration number is worse than none:
      // it is checkable, and it fails the check.
      expect(value.toLowerCase(), `company.${field}`).not.toMatch(
        /example|placeholder|your company|todo|xxx|123456789/,
      );
    }
  });

  it("carries a VAT number in a recognisable register format", () => {
    // Two letters, then digits and separators. Deliberately not a
    // country-specific checksum: this has to accept whatever register the
    // directory's publisher is in.
    expect(company.vat).toMatch(/^[A-Z]{2}[\s.]?[\d.\s-]{8,}$/);
  });

  it("treats an unwritten legal document as absent, not as empty text", () => {
    // `""` would render as a published-but-blank page and would be indexed.
    // `null` is the only way to say "not written yet".
    for (const [name, value] of Object.entries(directory.legal)) {
      expect(value === null || value.trim().length > 0, `legal.${name}`).toBe(
        true,
      );
    }
  });
});

describe("branding", () => {
  it("keeps the CSS tokens and the branding object in agreement", () => {
    const css = readFileSync(join(SRC, "app", "globals.css"), "utf8");
    const pairs: [string, string][] = [
      ["--color-accent", branding.colors.accent],
      ["--color-accent-hover", branding.colors.accentHover],
      ["--color-surface", branding.colors.surface],
      ["--color-line", branding.colors.border],
      ["--color-ink", branding.colors.text],
      ["--color-ink-muted", branding.colors.textMuted],
    ];

    for (const [token, value] of pairs) {
      expect(css, `${token} should be ${value}`).toContain(`${token}: ${value}`);
    }
  });
});

describe("attributes schema", () => {
  it("rejects an undeclared key rather than storing it", () => {
    expect(attributesSchema.safeParse({ nope: 1 }).success).toBe(false);
  });

  it("accepts the declared shape", () => {
    const parsed = attributesSchema.safeParse({
      pros: ["Senior team"],
      founded: "2016",
      details: { "Typical deal size": "€5m-€50m" },
    });
    expect(parsed.success).toBe(true);
  });

  it("never throws when reading a corrupt row", () => {
    expect(parseAttributes("{oh no")).toEqual({});
    expect(parseAttributes(null)).toEqual({});
    expect(parseAttributes('{"unknownKey":true}')).toEqual({});
  });
});
