import { DEYATELNOST_ROUTES } from "../../features/admin/articleTaxonomy.js";
import { DOMU_SECTIONS } from "../domUchitelya/domuSections.js";
import { SECTION_TREE, normalizePath } from "../sections/sectionStructure.js";

const DEFAULT_CONTACT_DESCRIPTION = "По вопросам данного раздела вы можете обратиться в МКУ ИМЦРО. Контактная информация будет уточнена.";

const HUB_HOME_SECTION_PATHS = [
  "/tpmpk/",
  "/noko/",
  "/molodye-pedagogi/",
  "/kpk/",
  "/nastavnichestvo/",
  "/nsu-skip/",
  "/konkursy/",
  "/olimpiady-dlya-detey/",
  "/konferencii-dlya-detey/",
  "/obrazovatelnye-sobytiya/",
  "/poleznaya-informaciya/",
  "/dom-uchitelya/",
  "/deyatelnost/",
  "/metodicheskoe-prostranstvo/",
  "/innovacionnaya-deyatelnost/",
  "/vospitatelnoe-prostranstvo/",
  "/municipalnyy-semeynyy-klub-familiya/",
];

const DEYATELNOST_CARD_PATHS = {
  innovacii: "/innovacionnaya-deyatelnost/",
  "povyshenie-kvalifikatsii": "/kpk/",
  vospitanie: "/vospitatelnoe-prostranstvo/",
};

const EXTERNAL_ROOT_SECTIONS = {
  "/dom-uchitelya/": {
    title: "Дом учителя",
    path: "/dom-uchitelya/",
    icon: "people",
    description: "Городская площадка профессионального общения, мероприятий, мастер-классов и методической поддержки педагогов.",
    children: DOMU_SECTIONS.map((section) => ({
      title: section.title,
      path: section.path,
      description: section.text,
      icon: section.icon || (section.path === "/dom-uchitelya/novosti/" ? "document" : "people"),
    })),
  },
  "/deyatelnost/": {
    title: "Деятельность",
    path: "/deyatelnost/",
    icon: "compass",
    description: "Проекты и направления деятельности МКУ ИМЦРО для сопровождения муниципальной системы образования.",
    children: DEYATELNOST_ROUTES.map((section) => ({
      title: section.title,
      path: DEYATELNOST_CARD_PATHS[section.value] || section.path,
      description: section.lead,
      icon: {
        innovacii: "spark",
        muzey: "book",
        "povyshenie-kvalifikatsii": "certificate",
        proforientaciya: "compass",
        vospitanie: "people",
      }[section.value] || "compass",
    })),
  },
};

const TPMPK_APPOINTMENT_ACTION = {
  text: "Записаться на приём",
  href: "/tpmpk/zapis",
};

const NOKO_NEWS_ITEMS = [
  {
    date: "24.08.2024",
    title: "Опубликованы новые методические рекомендации по НОКО",
    href: "/novosti/",
  },
  {
    date: "26.08.2024",
    title: "Вебинар: «Анализ результатов НОКО за первый квартал»",
    href: "/novosti/",
  },
  {
    date: "29.08.2024",
    title: "Обновление статистических данных по качеству образования",
    href: "/novosti/",
  },
];

const NOKO_MATERIAL_CARDS = [
  {
    title: "Оперативная информация",
    description: "Актуальные приказы, распоряжения и срочные уведомления для руководителей образовательных учреждений.",
    href: "/noko/operativnaya-informaciya/",
    icon: "clipboard",
  },
  {
    title: "ГИА 9 класс",
    description: "Методические материалы, демоверсии, спецификации и кодификаторы для подготовки к ОГЭ.",
    href: "/noko/gia-9/",
    icon: "graduation",
  },
  {
    title: "ГИА 11 (12) класс",
    description: "Банк заданий, нормативные документы и аналитические отчёты по результатам ЕГЭ.",
    href: "/noko/gia-11/",
    icon: "certificate",
  },
  {
    title: "Сборники и альманахи",
    description: "Тематические публикации, лучшие практики и исследовательские статьи по качеству образования.",
    href: "/noko/sborniki/",
    icon: "book",
  },
];

const NOKO_CONTACTS = [
  { label: "Ответственный специалист", value: "Иванова Анна Петровна" },
  { label: "Должность", value: "начальник отдела НОКО" },
  { label: "Телефон", value: "+7 (123) 456-78-90", href: "tel:+71234567890" },
  { label: "Кабинет", value: "124" },
  { label: "Электронная почта", value: "noko@imzro.edu.ru", href: "mailto:noko@imzro.edu.ru" },
  { label: "Рабочие часы", value: "Пн-Пт: 09:00-18:00" },
  { label: "Перерыв", value: "13:00-14:00" },
];

export const NOKO_HUB_HOME_CONFIG = {
  breadcrumbs: [
    { label: "Главная", href: "/" },
    { label: "НОКО" },
  ],
  cards: NOKO_MATERIAL_CARDS,
  classNames: {
    breadcrumbs: "noko-breadcrumbs",
    cardsGrid: "noko-materials-grid",
    contactPanel: "noko-contact-panel",
    contactSection: "noko-contact-section",
    heroCopy: "noko-hero-copy",
    heroGrid: "noko-hero-grid",
    heroSection: "noko-hero-section",
    materialsSection: "noko-materials-section",
    newsPanel: "noko-news-panel",
    sectionHead: "noko-section-head",
  },
  contactBlock: {
    title: "Контакты отдела",
    description: "По вопросам независимой оценки качества образования, проведению ГИА и методической поддержке.",
    contacts: NOKO_CONTACTS,
  },
  ctaText: "Перейти",
  description: "Раздел НОКО: оперативная информация, материалы ГИА и тематические сборники для педагогов и руководителей.",
  gridClassName: "imcro-grid-4",
  latestNews: {
    title: "Последние новости",
    items: NOKO_NEWS_ITEMS,
    allHref: "/novosti/",
  },
  mainClassName: "noko-main",
  pageClassName: "noko-page",
  sectionTitle: "Материалы и разделы",
  title: "Независимая оценка качества образования",
};

function findRootSection(path) {
  const normalizedPath = normalizePath(path);
  if (EXTERNAL_ROOT_SECTIONS[normalizedPath]) return EXTERNAL_ROOT_SECTIONS[normalizedPath];
  return SECTION_TREE.find((section) => section.path === normalizedPath);
}

function createLatestMaterials(section) {
  return [
    {
      date: "02.09.2024",
      title: `Обновлены материалы раздела «${section.title}»`,
      href: "/novosti/",
    },
    {
      date: "09.09.2024",
      title: `Подготовлены рекомендации для направления «${section.title}»`,
      href: "/novosti/",
    },
    {
      date: "16.09.2024",
      title: `Опубликована организационная информация раздела «${section.title}»`,
      href: "/novosti/",
    },
  ];
}

function createContacts(section) {
  const contact = section.contact;
  const contacts = [
    {
      label: "Ответственный специалист",
      value: contact?.person || "МКУ ИМЦРО",
    },
  ];

  if (contact?.phone) {
    contacts.push({ label: "Телефон", value: contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, "")}` });
  }

  if (contact?.email) {
    contacts.push({ label: "Электронная почта", value: contact.email, href: `mailto:${contact.email}` });
  }

  if (contact?.schedule) {
    contacts.push({ label: "Рабочие часы", value: contact.schedule });
  }

  if (!contact?.phone && !contact?.email && !contact?.schedule) {
    contacts.push({ label: "Информация", value: "Будет уточнена" });
  }

  return contacts;
}

function createHubHomeConfig(section) {
  const cards = (section.children || []).map((child) => ({
    title: child.title,
    description: child.description,
    href: child.path,
    icon: child.icon || section.icon,
  }));

  return {
    breadcrumbs: [
      { label: "Главная", href: "/" },
      { label: section.title },
    ],
    cards,
    contactBlock: {
      title: section.contact?.title || "Контактная информация",
      description: section.contact?.text || DEFAULT_CONTACT_DESCRIPTION,
      contacts: createContacts(section),
    },
    ctaText: "Перейти",
    description: section.description,
    gridClassName: cards.length > 3 ? "imcro-grid-4" : "imcro-grid-3",
    latestNews: {
      title: "Последние материалы",
      items: createLatestMaterials(section),
      allHref: "/novosti/",
    },
    sectionTitle: cards.length ? "Материалы и разделы" : "",
    title: section.title,
  };
}

function enhanceHubHomeConfig(path, config) {
  if (path === "/dom-uchitelya/") {
    return {
      ...config,
      breadcrumbsOutsideHero: true,
      contactBlock: undefined,
      gridClassName: "imcro-grid-3",
      latestNews: undefined,
      pageClassName: `${config.pageClassName || ""} hub-home-page--light-hero`.trim(),
    };
  }

  if (path !== "/tpmpk/") return config;

  return {
    ...config,
    breadcrumbsOutsideHero: true,
    heroAction: TPMPK_APPOINTMENT_ACTION,
    latestNews: undefined,
    pageClassName: `${config.pageClassName || ""} hub-home-page--light-hero`.trim(),
    contactBlock: {
      ...config.contactBlock,
      actionText: TPMPK_APPOINTMENT_ACTION.text,
      actionHref: TPMPK_APPOINTMENT_ACTION.href,
    },
  };
}

export const HUB_HOME_CONFIGS = Object.fromEntries(
  HUB_HOME_SECTION_PATHS.map((path) => {
    if (path === "/noko/") return [path, NOKO_HUB_HOME_CONFIG];
    const section = findRootSection(path);
    if (!section) return [path, null];
    return [path, enhanceHubHomeConfig(path, createHubHomeConfig(section))];
  }),
);

export const HUB_HOME_PAGE_ROUTES = HUB_HOME_SECTION_PATHS
  .map((path) => ({ path, config: HUB_HOME_CONFIGS[path] }))
  .filter((route) => route.config);
