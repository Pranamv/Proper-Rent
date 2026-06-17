import { describe, expect, it } from "vitest";

import { adminLoginRedirect, safeAdminRedirect } from "@/lib/admin/redirects";

describe("admin redirect helpers", () => {
  it("allows internal admin redirects that are not the login page", () => {
    expect(safeAdminRedirect("/admin/leads?page=2")).toBe("/admin/leads?page=2");
  });

  it("falls back to the admin home for unsafe or looping redirects", () => {
    expect(safeAdminRedirect("https://evil.example/admin")).toBe("/admin");
    expect(safeAdminRedirect("//evil.example/admin")).toBe("/admin");
    expect(safeAdminRedirect("/admin/login?redirectTo=/admin")).toBe("/admin");
    expect(safeAdminRedirect(undefined)).toBe("/admin");
  });

  it("encodes the safe redirect target for login links", () => {
    expect(adminLoginRedirect("/admin/landlords?status=new")).toBe(
      "/admin/login?redirectTo=%2Fadmin%2Flandlords%3Fstatus%3Dnew",
    );
  });
});
