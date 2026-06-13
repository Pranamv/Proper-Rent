"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldHint,
  FieldLabel,
  SelectInput,
  TextArea,
  TextInput,
} from "@/components/ui/field";
import type { AdminLeadDetail, AdminLeadStatus } from "@/lib/api";
import {
  type LeadUpdateActionState,
  updateLeadAction,
} from "@/app/admin/(protected)/leads/[leadId]/actions";

const initialState: LeadUpdateActionState = {
  message: null,
  status: "idle",
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

type LeadUpdateFormProps = {
  lead: AdminLeadDetail;
};

export function LeadUpdateForm({ lead }: LeadUpdateFormProps) {
  const [state, formAction] = useActionState(updateLeadAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input name="lead_id" type="hidden" value={lead.id} />

      <Field>
        <FieldLabel htmlFor="lead-status">Status</FieldLabel>
        <SelectInput
          defaultValue={lead.lead_status}
          id="lead-status"
          name="lead_status"
          required
        >
          {leadStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectInput>
      </Field>

      <Field>
        <FieldLabel htmlFor="assigned-agent-id">Assigned agent UUID</FieldLabel>
        <TextInput
          defaultValue={lead.assigned_agent_id ?? ""}
          id="assigned-agent-id"
          name="assigned_agent_id"
          placeholder="Leave blank to clear assignment"
        />
        <FieldHint>
          Phase 1 does not expose an agent directory yet. Paste the target agent id
          or leave blank to mark the lead unassigned.
        </FieldHint>
      </Field>

      <Field>
        <FieldLabel htmlFor="lead-notes">Notes</FieldLabel>
        <TextArea
          defaultValue={lead.notes ?? ""}
          id="lead-notes"
          name="notes"
          placeholder="Operational notes for follow-up"
        />
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
      {pending ? "Saving..." : "Save lead updates"}
    </Button>
  );
}
