import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import { listingExists } from "@/lib/listings";
import { prisma } from "@/lib/db";
import { SubmissionForm } from "@/components/submission-form";
import { submitClaim } from "@/app/actions";
import { Breadcrumbs } from "@/components/breadcrumbs";

/**
 * A lead form, and nothing more.
 *
 * No account, no dashboard, no verification, no billing. Someone tells us
 * they are connected to a listing and what needs correcting; we read it and
 * act on it by hand. That covers what a directory of 30–300 rows actually
 * needs, and it stays out of the way until traffic proves otherwise.
 *
 * Never indexed: it is a form, and a form in search results is a bad
 * result for whoever clicks it.
 */

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await prisma.listing.findUnique({
    where: { slug },
    select: { name: true },
  });

  return pageMetadata({
    title: listing ? `${listing.name} claimen` : "Pagina claimen",
    description: `Vraag een correctie aan van een ${directory.listing.singularLower} in ${directory.siteName}.`,
    path: `/claim/${slug}`,
    decision: { index: false, reason: "contact form" },
  });
}

export default async function ClaimPage({ params }: { params: Params }) {
  if (!directory.features.claims) notFound();

  const { slug } = await params;

  // Deliberately checks every listing, not just published ones: someone
  // whose page is still a draft has as much reason to write in.
  if (!(await listingExists(slug))) notFound();

  const listing = await prisma.listing.findUnique({
    where: { slug },
    select: { name: true, status: true },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs
        crumbs={[
          { name: "Home", path: "/" },
          { name: directory.listing.plural, path: "/directory" },
          ...(listing && listing.status === "PUBLISHED"
            ? [{ name: listing.name, path: `/directory/${slug}` }]
            : []),
          { name: "Claimen", path: `/claim/${slug}` },
        ]}
      />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        {listing?.name ?? "Deze pagina"} claimen
      </h1>
      <p className="mt-2 max-w-xl text-[var(--color-ink-muted)]">
        Vertel wie u bent en wat er moet veranderen. Elk bericht wordt gelezen
        en de pagina wordt met de hand bijgewerkt — u hoeft geen account te
        maken.
      </p>

      <div className="mt-8">
        <SubmissionForm
          action={submitClaim}
          listingSlug={slug}
          submitLabel="Verzoek versturen"
          fields={[
            { name: "name", label: "Uw naam", required: true },
            {
              name: "email",
              label: "E-mailadres",
              type: "email",
              required: true,
              hint: "We antwoorden op dit adres en nergens anders.",
            },
            {
              name: "organisation",
              label: "Uw rol of band met het bedrijf",
              hint: "Bijvoorbeeld: zaakvoerder, medewerker, of het bureau dat de site beheert.",
            },
            {
              name: "message",
              label: "Wat moet er veranderen?",
              type: "textarea",
            },
          ]}
        />
      </div>

      <p className="mt-8 text-sm text-[var(--color-ink-muted)]">
        <Link href="/directory" className="text-[var(--color-accent)] hover:underline">
          ← Terug naar alle {directory.listing.pluralLower}
        </Link>
      </p>
    </div>
  );
}
