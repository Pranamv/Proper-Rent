import { Bank, CalendarCheck, UserCheck } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq-section";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";
import { advancedRentHighlights, landlordFaqs } from "@/lib/public-content";
import { site } from "@/lib/site";

const advancedRentIcons = {
  Bank,
  CalendarCheck,
  UserCheck,
} as const;

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

        <Reveal as="section">
          <Section
            eyebrow="Advanced Rent"
            title="Get paid rent upfront."
            body="Advanced Rent lets you receive a portion of future rent as a lump sum, while your tenants carry on paying as normal. An agent talks you through whether it fits your property."
          >
            <Stagger className="grid gap-6 sm:grid-cols-3">
              {advancedRentHighlights.map((item) => {
                const Icon = advancedRentIcons[item.icon as keyof typeof advancedRentIcons];
                return (
                  <StaggerItem className="flex gap-4 sm:flex-col sm:gap-3" key={item.title}>
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-linen text-foreground">
                      <Icon size={22} weight="bold" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-bold text-foreground">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">{item.body}</p>
                    </div>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </Section>
        </Reveal>

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
