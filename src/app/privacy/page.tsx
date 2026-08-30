import type { Metadata } from "next";
import { directory } from "@/config/directory";
import { pageMetadata } from "@/lib/seo/metadata";
import { legalIndexDecision } from "@/lib/seo/indexability";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description: `How ${directory.company.name} handles personal data on ${directory.siteName}.`,
  path: "/privacy",
  decision: legalIndexDecision(directory.legal.privacy),
});

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      path="/privacy"
      body={directory.legal.privacy}
      intro="A privacy statement has to say what personal data the site collects, why, how long it is kept and who to contact about it. The claim and suggestion forms collect names and email addresses, so this directory needs one."
    />
  );
}
