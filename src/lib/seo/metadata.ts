import type { Metadata } from "next";
import { directory } from "@/config/directory";
import { canonicalAlternates } from "@/lib/seo/canonical";
import { robotsFor, type IndexDecision } from "@/lib/seo/indexability";

/**
 * Deterministic page metadata.
 *
 * Every page builds its metadata through here, so title shape, canonical
 * shape, robots and Open Graph cannot drift page by page. The inputs are
 * the only thing that varies.
 */

export type PageMetadataInput = {
  title: string;
  description: string;
  /** Root-relative path. The canonical is derived from it. */
  path: string;
  decision: IndexDecision;
  /** Absolute or root-relative. Falls back to the configured default. */
  image?: string | null;
  /** Set for listing pages so social cards read as articles, not sites. */
  type?: "website" | "article";
};

export function pageMetadata({
  title,
  description,
  path,
  decision,
  image,
  type = "website",
}: PageMetadataInput): Metadata {
  const ogImage = image ?? directory.seo.defaultOgImage;

  return {
    title,
    description,
    alternates: canonicalAlternates(path),
    robots: robotsFor(decision),
    openGraph: {
      type,
      title,
      description,
      siteName: directory.siteName,
      locale: directory.locale,
      url: canonicalAlternates(path).canonical,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(directory.seo.twitterHandle
        ? { site: directory.seo.twitterHandle }
        : {}),
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

/**
 * Trim prose to a description length search engines will actually show,
 * cutting at a word boundary rather than mid-word.
 */
export function truncate(text: string, max = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
