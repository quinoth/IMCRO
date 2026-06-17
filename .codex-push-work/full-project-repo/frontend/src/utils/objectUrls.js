export function isObjectUrl(value) {
  return typeof value === "string" && value.startsWith("blob:");
}

export function revokeObjectUrl(value) {
  if (!isObjectUrl(value)) return;
  try {
    URL.revokeObjectURL(value);
  } catch {
    // Ignore stale or already revoked browser object URLs.
  }
}

export function revokeObjectUrls(value, seen = new WeakSet()) {
  if (isObjectUrl(value)) {
    revokeObjectUrl(value);
    return;
  }
  if (!value || typeof value !== "object") return;
  if (seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => revokeObjectUrls(item, seen));
    return;
  }
  Object.values(value).forEach((item) => revokeObjectUrls(item, seen));
}

export function stripObjectUrls(value, seen = new WeakSet()) {
  if (isObjectUrl(value)) return "";
  if (!value || typeof value !== "object") return value;
  if (seen.has(value)) return value;
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => stripObjectUrls(item, seen));
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "_file" && key !== "facFile")
      .map(([key, item]) => [key, stripObjectUrls(item, seen)]),
  );
}
