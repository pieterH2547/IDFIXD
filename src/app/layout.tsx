import type { Metadata } from "next";
import "./globals.css";
import { directory, SITE_URL } from "@/config/directory";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { JsonLd } from "@/components/json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";

/**
 * Note what is *not* here: `alternates.canonical`.
 *
 * In the App Router a canonical declared on the root layout is inherited by
 * every page that does not set its own, which tells search engines the
 * whole site is a duplicate of the homepage. Every page in this app builds
 * its metadata through `pageMetadata()`, which always sets one. Do not add
 * a canonical here. See `src/lib/seo/canonical.ts`.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: directory.siteName,
    template: directory.seo.titleTemplate,
  },
  description: directory.siteDescription,
  applicationName: directory.siteName,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={directory.locale}>
      <body className="flex min-h-screen flex-col">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
