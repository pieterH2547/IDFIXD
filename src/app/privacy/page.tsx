import type { Metadata } from "next";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import { legalIndexDecision } from "@/lib/seo/indexability";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description: `Hoe ${directory.company.name} omgaat met persoonsgegevens op ${directory.siteName}.`,
  path: "/privacy",
  decision: legalIndexDecision(directory.legal.privacy),
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      path="/privacy"
      body={directory.legal.privacy}
      intro="Een privacyverklaring moet zeggen welke persoonsgegevens de site verzamelt, waarom, hoe lang ze bewaard blijven en bij wie u terechtkunt. De claim- en aanmeldformulieren verzamelen namen en e-mailadressen, dus deze gids heeft er een nodig."
    />
  );
}
