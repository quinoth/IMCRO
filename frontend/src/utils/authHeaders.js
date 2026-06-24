import { AUTH_REFRESH_TOKEN_STORAGE_KEYS, AUTH_STORAGE_KEY, AUTH_TOKEN_STORAGE_KEYS, isAccessTokenExpired } from "../auth.js";

export function getStoredAccessToken() {
  try {
    const user = JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || "null");
    const token = (
      user?.access_token ||
      AUTH_TOKEN_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean) ||
      ""
    );
    if (token && isAccessTokenExpired(token)) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      AUTH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      AUTH_REFRESH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      return "";
    }
    return token;
  } catch {
    const token = (
      AUTH_TOKEN_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean) ||
      ""
    );
    if (token && isAccessTokenExpired(token)) {
      AUTH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      AUTH_REFRESH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
      return "";
    }
    return token;
  }
}

export function authHeaders(headers = {}) {
  const token = getStoredAccessToken();
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}
