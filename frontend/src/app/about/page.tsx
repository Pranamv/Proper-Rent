import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description:
    "Proper Rent exists to help tenants with non-standard situations access rental homes, using fintech tools and agent-led support.",
  path: site.routes.about,
});

const values = [
  {
    title: "Access over exclusion",
    body: "Traditional referencing shuts out students, the self-employed, Universal Credit recipients, and many others. We build tools that open those doors.",
  },
  {
    title: "Fintech with purpose",
    body: "Deposit Share and guarantor solutions are not gimmicks — they are practical tools that let tenants move in and landlords get protected deposits.",
  },
  {
    title: "Agents in the loop",
    body: "Technology handles the brief. A Proper Rent agent handles the relationship, the viewing, and the tenancy next steps.",
  },
  {
    title: "Landlords benefit too",
    body: "Advanced Rent gives landlords earlier access to cash flow without changing anything for their tenant. It is a win on both sides.",
  },
] as const;

export default function AboutPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="About us"
          title="Built to open doors that traditional renting closes."
          body="Proper Rent combines agent expertise with financial tools to help tenants who get overlooked elsewhere — and to give landlords a better route to a reliable let."
          actions={[
            { href: site.routes.tenants, label: "For tenants" },
            { href: site.routes.landlords, label: "For landlords", variant: "secondary" },
          ]}
        />

        <Reveal as="section" className="py-10" aria-labelledby="mission-title">
          <div className="max-w-3xl rounded-md border border-primary/20 bg-accent/30 px-8 py-7">
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
              Our mission
            </p>
            <p className="mt-3 text-xl font-bold leading-snug text-foreground sm:text-2xl">
              We strive to enable those with difficulty renting to successfully sign contracts
              and move in — using our state of the art financial tools.
            </p>
          </div>
        </Reveal>

        <Section
          eyebrow="What we do"
          title="Two routes. One outcome: a home."
          body="Proper Rent sits between a tenant's requirement and a landlord's property — adding the financial tools and agent support that make the difference when standard routes fail."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>For tenants</CardTitle>
                <CardDescription>
                  Register your requirements, share your situation, and let a Proper Rent
                  agent find a practical route — whether that includes Deposit Share,
                  a guarantor solution, or both.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>For landlords</CardTitle>
                <CardDescription>
                  Register a property for listing support, explore Advanced Rent to access
                  future income upfront, or combine both. An agent reviews every submission.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </Section>

        <Section
          eyebrow="What we believe"
          title="The principles behind the product."
        >
          <Stagger className="grid gap-4 sm:grid-cols-2">
            {values.map((item) => (
              <StaggerItem key={item.title}>
                <Card className="h-full shadow-none">
                  <CardHeader>
                    <CardTitle as="h3">{item.title}</CardTitle>
                    <CardDescription>{item.body}</CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </Section>

        <CtaBand
          title="Ready to get started?"
          body="Register as a tenant or landlord. A Proper Rent agent reviews every submission and follows up with the right next step."
          primaryHref={site.routes.renterRegister}
          primaryLabel="Register as tenant"
          secondaryHref={site.routes.contact}
          secondaryLabel="Get in touch"
        />
      </Container>
    </SiteShell>
  );
}
