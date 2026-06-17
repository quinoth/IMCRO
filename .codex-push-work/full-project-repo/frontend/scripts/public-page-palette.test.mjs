import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const svedeniyaCss = readFileSync(new URL("../src/pages/svedeniya/SvedeniyaPage.css", import.meta.url), "utf8");
const tpmpkSource = readFileSync(new URL("../src/pages/TpmpkZapisPage.jsx", import.meta.url), "utf8");
const profileSource = readFileSync(new URL("../src/pages/ProfilePage.jsx", import.meta.url), "utf8");

assert.ok(svedeniyaCss.includes("background: var(--sv-bg);"), "svedeniya page uses the public blue page background");
assert.ok(svedeniyaCss.includes("--sv-bg: var(--imcro-color-bg, #477799);"), "svedeniya page maps to IMCRO background token");
assert.ok(svedeniyaCss.includes("--sv-primary: var(--imcro-color-primary, #1F5073);"), "svedeniya page maps to IMCRO primary token");

assert.ok(tpmpkSource.includes("--tz-primary: var(--imcro-color-primary, #1F5073);"), "tpmpk booking form uses IMCRO primary token");
assert.ok(tpmpkSource.includes("background: var(--tz-page-bg);"), "tpmpk booking form uses the public blue page background");
assert.ok(tpmpkSource.includes("--tz-page-bg: var(--imcro-color-bg, #477799);"), "tpmpk booking form maps to IMCRO background token");

assert.ok(profileSource.includes("--profile-primary: var(--imcro-color-primary, #1F5073);"), "profile page uses IMCRO primary token");
assert.ok(profileSource.includes("--profile-bg: var(--imcro-color-bg, #477799);"), "profile page maps to IMCRO background token");
assert.ok(profileSource.includes("background: var(--profile-bg);"), "profile page uses the public blue page background");

const forbiddenAccentPattern = /#(?:0969c3|07579f|19789c|004f75|1D4ED8|2563EB|6D28D9|7C3AED|F3EEFF|F5F3FF|EDE9FE|F59E0B|FEF3C7|FFFBEB)|violet|--violet/iu;
for (const [label, source] of [
  ["svedeniya", svedeniyaCss],
  ["tpmpk booking", tpmpkSource],
  ["profile", profileSource],
]) {
  assert.ok(!forbiddenAccentPattern.test(source), `${label} page does not use old blue, purple, or gold public accents`);
}
