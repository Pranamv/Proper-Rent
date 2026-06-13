import type { Metadata } from "next";

import { RenterIntakeForm } from "@/components/forms/renter-intake-form";
import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Renter Registration",
  description:
    "Register renter requirements with Proper Rent so a human letting agent can follow up.",
  path: site.routes.renterRegister,
});

export default function RenterRegisterPage() {
  return (
    <SiteShell status="Renter intake">
      <Container className="pb-12">
        <PageHero
          eyebrow="Renter registration"
          title="Tell us what you need from your next rental."
          body="Complete the multi-step intake form so the Proper Rent agent can review your requirements, understand your readiness, and follow up with the right next steps."
          className="lg:grid-cols-[1fr_0.72fr]"
          aside={
            <div className="rounded-md border border-border bg-surface p-5 shadow-soft">
              <h2 className="text-lg font-semibold text-foreground">Before you start</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                <li>Have your preferred areas and monthly budget ready.</li>
                <li>Contact details are saved under consent and never collected in chat.</li>
                <li>Every website submission reaches the agent pipeline.</li>
              </ul>
            </div>
          }
        />
        <RenterIntakeForm />
      </Container>
    </SiteShell>
  );
}
