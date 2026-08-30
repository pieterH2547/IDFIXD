import type { Metadata } from "next";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import { legalIndexDecision } from "@/lib/seo/indexability";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Terms",
  description: `Terms of use for ${directory.siteName}, published by ${directory.company.name}.`,
  path: "/terms",
  decision: legalIndexDecision(directory.legal.terms),
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms"
      path="/terms"
      body={directory.legal.terms}
      intro="Terms of use set out what visitors may do with the directory and what the publisher does and does not warrant."
    />
  );
}
