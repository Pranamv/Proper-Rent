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
    body: "Prioritise renter enquiries by score, stage, move timing, and follow-up status.",
    href: "/admin/leads",
    label: "Open leads",
  },
  {
    title: "Landlords",
    body: "Review property-owner enquiries, Advanced Rent interest, listing intent, and notes.",
    href: "/admin/landlords",
    label: "Open landlords",
  },
];

const dailyChecks = [
  "Review hot renter leads first and follow up within the two-hour target.",
  "Move contacted leads through qualified, viewing, offer, and completion stages.",
  "Review every landlord submission for listing or Advanced Rent follow-up.",
  "Keep notes current so the next agent can understand the last action quickly.",
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-md border border-border bg-surface p-5 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
          Daily operations
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Review enquiries and move follow-up forward.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Use the queues below to prioritise renter leads, review landlord
          opportunities, and keep status notes current across the team.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2" aria-label="Admin workspaces">
        {workspaceCards.map((item) => (
          <Card
            className="group shadow-none transition duration-200 hover:-translate-y-1 hover:border-primary/45 hover:shadow-soft motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            key={item.href}
          >
            <CardHeader>
              <CardTitle as="h2">{item.title}</CardTitle>
              <CardDescription>{item.body}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                className={buttonClasses({
                  className: "group-hover:border-primary/45",
                  variant: "secondary",
                  size: "sm",
                })}
                href={item.href}
              >
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
