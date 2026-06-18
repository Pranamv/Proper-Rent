import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { CtaBand } from "@/components/marketing/cta-band";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  description:
    "Guides, updates, and insights on renting, fintech, and the UK housing market from the Proper Rent team.",
  path: site.routes.blog,
});

export default function BlogPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="Blog"
          title="Insights on renting, fintech, and the housing market."
          body="Guides, updates, and practical advice from the Proper Rent team — for tenants navigating a tough market and landlords looking for a smarter route."
        />

        <Reveal
          as="section"
          className="py-10"
          aria-label="Blog posts"
        >
          <div className="flex min-h-[280px] items-center justify-center rounded-md border border-border bg-surface-subtle px-8 py-16 text-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
                Coming soon
              </p>
              <p className="mt-3 text-xl font-bold text-foreground">
                Posts are on their way.
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                We are preparing guides on deposits, guarantors, Advanced Rent, and the
                UK rental market. Check back soon.
              </p>
            </div>
          </div>
        </Reveal>

        <CtaBand
          title="No need to wait for the blog."
          body="Register your requirements today. A Proper Rent agent will follow up with practical next steps for your situation."
          primaryHref={site.routes.renterRegister}
          primaryLabel="Register as tenant"
          secondaryHref={site.routes.contact}
          secondaryLabel="Get in touch"
        />
      </Container>
    </SiteShell>
  );
}
