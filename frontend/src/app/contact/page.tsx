import {
  Buildings,
  EnvelopeSimple,
  FacebookLogo,
  HouseLine,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/marketing/page-hero";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { buttonClasses } from "@/components/ui/button";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description:
    "Get in touch with the Proper Rent team for tenant, landlord, and partnership enquiries.",
  path: site.routes.contact,
});

const channels = [
  {
    icon: EnvelopeSimple,
    title: "Email",
    body: "For general, tenant, and landlord enquiries.",
    cta: site.contactEmail,
    href: `mailto:${site.contactEmail}`,
  },
  {
    icon: WhatsappLogo,
    title: "WhatsApp",
    body: "Prefer to message? Reach us on WhatsApp.",
    cta: "Message us",
    href: site.social.whatsapp,
  },
  {
    icon: FacebookLogo,
    title: "Facebook",
    body: "Follow updates and send us a message.",
    cta: "Find us on Facebook",
    href: site.social.facebook,
  },
] as const;

const routes = [
  {
    icon: HouseLine,
    title: "Register as a tenant",
    body: "Share your requirements and a Proper Rent agent will follow up with the right next step.",
    href: site.routes.renterRegister,
    label: "Start registration",
  },
  {
    icon: Buildings,
    title: "Register as a landlord",
    body: "Share your property details for listing support, Advanced Rent, or both.",
    href: site.routes.landlordRegister,
    label: "Start registration",
  },
] as const;

export default function ContactPage() {
  return (
    <SiteShell>
      <Container>
        <PageHero
          eyebrow="Contact us"
          title="We'd love to hear from you."
          body="Tenant enquiries, landlord questions, or partnership discussions — reach us through any of the channels below."
        />

        <Reveal as="section" className="py-10" aria-labelledby="contact-channels-title">
          <h2
            id="contact-channels-title"
            className="text-2xl font-bold text-foreground sm:text-3xl"
          >
            Get in touch
          </h2>
          <Stagger className="mt-6 grid gap-4 sm:grid-cols-3">
            {channels.map((channel) => {
              const Icon = channel.icon;
              const isAvailable = !!channel.href;
              return (
                <StaggerItem key={channel.title}>
                  <div className="h-full rounded-md border border-border bg-surface p-6">
                    <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                      <Icon size={22} weight="bold" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-bold text-foreground">{channel.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted">{channel.body}</p>
                    {isAvailable ? (
                      <a
                        className="mt-4 inline-flex text-sm font-semibold text-primary underline hover:text-foreground"
                        href={channel.href}
                        rel={channel.href.startsWith("http") ? "noreferrer" : undefined}
                        target={channel.href.startsWith("http") ? "_blank" : undefined}
                      >
                        {channel.cta}
                      </a>
                    ) : (
                      <p className="mt-4 text-sm font-semibold text-muted">Coming soon</p>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
        </Reveal>

        <Reveal
          as="section"
          className="rounded-md bg-surface-subtle px-5 py-8 sm:px-8 sm:py-10 mb-10"
          aria-labelledby="register-routes-title"
        >
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Ready to register?
          </p>
          <h2
            id="register-routes-title"
            className="max-w-2xl text-2xl font-bold text-foreground sm:text-3xl"
          >
            The fastest way to get a response is through the form.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            Registrations go directly to the agent queue. A Proper Rent agent reviews
            every submission and follows up within 24 hours.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {routes.map((route) => {
              const Icon = route.icon;
              return (
                <div className="rounded-md border border-border bg-surface p-6" key={route.title}>
                  <span className="grid size-11 place-items-center rounded-full bg-accent-linen text-foreground">
                    <Icon size={22} weight="bold" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 font-bold text-foreground">{route.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{route.body}</p>
                  <a className={buttonClasses({ size: "sm", className: "mt-5" })} href={route.href}>
                    {route.label}
                  </a>
                </div>
              );
            })}
          </div>
        </Reveal>
      </Container>
    </SiteShell>
  );
}
