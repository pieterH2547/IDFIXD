import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import { SubmissionForm } from "@/components/submission-form";
import { submitSuggestion } from "@/app/actions";
import { Breadcrumbs } from "@/components/breadcrumbs";

/**
 * Someone tells us about a {listing} we missed. Stored, then read by hand.
 *
 * Indexable, unlike /claim: "suggest a supplier" is a thing people search
 * for, and the page is a real destination rather than a step in a flow.
 */

export const metadata: Metadata = pageMetadata({
  title: "Bedrijf aanmelden",
  description: `Ontbreekt er een ${directory.listing.singularLower} in ${directory.siteName}? Meld het bedrijf hier aan.`,
  path: "/suggest",
  decision: { index: true, reason: "public submission page" },
});

export default function SuggestPage() {
  if (!directory.features.suggestions) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: "Bedrijf aanmelden", path: "/suggest" },
        ]}
      />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Bedrijf aanmelden
      </h1>
      <p className="mt-2 max-w-xl text-[var(--color-ink-muted)]">
        Ontbreekt er een boomverzorger, of klopt er iets niet? Stuur het door.
        Elke aanmelding wordt tegen openbare bronnen gecontroleerd voordat ze
        verschijnt.
      </p>

      <div className="mt-8">
        <SubmissionForm
          action={submitSuggestion}
          submitLabel="Aanmelding versturen"
          fields={[
            {
              name: "organisation",
              label: "Naam van het bedrijf",
              required: true,
            },
            { name: "websiteUrl", label: "Website", type: "url" },
            { name: "name", label: "Uw naam", required: true },
            { name: "email", label: "E-mailadres", type: "email", required: true },
            {
              name: "message",
              label: "Iets dat we moeten weten?",
              type: "textarea",
            },
          ]}
        />
      </div>
    </div>
  );
}
