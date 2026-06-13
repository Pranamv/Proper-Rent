import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { StatusPill } from "@/components/ui/status-pill";
import { getAdminAuthState } from "@/lib/admin/auth";
import { safeAdminRedirect } from "@/lib/admin/redirects";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Admin Login",
    description: "Sign in to the Proper Rent admin workspace.",
    path: "/admin/login",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = (await searchParams) ?? {};
  const redirectTo = safeAdminRedirect(params.redirectTo);
  const authState = await getAdminAuthState();

  if (authState.status === "authenticated") {
    redirect(redirectTo);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col justify-between border-b border-border bg-surface p-6 lg:border-b-0 lg:border-r lg:p-8">
          <div>
            <Link
              className="inline-flex items-center gap-3 rounded-md font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              href={site.routes.home}
              aria-label="Proper Rent home"
            >
              <span
                className="grid size-10 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
                aria-hidden="true"
              >
                PR
              </span>
              <span>Proper Rent</span>
            </Link>
          </div>

          <div className="my-12 max-w-xl">
            <StatusPill>Protected admin</StatusPill>
            <h1 className="mt-5 text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              Operations workspace for human follow-up.
            </h1>
            <p className="mt-5 text-base leading-7 text-muted">
              Phase 1 keeps lead handling private: Supabase authenticates the user,
              then the backend verifies the matching agent has admin access.
            </p>
          </div>

          <p className="text-sm leading-6 text-muted">
            No public registration is available for admin accounts.
          </p>
        </section>

        <section className="flex items-center justify-center p-6 lg:p-8">
          <div className="w-full max-w-md space-y-4">
            {authState.status === "forbidden" ? (
              <div
                className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-medium text-danger"
                role="alert"
              >
                {authState.email ?? "This Supabase user"} is signed in but is not an
                admin agent.
              </div>
            ) : null}
            {authState.status === "backend_error" ? (
              <div
                className="rounded-md border border-warning/30 bg-warning/10 px-4 py-3 text-sm font-medium text-warning"
                role="alert"
              >
                The backend admin check is unavailable. Sign-in can continue once the
                API is reachable.
              </div>
            ) : null}
            <AdminLoginForm redirectTo={redirectTo} />
          </div>
        </section>
      </div>
    </main>
  );
}
