import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Buildings,
  ClockCountdown,
  Gauge,
  HouseLine,
  ListChecks,
  Users,
} from "@phosphor-icons/react/dist/ssr";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonClasses } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { adminApi, ApiError } from "@/lib/api";
import type {
  AdminLandlordListItem,
  AdminLandlordListResponse,
  AdminLandlordStatus,
  AdminLeadListItem,
  AdminLeadListResponse,
  AdminLeadStatus,
} from "@/lib/api";
import { getAdminSessionState } from "@/lib/admin/auth";
import { pageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

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

const leadStatusLabels: Record<AdminLeadStatus, string> = {
  completed: "Completed",
  contacted: "Contacted",
  let_agreed: "Let agreed",
  lost: "Lost",
  new: "New",
  offer_made: "Offer",
  qualified: "Qualified",
  viewing_arranged: "Viewing",
};

const landlordStatusLabels: Record<AdminLandlordStatus, string> = {
  contacted: "Contacted",
  inactive: "Inactive",
  listed: "Listed",
  new: "New",
};

const landlordStatuses: AdminLandlordStatus[] = [
  "new",
  "contacted",
  "listed",
  "inactive",
];

const numberFormatter = new Intl.NumberFormat("en-GB");
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "full",
  timeZone: "Europe/London",
});

type DashboardData =
  | {
      kind: "ready";
      landlordStatusTotals: Record<AdminLandlordStatus, number>;
      landlords: AdminLandlordListResponse;
      leads: AdminLeadListResponse;
    }
  | {
      kind: "error";
      message: string;
    };

export default async function AdminOverviewPage() {
  const authState = await getAdminSessionState();
  if (authState.status !== "authenticated") {
    return null;
  }

  const dashboard = await getDashboardData(authState.accessToken);

  return (
    <div className="space-y-6">
      <DashboardHero dashboard={dashboard} />

      {dashboard.kind === "ready" ? (
        <>
          <MetricGrid dashboard={dashboard} />

          <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <PriorityQueue
              leads={dashboard.leads.results}
              landlords={dashboard.landlords.results}
            />
            <WorkflowPanel />
          </section>

          <section className="grid gap-4 xl:grid-cols-2">
            <WorkspaceCard
              body="Score, move timing, status, and contact context for renter follow-up."
              count={`${numberFormatter.format(dashboard.leads.total)} total`}
              href="/admin/leads"
              icon={<Users aria-hidden="true" size={22} weight="bold" />}
              label="Open renter queue"
              title="Renter pipeline"
            />
            <WorkspaceCard
              body="Property-owner submissions, product interest, and landlord follow-up notes."
              count={`${numberFormatter.format(dashboard.landlords.total)} total`}
              href="/admin/landlords"
              icon={<Buildings aria-hidden="true" size={22} weight="bold" />}
              label="Open landlord queue"
              title="Landlord pipeline"
            />
          </section>
        </>
      ) : (
        <DashboardLoadError message={dashboard.message} />
      )}
    </div>
  );
}

async function getDashboardData(accessToken: string): Promise<DashboardData> {
  try {
    const [leads, landlords, ...landlordStatusResponses] = await Promise.all([
      adminApi.listLeads(accessToken, { limit: 5, page: 1 }),
      adminApi.listLandlords(accessToken, { limit: 5, page: 1 }),
      ...landlordStatuses.map((status) =>
        adminApi.listLandlords(accessToken, { limit: 1, page: 1, status }),
      ),
    ]);

    return {
      kind: "ready",
      landlordStatusTotals: Object.fromEntries(
        landlordStatuses.map((status, index) => [
          status,
          landlordStatusResponses[index]?.total ?? 0,
        ]),
      ) as Record<AdminLandlordStatus, number>,
      landlords,
      leads,
    };
  } catch (error) {
    return {
      kind: "error",
      message:
        error instanceof ApiError
          ? `The admin API returned ${error.status}.`
          : "The admin API could not be reached.",
    };
  }
}

function DashboardHero({ dashboard }: { dashboard: DashboardData }) {
  return (
    <section className="overflow-hidden rounded-md border border-border bg-surface shadow-soft">
      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Operations dashboard
          </p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-foreground">
            Prioritise the next follow-up.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            A concise workspace for renter and landlord enquiries, built around
            the records that need human review.
          </p>
        </div>
        <div className="rounded-md border border-border bg-background p-4">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted">
            Today
          </p>
          <p className="mt-2 text-lg font-semibold text-foreground">
            {dateFormatter.format(new Date())}
          </p>
          <p className="mt-2 text-sm leading-5 text-muted">
            {dashboard.kind === "ready"
              ? "Queue data is live from the current admin API."
              : "Queue data is temporarily unavailable."}
          </p>
        </div>
      </div>
    </section>
  );
}

function MetricGrid({
  dashboard,
}: {
  dashboard: Extract<DashboardData, { kind: "ready" }>;
}) {
  const leadPipelineTotal = Object.values(dashboard.leads.summary.pipeline_by_stage).reduce(
    (total, count) => total + count,
    0,
  );
  const landlordNew = dashboard.landlordStatusTotals.new;
  const activeLandlords =
    dashboard.landlordStatusTotals.new +
    dashboard.landlordStatusTotals.contacted +
    dashboard.landlordStatusTotals.listed;

  const metrics = [
    {
      detail: "Score 70+ still awaiting action",
      icon: <Gauge aria-hidden="true" size={22} weight="bold" />,
      label: "Hot renters",
      tone: dashboard.leads.summary.hot_leads_pending > 0 ? ("warning" as const) : ("neutral" as const),
      value: dashboard.leads.summary.hot_leads_pending,
    },
    {
      detail: "Fresh renter registrations",
      icon: <ClockCountdown aria-hidden="true" size={22} weight="bold" />,
      label: "New today",
      tone: "success" as const,
      value: dashboard.leads.summary.new_leads_today,
    },
    {
      detail: "Landlords awaiting first contact",
      icon: <HouseLine aria-hidden="true" size={22} weight="bold" />,
      label: "New landlords",
      tone: landlordNew > 0 ? ("warning" as const) : ("neutral" as const),
      value: landlordNew,
    },
    {
      detail: `${formatCount(leadPipelineTotal, "renter")} / ${formatCount(activeLandlords, "landlord")} active`,
      icon: <ListChecks aria-hidden="true" size={22} weight="bold" />,
      label: "Active pipeline",
      tone: "neutral" as const,
      value: leadPipelineTotal + activeLandlords,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4" aria-label="Dashboard metrics">
      {metrics.map((metric) => (
        <div className="rounded-md border border-border bg-surface p-4" key={metric.label}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted">{metric.label}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {numberFormatter.format(metric.value)}
              </p>
            </div>
            <span
              className={cn(
                "grid size-10 place-items-center rounded-md border",
                metric.tone === "warning" && "border-warning/30 bg-warning/10 text-warning",
                metric.tone === "success" && "border-success/30 bg-success/10 text-success",
                metric.tone === "neutral" && "border-border bg-surface-subtle text-muted",
              )}
            >
              {metric.icon}
            </span>
          </div>
          <p className="mt-2 text-sm leading-5 text-muted">{metric.detail}</p>
        </div>
      ))}
    </section>
  );
}

function PriorityQueue({
  landlords,
  leads,
}: {
  landlords: AdminLandlordListItem[];
  leads: AdminLeadListItem[];
}) {
  return (
    <section className="min-w-0 rounded-md border border-border bg-surface p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Priority queue</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Open a record for full context, contact actions, and status updates.
          </p>
        </div>
        <StatusPill className="min-h-8 px-2 text-xs">Live queues</StatusPill>
      </div>

      <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
        <QueueColumn
          emptyText="No renter leads in the current queue."
          href="/admin/leads"
          items={leads.map((lead) => ({
            detail: `${lead.bedrooms_required ?? "-"} bed / ${formatRent(lead.max_rent)}`,
            href: `/admin/leads/${lead.id}`,
            meta: `${leadStatusLabels[lead.lead_status]} / score ${lead.intent_score}`,
            title: lead.full_name || "Unnamed renter",
          }))}
          title="Renter follow-up"
        />
        <QueueColumn
          emptyText="No landlord submissions in the current queue."
          href="/admin/landlords"
          items={landlords.map((landlord) => ({
            detail: landlord.property_address || "No address captured",
            href: `/admin/landlords/${landlord.id}`,
            meta: landlordInterestLabel(landlord),
            title: landlord.full_name || "Unnamed landlord",
          }))}
          title="Landlord follow-up"
        />
      </div>
    </section>
  );
}

function QueueColumn({
  emptyText,
  href,
  items,
  title,
}: {
  emptyText: string;
  href: string;
  items: { detail: string; href: string; meta: string; title: string }[];
  title: string;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Link className="shrink-0 text-xs font-semibold text-primary hover:underline" href={href}>
          View all
        </Link>
      </div>
      <div className="mt-3 divide-y divide-border">
        {items.length > 0 ? (
          items.slice(0, 3).map((item) => (
            <Link
              className="block rounded-md px-2 py-3 transition-colors hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              href={item.href}
              key={item.href}
            >
              <span className="block truncate text-sm font-semibold text-foreground">
                {item.title}
              </span>
              <span className="mt-1 block truncate text-xs leading-5 text-muted">
                {item.detail}
              </span>
              <span className="mt-1 block text-xs font-semibold text-primary">
                {item.meta}
              </span>
            </Link>
          ))
        ) : (
          <p className="py-4 text-sm leading-6 text-muted">{emptyText}</p>
        )}
      </div>
    </div>
  );
}

function WorkflowPanel() {
  const checks = [
    "Open hot renter leads and confirm the next step.",
    "Review new landlord enquiries for listing or Advanced Rent interest.",
    "Update notes after every contact attempt.",
  ];

  return (
    <section className="min-w-0 rounded-md border border-border bg-surface p-4">
      <h2 className="text-base font-semibold text-foreground">Operator workflow</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Keep the dashboard light: scan here, decide in the detail page, then update status.
      </p>
      <ol className="mt-4 space-y-3">
        {checks.map((check, index) => (
          <li
            className="flex gap-3 rounded-md border border-border bg-background p-3 text-sm leading-6"
            key={check}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </span>
            <span className="text-muted">{check}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function WorkspaceCard({
  body,
  count,
  href,
  icon,
  label,
  title,
}: {
  body: string;
  count: string;
  href: string;
  icon: React.ReactNode;
  label: string;
  title: string;
}) {
  return (
    <Card className="shadow-none transition duration-200 hover:border-primary/45 hover:shadow-soft motion-reduce:transition-none">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle as="h2">{title}</CardTitle>
            <CardDescription>{body}</CardDescription>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-md border border-primary/20 bg-accent text-accent-foreground">
            {icon}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <StatusPill className="min-h-8 px-2 text-xs">{count}</StatusPill>
          <Link
            className={buttonClasses({
              className: "gap-2",
              variant: "secondary",
              size: "sm",
            })}
            href={href}
          >
            {label}
            <ArrowRight aria-hidden="true" size={15} weight="bold" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardLoadError({ message }: { message: string }) {
  return (
    <section className="rounded-md border border-danger/30 bg-danger/10 p-5 text-danger">
      <p className="text-sm font-bold uppercase tracking-[0.08em]">
        Dashboard unavailable
      </p>
      <h2 className="mt-3 text-xl font-bold">Could not load admin queue data.</h2>
      <p className="mt-2 text-sm leading-6">{message}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link className={buttonClasses({ size: "sm", variant: "secondary" })} href="/admin/leads">
          Open leads
        </Link>
        <Link
          className={buttonClasses({ size: "sm", variant: "secondary" })}
          href="/admin/landlords"
        >
          Open landlords
        </Link>
      </div>
    </section>
  );
}

function landlordInterestLabel(landlord: AdminLandlordListItem) {
  if (landlord.advanced_rent_interest && landlord.listing_interest) {
    return "Advanced Rent / Listing";
  }
  if (landlord.advanced_rent_interest) {
    return "Advanced Rent";
  }
  if (landlord.listing_interest) {
    return "Listing";
  }
  return landlordStatusLabels[landlord.status];
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

function formatCount(value: number, noun: string) {
  return `${numberFormatter.format(value)} ${value === 1 ? noun : `${noun}s`}`;
}
