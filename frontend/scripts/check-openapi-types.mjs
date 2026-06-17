import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const artifact = "../contracts/openapi.json";
const checkedTypes = "src/lib/api/openapi-types.ts";
const binary = process.platform === "win32"
  ? "node_modules/.bin/openapi-typescript.cmd"
  : "node_modules/.bin/openapi-typescript";

assert.ok(existsSync(artifact), `Missing OpenAPI artifact: ${artifact}`);
assert.ok(existsSync(checkedTypes), `Missing generated OpenAPI types: ${checkedTypes}`);
assert.ok(existsSync(binary), `Missing openapi-typescript binary: ${binary}`);

const tempDir = mkdtempSync(join(tmpdir(), "proper-rent-openapi-"));
const tempTypes = join(tempDir, "openapi-types.ts");

execFileSync(binary, [artifact, "-o", tempTypes], { stdio: "pipe" });

assert.equal(
  readFileSync(checkedTypes, "utf8"),
  readFileSync(tempTypes, "utf8"),
  "OpenAPI TypeScript types are out of date. Run: npm run contract:types",
);

console.log("OpenAPI TypeScript types are up to date.");
