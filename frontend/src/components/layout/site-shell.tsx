import Link from "next/link";
import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { StatusPill } from "@/components/ui/status-pill";

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
        <Container className="flex min-h-16 items-center justify-between gap-4 py-4">
          <Link
            className="inline-flex items-center gap-3 font-semibold text-foreground"
            href="/"
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
          <StatusPill>{status}</StatusPill>
        </Container>
      </header>
      <main id="main-content">{children}</main>
    </div>
  );
}
