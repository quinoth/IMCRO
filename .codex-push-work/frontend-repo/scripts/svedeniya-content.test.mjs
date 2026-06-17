import assert from "node:assert/strict";
import { svedeniyaPage, staff } from "../src/pages/svedeniya/svedeniyaData.js";

const SOURCE_URL = "https://mc.eduirk.ru/index.php?option=com_content&view=article&id=2&Itemid=140";

const commonSection = svedeniyaPage.sections.find((section) => section.anchor === "common");
assert.ok(commonSection, "common section exists");
assert.equal(commonSection.sourceUrl, SOURCE_URL);

const commonText = JSON.stringify(commonSection);
[
  "Муниципальное казённое учреждение развития образования города Иркутска",
  "МКУ развития образования города Иркутска",
  "12.07.1999",
  "Администрация города Иркутска",
  "Департамент образования",
  "ул. Ленина, 26",
  "Территориальная психолого-медико-педагогическая комиссия города Иркутска",
  "Дом учителя",
  "Кабинет охраны труда",
  "Образовательная деятельность осуществляется по адресам",
].forEach((expected) => {
  assert.ok(commonText.includes(expected), `common section includes: ${expected}`);
});

assert.ok(!commonText.includes("Адрес электронной почты защищен"), "protected email placeholder is not copied");

const contactsBlock = commonSection.blocks.find((block) => block.variant === "contact-cards");
assert.ok(contactsBlock, "contact cards block exists");

const allBlocks = svedeniyaPage.sections.flatMap((section) => section.blocks);
const allBlockText = JSON.stringify(allBlocks);
const contactDetails = allBlocks
  .filter((block) => block.type === "contacts" || block.variant === "contact-cards")
  .flatMap((block) => block.items || [])
  .flatMap((item) => item.details || []);
assert.ok(contactDetails.length > 0, "contact details exist");
assert.ok(
  contactDetails.every((detail) => detail && typeof detail === "object" && detail.icon && detail.label && detail.value),
  "contact details use structured icon/label/value objects",
);

assert.ok(
  contactDetails.some((detail) => detail.label === "Сайт" && detail.href === "https://admirk.ru/"),
  "administration website is linked",
);
assert.ok(
  contactDetails.some((detail) => detail.label === "Сайт" && detail.href === "https://eduirk.ru/"),
  "education department website is linked",
);
["post@admirk.ru", "depobr@admirk.ru", "irk_imcro@bk.ru"].forEach((email) => {
  assert.ok(contactDetails.some((detail) => detail.value === email && detail.href === `mailto:${email}`), `${email} is mailto-linked`);
});
assert.ok(
  contactDetails.some((detail) => detail.value.includes("201 985") && detail.href?.startsWith("tel:")),
  "organization phone is tel-linked",
);

const activityPlaces = commonSection.blocks.find((block) => block.variant === "activity-places");
assert.ok(activityPlaces, "activity places block exists");
assert.deepEqual(
  activityPlaces.items.map((item) => item.title),
  ["Иркутск, ул. Ленина, 26", "Иркутск, ул. Литвинова, 14"],
);

const employeesSection = svedeniyaPage.sections.find((section) => section.anchor === "employees");
assert.ok(employeesSection, "employees section exists");
assert.equal(employeesSection.blocks.length, 2);

const allStaff = [...staff.leaders, ...staff.teachers];
assert.ok(allStaff.length > 0, "staff data exists");
assert.ok(
  allStaff.every((person) => Object.hasOwn(person, "image")),
  "every staff record supports an image field",
);
assert.ok(allStaff.every((person) => person.image || person.name), "staff cards can render photo or initials");
assert.ok(allStaff.some((person) => person.email === "vasilkovayv@eduirk.ru"), "director email is present");
assert.ok(allStaff.some((person) => person.image?.includes("mc.eduirk.ru/images/")), "source employee photos are used");

const structSection = svedeniyaPage.sections.find((section) => section.anchor === "struct");
assert.ok(structSection, "structure section exists");
assert.ok(allBlockText.includes("Центр независимой оценки качества"), "structure includes updated subdivisions");
assert.ok(allBlockText.includes("Горенина Любовь Викторовна"), "TPMPK lead is updated");

const educationSection = svedeniyaPage.sections.find((section) => section.anchor === "education");
assert.ok(educationSection, "education section exists");
assert.ok(allBlockText.includes("Дополнительная профессиональная программа повышения квалификации «Менеджмент и экономика"), "program descriptions are present");
assert.ok(allBlockText.includes("Категория слушателей"), "program audience fields are present");

const budgetSection = svedeniyaPage.sections.find((section) => section.anchor === "budget");
assert.ok(budgetSection, "budget section exists");
assert.ok(allBlockText.includes("Бюджетные сметы"), "budget documents are grouped");
assert.ok(allBlockText.includes("Отчеты о выполнении муниципального задания"), "municipal assignment reports are grouped");

const documentLikeBlocks = allBlocks.filter((block) => ["documents", "doc-groups", "education-overview"].includes(block.type));
const documentLinks = documentLikeBlocks.flatMap((block) => [
  ...(block.links || []),
  ...(block.groups || []).flatMap((group) => group.links || []),
]);
assert.ok(documentLinks.length > 20, "many source document links are preserved");
assert.ok(
  documentLinks.every((link) => link.href && link.href !== "#"),
  "document links do not use fake # hrefs",
);
assert.ok(
  documentLinks.some((link) => link.href === "https://mc.eduirk.ru/images/2026/Prikaz_izmen.pdf"),
  "structure order PDF link is preserved",
);
assert.ok(
  documentLinks.some((link) => link.href === "https://mc.eduirk.ru/images/docs/licenziyaiprilojeniya.pdf"),
  "education license PDF link is preserved",
);
