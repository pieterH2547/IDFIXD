import type { Metadata } from "next";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import { legalIndexDecision } from "@/lib/seo/indexability";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Voorwaarden",
  description: `Gebruiksvoorwaarden van ${directory.siteName}, uitgegeven door ${directory.company.name}.`,
  path: "/terms",
  decision: legalIndexDecision(directory.legal.terms),
});

export default function TermsPage() {
  return (
    <LegalPage
      title="Voorwaarden"
      path="/terms"
      body={directory.legal.terms}
      intro="Gebruiksvoorwaarden leggen vast wat bezoekers met deze gids mogen doen en waarvoor de uitgever wel en niet instaat."
    />
  );
}
