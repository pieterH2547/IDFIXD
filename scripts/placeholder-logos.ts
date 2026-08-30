/**
 * `npm run logos` — draw a placeholder mark for every listing that has no
 * logo of its own.
 *
 * A directory of local companies looks broken with an empty column where
 * the logo goes, and the two obvious shortcuts are both wrong: hotlinking
 * an image from the company's own site spends their bandwidth and their
 * copyright and breaks the day they redesign, and a single shared silhouette
 * makes fifty rows indistinguishable.
 *
 * So each company gets its own generated mark: its initials on a colour
 * derived from its slug. Deterministic, so re-running produces byte-identical
 * files and the diff stays empty; distinguishable, so a reader scanning the
 * list has something to anchor on; and unmistakably not a real logo, which
 * matters — a placeholder that looked designed would be passing our artwork
 * off as their brand.
 *
 * Replace one by pointing that row's `logo_url` at the real thing, with the
 * company's permission. Nothing here overwrites a row that already has one.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseCsv } from "../src/lib/csv";

const ROOT = process.cwd();
const OUT = join(ROOT, "public", "logos");

/** Green through teal: the site's accent family, never a random hue. */
const HUE_RANGE: [number, number] = [96, 172];

function hash(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Up to two initials, skipping the words that say nothing.
 *
 * "Boomverzorging Fonteyn" reads as F, not BF — half the shortlist starts
 * with the same word, and initials that collide defeat the point.
 */
const NOISE = new Set([
  "boomverzorging",
  "boomverzorger",
  "boomzorg",
  "boomwerken",
  "de",
  "het",
  "een",
  "voor",
  "al",
  "uw",
  "en",
  "van",
]);

function initials(name: string): string {
  const words = name
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .split(/[\s.-]+/)
    .filter(Boolean);

  const meaningful = words.filter((word) => !NOISE.has(word.toLowerCase()));
  const source = meaningful.length > 0 ? meaningful : words;

  return source
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function svg(name: string, slug: string): string {
  const seed = hash(slug);
  const [min, max] = HUE_RANGE;
  const hue = min + (seed % (max - min));
  // Two close hues rather than one flat fill: it reads as a mark instead of
  // a coloured box, without becoming decoration.
  const from = `hsl(${hue} 38% 30%)`;
  const to = `hsl(${(hue + 14) % 360} 42% 22%)`;
  const text = initials(name);
  const size = text.length > 1 ? 34 : 42;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" role="img" aria-label="${escapeAttribute(name)}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/>
      <stop offset="1" stop-color="${to}"/>
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="18" fill="url(#g)"/>
  <text x="48" y="48" fill="#ffffff" font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" font-size="${size}" font-weight="600" letter-spacing="0.5" text-anchor="middle" dominant-baseline="central">${escapeText(text)}</text>
</svg>
`;
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return escapeText(value).replace(/"/g, "&quot;");
}

function main() {
  const csv = readFileSync(join(ROOT, "data", "listings.csv"), "utf8");
  const rows = parseCsv(csv);

  mkdirSync(OUT, { recursive: true });

  let written = 0;
  let skipped = 0;

  for (const row of rows) {
    const logo = row.logo_url?.trim() ?? "";
    const name = row.name?.trim() ?? "";
    if (!name) continue;

    // Only rows that asked for a generated mark. A real logo, local or
    // remote, is left exactly as it is.
    const match = /^\/logos\/([a-z0-9-]+)\.svg$/.exec(logo);
    if (!match?.[1]) {
      skipped += 1;
      continue;
    }

    writeFileSync(join(OUT, `${match[1]}.svg`), svg(name, match[1]));
    written += 1;
  }

  console.log(
    `\n✔ ${written} placeholder mark(s) written to public/logos${skipped > 0 ? `, ${skipped} row(s) already have a logo` : ""}.\n`,
  );
}

if (!existsSync(join(ROOT, "data", "listings.csv"))) {
  console.error("\n✖ No data/listings.csv found.\n");
  process.exit(1);
}

main();
