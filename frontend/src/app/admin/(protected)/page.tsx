import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Admin Overview",
    description: "Proper Rent admin operations workspace.",
    path: "/admin",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

const workspaceCards = [
  {
    title: "Renter leads",
    body: "P1.5.2 adds the operational stat strip and lead pipeline powered by the admin leads API.",
    href: "/admin/leads",
    label: "Open leads",
  },
  {
    title: "Landlords",
    body: "Review landlord submissions, product interest, notes, and status using the admin landlords API.",
    href: "/admin/landlords",
    label: "Open landlords",
  },
];

const dailyChecks = [
  "Review hot renter leads first and follow up within the two-hour target.",
  "Move contacted leads through qualified, viewing, offer, and completion stages.",
  "Review every landlord submission for listing or Advanced Rent follow-up.",
  "Keep Scraye shortlisting and commission handoff manual during Phase 1.",
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-md border border-border bg-surface p-5 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
          P1.5.1 foundation
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Admin shell and auth flow are active.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          This protected workspace is ready for the lead and landlord operational views.
          Supabase handles sign-in, while the backend confirms the signed-in user is an
          admin agent before any admin route renders.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Admin workspaces">
        {workspaceCards.map((item) => (
          <Card className="shadow-none" key={item.href}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link className={buttonClasses({ variant: "secondary", size: "sm" })} href={item.href}>
                {item.label}
              </Link>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-md border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Daily workflow</h2>
        <ul className="mt-4 grid gap-3 text-sm leading-6 text-muted md:grid-cols-2">
          {dailyChecks.map((item) => (
            <li className="rounded-md border border-border bg-background p-3" key={item}>
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
