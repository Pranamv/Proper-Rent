import {
  EnvelopeSimple,
  FacebookLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import type { ReactNode } from "react";

import { CookielessAnalytics } from "@/components/analytics/cookieless-analytics";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Container } from "@/components/layout/container";
import { footerCompanyItems, footerNavItems, publicNavItems, site } from "@/lib/site";

type SiteShellProps = {
  children: ReactNode;
};

const socialItems = [
  {
    icon: EnvelopeSimple,
    label: "Gmail",
    href: `mailto:${site.contactEmail}`,
  },
  {
    icon: WhatsappLogo,
    label: "WhatsApp",
    href: site.social.whatsapp,
  },
  {
    icon: FacebookLogo,
    label: "Facebook",
    href: site.social.facebook,
  },
] as const;

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-focus"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <Container className="flex min-h-16 flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link
            className="inline-flex items-center gap-3 font-semibold text-foreground"
            href={site.routes.home}
            aria-label="Proper Rent home"
          >
            <span
              className="grid size-9 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
              aria-hidden="true"
            >
              PR
            </span>
            <span>Proper Rent</span>
          </Link>
          <nav aria-label="Primary navigation">
            <ul className="flex flex-wrap gap-2 text-sm font-semibold text-muted">
              {publicNavItems.map((item) => (
                <li key={item.href}>
                  <Link
                    className="rounded-md px-3 py-2 hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </header>
      <main id="main-content">{children}</main>
      <CookielessAnalytics />
      <ChatWidget />
      <footer className="border-t border-border bg-surface/70">
        <Container className="grid gap-8 py-9">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.2fr_auto_auto_auto] lg:items-start">
            <div>
              <p className="font-semibold text-foreground">Proper Rent</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                Support for tenants and landlords.
              </p>
            </div>
            <nav aria-label="Company navigation">
              <p className="text-sm font-semibold text-foreground">Company</p>
              <ul className="mt-3 grid gap-2 text-sm font-semibold text-muted">
                {footerCompanyItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="rounded-md hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Footer navigation">
              <p className="text-sm font-semibold text-foreground">Links</p>
              <ul className="mt-3 grid gap-2 text-sm font-semibold text-muted">
                {footerNavItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      className="rounded-md hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="grid gap-3 lg:justify-items-end">
              <p className="text-sm font-semibold text-foreground">Contact</p>
              <a
                className="inline-flex rounded-md text-sm font-semibold text-foreground underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                href={`mailto:${site.contactEmail}`}
              >
                {site.contactEmail}
              </a>
              <p className="max-w-xs text-sm leading-6 text-muted lg:text-right">
                For renter, landlord, and partnership enquiries.
              </p>
              <ul className="flex gap-2" aria-label="Social media links">
                {socialItems.map((item) => (
                  <li key={item.label}>
                    <SocialIconLink item={item} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="border-t border-border pt-6 text-center text-xs text-muted">
            © {new Date().getFullYear()} Proper Rent. All rights reserved.
          </p>
        </Container>
      </footer>
    </div>
  );
}

type SocialItem = (typeof socialItems)[number];

function SocialIconLink({ item }: { item: SocialItem }) {
  const Icon = item.icon;

  if (!item.href) {
    return (
      <span
        aria-disabled="true"
        aria-label={`${item.label} link coming soon`}
        className="grid size-9 place-items-center rounded-full border border-border bg-surface-subtle text-muted/60"
        title={`${item.label} link coming soon`}
      >
        <Icon size={18} weight="bold" aria-hidden="true" />
      </span>
    );
  }

  return (
    <a
      aria-label={item.label}
      className="grid size-9 place-items-center rounded-full border border-border bg-surface text-foreground transition hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      href={item.href}
      rel={item.href.startsWith("http") ? "noreferrer" : undefined}
      target={item.href.startsWith("http") ? "_blank" : undefined}
    >
      <Icon size={18} weight="bold" aria-hidden="true" />
    </a>
  );
}
