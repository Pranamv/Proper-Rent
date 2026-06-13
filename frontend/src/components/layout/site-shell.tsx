import Link from "next/link";
import type { ReactNode } from "react";

import { CookielessAnalytics } from "@/components/analytics/cookieless-analytics";
import { ChatWidget } from "@/components/chat/chat-widget";
import { Container } from "@/components/layout/container";
import { StatusPill } from "@/components/ui/status-pill";
import { footerNavItems, publicNavItems, site } from "@/lib/site";

type SiteShellProps = {
  children: ReactNode;
  status?: string;
};

export function SiteShell({ children, status = "Phase 1 foundation" }: SiteShellProps) {
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
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:w-auto">
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
            <StatusPill>{status}</StatusPill>
          </div>
        </Container>
      </header>
      <main id="main-content">{children}</main>
      <CookielessAnalytics />
      <ChatWidget />
      <footer className="border-t border-border bg-surface/70">
        <Container className="grid gap-5 py-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-semibold text-foreground">Proper Rent</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Phase 1 website, chatbot, intake, and human follow-up. No live listings
              or per-listing fintech quotes are shown on this site.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-3 text-sm font-semibold text-muted">
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
        </Container>
      </footer>
    </div>
  );
}
