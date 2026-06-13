import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { StepList } from "@/components/marketing/step-list";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";
import { howItWorksSteps } from "@/lib/public-content";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "How It Works",
  description:
    "See how Proper Rent moves renters and landlords from public website questions to human agent follow-up.",
  path: site.routes.howItWorks,
});

export default function HowItWorksPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="About / How it works"
          title="AI helps. A human agent closes the loop."
          body="Phase 1 is intentionally simple: public pages, a general chatbot, structured intake forms, notifications, and an admin pipeline for the human agent."
          actions={[
            { href: site.routes.renterRegister, label: "Renter registration" },
            {
              href: site.routes.landlordRegister,
              label: "Landlord registration",
              variant: "secondary",
            },
          ]}
          aside={<StepList items={howItWorksSteps} />}
        />

        <Section
          eyebrow="Phase boundaries"
          title="What Proper Rent does in Phase 1."
          body="The website helps visitors understand the proposition and register interest. It does not display Scraye listings or quote listing-specific fintech figures."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Renter path",
                body: "The visitor can ask general questions, submit structured requirements, and receive confirmation while the agent sees the lead briefing.",
              },
              {
                title: "Landlord path",
                body: "The landlord can share property details and Advanced Rent interest. Every successful submission notifies the agent.",
              },
              {
                title: "Chatbot path",
                body: "The assistant answers from default process and fintech guidance, avoids contact-detail collection, and suggests the intake form when useful.",
              },
              {
                title: "Agent path",
                body: "The agent owns live availability, Scraye shortlisting, viewing coordination, and completion.",
              },
            ].map((item) => (
              <Card className="shadow-none" key={item.title}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>

        <CtaBand
          title="Choose the right starting point."
          body="Renters and landlords use separate forms so the agent gets the right details from the start."
          primaryHref={site.routes.renterRegister}
          primaryLabel="I am a renter"
          secondaryHref={site.routes.landlordRegister}
          secondaryLabel="I am a landlord"
        />
      </Container>
    </SiteShell>
  );
}
