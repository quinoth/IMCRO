import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function source(path) {
  return readFileSync(join(root, path), "utf8");
}

const adminPage = source("src/pages/AdminPage.jsx");
const articles = source("src/features/admin/ArticlesModule.jsx");
const certificates = source("src/components/certificates/GenerateSingle.jsx");
const templates = source("src/components/certificates/TemplateConstructor.jsx");
const users = source("src/features/admin/UsersRolesModule.jsx");
const sharedStyles = source("src/components/certificates/shared/styles.js");

for (const publicPiece of ["Header", "Footer", "ChatSettings"]) {
  assert.equal(
    new RegExp(`(?:import\\s+${publicPiece}\\b|<${publicPiece}\\b)`).test(adminPage),
    false,
    `AdminPage must not render public ${publicPiece} inside /admin`,
  );
}

for (const label of [
  "Дашборд",
  "Статьи",
  "Выпуск грамот",
  "Конструктор шаблонов",
  "Пользователи и роли",
  "Журнал действий",
  "Настройки портала",
]) {
  assert.ok(adminPage.includes(label), `Admin sidebar is missing "${label}"`);
}

for (const color of ["#19789c", "#004f75"]) {
  const joined = [adminPage, articles, certificates, templates, users, sharedStyles].join("\n");
  assert.ok(joined.includes(color), `Admin redesign should use ${color}`);
}

assert.equal([adminPage, certificates, templates].join("\n").includes("Выдача сертификатов"), false);
assert.equal([adminPage, certificates, templates].join("\n").includes("ИМЦРО ПОРТАЛ"), false);

for (const status of ["Опубликовано", "Черновик", "Запланировано"]) {
  assert.ok(articles.includes(status), `Articles screen is missing status "${status}"`);
}

assert.ok(articles.includes("toLocaleString(\"ru-RU\""), "Article editor should format dates with ru-RU locale");
assert.equal(users.includes("FULL"), false, "Users table must not expose the English FULL badge");
assert.ok(users.includes("Полный доступ"), "Users table should show the localized full-access badge");

console.log("admin UI redesign tests passed");
