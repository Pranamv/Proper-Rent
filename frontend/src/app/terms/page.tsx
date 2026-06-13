import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Section } from "@/components/marketing/section";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Terms",
  description:
    "Terms for using the Proper Rent Phase 1 website, chatbot, and intake surfaces.",
  path: site.routes.terms,
});

const termsSections = [
  {
    title: "Informational website",
    body: "The public pages and chatbot provide general Proper Rent, letting-process, and fintech information. They are not legal, financial, or tenancy advice.",
  },
  {
    title: "No live listing claims",
    body: "Phase 1 has no public listing data. Availability, shortlisting, viewings, and Scraye introductions are confirmed manually by a human agent.",
  },
  {
    title: "Human follow-up",
    body: "Submitting a renter or landlord form records an enquiry for agent review. It does not guarantee a property, tenancy, listing, product approval, or completion.",
  },
  {
    title: "Chatbot boundaries",
    body: "The chatbot must not collect full name, email, or phone. Contact details should be submitted through the relevant consented form.",
  },
  {
    title: "Third-party services",
    body: "Proper Rent uses external infrastructure and service providers for database, authentication, email delivery, and model access.",
  },
  {
    title: "Launch review",
    body: "Final legal and operational wording should be reviewed before accepting the first real lead.",
  },
];

export default function TermsPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="Legal"
          title="Terms"
          body="These terms describe the boundaries of the Proper Rent Phase 1 website and chatbot."
          actions={[
            {
              href: site.routes.privacy,
              label: "Privacy Policy",
              variant: "secondary",
            },
          ]}
        />

        <Section
          title="Use of the Phase 1 website."
          body="Proper Rent is a lead-generation and tenant-fintech facilitation website. The human agent remains responsible for follow-up and closing work."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {termsSections.map((item) => (
              <Card className="shadow-none" key={item.title}>
                <CardHeader>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Section>
      </Container>
    </SiteShell>
  );
}
