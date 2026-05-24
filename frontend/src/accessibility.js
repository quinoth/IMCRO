export const A11Y_STORAGE_KEY = "mky_accessibility_settings";
export const A11Y_EVENT = "mky-accessibility-change";

export const DEFAULT_A11Y_SETTINGS = {
  enabled: false,
  fontSize: "large",
  scheme: "light",
  lineHeight: "wide",
  hideImages: false,
};

export function readAccessibilitySettings() {
  try {
    const raw = window.localStorage.getItem(A11Y_STORAGE_KEY);
    return raw ? { ...DEFAULT_A11Y_SETTINGS, ...JSON.parse(raw) } : DEFAULT_A11Y_SETTINGS;
  } catch {
    return DEFAULT_A11Y_SETTINGS;
  }
}

export function saveAccessibilitySettings(settings) {
  const next = { ...DEFAULT_A11Y_SETTINGS, ...settings };
  window.localStorage.setItem(A11Y_STORAGE_KEY, JSON.stringify(next));
  applyAccessibilitySettings(next);
  window.dispatchEvent(new CustomEvent(A11Y_EVENT, { detail: next }));
  return next;
}

export function applyAccessibilitySettings(settings = readAccessibilitySettings()) {
  if (typeof document === "undefined") return settings;
  const next = { ...DEFAULT_A11Y_SETTINGS, ...settings };
  const { body } = document;
  body.classList.toggle("mky-a11y-mode", Boolean(next.enabled));
  body.dataset.a11yFont = next.enabled ? next.fontSize : "";
  body.dataset.a11yScheme = next.enabled ? next.scheme : "";
  body.dataset.a11yLineHeight = next.enabled ? next.lineHeight : "";
  body.dataset.a11yHideImages = next.enabled && next.hideImages ? "true" : "";
  return next;
}

export function toggleAccessibilityMode() {
  const current = readAccessibilitySettings();
  return saveAccessibilitySettings({ ...current, enabled: !current.enabled });
}
