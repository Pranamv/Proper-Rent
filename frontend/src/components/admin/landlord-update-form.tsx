"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  type LandlordUpdateActionState,
  updateLandlordAction,
} from "@/app/admin/(protected)/landlords/[landlordId]/actions";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextArea,
} from "@/components/ui/field";
import type { AdminLandlordDetail, AdminLandlordStatus } from "@/lib/api";

const initialState: LandlordUpdateActionState = {
  message: null,
  status: "idle",
};

const landlordStatusOptions: { label: string; value: AdminLandlordStatus }[] = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Listed", value: "listed" },
  { label: "Inactive", value: "inactive" },
];

type LandlordUpdateFormProps = {
  landlord: AdminLandlordDetail;
};

export function LandlordUpdateForm({ landlord }: LandlordUpdateFormProps) {
  const [state, formAction] = useActionState(updateLandlordAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="landlord_id" type="hidden" value={landlord.id} />

      <Field>
        <FieldLabel htmlFor="landlord-status">Status</FieldLabel>
        <SelectInput
          defaultValue={landlord.status}
          id="landlord-status"
          name="status"
          required
        >
          {landlordStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field>
        <FieldLabel htmlFor="landlord-notes">Notes</FieldLabel>
        <TextArea
          defaultValue={landlord.notes ?? ""}
          id="landlord-notes"
          name="notes"
          placeholder="Operational notes for landlord follow-up"
        />
        <FieldHint>
          These notes are internal and are not shown on public landlord pages.
        </FieldHint>
      </Field>

      {state.status === "error" && state.message ? (
        <div
          className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-medium text-danger"
          role="alert"
        >
          {state.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} type="submit">
      {pending ? "Saving..." : "Save landlord updates"}
    </Button>
  );
}
