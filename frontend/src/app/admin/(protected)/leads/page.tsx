import type { Metadata } from "next";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Admin Leads",
    description: "Protected renter lead operations view.",
    path: "/admin/leads",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLeadsPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-md border border-border bg-surface p-5 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
          Leads
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Renter pipeline
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          P1.5.2 will replace this placeholder with the lead list, operational stat
          strip, filters, and pagination backed by GET /api/v1/admin/leads.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {["New leads today", "Hot leads pending", "Pipeline by stage"].map((item) => (
          <Card className="shadow-none" key={item}>
            <CardHeader>
              <CardTitle>{item}</CardTitle>
              <CardDescription>Wired in the next admin leads task.</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
