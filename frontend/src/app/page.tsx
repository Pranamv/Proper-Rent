import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { JsonLd } from "@/components/marketing/json-ld";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/metadata";
import { motionClasses } from "@/lib/motion";
import { absoluteUrl, site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Home",
  description:
    "Proper Rent helps renters and landlords understand the letting process, register interest, and reach a human agent.",
  path: site.routes.home,
});

const audienceItems = [
  {
    title: "For renters",
    body: "Ask general questions, understand Deposit Share and guarantor options, then register so an agent can follow up.",
  },
  {
    title: "For landlords",
    body: "Share property basics and Advanced Rent interest. Every landlord submission notifies the agent.",
  },
  {
    title: "Human follow-up",
    body: "The chatbot helps with general process questions, but a human agent handles live availability and closing.",
  },
];

const metaItems = [
  {
    label: "Backend",
    value: publicConfig.apiBaseUrl,
  },
  {
    label: "Frontend",
    value: publicConfig.siteUrl,
  },
  {
    label: "Analytics",
    value: publicConfig.analyticsDomain || "Disabled locally",
  },
];

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
          className="grid items-stretch gap-9 lg:grid-cols-[1.08fr_0.92fr]"
          aria-labelledby="home-title"
        >
          <div
            className={`flex min-h-[360px] flex-col justify-center ${motionClasses.enter}`}
          >
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.08em] text-primary">
              Website + Chatbot MVP
            </p>
            <h1
              id="home-title"
              className="max-w-3xl text-5xl font-bold leading-[0.98] text-foreground sm:text-6xl"
            >
              Website leads routed to a human letting agent.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Proper Rent helps renters understand the letting process and Scraye
              fintech products in general terms, then captures structured renter
              and landlord enquiries for agent follow-up.
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
          </div>

          <div
            className="grid content-center gap-4 rounded-md border border-border bg-surface/80 p-4 shadow-soft"
            aria-label="Who Proper Rent helps"
          >
            {audienceItems.map((item) => (
              <Card className="shadow-none" key={item.title}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-4 py-10 md:grid-cols-3" aria-label="How it works">
          {[
            {
              title: "Ask",
              body: "Use the chatbot for Proper Rent, letting-process, and generic fintech questions.",
            },
            {
              title: "Register",
              body: "Submit structured details and consent through the renter or landlord form.",
            },
            {
              title: "Follow-up",
              body: "An agent reviews the briefing and confirms current options manually.",
            },
          ].map((item) => (
            <Card className="shadow-none" key={item.title}>
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.body}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <CtaBand
          title="Ready to speak to Proper Rent?"
          body="Register your requirements or property details. The forms submit to the live backend with consent and human follow-up."
          primaryHref={site.routes.renterRegister}
          primaryLabel="Renter registration"
          secondaryHref={site.routes.landlordRegister}
          secondaryLabel="Landlord registration"
        />

        <section
          id="runtime"
          className="mt-8 grid gap-4 sm:grid-cols-3"
          aria-label="Runtime configuration"
        >
          {metaItems.map((item) => (
            <div
              className="rounded-md border border-border bg-surface/75 p-4"
              key={item.label}
            >
              <span className="block text-sm font-bold text-primary">{item.label}</span>
              <p className="mt-2 break-words text-sm leading-6 text-muted">{item.value}</p>
            </div>
          ))}
        </section>
      </Container>
    </SiteShell>
  );
}
