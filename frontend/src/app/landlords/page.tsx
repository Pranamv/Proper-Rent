import {
  Bank,
  Buildings,
  CalendarCheck,
  Handshake,
  HouseLine,
  UserCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq-section";
import { LandlordHeroPanel } from "@/components/marketing/landlord-hero-panel";
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
    "Learn how Proper Rent helps landlords discuss Advanced Rent, listing interest, and agent-reviewed next steps.",
  path: site.routes.landlords,
});

const interactiveCardClass =
  "group h-full shadow-none transition duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-soft motion-reduce:transition-none motion-reduce:hover:translate-y-0";

export default function LandlordsPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="For landlords"
          title="Get rent upfront while tenants keep paying monthly."
          body="Advanced Rent helps landlords unlock future rent as a lump sum. Share your property details and a Proper Rent agent will confirm whether it fits."
          actions={[
            { href: site.routes.landlordRegister, label: "Advanced Rent" },
            {
              href: site.routes.landlordRegister,
              label: "List property",
              variant: "secondary",
            },
          ]}
          aside={<LandlordHeroPanel />}
        />

        <Section
          eyebrow="Advanced Rent"
          title="Cash flow now. Tenant payments stay familiar."
          body="Advanced Rent is designed for landlords who want earlier access to rent without changing the tenant's monthly payment routine."
        >
          <Stagger className="grid gap-4 md:grid-cols-3">
            {advancedRentHighlights.map((item) => {
              const Icon = advancedRentIcons[item.icon as keyof typeof advancedRentIcons];
              return (
                <StaggerItem key={item.title}>
                  <Card className={interactiveCardClass}>
                    <CardHeader>
                      <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <Icon size={22} weight="bold" aria-hidden="true" />
                      </span>
                      <CardTitle as="h3">{item.title}</CardTitle>
                      <CardDescription>{item.body}</CardDescription>
                    </CardHeader>
                  </Card>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Section>

        <Reveal as="section" className="py-10" aria-labelledby="landlord-routes-title">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Choose your route
          </p>
          <h2
            id="landlord-routes-title"
            className="max-w-3xl text-2xl font-bold text-foreground sm:text-3xl"
          >
            Start with the conversation that matches your property.
          </h2>
          <Stagger className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                icon: Bank,
                title: "Discuss Advanced Rent",
                body: "Explore whether upfront rent could work for your property and tenancy.",
                href: site.routes.landlordRegister,
              },
              {
                icon: Buildings,
                title: "List a property",
                body: "Share the basics so an agent can review the right next step with you.",
                href: site.routes.landlordRegister,
              },
            ].map((route) => (
              <StaggerItem key={route.title}>
                <a
                  className="group block h-full rounded-md border border-border bg-surface p-5 text-foreground shadow-none transition duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  href={route.href}
                >
                  <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <route.icon size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-bold text-foreground">{route.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{route.body}</p>
                  <span className="mt-4 inline-flex text-sm font-bold text-primary">
                    Start here
                  </span>
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>

        <Section
          eyebrow="How it works"
          title="A short review, then a human conversation."
          body="The form gives the agent enough context to discuss the right route without turning the website into a long qualification process."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: HouseLine,
                title: "Share the property",
                body: "Address, bedroom count, rent guide, availability, and what you want to discuss.",
              },
              {
                icon: UserCheck,
                title: "Agent reviews fit",
                body: "A Proper Rent agent checks the details before recommending next steps.",
              },
              {
                icon: Handshake,
                title: "Agree the next move",
                body: "Continue with Advanced Rent, listing support, or a direct follow-up conversation.",
              },
            ].map((item) => (
              <Card className={interactiveCardClass} key={item.title}>
                <CardHeader>
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-linen text-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <item.icon size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <CardTitle as="h3">{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>

        <FaqSection
          items={landlordFaqs}
          pagePath={site.routes.landlords}
          title="Landlord FAQ"
          body="Short answers before you decide whether to register your property details."
        />

        <CtaBand
          title="Have a property or rent plan to discuss?"
          body="Share the basics and a Proper Rent agent will review the right route with you."
          primaryHref={site.routes.landlordRegister}
          primaryLabel="Register landlord interest"
          secondaryHref={site.routes.terms}
          secondaryLabel="Read terms"
        />
      </Container>
    </SiteShell>
  );
}
