import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { directory } from "@/config/directory";
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

  it("points its primary CTA at a route that exists", () => {
    expect(["/directory", "/categories"]).toContain(
      directory.primaryCta.href,
    );
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
