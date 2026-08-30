import { directory } from "@/config/directory";
import { Breadcrumbs } from "@/components/breadcrumbs";

/**
 * Both legal pages, which differ only in title and which config field they
 * read.
 *
 * When the text is `null` the page still renders something true and useful
 * — who publishes the site, where they are registered, and how to reach
 * them — plus a plain statement that the document itself is not published
 * yet. That is better than a 404 (the footer links here) and much better
 * than boilerplate that looks binding and is not.
 */
export function LegalPage({
  title,
  path,
  body,
  intro,
}: {
  title: string;
  path: string;
  body: string | null;
  intro: string;
}) {
  const { company } = directory;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: title, path },
        ]}
      />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{title}</h1>

      {body ? (
        <div className="mt-6">
          {body.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index} className="mt-4 text-[var(--color-ink-muted)]">
              {paragraph.trim()}
            </p>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">
            This document has not been published yet.
          </p>
          <p className="mt-2 text-sm text-amber-900">
            {intro} Until it is written, this page is not indexed by search
            engines and is not listed in the sitemap. Add the text to{" "}
            <code className="rounded bg-amber-100 px-1">
              legal.{title.toLowerCase().includes("privacy") ? "privacy" : "terms"}
            </code>{" "}
            in <code className="rounded bg-amber-100 px-1">src/config/directory.ts</code>.
          </p>
        </div>
      )}

      <section className="mt-10 border-t border-[var(--color-line)] pt-6">
        <h2 className="text-lg font-semibold">Publisher</h2>
        <address className="mt-3 space-y-1 text-[var(--color-ink-muted)] not-italic">
          <div>{company.name}</div>
          <div>{company.registeredOffice}</div>
          <div>VAT {company.vat}</div>
          <div>
            <a
              href={`mailto:${directory.contactEmail}`}
              className="text-[var(--color-accent)] hover:underline"
            >
              {directory.contactEmail}
            </a>
          </div>
        </address>
      </section>
    </div>
  );
}
