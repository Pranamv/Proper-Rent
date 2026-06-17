import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RenterIntakeForm } from "@/components/forms/renter-intake-form";

const mocks = vi.hoisted(() => ({
  createRenterLead: vi.fn(),
  resolvePublicSessionId: vi.fn(() => "session-renter-vitest"),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    publicApi: {
      ...actual.publicApi,
      createRenterLead: mocks.createRenterLead,
    },
  };
});

vi.mock("@/lib/session", () => ({
  resolvePublicSessionId: mocks.resolvePublicSessionId,
}));

describe("RenterIntakeForm", () => {
  beforeEach(() => {
    mocks.createRenterLead.mockReset();
    mocks.resolvePublicSessionId.mockReturnValue("session-renter-vitest");
  });

  it("submits the renter payload and shows the confirmation state", async () => {
    mocks.createRenterLead.mockResolvedValue({
      message: "Thank you. Our team will be in touch within 24 hours.",
      renter_id: "renter-1",
    });
    const user = userEvent.setup();

    render(<RenterIntakeForm />);

    await user.type(screen.getByLabelText(/full name/i), "Rita Renter");
    await user.type(screen.getByLabelText(/email/i), "rita@example.com");
    await user.type(screen.getByLabelText(/phone/i), "07123 456789");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await user.selectOptions(screen.getByLabelText(/bedrooms required/i), "2");
    await user.type(screen.getByLabelText(/maximum monthly rent/i), "1450");
    await user.type(screen.getByLabelText(/preferred areas/i), "Manchester, Salford");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await user.selectOptions(screen.getByLabelText(/employment status/i), "employed_full");
    await user.selectOptions(screen.getByLabelText(/guarantor/i), "yes");
    await user.selectOptions(screen.getByLabelText(/deposit availability/i), "full");
    await user.selectOptions(screen.getByLabelText(/current housing/i), "renting");
    await user.click(screen.getByLabelText(/i agree to be contacted about my enquiry/i));
    await user.click(screen.getByRole("button", { name: /send to an agent/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Thank you. Your enquiry is with the agent.",
    );
    expect(mocks.createRenterLead).toHaveBeenCalledWith(
      expect.objectContaining({
        areas_preferred: ["Manchester", "Salford"],
        bedrooms_required: 2,
        consent_given: true,
        consent_version: "2026-06-13",
        email: "rita@example.com",
        employment_status: "employed_full",
        full_name: "Rita Renter",
        max_rent: 1450,
        session_id: "session-renter-vitest",
      }),
    );
  });

  it("keeps the user on the first invalid step with validation errors", async () => {
    const user = userEvent.setup();
    render(<RenterIntakeForm />);

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(screen.getByText("Enter your full name.")).toBeInTheDocument();
    expect(mocks.createRenterLead).not.toHaveBeenCalled();
  });
});
