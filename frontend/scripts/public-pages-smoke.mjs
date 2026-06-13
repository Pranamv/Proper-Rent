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

assert.ok(existsSync(".next/server/app/sitemap.xml.body"), "Missing generated sitemap");
assert.ok(existsSync(".next/server/app/robots.txt.body"), "Missing generated robots.txt");

for (const forbiddenRoute of ["src/app/listings", "src/app/properties"]) {
  assert.equal(existsSync(forbiddenRoute), false, `${forbiddenRoute} must not exist in Phase 1`);
}

console.log(`Checked ${routes.length} public routes.`);
