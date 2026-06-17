import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const hubPagePath = new URL("../src/pages/hubs/HubPages.jsx", import.meta.url);
const hubHomeLayoutPath = new URL("../src/pages/hubs/HubHomePageLayout.jsx", import.meta.url);
const hubHomeCssPath = new URL("../src/pages/hubs/HubHomePageLayout.css", import.meta.url);
const hubHomeConfigPath = new URL("../src/pages/hubs/hubHomeConfig.js", import.meta.url);

const source = readFileSync(hubPagePath, "utf8");

assert.ok(existsSync(hubHomeLayoutPath), "shared hub home layout exists");
assert.ok(existsSync(hubHomeCssPath), "shared hub home CSS exists");
assert.ok(existsSync(hubHomeConfigPath), "NOKO hub home config exists");

const layoutSource = readFileSync(hubHomeLayoutPath, "utf8");
const configSource = readFileSync(hubHomeConfigPath, "utf8");

assert.ok(layoutSource.includes("export function HubHomePageLayout"), "shared hub home layout is exported");
assert.ok(source.includes("HubHomePageLayout"), "NOKO page uses the shared hub home layout");
assert.ok(source.includes("NOKO_HUB_HOME_CONFIG"), "NOKO page is driven by a config object");

[
  "ImcroPage",
  "ImcroContainer",
  "ImcroSection",
  "ImcroNewsPanel",
  "ImcroServiceCard",
  "ImcroContactPanel",
].forEach((componentName) => {
  assert.ok(layoutSource.includes(componentName), `shared hub home layout uses ${componentName}`);
});

[
  "noko-page",
  "noko-hero-grid",
  "noko-materials-grid",
  "noko-contact-section",
  "Последние новости",
  "Материалы и разделы",
  "Контакты отдела",
].forEach((marker) => {
  assert.ok(configSource.includes(marker), `NOKO config contains ${marker}`);
});

[
  "/noko/operativnaya-informaciya/",
  "/noko/gia-9/",
  "/noko/gia-11/",
  "/noko/sborniki/",
].forEach((path) => {
  assert.ok(configSource.includes(path), `NOKO page keeps route ${path}`);
});

assert.ok(!source.includes("Ознакомиться"), "NOKO page source does not show the old ознакомительные buttons");
assert.ok(!configSource.includes("Ознакомиться"), "NOKO config does not show the old ознакомительные buttons");

const styles = readFileSync(hubHomeCssPath, "utf8");

[
  ".hub-home-page",
  ".hub-home-hero-grid",
  ".hub-home-materials-grid",
  ".hub-home-contact-section",
].forEach((className) => {
  assert.ok(styles.includes(className), `shared hub home CSS contains ${className}`);
});

assert.ok(!/tailwind|grid-cols-\d|bg-\[|text-\[|rounded-\[|shadow-\[/i.test(source + layoutSource + configSource), "NOKO JSX does not use Tailwind utility classes");
assert.ok(!/tailwind|@tailwind|@apply/i.test(styles), "shared hub home CSS does not use Tailwind directives");
assert.ok(!/#(?:7C3AED|6D28D9|8B5CF6|C4B5FD|F5F3FF|F3EEFF|EDE9FE|92400E|B45309|F59E0B|D97706)/i.test(styles), "shared hub home CSS avoids banned accent colors");
