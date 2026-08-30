import Link from "next/link";
import { directory } from "@/config/directory";
import { branding } from "@/config/branding";

/**
 * Header and footer.
 *
 * Neither contains a hardcoded word a visitor reads: the wordmark, the nav
 * and the CTA all come from config. That is what lets the same component
 * serve a directory of acquisition firms and one of industrial suppliers.
 */

export function SiteHeader() {
  const wordmark = branding.wordmark ?? directory.siteName;

  return (
    <header className="border-b border-[var(--color-line)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-[var(--color-ink)]"
        >
          {branding.logoSrc ? (
            // A fixed-height local wordmark gains nothing from the
            // optimisation pipeline, and `next/image` would make every new
            // directory declare its logo's intrinsic dimensions.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={branding.logoSrc} alt={branding.logoAlt} className="h-7" />
          ) : (
            wordmark
          )}
        </Link>

        <nav
          aria-label="Hoofdnavigatie"
          className="flex items-center gap-5 text-sm text-[var(--color-ink-muted)]"
        >
          {directory.nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-[var(--color-ink)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href={directory.primaryCta.href}
          className="ml-auto rounded-md bg-[var(--color-accent)] px-3.5 py-2 text-sm font-medium text-white hover:bg-[var(--color-accent-hover)]"
        >
          {directory.primaryCta.label}
        </Link>
      </div>
    </header>
  );
}

/**
 * The footer carries the publisher's legal identity on every page.
 *
 * That is a requirement, not a nicety: a directory collecting claims,
 * suggestions and email addresses processes personal data, and in the EU
 * whoever publishes it has to be identifiable without hunting for it.
 * Putting it in the footer means it cannot be missing from a page.
 */
export function SiteFooter() {
  const { company, legal } = directory;

  return (
    <footer className="mt-16 border-t border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-[var(--color-ink-muted)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {directory.siteName}
          </p>

          <nav aria-label="Voettekst" className="flex flex-wrap gap-x-5 gap-y-2">
            {directory.footerNav
              .filter(
                (item) =>
                  item.href !== "/suggest" || directory.features.suggestions,
              )
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="hover:text-[var(--color-ink)]"
                >
                  {item.label}
                </Link>
              ))}
            <Link href="/terms" className="hover:text-[var(--color-ink)]">
              Voorwaarden
            </Link>
            <Link href="/privacy" className="hover:text-[var(--color-ink)]">
              Privacy
            </Link>
            <a
              href={`mailto:${directory.contactEmail}`}
              className="hover:text-[var(--color-ink)]"
            >
              Contact
            </a>
          </nav>
        </div>

        <address className="mt-6 border-t border-[var(--color-line)] pt-4 text-xs not-italic">
          {company.name} · {company.registeredOffice} · BTW {company.vat}
          {legal.terms === null || legal.privacy === null ? (
            // Visible only to whoever is building the directory, and only
            // until the texts exist. A legal page that is a stub should say
            // so on the site rather than only in a config comment.
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-900">
              Juridische teksten nog niet gepubliceerd
            </span>
          ) : null}
        </address>
      </div>
    </footer>
  );
}
