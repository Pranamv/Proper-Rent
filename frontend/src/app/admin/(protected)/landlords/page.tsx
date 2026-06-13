import type { Metadata } from "next";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { pageMetadata } from "@/lib/metadata";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Admin Landlords",
    description: "Protected landlord operations view.",
    path: "/admin/landlords",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLandlordsPage() {
  return (
    <div className="space-y-5">
      <section className="rounded-md border border-border bg-surface p-5 shadow-soft">
        <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
          Landlords
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Landlord pipeline
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          P1.5.4 will replace this placeholder with landlord list and detail views
          backed by GET /api/v1/admin/landlords and PATCH status updates.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {["New", "Contacted", "Listed"].map((item) => (
          <Card className="shadow-none" key={item}>
            <CardHeader>
              <CardTitle>{item}</CardTitle>
              <CardDescription>Landlord status lane placeholder.</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
