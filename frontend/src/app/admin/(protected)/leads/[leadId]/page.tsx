import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminMetaItem } from "@/components/admin/admin-meta-item";
import { AdminQuickActions } from "@/components/admin/admin-quick-actions";
import { AdminSaveNotice } from "@/components/admin/admin-save-notice";
import { LeadUpdateForm } from "@/components/admin/lead-update-form";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { adminApi, ApiError } from "@/lib/api";
import type { AdminConversation, AdminLeadDetail, AdminLeadStatus } from "@/lib/api";
import { getAdminSessionState } from "@/lib/admin/auth";
import { pageMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Lead Detail",
    description: "Protected renter lead detail view.",
    path: "/admin/leads",
  }),
  robots: {
    index: false,
    follow: false,
  },
};

const leadStatusOptions: { label: string; value: AdminLeadStatus }[] = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Viewing arranged", value: "viewing_arranged" },
  { label: "Offer made", value: "offer_made" },
  { label: "Let agreed", value: "let_agreed" },
  { label: "Completed", value: "completed" },
  { label: "Lost", value: "lost" },
];

const numberFormatter = new Intl.NumberFormat("en-GB");
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/London",
});

type LeadDetailPageProps = {
  params: Promise<{ leadId: string }>;
  searchParams?: Promise<{ updated?: string | string[] }>;
};

type TranscriptMessage = {
  content: string;
  role: string;
  timestamp?: string;
  unsupported: boolean;
};

export default async function LeadDetailPage({
  params,
  searchParams,
}: LeadDetailPageProps) {
  const authState = await getAdminSessionState();
  if (authState.status !== "authenticated") {
    return null;
  }

  const { leadId } = await params;
  const query = (await searchParams) ?? {};
  const wasUpdated = firstParam(query.updated) === "1";

  let lead: AdminLeadDetail;
  let conversations: AdminConversation[];
  try {
    [lead, conversations] = await Promise.all([
      adminApi.getLead(authState.accessToken, leadId),
      adminApi.listLeadConversations(authState.accessToken, leadId),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return <LeadDetailLoadError error={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link className={buttonClasses({ size: "sm", variant: "secondary" })} href="/admin/leads">
          Back to leads
        </Link>
        {wasUpdated ? <AdminSaveNotice message="Lead updates saved." /> : null}
      </div>

      <LeadHeader lead={lead} />

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <LeadOverview lead={lead} />
          <ConversationPanel conversations={conversations} />
        </div>

        <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
          <Card>
            <CardHeader>
              <CardTitle>Notes and status</CardTitle>
              <CardDescription>
                Record the latest action and keep the pipeline status current.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadUpdateForm lead={lead} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin metadata</CardTitle>
              <CardDescription>Reference fields for audit and support.</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <AdminMetaItem
                  actions={<AdminQuickActions copyLabel="Copy id" copyValue={lead.id} />}
                  label="Lead id"
                  value={lead.id}
                  valueKind="identifier"
                />
                <AdminMetaItem
                  actions={
                    lead.session_id ? (
                      <AdminQuickActions copyLabel="Copy session" copyValue={lead.session_id} />
                    ) : null
                  }
                  label="Session id"
                  value={lead.session_id ?? "Not linked"}
                  valueKind={lead.session_id ? "identifier" : "default"}
                />
                <AdminMetaItem
                  actions={
                    lead.assigned_agent_id ? (
                      <AdminQuickActions
                        copyLabel="Copy agent"
                        copyValue={lead.assigned_agent_id}
                      />
                    ) : null
                  }
                  label="Assigned agent"
                  value={lead.assigned_agent_id ?? "Unassigned"}
                  valueKind={lead.assigned_agent_id ? "identifier" : "default"}
                />
                <AdminMetaItem
                  label="Scraye intro"
                  value={lead.scraye_introduction_id ?? "Not recorded"}
                  valueKind={lead.scraye_introduction_id ? "identifier" : "default"}
                />
                <AdminMetaItem label="Consent version" value={lead.consent_version} />
                <AdminMetaItem label="Consent at" value={formatDateTime(lead.consent_at)} />
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function LeadHeader({ lead }: { lead: AdminLeadDetail }) {
  return (
    <header className="rounded-md border border-border bg-surface p-5 shadow-soft">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.08em] text-primary">
            Lead detail
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {lead.full_name || "Unnamed renter"}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Contact details, requirements, readiness, chat context, and follow-up
            notes in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-semibold",
              statusClasses(lead.lead_status),
            )}
          >
            {statusLabel(lead.lead_status)}
          </span>
          <span
            className={cn(
              "inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-bold",
              scoreClasses(lead.intent_score),
            )}
          >
            Score {lead.intent_score} / {priorityLabel(lead.intent_score)}
          </span>
        </div>
      </div>
    </header>
  );
}

function LeadOverview({ lead }: { lead: AdminLeadDetail }) {
  return (
    <div className="grid gap-4 2xl:grid-cols-2">
      <InfoCard title="Contact">
        <dl className="space-y-3 text-sm">
          <AdminMetaItem
            actions={
              lead.email ? (
                <AdminQuickActions copyValue={lead.email} email={lead.email} />
              ) : null
            }
            label="Email"
            value={lead.email ?? "No email"}
            valueKind={lead.email ? "contact" : "default"}
          />
          <AdminMetaItem
            actions={
              lead.phone ? (
                <AdminQuickActions copyValue={lead.phone} phone={lead.phone} />
              ) : null
            }
            label="Phone"
            value={lead.phone ?? "No phone"}
            valueKind={lead.phone ? "contact" : "default"}
          />
          <AdminMetaItem label="Source" value={formatLabel(lead.source_channel)} />
          <AdminMetaItem label="Created" value={formatDateTime(lead.created_at)} />
        </dl>
      </InfoCard>

      <InfoCard title="Requirements">
        <dl className="space-y-3 text-sm">
          <AdminMetaItem label="Bedrooms" value={formatValue(lead.bedrooms_required)} />
          <AdminMetaItem label="Areas" value={formatAreas(lead.areas_preferred)} />
          <AdminMetaItem label="Max rent" value={formatRent(lead.max_rent)} />
          <AdminMetaItem label="Move from" value={lead.move_in_from ?? "Not set"} />
          <AdminMetaItem label="Move by" value={lead.move_in_by ?? "Not set"} />
          <AdminMetaItem
            label="Furnished"
            value={formatLabel(lead.furnished_preference)}
          />
          <AdminMetaItem label="Pets" value={lead.pets ?? "Not set"} />
          <AdminMetaItem
            label="Accessibility"
            value={lead.accessibility_needs ?? "Not set"}
          />
        </dl>
      </InfoCard>

      <InfoCard title="Readiness">
        <dl className="space-y-3 text-sm">
          <AdminMetaItem label="Employment" value={formatLabel(lead.employment_status)} />
          <AdminMetaItem label="Income band" value={formatLabel(lead.annual_income_range)} />
          <AdminMetaItem label="Guarantor" value={formatLabel(lead.has_guarantor)} />
          <AdminMetaItem label="Deposit" value={formatLabel(lead.deposit_availability)} />
          <AdminMetaItem label="Housing" value={formatLabel(lead.current_housing)} />
          <AdminMetaItem
            label="Rented before"
            value={
              lead.has_rented_before == null
                ? "Not set"
                : lead.has_rented_before
                  ? "Yes"
                  : "No"
            }
          />
        </dl>
      </InfoCard>

      <InfoCard title="Fintech flags">
        <FintechFlags flags={lead.fintech_flags} />
      </InfoCard>
    </div>
  );
}

function ConversationPanel({ conversations }: { conversations: AdminConversation[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Linked website chat sessions, newest context first.
            </CardDescription>
          </div>
          <StatusPill>{numberFormatter.format(conversations.length)} sessions</StatusPill>
        </div>
      </CardHeader>
      <CardContent>
        {conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <ConversationCard conversation={conversation} key={conversation.id} />
            ))}
          </div>
        ) : (
          <div className="rounded-md border border-border bg-background p-4 text-sm leading-6 text-muted">
            No linked chat conversation. This lead may have come directly from the
            intake form or from a session that was not linked.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConversationCard({ conversation }: { conversation: AdminConversation }) {
  const transcript = conversation.transcript.map(normaliseTranscriptMessage);
  const previewMessages = transcript.slice(-2);
  const hasMoreMessages = transcript.length > previewMessages.length;

  return (
    <article className="rounded-md border border-border bg-background p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-foreground">
            {formatLabel(conversation.channel)} session
          </h3>
          <p className="mt-1 text-sm text-muted">
            Started {formatDateTime(conversation.started_at)}
          </p>
        </div>
        <StatusPill className="min-h-8 px-2 text-xs">
          Score {conversation.intent_score_output ?? "n/a"}
        </StatusPill>
      </div>

      {conversation.ai_summary ? (
        <div className="mt-4 rounded-md border border-primary/20 bg-accent/60 p-3 text-sm leading-6 text-accent-foreground">
          <p className="font-semibold">AI summary</p>
          <p className="mt-1">{conversation.ai_summary}</p>
        </div>
      ) : (
        <div className="mt-4 rounded-md border border-border bg-surface p-3 text-sm leading-6 text-muted">
          No AI summary recorded for this session.
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted">
          Latest messages
        </p>
        {previewMessages.length > 0 ? (
          <TranscriptList messages={previewMessages} />
        ) : (
          <div className="mt-2 rounded-md border border-border bg-surface p-3 text-sm text-muted">
            Transcript is empty.
          </div>
        )}
      </div>

      {hasMoreMessages ? (
        <details className="mt-4 rounded-md border border-border bg-surface">
          <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-foreground marker:text-muted">
            Show full transcript ({numberFormatter.format(transcript.length)} messages)
          </summary>
          <div className="border-t border-border p-3">
            <TranscriptList messages={transcript} />
          </div>
        </details>
      ) : null}
    </article>
  );
}

function TranscriptList({ messages }: { messages: TranscriptMessage[] }) {
  return (
    <ol className="mt-2 space-y-2">
      {messages.map((message, index) => (
        <li
          className={cn(
            "rounded-md border p-3 text-sm leading-6",
            transcriptRoleClasses(message.role),
            message.unsupported && "border-warning/30 bg-warning/10 text-warning",
          )}
          key={`${message.role}-${index}-${message.timestamp ?? "no-time"}`}
        >
          <p className="font-semibold">
            {formatTranscriptRole(message.role)}{" "}
            <span className="font-normal opacity-75">
              {formatTranscriptTime(message.timestamp)}
            </span>
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words">{message.content}</p>
        </li>
      ))}
    </ol>
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

function FintechFlags({ flags }: { flags: Record<string, unknown> }) {
  const activeFlags = Object.entries(flags).filter(([, value]) => value === true);

  if (activeFlags.length === 0) {
    return <p className="text-sm text-muted">No fintech products flagged.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
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

function LeadDetailLoadError({ error }: { error: unknown }) {
  return (
    <div className="rounded-md border border-danger/30 bg-danger/10 p-5 text-danger">
      <p className="text-sm font-bold uppercase tracking-[0.08em]">
        Lead detail unavailable
      </p>
      <h1 className="mt-3 text-2xl font-bold">Could not load this lead.</h1>
      <p className="mt-2 text-sm leading-6">
        {adminLoadErrorMessage(error, "lead detail")}
      </p>
    </div>
  );
}

function adminLoadErrorMessage(error: unknown, resource: string) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return "Your admin session expired. Sign in again to continue.";
    }
    if (error.status === 403) {
      return `This signed-in account is not authorised for this admin ${resource}.`;
    }
  }

  return "Confirm the backend is running and that the admin leads API is reachable.";
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
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

function formatValue(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }
  return String(value);
}

function formatTranscriptRole(value: unknown) {
  return typeof value === "string" ? formatLabel(value) : "Message";
}

function formatTranscriptTime(value: string | undefined) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? `- ${value}` : `- ${formatDateTime(value)}`;
}

function normaliseTranscriptMessage(message: Record<string, unknown>): TranscriptMessage {
  const role = typeof message.role === "string" ? message.role : "message";
  const timestamp =
    typeof message.ts === "string"
      ? message.ts
      : typeof message.timestamp === "string"
        ? message.timestamp
        : undefined;

  if (typeof message.content === "string") {
    return {
      content: message.content,
      role,
      timestamp,
      unsupported: false,
    };
  }
  if (typeof message.text === "string") {
    return {
      content: message.text,
      role,
      timestamp,
      unsupported: false,
    };
  }

  return {
    content: "Unsupported message format",
    role,
    timestamp,
    unsupported: true,
  };
}

function transcriptRoleClasses(role: string) {
  const normalisedRole = role.toLowerCase();
  if (normalisedRole.includes("user") || normalisedRole.includes("renter")) {
    return "border-primary/20 bg-accent text-accent-foreground";
  }
  if (normalisedRole.includes("assistant") || normalisedRole.includes("agent")) {
    return "border-border bg-surface text-foreground";
  }
  if (normalisedRole.includes("system")) {
    return "border-warning/20 bg-warning/10 text-warning";
  }
  return "border-border bg-surface text-muted";
}
