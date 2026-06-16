import {
  Bank,
  Buildings,
  CalendarCheck,
  ChatCircleText,
  ClipboardText,
  HouseLine,
  ListChecks,
  ShieldCheck,
  UserCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "How It Works",
  description:
    "See what happens after registering with Proper Rent, from renter requirements and landlord property details to human agent follow-up.",
  path: site.routes.howItWorks,
});

type IconComponent = typeof ClipboardText;

type RouteStep = {
  body: string;
  detail: string;
  icon: IconComponent;
  outcome: string;
  title: string;
};

const renterSteps = [
  {
    icon: ClipboardText,
    title: "Register requirements",
    body: "Share your budget, areas, bedrooms, move timing, and rental situation.",
    detail: "Useful details include deposit position, guarantor needs, and how soon you want to move.",
    outcome: "The agent receives a clear renter brief.",
  },
  {
    icon: UserCheck,
    title: "Agent review",
    body: "A Proper Rent agent checks your details and decides the most useful next step.",
    detail: "They look at your move timing, practical fit, and whether support options may help.",
    outcome: "You get a human follow-up, not a generic auto-reply.",
  },
  {
    icon: CalendarCheck,
    title: "Viewing route",
    body: "The agent discusses real options and helps move you toward suitable viewings.",
    detail: "Availability is confirmed by the agent before any viewing conversation becomes concrete.",
    outcome: "You move toward viewings with clearer expectations.",
  },
  {
    icon: HouseLine,
    title: "Move forward",
    body: "If the right home is found, the agent guides the tenancy next steps.",
    detail: "That can include introduction, paperwork direction, and support-product discussion where relevant.",
    outcome: "The closing stage stays human-led.",
  },
] as const satisfies readonly RouteStep[];

const landlordSteps = [
  {
    icon: Buildings,
    title: "Register property",
    body: "Share the property details, rent guide, availability, and what you want help with.",
    detail: "You can register for listing support, Advanced Rent discussion, or both.",
    outcome: "The agent receives the property context.",
  },
  {
    icon: UserCheck,
    title: "Agent review",
    body: "A Proper Rent agent reviews whether your route looks practical.",
    detail: "They check the property context, rent plan, timing, and service fit before recommending a next step.",
    outcome: "You get a route recommendation.",
  },
  {
    icon: Bank,
    title: "Choose route",
    body: "Decide whether to move toward listing support, Advanced Rent, or both.",
    detail: "Advanced Rent is discussed at a general level first, then confirmed by the right process.",
    outcome: "The next action is clear before you commit.",
  },
  {
    icon: HouseLine,
    title: "Move toward a let",
    body: "Work toward a tenant, listing outcome, or rent plan with human follow-up.",
    detail: "The agent keeps the live letting and completion steps outside the public website.",
    outcome: "Progress continues through the agent.",
  },
] as const satisfies readonly RouteStep[];

const agentWorkflow = [
  {
    icon: ListChecks,
    title: "Structured brief",
    body: "The form turns scattered questions into a usable brief, so the first follow-up can be specific.",
  },
  {
    icon: ShieldCheck,
    title: "Consent-led details",
    body: "Contact details belong in the registration form, where consent and privacy wording are clear.",
  },
  {
    icon: UserCheck,
    title: "Priority, not rejection",
    body: "Lead priority helps the agent decide who to contact first. Website registrations are not filtered out.",
  },
  {
    icon: ChatCircleText,
    title: "Chat stays general",
    body: "The assistant can explain the process, but the agent confirms live options and next steps.",
  },
] as const;

const boundaries = [
  {
    title: "What the website helps with",
    items: [
      "Explain the Proper Rent process before you register.",
      "Collect renter or landlord details through focused forms.",
      "Send each registration into the agent review workflow.",
    ],
  },
  {
    title: "What the agent confirms",
    items: [
      "Current rental options, viewing routes, and practical fit.",
      "Whether deposit, guarantor, or Advanced Rent support is relevant.",
      "The right next step before any tenancy or listing decision.",
    ],
  },
  {
    title: "What is not shown on the site",
    items: [
      "Live Scraye listings or a public property search feed.",
      "Property-specific fintech quotes before agent review.",
      "Final tenancy, listing, or affordability decisions made by AI.",
    ],
  },
] as const;

export default function HowItWorksPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="How it works"
          title="See what happens after you register."
          body="Proper Rent gives renters and landlords a clear starting point: submit the right details once, get human review, then move toward a practical next step."
          actions={[
            { href: site.routes.renterRegister, label: "Register as renter" },
            {
              href: site.routes.landlordRegister,
              label: "Register as landlord",
              variant: "secondary",
            },
          ]}
          aside={<ProcessConfidencePanel />}
        />

        <Section
          eyebrow="Process detail"
          title="Two routes. Same principle: human review before the next move."
          body="Renters and landlords need different information, but the process is designed to feel the same: register, get reviewed, then move forward with an agent."
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <RouteProcess
              accentClass="bg-primary text-primary-foreground"
              eyebrow="For renters"
              steps={renterSteps}
              title="From requirements to viewings."
            />
            <RouteProcess
              accentClass="bg-[#7B5C3A] text-[#FBF7EF]"
              eyebrow="For landlords"
              steps={landlordSteps}
              title="From property details to the right route."
            />
          </div>
        </Section>

        <Reveal as="section">
          <Section
            eyebrow="Behind the scenes"
            title="The form exists so the agent call is useful."
            body="The website is not trying to replace the agent. It collects enough context so the first human follow-up can focus on the decision that matters."
          >
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {agentWorkflow.map((item) => (
                <StaggerItem key={item.title}>
                  <Card className="h-full shadow-none">
                    <CardHeader>
                      <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                        <item.icon size={22} weight="bold" aria-hidden="true" />
                      </span>
                      <CardTitle as="h3">{item.title}</CardTitle>
                      <CardDescription>{item.body}</CardDescription>
                    </CardHeader>
                  </Card>
                </StaggerItem>
              ))}
            </Stagger>
          </Section>
        </Reveal>

        <Reveal
          as="section"
          className="rounded-md bg-surface-subtle px-5 py-8 sm:px-8 sm:py-10"
          aria-labelledby="boundaries-title"
        >
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Clear boundaries
          </p>
          <h2
            id="boundaries-title"
            className="max-w-3xl text-2xl font-bold text-foreground sm:text-3xl"
          >
            Useful guidance without pretending everything is automated.
          </h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {boundaries.map((group) => (
              <Card className="h-full shadow-none" key={group.title}>
                <CardHeader>
                  <CardTitle as="h3">{group.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm leading-6 text-muted">
                    {group.items.map((item) => (
                      <li className="flex gap-2" key={item}>
                        <span
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                          aria-hidden="true"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </Reveal>

        <CtaBand
          title="Start with the form that matches you."
          body="Renters share requirements. Landlords share property details. A Proper Rent agent reviews the registration and follows up with the right next step."
          primaryHref={site.routes.renterRegister}
          primaryLabel="Register as renter"
          secondaryHref={site.routes.landlordRegister}
          secondaryLabel="Register as landlord"
        />
      </Container>
    </SiteShell>
  );
}

function ProcessConfidencePanel() {
  return (
    <aside className="rounded-md border border-border bg-surface p-6 shadow-soft sm:p-7">
      <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
        After you submit
      </p>
      <ol className="mt-5 space-y-5">
        {[
          "Your details become a structured agent brief.",
          "A Proper Rent agent reviews the practical route.",
          "You get a next step for viewing, listing, or rent support.",
        ].map((item, index) => (
          <li className="flex gap-3" key={item}>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
              {index + 1}
            </span>
            <p className="pt-1 text-sm leading-6 text-muted">{item}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-surface-subtle p-4">
          <p className="text-xl font-bold text-foreground">Every form</p>
          <p className="mt-1 text-sm leading-6 text-muted">Reviewed by a human agent.</p>
        </div>
        <div className="rounded-md bg-surface-subtle p-4">
          <p className="text-xl font-bold text-foreground">No guesswork</p>
          <p className="mt-1 text-sm leading-6 text-muted">Live options are confirmed later.</p>
        </div>
      </div>
    </aside>
  );
}

function RouteProcess({
  accentClass,
  eyebrow,
  steps,
  title,
}: {
  accentClass: string;
  eyebrow: string;
  steps: readonly RouteStep[];
  title: string;
}) {
  return (
    <article className="h-full rounded-md border border-border bg-surface p-5 shadow-none sm:p-6">
      <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-2xl font-bold leading-tight text-foreground">{title}</h3>
      <ol className="mt-6 space-y-5">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <li className="grid grid-cols-[auto_1fr] gap-4" key={step.title}>
              <span
                className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${accentClass}`}
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Icon size={19} weight="bold" aria-hidden="true" />
                  <h4 className="font-bold text-foreground">{step.title}</h4>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted">{step.body}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{step.detail}</p>
                <p className="mt-3 rounded-md bg-surface-subtle px-3 py-2 text-xs font-bold leading-5 text-foreground">
                  Result: {step.outcome}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}
