import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const breadcrumbsSource = source("src/components/Breadcrumbs.jsx");
const indexCss = source("src/index.css");
const svedeniyaCss = source("src/pages/svedeniya/SvedeniyaPage.css");
const headerSource = source("src/features/nav/Header.jsx");
const hubHomeLayout = source("src/pages/hubs/HubHomePageLayout.jsx");
const hubSectionLayout = source("src/pages/hubs/HubSectionPageLayout.jsx");
const tpmpkInfoPage = source("src/pages/tpmpk/TpmpkInfoPage.jsx");
const tpmpkPagesData = source("src/pages/tpmpk/tpmpkPagesData.js");

assert.ok(
  breadcrumbsSource.includes("item.to || item.href"),
  "Breadcrumbs accepts both to and href items so public layouts can share it",
);
assert.ok(
  breadcrumbsSource.includes("app-breadcrumbs-separator"),
  "Breadcrumbs keeps a shared separator element",
);
assert.ok(
  indexCss.includes(".imcro-public-page .app-breadcrumbs") && indexCss.includes(".ti-page .app-breadcrumbs"),
  "Public blue pages have a shared light breadcrumb context",
);
assert.ok(
  indexCss.includes("color: rgba(255, 255, 255, 0.82);") && indexCss.includes("color: var(--imcro-color-surface);"),
  "Breadcrumbs on blue backgrounds use light readable text",
);
assert.ok(
  svedeniyaCss.includes("--sv-on-bg: var(--imcro-color-surface, #FFFFFF);"),
  "Svedeniya page defines a light text token for labels on the public blue background",
);
assert.ok(
  /\.sv-overview-head\s+\.sv-section-label\s*\{[^}]*color:\s*var\(--sv-on-bg-muted\);/s.test(svedeniyaCss),
  "Svedeniya navigation eyebrow on the blue background is light",
);
assert.ok(
  /\.sv-overview-head\s+h2\s*\{[^}]*color:\s*var\(--sv-on-bg\);/s.test(svedeniyaCss),
  "Svedeniya 'Подразделы' heading on the blue background is white",
);

assert.ok(
  /\.sv-section-kicker\s*\{[^}]*color:\s*var\(--sv-on-bg-muted\);/s.test(svedeniyaCss),
  "Svedeniya section kickers on the blue background are light",
);
assert.ok(
  /\.sv-section-head\s+h2\s*\{[^}]*color:\s*var\(--sv-on-bg\);/s.test(svedeniyaCss),
  "Svedeniya section headings on the blue background are white",
);
assert.ok(
  /\.sv-section-head\s+p\s*\{[^}]*color:\s*var\(--sv-on-bg-muted\);/s.test(svedeniyaCss),
  "Svedeniya section descriptions on the blue background are light",
);
assert.ok(
  /\.sv-block\s*>\s*\.sv-block-title\s*\{[^}]*color:\s*var\(--sv-on-bg\);/s.test(svedeniyaCss),
  "Svedeniya transparent section block titles on the blue background are white",
);
assert.ok(
  /\.sv-section-head\s+\.sv-section-icon\s*\{[^}]*color:\s*var\(--sv-on-bg\);/s.test(svedeniyaCss),
  "Svedeniya section icons on the blue background use the light foreground",
);
assert.ok(
  /\.sv-status\s*\{[^}]*color:\s*var\(--sv-on-bg\);/s.test(svedeniyaCss),
  "Svedeniya status chips on the blue background use light text",
);
assert.ok(
  /@media\s*\(max-width:\s*420px\)[\s\S]*\.header-icon-btn,[\s\S]*min-width:\s*44px;[\s\S]*min-height:\s*44px;/s.test(headerSource),
  "Mobile Header keeps icon buttons at accessible 44px touch size on narrow screens",
);
assert.ok(
  /@media\s*\(max-width:\s*420px\)[\s\S]*\.header-actions\s*\{[\s\S]*overflow:\s*visible;/s.test(headerSource),
  "Mobile Header actions do not clip icons on narrow screens",
);
assert.ok(
  /@media\s*\(max-width:\s*1279px\)[\s\S]*\.header-actions\s*\{[\s\S]*grid-column:\s*3;/s.test(headerSource),
  "Mobile Header explicitly keeps action buttons in the right grid column",
);

assert.ok(
  hubHomeLayout.includes('import Breadcrumbs from "../../components/Breadcrumbs.jsx";'),
  "Hub home layout uses the shared public Breadcrumbs component",
);
assert.ok(!hubHomeLayout.includes("function Breadcrumbs("), "Hub home layout does not keep a local breadcrumb duplicate");
assert.ok(
  hubSectionLayout.includes('import Breadcrumbs from "../../components/Breadcrumbs.jsx";'),
  "Hub section layout uses the shared public Breadcrumbs component",
);
assert.ok(!hubSectionLayout.includes("function BreadcrumbTrail("), "Hub section layout does not keep a local breadcrumb duplicate");

for (const slug of ["dokumenty", "sostav", "npa"]) {
  assert.ok(tpmpkPagesData.includes(`${slug}:`), `TPMPK info data keeps the ${slug} page`);
}

assert.ok(
  tpmpkInfoPage.includes("--ti-page-bg: var(--imcro-color-bg, #477799);"),
  "TPMPK info pages map to the IMCRO public page background",
);
assert.ok(
  tpmpkInfoPage.includes("--ti-primary: var(--imcro-color-primary, #1F5073);"),
  "TPMPK info pages map to the IMCRO primary accent",
);
assert.ok(
  tpmpkInfoPage.includes("background: var(--ti-page-bg);"),
  "TPMPK info pages use the blue public page background",
);
assert.ok(
  tpmpkInfoPage.includes("background: var(--ti-surface);"),
  "TPMPK info page hero and content blocks are white surfaces",
);
assert.ok(
  tpmpkInfoPage.includes("border-radius: var(--imcro-radius-card"),
  "TPMPK info page blocks use the shared public card radius",
);
assert.ok(
  tpmpkInfoPage.includes('className={`ti-page ti-page--${page.slug}`}'),
  "TPMPK info pages expose their slug for page-specific visual checks",
);

const forbiddenOldPublicColors = /#(?:19789c|004f75|edf6f8|b8d4dd|fbfdff|f3f9fb)|rgba\(25,\s*120,\s*156/iu;
assert.ok(
  !forbiddenOldPublicColors.test(tpmpkInfoPage),
  "TPMPK info template no longer uses the old public blue palette",
);
