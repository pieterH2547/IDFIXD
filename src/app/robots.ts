import type { MetadataRoute } from "next";
import { canonical, SITE_URL } from "@/lib/seo/canonical";
import { directory } from "@/config/directory";

/**
 * `/directory?` blocks the filtered views of the index — and only those.
 *
 * Note the exact shape. "/directory?" matches a query string on the index
 * itself; `/directory` and every `/directory/<slug>` page are untouched,
 * because neither has a "?" in that position.
 *
 * Those URLs already declare `canonical: /directory` and never enter the
 * sitemap, so this is belt and braces rather than the primary defence. It
 * earns its place because a canonical is a hint that a crawler may ignore
 * after it has already fetched the page, while a robots rule stops the
 * fetch — and a directory with three filters generates more filter
 * combinations than it has listings.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/directory?",
          ...(directory.features.claims ? ["/claim/"] : []),
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: canonical("/"),
  };
}
