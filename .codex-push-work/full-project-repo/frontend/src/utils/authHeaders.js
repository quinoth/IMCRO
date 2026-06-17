import { AUTH_STORAGE_KEY, isAccessTokenExpired } from "../auth.js";

export function getStoredAccessToken() {
  try {
    const user = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || "null");
    const token = (
      user?.access_token ||
      window.localStorage.getItem("mky_access_token") ||
      window.localStorage.getItem("access_token") ||
      ""
    );
    if (token && isAccessTokenExpired(token)) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.localStorage.removeItem("mky_access_token");
      window.localStorage.removeItem("access_token");
      return "";
    }
    return token;
  } catch {
    const token = (
      window.localStorage.getItem("mky_access_token") ||
      window.localStorage.getItem("access_token") ||
      ""
    );
    if (token && isAccessTokenExpired(token)) {
      window.localStorage.removeItem("mky_access_token");
      window.localStorage.removeItem("access_token");
      return "";
    }
    return token;
  }
}

export function authHeaders(headers = {}) {
  const token = getStoredAccessToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}
