import Link from "next/link";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { StatusPill } from "@/components/ui/status-pill";
import type { AdminSessionUser } from "@/lib/admin/auth";
import { getAdminNavItems } from "@/lib/admin/navigation";
import { site } from "@/lib/site";

type AdminShellProps = {
  admin: AdminSessionUser;
  children: ReactNode;
};

export function AdminShell({ admin, children }: AdminShellProps) {
  const navItems = getAdminNavItems(admin.role);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow-focus"
        href="#admin-content"
      >
        Skip to admin content
      </a>
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-b border-border bg-surface lg:border-b-0 lg:border-r">
          <div className="sticky top-0 flex gap-5 p-4 lg:min-h-screen lg:flex-col lg:p-5">
            <div className="min-w-0 flex-1 lg:flex-none">
              <Link
                className="inline-flex items-center gap-3 rounded-md font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                href="/admin"
                aria-label="Proper Rent admin home"
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
                  aria-hidden="true"
                >
                  PR
                </span>
                <span className="min-w-0">
                  <span className="block truncate">Proper Rent</span>
                  <span className="block text-xs font-medium text-muted">Admin</span>
                </span>
              </Link>
            </div>
            <div className="hidden lg:block">
              <AdminNav items={navItems} />
            </div>
            <div className="hidden border-t border-border pt-4 text-sm leading-6 text-muted lg:block">
              <p className="font-semibold text-foreground">Operations</p>
              <p className="mt-1">
                Review renter and landlord enquiries, update status, and keep
                follow-up moving.
              </p>
            </div>
          </div>
          <div className="border-t border-border px-4 pb-4 lg:hidden">
            <AdminNav compact items={navItems} />
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex min-h-16 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-6">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary">
                  Admin workspace
                </p>
                <p className="mt-1 truncate text-sm text-muted">
                  <span className="font-semibold text-foreground">{admin.email}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill>Role: {admin.role}</StatusPill>
                <Link
                  className="rounded-md px-3 py-2 text-sm font-semibold text-muted hover:bg-surface-subtle hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  href={site.routes.home}
                >
                  Public site
                </Link>
                <AdminSignOutButton />
              </div>
            </div>
          </header>
          <main className="px-4 py-6 lg:px-6 lg:py-8" id="admin-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
