import {
  Bank,
  Buildings,
  CalendarCheck,
  HouseLine,
  UserCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq-section";
import { LandlordJourneyPath } from "@/components/marketing/landlord-journey-path";
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

const infoCardClass = "h-full shadow-none";
const clickableCardClass =
  "group block h-full rounded-md border border-border bg-surface p-5 text-foreground shadow-none transition duration-200 hover:-translate-y-1 hover:border-[#7B5C3A]/55 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7B5C3A] motion-reduce:transition-none motion-reduce:hover:translate-y-0";
const landlordPrimaryButtonClass =
  "bg-[#7B5C3A] text-[#FBF7EF] hover:bg-[#6B4F32] active:bg-[#6B4F32] focus-visible:ring-[#7B5C3A]";
const landlordSecondaryButtonClass =
  "border-[#7B5C3A]/35 bg-[#F3E6D8]/60 text-foreground hover:border-[#7B5C3A]/60 hover:bg-[#F3E6D8] focus-visible:ring-[#7B5C3A]";
const landlordIconClass =
  "grid size-11 place-items-center rounded-full bg-accent-linen text-[#7B5C3A]";
const landlordRouteIconClass =
  "grid size-11 place-items-center rounded-full bg-accent-linen text-[#7B5C3A] transition-colors group-hover:bg-[#7B5C3A] group-hover:text-[#FBF7EF]";
const landlordEyebrowClass = "text-[#7B5C3A]";

export default function LandlordsPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="For landlords"
          eyebrowClassName={landlordEyebrowClass}
          title="Register your property. Choose the right landlord route."
          body="Share the basics once. A Proper Rent agent reviews whether listing support, Advanced Rent, or both make sense."
          actions={[
            {
              className: landlordPrimaryButtonClass,
              href: site.routes.landlordRegister,
              label: "Register property",
            },
            {
              className: landlordSecondaryButtonClass,
              href: site.routes.landlordRegister,
              label: "Advanced Rent",
              variant: "secondary",
            },
          ]}
          aside={<LandlordJourneyPath />}
          className="lg:grid-cols-[0.98fr_1.02fr] lg:gap-12"
        />

        <Section
          eyebrow="Advanced Rent"
          eyebrowClassName={landlordEyebrowClass}
          title="Cash flow now. Tenant payments stay familiar."
          body="Advanced Rent is designed for landlords who want earlier access to rent without changing the tenant's monthly payment routine."
        >
          <Stagger className="grid gap-4 md:grid-cols-3">
            {advancedRentHighlights.map((item) => {
              const Icon = advancedRentIcons[item.icon as keyof typeof advancedRentIcons];
              return (
                <StaggerItem key={item.title}>
                  <Card className={infoCardClass}>
                    <CardHeader>
                      <span className={landlordIconClass}>
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
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-[#7B5C3A]">
            Choose your route
          </p>
          <h2
            id="landlord-routes-title"
            className="max-w-3xl text-2xl font-bold text-foreground sm:text-3xl"
          >
            Two distinct services. Choose one or both.
          </h2>
          <Stagger className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              {
                icon: Bank,
                title: "Advanced Rent",
                body: "A financial service: receive future rent payments as an upfront lump sum. Your tenant continues paying monthly as normal. These two routes are independent — you can use one without the other.",
                href: site.routes.landlordRegister,
              },
              {
                icon: Buildings,
                title: "Listing Support",
                body: "Agent-led help finding and securing the right tenant for your property. Separate from Advanced Rent — you can use listing support alone, Advanced Rent alone, or combine both.",
                href: site.routes.landlordRegister,
              },
            ].map((route) => (
              <StaggerItem key={route.title}>
                <a
                  className={clickableCardClass}
                  href={route.href}
                >
                  <span className={landlordRouteIconClass}>
                    <route.icon size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-bold text-foreground">{route.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{route.body}</p>
                  <span className="mt-4 inline-flex text-sm font-bold text-[#7B5C3A]">
                    Start here
                  </span>
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>

        <Section
          eyebrow="How it works"
          eyebrowClassName={landlordEyebrowClass}
          title="From property details to the next move."
          body="Register once, then a Proper Rent agent reviews the right route for listing support, Advanced Rent, or both."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Buildings,
                title: "Register property",
                body: "Share the property details, rent guide, availability, and what you want help with.",
              },
              {
                icon: UserCheck,
                title: "Agent review",
                body: "A Proper Rent agent checks whether listing support, Advanced Rent, or both make sense.",
              },
              {
                icon: Bank,
                title: "List or rent upfront",
                body: "Choose the next step with an agent: list the property, discuss upfront rent, or both.",
              },
              {
                icon: HouseLine,
                title: "Move toward a let",
                body: "Work toward a tenant, listing outcome, or rent plan with human follow-up.",
              },
            ].map((item) => (
              <Card className={infoCardClass} key={item.title}>
                <CardHeader>
                  <span className={landlordIconClass}>
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
