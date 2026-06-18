import {
  Bank,
  Buildings,
  CalendarCheck,
  ClipboardText,
  House,
  PiggyBank,
  ShieldCheck,
  UserCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { HeroSupportPanel } from "@/components/marketing/hero-support-panel";
import { JsonLd } from "@/components/marketing/json-ld";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Renting Support",
  description:
    "Proper Rent helps tenants and landlords move forward with clear registrations, agent follow-up, and fintech-backed support.",
  path: site.routes.home,
});

const renterSteps = [
  {
    icon: ClipboardText,
    title: "Register your requirements",
    body: "Share your budget, areas, move timing, and rental situation.",
  },
  {
    icon: UserCheck,
    title: "Agent reviews your options",
    body: "A Proper Rent agent checks your details and confirms suitable next steps.",
  },
  {
    icon: CalendarCheck,
    title: "Book viewings",
    body: "Move toward real, available rental options with human support.",
  },
  {
    icon: House,
    title: "Move forward",
    body: "If the right home is found, the agent guides the tenancy next steps.",
  },
] as const;

const landlordSteps = [
  {
    icon: Buildings,
    title: "Register your property",
    body: "Share the property details, rent guide, and what you want help with.",
  },
  {
    icon: UserCheck,
    title: "Agent reviews the route",
    body: "We check whether listing support, Advanced Rent, or both make sense.",
  },
  {
    icon: Bank,
    title: "List or discuss rent upfront",
    body: "Choose the right next step with a Proper Rent agent.",
  },
  {
    icon: House,
    title: "Move toward a let",
    body: "Work toward a tenant, listing outcome, or rent plan.",
  },
] as const;


export default function Home() {
  return (
    <SiteShell>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: site.name,
          url: absoluteUrl(site.routes.home),
          description: site.description,
        }}
      />
      <Container className="py-10 sm:py-14">
        <section
          className="grid items-start gap-10 lg:grid-cols-[1.04fr_0.96fr]"
          aria-labelledby="home-title"
        >
          <Reveal className="min-w-0 lg:pt-2">
            <h1
              id="home-title"
              className="max-w-3xl text-4xl font-bold leading-[1.04] text-foreground sm:text-6xl sm:leading-[1.02]"
            >
              Rent the home you love,{" "}
              <span className="text-sage">
                even if traditional renting says no
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Get help with deposits, guarantor options, and agent-led next
              steps. Register your details and a Proper Rent agent will follow up.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className={buttonClasses({ size: "lg" })} href={site.routes.renterRegister}>
                Register as tenant
              </a>
              <a
                className={buttonClasses({ variant: "secondary", size: "lg" })}
                href={site.routes.landlords}
              >
                I am a landlord
              </a>
            </div>
          </Reveal>

          <Reveal className="flex min-w-0 items-center justify-center">
            <HeroSupportPanel />
          </Reveal>
        </section>

        <Reveal as="section" className="py-10 sm:py-12" aria-labelledby="fintech-title">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Fintech for tenants
          </p>
          <h2
            id="fintech-title"
            className="text-2xl font-bold text-foreground sm:text-3xl"
          >
            Move in sooner, with less upfront.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Proper Rent helps reduce the two common blockers: upfront cash and
            guarantor requirements.
          </p>
          <Stagger className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <StaggerItem>
              <Card className="h-full shadow-none">
                <CardHeader>
                  <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                    <PiggyBank size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <CardTitle as="h3" className="text-lg">Deposit Share</CardTitle>
                  <div className="flex flex-wrap items-baseline gap-2 pt-1">
                    <span className="text-4xl font-bold text-primary">Up to 85%</span>
                    <span className="text-sm text-muted">
                      of your deposit covered on day one
                    </span>
                  </div>
                  <CardDescription>
                    We can help cover up to 85% of your deposit on day one,
                    while the landlord still receives the full protected amount.
                  </CardDescription>
                </CardHeader>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="h-full shadow-none">
                <CardHeader>
                  <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                    <ShieldCheck size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <CardTitle as="h3" className="text-lg">Guarantor Solutions</CardTitle>
                  <CardDescription>
                    Useful if you are a student, new to the UK, self-employed,
                    on Universal Credit, or without a traditional guarantor.
                  </CardDescription>
                </CardHeader>
              </Card>
            </StaggerItem>
          </Stagger>
          <Reveal className="mt-4 flex flex-col gap-4 rounded-md bg-surface-elevated p-6 sm:flex-row sm:items-center sm:gap-5 sm:p-8">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Bank size={22} weight="bold" aria-hidden="true" />
            </span>
            <p className="text-sm leading-6 text-muted">
              <span className="font-bold text-foreground">Advanced Rent for landlords. </span>
              Receive rent upfront while tenants keep paying monthly.{" "}
              <a className="font-semibold text-foreground underline" href={site.routes.landlords}>
                See how it works
              </a>
            </p>
          </Reveal>
        </Reveal>

        <Reveal
          as="section"
          className="rounded-lg bg-surface-subtle px-5 py-8 sm:px-8 sm:py-10"
          aria-labelledby="how-it-works-title"
        >
          <h2
            id="how-it-works-title"
            className="text-2xl font-bold text-foreground sm:text-3xl"
          >
            How it works from first enquiry to next step.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Two simple routes. Tenants move toward viewings. Landlords move
            toward listing support or Advanced Rent.
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            <ProcessFlow title="For tenants" steps={renterSteps} />
            <ProcessFlow title="For landlords" steps={landlordSteps} />
          </div>
        </Reveal>

        <Reveal>
          <CtaBand
            title="Ready to take the next step?"
            body="Register once. A Proper Rent agent will review the details and follow up with the right route."
            primaryHref={site.routes.renterRegister}
            primaryLabel="Register as tenant"
            secondaryHref={site.routes.landlordRegister}
            secondaryLabel="Register as landlord"
          />
        </Reveal>
      </Container>
    </SiteShell>
  );
}

type ProcessStep = {
  icon: typeof ClipboardText;
  title: string;
  body: string;
};

function ProcessFlow({
  steps,
  title,
}: {
  steps: readonly ProcessStep[];
  title: string;
}) {
  return (
    <div className="rounded-md border border-border bg-surface p-6 sm:p-8">
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <ol className="mt-6 space-y-6">
        {steps.map((step, index) => (
          <li className="flex gap-4" key={step.title}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {index + 1}
            </span>
            <div className="min-w-0 pt-1">
              <div className="flex items-center gap-2">
                <step.icon size={18} weight="bold" aria-hidden="true" />
                <h4 className="font-bold text-foreground">{step.title}</h4>
              </div>
              <p className="mt-1 text-sm leading-6 text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
