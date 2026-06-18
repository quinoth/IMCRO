import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { demoFeaturedNews, directions, homeBanners, keyEvents, mainSections } from "../src/pages/homePageData.js";

const homePageSource = readFileSync(new URL("../src/pages/HomePage.jsx", import.meta.url), "utf8");
const componentsSource = readFileSync(new URL("../src/components/imcro/ImcroPublicComponents.jsx", import.meta.url), "utf8");
const homePageStyles = readFileSync(new URL("../src/pages/HomePage.css", import.meta.url), "utf8");

const expectedMainSections = [
  { title: "ГИА", href: "/noko/" },
  { title: "ВСОШ", href: "/olimpiady-dlya-detey/vserossiyskaya-olimpiada-shkolnikov/" },
  { title: "Конкурсы и конференции для педагогов", href: "/konkursy/dlya-pedagogov/" },
  { title: "Олимпиады и конкурсы для учащихся", href: "/konkursy/dlya-detey/" },
  { title: "Курсы повышения квалификации", href: "/kpk/" },
  { title: "Инновационная деятельность", href: "/innovacionnaya-deyatelnost/" },
  { title: "Методические материалы", href: "/metodicheskoe-prostranstvo/metodicheskie-materialy/" },
  { title: "Воспитательное пространство", href: "/vospitatelnoe-prostranstvo/" },
  { title: "Муниципальный семейный клуб «ФамилиЯ»", href: "/municipalnyy-semeynyy-klub-familiya/" },
];

const expectedDirections = [
  { title: "ТПМПК", href: "/tpmpk/" },
  { title: "НОКО", href: "/noko/" },
  { title: "Курсы повышения квалификации", href: "/kpk/" },
  { title: "Дошкольное образование", href: "/metodicheskoe-prostranstvo/doshkolnoe-obrazovanie/" },
  { title: "Начальное общее образование", href: "/metodicheskoe-prostranstvo/nachalnoe-obshchee-obrazovanie/" },
  { title: "Дополнительное образование", href: "/metodicheskoe-prostranstvo/dopolnitelnoe-obrazovanie/" },
  { title: "История", href: "/metodicheskoe-prostranstvo/istoriya/" },
  { title: "История нашего края", href: "/metodicheskoe-prostranstvo/istoriya-nashego-kraya/" },
  { title: "Обществознание", href: "/metodicheskoe-prostranstvo/obshchestvoznanie/" },
  { title: "ДНКР", href: "/metodicheskoe-prostranstvo/dnkr/" },
  { title: "Русский язык", href: "/metodicheskoe-prostranstvo/russkiy-yazyk/" },
  { title: "Иностранные языки", href: "/metodicheskoe-prostranstvo/inostrannye-yazyki/" },
  { title: "Математика", href: "/metodicheskoe-prostranstvo/matematika/" },
  { title: "Информатика", href: "/metodicheskoe-prostranstvo/informatika/" },
  { title: "Химия", href: "/metodicheskoe-prostranstvo/himiya/" },
  { title: "Биология", href: "/metodicheskoe-prostranstvo/biologiya/" },
  { title: "География", href: "/metodicheskoe-prostranstvo/geografiya/" },
  { title: "Байкаловедение", href: "/metodicheskoe-prostranstvo/baykalovedenie/" },
  { title: "Физкультура", href: "/metodicheskoe-prostranstvo/fizkultura/" },
  { title: "ОБЖ", href: "/metodicheskoe-prostranstvo/obzh/" },
  { title: "Технология", href: "/metodicheskoe-prostranstvo/tehnologiya/" },
  { title: "Воспитание", href: "/metodicheskoe-prostranstvo/vospitanie/" },
  { title: "Психологи", href: "/metodicheskoe-prostranstvo/psihologi/" },
  { title: "Социальные педагоги", href: "/metodicheskoe-prostranstvo/socialnye-pedagogi/" },
  { title: "Методические материалы", href: "/metodicheskoe-prostranstvo/metodicheskie-materialy/" },
  { title: "Молодые специалисты", href: "/metodicheskoe-prostranstvo/molodye-specialisty/" },
  { title: "Молодые педагоги", href: "/molodye-pedagogi/" },
  { title: "Инновационная деятельность", href: "/innovacionnaya-deyatelnost/" },
  { title: "Воспитательное пространство", href: "/vospitatelnoe-prostranstvo/" },
  { title: "Наставничество", href: "/nastavnichestvo/" },
  { title: "НСУ СКИП", href: "/nsu-skip/" },
  { title: "Конкурсы", href: "/konkursy/" },
  { title: "Олимпиады для детей", href: "/olimpiady-dlya-detey/" },
  { title: "Конференции для детей", href: "/konferencii-dlya-detey/" },
  { title: "Образовательные события", href: "/obrazovatelnye-sobytiya/" },
  { title: "Полезная информация", href: "/poleznaya-informaciya/" },
  { title: "Дом учителя", href: "/dom-uchitelya/" },
  { title: "Деятельность", href: "/deyatelnost/" },
  { title: "Методическое пространство", href: "/metodicheskoe-prostranstvo/" },
];

assert.equal(mainSections.length, 9, "home page keeps exactly 9 main section cards");
assert.deepEqual(
  mainSections.map(({ title, href }) => ({ title, href })),
  expectedMainSections,
  "home page 9 cards follow the approved structure and routes",
);
assert.equal(keyEvents.length, 3, "home page keeps exactly 3 key event banners");
assert.equal(
  keyEvents[0].href,
  "/obrazovatelnye-sobytiya/avgustovskie-pedagogicheskie-soveshchaniya/",
  "August key event links to the educational events subsection",
);
assert.equal(directions.length, 39, "home page activity carousel keeps the approved 39 directions");
assert.deepEqual(
  directions.map(({ title, href }) => ({ title, href })),
  expectedDirections,
  "activity carousel follows the approved direction list and routes",
);
assert.equal(demoFeaturedNews.title, "Иркутские педагогические чтения: горизонты развития современного образования", "home page exposes the demo featured news");
assert.equal(demoFeaturedNews.image, "/images/news2.jpg", "demo featured news uses a local public image");
assert.ok(homeBanners.length >= 10, "home page exposes all local banner files");
assert.ok(homeBanners.every((item) => item.src.startsWith("/banners/")), "home banners use only local public assets");
assert.ok(directions.every((item) => item.href?.startsWith("/") && item.href.endsWith("/")), "every activity carousel card has a normalized internal route");
assert.ok(!directions.some((item) => item.href === "/metodika/" || item.title === "Методика"), "carousel no longer exposes the old Methodika naming or route");
assert.ok(!directions.some((item) => item.href.startsWith("/predmetnye-oblasti/") || item.title === "Предметные области"), "carousel no longer exposes the removed Predmetnye oblasti section");

[
  "/images/event-august-meetings.png",
  "/images/event-training-courses.png",
  "/images/event-contests-conferences.png",
].forEach((imagePath) => {
  assert.ok(keyEvents.some((event) => event.image === imagePath), `key events use ${imagePath}`);
});

[
  "ImcroPage",
  "ImcroContainer",
  "ImcroSection",
  "ImcroCard",
  "ImcroButton",
  "ImcroServiceCard",
  "ImcroEventBanner",
  "ImcroContactPanel",
  "ImcroActivityCarousel",
].forEach((componentName) => {
  assert.ok(homePageSource.includes(componentName), `HomePage uses ${componentName}`);
});

assert.ok(homePageSource.includes("home-hero-grid"), "HomePage has the new two-column hero grid");
assert.ok(homePageSource.includes("home-services-grid"), "HomePage has the 9-card service grid");
assert.ok(homePageSource.includes("home-banners-section"), "HomePage renders the local banners section");
assert.ok(homePageSource.includes('loading="lazy"'), "HomePage lazy-loads banner images");
assert.ok(homePageSource.includes("home-contact-layout"), "HomePage has the contact layout");
assert.ok(homePageSource.includes("demoFeaturedNews"), "HomePage uses demo news when no published news are available");
assert.ok(homePageSource.includes("imageSrc={event.image}"), "HomePage passes event images into key event banners");
assert.ok(componentsSource.includes("onPointerDown"), "activity carousel supports pointer drag scrolling");
assert.ok(homePageSource.includes('variant="paged"'), "HomePage renders directions as a paginated carousel");
assert.ok(componentsSource.includes("imcro-activity-carousel--paged"), "activity component supports a paginated carousel mode");
assert.ok(componentsSource.includes("imcro-activity-carousel__pages"), "activity component renders page slides");
assert.ok(componentsSource.includes("imcro-activity-carousel__dots"), "activity component renders pagination dots");
assert.ok(componentsSource.includes("imcro-activity-carousel__stage"), "activity carousel exposes a stage for side arrows");
assert.ok(componentsSource.includes("href={item.href}"), "activity carousel makes the whole card clickable when href exists");
assert.ok(homePageStyles.includes("grid-template-columns: minmax(0, 1.08fr) minmax(320px, 0.92fr)"), "contact layout keeps two separate desktop cards");
assert.ok(homePageStyles.includes(".home-banners-grid"), "home page has a dedicated banners grid");
assert.ok(homePageStyles.includes("aspect-ratio: 16 / 9"), "home page banner cards keep a consistent aspect ratio");
assert.ok(homePageStyles.includes("--activity-columns: 5"), "activity directions show up to 5 columns on wide desktop");
assert.ok(homePageStyles.includes("--activity-rows: 2"), "activity directions use two rows per page on desktop");
assert.ok(!/home-activity-section[\s\S]*overflow-y:\s*auto/.test(homePageStyles), "activity directions do not use an internal vertical scrollbar");
assert.ok(!/home-activity-section[\s\S]*max-height:\s*/.test(homePageStyles), "activity directions do not cap height with max-height");
assert.ok(!homePageSource.includes("home-reveal"), "HomePage no longer depends on the old reveal system");
assert.ok(!homePageSource.includes("EventsSection"), "HomePage does not restore the removed calendar/events block");
assert.ok(!homePageSource.includes("#calendar"), "HomePage does not restore calendar hash behavior");
