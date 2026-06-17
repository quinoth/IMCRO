import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(...classNames) {
    classNames.filter(Boolean).forEach((className) => this.values.add(className));
  }

  remove(...classNames) {
    classNames.forEach((className) => this.values.delete(className));
  }

  toggle(className, force) {
    if (force) {
      this.values.add(className);
      return true;
    }
    this.values.delete(className);
    return false;
  }

  contains(className) {
    return this.values.has(className);
  }
}

function createElementStub() {
  return {
    classList: new FakeClassList(),
    dataset: {},
  };
}

const store = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
  },
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
};
globalThis.document = {
  body: createElementStub(),
  documentElement: createElementStub(),
};

const accessibility = await import("../src/accessibility.js");

const {
  A11Y_STORAGE_KEY,
  DEFAULT_A11Y_SETTINGS,
  applyAccessibilitySettings,
  readAccessibilitySettings,
  saveAccessibilitySettings,
} = accessibility;

assert.equal(DEFAULT_A11Y_SETTINGS.fontSize, "large", "first enable uses a large default font");
assert.equal(DEFAULT_A11Y_SETTINGS.scheme, "white", "first enable uses a white contrast theme");
assert.equal(DEFAULT_A11Y_SETTINGS.reduceMotion, true, "first enable reduces motion by default");
assert.equal(DEFAULT_A11Y_SETTINGS.fontFamily, "sans", "first enable uses sans-serif by default");

saveAccessibilitySettings({
  enabled: true,
  fontSize: "xxlarge",
  scheme: "yellow",
  lineHeight: "xlarge",
  letterSpacing: "xlarge",
  hideImages: true,
  fontFamily: "serif",
  reduceMotion: true,
});

for (const className of [
  "mky-a11y-mode",
  "a11y-enabled",
  "a11y-font-xxlarge",
  "a11y-line-xlarge",
  "a11y-letter-xlarge",
  "a11y-theme-yellow",
  "a11y-images-hidden",
  "a11y-serif",
  "a11y-reduce-motion",
]) {
  assert.ok(document.body.classList.contains(className), `body receives ${className}`);
  assert.ok(document.documentElement.classList.contains(className), `html receives ${className}`);
}

assert.equal(document.body.dataset.a11yFont, "xxlarge", "font setting is exposed as a data attribute");
assert.equal(document.body.dataset.a11yScheme, "yellow", "theme setting is exposed as a data attribute");
assert.equal(document.body.dataset.a11yHideImages, "true", "image hiding is exposed as a data attribute");

const saved = JSON.parse(window.localStorage.getItem(A11Y_STORAGE_KEY));
assert.equal(saved.fontSize, "xxlarge", "font setting is saved to localStorage");
assert.equal(saved.scheme, "yellow", "theme setting is saved to localStorage");
assert.equal(saved.fontFamily, "serif", "font family setting is saved to localStorage");
assert.equal(readAccessibilitySettings().hideImages, true, "read restores saved image setting");

window.localStorage.setItem(
  A11Y_STORAGE_KEY,
  JSON.stringify({ enabled: true, fontSize: "max", scheme: "yellow-black", hideImages: true }),
);
applyAccessibilitySettings();
assert.ok(document.body.classList.contains("a11y-font-xxlarge"), "legacy max font maps to xxlarge");
assert.ok(document.body.classList.contains("a11y-theme-yellow"), "legacy yellow-black theme maps to yellow");
assert.ok(document.body.classList.contains("a11y-images-hidden"), "legacy saved image state maps to images-hidden");

saveAccessibilitySettings({ ...readAccessibilitySettings(), enabled: false });
assert.equal(document.body.classList.contains("a11y-enabled"), false, "disabling removes the enabled class");
assert.equal(document.body.dataset.a11yFont, "", "disabling clears body data attributes");

const headerSource = readFileSync(new URL("../src/features/nav/Header.jsx", import.meta.url), "utf8");
const panelSource = headerSource.slice(headerSource.indexOf("header-a11y-panel"));
assert.ok(!panelSource.includes("<select"), "a11y panel does not use small select controls");
assert.ok(panelSource.includes('aria-pressed={option.value === a11ySettings.fontSize}'), "font choices expose aria-pressed");
assert.ok(panelSource.includes('aria-pressed={option.value === a11ySettings.scheme}'), "theme choices expose aria-pressed");
assert.ok(!panelSource.includes('role="dialog"'), "a11y panel is a compact toolbar, not a modal dialog");
assert.ok(panelSource.includes('role="region"'), "a11y panel is exposed as a labelled region");
assert.ok(panelSource.includes("aria-labelledby"), "toolbar is labelled by its heading");
assert.ok(headerSource.includes("a11y-panel-open"), "header exposes panel-open state for spacer/layout adjustments");
assert.ok(headerSource.includes("Escape"), "Escape closes the accessibility settings panel");
assert.ok(headerSource.includes("Обычная версия"), "panel exposes a normal-version button");
assert.ok(!headerSource.includes("A11Y_FONT_FAMILY_OPTIONS"), "toolbar no longer exposes the extra font-family selector");
assert.ok(!panelSource.includes("a11y-family-title"), "toolbar does not render the removed font-family section");
assert.ok(headerSource.includes("Межбуквенный интервал"), "letter-spacing control is named in Russian, not as kerning");

const indexCss = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");
const headerPanelCss = headerSource.slice(headerSource.indexOf(".header-a11y-panel {"), headerSource.indexOf(".header-a11y-panel-head {"));
assert.ok(headerPanelCss.includes("position: absolute;"), "a11y toolbar is anchored to the fixed header");
assert.ok(headerPanelCss.includes("left: 0;") && headerPanelCss.includes("right: 0;"), "a11y toolbar spans the page width");
assert.ok(headerPanelCss.includes("width: 100%;"), "a11y toolbar uses full page width");
assert.ok(!headerPanelCss.includes("position: fixed"), "a11y toolbar is not a fixed overlay on desktop");
assert.ok(!headerPanelCss.includes("overflow-y: auto"), "a11y toolbar has no inner vertical scroll");
assert.ok(!headerPanelCss.includes("max-height"), "a11y toolbar does not cap height with inner scrolling");
assert.ok(headerSource.includes("min-height: 40px"), "toolbar controls are compact instead of oversized");
assert.ok(headerPanelCss.includes("flex-wrap: wrap;"), "toolbar groups wrap compactly across rows");
assert.ok(indexCss.includes("html.a11y-font-xlarge"), "font scale is applied on html so rem-based site text actually changes");
assert.ok(indexCss.includes("font-size: calc(16px * var(--a11y-font-scale"), "a11y mode changes the root font size");
assert.ok(indexCss.includes("--a11y-word-spacing"), "a11y mode exposes a word-spacing variable");
assert.ok(indexCss.includes("word-spacing: var(--a11y-word-spacing)"), "word spacing is applied to site text");
assert.ok(!indexCss.includes("body.mky-a11y-mode :where(.header-nav) {\n  display: none !important;"), "desktop navigation stays visible in a11y mode");
assert.ok(indexCss.includes("visibility: hidden !important;"), "image hiding preserves layout instead of removing image boxes");
assert.ok(!indexCss.includes('content: "Изображение скрыто"'), "hidden images do not render a textual placeholder");
assert.ok(indexCss.includes(".a11y-theme-choice--white .a11y-theme-swatch"), "theme swatches keep explicit preview colors");
for (const token of [
  "a11y-font-xxlarge",
  "a11y-theme-white",
  "a11y-theme-black",
  "a11y-theme-yellow",
  "a11y-theme-blue",
  "a11y-theme-beige",
  "a11y-images-hidden",
  "a11y-serif",
  "--a11y-bg",
  "--a11y-text",
  "--a11y-link",
  "--a11y-focus",
]) {
  assert.ok(indexCss.includes(token), `global CSS contains ${token}`);
}
assert.ok(indexCss.includes("--a11y-button-bg: #000000;"), "yellow theme keeps buttons black, not solid acid yellow");
assert.ok(indexCss.includes("--a11y-button-text: #ffff00;"), "yellow theme keeps button text yellow for contrast");

const imcroComponents = readFileSync(new URL("../src/components/imcro/ImcroPublicComponents.jsx", import.meta.url), "utf8");
assert.ok(imcroComponents.includes("shouldReduceMotion"), "public carousel checks reduced-motion settings");
assert.ok(imcroComponents.includes('behavior: shouldReduceMotion() ? "auto" : "smooth"'), "public carousel avoids smooth scrolling when motion is reduced");
