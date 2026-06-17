export const A11Y_STORAGE_KEY = "mky_accessibility_settings";
export const A11Y_EVENT = "mky-accessibility-change";

export const DEFAULT_A11Y_SETTINGS = {
  enabled: false,
  fontSize: "large",
  scheme: "white",
  lineHeight: "normal",
  letterSpacing: "normal",
  hideImages: false,
  fontFamily: "sans",
  reduceMotion: true,
};

export const ENABLED_A11Y_DEFAULTS = {
  ...DEFAULT_A11Y_SETTINGS,
  enabled: true,
};

const FONT_SIZE_VALUES = ["normal", "large", "xlarge", "xxlarge"];
const LINE_HEIGHT_VALUES = ["normal", "large", "xlarge"];
const LETTER_SPACING_VALUES = ["normal", "large", "xlarge"];
const SCHEME_VALUES = ["white", "black", "yellow", "blue", "beige"];
const FONT_FAMILY_VALUES = ["sans", "serif"];

const VALUE_ALIASES = {
  fontSize: {
    max: "xxlarge",
  },
  lineHeight: {
    extra: "xlarge",
    "line-height-large": "large",
    "line-height-xlarge": "xlarge",
  },
  letterSpacing: {
    "letter-spacing-large": "large",
    "letter-spacing-xlarge": "xlarge",
  },
  scheme: {
    normal: "white",
    light: "white",
    dark: "black",
    "yellow-black": "yellow",
    mono: "yellow",
  },
  fontFamily: {
    normal: "sans",
  },
};

const A11Y_BODY_CLASSES = [
  "a11y-enabled",
  "a11y-font-normal",
  "a11y-font-large",
  "a11y-font-xlarge",
  "a11y-font-xxlarge",
  "a11y-font-max",
  "a11y-line-normal",
  "a11y-line-large",
  "a11y-line-xlarge",
  "a11y-line-height-large",
  "a11y-line-height-xlarge",
  "a11y-letter-normal",
  "a11y-letter-large",
  "a11y-letter-xlarge",
  "a11y-letter-spacing-large",
  "a11y-letter-spacing-xlarge",
  "a11y-theme-white",
  "a11y-theme-black",
  "a11y-theme-yellow",
  "a11y-theme-blue",
  "a11y-theme-beige",
  "a11y-theme-light",
  "a11y-theme-dark",
  "a11y-theme-yellow-black",
  "a11y-images-hidden",
  "a11y-hide-images",
  "a11y-sans",
  "a11y-serif",
  "a11y-reduce-motion",
  "mky-a11y-mode",
];

function normalizeValue(value, allowedValues, fallback, aliases = {}) {
  const aliased = aliases[value] || value;
  return allowedValues.includes(aliased) ? aliased : fallback;
}

function normalizeAccessibilitySettings(settings) {
  const next = { ...DEFAULT_A11Y_SETTINGS, ...settings };

  next.fontSize = normalizeValue(next.fontSize, FONT_SIZE_VALUES, DEFAULT_A11Y_SETTINGS.fontSize, VALUE_ALIASES.fontSize);
  next.lineHeight = normalizeValue(next.lineHeight, LINE_HEIGHT_VALUES, DEFAULT_A11Y_SETTINGS.lineHeight, VALUE_ALIASES.lineHeight);
  next.letterSpacing = normalizeValue(next.letterSpacing, LETTER_SPACING_VALUES, DEFAULT_A11Y_SETTINGS.letterSpacing, VALUE_ALIASES.letterSpacing);
  next.scheme = normalizeValue(next.scheme, SCHEME_VALUES, DEFAULT_A11Y_SETTINGS.scheme, VALUE_ALIASES.scheme);
  next.fontFamily = normalizeValue(next.fontFamily, FONT_FAMILY_VALUES, DEFAULT_A11Y_SETTINGS.fontFamily, VALUE_ALIASES.fontFamily);
  next.enabled = Boolean(next.enabled);
  next.hideImages = Boolean(next.hideImages);
  next.reduceMotion = Boolean(next.reduceMotion);
  return next;
}

export function readAccessibilitySettings() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return normalizeAccessibilitySettings(DEFAULT_A11Y_SETTINGS);
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    return normalizeAccessibilitySettings(raw ? JSON.parse(raw) : DEFAULT_A11Y_SETTINGS);
  } catch {
    return normalizeAccessibilitySettings(DEFAULT_A11Y_SETTINGS);
  }
}

export function saveAccessibilitySettings(settings) {
  const next = normalizeAccessibilitySettings(settings);
  try {
    window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage can be unavailable in private browsing modes.
  }
  applyAccessibilitySettings(next);
  window.dispatchEvent(new CustomEvent(A11Y_EVENT, { detail: next }));
  return next;
}

export function applyAccessibilitySettings(settings = readAccessibilitySettings()) {
  if (typeof document === "undefined") return settings;
  const next = normalizeAccessibilitySettings(settings);
  const { body, documentElement } = document;
  [body, documentElement].forEach((element) => {
    if (!element) return;
    element.classList.remove(...A11Y_BODY_CLASSES);
  });

  body.classList.toggle("mky-a11y-mode", Boolean(next.enabled));
  body.classList.toggle("a11y-enabled", Boolean(next.enabled));
  documentElement.classList.toggle("mky-a11y-mode", Boolean(next.enabled));
  documentElement.classList.toggle("a11y-enabled", Boolean(next.enabled));

  if (next.enabled) {
    const classNames = [
      `a11y-font-${next.fontSize}`,
      `a11y-line-${next.lineHeight}`,
      `a11y-letter-${next.letterSpacing}`,
      `a11y-theme-${next.scheme}`,
      `a11y-${next.fontFamily}`,
      next.hideImages ? "a11y-images-hidden" : "",
      next.reduceMotion ? "a11y-reduce-motion" : "",
    ].filter(Boolean);

    body.classList.add(...classNames);
    documentElement.classList.add(...classNames);
  }

  body.dataset.a11yFont = next.enabled ? next.fontSize : "";
  body.dataset.a11yScheme = next.enabled ? next.scheme : "";
  body.dataset.a11yLineHeight = next.enabled ? next.lineHeight : "";
  body.dataset.a11yLetterSpacing = next.enabled ? next.letterSpacing : "";
  body.dataset.a11yFontFamily = next.enabled ? next.fontFamily : "";
  body.dataset.a11yHideImages = next.enabled && next.hideImages ? "true" : "";
  body.dataset.a11yReduceMotion = next.enabled && next.reduceMotion ? "true" : "";
  return next;
}

export function enableAccessibilityMode(settings = ENABLED_A11Y_DEFAULTS) {
  return saveAccessibilitySettings({ ...ENABLED_A11Y_DEFAULTS, ...settings, enabled: true });
}

export function disableAccessibilityMode(settings = readAccessibilitySettings()) {
  return saveAccessibilitySettings({ ...settings, enabled: false });
}

export function toggleAccessibilityMode() {
  const current = readAccessibilitySettings();
  return current.enabled ? disableAccessibilityMode(current) : enableAccessibilityMode();
}
