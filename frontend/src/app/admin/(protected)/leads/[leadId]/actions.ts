"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { adminApi, ApiError } from "@/lib/api";
import type { AdminLeadStatus, AdminLeadUpdateRequest } from "@/lib/api";
import { getAdminAuthState } from "@/lib/admin/auth";

export type LeadUpdateActionState = {
  message: string | null;
  status: "idle" | "error";
};

const leadStatuses: AdminLeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "viewing_arranged",
  "offer_made",
  "let_agreed",
  "completed",
  "lost",
];

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateLeadAction(
  _previousState: LeadUpdateActionState,
  formData: FormData,
): Promise<LeadUpdateActionState> {
  const authState = await getAdminAuthState();
  if (authState.status !== "authenticated") {
    return {
      message: "Your admin session is no longer available. Sign in again.",
      status: "error",
    };
  }

  const leadId = stringValue(formData.get("lead_id"));
  const leadStatus = stringValue(formData.get("lead_status"));
  const assignedAgentId = stringValue(formData.get("assigned_agent_id"));
  const notes = stringValue(formData.get("notes"));

  if (!leadId) {
    return { message: "Missing lead id.", status: "error" };
  }

  if (!isLeadStatus(leadStatus)) {
    return { message: "Choose a valid lead status.", status: "error" };
  }

  if (assignedAgentId && !uuidPattern.test(assignedAgentId)) {
    return {
      message: "Assigned agent must be a valid UUID, or blank to clear.",
      status: "error",
    };
  }

  const payload: AdminLeadUpdateRequest = {
    assigned_agent_id: assignedAgentId || null,
    lead_status: leadStatus,
    notes: notes || null,
  };

  try {
    await adminApi.updateLead(authState.accessToken, leadId, payload);
  } catch (error) {
    return {
      message: updateErrorMessage(error),
      status: "error",
    };
  }

  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin/leads");
  redirect(`/admin/leads/${leadId}?updated=1`);
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function isLeadStatus(value: string): value is AdminLeadStatus {
  return leadStatuses.includes(value as AdminLeadStatus);
}

function updateErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "This lead no longer exists.";
    }
    if (error.status === 422) {
      return "The assigned agent id does not reference an agent.";
    }
  }

  return "The lead could not be updated. Check the backend and try again.";
}
