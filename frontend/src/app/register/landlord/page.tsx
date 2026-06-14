import type { Metadata } from "next";

import { LandlordIntakeForm } from "@/components/forms/landlord-intake-form";
import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Landlord Registration",
  description:
    "Register landlord property details with Proper Rent so a human letting agent can follow up.",
  path: site.routes.landlordRegister,
});

export default function LandlordRegisterPage() {
  return (
    <SiteShell>
      <Container className="pb-12">
        <PageHero
          eyebrow="Landlord registration"
          title="Share property details for agent follow-up."
          body="Complete the landlord intake form so the Proper Rent agent can review the property, understand listing or Advanced Rent interest, and follow up with the right next steps."
          className="lg:grid-cols-[1fr_0.72fr]"
          aside={
            <div className="rounded-md border border-border bg-surface p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-foreground">Before you start</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                <li>Have the property address, rent guide, and availability ready.</li>
                <li>Choose whether you want listing support, Advanced Rent, or both.</li>
                <li>Every successful landlord submission notifies the agent.</li>
              </ul>
            </div>
          }
        />
        <LandlordIntakeForm />
      </Container>
    </SiteShell>
  );
}
