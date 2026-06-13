"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { adminApi, ApiError } from "@/lib/api";
import type { AdminLandlordStatus, AdminLandlordUpdateRequest } from "@/lib/api";
import { getAdminAuthState } from "@/lib/admin/auth";

export type LandlordUpdateActionState = {
  message: string | null;
  status: "idle" | "error";
};

const landlordStatuses: AdminLandlordStatus[] = [
  "new",
  "contacted",
  "listed",
  "inactive",
];

export async function updateLandlordAction(
  _previousState: LandlordUpdateActionState,
  formData: FormData,
): Promise<LandlordUpdateActionState> {
  const authState = await getAdminAuthState();
  if (authState.status !== "authenticated") {
    return {
      message: "Your admin session is no longer available. Sign in again.",
      status: "error",
    };
  }

  const landlordId = stringValue(formData.get("landlord_id"));
  const landlordStatus = stringValue(formData.get("status"));
  const notes = stringValue(formData.get("notes"));

  if (!landlordId) {
    return { message: "Missing landlord id.", status: "error" };
  }

  if (!isLandlordStatus(landlordStatus)) {
    return { message: "Choose a valid landlord status.", status: "error" };
  }

  const payload: AdminLandlordUpdateRequest = {
    notes: notes || null,
    status: landlordStatus,
  };

  try {
    await adminApi.updateLandlord(authState.accessToken, landlordId, payload);
  } catch (error) {
    return {
      message: updateErrorMessage(error),
      status: "error",
    };
  }

  revalidatePath(`/admin/landlords/${landlordId}`);
  revalidatePath("/admin/landlords");
  redirect(`/admin/landlords/${landlordId}?updated=1`);
}

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function isLandlordStatus(value: string): value is AdminLandlordStatus {
  return landlordStatuses.includes(value as AdminLandlordStatus);
}

function updateErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return "This landlord lead no longer exists.";
    }
    if (error.status === 422) {
      return "Choose one of the supported landlord statuses.";
    }
  }

  return "The landlord lead could not be updated. Check the backend and try again.";
}
