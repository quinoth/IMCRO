import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SECTION_HOME_CARDS,
  SECTION_PAGE_ROUTES,
  SECTION_TREE,
  findSectionByPath,
  flattenSectionTree,
} from "../src/pages/sections/sectionStructure.js";

const standardSubsections = [
  "Новости / события",
  "ГМС",
  "Методические материалы",
  "Конференции, вебинары, семинары, мастер-классы",
  "Олимпиады, конкурсы",
];

const youngSpecialistSubsections = [
  "Совет молодых педагогов города Иркутска",
  "Полезная информация для молодых педагогов",
];

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

const standardMethodicalDirections = methodicalDirections.filter((title) => title !== "Молодые специалисты");

const expectedTree = [
  {
    title: "ТПМПК",
    children: [
      "Перечень документов для прохождения ПМПК",
      "Состав территориальной ПМПК",
      "Нормативные документы",
    ],
  },
  {
    title: "НОКО",
    children: [
      "Оперативная информация",
      {
        title: "ГИА 9 класс",
        children: [
          "Оперативная информация",
          "Нормативные документы",
          "Методическое сопровождение",
          "Для участников с ОВЗ",
        ],
      },
      {
        title: "ГИА 11 (12) класс",
        children: [
          "Оперативная информация",
          "Нормативные документы",
          "Методическое сопровождение",
          "Для участников с ОВЗ",
        ],
      },
      "Сборники и альманахи",
    ],
  },
  {
    title: "Молодые педагоги",
    children: [
      "Совет молодых педагогов города Иркутска",
      "Полезная информация для молодых педагогов",
    ],
  },
  {
    title: "Курсы повышения квалификации",
    children: [
      "Список курсов повышения квалификации",
      "Мониторинг профессиональных дефицитов педагогических работников города",
    ],
  },
  {
    title: "Наставничество",
    children: [
      "Нормативные документы",
      "Найти наставника",
      "Новости / события",
    ],
  },
  {
    title: "НСУ СКИП",
    children: [
      "Основная информация",
      "Новости / события",
    ],
  },
  {
    title: "Конкурсы",
    children: [
      "Для детей",
      {
        title: "Для педагогов",
        children: [
          "Конкурсы методических разработок",
          "«Новая волна»",
          "«Сердце отдаю детям»",
          "Лучший педагог / воспитатель ДОУ",
          "«Учитель года»",
          "«Урок в формате ФГОС-3.0»",
        ],
      },
    ],
  },
  {
    title: "Олимпиады для детей",
    children: [
      {
        title: "Всероссийская олимпиада школьников",
        children: [
          "Школьный этап",
          "Муниципальный этап",
          "Результаты",
        ],
      },
      {
        title: "Муниципальные и региональные олимпиады",
        children: [
          "Муниципальные олимпиады",
          "Региональные олимпиады",
        ],
      },
    ],
  },
  {
    title: "Конференции для детей",
    children: [
      {
        title: "Муниципальные конференции",
        children: [
          "Городская конференция проектно-исследовательских работ обучающихся 1-4 классов «Ступеньки открытий»",
          "Городская научно-практическая конференция учащихся 5-8 классов «Эврика»",
          "Городская конференция для обучающихся 4-11 классов «Открытый Мир: информационные технологии в образовательном пространстве»",
          "Городская научно-практическая конференция учащихся 9-11 классов «Юность. Творчество. Поиск»",
          "Пятая городская конференция проектно-исследовательских работ обучающихся 7-11 классов «Удивительная Вселенная»",
        ],
      },
      {
        title: "Региональные конференции",
        children: [
          "Региональная научно-практическая конференция «Тайны психологии»",
        ],
      },
      "Всероссийские конференции",
    ],
  },
  {
    title: "Образовательные события",
    children: [
      "Конференции РАО",
      "Августовские педагогические совещания",
      "Образовательная панорама",
      "Образовательный форум",
    ],
  },
  {
    title: "Полезная информация",
    children: [
      "Осторожно, мошенники!",
    ],
  },
  { title: "Дом учителя", children: [] },
  { title: "Деятельность", children: [] },
  { title: "Методическое пространство", children: methodicalDirections },
  { title: "Инновационная деятельность", children: standardSubsections },
  { title: "Воспитательное пространство", children: standardSubsections },
  { title: "Муниципальный семейный клуб «ФамилиЯ»", children: [] },
];

function childTitles(node) {
  return (node.children || []).map((child) => typeof child === "string" ? child : child.title);
}

function assertTreeNode(actualNode, expectedNode) {
  assert.ok(actualNode, `section exists: ${expectedNode.title}`);
  assert.deepEqual(childTitles(actualNode), childTitles(expectedNode), `${expectedNode.title} keeps the requested child order`);
  for (const expectedChild of expectedNode.children || []) {
    if (typeof expectedChild === "string") continue;
    const actualChild = actualNode.children.find((child) => child.title === expectedChild.title);
    assertTreeNode(actualChild, expectedChild);
  }
}

assert.deepEqual(
  SECTION_TREE.map((section) => section.title),
  expectedTree.map((section) => section.title),
  "root sections follow the prompt order",
);

for (const expectedNode of expectedTree) {
  assertTreeNode(SECTION_TREE.find((section) => section.title === expectedNode.title), expectedNode);
}

for (const title of standardMethodicalDirections) {
  const direction = flattenSectionTree(SECTION_TREE).find((section) => section.title === title && section.parentTitle === "Методическое пространство");
  assert.ok(direction, `methodical direction exists: ${title}`);
  assert.deepEqual(childTitles(direction), standardSubsections, `${title} uses the standard public subsection set`);
}

const youngSpecialists = findSectionByPath("/metodicheskoe-prostranstvo/molodye-specialisty/");
assert.ok(youngSpecialists, "Молодые специалисты section exists");
assert.deepEqual(childTitles(youngSpecialists), youngSpecialistSubsections, "Молодые специалисты keeps only the two special cards");

const flatNodes = flattenSectionTree(SECTION_TREE);
const routePaths = SECTION_PAGE_ROUTES.map((route) => route.path);

assert.equal(routePaths.length, flatNodes.length, "every section node has a page route");
assert.equal(new Set(routePaths).size, routePaths.length, "section routes are unique");
for (const node of flatNodes) {
  assert.ok(node.path.startsWith("/") && node.path.endsWith("/"), `${node.title} has normalized route path`);
  assert.ok(routePaths.includes(node.path), `${node.title} route is registered`);
}

assert.deepEqual(
  SECTION_HOME_CARDS.map((card) => card.title),
  expectedTree.map((section) => section.title),
  "home cards mirror only the requested root sections",
);
assert.deepEqual(
  SECTION_HOME_CARDS.map((card) => card.href),
  SECTION_TREE.map((section) => section.path),
  "home cards link to root section pages",
);

[
  "/metodicheskoe-prostranstvo/",
  "/metodicheskoe-prostranstvo/doshkolnoe-obrazovanie/",
  "/metodicheskoe-prostranstvo/doshkolnoe-obrazovanie/novosti-sobytiya/",
  "/metodicheskoe-prostranstvo/russkiy-yazyk/",
  "/metodicheskoe-prostranstvo/psihologi/",
  "/metodicheskoe-prostranstvo/psihologi/gms/",
  "/metodicheskoe-prostranstvo/molodye-specialisty/",
  "/metodicheskoe-prostranstvo/molodye-specialisty/sovet-molodyh-pedagogov/",
  "/metodicheskoe-prostranstvo/molodye-specialisty/poleznaya-informaciya-dlya-molodyh-pedagogov/",
  "/metodicheskoe-prostranstvo/metodicheskie-materialy/",
  "/innovacionnaya-deyatelnost/",
  "/innovacionnaya-deyatelnost/olimpiady-konkursy/",
  "/vospitatelnoe-prostranstvo/",
  "/vospitatelnoe-prostranstvo/metodicheskie-materialy/",
  "/municipalnyy-semeynyy-klub-familiya/",
  "/noko/gia-11/",
  "/noko/gia-11/operativnaya-informaciya/",
  "/noko/gia-11/normativnye-dokumenty/",
  "/noko/gia-11/metodicheskoe-soprovozhdenie/",
  "/noko/gia-11/dlya-uchastnikov-s-ovz/",
  "/noko/sborniki/",
].forEach((path) => {
  assert.ok(routePaths.includes(path), `approved route exists: ${path}`);
});

[
  "/predmetnye-oblasti/",
  "/predmetnye-oblasti/novosti-sobytiya/",
  "/predmetnye-oblasti/gms/",
  "/predmetnye-oblasti/metodicheskie-materialy/",
  "/predmetnye-oblasti/konferencii-vebinary-seminary-master-klassy/",
  "/predmetnye-oblasti/olimpiady-konkursy/",
  "/metodika/",
  "/noko/gia-11-12/",
  "/noko/sborniki-i-almanahi/",
].forEach((path) => {
  assert.ok(!routePaths.includes(path), `section structure does not keep duplicate or old route: ${path}`);
});

const homePageSource = readFileSync(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
assert.ok(!homePageSource.includes("EventsSection"), "home page does not render the removed events/calendar block");
assert.ok(!homePageSource.includes("#calendar"), "home page has no removed calendar hash behavior");

const megaMenuSource = readFileSync(new URL("../src/features/nav/MegaMenu.jsx", import.meta.url), "utf8");
assert.ok(!megaMenuSource.includes("/#calendar"), "mega menu does not point to removed home calendar block");
assert.ok(!megaMenuSource.includes('"/metodika/"'), "mega menu no longer links the old methodika public route");
assert.ok(!megaMenuSource.includes("Предметные области"), "mega menu does not expose the removed Predmetnye oblasti section");
assert.ok(!megaMenuSource.includes("/predmetnye-oblasti/"), "mega menu does not link the removed Predmetnye oblasti route");

const sectionPageSource = readFileSync(new URL("../src/pages/sections/SectionPages.jsx", import.meta.url), "utf8");
const hubSectionLayoutSource = readFileSync(new URL("../src/pages/hubs/HubSectionPageLayout.jsx", import.meta.url), "utf8");
assert.ok(sectionPageSource.includes("HubSectionPageLayout"), "section route page renders the shared section layout");
for (const componentName of ["HubSectionPageLayout", "ArticleList", "ArticleCard"]) {
  assert.ok(hubSectionLayoutSource.includes(`export function ${componentName}`), `${componentName} component is implemented`);
}

const appSource = readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
assert.ok(appSource.includes("SECTION_DETAIL_ROUTES.map"), "section detail routes are rendered from the shared structure config");
assert.ok(appSource.includes("LegacyEducationalEventsRedirect"), "legacy educational program routes redirect to educational events routes");
