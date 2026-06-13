import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    body: "Renter and landlord forms collect the details needed for agent follow-up, including contact details, requirements, property details, consent status, and consent version.",
  },
  {
    title: "Chat transcripts",
    body: "The chatbot is for general questions. Visitors should not share full contact details in chat. Email and UK phone patterns are scrubbed from stored transcripts before persistence.",
  },
  {
    title: "How we use data",
    body: "We use submitted details to route enquiries to a human agent, send confirmation messages, prioritise renter follow-up, and operate the Phase 1 admin workflow.",
  },
  {
    title: "Processors",
    body: "The Phase 1 architecture uses Supabase for database/auth infrastructure, OpenRouter for chatbot model access, and Resend for email delivery.",
  },
  {
    title: "Your rights",
    body: "Visitors can request access, correction, or deletion of personal data. Non-converting lead retention and erasure handling are part of launch hardening.",
  },
  {
    title: "Listing boundary",
    body: "Phase 1 does not publish Scraye listing data or per-listing fintech figures. A human agent confirms live availability manually.",
  },
];

export default function PrivacyPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="Legal"
          title="Privacy Policy"
          body="This page explains how the Phase 1 Proper Rent website handles form submissions, chatbot data, consent, and agent follow-up."
          actions={[
            {
              href: site.routes.renterRegister,
              label: "Renter registration",
              variant: "secondary",
            },
          ]}
        />

        <Section
          title="Privacy notes for the website MVP."
          body="Final legal wording should be reviewed before launch. The implementation stores consent version and consent timestamp on successful renter and landlord submissions."
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
