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
          aria-label="Main"
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

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-[var(--color-ink-muted)] sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {directory.siteName}
        </p>

        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
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
          <a
            href={`mailto:${directory.contactEmail}`}
            className="hover:text-[var(--color-ink)]"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
