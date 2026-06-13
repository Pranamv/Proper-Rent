import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CONSENT_VERSION, privacyContactEmail } from "@/lib/consent";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Proper Rent handles renter, landlord, and chat data during the Phase 1 website MVP.",
  path: site.routes.privacy,
});

const privacySections = [
  {
    title: "What we collect",
    body: "Renter forms collect contact details, rental requirements, readiness answers, notes, consent status, consent timestamp, and consent version. Landlord forms collect contact details, property details, product interest, notes, consent status, consent timestamp, and consent version.",
  },
  {
    title: "Chat transcripts",
    body: "The chatbot is for general questions. Visitors should not share full contact details in chat. Email and UK phone patterns are scrubbed from stored transcripts before persistence, and contact details should be submitted through the relevant form.",
  },
  {
    title: "Lawful basis and purposes",
    body: "Phase 1 form submissions are processed on the opt-in consent recorded on the form. We use submitted details to route enquiries to a human agent, send confirmation and follow-up messages, prioritise renter follow-up, and operate the admin workflow.",
  },
  {
    title: "Processors",
    body: "The Phase 1 architecture uses Supabase for database and admin authentication infrastructure, OpenRouter for chatbot model access, and Resend for email delivery. These providers process data only for the website, chatbot, and enquiry workflow.",
  },
  {
    title: "Retention and erasure",
    body: "Non-converting lead PII is retained for up to 12 months from last activity, then personal fields are nulled unless a longer period is needed for legal, dispute, or commission reconciliation records. Deletion requests null personal fields while retaining non-PII IDs and operational history.",
  },
  {
    title: "Your rights",
    body: `You can request access, correction, deletion, withdrawal of consent, or objection to processing by contacting ${privacyContactEmail}. Some records may be retained in non-identifying form for audit and commission reconciliation.`,
  },
  {
    title: "Analytics and cookies",
    body: "The public site uses cookieless aggregate analytics only when enabled in production. It must not set identifying analytics cookies, fingerprint visitors, or introduce a cookie banner without revisiting this policy.",
  },
  {
    title: "Service boundary",
    body: "Phase 1 does not publish Scraye listing data or per-listing fintech figures. The chatbot gives general information only, and a human agent confirms live availability, viewing options, listing steps, and product next steps manually.",
  },
];

export default function PrivacyPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="Legal"
          title="Privacy Policy"
          body={`This page explains how Proper Rent handles form submissions, chatbot data, consent, analytics, and human agent follow-up. Consent version: ${CONSENT_VERSION}.`}
          actions={[
            {
              href: site.routes.renterRegister,
              label: "Renter registration",
              variant: "secondary",
            },
          ]}
        />

        <Section
          title="How Proper Rent handles Phase 1 data."
          body="Privacy information is provided before form submission, and the same consent version is stored with each successful renter or landlord enquiry."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {privacySections.map((item) => (
              <Card className="shadow-none" key={item.title}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>
      </Container>
    </SiteShell>
  );
}
