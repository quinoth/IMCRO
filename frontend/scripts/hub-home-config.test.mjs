import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  HUB_HOME_CONFIGS,
  HUB_HOME_PAGE_ROUTES,
  NOKO_HUB_HOME_CONFIG,
} from "../src/pages/hubs/hubHomeConfig.js";
import { DEYATELNOST_ROUTES } from "../src/features/admin/articleTaxonomy.js";
import { DOMU_SECTIONS } from "../src/pages/domUchitelya/domuSections.js";

const methodicalDirections = [
  "Дошкольное образование",
  "Начальное общее образование",
  "Дополнительное образование",
  "История",
  "История нашего края",
  "Обществознание",
  "ДНКР",
  "Русский язык",
  "Иностранные языки",
  "Математика",
  "Информатика",
  "Химия",
  "Биология",
  "География",
  "Байкаловедение",
  "Физкультура",
  "ОБЖ",
  "Технология",
  "Воспитание",
  "Психологи",
  "Социальные педагоги",
  "Методические материалы",
  "Молодые специалисты",
];

const standardSubsections = [
  "Новости / события",
  "ГМС",
  "Методические материалы",
  "Конференции, вебинары, семинары, мастер-классы",
  "Олимпиады, конкурсы",
];

const expectedSections = [
  {
    path: "/tpmpk/",
    title: "ТПМПК",
    cards: [
      "Перечень документов для прохождения ПМПК",
      "Состав территориальной ПМПК",
      "Нормативные документы",
    ],
  },
  {
    path: "/noko/",
    title: "Независимая оценка качества образования",
    cards: [
      "Оперативная информация",
      "ГИА 9 класс",
      "ГИА 11 (12) класс",
      "Сборники и альманахи",
    ],
  },
  {
    path: "/molodye-pedagogi/",
    title: "Молодые педагоги",
    cards: [
      "Совет молодых педагогов города Иркутска",
      "Полезная информация для молодых педагогов",
    ],
  },
  {
    path: "/kpk/",
    title: "Курсы повышения квалификации",
    cards: [
      "Список курсов повышения квалификации",
      "Мониторинг профессиональных дефицитов педагогических работников города",
    ],
  },
  {
    path: "/nastavnichestvo/",
    title: "Наставничество",
    cards: [
      "Нормативные документы",
      "Найти наставника",
      "Новости / события",
    ],
  },
  {
    path: "/nsu-skip/",
    title: "НСУ СКИП",
    cards: [
      "Основная информация",
      "Новости / события",
    ],
  },
  {
    path: "/konkursy/",
    title: "Конкурсы",
    cards: [
      "Для детей",
      "Для педагогов",
    ],
  },
  {
    path: "/olimpiady-dlya-detey/",
    title: "Олимпиады для детей",
    cards: [
      "Всероссийская олимпиада школьников",
      "Муниципальные и региональные олимпиады",
    ],
  },
  {
    path: "/konferencii-dlya-detey/",
    title: "Конференции для детей",
    cards: [
      "Муниципальные конференции",
      "Региональные конференции",
      "Всероссийские конференции",
    ],
  },
  {
    path: "/obrazovatelnye-sobytiya/",
    title: "Образовательные события",
    cards: [
      "Конференции РАО",
      "Августовские педагогические совещания",
      "Образовательная панорама",
      "Образовательный форум",
    ],
  },
  {
    path: "/poleznaya-informaciya/",
    title: "Полезная информация",
    cards: [
      "Осторожно, мошенники!",
    ],
  },
  {
    path: "/dom-uchitelya/",
    title: "Дом учителя",
    cards: [
      "О структурном подразделении",
      "Мероприятия",
      "Контактная информация",
    ],
  },
  {
    path: "/deyatelnost/",
    title: "Деятельность",
    cards: DEYATELNOST_ROUTES.map((section) => section.title),
  },
  {
    path: "/metodicheskoe-prostranstvo/",
    title: "Методическое пространство",
    cards: methodicalDirections,
  },
  {
    path: "/innovacionnaya-deyatelnost/",
    title: "Инновационная деятельность",
    cards: standardSubsections,
  },
  {
    path: "/vospitatelnoe-prostranstvo/",
    title: "Воспитательное пространство",
    cards: standardSubsections,
  },
  {
    path: "/municipalnyy-semeynyy-klub-familiya/",
    title: "Муниципальный семейный клуб «ФамилиЯ»",
    cards: [],
  },
];

assert.equal(Object.keys(HUB_HOME_CONFIGS).length, expectedSections.length, "all requested root hub configs are exported");
assert.deepEqual(HUB_HOME_PAGE_ROUTES.map((item) => item.path), expectedSections.map((item) => item.path), "hub home routes keep the requested order");
assert.equal(NOKO_HUB_HOME_CONFIG, HUB_HOME_CONFIGS["/noko/"], "NOKO keeps the same config object");
assert.deepEqual(DOMU_SECTIONS.map((section) => section.title), expectedSections.find((section) => section.path === "/dom-uchitelya/").cards, "Дом учителя exposes only the requested three subsections");

for (const expected of expectedSections) {
  const config = HUB_HOME_CONFIGS[expected.path];
  assert.ok(config, `${expected.title} config exists`);
  assert.equal(config.title, expected.title, `${expected.title} title is correct`);
  assert.ok(config.description && !config.description.toLowerCase().includes("lorem"), `${expected.title} has an official description`);
  assert.deepEqual(config.cards.map((card) => card.title), expected.cards, `${expected.title} cards follow the requested order`);
  assert.ok(config.cards.every((card) => card.href?.startsWith("/") && card.href.endsWith("/")), `${expected.title} card links are normalized routes`);
  if (expected.path === "/dom-uchitelya/") {
    assert.equal(config.latestNews, undefined, "Дом учителя does not render an extra latest-materials block");
    assert.equal(config.contactBlock, undefined, "Дом учителя keeps contact information as a card, not an extra contact panel");
  } else {
    assert.equal(config.latestNews?.items?.length, 3, `${expected.title} has 3 temporary latest materials`);
    assert.ok(config.latestNews.items.every((item) => item.title && item.date && item.href), `${expected.title} latest materials are complete`);
    assert.ok(config.contactBlock?.title, `${expected.title} has contact block title`);
    assert.ok(config.contactBlock?.description, `${expected.title} has contact block description`);
    assert.ok(config.contactBlock?.contacts?.length >= 1, `${expected.title} has contact data`);
  }
}

[
  "/noko/operativnaya-informaciya/",
  "/noko/gia-9/",
  "/noko/gia-11/",
  "/noko/sborniki/",
].forEach((path) => {
  assert.ok(NOKO_HUB_HOME_CONFIG.cards.some((card) => card.href === path), `NOKO keeps route ${path}`);
});

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
assert.ok(/HUB_HOME_PAGE_ROUTES[\s\S]*\.map/.test(appSource), "App renders hub home routes from config");
assert.ok(appSource.includes("SectionRoutePage"), "App has generic section route placeholders for card links");
assert.ok(!appSource.includes('path="/dom-uchitelya/" element={<DomUchitelyaHome'), "Дом учителя root page uses HubHomePageLayout route");
assert.ok(!appSource.includes('path="/metodika/" element={<MethodikaHomePage'), "old Методика root page is not rendered as a public hub home");
assert.ok(!appSource.includes('path="/deyatelnost/" element={<DeyatelnostHomePage'), "Деятельность root page uses HubHomePageLayout route");

const layoutSource = readFileSync(new URL("../src/pages/hubs/HubHomePageLayout.jsx", import.meta.url), "utf8");
const configSource = readFileSync(new URL("../src/pages/hubs/hubHomeConfig.js", import.meta.url), "utf8");
const layoutStyles = readFileSync(new URL("../src/pages/hubs/HubHomePageLayout.css", import.meta.url), "utf8");

const tpmpkConfig = HUB_HOME_CONFIGS["/tpmpk/"];
assert.deepEqual(tpmpkConfig.heroAction, { text: "Записаться на приём", href: "/tpmpk/zapis" }, "ТПМПК has a primary appointment action");
assert.equal(tpmpkConfig.contactBlock.actionText, "Записаться на приём", "ТПМПК repeats appointment action in the contact block");
assert.equal(tpmpkConfig.contactBlock.actionHref, "/tpmpk/zapis", "ТПМПК appointment action uses the existing public form route");
assert.ok(layoutSource.includes("heroAction"), "hub layout supports a top-block action");
assert.ok(layoutSource.includes("ImcroButton"), "hub layout renders the top-block action as an ImcroButton");
assert.ok(layoutStyles.includes("hub-home-hero-actions"), "hub layout styles the top-block action");

assert.ok(!configSource.includes('"/metodika/"'), "hub home config does not expose the old public methodika route");
assert.ok(!configSource.includes('"/predmetnye-oblasti/"'), "hub home config does not expose the removed Predmetnye oblasti route");
assert.ok(!configSource.includes("Предметные области"), "hub home config does not expose the removed Predmetnye oblasti label");
assert.ok(!/tailwind|grid-cols-\d|bg-\[|text-\[|rounded-\[|shadow-\[/i.test(layoutSource + configSource), "hub home pages do not use Tailwind utility classes");
assert.ok(!/#(?:7C3AED|6D28D9|8B5CF6|C4B5FD|F5F3FF|F3EEFF|EDE9FE|92400E|B45309|F59E0B|D97706)/i.test(configSource), "hub home config avoids banned accent colors");
