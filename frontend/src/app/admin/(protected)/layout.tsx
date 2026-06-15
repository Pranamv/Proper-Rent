import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSessionState } from "@/lib/admin/auth";
import { adminLoginRedirect } from "@/lib/admin/redirects";

type AdminProtectedLayoutProps = {
  children: ReactNode;
};

export default async function AdminProtectedLayout({
  children,
}: AdminProtectedLayoutProps) {
  const authState = await getAdminSessionState();

  if (authState.status === "authenticated") {
    return <AdminShell admin={authState.admin}>{children}</AdminShell>;
  }

  if (authState.status === "unauthenticated") {
    redirect(adminLoginRedirect());
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-xl rounded-md border border-border bg-surface p-6 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
          Admin unavailable
        </p>
        <h1 className="mt-3 text-2xl font-bold text-foreground">
          Admin access is not configured.
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY for the
          frontend environment.
        </p>
        <a
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          href="/admin/login"
        >
          Return to login
        </a>
      </div>
    </main>
  );
}
