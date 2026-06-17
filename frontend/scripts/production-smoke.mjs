import assert from "node:assert/strict";

const siteOrigin = stripTrailingSlash(
  process.env.PROD_SITE_ORIGIN ?? "https://www.properrent.co.uk",
);
const apexOrigin = stripTrailingSlash(
  process.env.PROD_APEX_ORIGIN ?? "https://properrent.co.uk",
);
const apiOrigin = stripTrailingSlash(
  process.env.PROD_API_ORIGIN ?? "https://api.properrent.co.uk/api/v1",
);

const securityHeaders = {
  "permissions-policy": "camera=(), microphone=(), geolocation=()",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

await checkApiHealth();
await checkCorsPreflight();
await checkApexRedirect();
await checkFrontendDocument();
await checkRobotsAndSitemap();
await checkAdminLogin();

console.log("Production read-only smoke checks passed.");

async function checkApiHealth() {
  const response = await fetch(`${apiOrigin}/health`);
  assert.equal(response.status, 200, "API health must return 200");
  assert.deepEqual(await response.json(), { status: "ok", version: "0.1.0" });
  assertSecurityHeaders(response);
}

async function checkCorsPreflight() {
  const response = await fetch(`${apiOrigin}/chat`, {
    headers: {
      "Access-Control-Request-Method": "POST",
      Origin: siteOrigin,
    },
    method: "OPTIONS",
  });
  assert.equal(response.status, 200, "CORS preflight must return 200");
  assert.equal(
    response.headers.get("access-control-allow-origin"),
    siteOrigin,
    "CORS must allow the canonical frontend origin",
  );
}

async function checkApexRedirect() {
  const response = await fetch(apexOrigin, {
    method: "HEAD",
    redirect: "manual",
  });
  assert.ok([301, 302, 307, 308].includes(response.status), "Apex must redirect");
  const location = response.headers.get("location");
  assert.ok(location, "Apex redirect must include a Location header");
  assert.equal(new URL(location, apexOrigin).origin, siteOrigin);
}

async function checkFrontendDocument() {
  const response = await fetch(siteOrigin);
  assert.equal(response.status, 200, "Canonical frontend home must return 200");
  assertSecurityHeaders(response);

  const html = await response.text();
  assert.ok(
    new RegExp(`rel="canonical" href="${escapeRegExp(siteOrigin)}/?"`).test(html),
    "Home page canonical URL must use the canonical frontend origin",
  );
  assert.doesNotMatch(html, /localhost:8000|127\.0\.0\.1:8000/);
}

async function checkRobotsAndSitemap() {
  const robotsResponse = await fetch(`${siteOrigin}/robots.txt`);
  assert.equal(robotsResponse.status, 200, "robots.txt must return 200");
  const robots = await robotsResponse.text();
  assert.match(robots, new RegExp(`Host: ${escapeRegExp(siteOrigin)}/?`));
  assert.match(
    robots,
    new RegExp(`Sitemap: ${escapeRegExp(siteOrigin)}/sitemap\\.xml`),
  );

  const sitemapResponse = await fetch(`${siteOrigin}/sitemap.xml`);
  assert.equal(sitemapResponse.status, 200, "sitemap.xml must return 200");
  const sitemap = await sitemapResponse.text();
  assert.match(sitemap, new RegExp(`<loc>${escapeRegExp(siteOrigin)}/?</loc>`));
  assert.doesNotMatch(sitemap, new RegExp(escapeRegExp(apexOrigin)));
}

async function checkAdminLogin() {
  const response = await fetch(`${siteOrigin}/admin/login`, { method: "HEAD" });
  assert.equal(response.status, 200, "Admin login page must return 200");
  assertSecurityHeaders(response);
}

function assertSecurityHeaders(response) {
  for (const [header, expected] of Object.entries(securityHeaders)) {
    assert.equal(response.headers.get(header), expected, `${header} must match`);
  }
}

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
