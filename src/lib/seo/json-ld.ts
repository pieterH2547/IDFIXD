import { directory, SITE_URL } from "@/config/directory";
import { canonical } from "@/lib/seo/canonical";

/**
 * Structured data, kept to what the site can honestly assert.
 *
 * Two types ship: `BreadcrumbList`, because the breadcrumbs are really on
 * the page, and `Organization` + `WebSite`, because the publisher really
 * exists. That is the whole list.
 *
 * Deliberately absent: `AggregateRating`, `Review`, and `Product` offers.
 * A directory built from public research has not rated anything and has not
 * reviewed anything. Emitting review markup for ratings that do not exist
 * is the single fastest way to earn a manual action, and the rich snippet
 * it buys is not worth the domain. If a directory later collects real
 * ratings from real users, that is when the markup becomes true.
 */

export type Breadcrumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Breadcrumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: canonical(crumb.path),
    })),
  };
}

export function organizationJsonLd() {
  const sameAs = Object.values(directory.social).filter(
    (url): url is string => typeof url === "string" && url.length > 0,
  );

  return {
    "@context": "https://schema.org",
    "@type": directory.seo.organizationType,
    name: directory.siteName,
    url: `${SITE_URL}/`,
    description: directory.siteDescription,
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: directory.siteName,
    url: `${SITE_URL}/`,
    inLanguage: directory.locale,
  };
}
