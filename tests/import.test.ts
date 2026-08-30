import { describe, expect, it } from "vitest";
import {
  findDuplicateSlugs,
  parseCategoriesCsv,
  parseListingsCsv,
  parseListingsJson,
} from "@/lib/import";
import { parseCsv, splitList } from "@/lib/csv";
import { slugify } from "@/lib/slug";

const HEADER =
  "name,slug,status,short_description,website_url,categories,attributes_json";

function csv(...rows: string[]): string {
  return [HEADER, ...rows].join("\n");
}

describe("CSV parsing", () => {
  it("handles quoted fields containing commas and newlines", () => {
    const rows = parseCsv(
      'name,note\n"Northstar, Partners","line one\nline two"\n',
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.name).toBe("Northstar, Partners");
    expect(rows[0]?.note).toBe("line one\nline two");
  });

  it("unescapes doubled quotes", () => {
    const rows = parseCsv('name\n"He said ""hello"""\n');
    expect(rows[0]?.name).toBe('He said "hello"');
  });

  it("tolerates CRLF and a UTF-8 BOM", () => {
    const rows = parseCsv("﻿name,city\r\nArbor Works,Eindhoven\r\n");
    expect(rows[0]?.name).toBe("Arbor Works");
    expect(rows[0]?.city).toBe("Eindhoven");
  });

  it("splits list columns on comma, semicolon or pipe", () => {
    expect(splitList("a, b; c | d")).toEqual(["a", "b", "c", "d"]);
    expect(splitList("")).toEqual([]);
  });
});

describe("slugs", () => {
  it("is deterministic, so a second import does not orphan pages", () => {
    expect(slugify("Northstar Partners")).toBe("northstar-partners");
    expect(slugify("Northstar Partners")).toBe(slugify("Northstar Partners"));
  });

  it("folds accents rather than dropping the character", () => {
    expect(slugify("Zürich Kapital")).toBe("zurich-kapital");
  });

  it("strips apostrophes instead of turning them into hyphens", () => {
    expect(slugify("O'Brien & Co")).toBe("obrien-co");
  });
});

describe("duplicate slug rejection", () => {
  it("rejects two rows whose names produce the same slug", () => {
    const result = parseListingsCsv(
      csv(
        "Meridian Systems,,PUBLISHED,First,,technology,",
        "Meridian systems.,,PUBLISHED,Second,,technology,",
      ),
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;

    const duplicate = result.errors.find((e) => e.field === "slug");
    expect(duplicate).toBeDefined();
    expect(duplicate?.message).toContain("meridian-systems");
    // The message has to name the earlier row, or a 300-row file leaves you
    // hunting for which two collided.
    expect(duplicate?.message).toContain("row 2");
  });

  it("names the row that collided, not just the fact of a collision", () => {
    const errors = findDuplicateSlugs([
      { slug: "alpha" },
      { slug: "beta" },
      { slug: "alpha" },
    ]);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.row).toBe(4);
  });

  it("accepts rows disambiguated by an explicit slug", () => {
    const result = parseListingsCsv(
      csv(
        "Meridian Systems,meridian-systems,PUBLISHED,First,,technology,",
        "Meridian systems.,meridian-systems-nl,PUBLISHED,Second,,technology,",
      ),
    );
    expect(result.ok).toBe(true);
  });
});

describe("invalid import rejection", () => {
  it("rejects a row with no name", () => {
    const result = parseListingsCsv(csv(",,PUBLISHED,Something,,advisory,"));
    expect(result.ok).toBe(false);
  });

  it("rejects a non-http URL", () => {
    const result = parseListingsCsv(
      csv("Northstar,,PUBLISHED,Advisory,javascript:alert(1),advisory,"),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.field === "websiteUrl")).toBe(true);
  });

  it("rejects an unknown status", () => {
    const result = parseListingsCsv(
      csv("Northstar,,LIVE,Advisory,,advisory,"),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.field === "status")).toBe(true);
  });

  it("rejects malformed attributes JSON", () => {
    const result = parseListingsCsv(
      csv("Northstar,,PUBLISHED,Advisory,,advisory,{not json}"),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.field).toBe("attributes_json");
  });

  it("rejects an attribute key the schema does not declare", () => {
    const result = parseListingsCsv(
      csv(`Northstar,,PUBLISHED,Advisory,,advisory,"{""madeUpField"":""x""}"`),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects an uppercase slug rather than silently fixing it", () => {
    const result = parseListingsCsv(
      csv("Northstar,Northstar-Partners,PUBLISHED,Advisory,,advisory,"),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.some((e) => e.field === "slug")).toBe(true);
  });

  it("reports the human row number, counting the header", () => {
    const result = parseListingsCsv(
      csv(
        "Northstar,,PUBLISHED,Advisory,,advisory,",
        ",,PUBLISHED,Broken,,advisory,",
      ),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors[0]?.row).toBe(3);
  });
});

describe("valid imports", () => {
  it("derives a slug and normalises category names to slugs", () => {
    const result = parseListingsCsv(
      csv(`Oakridge Advisory,,PUBLISHED,Diligence,,"Advisory, Operations",`),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const row = result.rows[0];
    expect(row?.slug).toBe("oakridge-advisory");
    expect(row?.categories).toEqual(["advisory", "operations"]);
  });

  it("defaults status to PUBLISHED when the column is empty", () => {
    const result = parseListingsCsv(csv("Arbor Works,,,Timber,,operations,"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0]?.status).toBe("PUBLISHED");
  });

  it("accepts JSON input as an alternative to CSV", () => {
    const result = parseListingsJson(
      JSON.stringify([{ name: "Halden Data", categories: ["technology"] }]),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0]?.slug).toBe("halden-data");
  });

  it("rejects a JSON file that is not an array", () => {
    expect(parseListingsJson('{"name":"x"}').ok).toBe(false);
  });

  it("parses the shipped demo categories", () => {
    const result = parseCategoriesCsv(
      "slug,name,published,sort_order\nadvisory,Advisory,yes,10\n",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0]?.published).toBe(true);
    expect(result.rows[0]?.sortOrder).toBe(10);
  });
});
