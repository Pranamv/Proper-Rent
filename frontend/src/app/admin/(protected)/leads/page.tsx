import type { Metadata } from "next";
import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { adminApi, ApiError } from "@/lib/api";
import type {
  AdminLeadListItem,
  AdminLeadListResponse,
  AdminLeadStatus,
  AdminLeadSummary,
} from "@/lib/api";
import { getAdminAuthState } from "@/lib/admin/auth";
import { pageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

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

const PAGE_LIMIT = 20;

const leadStatusOptions: { label: string; value: AdminLeadStatus }[] = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Viewing", value: "viewing_arranged" },
  { label: "Offer", value: "offer_made" },
  { label: "Let agreed", value: "let_agreed" },
  { label: "Completed", value: "completed" },
  { label: "Lost", value: "lost" },
];

const leadStatuses = leadStatusOptions.map((option) => option.value);

const numberFormatter = new Intl.NumberFormat("en-GB");
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/London",
});

type AdminLeadsSearchParams = {
  assigned_agent_id?: string | string[];
  page?: string | string[];
  status?: string | string[];
};

type AdminLeadsPageProps = {
  searchParams?: Promise<AdminLeadsSearchParams>;
};

export default async function AdminLeadsPage({ searchParams }: AdminLeadsPageProps) {
  const authState = await getAdminAuthState();
  if (authState.status !== "authenticated") {
    return null;
  }

  const params = (await searchParams) ?? {};
  const selectedStatus = parseLeadStatus(params.status);
  const assignedAgentId = firstParam(params.assigned_agent_id);
  const currentPage = parsePositiveInteger(firstParam(params.page), 1);

  let leadResponse: AdminLeadListResponse;
  try {
    leadResponse = await adminApi.listLeads(authState.accessToken, {
      assignedAgentId,
      limit: PAGE_LIMIT,
      page: currentPage,
      status: selectedStatus,
    });
  } catch (error) {
    return <LeadLoadError error={error} />;
  }

  const totalPages = Math.max(1, Math.ceil(leadResponse.total / leadResponse.limit));

  return (
    <div className="space-y-6">
      <header className="rounded-md border border-border bg-surface p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
              Leads
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              Renter pipeline
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Prioritise new renter enquiries by urgency, status, and required
              follow-up. Open a lead to review conversation context and update
              notes, assignment, or status.
            </p>
          </div>
          <StatusPill tone={leadResponse.total > 0 ? "success" : "neutral"}>
            {numberFormatter.format(leadResponse.total)} visible
          </StatusPill>
        </div>
      </header>

      <LeadStatStrip summary={leadResponse.summary} totalVisible={leadResponse.total} />
      <LeadStageStrip
        assignedAgentId={assignedAgentId}
        summary={leadResponse.summary}
        selectedStatus={selectedStatus}
      />

      <section className="rounded-md border border-border bg-surface">
        <div className="border-b border-border p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Lead list</h2>
              <p className="mt-1 text-sm text-muted">
                Sorted by intent score first, then newest lead date.
              </p>
            </div>
            <LeadStatusFilters
              assignedAgentId={assignedAgentId}
              selectedStatus={selectedStatus}
              summary={leadResponse.summary}
            />
          </div>
        </div>

        {leadResponse.results.length > 0 ? (
          <LeadTable leads={leadResponse.results} />
        ) : (
          <LeadEmptyState selectedStatus={selectedStatus} />
        )}

        <LeadPagination
          assignedAgentId={assignedAgentId}
          currentPage={leadResponse.page}
          limit={leadResponse.limit}
          selectedStatus={selectedStatus}
          total={leadResponse.total}
          totalPages={totalPages}
        />
      </section>
    </div>
  );
}

function LeadStatStrip({
  summary,
  totalVisible,
}: {
  summary: AdminLeadSummary;
  totalVisible: number;
}) {
  const pipelineTotal = Object.values(summary.pipeline_by_stage).reduce(
    (total, count) => total + count,
    0,
  );
  const stats = [
    {
      label: "New today",
      value: summary.new_leads_today,
      detail: "Fresh website registrations",
      tone: "success" as const,
    },
    {
      label: "Hot pending",
      value: summary.hot_leads_pending,
      detail: "Score 70+ still in new",
      tone: summary.hot_leads_pending > 0 ? ("warning" as const) : ("neutral" as const),
    },
    {
      label: "Pipeline total",
      value: pipelineTotal,
      detail: "All renter leads",
      tone: "neutral" as const,
    },
    {
      label: "Visible rows",
      value: totalVisible,
      detail: "Current filter result",
      tone: "neutral" as const,
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Lead stats">
      {stats.map((stat) => (
        <div className="rounded-md border border-border bg-surface p-4" key={stat.label}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {numberFormatter.format(stat.value)}
              </p>
            </div>
            <StatusPill className="min-h-8 px-2 text-xs" tone={stat.tone}>
              Live
            </StatusPill>
          </div>
          <p className="mt-2 text-sm leading-5 text-muted">{stat.detail}</p>
        </div>
      ))}
    </section>
  );
}

function LeadStageStrip({
  assignedAgentId,
  selectedStatus,
  summary,
}: {
  assignedAgentId?: string;
  selectedStatus?: AdminLeadStatus;
  summary: AdminLeadSummary;
}) {
  return (
    <section
      className="grid gap-2 rounded-md border border-border bg-surface p-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8"
      aria-label="Pipeline by stage"
    >
      {leadStatusOptions.map((statusOption) => (
        <Link
          aria-current={selectedStatus === statusOption.value ? "page" : undefined}
          className={cn(
            "rounded-md border border-border bg-background p-3 text-sm",
            "hover:border-primary hover:bg-accent/60 focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-primary",
            selectedStatus === statusOption.value && "border-primary bg-accent",
          )}
          href={buildLeadsHref({ assignedAgentId, status: statusOption.value })}
          key={statusOption.value}
        >
          <span className="block font-semibold text-foreground">{statusOption.label}</span>
          <span className="mt-1 block text-2xl font-bold text-primary">
            {numberFormatter.format(summary.pipeline_by_stage[statusOption.value])}
          </span>
        </Link>
      ))}
    </section>
  );
}

function LeadStatusFilters({
  assignedAgentId,
  selectedStatus,
  summary,
}: {
  assignedAgentId?: string;
  selectedStatus?: AdminLeadStatus;
  summary: AdminLeadSummary;
}) {
  const allCount = Object.values(summary.pipeline_by_stage).reduce(
    (total, count) => total + count,
    0,
  );

  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Lead status filters">
      <Link
        aria-current={selectedStatus ? undefined : "page"}
        className={buttonClasses({
          className: "h-9 gap-2 px-3",
          size: "sm",
          variant: selectedStatus ? "secondary" : "primary",
        })}
        href={buildLeadsHref({ assignedAgentId })}
        role="listitem"
      >
        All
        <span className="text-xs opacity-80">{numberFormatter.format(allCount)}</span>
      </Link>
      {leadStatusOptions.map((statusOption) => (
        <Link
          aria-current={selectedStatus === statusOption.value ? "page" : undefined}
          className={buttonClasses({
            className: "h-9 gap-2 px-3",
            size: "sm",
            variant: selectedStatus === statusOption.value ? "primary" : "secondary",
          })}
          href={buildLeadsHref({
            assignedAgentId,
            status: statusOption.value,
          })}
          key={statusOption.value}
          role="listitem"
        >
          {statusOption.label}
          <span className="text-xs opacity-80">
            {numberFormatter.format(summary.pipeline_by_stage[statusOption.value])}
          </span>
        </Link>
      ))}
    </div>
  );
}

function LeadTable({ leads }: { leads: AdminLeadListItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1100px] text-left text-sm">
        <thead className="border-b border-border bg-surface-subtle text-xs uppercase tracking-[0.08em] text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold" scope="col">
              Lead
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Score
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Status
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Requirements
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Readiness
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Fintech
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map((lead) => (
            <tr className="align-top hover:bg-surface-subtle/70" key={lead.id}>
              <td className="px-4 py-4">
                <Link
                  className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  href={`/admin/leads/${lead.id}`}
                >
                  {lead.full_name || "Unnamed renter"}
                </Link>
                <p className="mt-1 text-muted">{lead.email || "No email"}</p>
                <p className="mt-1 text-muted">{lead.phone || "No phone"}</p>
                <p className="mt-2 text-xs text-muted">
                  Source: {formatLabel(lead.source_channel)}
                </p>
              </td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    "inline-flex min-h-9 min-w-12 items-center justify-center rounded-full border px-3 font-bold",
                    scoreClasses(lead.intent_score),
                  )}
                >
                  {lead.intent_score}
                </span>
                <p className="mt-2 text-xs font-semibold text-muted">
                  {priorityLabel(lead.intent_score)}
                </p>
              </td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 font-semibold",
                    statusClasses(lead.lead_status),
                  )}
                >
                  {statusLabel(lead.lead_status)}
                </span>
                {lead.assigned_agent_id ? (
                  <p className="mt-2 max-w-40 truncate text-xs text-muted">
                    Agent {lead.assigned_agent_id}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-warning">Unassigned</p>
                )}
              </td>
              <td className="px-4 py-4">
                <p className="font-medium text-foreground">
                  {lead.bedrooms_required ?? "-"} bed / {formatRent(lead.max_rent)}
                </p>
                <p className="mt-1 max-w-56 text-muted">
                  {formatAreas(lead.areas_preferred)}
                </p>
                <p className="mt-1 text-muted">Move by {formatDateOnly(lead.move_in_by)}</p>
              </td>
              <td className="px-4 py-4">
                <p className="font-medium text-foreground">
                  {formatLabel(lead.employment_status)}
                </p>
                <p className="mt-1 text-muted">Guarantor: {formatLabel(lead.has_guarantor)}</p>
                <p className="mt-1 text-muted">
                  Deposit: {formatLabel(lead.deposit_availability)}
                </p>
              </td>
              <td className="px-4 py-4">
                <FintechFlags flags={lead.fintech_flags} />
              </td>
              <td className="px-4 py-4 text-muted">
                <time dateTime={lead.created_at}>{formatDateTime(lead.created_at)}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FintechFlags({ flags }: { flags: Record<string, unknown> }) {
  const activeFlags = Object.entries(flags).filter(([, value]) => value === true);

  if (activeFlags.length === 0) {
    return <span className="text-muted">None flagged</span>;
  }

  return (
    <div className="flex max-w-48 flex-wrap gap-2">
      {activeFlags.map(([key]) => (
        <span
          className="rounded-full border border-primary/30 bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground"
          key={key}
        >
          {formatLabel(key)}
        </span>
      ))}
    </div>
  );
}

function LeadEmptyState({ selectedStatus }: { selectedStatus?: AdminLeadStatus }) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-lg font-semibold text-foreground">No renter leads found.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {selectedStatus
          ? `There are no leads in ${statusLabel(selectedStatus)}. Clear the filter to review the full pipeline.`
          : "New renter registrations will appear here after successful intake form submissions."}
      </p>
      {selectedStatus ? (
        <Link
          className={buttonClasses({ className: "mt-5", size: "sm", variant: "secondary" })}
          href="/admin/leads"
        >
          Clear filter
        </Link>
      ) : null}
    </div>
  );
}

function LeadPagination({
  assignedAgentId,
  currentPage,
  limit,
  selectedStatus,
  total,
  totalPages,
}: {
  assignedAgentId?: string;
  currentPage: number;
  limit: number;
  selectedStatus?: AdminLeadStatus;
  total: number;
  totalPages: number;
}) {
  const start = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(total, currentPage * limit);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
      <p>
        Showing {numberFormatter.format(start)}-{numberFormatter.format(end)} of{" "}
        {numberFormatter.format(total)}
      </p>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            className={buttonClasses({ size: "sm", variant: "secondary" })}
            href={buildLeadsHref({
              assignedAgentId,
              page: currentPage - 1,
              status: selectedStatus,
            })}
          >
            Previous
          </Link>
        ) : (
          <span
            className={buttonClasses({
              className: "opacity-50",
              size: "sm",
              variant: "secondary",
            })}
          >
            Previous
          </span>
        )}
        <span className="px-2 font-semibold text-foreground">
          Page {numberFormatter.format(currentPage)} of {numberFormatter.format(totalPages)}
        </span>
        {currentPage < totalPages ? (
          <Link
            className={buttonClasses({ size: "sm", variant: "secondary" })}
            href={buildLeadsHref({
              assignedAgentId,
              page: currentPage + 1,
              status: selectedStatus,
            })}
          >
            Next
          </Link>
        ) : (
          <span
            className={buttonClasses({
              className: "opacity-50",
              size: "sm",
              variant: "secondary",
            })}
          >
            Next
          </span>
        )}
      </div>
    </div>
  );
}

function LeadLoadError({ error }: { error: unknown }) {
  const detail =
    error instanceof ApiError && error.status === 422
      ? "One of the lead filters could not be accepted by the API."
      : "The admin leads API could not be reached. Confirm the backend is running and try again.";

  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 p-5 text-danger">
      <p className="text-sm font-bold uppercase tracking-[0.08em]">Lead list unavailable</p>
      <h1 className="mt-3 text-2xl font-bold">Could not load renter leads.</h1>
      <p className="mt-2 text-sm leading-6">{detail}</p>
    </div>
  );
}

function buildLeadsHref({
  assignedAgentId,
  page,
  status,
}: {
  assignedAgentId?: string;
  page?: number;
  status?: AdminLeadStatus;
}) {
  const params = new URLSearchParams();
  if (status) {
    params.set("status", status);
  }
  if (assignedAgentId) {
    params.set("assigned_agent_id", assignedAgentId);
  }
  if (page && page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `/admin/leads?${query}` : "/admin/leads";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseLeadStatus(value: string | string[] | undefined) {
  const statusParam = firstParam(value);
  return leadStatuses.includes(statusParam as AdminLeadStatus)
    ? (statusParam as AdminLeadStatus)
    : undefined;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function statusLabel(status: AdminLeadStatus) {
  return leadStatusOptions.find((option) => option.value === status)?.label ?? status;
}

function statusClasses(status: AdminLeadStatus) {
  if (status === "new") {
    return "border-warning/30 bg-warning/10 text-warning";
  }
  if (status === "lost") {
    return "border-danger/30 bg-danger/10 text-danger";
  }
  if (status === "completed") {
    return "border-success/30 bg-success/10 text-success";
  }
  return "border-border bg-surface-subtle text-muted";
}

function scoreClasses(score: number) {
  if (score >= 70) {
    return "border-warning/30 bg-warning/10 text-warning";
  }
  if (score >= 45) {
    return "border-primary/30 bg-accent text-accent-foreground";
  }
  return "border-border bg-surface-subtle text-muted";
}

function priorityLabel(score: number) {
  if (score >= 70) {
    return "Hot";
  }
  if (score >= 45) {
    return "Warm";
  }
  if (score >= 25) {
    return "Standard";
  }
  return "Low";
}

function formatAreas(areas: string[] | null | undefined) {
  return areas && areas.length > 0 ? areas.join(", ") : "No areas captured";
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) {
    return "not set";
  }
  return value;
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set";
  }
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRent(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Budget not set";
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue)
    ? `GBP ${numberFormatter.format(numericValue)}`
    : String(value);
}
