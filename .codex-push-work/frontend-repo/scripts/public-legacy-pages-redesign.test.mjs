import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const app = source("src/App.jsx");
const indexCss = source("src/index.css");
const newsPages = source("src/pages/domUchitelya/DomUchitelyaPages.jsx");
const articlePage = source("src/pages/ArticlePage.jsx");
const authorPage = source("src/pages/AuthorArticlesPage.jsx");
const smart404 = source("src/pages/Smart404.jsx");
const hubPages = source("src/pages/hubs/HubPages.jsx");
const newsCard = source("src/features/news/NewsCard.jsx");

const checkedPublicSources = [
  ["App.jsx", app],
  ["DomUchitelyaPages.jsx", newsPages],
  ["ArticlePage.jsx", articlePage],
  ["AuthorArticlesPage.jsx", authorPage],
  ["Smart404.jsx", smart404],
  ["HubPages.jsx", hubPages],
  ["NewsCard.jsx", newsCard],
];

const forbiddenOldPublicPalette =
  /#(?:1D4ED8|2563EB|1e3a8a|19789c|004f75|edf6f8|b8d4dd|ecfdf5|047857|059669|D97706|B45309|FEF3C7|FFFBEB|fbfdff)|rgba\(124,\s*58,\s*237|violet|purple/iu;

for (const [label, text] of checkedPublicSources) {
  assert.ok(
    !forbiddenOldPublicPalette.test(text),
    `${label} does not keep the old public palette or purple accents`,
  );
}

assert.ok(
  newsPages.includes("background: var(--imcro-color-bg);"),
  "Common news and Dom Uchitelya shell use the IMCRO public blue background",
);
assert.ok(
  newsPages.includes("Актуальные новости, объявления и материалы МКУ ИМЦРО."),
  "/novosti/ has the requested public hero description",
);
assert.ok(
  newsPages.includes("Новости пока не опубликованы."),
  "/novosti/ keeps a white empty state for an empty news list",
);

assert.ok(articlePage.includes('className="article-page"'), "Article detail page exposes the public article-page class");
assert.ok(articlePage.includes("background: var(--imcro-color-bg);"), "Article detail page uses the public blue background");
assert.ok(articlePage.includes("className=\"article-card\""), "Article detail content is rendered in a white card");
assert.ok(articlePage.includes("Вернуться назад"), "Article detail page keeps a back action");

assert.ok(authorPage.includes('className="author-page"'), "Author page exposes the public author-page class");
assert.ok(authorPage.includes('import Breadcrumbs from "../components/Breadcrumbs.jsx";'), "Author page uses shared breadcrumbs");
assert.ok(authorPage.includes("background: var(--imcro-color-bg);"), "Author page uses the public blue background");

assert.ok(smart404.includes('href: "/dom-uchitelya/"'), "Smart404 points Dom Uchitelya to an existing public route");
assert.ok(smart404.includes('href: "/metodicheskoe-prostranstvo/"'), "Smart404 points Methodical space to an existing public route");
assert.ok(smart404.includes("background: var(--imcro-color-bg);"), "Smart404 uses the public blue background");

assert.ok(hubPages.includes("background: var(--imcro-color-bg);"), "Legacy hub shell uses the public blue background");
assert.ok(hubPages.includes("background: var(--imcro-color-primary);"), "Legacy hub actions use the IMCRO primary accent");

for (const pageClass of ["article-page", "author-page", "domu-page", "hub-page", "smart404-page"]) {
  assert.ok(
    indexCss.includes(`.${pageClass} .app-breadcrumbs`),
    `${pageClass} is included in the shared light breadcrumb context`,
  );
}

assert.ok(
  app.includes("const PUBLIC_CATEGORY_STYLE"),
  "Public article categories share the constrained IMCRO category palette",
);

console.log("public legacy pages redesign tests passed");
