import test from "node:test";
import assert from "node:assert/strict";
import { resizeBox } from "./resizeGeometry.js";

test("bottom handle changes only height", () => {
  const box = resizeBox({
    leftMm: 40,
    topMm: 50,
    widthMm: 80,
    heightMm: 20,
    dxMm: 18,
    dyMm: 12,
    handle: "b",
    minWidthMm: 12,
    minHeightMm: 8,
  });

  assert.equal(box.leftMm, 40);
  assert.equal(box.widthMm, 80);
  assert.equal(box.topMm, 50);
  assert.equal(box.heightMm, 32);
});

test("bottom right handle follows pointer in both directions", () => {
  const box = resizeBox({
    leftMm: 40,
    topMm: 50,
    widthMm: 80,
    heightMm: 20,
    dxMm: 15,
    dyMm: 10,
    handle: "br",
    minWidthMm: 12,
    minHeightMm: 8,
  });

  assert.equal(box.widthMm, 95);
  assert.equal(box.heightMm, 30);
});

test("left handle moves the left edge and keeps the right edge fixed", () => {
  const box = resizeBox({
    leftMm: 40,
    topMm: 50,
    widthMm: 80,
    heightMm: 20,
    dxMm: -14,
    dyMm: 50,
    handle: "l",
    minWidthMm: 12,
    minHeightMm: 8,
  });

  assert.equal(box.leftMm, 26);
  assert.equal(box.widthMm, 94);
  assert.equal(box.topMm, 50);
  assert.equal(box.heightMm, 20);
});

test("minimum size prevents collapsing to zero", () => {
  const box = resizeBox({
    leftMm: 40,
    topMm: 50,
    widthMm: 80,
    heightMm: 20,
    dxMm: -200,
    dyMm: -200,
    handle: "br",
    minWidthMm: 12,
    minHeightMm: 8,
  });

  assert.equal(box.widthMm, 12);
  assert.equal(box.heightMm, 8);
});
