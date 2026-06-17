import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { transformWithOxc } from "vite";

const componentPath = new URL("../src/components/imcro/ImcroPublicComponents.jsx", import.meta.url);
const cssPath = new URL("../src/components/imcro/ImcroPublicComponents.css", import.meta.url);

assert.ok(existsSync(componentPath), "IMCRO public component file exists");
assert.ok(existsSync(cssPath), "IMCRO public component CSS file exists");

const componentSource = readFileSync(componentPath, "utf8");
const cssSource = readFileSync(cssPath, "utf8");

await transformWithOxc(componentSource, componentPath.pathname, { lang: "jsx" });

[
  "ImcroPage",
  "ImcroContainer",
  "ImcroSection",
  "ImcroCard",
  "ImcroButton",
  "ImcroServiceCard",
  "ImcroNewsPanel",
  "ImcroEventBanner",
  "ImcroContactPanel",
  "ImcroActivityCarousel",
].forEach((name) => {
  assert.match(componentSource, new RegExp(`export function ${name}\\b`), `${name} is exported`);
});

assert.match(componentSource, /import "\.\/ImcroPublicComponents\.css";/, "component file imports its CSS");

[
  "imcro-public-page",
  "imcro-container",
  "imcro-section",
  "imcro-card",
  "imcro-card-hover",
  "imcro-button",
  "imcro-service-card",
  "imcro-news-panel",
  "imcro-event-banner",
  "imcro-contact-panel",
  "imcro-activity-carousel",
].forEach((className) => {
  assert.ok(componentSource.includes(className) || cssSource.includes(className), `${className} is wired`);
});

[
  "--imcro-color-primary",
  "--imcro-color-surface",
  "--imcro-color-text",
  "--imcro-color-text-muted",
  "--imcro-color-border",
  "--imcro-gutter",
  "--imcro-radius-card",
  "--imcro-radius-button",
].forEach((token) => {
  assert.ok(cssSource.includes(`var(${token}`), `${token} is used by component CSS`);
});

assert.ok(!/tailwind|className="[^"]*(?:grid-cols|bg-|text-|rounded-|shadow-)/i.test(componentSource), "components do not use Tailwind utility classes");
assert.ok(!/#(?:7C3AED|6D28D9|8B5CF6|C4B5FD|F5F3FF|F3EEFF|EDE9FE|92400E|B45309|F59E0B|D97706)/i.test(cssSource), "component CSS avoids banned accent colors");

const dragThresholdMatch = componentSource.match(/DRAG_THRESHOLD_PX\s*=\s*(\d+)/);
assert.ok(dragThresholdMatch, "activity carousel has an explicit drag threshold");
assert.ok(Number(dragThresholdMatch[1]) >= 5, "activity carousel drag threshold keeps small pointer movement as a click");
assert.ok(componentSource.includes("hasDragged"), "activity carousel tracks real drag separately from pointer down");
assert.ok(componentSource.includes("suppressClick"), "activity carousel suppresses click only after a real drag");
assert.ok(componentSource.includes("href={item.href}"), "activity carousel cards with href keep link semantics");

assert.ok(!componentSource.includes("setPointerCapture"), "activity carousel does not capture the pointer before link clicks can resolve");

assert.match(cssSource, /\.imcro-activity-carousel__stage\s*{[\s\S]*?min-width:\s*0;/, "activity carousel stage cannot force horizontal overflow");
assert.match(cssSource, /\.imcro-activity-carousel__rail\s*{[\s\S]*?max-width:\s*100%;/, "activity carousel rail is constrained to its container");
assert.match(cssSource, /@media \(max-width:\s*760px\)[\s\S]*?\.imcro-activity-carousel__arrow\s*{[\s\S]*?display:\s*none;/, "mobile activity carousel hides arrows that can create overflow");
