import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const authPage = source("src/pages/AuthPage.jsx");
const authLogic = source("src/auth.js");

assert.ok(
  authLogic.includes("export const TEST_CREDENTIALS"),
  "Dev/test credentials stay in auth logic for existing fallback tests",
);
assert.ok(
  authPage.includes("authenticate("),
  "AuthPage keeps the existing fallback login logic",
);
assert.ok(
  !authPage.includes("TEST_CREDENTIALS"),
  "AuthPage must not expose test credentials in the public UI",
);
assert.ok(
  !/тестов/i.test(authPage),
  "AuthPage public copy must not mention test roles or test login",
);
assert.ok(
  !authPage.includes("test-card") && !authPage.includes("credential-list") && !authPage.includes("credential-btn"),
  "AuthPage must not render the public test roles card",
);
assert.ok(
  !/@mky\.test/.test(authPage),
  "AuthPage must not show test email addresses in public placeholders or text",
);
assert.ok(
  !authPage.includes("#7C3AED") && !/rgba\(124,\s*58,\s*237/.test(authPage),
  "AuthPage primary visuals must not use the old purple accent",
);
assert.ok(
  /\.auth-btn\s*\{[^}]*background:\s*#1F5073;/s.test(authPage),
  "AuthPage primary button uses the IMCRO primary color",
);
