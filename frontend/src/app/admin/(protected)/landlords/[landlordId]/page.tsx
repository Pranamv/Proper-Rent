import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { LandlordUpdateForm } from "@/components/admin/landlord-update-form";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { adminApi, ApiError } from "@/lib/api";
import type { AdminLandlordDetail, AdminLandlordStatus } from "@/lib/api";
import { getAdminAuthState } from "@/lib/admin/auth";
import { pageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Landlord Detail",
    description: "Protected landlord lead detail view.",
    path: "/admin/landlords",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

const landlordStatusOptions: { label: string; value: AdminLandlordStatus }[] = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Listed", value: "listed" },
  { label: "Inactive", value: "inactive" },
];

const numberFormatter = new Intl.NumberFormat("en-GB");
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/London",
});

type LandlordDetailPageProps = {
  params: Promise<{ landlordId: string }>;
  searchParams?: Promise<{ updated?: string | string[] }>;
};

export default async function LandlordDetailPage({
  params,
  searchParams,
}: LandlordDetailPageProps) {
  const authState = await getAdminAuthState();
  if (authState.status !== "authenticated") {
    return null;
  }

  const { landlordId } = await params;
  const query = (await searchParams) ?? {};
  const wasUpdated = firstParam(query.updated) === "1";

  let landlord: AdminLandlordDetail;
  try {
    landlord = await adminApi.getLandlord(authState.accessToken, landlordId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return <LandlordDetailLoadError />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          className={buttonClasses({ size: "sm", variant: "secondary" })}
          href="/admin/landlords"
        >
          Back to landlords
        </Link>
        {wasUpdated ? <StatusPill tone="success">Landlord updated</StatusPill> : null}
      </div>

      <LandlordHeader landlord={landlord} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <LandlordOverview landlord={landlord} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Notes and status</CardTitle>
              <CardDescription>
                Update the operational state used by the landlord pipeline.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LandlordUpdateForm landlord={landlord} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin metadata</CardTitle>
              <CardDescription>Internal fields exposed only behind admin auth.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <MetaItem label="Landlord id" value={landlord.id} />
                <MetaItem label="Consent given" value={formatBoolean(landlord.consent_given)} />
                <MetaItem label="Consent version" value={landlord.consent_version} />
                <MetaItem label="Consent at" value={formatDateTime(landlord.consent_at)} />
                <MetaItem label="Updated" value={formatDateTimeOptional(landlord.updated_at)} />
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function LandlordHeader({ landlord }: { landlord: AdminLandlordDetail }) {
  return (
    <header className="rounded-md border border-border bg-surface p-5 shadow-soft">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Landlord detail
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {landlord.full_name || "Unnamed landlord"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Agent briefing for contact, property details, product interest, and
            follow-up notes. Landlord leads are not scored in Phase 1.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-semibold",
              statusClasses(landlord.status),
            )}
          >
            {statusLabel(landlord.status)}
          </span>
          <span className="inline-flex min-h-9 items-center rounded-full border border-border bg-surface-subtle px-3 text-sm font-semibold text-muted">
            Not scored
          </span>
        </div>
      </div>
    </header>
  );
}

function LandlordOverview({ landlord }: { landlord: AdminLandlordDetail }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <InfoCard title="Contact">
        <dl className="space-y-3 text-sm">
          <MetaItem label="Email" value={landlord.email ?? "No email"} />
          <MetaItem label="Phone" value={landlord.phone ?? "No phone"} />
          <MetaItem label="Created" value={formatDateTime(landlord.created_at)} />
        </dl>
      </InfoCard>

      <InfoCard title="Property">
        <dl className="space-y-3 text-sm">
          <MetaItem
            label="Address"
            value={landlord.property_address ?? "No address captured"}
          />
          <MetaItem label="Bedrooms" value={formatValue(landlord.bedrooms)} />
          <MetaItem label="Asking rent" value={formatRent(landlord.asking_rent)} />
          <MetaItem label="Available from" value={formatDateOnly(landlord.available_from)} />
        </dl>
      </InfoCard>

      <InfoCard title="Product interest">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <InterestPill active={landlord.advanced_rent_interest}>
              Advanced Rent
            </InterestPill>
            <InterestPill active={landlord.listing_interest}>Listing</InterestPill>
          </div>
          <dl className="space-y-3 text-sm">
            <MetaItem
              label="Advanced Rent"
              value={formatBoolean(landlord.advanced_rent_interest)}
            />
            <MetaItem
              label="Listing interest"
              value={formatBoolean(landlord.listing_interest)}
            />
            <MetaItem label="Priority" value={interestSummary(landlord)} />
          </dl>
        </div>
      </InfoCard>

      <InfoCard title="Current notes">
        {landlord.notes ? (
          <p className="whitespace-pre-wrap text-sm leading-6 text-muted">{landlord.notes}</p>
        ) : (
          <p className="text-sm leading-6 text-muted">
            No internal notes have been recorded for this landlord lead.
          </p>
        )}
      </InfoCard>
    </div>
  );
}

function InfoCard({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
      <dt className="text-muted">{label}</dt>
      <dd className="break-words font-medium text-foreground">{value}</dd>
    </div>
  );
}

function InterestPill({
  active,
  children,
}: {
  active: boolean | null | undefined;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-sm font-semibold",
        active
          ? "border-success/30 bg-success/10 text-success"
          : "border-border bg-surface-subtle text-muted",
      )}
    >
      {children}
    </span>
  );
}

function LandlordDetailLoadError() {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 p-5 text-danger">
      <p className="text-sm font-bold uppercase tracking-[0.08em]">
        Landlord detail unavailable
      </p>
      <h1 className="mt-3 text-2xl font-bold">Could not load this landlord.</h1>
      <p className="mt-2 text-sm leading-6">
        Confirm the backend is running and that the admin landlords API is reachable.
      </p>
    </div>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function statusLabel(status: AdminLandlordStatus) {
  return landlordStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function statusClasses(status: AdminLandlordStatus) {
  if (status === "new") {
    return "border-warning/30 bg-warning/10 text-warning";
  }
  if (status === "listed") {
    return "border-success/30 bg-success/10 text-success";
  }
  if (status === "inactive") {
    return "border-danger/30 bg-danger/10 text-danger";
  }
  return "border-border bg-surface-subtle text-muted";
}

function interestSummary(landlord: AdminLandlordDetail) {
  if (landlord.advanced_rent_interest && landlord.listing_interest) {
    return "Advanced Rent and listing";
  }
  if (landlord.advanced_rent_interest) {
    return "Advanced Rent";
  }
  if (landlord.listing_interest) {
    return "Listing";
  }
  return "No stated product interest";
}

function formatBoolean(value: boolean | null | undefined) {
  if (value === null || value === undefined) {
    return "Not set";
  }
  return value ? "Yes" : "No";
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeZone: "Europe/London",
      }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

function formatDateTimeOptional(value: string | null | undefined) {
  return value ? formatDateTime(value) : "Not set";
}

function formatRent(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Rent not set";
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? `GBP ${numberFormatter.format(numericValue)}`
    : String(value);
}

function formatValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }
  return String(value);
}
