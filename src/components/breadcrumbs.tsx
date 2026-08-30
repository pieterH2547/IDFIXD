import Link from "next/link";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, type Breadcrumb } from "@/lib/seo/json-ld";

/**
 * Breadcrumbs plus their structured data, emitted together.
 *
 * Together on purpose: `BreadcrumbList` markup is only valid when the
 * breadcrumbs are actually on the page. Splitting the two lets one drift
 * out of sync with the other, which is markup that describes a page that
 * does not exist.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Breadcrumb[] }) {
  if (crumbs.length === 0) return null;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <nav aria-label="Kruimelpad" className="text-sm">
        <ol className="flex flex-wrap items-center gap-1.5 text-[var(--color-ink-muted)]">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={crumb.path} className="flex items-center gap-1.5">
                {isLast ? (
                  <span aria-current="page">{crumb.name}</span>
                ) : (
                  <>
                    <Link
                      href={crumb.path}
                      className="hover:text-[var(--color-ink)] hover:underline"
                    >
                      {crumb.name}
                    </Link>
                    <span aria-hidden="true">/</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
