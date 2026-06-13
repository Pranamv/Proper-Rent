import type { Metadata } from "next";
import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { adminApi, ApiError } from "@/lib/api";
import type {
  AdminLandlordListItem,
  AdminLandlordListResponse,
  AdminLandlordStatus,
} from "@/lib/api";
import { getAdminAuthState } from "@/lib/admin/auth";
import { pageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

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

const PAGE_LIMIT = 20;

const landlordStatusOptions: { label: string; value: AdminLandlordStatus }[] = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Listed", value: "listed" },
  { label: "Inactive", value: "inactive" },
];

const landlordStatuses = landlordStatusOptions.map((option) => option.value);

const numberFormatter = new Intl.NumberFormat("en-GB");
const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/London",
});

type AdminLandlordsSearchParams = {
  page?: string | string[];
  status?: string | string[];
};

type AdminLandlordsPageProps = {
  searchParams?: Promise<AdminLandlordsSearchParams>;
};

export default async function AdminLandlordsPage({
  searchParams,
}: AdminLandlordsPageProps) {
  const authState = await getAdminAuthState();
  if (authState.status !== "authenticated") {
    return null;
  }

  const params = (await searchParams) ?? {};
  const selectedStatus = parseLandlordStatus(params.status);
  const currentPage = parsePositiveInteger(firstParam(params.page), 1);

  let landlordResponse: AdminLandlordListResponse;
  try {
    landlordResponse = await adminApi.listLandlords(authState.accessToken, {
      limit: PAGE_LIMIT,
      page: currentPage,
      status: selectedStatus,
    });
  } catch (error) {
    return <LandlordLoadError error={error} />;
  }

  const totalPages = Math.max(1, Math.ceil(landlordResponse.total / landlordResponse.limit));

  return (
    <div className="space-y-6">
      <header className="rounded-md border border-border bg-surface p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
              Landlords
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
              Landlord pipeline
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Review new landlord submissions, identify listing or Advanced Rent
              opportunities, and keep each lead moving through the operational status.
            </p>
          </div>
          <StatusPill tone={landlordResponse.total > 0 ? "success" : "neutral"}>
            {numberFormatter.format(landlordResponse.total)} visible
          </StatusPill>
        </div>
      </header>

      <LandlordStatStrip landlords={landlordResponse.results} totalVisible={landlordResponse.total} />

      <section className="rounded-md border border-border bg-surface">
        <div className="border-b border-border p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-foreground">Landlord list</h2>
              <p className="mt-1 text-sm text-muted">
                Sorted by newest landlord submission first.
              </p>
            </div>
            <LandlordStatusFilters selectedStatus={selectedStatus} />
          </div>
        </div>

        {landlordResponse.results.length > 0 ? (
          <LandlordTable landlords={landlordResponse.results} />
        ) : (
          <LandlordEmptyState selectedStatus={selectedStatus} />
        )}

        <LandlordPagination
          currentPage={landlordResponse.page}
          limit={landlordResponse.limit}
          selectedStatus={selectedStatus}
          total={landlordResponse.total}
          totalPages={totalPages}
        />
      </section>
    </div>
  );
}

function LandlordStatStrip({
  landlords,
  totalVisible,
}: {
  landlords: AdminLandlordListItem[];
  totalVisible: number;
}) {
  const advancedRentCount = landlords.filter(
    (landlord) => landlord.advanced_rent_interest,
  ).length;
  const listingInterestCount = landlords.filter(
    (landlord) => landlord.listing_interest,
  ).length;
  const newCount = landlords.filter((landlord) => landlord.status === "new").length;

  const stats = [
    {
      label: "Visible rows",
      value: totalVisible,
      detail: "Current filter result",
      tone: "neutral" as const,
    },
    {
      label: "New on page",
      value: newCount,
      detail: "Awaiting first contact",
      tone: newCount > 0 ? ("warning" as const) : ("neutral" as const),
    },
    {
      label: "Advanced Rent",
      value: advancedRentCount,
      detail: "Interest on this page",
      tone: advancedRentCount > 0 ? ("success" as const) : ("neutral" as const),
    },
    {
      label: "Listing interest",
      value: listingInterestCount,
      detail: "Interest on this page",
      tone: listingInterestCount > 0 ? ("success" as const) : ("neutral" as const),
    },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4" aria-label="Landlord stats">
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

function LandlordStatusFilters({
  selectedStatus,
}: {
  selectedStatus?: AdminLandlordStatus;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="list" aria-label="Landlord status filters">
      <Link
        aria-current={selectedStatus ? undefined : "page"}
        className={buttonClasses({
          className: "h-9 px-3",
          size: "sm",
          variant: selectedStatus ? "secondary" : "primary",
        })}
        href="/admin/landlords"
        role="listitem"
      >
        All
      </Link>
      {landlordStatusOptions.map((statusOption) => (
        <Link
          aria-current={selectedStatus === statusOption.value ? "page" : undefined}
          className={buttonClasses({
            className: "h-9 px-3",
            size: "sm",
            variant: selectedStatus === statusOption.value ? "primary" : "secondary",
          })}
          href={buildLandlordsHref({ status: statusOption.value })}
          key={statusOption.value}
          role="listitem"
        >
          {statusOption.label}
        </Link>
      ))}
    </div>
  );
}

function LandlordTable({ landlords }: { landlords: AdminLandlordListItem[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1000px] text-left text-sm">
        <thead className="border-b border-border bg-surface-subtle text-xs uppercase tracking-[0.08em] text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold" scope="col">
              Landlord
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Property
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Interest
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Status
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Availability
            </th>
            <th className="px-4 py-3 font-semibold" scope="col">
              Created
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {landlords.map((landlord) => (
            <tr className="align-top hover:bg-surface-subtle/70" key={landlord.id}>
              <td className="px-4 py-4">
                <Link
                  className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  href={`/admin/landlords/${landlord.id}`}
                >
                  {landlord.full_name || "Unnamed landlord"}
                </Link>
                <p className="mt-1 text-muted">{landlord.email || "No email"}</p>
                <p className="mt-1 text-muted">{landlord.phone || "No phone"}</p>
              </td>
              <td className="px-4 py-4">
                <p className="max-w-72 font-medium text-foreground">
                  {landlord.property_address || "No address captured"}
                </p>
                <p className="mt-1 text-muted">
                  {formatBedrooms(landlord.bedrooms)} / {formatRent(landlord.asking_rent)}
                </p>
              </td>
              <td className="px-4 py-4">
                <InterestFlags landlord={landlord} />
              </td>
              <td className="px-4 py-4">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 font-semibold",
                    statusClasses(landlord.status),
                  )}
                >
                  {statusLabel(landlord.status)}
                </span>
              </td>
              <td className="px-4 py-4 text-muted">
                {formatDateOnly(landlord.available_from)}
              </td>
              <td className="px-4 py-4 text-muted">
                <time dateTime={landlord.created_at}>
                  {formatDateTime(landlord.created_at)}
                </time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InterestFlags({ landlord }: { landlord: AdminLandlordListItem }) {
  const flags = [
    landlord.advanced_rent_interest ? "Advanced Rent" : null,
    landlord.listing_interest ? "Listing" : null,
  ].filter(Boolean);

  if (flags.length === 0) {
    return <span className="text-muted">No product interest</span>;
  }

  return (
    <div className="flex max-w-48 flex-wrap gap-2">
      {flags.map((flag) => (
        <span
          className="rounded-full border border-primary/30 bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground"
          key={flag}
        >
          {flag}
        </span>
      ))}
    </div>
  );
}

function LandlordEmptyState({
  selectedStatus,
}: {
  selectedStatus?: AdminLandlordStatus;
}) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-lg font-semibold text-foreground">No landlord leads found.</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {selectedStatus
          ? `There are no landlords in ${statusLabel(selectedStatus)}. Clear the filter to review the full pipeline.`
          : "New landlord registrations will appear here after successful landlord form submissions."}
      </p>
      {selectedStatus ? (
        <Link
          className={buttonClasses({ className: "mt-5", size: "sm", variant: "secondary" })}
          href="/admin/landlords"
        >
          Clear filter
        </Link>
      ) : null}
    </div>
  );
}

function LandlordPagination({
  currentPage,
  limit,
  selectedStatus,
  total,
  totalPages,
}: {
  currentPage: number;
  limit: number;
  selectedStatus?: AdminLandlordStatus;
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
            href={buildLandlordsHref({
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
            href={buildLandlordsHref({
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

function LandlordLoadError({ error }: { error: unknown }) {
  const apiStatus = error instanceof ApiError ? ` API returned ${error.status}.` : "";

  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 p-5 text-danger">
      <p className="text-sm font-bold uppercase tracking-[0.08em]">
        Landlords unavailable
      </p>
      <h1 className="mt-3 text-2xl font-bold">Could not load landlord leads.</h1>
      <p className="mt-2 text-sm leading-6">
        Confirm the backend is running and that the admin landlords API is reachable.
        {apiStatus}
      </p>
    </div>
  );
}

function buildLandlordsHref({
  page,
  status,
}: {
  page?: number;
  status?: AdminLandlordStatus;
}) {
  const query = new URLSearchParams();
  if (status) {
    query.set("status", status);
  }
  if (page && page > 1) {
    query.set("page", String(page));
  }

  const queryString = query.toString();
  return queryString ? `/admin/landlords?${queryString}` : "/admin/landlords";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseLandlordStatus(value: string | string[] | undefined) {
  const status = firstParam(value);
  return landlordStatuses.includes(status as AdminLandlordStatus)
    ? (status as AdminLandlordStatus)
    : undefined;
}

function parsePositiveInteger(value: string | undefined, fallback: number) {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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

function formatBedrooms(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "Bedrooms not set";
  }
  return `${numberFormatter.format(value)} bed`;
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
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
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
