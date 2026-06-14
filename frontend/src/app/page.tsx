import {
  Bank,
  Buildings,
  ChatCircleDots,
  ClipboardText,
  Handshake,
  House,
  PiggyBank,
  ShieldCheck,
  UserCheck,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { JourneyPath } from "@/components/marketing/journey-path";
import { JsonLd } from "@/components/marketing/json-ld";
import { Testimonials } from "@/components/marketing/testimonials";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Home",
  description:
    "Proper Rent helps renters and landlords understand the letting process, register interest, and reach a human agent.",
  path: site.routes.home,
});


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
          className="grid items-center gap-9 lg:grid-cols-[1.08fr_0.92fr]"
          aria-labelledby="home-title"
        >
          <Reveal className="flex min-h-[360px] flex-col justify-center">
            <h1
              id="home-title"
              className="max-w-3xl text-5xl font-bold leading-[0.98] text-foreground sm:text-6xl"
            >
              Rent the home you love — even if traditional renting says no
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Ask our chatbot about the process, register your details, and a
              Proper Rent agent will follow up personally.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a className={buttonClasses({ size: "lg" })} href={site.routes.renterRegister}>
                Register as renter
              </a>
              <a
                className={buttonClasses({ variant: "secondary", size: "lg" })}
                href={site.routes.landlords}
              >
                I am a landlord
              </a>
            </div>
            <p className="mt-4 text-sm text-muted">
              Takes 2 minutes. A real agent follows up.
            </p>
          </Reveal>

          <Reveal className="flex items-center justify-center">
            <JourneyPath />
          </Reveal>
        </section>

        <Reveal as="section" className="py-10" aria-labelledby="who-we-help-title">
          <h2
            id="who-we-help-title"
            className="text-2xl font-bold text-foreground sm:text-3xl"
          >
            Who Proper Rent helps
          </h2>
          <Stagger className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <StaggerItem>
              <Card>
                <CardHeader>
                  <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                    <House size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-lg">For renters</CardTitle>
                  <CardDescription>
                    Ask general questions, understand Deposit Share and guarantor options,
                    then register so an agent can follow up.
                  </CardDescription>
                </CardHeader>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card>
                <CardHeader>
                  <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                    <Buildings size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-lg">For landlords</CardTitle>
                  <CardDescription>
                    Share property basics and Advanced Rent interest. Every landlord
                    submission notifies the agent.
                  </CardDescription>
                </CardHeader>
              </Card>
            </StaggerItem>
          </Stagger>
          <Reveal className="mt-4 flex flex-col gap-4 rounded-md bg-surface-elevated p-6 sm:flex-row sm:items-center sm:gap-5 sm:p-8">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
              <Handshake size={22} weight="bold" aria-hidden="true" />
            </span>
            <p className="text-sm leading-6 text-muted">
              <span className="font-bold text-foreground">Human follow-up. </span>
              The chatbot helps with general process questions, but a human agent handles
              live availability and closing.
            </p>
          </Reveal>
        </Reveal>

        <Reveal as="section" className="py-10" aria-labelledby="fintech-title">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Fintech for renters
          </p>
          <h2
            id="fintech-title"
            className="text-2xl font-bold text-foreground sm:text-3xl"
          >
            Move in sooner, with less upfront.
          </h2>
          <Stagger className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <StaggerItem>
              <Card>
                <CardHeader>
                  <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                    <PiggyBank size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-lg">Deposit Share</CardTitle>
                  <div className="flex flex-wrap items-baseline gap-2 pt-1">
                    <span className="text-4xl font-bold text-primary">Up to 85%</span>
                    <span className="text-sm text-muted">
                      of your deposit covered on day one
                    </span>
                  </div>
                  <CardDescription>
                    Your share is returned at the end of the tenancy, and the landlord
                    still receives the full deposit, protected as usual.
                  </CardDescription>
                </CardHeader>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card>
                <CardHeader>
                  <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                    <ShieldCheck size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-lg">Guarantor Solutions</CardTitle>
                  <CardDescription>
                    Our guarantor partner can act as your UK guarantor, so you can rent
                    the property you want, even as a student, someone new to the UK,
                    self-employed, or on Universal Credit.
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
          <p className="mt-4 text-sm leading-6 text-muted">
            Built for students, young professionals, self-employed renters, Universal
            Credit recipients, international movers, and renters who have struggled
            with referencing elsewhere.{" "}
            <a className="font-semibold text-foreground underline" href={site.routes.renters}>
              See all renter options
            </a>
          </p>
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
            How it works
          </h2>
          <div className="relative mt-8">
            <div
              aria-hidden="true"
              className="absolute left-[16.67%] right-[16.67%] top-6 hidden border-t border-dashed border-border sm:block"
            />
            <Stagger as="ol" className="relative grid gap-8 sm:grid-cols-3 sm:gap-6">
              {[
                {
                  icon: ChatCircleDots,
                  title: "Ask",
                  body: "Use the chatbot for Proper Rent, letting-process, and generic fintech questions.",
                },
                {
                  icon: ClipboardText,
                  title: "Register",
                  body: "Submit structured details and consent through the renter or landlord form.",
                },
                {
                  icon: UserCheck,
                  title: "Follow-up",
                  body: "An agent reviews the briefing and confirms current options manually.",
                },
              ].map((step) => (
                <StaggerItem as="li" className="flex gap-4 sm:flex-col sm:gap-3" key={step.title}>
                  <span className="relative z-10 grid size-12 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground ring-4 ring-surface-subtle">
                    <step.icon size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="font-bold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted">{step.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </Reveal>

        <Testimonials />

        <Reveal>
          <CtaBand
            title="Ready to speak to Proper Rent?"
            body="Register your requirements or property details. The forms submit to the live backend with consent and human follow-up."
            primaryHref={site.routes.renterRegister}
            primaryLabel="Renter registration"
            secondaryHref={site.routes.landlordRegister}
            secondaryLabel="Landlord registration"
          />
        </Reveal>
      </Container>
    </SiteShell>
  );
}
