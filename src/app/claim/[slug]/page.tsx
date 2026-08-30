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
    title: listing ? `Claim ${listing.name}` : "Claim a listing",
    description: `Request an update to a ${directory.listing.singularLower} in ${directory.siteName}.`,
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
          { name: "Claim", path: `/claim/${slug}` },
        ]}
      />

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">
        Claim {listing?.name ?? `this ${directory.listing.singularLower}`}
      </h1>
      <p className="mt-2 max-w-xl text-[var(--color-ink-muted)]">
        Tell us who you are and what needs changing. We read every message
        and update the page by hand — there is no account to create.
      </p>

      <div className="mt-8">
        <SubmissionForm
          action={submitClaim}
          listingSlug={slug}
          submitLabel="Send request"
          fields={[
            { name: "name", label: "Your name", required: true },
            {
              name: "email",
              label: "Email",
              type: "email",
              required: true,
              hint: "We reply to this address and nowhere else.",
            },
            {
              name: "organisation",
              label: "Your role or relationship",
              hint: `For example: founder, marketing lead, agency working with this ${directory.listing.singularLower}.`,
            },
            {
              name: "message",
              label: "What should change?",
              type: "textarea",
            },
          ]}
        />
      </div>

      <p className="mt-8 text-sm text-[var(--color-ink-muted)]">
        <Link href="/directory" className="text-[var(--color-accent)] hover:underline">
          ← Back to the {directory.listing.pluralLower}
        </Link>
      </p>
    </div>
  );
}
