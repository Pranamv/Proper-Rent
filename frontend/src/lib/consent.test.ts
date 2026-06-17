import { describe, expect, it } from "vitest";

import { CONSENT_VERSION, consentCopy } from "@/lib/consent";

describe("consent constants", () => {
  it("keeps the frontend consent version aligned with the backend default", () => {
    expect(CONSENT_VERSION).toBe("2026-06-13");
  });

  it("has distinct renter and landlord consent copy", () => {
    expect(consentCopy.renter).toContain("renter enquiry");
    expect(consentCopy.landlord).toContain("landlord enquiry");
  });
});
