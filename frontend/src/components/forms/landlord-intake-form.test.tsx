import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LandlordIntakeForm } from "@/components/forms/landlord-intake-form";

const mocks = vi.hoisted(() => ({
  createLandlordIntake: vi.fn(),
}));

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return {
    ...actual,
    publicApi: {
      ...actual.publicApi,
      createLandlordIntake: mocks.createLandlordIntake,
    },
  };
});

describe("LandlordIntakeForm", () => {
  beforeEach(() => {
    mocks.createLandlordIntake.mockReset();
  });

  it("submits the landlord payload and shows the confirmation state", async () => {
    mocks.createLandlordIntake.mockResolvedValue({
      landlord_id: "landlord-1",
      message: "Thank you. Our team will be in touch within 24 hours.",
    });
    const user = userEvent.setup();

    render(<LandlordIntakeForm />);

    await user.type(screen.getByLabelText(/full name/i), "Lara Landlord");
    await user.type(screen.getByLabelText(/email/i), "lara@example.com");
    await user.type(screen.getByLabelText(/phone/i), "07123 000111");
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await user.type(screen.getByLabelText(/property address/i), "1 Proper Street, Manchester");
    await user.type(screen.getByLabelText(/^bedrooms$/i), "2");
    await user.type(screen.getByLabelText(/asking rent/i), "1600");
    await user.click(screen.getByLabelText(/listing interest/i));
    await user.click(screen.getByLabelText(/advanced rent interest/i));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await user.click(screen.getByLabelText(/i agree to be contacted about this property/i));
    await user.click(screen.getByRole("button", { name: /send to an agent/i }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Thank you. Your property details are with the agent.",
    );
    expect(mocks.createLandlordIntake).toHaveBeenCalledWith(
      expect.objectContaining({
        advanced_rent_interest: true,
        asking_rent: 1600,
        bedrooms: 2,
        consent_given: true,
        consent_version: "2026-06-13",
        email: "lara@example.com",
        full_name: "Lara Landlord",
        listing_interest: true,
        property_address: "1 Proper Street, Manchester",
      }),
    );
  });
});
