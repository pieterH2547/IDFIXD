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
  title: `Suggest a ${directory.listing.singularLower}`,
  description: `Tell us about a ${directory.listing.singularLower} missing from ${directory.siteName}.`,
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
          { name: "Suggest", path: "/suggest" },
        ]}
      />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Suggest a {directory.listing.singularLower}
      </h1>
      <p className="mt-2 max-w-xl text-[var(--color-ink-muted)]">
        Missing something? Send it over. We check every suggestion against
        public sources before it appears.
      </p>

      <div className="mt-8">
        <SubmissionForm
          action={submitSuggestion}
          submitLabel="Send suggestion"
          fields={[
            {
              name: "organisation",
              label: `${directory.listing.singular} name`,
              required: true,
            },
            { name: "websiteUrl", label: "Website", type: "url" },
            { name: "name", label: "Your name", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            {
              name: "message",
              label: "Anything we should know?",
              type: "textarea",
            },
          ]}
        />
      </div>
    </div>
  );
}
