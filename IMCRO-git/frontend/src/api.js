const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── helpers ──────────────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem("access_token");
}

function saveToken(token) {
  localStorage.setItem("access_token", token);
}

function removeToken() {
  localStorage.removeItem("access_token");
}

// ── auth ─────────────────────────────────────────────────────────────────────

export async function apiRegister(email, password) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Ошибка регистрации");
  return data; // { id, email, is_active }
}

export async function apiLogin(email, password) {
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "Неверный email или пароль");
  saveToken(data.access_token);
  return data; // { access_token, token_type }
}

export function apiLogout() {
  removeToken();
}

export async function apiMe() {
  const res = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Не авторизован");
  return res.json(); // { id, email, is_active }
}

export function isLoggedIn() {
  return Boolean(getToken());
}
