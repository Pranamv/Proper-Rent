import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq-section";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";
import { landlordFaqs } from "@/lib/public-content";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "For Landlords",
  description:
    "Share property details, listing interest, and Advanced Rent interest so a Proper Rent agent can follow up.",
  path: site.routes.landlords,
});

export default function LandlordsPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="For landlords"
          title="Register a property lead for agent follow-up."
          body="Proper Rent captures landlord enquiries for manual review. You can register listing interest, Advanced Rent interest, or both."
          actions={[
            { href: site.routes.landlordRegister, label: "Register landlord interest" },
            {
              href: site.routes.howItWorks,
              label: "See the process",
              variant: "secondary",
            },
          ]}
          aside={
            <Card>
              <CardHeader>
                <CardTitle>Advanced Rent</CardTitle>
                <CardDescription>
                  A landlord-side proposition for receiving rent upfront while tenants
                  continue paying monthly. An agent will discuss whether it fits your
                  property and situation.
                </CardDescription>
              </CardHeader>
            </Card>
          }
        />

        <Section
          eyebrow="What happens next"
          title="Every landlord submission reaches the agent."
          body="Landlord enquiries are not scored in Phase 1. The agent notification is unconditional because listing and Advanced Rent opportunities are commercially relevant."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Share basics",
                body: "Property address, bedroom count, rent guide, availability, listing interest, Advanced Rent interest, and consent.",
              },
              {
                title: "Agent reviews",
                body: "A human agent checks the details and decides the right follow-up route.",
              },
              {
                title: "Manual next steps",
                body: "Listing on Scraye and Advanced Rent discussion stay agent-led in Phase 1.",
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

        <FaqSection items={landlordFaqs} pagePath={site.routes.landlords} />

        <CtaBand
          title="Have a property to discuss?"
          body="Register landlord interest and an agent will review the details before follow-up."
          primaryHref={site.routes.landlordRegister}
          primaryLabel="Start landlord registration"
          secondaryHref={site.routes.terms}
          secondaryLabel="Read terms"
        />
      </Container>
    </SiteShell>
  );
}
