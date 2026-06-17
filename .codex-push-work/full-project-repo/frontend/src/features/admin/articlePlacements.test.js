import test from "node:test";
import assert from "node:assert/strict";

import {
  applyArticleSectionSelection,
  buildArticleSectionTree,
  filterArticleSectionTree,
  flattenArticleSections,
  getArticleSectionSelection,
  getSectionNodeSelectionState,
  sectionChipsFromKeys,
} from "./articlePlacements.js";

test("builds a searchable tree with full section paths", () => {
  const flat = flattenArticleSections(buildArticleSectionTree());
  const nokoGia = flat.find((section) => section.key === "noko:gia-9");

  assert.equal(nokoGia.pathLabel, "НОКО / ГИА-9");
  assert.ok(flat.some((section) => section.key === "events" && section.pathLabel === "Мероприятия"));
});

test("derives selected sections from legacy article fields", () => {
  const selection = getArticleSectionSelection({
    noko_section: "gia-9",
    duplicate_to_events: true,
  });

  assert.deepEqual(selection, ["noko:gia-9", "events"]);
});

test("applies multiple selected sections without duplicating keys", () => {
  const next = applyArticleSectionSelection(
    { title: "Материал", publishing_scope: "imcro_only" },
    ["noko:gia-9", "noko:gia-11", "noko:gia-9", "events"],
  );

  assert.deepEqual(next.sections.map((section) => section.key), ["noko:gia-9", "noko:gia-11", "events"]);
  assert.equal(next.noko_section, "gia-9");
  assert.equal(next.duplicate_to_events, true);
  assert.equal(next.duplicate_to_main, false);
});

test("returns compact chips with full paths and overflow count", () => {
  const chips = sectionChipsFromKeys(["noko:gia-9", "noko:gia-11", "events", "home"], 2);

  assert.deepEqual(chips.visible.map((chip) => chip.label), ["НОКО / ГИА-9", "НОКО / ГИА-11"]);
  assert.equal(chips.hiddenCount, 2);
});

test("marks parent branches as indeterminate when only a child is selected", () => {
  const tree = buildArticleSectionTree();
  const nokoRoot = tree.find((section) => section.key === "noko:root");

  assert.deepEqual(getSectionNodeSelectionState(nokoRoot, ["noko:gia-9"]), {
    checked: false,
    indeterminate: true,
  });
  assert.deepEqual(getSectionNodeSelectionState(nokoRoot, ["noko:root"]), {
    checked: true,
    indeterminate: false,
  });
});

test("filters section tree by query while preserving parent context", () => {
  const filtered = filterArticleSectionTree(buildArticleSectionTree(), "ГИА-9");

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].key, "noko:root");
  assert.deepEqual(filtered[0].children.map((child) => child.key), ["noko:gia-9"]);
});
