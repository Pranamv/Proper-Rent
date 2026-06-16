import {
  Briefcase,
  Buildings,
  GraduationCap,
  Globe,
  PiggyBank,
  ShieldCheck,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq-section";
import { PageHero } from "@/components/marketing/page-hero";
import { RenterJourneyPath } from "@/components/marketing/renter-journey-path";
import { Section } from "@/components/marketing/section";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";
import {
  renterAudienceSegments,
  renterFaqs,
  renterFintechItems,
} from "@/lib/public-content";
import { site } from "@/lib/site";

const fintechIcons = {
  PiggyBank,
  ShieldCheck,
} as const;

const segmentIcons = {
  GraduationCap,
  Briefcase,
  Wallet,
  ShieldCheck,
  Globe,
  Buildings,
} as const;

export const metadata: Metadata = pageMetadata({
  title: "For Renters",
  description:
    "Register your rental requirements with Proper Rent, understand deposit and guarantor support, and move toward agent-led viewings.",
  path: site.routes.renters,
});

export default function RentersPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="For renters"
          title="Register your requirements. Move toward real viewings."
          body="Share what you need once. A Proper Rent agent reviews your details, checks suitable next steps, and helps you move forward."
          actions={[
            { href: site.routes.renterRegister, label: "Register as renter" },
            {
              href: site.routes.howItWorks,
              label: "How it works",
              variant: "secondary",
            },
          ]}
          aside={<RenterJourneyPath />}
          className="lg:grid-cols-[0.98fr_1.02fr] lg:gap-12"
        />

        <Section
          eyebrow="How we help"
          title="A clearer route from interest to viewing."
          body="The renter form gives the agent the details they need to understand your move, your budget, and where extra support may help."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Share your situation",
                body: "Tell us your budget, areas, move timing, bedrooms, and current rental position.",
              },
              {
                title: "Check support options",
                body: "Deposit Share and guarantor options can be discussed where they fit your circumstances.",
              },
              {
                title: "Move to viewings",
                body: "A Proper Rent agent confirms current options and helps you move toward suitable viewings.",
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

        <Section
          eyebrow="Fintech for renters"
          title="Reduce the blockers that slow renters down."
          body="These are general support options. A Proper Rent agent confirms what applies to your situation before anything is finalised."
        >
          <Stagger className="grid gap-4 md:grid-cols-2">
            {renterFintechItems.map((item) => {
              const Icon = fintechIcons[item.icon as keyof typeof fintechIcons];
              return (
                <StaggerItem key={item.title}>
                  <Card className="h-full">
                    <CardHeader>
                      <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                        <Icon size={22} weight="bold" aria-hidden="true" />
                      </span>
                      <CardTitle>{item.title}</CardTitle>
                      <CardDescription>{item.body}</CardDescription>
                    </CardHeader>
                  </Card>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Section>

        <Reveal as="section">
          <Section
            eyebrow="Who it's for"
            title="Built for renters who get overlooked elsewhere."
            body="If deposits, guarantors, payslip rules, or referencing have slowed you down, Proper Rent helps you find a clearer next step."
          >
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {renterAudienceSegments.map((segment) => {
                const Icon = segmentIcons[segment.icon as keyof typeof segmentIcons];
                return (
                  <StaggerItem key={segment.title}>
                    <Card className="h-full shadow-none">
                      <CardHeader>
                        <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                          <Icon size={22} weight="bold" aria-hidden="true" />
                        </span>
                        <CardTitle>{segment.title}</CardTitle>
                        <CardDescription>{segment.body}</CardDescription>
                      </CardHeader>
                    </Card>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </Section>
        </Reveal>

        <FaqSection items={renterFaqs} pagePath={site.routes.renters} />

        <CtaBand
          title="Ready to register your requirements?"
          body="Submit your details once. A Proper Rent agent will review your requirements and follow up with the right next step."
          primaryHref={site.routes.renterRegister}
          primaryLabel="Start renter registration"
          secondaryHref={site.routes.privacy}
          secondaryLabel="Read privacy notes"
        />
      </Container>
    </SiteShell>
  );
}
