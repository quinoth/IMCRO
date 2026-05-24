import { generateSlug } from "./adminStore.js";

export const METHODIKA_SUBJECTS = [
  "Астрономия",
  "Биология",
  "География",
  "Иностранные языки",
  "Информатика",
  "Иркутсковедение",
  "История",
  "Литература",
  "Математика",
  "Музыка",
  "Начальная школа",
  "ОБЖ",
  "Обществознание",
  "ОДНКНР",
  "Русский язык",
  "Технология",
  "Физика",
  "Физическая культура",
  "Химия",
  "Экология",
  "Экономика",
  "ИЗО",
  "Дошкольное образование",
  "Дополнительное образование",
  "Воспитательная работа",
  "Психологическая служба",
  "Логопедия и дефектология",
  "Библиотека",
  "Классное руководство",
];

export const METHODIKA_SUBJECT_CARDS = METHODIKA_SUBJECTS.map((name) => ({
  name,
  slug: generateSlug(name),
  methodist: "Методист ИМЦРО",
}));

export const DOMU_SECTIONS = [
  { value: "master-klassy", label: "Мастер-классы" },
  { value: "molodye-pedagogi", label: "Клуб молодых педагогов" },
  { value: "nastavnichestvo", label: "Наставничество" },
  { value: "klub-pedagogov", label: "Клуб педагогов" },
  { value: "pedagogicheskaya-gostinaya", label: "Педагогическая гостиная" },
  { value: "konkursy", label: "Конкурсы" },
  { value: "itogi", label: "Итоги и результаты" },
  { value: "fotogalereya", label: "Фотогалерея" },
  { value: "programma", label: "Программа мероприятий" },
];

export const NOKO_SECTIONS = [
  { value: "operativnaya-informaciya", label: "Оперативная информация" },
  { value: "gia-9", label: "ГИА-9" },
  { value: "gia-11", label: "ГИА-11" },
  { value: "sborniki", label: "Сборники" },
];

export const KONKURSY_SECTIONS = [
  { value: "kalendar", label: "Календарь" },
  { value: "itogi", label: "Итоги" },
  { value: "students", label: "Для обучающихся" },
  { value: "students/konferencii", label: "Для обучающихся: конференции" },
  { value: "students/russkiy-matematika-4-klass", label: "Для обучающихся: русский и математика 4 класс" },
  { value: "students/vsosh", label: "Для обучающихся: ВсОШ" },
  { value: "teachers", label: "Для педагогов" },
  { value: "teachers/prof-masterstvo", label: "Для педагогов: профмастерство" },
  { value: "teachers/metodicheskie-razrabotki", label: "Для педагогов: методические разработки" },
  { value: "teachers/konferencii", label: "Для педагогов: конференции" },
  { value: "organizations", label: "Для организаций" },
];

export const DEYATELNOST_SECTIONS = [
  { value: "innovacii", label: "Инновации" },
  { value: "muzey", label: "Музей образования" },
  { value: "povyshenie-kvalifikatsii", label: "Повышение квалификации" },
  { value: "proforientaciya", label: "Профориентация" },
  { value: "vospitanie", label: "Воспитательная работа" },
];

export const ARCHIV_SECTIONS = [
  { value: "sovremennye-tendencii", label: "Современные тенденции" },
  { value: "upravlencheskie-komandy", label: "Управленческие команды" },
];

export const ROOT_SECTIONS = [
  { value: "home", label: "Главная страница", scope: "imcro_only" },
  { value: "domu", label: "Дом учителя", scope: "dom_uchitelya_only" },
  { value: "methodika", label: "Методическое пространство", scope: "imcro_only" },
  { value: "noko", label: "НОКО", scope: "imcro_only" },
  { value: "konkursy", label: "Олимпиады и конкурсы", scope: "imcro_only" },
  { value: "deyatelnost", label: "Деятельность", scope: "imcro_only" },
  { value: "archiv", label: "Архив", scope: "imcro_only" },
];

export function methodikaSubjectBySlug(slug) {
  return METHODIKA_SUBJECT_CARDS.find((item) => item.slug === slug)?.name || null;
}

export function methodikaSubjectSlug(name) {
  return METHODIKA_SUBJECT_CARDS.find((item) => item.name === name)?.slug || generateSlug(name || "");
}

function findLabel(options, value) {
  return options.find((item) => item.value === value)?.label || value;
}

function findRoute(routes, value) {
  return routes.find((item) => item.value === value) || null;
}

export function resolveArticleSectionLabel(article, { forceNews = false } = {}) {
  if (!article) return "Новости";
  if (forceNews || article.duplicate_to_main) return "Новости";
  if (article.dom_uchitelya_section) return findLabel(DOMU_SECTIONS, article.dom_uchitelya_section);
  if (article.methodika_subject) return article.methodika_subject;
  if (article.hub_kind === "methodika" && article.hub_path) return findLabel(METHODIKA_SECTIONS, article.hub_path);
  if (article.noko_section) return findLabel(NOKO_SECTIONS, article.noko_section);
  if (article.hub_kind === "konkursy") return findLabel(KONKURSY_SECTIONS, article.hub_path || "konkursy");
  if (article.hub_kind === "deyatelnost") return findLabel(DEYATELNOST_SECTIONS, article.hub_path || "deyatelnost");
  if (article.hub_kind === "archiv") return findLabel(ARCHIV_SECTIONS, article.hub_path || "archiv");
  return "Новости";
}

export const METHODIKA_STATIC_PAGES = [
  { path: "/metodika/metodicheskiy-sovet/", title: "Методический совет", lead: "Решения, регламенты и материалы для сопровождения предметных методических объединений." },
  { path: "/metodika/rekomendacii/", title: "Рекомендации", lead: "Практические рекомендации, подборки материалов и методические ориентиры для педагогов." },
];

export const METHODIKA_SECTIONS = METHODIKA_STATIC_PAGES.map((page) => ({
  value: page.path.replace(/^\/metodika\//, "").replace(/\/$/, ""),
  label: page.title,
}));

export const NOKO_ROUTES = [
  { path: "/noko/gia-9/", value: "gia-9", title: "ГИА-9", lead: "Материалы по итоговой аттестации в 9-х классах." },
  { path: "/noko/gia-11/", value: "gia-11", title: "ГИА-11", lead: "Материалы по итоговой аттестации в 11-х классах." },
  { path: "/noko/operativnaya-informaciya/", value: "operativnaya-informaciya", title: "Оперативная информация", lead: "Официальные сообщения и оперативные обновления НОКО." },
  { path: "/noko/sborniki/", value: "sborniki", title: "Сборники", lead: "Тематические сборники, аналитика и справочные материалы." },
];

export const KONKURSY_ROUTES = [
  { path: "/konkursy/kalendar/", value: "kalendar", title: "Календарь", lead: "План олимпиад, конкурсов и ключевых дат." },
  { path: "/konkursy/itogi/", value: "itogi", title: "Итоги", lead: "Результаты, протоколы и материалы по завершённым событиям." },
  { path: "/konkursy/students/", value: "students", title: "Для обучающихся", lead: "Олимпиады и конкурсы для школьников." },
  { path: "/konkursy/students/konferencii/", value: "students/konferencii", title: "Для обучающихся: конференции", lead: "Научно-практические конференции для обучающихся." },
  { path: "/konkursy/students/russkiy-matematika-4-klass/", value: "students/russkiy-matematika-4-klass", title: "Для обучающихся: русский и математика 4 класс", lead: "Материалы, положения и итоги для направления 4 класса." },
  { path: "/konkursy/students/vsosh/", value: "students/vsosh", title: "Для обучающихся: ВсОШ", lead: "Школьный, муниципальный и региональный этапы ВсОШ." },
  { path: "/konkursy/teachers/", value: "teachers", title: "Для педагогов", lead: "Профессиональные конкурсы и события для педагогов." },
  { path: "/konkursy/teachers/prof-masterstvo/", value: "teachers/prof-masterstvo", title: "Для педагогов: профмастерство", lead: "Конкурсы профессионального мастерства." },
  { path: "/konkursy/teachers/metodicheskie-razrabotki/", value: "teachers/metodicheskie-razrabotki", title: "Для педагогов: методические разработки", lead: "Конкурсы и публикации методических разработок." },
  { path: "/konkursy/teachers/konferencii/", value: "teachers/konferencii", title: "Для педагогов: конференции", lead: "Конференции, форумы и экспертные сессии для педагогов." },
  { path: "/konkursy/organizations/", value: "organizations", title: "Для организаций", lead: "Конкурсы и события для образовательных организаций." },
];

export const DEYATELNOST_ROUTES = [
  { path: "/deyatelnost/innovacii/", value: "innovacii", title: "Инновации", lead: "Инновационные практики и проектные инициативы." },
  { path: "/deyatelnost/muzey/", value: "muzey", title: "Музей", lead: "Материалы музейной и краеведческой работы." },
  { path: "/deyatelnost/povyshenie-kvalifikatsii/", value: "povyshenie-kvalifikatsii", title: "Повышение квалификации", lead: "Программы, курсы и сопровождение профессионального развития." },
  { path: "/deyatelnost/proforientaciya/", value: "proforientaciya", title: "Профориентация", lead: "Материалы по профориентационной работе со школьниками." },
  { path: "/deyatelnost/vospitanie/", value: "vospitanie", title: "Воспитание", lead: "Воспитательные практики и методические материалы." },
];

export const ARCHIV_ROUTES = [
  { path: "/archiv/sovremennye-tendencii/", value: "sovremennye-tendencii", title: "Современные тенденции", lead: "Архивные материалы по актуальным образовательным тенденциям." },
  { path: "/archiv/upravlencheskie-komandy/", value: "upravlencheskie-komandy", title: "Управленческие команды", lead: "Архив материалов по развитию управленческих команд." },
];

export function resolveArticleLocation(article) {
  if (!article) {
    return { parentLabel: "Новости", parentPath: "/novosti/", sectionLabel: "", sectionPath: "" };
  }
  if (article.dom_uchitelya_section) {
    return {
      parentLabel: "Дом учителя",
      parentPath: "/dom-uchitelya/",
      sectionLabel: findLabel(DOMU_SECTIONS, article.dom_uchitelya_section),
      sectionPath: `/dom-uchitelya/${article.dom_uchitelya_section}/`,
    };
  }
  if (article.methodika_subject) {
    return {
      parentLabel: "Методическое пространство",
      parentPath: "/metodika/",
      sectionLabel: article.methodika_subject,
      sectionPath: `/metodika/${methodikaSubjectSlug(article.methodika_subject)}/`,
    };
  }
  if (article.hub_kind === "methodika" && article.hub_path) {
    const section = METHODIKA_STATIC_PAGES.find((item) => item.path.includes(`/${article.hub_path}/`));
    return {
      parentLabel: "Методическое пространство",
      parentPath: "/metodika/",
      sectionLabel: section?.title || findLabel(METHODIKA_SECTIONS, article.hub_path),
      sectionPath: section?.path || `/metodika/${article.hub_path}/`,
    };
  }
  if (article.noko_section) {
    const section = findRoute(NOKO_ROUTES, article.noko_section);
    return {
      parentLabel: "НОКО",
      parentPath: "/noko/",
      sectionLabel: section?.title || findLabel(NOKO_SECTIONS, article.noko_section),
      sectionPath: section?.path || `/noko/${article.noko_section}/`,
    };
  }
  if (article.hub_kind === "konkursy") {
    const section = findRoute(KONKURSY_ROUTES, article.hub_path);
    return {
      parentLabel: "Олимпиады и конкурсы",
      parentPath: "/konkursy/",
      sectionLabel: section?.title || findLabel(KONKURSY_SECTIONS, article.hub_path),
      sectionPath: section?.path || `/konkursy/${article.hub_path || ""}/`,
    };
  }
  if (article.hub_kind === "deyatelnost") {
    const section = findRoute(DEYATELNOST_ROUTES, article.hub_path);
    return {
      parentLabel: "Деятельность",
      parentPath: "/deyatelnost/",
      sectionLabel: section?.title || findLabel(DEYATELNOST_SECTIONS, article.hub_path),
      sectionPath: section?.path || `/deyatelnost/${article.hub_path || ""}/`,
    };
  }
  if (article.hub_kind === "archiv") {
    const section = findRoute(ARCHIV_ROUTES, article.hub_path);
    return {
      parentLabel: "Архив",
      parentPath: "/archiv/",
      sectionLabel: section?.title || findLabel(ARCHIV_SECTIONS, article.hub_path),
      sectionPath: section?.path || `/archiv/${article.hub_path || ""}/`,
    };
  }
  return { parentLabel: "Новости", parentPath: "/novosti/", sectionLabel: "", sectionPath: "" };
}
