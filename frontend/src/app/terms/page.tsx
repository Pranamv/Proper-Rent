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
    body: "The public pages and chatbot provide general Proper Rent, letting-process, and Scraye fintech product information. They are not legal, financial, affordability, mortgage, tax, or tenancy advice.",
  },
  {
    title: "No live listing claims",
    body: "Phase 1 has no public listing data. Availability, shortlisting, viewings, and Scraye introductions are confirmed manually by a human agent.",
  },
  {
    title: "Human follow-up",
    body: "Submitting a renter or landlord form records an enquiry for agent review. It does not guarantee a property, tenancy, landlord listing, viewing, product approval, or transaction completion.",
  },
  {
    title: "Chatbot boundaries",
    body: "The chatbot must not collect full name, email, or phone. Contact details should be submitted through the relevant consented form. Chatbot replies may be imperfect and are reviewed through the human follow-up workflow.",
  },
  {
    title: "Third-party services",
    body: "Proper Rent uses external infrastructure and service providers for database, authentication, email delivery, and model access.",
  },
  {
    title: "Acceptable use",
    body: "Do not spam the forms or chatbot, submit unlawful or misleading content, attempt to bypass rate limits or admin authentication, probe the service, or use automated traffic that harms the website or its providers.",
  },
  {
    title: "Privacy and consent",
    body: "Form submissions are subject to the Privacy Policy and the consent wording shown at the point of submission. The consent version is stored with successful renter and landlord enquiries.",
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
