import test from "node:test";
import assert from "node:assert/strict";

import {
  resolveArticleLocation,
  resolveArticleSectionLabel,
} from "./articleTaxonomy.js";

test("resolves human labels from stored section keys when old records have key-only metadata", () => {
  const article = {
    sections: [{ key: "noko:gia-9", label: "noko:gia-9", path: "noko:gia-9" }],
  };

  assert.equal(resolveArticleSectionLabel(article), "ГИА-9");
  assert.deepEqual(resolveArticleLocation(article), {
    parentLabel: "НОКО",
    parentPath: "/noko/",
    sectionLabel: "ГИА-9",
    sectionPath: "/noko/gia-9/",
  });
});
