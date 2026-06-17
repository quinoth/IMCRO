import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { transformWithOxc } from "vite";
import { SECTION_PAGE_ROUTES } from "../src/pages/sections/sectionStructure.js";

const layoutPath = new URL("../src/pages/hubs/HubSectionPageLayout.jsx", import.meta.url);
const cssPath = new URL("../src/pages/hubs/HubSectionPageLayout.css", import.meta.url);
const sectionPagesPath = new URL("../src/pages/sections/SectionPages.jsx", import.meta.url);
const appPath = new URL("../src/App.jsx", import.meta.url);

assert.ok(existsSync(layoutPath), "shared hub section layout exists");
assert.ok(existsSync(cssPath), "shared hub section CSS exists");

const layoutSource = readFileSync(layoutPath, "utf8");
const cssSource = readFileSync(cssPath, "utf8");
const sectionPagesSource = readFileSync(sectionPagesPath, "utf8");
const appSource = readFileSync(appPath, "utf8");

await transformWithOxc(layoutSource, layoutPath.pathname, { lang: "jsx" });

[
  "HubSectionPageLayout",
  "ArticleList",
  "ArticleCard",
].forEach((name) => {
  assert.match(layoutSource, new RegExp(`export function ${name}\\b`), `${name} is exported`);
});

[
  "ImcroContainer",
  "ImcroSection",
  "ImcroCard",
  "ImcroServiceCard",
  "ImcroButton",
].forEach((componentName) => {
  assert.ok(layoutSource.includes(componentName), `hub section layout uses ${componentName}`);
});

[
  "title",
  "description",
  "breadcrumbs",
  "childSections",
  "articles",
  "parentHref",
  "parentTitle",
].forEach((propName) => {
  assert.ok(layoutSource.includes(propName), `hub section layout accepts ${propName}`);
});

const childSectionIndex = layoutSource.indexOf("hub-section-child-grid");
const articleListIndex = layoutSource.indexOf("<ArticleList");
assert.ok(childSectionIndex > -1, "layout has a child section card grid");
assert.ok(articleListIndex > -1, "layout renders an article list");
assert.ok(childSectionIndex < articleListIndex, "child section cards are rendered before article list");

[
  "Опубликованы методические материалы по разделу",
  "Обновлены нормативные документы",
  "Добавлены рекомендации для образовательных организаций",
].forEach((fallbackTitle) => {
  assert.ok(layoutSource.includes(fallbackTitle), `fallback article exists: ${fallbackTitle}`);
});

assert.ok(!layoutSource.includes("Header"), "layout does not own Header");
assert.ok(!layoutSource.includes("Footer"), "layout does not own Footer");
assert.ok(sectionPagesSource.includes("HubSectionPageLayout"), "SectionRoutePage uses the shared layout");
assert.ok(!sectionPagesSource.includes("function SectionStyles"), "SectionRoutePage does not keep inline section styles");
assert.ok(!sectionPagesSource.includes("<style>"), "SectionRoutePage styles are in CSS");

[
  ".hub-section-page",
  ".hub-section-main",
  ".hub-section-hero-card",
  ".hub-section-child-grid",
  ".hub-section-article-card",
].forEach((className) => {
  assert.ok(cssSource.includes(className), `hub section CSS contains ${className}`);
});

[
  "--imcro-color-bg",
  "--imcro-color-primary",
  "--imcro-color-surface",
  "--imcro-color-text",
  "--imcro-color-text-muted",
  "--imcro-color-border",
].forEach((token) => {
  assert.ok(cssSource.includes(`var(${token}`), `${token} is used by hub section CSS`);
});

[
  "Актуальные публикации, документы и справочные материалы выбранного подраздела.",
  "Карточки ведут на отдельные страницы подразделов с материалами и вложенной навигацией.",
  "Материалы выбранного подраздела размещаются после карточек вложенных разделов.",
].forEach((serviceText) => {
  assert.ok(!layoutSource.includes(serviceText), `service explanation is not rendered: ${serviceText}`);
});

assert.ok(!cssSource.includes("min-height: 330px"), "section hero no longer uses the old tall desktop height");
assert.ok(!cssSource.includes("min-height: 280px"), "section hero no longer uses the old tall tablet height");
assert.equal(
  [...layoutSource.matchAll(/className="hub-section-kicker"/g)].length,
  1,
  "only the hero keeps a small section badge",
);
assert.match(cssSource, /\.hub-section-hero-card\s*{[\s\S]*?min-height:\s*0;/, "section hero card has no forced empty height");
assert.match(cssSource, /\.hub-section-hero-card\s*{[\s\S]*?padding:\s*clamp\(16px,\s*2\.4vw,\s*24px\);/, "section hero card uses tighter vertical padding");
assert.match(cssSource, /\.hub-section-child-grid\s*{[\s\S]*?grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);/, "child section grid supports four desktop columns");
assert.match(cssSource, /@media \(max-width:\s*1024px\)[\s\S]*?\.hub-section-child-grid\s*{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/, "child section grid uses two tablet columns");
assert.match(cssSource, /@media \(max-width:\s*720px\)[\s\S]*?\.hub-section-child-grid\s*{[\s\S]*?grid-template-columns:\s*1fr;/, "child section grid uses one mobile column");
assert.match(cssSource, /\.hub-section-child-card\s*{[\s\S]*?min-height:\s*260px;/, "child cards are more compact while keeping equal height");
assert.match(cssSource, /\.hub-section-child-card \.imcro-service-card__description\s*{[\s\S]*?margin-bottom:\s*18px;/, "child card descriptions have breathing room before the action");
assert.match(cssSource, /\.hub-section-child-card \.imcro-service-card__button\s*{[\s\S]*?margin-top:\s*auto;/, "child card actions stay pinned to the bottom");
assert.match(cssSource, /\.hub-section-article-card\s*{[\s\S]*?padding:\s*16px 18px;/, "article cards use tighter vertical padding");

assert.ok(!/tailwind|grid-cols-\d|bg-\[|text-\[|rounded-\[|shadow-\[/i.test(layoutSource + cssSource), "hub section layout does not use Tailwind utility classes");
assert.ok(!/#(?:7C3AED|6D28D9|8B5CF6|C4B5FD|F5F3FF|F3EEFF|EDE9FE|92400E|B45309|F59E0B|D97706)/i.test(cssSource), "hub section CSS avoids banned accent colors");

const nestedRoutes = SECTION_PAGE_ROUTES.filter(({ node }) => node.level >= 3);
assert.ok(nestedRoutes.length > 0, "section structure contains nested subsection routes");
assert.ok(appSource.includes("SECTION_DETAIL_ROUTES"), "App defines shared detail routes for subsection pages");
assert.ok(appSource.includes("node.level >= 2"), "App connects level 2+ subsection routes");
assert.ok(appSource.includes("SECTION_DETAIL_ROUTES.map"), "App renders subsection routes from section structure");
assert.ok(appSource.includes("!normalizePublicRoute(path).startsWith(\"/tpmpk/\")"), "App keeps explicit TPMPK public routes untouched");
