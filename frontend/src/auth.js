export const AUTH_STORAGE_KEY = "mky_current_user";
export const AUTH_TOKEN_STORAGE_KEYS = ["access_token", "mky_access_token"];
export const AUTH_REFRESH_TOKEN_STORAGE_KEYS = ["refresh_token", "mky_refresh_token"];

export const ROLE_LABELS = {
  user: "Пользователь",
  methodist: "Методист",
  operator: "Психолог",
  domu_editor: "Редактор Дома учителя",
  admin: "Администратор",
};

export const PERMISSION_LEVELS = {
  none: 0,
  view: 1,
  edit: 2,
};

export const DEFAULT_ROLE_PERMISSIONS = {
  admin: {
    articles: "edit",
    certificates: "edit",
    certificate_templates: "edit",
    users_roles: "edit",
    tpmpk: "edit",
    audit_log: "view",
    portal_settings: "edit",
  },
  methodist: {
    articles: "edit",
    certificates: "edit",
    certificate_templates: "edit",
    users_roles: "none",
    tpmpk: "none",
    audit_log: "view",
    portal_settings: "none",
  },
  metodist_editor: {
    articles: "edit",
    certificates: "edit",
    certificate_templates: "edit",
    users_roles: "none",
    tpmpk: "none",
    audit_log: "view",
    portal_settings: "none",
  },
  operator: {
    articles: "none",
    certificates: "none",
    certificate_templates: "none",
    users_roles: "none",
    tpmpk: "edit",
    audit_log: "view",
    portal_settings: "none",
  },
  tpmpk_admin: {
    articles: "none",
    certificates: "none",
    certificate_templates: "none",
    users_roles: "none",
    tpmpk: "edit",
    audit_log: "view",
    portal_settings: "none",
  },
  tpmpk_operator: {
    articles: "none",
    certificates: "none",
    certificate_templates: "none",
    users_roles: "none",
    tpmpk: "edit",
    audit_log: "view",
    portal_settings: "none",
  },
  domu_editor: {
    articles: "edit",
    certificates: "none",
    certificate_templates: "none",
    users_roles: "none",
    tpmpk: "none",
    audit_log: "view",
    portal_settings: "none",
  },
  user: {
    articles: "none",
    certificates: "none",
    certificate_templates: "none",
    users_roles: "none",
    tpmpk: "none",
    audit_log: "none",
    portal_settings: "none",
  },
};

export const TEST_USERS = {
  user: {
    id: 101,
    firstName: "Алексей",
    lastName: "Смирнов",
    middleName: "Петрович",
    username: "smirnov_ap",
    email: "user@mky.test",
    password: "user123",
    phone: "+7 (3952) 20-10-11",
    position: "Пользователь платформы",
    organization: "Образовательное сообщество МКУ ИМЦРО",
    qualification: "Участник",
    workExperience: 3,
    birthDate: "1992-03-15",
    created_at: "2025-02-10T00:00:00",
    role: "user",
    subjects: ["Образовательные события", "Повышение квалификации"],
    certificates: [
      { id: 1, title: "Цифровая грамотность педагога", issuer: "МКУ ИМЦРО", hours: 18, date: "2025-03-18" },
    ],
    achievements: [
      { id: 1, title: "Участник муниципального семинара", level: "Муниципальный", year: 2025 },
    ],
  },
  methodist: {
    id: 1,
    firstName: "Ирина",
    lastName: "Абрамова",
    middleName: "Владимировна",
    username: "abramova_iv",
    email: "methodist@mky.test",
    password: "methodist123",
    phone: "+7 (3952) 20-19-85",
    position: "Методист",
    organization: "МКУ развития образования города Иркутска",
    qualification: "Высшая категория",
    workExperience: 14,
    birthDate: "1985-04-20",
    created_at: "2024-09-01T00:00:00",
    role: "methodist",
    nextAttestationDate: "2026-11-01",
    subjects: ["Дополнительное образование", "Методическая работа"],
    certificates: [
      { id: 1, title: "Школьный театр как ресурс воспитания", issuer: "ИРО Иркутской области", hours: 36, date: "2025-11-14" },
      { id: 2, title: "Цифровые инструменты педагога", issuer: "МКУ РОИ", hours: 72, date: "2025-04-20" },
      { id: 3, title: "ФГОС: обновлённые требования", issuer: "Рос. акад. образования", hours: 108, date: "2024-12-05" },
    ],
    achievements: [
      { id: 1, title: "Победитель конкурса «Лучший методист года»", level: "Муниципальный", year: 2025 },
      { id: 2, title: "Участник конкурса «Педагог года Иркутской области»", level: "Региональный", year: 2024 },
      { id: 3, title: "Почётная грамота Министерства просвещения РФ", level: "Федеральный", year: 2023 },
    ],
  },
  admin: {
    id: 900,
    firstName: "Марина",
    lastName: "Кузнецова",
    middleName: "Андреевна",
    username: "admin_mky",
    email: "admin@mky.test",
    password: "admin123",
    phone: "+7 (3952) 20-00-01",
    position: "Администратор платформы",
    organization: "МКУ ИМЦРО",
    qualification: "Системный администратор",
    workExperience: 9,
    birthDate: "1988-10-08",
    created_at: "2024-01-15T00:00:00",
    role: "admin",
    subjects: ["Администрирование", "Контент", "Пользователи"],
    certificates: [],
    achievements: [
      { id: 1, title: "Запуск обновлённой платформы МКУ ИМЦРО", level: "Муниципальный", year: 2026 },
    ],
  },
  operator: {
    id: 901,
    firstName: "Ольга",
    lastName: "Петрова",
    middleName: "Сергеевна",
    username: "tpmpk_operator",
    email: "operator@mky.test",
    password: "operator123",
    phone: "+7 (3952) 48-12-56",
    position: "Психолог ТПМПК",
    organization: "ТПМПК г. Иркутска",
    qualification: "Специалист",
    workExperience: 6,
    birthDate: "1989-06-02",
    created_at: "2026-01-10T00:00:00",
    role: "operator",
    subjects: ["ТПМПК"],
    certificates: [],
    achievements: [],
  },
  domu_editor: {
    id: 902,
    firstName: "Елена",
    lastName: "Соколова",
    middleName: "Павловна",
    username: "domu_editor",
    email: "domu@mky.test",
    password: "domu123",
    phone: "+7 (3952) 48-12-56",
    position: "Редактор Дома учителя",
    organization: "Дом учителя",
    qualification: "Контент-редактор",
    workExperience: 8,
    birthDate: "1987-09-12",
    created_at: "2026-04-29T00:00:00",
    role: "domu_editor",
    subjects: ["Дом учителя", "Новости", "Мероприятия"],
    certificates: [],
    achievements: [],
  },
};

export const TEST_CREDENTIALS = [
  { role: "user", label: "Пользователь", email: "user@mky.test", password: "user123" },
  { role: "methodist", label: "Методист", email: "methodist@mky.test", password: "methodist123" },
  { role: "operator", label: "Психолог", email: "operator@mky.test", password: "operator123" },
  { role: "admin", label: "Администратор", email: "admin@mky.test", password: "admin123" },
  { role: "domu_editor", label: "Редактор Дома учителя", email: "domu@mky.test", password: "domu123" },
];

function withoutPassword(user) {
  if (!user) return null;
  const { password: _password, password_hash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= Number(payload.exp) * 1000;
}

export function authenticate(email, password) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const user = Object.values(TEST_USERS).find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!user || user.password !== password) return null;
  return withoutPassword(user);
}

export function mergeTestUserProfile(user) {
  if (!user?.email) return user;
  const normalizedEmail = String(user.email).trim().toLowerCase();
  const demoProfile = Object.values(TEST_USERS).find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!demoProfile) return user;
  return {
    ...withoutPassword(demoProfile),
    ...user,
    role: user.role || demoProfile.role,
  };
}

export function getRoleLabel(role) {
  return ROLE_LABELS[role] || role || "Пользователь";
}

function normalizeRoleName(user) {
  const role = typeof user?.role === "object" ? user.role?.role_name : user?.role;
  return String(role || "user").trim().toLowerCase() || "user";
}

export function getUserPermissions(user) {
  const role = normalizeRoleName(user);
  const defaults = DEFAULT_ROLE_PERMISSIONS[role] || DEFAULT_ROLE_PERMISSIONS.user;
  const explicit = user?.permissions && typeof user.permissions === "object" ? user.permissions : {};
  return { ...defaults, ...explicit };
}

export function hasPermission(user, moduleKey, minLevel = "view") {
  const required = PERMISSION_LEVELS[minLevel] ?? PERMISSION_LEVELS.view;
  const current = PERMISSION_LEVELS[getUserPermissions(user)[moduleKey] || "none"] ?? PERMISSION_LEVELS.none;
  return current >= required;
}

export function canAccessAdmin(user) {
  const role = normalizeRoleName(user);
  if (role === "domu_editor") return false;
  return (
    role === "methodist"
    || role === "admin"
    || hasPermission(user, "articles", "view")
    || hasPermission(user, "certificates", "view")
    || hasPermission(user, "certificate_templates", "view")
  );
}

export function canAccessTpmpkAdmin(user) {
  const role = normalizeRoleName(user);
  return role === "operator" || role === "tpmpk_operator" || role === "tpmpk_admin" || role === "admin" || hasPermission(user, "tpmpk", "view");
}

export function canAccessDomuAdmin(user) {
  const role = normalizeRoleName(user);
  return role === "domu_editor" || role === "methodist" || role === "admin" || hasPermission(user, "articles", "view");
}

export function canManageUsers(user) {
  const role = normalizeRoleName(user);
  return role === "admin";
}

export function getStoredUser() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    const user = raw ? JSON.parse(raw) : null;
    const token = user?.access_token || AUTH_TOKEN_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
    if (token && isAccessTokenExpired(token)) {
      clearStoredUser();
      return null;
    }
    if (user?.access_token) {
      AUTH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.setItem(key, user.access_token));
    }
    if (user?.refresh_token) {
      AUTH_REFRESH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.setItem(key, user.refresh_token));
    }
    return user;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  const safeUser = withoutPassword(user);
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(safeUser));
  if (safeUser?.access_token) {
    AUTH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.setItem(key, safeUser.access_token));
  }
  if (safeUser?.refresh_token) {
    AUTH_REFRESH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.setItem(key, safeUser.refresh_token));
  }
}

export function clearStoredUser() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  AUTH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
  AUTH_REFRESH_TOKEN_STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
}
