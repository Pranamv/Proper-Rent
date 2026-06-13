import { existsSync, readFileSync } from "node:fs";
import assert from "node:assert/strict";

const routes = [
  { path: "/", source: "src/app/page.tsx", output: ".next/server/app/index.html" },
  {
    path: "/renters",
    source: "src/app/renters/page.tsx",
    output: ".next/server/app/renters.html",
  },
  {
    path: "/landlords",
    source: "src/app/landlords/page.tsx",
    output: ".next/server/app/landlords.html",
  },
  {
    path: "/how-it-works",
    source: "src/app/how-it-works/page.tsx",
    output: ".next/server/app/how-it-works.html",
  },
  {
    path: "/privacy",
    source: "src/app/privacy/page.tsx",
    output: ".next/server/app/privacy.html",
  },
  {
    path: "/terms",
    source: "src/app/terms/page.tsx",
    output: ".next/server/app/terms.html",
  },
  {
    path: "/register/renter",
    source: "src/app/register/renter/page.tsx",
    output: ".next/server/app/register/renter.html",
  },
  {
    path: "/register/landlord",
    source: "src/app/register/landlord/page.tsx",
    output: ".next/server/app/register/landlord.html",
  },
];

for (const route of routes) {
  assert.ok(existsSync(route.source), `Missing source file for ${route.path}`);
  assert.ok(existsSync(route.output), `Missing generated output for ${route.path}`);

  const source = readFileSync(route.source, "utf8");
  assert.match(source, /export const metadata/, `${route.path} is missing metadata export`);
  assert.match(source, /description:/, `${route.path} is missing metadata description`);
}

const rentersSource = readFileSync("src/app/renters/page.tsx", "utf8");
const landlordsSource = readFileSync("src/app/landlords/page.tsx", "utf8");
const renterRegisterSource = readFileSync("src/app/register/renter/page.tsx", "utf8");
const landlordRegisterSource = readFileSync("src/app/register/landlord/page.tsx", "utf8");
const siteShellSource = readFileSync("src/components/layout/site-shell.tsx", "utf8");
const chatWidgetSource = readFileSync("src/components/chat/chat-widget.tsx", "utf8");
const renterFormSource = readFileSync("src/components/forms/renter-intake-form.tsx", "utf8");
const landlordFormSource = readFileSync("src/components/forms/landlord-intake-form.tsx", "utf8");
const consentSource = readFileSync("src/lib/consent.ts", "utf8");
const nextConfigSource = readFileSync("next.config.ts", "utf8");
const adminLandlordsSource = readFileSync(
  "src/app/admin/(protected)/landlords/page.tsx",
  "utf8",
);
const adminLandlordDetailSource = readFileSync(
  "src/app/admin/(protected)/landlords/[landlordId]/page.tsx",
  "utf8",
);
const adminLandlordActionSource = readFileSync(
  "src/app/admin/(protected)/landlords/[landlordId]/actions.ts",
  "utf8",
);
const adminLandlordFormSource = readFileSync(
  "src/components/admin/landlord-update-form.tsx",
  "utf8",
);
const analyticsSource = readFileSync(
  "src/components/analytics/cookieless-analytics.tsx",
  "utf8",
);
assert.match(rentersSource, /FaqSection/, "Renters page is missing FAQ rendering");
assert.match(landlordsSource, /FaqSection/, "Landlords page is missing FAQ rendering");
assert.match(
  renterRegisterSource,
  /RenterIntakeForm/,
  "Renter registration page is missing the intake form",
);
assert.match(
  landlordRegisterSource,
  /LandlordIntakeForm/,
  "Landlord registration page is missing the intake form",
);
assert.match(
  renterFormSource,
  /consentCopy\.renter/,
  "Renter form must use shared consent copy",
);
assert.match(
  landlordFormSource,
  /consentCopy\.landlord/,
  "Landlord form must use shared consent copy",
);
assert.match(
  consentSource,
  /DEFAULT_CONSENT_VERSION = "2026-06-13"/,
  "Consent version default must match the backend default",
);
assert.match(siteShellSource, /ChatWidget/, "Public shell is missing the chatbot widget");
assert.match(chatWidgetSource, /createChatReply/, "Chat widget does not call the chat API");
assert.match(chatWidgetSource, /aria-live="polite"/, "Chat widget is missing aria-live");
assert.match(
  chatWidgetSource,
  /show_intake_form/,
  "Chat widget does not handle the intake-form suggested action",
);
assert.match(
  chatWidgetSource,
  /motion-reduce/,
  "Chat widget is missing reduced-motion handling",
);
assert.match(
  siteShellSource,
  /CookielessAnalytics/,
  "Public shell is missing cookieless analytics",
);
assert.match(
  analyticsSource,
  /plausible\.io\/js\/script\.js/,
  "Cookieless analytics should use the Plausible script",
);
assert.match(
  analyticsSource,
  /NODE_ENV === "production"/,
  "Analytics must be disabled outside production builds",
);
assert.match(
  nextConfigSource,
  /X-Content-Type-Options/,
  "Next config must set baseline security headers",
);
assert.match(
  nextConfigSource,
  /X-Frame-Options/,
  "Next config must set clickjacking protection",
);
assert.match(
  adminLandlordsSource,
  /listLandlords/,
  "Admin landlords page must call the landlord list API",
);
assert.match(
  adminLandlordsSource,
  /advanced_rent_interest/,
  "Admin landlords list must show Advanced Rent interest",
);
assert.match(
  adminLandlordDetailSource,
  /getLandlord/,
  "Admin landlord detail page must call the landlord detail API",
);
assert.match(
  adminLandlordDetailSource,
  /LandlordUpdateForm/,
  "Admin landlord detail page must render the update form",
);
assert.match(
  adminLandlordDetailSource,
  /Not scored/,
  "Admin landlord detail must make clear that landlord leads are not scored",
);
assert.match(
  adminLandlordActionSource,
  /updateLandlord/,
  "Admin landlord action must call the landlord update API",
);
assert.match(
  adminLandlordFormSource,
  /useActionState/,
  "Admin landlord update form must wire the server action",
);

assert.ok(existsSync(".next/server/app/sitemap.xml.body"), "Missing generated sitemap");
assert.ok(existsSync(".next/server/app/robots.txt.body"), "Missing generated robots.txt");

for (const route of routes) {
  const output = readFileSync(route.output, "utf8");
  assert.match(output, /rel="canonical"/, `${route.path} is missing a canonical URL`);
  const canonicalHref = output.match(/rel="canonical" href="([^"]+)"/)?.[1] ?? "";
  assert.ok(canonicalHref, `${route.path} canonical URL is missing href`);
  assert.equal(
    canonicalHref.includes("?"),
    false,
    `${route.path} canonical URL must not include query parameters`,
  );
  assert.equal(
    canonicalHref.includes("utm_"),
    false,
    `${route.path} canonical URL must not include UTM parameters`,
  );

  if (!process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN) {
    assert.doesNotMatch(
      output,
      /plausible\.io\/js\/script\.js/,
      `${route.path} should not include analytics when NEXT_PUBLIC_ANALYTICS_DOMAIN is empty`,
    );
  }
}

for (const forbiddenRoute of ["src/app/listings", "src/app/properties"]) {
  assert.equal(existsSync(forbiddenRoute), false, `${forbiddenRoute} must not exist in Phase 1`);
}

console.log(`Checked ${routes.length} public routes.`);
