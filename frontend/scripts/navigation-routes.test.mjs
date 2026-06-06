import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  ARCHIV_ROUTES,
  DEYATELNOST_ROUTES,
  KONKURSY_ROUTES,
  METHODIKA_STATIC_PAGES,
  METHODIKA_SUBJECT_CARDS,
  NOKO_ROUTES,
} from "../src/features/admin/articleTaxonomy.js";
import { DOMU_SECTIONS } from "../src/pages/domUchitelya/domuSections.js";
import { HUB_HOME_PAGE_ROUTES } from "../src/pages/hubs/hubHomeConfig.js";
import { directions, keyEvents, mainSections } from "../src/pages/homePageData.js";
import { SECTION_PAGE_ROUTES } from "../src/pages/sections/sectionStructure.js";
import { SVEDENIYA_QUICK_LINKS, svedeniyaPage } from "../src/pages/svedeniya/svedeniyaData.js";

const tpmpkRoutes = [
  "/tpmpk/",
  "/tpmpk/zapis",
  "/tpmpk/dokumenty/",
  "/tpmpk/blanki/",
  "/tpmpk/grafik/",
  "/tpmpk/sostav/",
  "/tpmpk/npa/",
  "/tpmpk/faq/",
  "/tpmpk/dlya-roditeley/",
  "/tpmpk/dlya-pedagogov/",
  "/tpmpk/kontakty/",
];

function normalizeRoute(path) {
  if (!path) return "";
  const [pathname, hash] = String(path).split("#");
  if (hash) return `${normalizeRoute(pathname || "/")}#${hash}`;
  if (pathname === "/") return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

const knownRoutes = new Set([
  "/",
  "/auth/",
  "/profile/",
  "/novosti/",
  "/sveden/",
  "/dom-uchitelya/",
  "/dom-uchitelya/novosti/",
  "/metodika/",
  "/noko/",
  "/konkursy/",
  "/deyatelnost/",
  "/archiv/",
  ...tpmpkRoutes,
  ...DOMU_SECTIONS.map((section) => section.path),
  ...SVEDENIYA_QUICK_LINKS.map((section) => section.path),
  ...svedeniyaPage.sections.map((section) => section.path),
  ...METHODIKA_STATIC_PAGES.map((section) => section.path),
  ...METHODIKA_SUBJECT_CARDS.map((subject) => `/metodika/${subject.slug}/`),
  ...NOKO_ROUTES.map((section) => section.path),
  ...KONKURSY_ROUTES.map((section) => section.path),
  ...DEYATELNOST_ROUTES.map((section) => section.path),
  ...ARCHIV_ROUTES.map((section) => section.path),
  ...SECTION_PAGE_ROUTES.map((section) => section.path),
].map(normalizeRoute));

function assertKnownRoute(path, label) {
  const normalized = normalizeRoute(path);
  if (normalized.startsWith("/admin/")) return;
  if (normalized.includes("#")) {
    assert.fail(`${label} points to unsupported hash anchor: ${path}`);
    return;
  }
  assert.ok(knownRoutes.has(normalized), `${label} points to an existing route: ${path}`);
}

[
  ...keyEvents.map((item) => [item.href, `key event ${item.title}`]),
  ...mainSections.map((item) => [item.href, `main section ${item.title}`]),
  ...directions.map((item) => [item.href, `direction ${item.title}`]),
  ...HUB_HOME_PAGE_ROUTES.flatMap((route) => route.config.cards.map((item) => [item.href, `hub card ${route.path} ${item.title}`])),
  ...HUB_HOME_PAGE_ROUTES.flatMap((route) => (route.config.latestNews?.items || []).map((item) => [item.href, `hub latest ${route.path} ${item.title}`])),
].forEach(([href, label]) => assertKnownRoute(href, label));

[
  "/metodicheskoe-prostranstvo/",
  "/innovacionnaya-deyatelnost/",
  "/vospitatelnoe-prostranstvo/",
  "/municipalnyy-semeynyy-klub-familiya/",
].forEach((path) => assertKnownRoute(path, `approved public route ${path}`));

const megaMenuSource = readFileSync(new URL("../src/features/nav/MegaMenu.jsx", import.meta.url), "utf8");
const megaMenuLinks = [...megaMenuSource.matchAll(/link\("([^"]+)",\s*"([^"]+)"\)/g)]
  .map((match) => ({ label: match[1], path: match[2] }));

assert.ok(megaMenuLinks.length > 20, "mega menu links are discoverable");
megaMenuLinks.forEach((item) => assertKnownRoute(item.path, `mega menu ${item.label}`));
assert.ok(!megaMenuLinks.some((item) => item.path === "/metodika/"), "mega menu does not link the old methodika root route");
assert.ok(!megaMenuLinks.some((item) => item.label === "Методика"), "mega menu does not expose the old Methodika label");
assert.ok(!megaMenuLinks.some((item) => item.label === "Инновации"), "mega menu uses Инновационная деятельность instead of Инновации");
assert.ok(!megaMenuLinks.some((item) => item.label === "КПК"), "mega menu uses full public wording for courses");

const headerSource = readFileSync(new URL("../src/features/nav/Header.jsx", import.meta.url), "utf8");
const headerLinks = [...headerSource.matchAll(/\{\s*label:\s*"([^"]+)",\s*href:\s*"([^"]+)"\s*\}/g)]
  .map((match) => ({ label: match[1], path: match[2] }));
assert.deepEqual(
  headerLinks.slice(0, 6),
  [
    { label: "Главная", path: "/" },
    { label: "Сведения об образовательной организации", path: "/sveden/" },
    { label: "ТПМПК", path: "/tpmpk/" },
    { label: "Новости", path: "/novosti/" },
    { label: "Безопасность", path: "/sveden/ovz/" },
    { label: "Музей", path: "/deyatelnost/muzey/" },
  ],
  "header keeps only the approved main public nav items",
);
headerLinks.slice(0, 6).forEach((item) => assertKnownRoute(item.path, `header ${item.label}`));
assert.ok(!headerLinks.some((item) => item.label === "Об организации"), "header uses full organization information title");
assert.ok(!headerLinks.some((item) => item.label === "Методика"), "header does not expose old Methodika label");
assert.ok(headerSource.includes("header-search-submit"), "header search panel has an explicit submit button");
assert.ok(headerSource.includes("onSearchKeyDown"), "header search handles Enter in the search input");
assert.ok(!/\.header-icon-btn\s*\{\s*display:\s*none;/m.test(headerSource), "header keeps the accessibility button available on mobile");
assert.ok(!/\.header-nav\s*\{[\s\S]*?overflow:\s*hidden;/m.test(headerSource), "header navigation is not clipped with overflow hidden");
assert.ok(headerSource.includes("@media (max-width: 1279px)"), "header switches to compact mode before desktop navigation starts clipping");

const megaGroupTitles = [...megaMenuSource.matchAll(/groupTitle:\s*"([^"]+)"/g)].map((match) => match[1]);
assert.deepEqual(
  megaGroupTitles,
  [
    "Быстрый переход",
    "Сведения об образовательной организации",
    "ТПМПК",
    "НОКО",
    "Курсы повышения квалификации",
    "Методическое пространство",
    "Конкурсы и олимпиады",
    "Дом учителя",
    "Деятельность",
    "Музей",
    "Дополнительные разделы",
  ],
  "mega menu groups follow the approved compact structure",
);
assert.ok(megaMenuSource.includes("activeGroupId"), "mega menu uses a compact selected-group panel instead of showing every group at once");
assert.ok(megaMenuSource.includes("mega-group-tabs"), "mega menu renders group controls separately from the active group content");
assert.ok(megaMenuSource.includes("ACTION_LINKS"), "mega menu keeps the dedicated quick actions data");
assert.ok(megaMenuSource.includes("mega-action-panel"), "mega menu renders the dedicated quick actions panel");
assert.ok(megaMenuSource.includes("mega-action-links"), "mega menu keeps quick action buttons in a separate compact row");
assert.ok(megaMenuSource.includes("width: min(1280px, calc(100% - 32px))"), "mega menu is constrained as a wide navigation panel");
assert.ok(megaMenuSource.includes("background: rgba(71, 119, 153, 0.92)"), "mega menu uses a blue overlay based on the public palette");
assert.ok(!megaMenuSource.includes("rgba(71, 119, 153, 0.96)"), "mega menu panel does not blend into the blue page background");
assert.ok(megaMenuSource.includes("background: transparent"), "mega menu outer container lets the separate white panels sit on the overlay");
assert.ok(megaMenuSource.includes("max-height: calc(100vh - 112px)"), "mega menu can be tall without overflowing the viewport");
assert.ok(megaMenuSource.includes("grid-template-columns: 300px minmax(0, 1fr)"), "mega menu uses the wide two-column navigation layout");
assert.ok(megaMenuSource.includes("min-height: clamp(360px, 58vh, 528px)"), "mega menu main panel keeps the large screenshot-like composition");

const footerSource = readFileSync(new URL("../src/components/Footer.jsx", import.meta.url), "utf8");
const footerLinks = [...footerSource.matchAll(/\{\s*label:\s*"([^"]+)",\s*to:\s*"([^"]+)"\s*\}/g)]
  .map((match) => ({ label: match[1], path: match[2] }));

assert.ok(footerLinks.length > 8, "footer internal links are discoverable");
footerLinks.forEach((item) => assertKnownRoute(item.path, `footer ${item.label}`));
assert.ok(!footerLinks.some((item) => item.path === "/metodika/"), "footer does not link the old methodika root route");

const homePageSource = readFileSync(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
assert.ok(!megaMenuLinks.some((item) => item.path === "/#calendar"), "mega menu does not link the removed calendar block");
assert.ok(!footerLinks.some((item) => item.path === "/#calendar"), "footer does not link the removed calendar block");
assert.ok(!homePageSource.includes("EventsSection"), "home page does not render the removed events/calendar block");
assert.ok(!homePageSource.includes("#calendar"), "home page does not keep removed calendar hash behavior");
assert.ok(!directions.some((item) => item.href === "/metodika/" || item.title === "Методика"), "home carousel uses Методическое пространство instead of old Методика");

const publicPaletteFiles = [
  "../src/App.jsx",
  "../src/features/calendar/EventCalendar.jsx",
  "../src/features/events/EventsSection.jsx",
  "../src/features/nav/Header.jsx",
  "../src/features/nav/MegaMenu.jsx",
  "../src/pages/HomePage.jsx",
  "../src/pages/Smart404.jsx",
  "../src/pages/hubs/HubPages.jsx",
];

const purpleAccentPattern = /#(?:7C3AED|6D28D9|8B5CF6|C4B5FD|F5F3FF|F3EEFF|EDE9FE)|violet/iu;
for (const file of publicPaletteFiles) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  assert.ok(!purpleAccentPattern.test(source), `${file} does not use purple public accents`);
}
