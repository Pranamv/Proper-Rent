import {
  Briefcase,
  Buildings,
  GraduationCap,
  Globe,
  PiggyBank,
  ShieldCheck,
  Sparkle,
  Wallet,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { FaqSection } from "@/components/marketing/faq-section";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { StatList } from "@/components/marketing/stat-list";
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
  Sparkle,
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
    "Learn how Proper Rent helps renters ask general letting questions, understand fintech options, and register for human agent follow-up.",
  path: site.routes.renters,
});

export default function RentersPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="For renters"
          title="Ask the right questions before you register."
          body="Proper Rent gives renters a simple path: get general guidance, understand Deposit Share and guarantor options, then submit requirements for a human agent to follow up."
          actions={[
            { href: site.routes.renterRegister, label: "Register as renter" },
            {
              href: site.routes.howItWorks,
              label: "How it works",
              variant: "secondary",
            },
          ]}
          aside={
            <StatList
              items={[
                { value: "100%", label: "Website registrations reach the agent pipeline." },
                { value: "0", label: "Live listings shown in Phase 1." },
                { value: "24h", label: "Target follow-up for warm renter leads." },
              ]}
            />
          }
        />

        <Section
          eyebrow="How we help"
          title="A useful first step before agent follow-up."
          body="The chatbot and public pages answer generic questions. Structured personal details belong in the intake form, not chat."
        >
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Letting-process guidance",
                body: "Ask about renting steps, common documents, deposits, guarantors, and what happens after registering.",
              },
              {
                title: "Agent-ready requirements",
                body: "The form captures bedrooms, areas, budget, move-in timing, employment, deposit, guarantor, and consent.",
              },
              {
                title: "No listing claims",
                body: "Specific availability is confirmed by a human agent because Phase 1 has no public listing data.",
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
          title="Built to make renting affordable."
          body="These are general product options. An agent confirms the figures that apply to your specific situation and property before anything is finalised."
        >
          <Stagger className="grid gap-4 md:grid-cols-3">
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
            body="Whatever's making other landlords hesitate, our fintech options are designed to open doors instead of closing them."
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
          body="Submit the renter form when you are ready to share contact details and move requirements under consent."
          primaryHref={site.routes.renterRegister}
          primaryLabel="Start renter registration"
          secondaryHref={site.routes.privacy}
          secondaryLabel="Read privacy notes"
        />
      </Container>
    </SiteShell>
  );
}
