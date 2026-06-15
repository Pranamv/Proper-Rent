"use server";

import { revalidatePath } from "next/cache";

import { adminApi, ApiError } from "@/lib/api";
import type { AdminLeadStatus } from "@/lib/api";
import { getAdminSessionState } from "@/lib/admin/auth";

export type LeadStatusUpdateActionState = {
  leadStatus?: AdminLeadStatus;
  message: string | null;
  status: "idle" | "success" | "error";
  updatedAt?: number;
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

export async function updateLeadStatusAction(
  _previousState: LeadStatusUpdateActionState,
  formData: FormData,
): Promise<LeadStatusUpdateActionState> {
  const authState = await getAdminSessionState();
  if (authState.status !== "authenticated") {
    return {
      message: "Your admin session expired. Sign in again.",
      status: "error",
    };
  }

  const leadId = stringValue(formData.get("lead_id"));
  const leadStatus = stringValue(formData.get("lead_status"));

  if (!uuidPattern.test(leadId)) {
    return { message: "Missing or invalid lead id.", status: "error" };
  }

  if (!isLeadStatus(leadStatus)) {
    return { message: "Choose a valid lead status.", status: "error" };
  }

  try {
    await adminApi.updateLead(authState.accessToken, leadId, {
      lead_status: leadStatus,
    });
  } catch (error) {
    return {
      message: updateErrorMessage(error),
      status: "error",
    };
  }

  revalidatePath("/admin/leads");
  revalidatePath(`/admin/leads/${leadId}`);

  return {
    leadStatus,
    message: "Saved",
    status: "success",
    updatedAt: Date.now(),
  };
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
      return "Choose one of the supported lead statuses.";
    }
  }

  return "Status could not be updated. Check the backend and try again.";
}
