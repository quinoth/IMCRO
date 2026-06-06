import test from "node:test";
import assert from "node:assert/strict";

import {
  articleToEditorHtml,
  blocksToEditorHtml,
  editorHtmlToBlocks,
  getEditorTextStats,
  htmlToPlainText,
} from "./articleEditorContent.js";

test("converts legacy article blocks into editor HTML", () => {
  const html = articleToEditorHtml({
    blocks: [
      { id: "1", type: "heading", data: { text: "Итоги семинара", level: 2 } },
      { id: "2", type: "paragraph", data: { html: "<strong>Материал</strong> для педагогов" } },
      { id: "3", type: "list", data: { ordered: true, items: ["Регистрация", "Доклады"] } },
      { id: "4", type: "image", data: { url: "/cover.jpg", caption: "Участники" } },
      { id: "5", type: "quote", data: { html: "Важная мысль", author: "ИМЦРО" } },
    ],
  });

  assert.match(html, /<h2>Итоги семинара<\/h2>/);
  assert.match(html, /<strong>Материал<\/strong>/);
  assert.match(html, /<ol>/);
  assert.match(html, /<img src="\/cover.jpg"/);
  assert.match(html, /<blockquote>/);
});

test("keeps existing editor HTML from body instead of re-wrapping it", () => {
  const html = "<h2>Готовый HTML</h2><p>Текст статьи</p>";

  assert.equal(articleToEditorHtml({ body: html, blocks: [] }), html);
});

test("converts editor HTML back to compatibility blocks", () => {
  const blocks = editorHtmlToBlocks(`
    <h2>Раздел</h2>
    <p>Первый <strong>абзац</strong></p>
    <ul><li>Один</li><li>Два</li></ul>
    <figure><img src="/photo.png" alt=""><figcaption>Подпись</figcaption></figure>
  `);

  assert.deepEqual(blocks.map((block) => block.type), ["heading", "paragraph", "list", "image"]);
  assert.equal(blocks[0].data.level, 2);
  assert.equal(blocks[1].data.html, "Первый <strong>абзац</strong>");
  assert.deepEqual(blocks[2].data.items, ["Один", "Два"]);
  assert.equal(blocks[3].data.url, "/photo.png");
});

test("extracts plain text from editor HTML for validation and excerpts", () => {
  const text = htmlToPlainText(blocksToEditorHtml([
    { type: "heading", data: { text: "Семинар" } },
    { type: "paragraph", data: { html: "Для <em>педагогов</em>" } },
  ]));

  assert.equal(text, "Семинар Для педагогов");
});

test("counts words and characters for editor status line", () => {
  const stats = getEditorTextStats("<h2>Итоги семинара</h2><p>Для педагогов города.</p>");

  assert.deepEqual(stats, {
    words: 5,
    characters: 36,
  });
});
