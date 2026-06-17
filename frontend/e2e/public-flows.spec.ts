import { expect, test, type Page } from "@playwright/test";

const observations = new WeakMap<
  Page,
  {
    consoleErrors: string[];
    failedRequests: string[];
  }
>();

const publicRoutes = [
  "/",
  "/renters",
  "/landlords",
  "/how-it-works",
  "/privacy",
  "/terms",
  "/register/renter",
  "/register/landlord",
] as const;

test.beforeEach(async ({ page }) => {
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(request.url());
  });
  observations.set(page, { consoleErrors, failedRequests });

  await page.route("**/api/v1/chat", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        reply: "A Proper Rent agent can help with the next step.",
        session_id: "e2e-session",
        suggested_action: "show_intake_form",
      },
      status: 200,
    });
  });
  await page.route("**/api/v1/leads", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        message: "Thank you. Our team will be in touch within 24 hours.",
        renter_id: "00000000-0000-4000-8000-000000000001",
      },
      status: 201,
    });
  });
  await page.route("**/api/v1/landlords", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        landlord_id: "00000000-0000-4000-8000-000000000002",
        message: "Thank you. Our team will be in touch within 24 hours.",
      },
      status: 201,
    });
  });

});

test.afterEach(async ({ page }) => {
  const observed = observations.get(page);
  expect(observed?.consoleErrors ?? []).toEqual([]);
  expect(observed?.failedRequests ?? []).toEqual([]);
});

for (const route of publicRoutes) {
  test(`renders public route ${route} with canonical metadata`, async ({ page }) => {
    await page.goto(route);

    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      canonicalFor(route),
    );
    await expect(page.locator("body")).not.toContainText("localhost:8000");
  });
}

test("renter intake completes against a mocked backend", async ({ page }) => {
  await page.goto("/register/renter?session_id=e2e-renter-session");

  await page.getByLabel("Full name").fill("Eve Renter");
  await page.getByLabel("Email").fill("eve@example.com");
  await page.getByLabel("Phone").fill("07123 456789");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Bedrooms required").selectOption("2");
  await page.getByLabel("Maximum monthly rent").fill("1450");
  await page.getByLabel("Preferred areas").fill("Manchester, Salford");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Employment status").selectOption("employed_full");
  await page.getByLabel("Do you have a guarantor?").selectOption("yes");
  await page.getByLabel("Deposit availability").selectOption("full");
  await page.getByLabel("Current housing").selectOption("renting");
  await page.getByLabel(/I agree to be contacted about my enquiry/).check();
  await page.getByRole("button", { name: "Send to an agent" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Thank you. Your enquiry is with the agent.",
  );
});

test("landlord intake completes against a mocked backend", async ({ page }) => {
  await page.goto("/register/landlord");

  await page.getByLabel("Full name").fill("Liam Landlord");
  await page.getByLabel("Email").fill("liam@example.com");
  await page.getByLabel("Phone").fill("07123 000111");
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel("Property address").fill("1 Proper Street, Manchester");
  await page.getByLabel("Bedrooms").fill("2");
  await page.getByLabel("Asking rent").fill("1600");
  await page.getByLabel("Listing interest").check();
  await page.getByLabel("Advanced Rent interest").check();
  await page.getByRole("button", { name: "Continue" }).click();

  await page.getByLabel(/I agree to be contacted about this property/).check();
  await page.getByRole("button", { name: "Send to an agent" }).click();

  await expect(page.getByRole("status")).toContainText(
    "Thank you. Your property details are with the agent.",
  );
});

test("chat widget sends a message and exposes the intake action", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /Open Proper Rent chat/ }).click();
  await page.getByRole("textbox", { name: "Chat message" }).fill("Can I book a viewing?");
  await page.getByRole("button", { name: "Send chat message" }).click();

  await expect(page.getByText("A Proper Rent agent can help with the next step.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open renter intake form" })).toHaveAttribute(
    "href",
    /\/register\/renter\?session_id=/,
  );
});

test("unauthenticated admin users are redirected to login", async ({ page }) => {
  await page.goto("/admin");

  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(page.getByRole("heading", { name: "Sign in to the workspace." })).toBeVisible();
});

function canonicalFor(route: string) {
  return `https://www.properrent.co.uk${route === "/" ? "" : route}`;
}
