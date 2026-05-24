function formatDetail(detail) {
  if (!detail) return null;
  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          const path = Array.isArray(item.loc) ? item.loc.join(".") : null;
          const msg = item.msg || item.message || JSON.stringify(item);
          return path ? `${path}: ${msg}` : msg;
        }
        return String(item);
      })
      .join("; ");
  }

  if (typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }

  return String(detail);
}

export async function getApiErrorMessage(response, fallback = "Ошибка запроса") {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json().catch(() => null);
    return formatDetail(data?.detail) || formatDetail(data) || fallback;
  }

  const text = await response.text().catch(() => "");
  return text || fallback;
}
