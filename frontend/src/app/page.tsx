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
import { HeroSupportPanel } from "@/components/marketing/hero-support-panel";
import { JsonLd } from "@/components/marketing/json-ld";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Home",
  description:
    "Proper Rent helps renters move forward with Deposit Share, guarantor support, and human agent follow-up.",
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
          className="grid items-center gap-10 lg:grid-cols-[1.04fr_0.96fr]"
          aria-labelledby="home-title"
        >
          <Reveal className="flex min-h-[360px] min-w-0 flex-col justify-center">
            <h1
              id="home-title"
              className="max-w-3xl text-4xl font-bold leading-[1.04] text-foreground sm:text-6xl sm:leading-[1.02]"
            >
              Rent the home you love, even when referencing gets in the way.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Get help with Deposit Share, guarantor support, and a real Proper
              Rent agent when upfront costs or referencing make renting harder
              than it should be.
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
              Takes 2 minutes. Contact details stay in the form. A real agent
              follows up.
            </p>
          </Reveal>

          <Reveal className="flex min-w-0 items-center justify-center">
            <HeroSupportPanel />
          </Reveal>
        </section>

        <Reveal as="section" className="py-10 sm:py-12" aria-labelledby="fintech-title">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Fintech for renters
          </p>
          <h2
            id="fintech-title"
            className="text-2xl font-bold text-foreground sm:text-3xl"
          >
            Move in sooner, with less upfront.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Proper Rent focuses on the two barriers that stop good renters from
            moving forward: upfront cash and traditional guarantor requirements.
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
                    Your share is returned at the end of the tenancy, and the landlord
                    still receives the full deposit, protected as usual.
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

        <Reveal as="section" className="py-10" aria-labelledby="who-we-help-title">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Who it helps
          </p>
          <h2
            id="who-we-help-title"
            className="text-2xl font-bold text-foreground sm:text-3xl"
          >
            Support for renters and landlords who need a clearer route.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            The home page is renter-first, while still giving landlords a direct
            route to register property and Advanced Rent interest.
          </p>
          <Stagger className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <StaggerItem>
              <Card className="h-full shadow-none">
                <CardHeader>
                  <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                    <House size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <CardTitle as="h3" className="text-lg">For renters</CardTitle>
                  <CardDescription>
                    A more workable path for people blocked by upfront deposits,
                    guarantor requirements, payslip rules, or traditional referencing.
                  </CardDescription>
                </CardHeader>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="h-full shadow-none">
                <CardHeader>
                  <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                    <Buildings size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <CardTitle as="h3" className="text-lg">For landlords</CardTitle>
                  <CardDescription>
                    A direct route to share property basics, listing interest, or
                    Advanced Rent questions with a Proper Rent agent.
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
              The site can answer general questions, but a person handles live
              availability, figures, viewings, and next steps.
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
                  body: "Use the chatbot for general Proper Rent, deposit, guarantor, and landlord questions.",
                },
                {
                  icon: ClipboardText,
                  title: "Register",
                  body: "Submit structured details and consent through the renter or landlord form.",
                },
                {
                  icon: UserCheck,
                  title: "Follow-up",
                  body: "An agent reviews your enquiry and confirms current options directly.",
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

        <Reveal as="section" className="py-10" aria-labelledby="trust-title">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Trust signals
          </p>
          <h2
            id="trust-title"
            className="max-w-3xl text-2xl font-bold text-foreground sm:text-3xl"
          >
            Built for trust from the first click.
          </h2>
          <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: UserCheck,
                title: "Human-reviewed enquiries",
                body: "Every registration is prepared for agent follow-up.",
              },
              {
                icon: ShieldCheck,
                title: "Contact details stay in forms",
                body: "Chat answers general questions; personal details use consented forms.",
              },
              {
                icon: House,
                title: "No fake live listings",
                body: "Availability is confirmed by an agent, not guessed on the website.",
              },
              {
                icon: Handshake,
                title: "Clear next steps",
                body: "Renters and landlords start from separate, focused routes.",
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <div className="h-full rounded-md border border-border bg-surface p-5">
                  <span className="grid size-10 place-items-center rounded-full bg-accent-linen text-foreground">
                    <item.icon size={20} weight="bold" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </Reveal>

        <Reveal>
          <CtaBand
            title="Ready to speak to Proper Rent?"
            body="Share your renter requirements or property details through the right form. A Proper Rent agent reviews the enquiry and follows up with next steps."
            primaryHref={site.routes.renterRegister}
            primaryLabel="Register as renter"
            secondaryHref={site.routes.landlordRegister}
            secondaryLabel="Register as landlord"
          />
        </Reveal>
      </Container>
    </SiteShell>
  );
}
