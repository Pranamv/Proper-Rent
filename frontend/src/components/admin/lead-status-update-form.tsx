"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import {
  type LeadStatusUpdateActionState,
  updateLeadStatusAction,
} from "@/app/admin/(protected)/leads/actions";
import { buttonClasses } from "@/components/ui/button";
import type { AdminLeadStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

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

const initialState: LeadStatusUpdateActionState = {
  message: null,
  status: "idle",
};

type LeadStatusUpdateFormProps = {
  currentStatus: AdminLeadStatus;
  leadId: string;
  leadName: string;
};

export function LeadStatusUpdateForm({
  currentStatus,
  leadId,
  leadName,
}: LeadStatusUpdateFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateLeadStatusAction,
    initialState,
  );
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [savedStatus, setSavedStatus] = useState(currentStatus);

  useEffect(() => {
    setSelectedStatus(currentStatus);
    setSavedStatus(currentStatus);
  }, [currentStatus]);

  useEffect(() => {
    if (state.status !== "success" || !state.leadStatus) {
      return;
    }

    setSelectedStatus(state.leadStatus);
    setSavedStatus(state.leadStatus);
    router.refresh();
  }, [router, state.leadStatus, state.status, state.updatedAt]);

  const isDirty = selectedStatus !== savedStatus;
  const messageId = `lead-status-message-${leadId}`;

  return (
    <form action={formAction} className="space-y-1.5">
      <input name="lead_id" type="hidden" value={leadId} />
      <label className="sr-only" htmlFor={`lead-status-${leadId}`}>
        Status for {leadName}
      </label>
      <div className="flex items-center gap-1.5">
        <select
          aria-describedby={state.message ? messageId : undefined}
          className={cn(
            "h-8 min-w-32 rounded-full border bg-surface px-2.5 text-xs font-semibold",
            "text-foreground focus-visible:outline-none focus-visible:ring-2",
            "focus-visible:ring-primary focus-visible:ring-offset-2",
            "focus-visible:ring-offset-background disabled:cursor-not-allowed",
            "disabled:opacity-60",
            statusClasses(selectedStatus),
          )}
          disabled={pending}
          id={`lead-status-${leadId}`}
          name="lead_status"
          onChange={(event) =>
            setSelectedStatus(event.currentTarget.value as AdminLeadStatus)
          }
          value={selectedStatus}
        >
          {leadStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          className={buttonClasses({
            className: "h-8 px-2.5 text-xs",
            size: "sm",
            variant: isDirty ? "primary" : "secondary",
          })}
          disabled={pending || !isDirty}
          type="submit"
        >
          {pending ? "Saving" : "Save"}
        </button>
      </div>
      {state.message ? (
        <p
          className={cn(
            "text-[11px] font-medium leading-4",
            state.status === "error" ? "text-danger" : "text-success",
          )}
          id={messageId}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
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
