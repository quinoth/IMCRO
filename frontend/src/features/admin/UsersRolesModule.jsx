import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../constants/index.js";
import { DEFAULT_ROLE_PERMISSIONS, getRoleLabel } from "../../auth.js";
import { authHeaders } from "../../utils/authHeaders.js";

const emptyForm = {
  id: null,
  email: "",
  last_name: "",
  first_name: "",
  middle_name: "",
  password: "",
  role: "user",
};

const ROLE_ORDER = ["admin", "methodist", "metodist_editor", "operator", "tpmpk_admin", "tpmpk_operator", "domu_editor", "user"];

const ROLE_META = {
  admin: { accent: "#19789c", description: "Полный административный доступ" },
  methodist: { accent: "#19789c", description: "Материалы портала и наградная продукция" },
  metodist_editor: { accent: "#19789c", description: "Материалы портала и наградная продукция" },
  operator: { accent: "#004f75", description: "Работа с расписанием и заявками ТПМПК" },
  tpmpk_admin: { accent: "#004f75", description: "Администрирование раздела ТПМПК" },
  tpmpk_operator: { accent: "#004f75", description: "Оператор раздела ТПМПК" },
  domu_editor: { accent: "#19789c", description: "Публикации раздела «Дом учителя»" },
  user: { accent: "#64748b", description: "Базовая роль пользователя" },
};

const FALLBACK_ROLES = ROLE_ORDER.map((roleName) => ({
  id: `fallback-${roleName}`,
  role_name: roleName,
  permissions: DEFAULT_ROLE_PERMISSIONS[roleName] || DEFAULT_ROLE_PERMISSIONS.user,
}));

const MODULE_DEFINITIONS = [
  { key: "articles", label: "Статьи", description: "Материалы публичных разделов" },
  { key: "certificates", label: "Выпуск грамот", description: "Одиночный и групповой выпуск PDF" },
  { key: "certificate_templates", label: "Шаблоны", description: "Конструктор шаблонов и подписантов" },
  { key: "users_roles", label: "Пользователи", description: "Учётные записи и права доступа" },
  { key: "tpmpk", label: "Кабинет ТПМПК", description: "Расписание, слоты и записи" },
  { key: "audit_log", label: "Журнал действий", description: "Просмотр действий пользователей" },
  { key: "portal_settings", label: "Настройки портала", description: "Административные параметры системы" },
];

const PERMISSION_OPTIONS = [
  { value: "none", label: "Запрещено", short: "Запрещено" },
  { value: "view", label: "Только просмотр", short: "Только просмотр" },
  { value: "edit", label: "Разрешено", short: "Разрешено" },
];

function normalizeRoleName(value) {
  const role = typeof value?.role === "object" ? value.role?.role_name : value?.role || value;
  return String(role || "user").trim().toLowerCase() || "user";
}

function roleDetails(roleName) {
  return ROLE_META[roleName] || {
    accent: "#475569",
    description: "Роль из backend-справочника",
  };
}

function normalizePermissions(roleName, permissions) {
  const defaults = DEFAULT_ROLE_PERMISSIONS[roleName] || DEFAULT_ROLE_PERMISSIONS.user;
  const explicit = permissions && typeof permissions === "object" ? permissions : {};
  return MODULE_DEFINITIONS.reduce((result, module) => {
    const level = String(explicit[module.key] || defaults[module.key] || "none").toLowerCase();
    result[module.key] = PERMISSION_OPTIONS.some((option) => option.value === level) ? level : "none";
    return result;
  }, {});
}

function permissionsKey(permissions) {
  return MODULE_DEFINITIONS.map((module) => `${module.key}:${permissions[module.key] || "none"}`).join("|");
}

function sortRoles(roles) {
  return [...roles].sort((left, right) => {
    const leftIndex = ROLE_ORDER.indexOf(left.role_name);
    const rightIndex = ROLE_ORDER.indexOf(right.role_name);
    if (leftIndex !== -1 || rightIndex !== -1) {
      return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
    }
    return String(left.role_name).localeCompare(String(right.role_name), "ru");
  });
}

function roleName(user) {
  return normalizeRoleName(user);
}

function initials(user) {
  const source = userDisplayName(user) || user?.email || "?";
  const parts = String(source).replace(/@.+$/, "").split(/[._\s-]+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return String(source).slice(0, 2).toUpperCase();
}

function userDisplayName(user) {
  const fio = [
    user?.last_name || user?.lastName,
    user?.first_name || user?.firstName,
    user?.middle_name || user?.middleName,
  ].filter(Boolean).join(" ");
  return user?.full_name || user?.fullName || fio || user?.email || `Пользователь #${user?.id || ""}`;
}

function userSecondaryLine(user) {
  return user?.email || "Контакты не указаны";
}

function accessSummary(permissions) {
  const hasFullAccess = ["articles", "certificates", "certificate_templates", "users_roles"].every(
    (key) => permissions[key] === "edit",
  );
  if (hasFullAccess) return "Полный доступ";
  const enabled = MODULE_DEFINITIONS
    .filter((module) => permissions[module.key] !== "none")
    .map((module) => {
      const suffix = permissions[module.key] === "view" ? "просмотр" : "правка";
      return `${module.label} (${suffix})`;
    });
  return enabled.length ? enabled.join(", ") : "Нет доступных разделов";
}

function _permissionClass(level) {
  if (level === "edit") return "edit";
  if (level === "view") return "view";
  return "none";
}

function _permissionLabel(level) {
  return PERMISSION_OPTIONS.find((option) => option.value === level)?.label || "Запрещено";
}

async function errorMessage(response, fallback) {
  const data = await response.json().catch(() => null);
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((item) => item?.msg || String(item)).join("; ");
  }
  return fallback;
}

export default function UsersRolesModule({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState("admin");
  const [permissionDraft, setPermissionDraft] = useState(() => normalizePermissions("admin"));
  const [activityLog, setActivityLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("fio");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null); // key модуля с открытым dd

  const isAdmin = roleName(currentUser) === "admin";
  const sortedUsers = useMemo(
    () => {
      const query = userSearch.trim().toLowerCase();
      return users
        .filter((user) => {
          if (query) {
            const haystack = `${userDisplayName(user)} ${userSecondaryLine(user)} ${user?.email || ""}`.toLowerCase();
            if (!haystack.includes(query)) return false;
          }
          if (roleFilter !== "all" && roleName(user) !== roleFilter) return false;
          if (statusFilter === "active" && user.is_active === false) return false;
          if (statusFilter === "inactive" && user.is_active !== false) return false;
          return true;
        })
        .sort((left, right) => {
          if (sortBy === "role") return getRoleLabel(roleName(left)).localeCompare(getRoleLabel(roleName(right)), "ru");
          if (sortBy === "status") return Number(right.is_active !== false) - Number(left.is_active !== false);
          return userDisplayName(left).localeCompare(userDisplayName(right), "ru");
        });
    },
    [roleFilter, sortBy, statusFilter, userSearch, users],
  );
  const pageCount = Math.max(1, Math.ceil(sortedUsers.length / pageSize));
  const pagedUsers = sortedUsers.slice((page - 1) * pageSize, page * pageSize);
  const sortedRoles = useMemo(() => sortRoles(roles.length ? roles : FALLBACK_ROLES), [roles]);
  const selectedRoleData = useMemo(
    () => sortedRoles.find((role) => role.role_name === selectedRole) || null,
    [selectedRole, sortedRoles],
  );
  const selectedRolePermissions = useMemo(
    () => normalizePermissions(selectedRole, selectedRoleData?.permissions),
    [selectedRole, selectedRoleData],
  );
  const savedPermissionsKey = useMemo(() => permissionsKey(selectedRolePermissions), [selectedRolePermissions]);
  const draftPermissionsKey = useMemo(() => permissionsKey(permissionDraft), [permissionDraft]);
  const permissionsDirty = savedPermissionsKey !== draftPermissionsKey;
  const _selectedRoleDetails = roleDetails(selectedRole);
  const selectedRoleUsers = users.filter((user) => roleName(user) === selectedRole).length;
  const demoActivityRows = useMemo(() => ([
    { id: "demo-role", time: "Сегодня, 10:12", user: "Марина Кузнецова", action: "Изменение роли пользователя", section: "Пользователи", status: "Успешно" },
    { id: "demo-article", time: "Сегодня, 09:34", user: "Ирина Абрамова", action: "Создание статьи", section: "Статьи", status: "Успешно" },
    { id: "demo-template", time: "Вчера, 16:05", user: "Администратор", action: "Обновление шаблона грамоты", section: "Выпуск грамот", status: "Успешно" },
  ]), []);
  const activityRows = activityLog.length > 0 ? activityLog : demoActivityRows;

  const permissionsForRole = useCallback(
    (roleNameValue) => {
      const normalizedRole = normalizeRoleName(roleNameValue);
      const role = roles.find((item) => item.role_name === normalizedRole);
      return normalizePermissions(normalizedRole, role?.permissions);
    },
    [roles],
  );

  const loadData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        fetch(`${API_BASE}/users/`, { headers: authHeaders() }),
        fetch(`${API_BASE}/users/roles/`, { headers: authHeaders() }),
      ]);
      if (!usersResponse.ok) {
        throw new Error(await errorMessage(usersResponse, "Не удалось загрузить пользователей"));
      }
      if (!rolesResponse.ok) {
        throw new Error(await errorMessage(rolesResponse, "Не удалось загрузить роли"));
      }

      const loadedUsers = await usersResponse.json();
      const loadedRoles = await rolesResponse.json();
      const normalizedRoles = Array.isArray(loadedRoles) ? loadedRoles : [];
      setUsers(Array.isArray(loadedUsers) ? loadedUsers : []);
      setRoles(normalizedRoles);
      setSelectedRole((prev) => {
        if (normalizedRoles.some((role) => role.role_name === prev)) return prev;
        return sortRoles(normalizedRoles)[0]?.role_name || "user";
      });
    } catch (err) {
      setError(err.message || "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPermissionDraft(selectedRolePermissions);
  }, [selectedRole, selectedRolePermissions]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, roleFilter, statusFilter, sortBy, userSearch]);

  useEffect(() => {
    if (!openDropdown) return;
    const close = () => setOpenDropdown(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openDropdown]);

  function pushActivity(action, subject, section = "Пользователи") {
    const now = new Date();
    setActivityLog((prev) => [
      {
        id: `${now.getTime()}-${subject?.id || section}`,
        time: now.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
        user: subject?.displayName || userDisplayName(subject),
        action,
        section,
        status: "Успешно",
      },
      ...prev,
    ].slice(0, 5));
  }

  function updateForm(field, value) {
    setError("");
    setSuccess("");
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updatePermission(moduleKey, level) {
    setError("");
    setSuccess("");
    setPermissionDraft((prev) => ({ ...prev, [moduleKey]: level }));
  }

  function startCreate() {
    setForm({ ...emptyForm, role: selectedRole || sortedRoles[0]?.role_name || "user" });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function editUser(user) {
    const userRole = roleName(user);
    setSelectedRole(userRole);
    setForm({
      id: user.id,
      email: user.email || "",
      last_name: user.last_name || user.lastName || "",
      first_name: user.first_name || user.firstName || "",
      middle_name: user.middle_name || user.middleName || "",
      password: "",
      role: userRole,
    });
    setShowForm(true);
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setForm(emptyForm);
    setShowForm(false);
    setError("");
    setSuccess("");
  }

  async function saveUser(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const isEdit = Boolean(form.id);
      const payload = isEdit
        ? { role: form.role }
        : {
            email: form.email.trim(),
            last_name: form.last_name.trim() || undefined,
            first_name: form.first_name.trim() || undefined,
            middle_name: form.middle_name.trim() || undefined,
            password: form.password.trim(),
            role: form.role,
            is_active: true,
          };

      if (!isEdit && !payload.password) {
        throw new Error("Для нового пользователя укажите пароль");
      }

      const response = await fetch(`${API_BASE}/users/${isEdit ? `${form.id}` : ""}`, {
        method: isEdit ? "PUT" : "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await errorMessage(response, "Не удалось сохранить пользователя"));
      }

      const savedUser = await response.json();
      setSuccess(isEdit ? "Роль пользователя обновлена" : "Пользователь создан");
      pushActivity(isEdit ? "Изменение роли пользователя" : "Создание пользователя", savedUser);
      setSelectedRole(roleName(savedUser));
      setForm(emptyForm);
      setShowForm(false);
      await loadData();
    } catch (err) {
      setError(err.message || "Не удалось сохранить пользователя");
    } finally {
      setSaving(false);
    }
  }

  async function saveRolePermissions() {
    if (!selectedRoleData) return;
    setSavingPermissions(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${API_BASE}/users/roles/${selectedRoleData.id}/permissions/`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ permissions: permissionDraft }),
      });
      if (!response.ok) {
        throw new Error(await errorMessage(response, "Не удалось сохранить права роли"));
      }
      const updatedRole = await response.json();
      setRoles((prev) => prev.map((role) => (role.id === updatedRole.id ? updatedRole : role)));
      setSuccess("Права роли сохранены");
      pushActivity("Изменение прав роли", { id: updatedRole.id, displayName: getRoleLabel(updatedRole.role_name) }, "Роли");
    } catch (err) {
      setError(err.message || "Не удалось сохранить права роли");
    } finally {
      setSavingPermissions(false);
    }
  }

  if (!isAdmin) {
    return (
      <section style={{ padding: 24, border: "1px solid #FED7AA", borderRadius: 8, background: "#FFF7ED", color: "#9A3412", fontWeight: 700 }}>
        Раздел доступен только администратору.
      </section>
    );
  }

  return (
    <section className="ur-admin">
      <style>{`
        @keyframes urFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes urDdIn {
          from { opacity: 0; transform: translateY(-6px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .ur-admin {
          --ur-blue: #19789c;
          --ur-blue-dark: #004f75;
          --ur-blue-soft: #edf6f8;
          --ur-border: #cdd8df;
          --ur-line: #e8eef8;
          --ur-muted: #5b6577;
          --ur-ink: #132033;
          --ur-radius-lg: 18px;
          --ur-radius-md: 12px;
          --ur-radius-sm: 8px;
          color: var(--ur-ink);
          margin: 0;
          min-width: 0;
        }
        .ur-admin * { box-sizing: border-box; letter-spacing: 0; }
        .ur-page-head {
          display: flex;
          justify-content: space-between;
          gap: 18px;
          align-items: flex-start;
          margin-bottom: 18px;
          animation: urFadeIn 0.24s ease both;
        }
        .ur-page-head h2 { margin: 0 0 5px; font-size: 26px; line-height: 1.1; font-weight: 900; }
        .ur-page-head p { margin: 0; color: var(--ur-muted); font-size: 14px; font-weight: 650; line-height: 1.5; overflow-wrap: anywhere; }
        .ur-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 350px);
          gap: 16px;
          align-items: start;
        }
        .ur-card {
          overflow: hidden;
          border: 1px solid var(--ur-border);
          border-radius: var(--ur-radius-lg);
          background: rgba(255,255,255,.97);
          box-shadow: 0 12px 36px rgba(25,78,160,.07);
          animation: urFadeIn 0.26s ease both;
        }
        .ur-card-head {
          min-height: 58px;
          padding: 13px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid var(--ur-line);
        }
        .ur-card-head h3 { margin: 0; font-size: 16px; line-height: 1.2; font-weight: 900; overflow-wrap: anywhere; }
        .ur-button,
        .ur-action-link,
        .ur-role-button,
        .ur-segment-button {
          font-family: inherit;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease, color .18s ease;
        }
        .ur-button {
          min-height: 38px;
          border-radius: var(--ur-radius-sm);
          border: 1px solid transparent;
          padding: 0 14px;
          cursor: pointer;
          font-size: 13px;
          line-height: 1.1;
          font-weight: 850;
          white-space: normal;
        }
        .ur-button.primary { color: #fff; background: var(--ur-blue); box-shadow: 0 10px 22px rgba(25,120,156,.22); }
        .ur-button.secondary { color: var(--ur-blue); background: #f7faff; border-color: #cddcff; }
        .ur-button.ghost { color: #475569; background: #fff; border-color: #dbe3f0; }
        .ur-button:hover:not(:disabled), .ur-action-link:hover:not(:disabled), .ur-role-button:hover:not(:disabled) { transform: translateY(-1px); }
        .ur-button.primary:hover:not(:disabled) { background: var(--ur-blue-dark); box-shadow: 0 14px 26px rgba(25,120,156,.27); }
        .ur-button.success { color: #fff; background: #059669; box-shadow: 0 8px 18px rgba(5,150,105,.22); }
        .ur-button:disabled, .ur-action-link:disabled, .ur-segment-button:disabled { opacity: .58; cursor: not-allowed; transform: none; box-shadow: none; }
        .ur-refresh { flex: 0 0 auto; }
        .ur-alert { margin-bottom: 12px; border-radius: var(--ur-radius-md); padding: 11px 14px; font-weight: 750; line-height: 1.45; overflow-wrap: anywhere; animation: urFadeIn .2s ease both; }
        .ur-alert.error { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; }
        .ur-alert.success { background: #ecfdf5; border: 1px solid #bbf7d0; color: #047857; }
        .ur-table-wrap { min-height: 380px; overflow-x: auto; }
        .ur-table { width: 100%; min-width: 940px; border-collapse: collapse; font-size: 13px; }
        .ur-table th { padding: 12px 16px; color: #4f5667; background: #f5f7fb; text-align: left; font-size: 11px; text-transform: uppercase; white-space: nowrap; }
        .ur-table td { padding: 12px 16px; border-top: 1px solid var(--ur-line); color: #172033; font-weight: 700; vertical-align: middle; min-width: 0; }
        .ur-table tr { transition: background .16s ease; }
        .ur-table tbody tr:hover { background: #f9fbff; }
        .ur-access-cell { max-width: 240px; color: #475569; font-size: 12px; font-weight: 680; line-height: 1.4; overflow-wrap: anywhere; }
        .ur-user-cell { display: grid; grid-template-columns: 30px minmax(0,1fr); gap: 10px; align-items: center; min-width: 0; }
        .ur-avatar { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; color: #fff; background: var(--role-accent, var(--ur-blue)); font-size: 10px; font-weight: 900; box-shadow: 0 6px 14px rgba(15,23,42,.14); }
        .ur-name { display: block; max-width: 220px; line-height: 1.25; overflow-wrap: anywhere; }
        .ur-email { display: inline-block; max-width: 240px; color: #5e6678; font-size: 12px; font-weight: 650; overflow-wrap: anywhere; }
        .ur-user-filters { display: grid; grid-template-columns: minmax(200px,1fr) repeat(4, minmax(140px,auto)); gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--ur-line); background: #fbfcfd; }
        .ur-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; border-top: 1px solid var(--ur-line); color: #5b6577; font-size: 13px; font-weight: 750; flex-wrap: wrap; }
        .ur-pagination > div { display: flex; align-items: center; gap: 10px; }
        .ur-role-pill, .ur-status, .ur-level-pill {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 22px; border-radius: 999px; padding: 0 8px;
          font-size: 11px; font-weight: 900; line-height: 1.1; white-space: nowrap;
        }
        .ur-role-pill { color: var(--role-accent, var(--ur-blue)); background: #f1f6ff; border: 1px solid #dbe7ff; }
        .ur-status.active { color: #07883c; background: #dcfce7; }
        .ur-status.inactive { color: #657080; background: #edf2f7; }
        .ur-level-pill.edit { color: #047857; background: #dcfce7; }
        .ur-level-pill.view { color: var(--ur-blue-dark); background: var(--ur-blue-soft); }
        .ur-level-pill.none { color: #6b7280; background: #eef2f7; }
        .ur-row-actions { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; min-width: max-content; }
        .ur-action-link { min-height: 30px; border: 1px solid #d8e3f8; border-radius: var(--ur-radius-sm); padding: 0 10px; cursor: pointer; color: var(--ur-blue); background: #f8fbff; font-size: 12px; font-weight: 850; }
        .ur-side { display: grid; gap: 14px; min-width: 0; }
        .ur-role-list { padding: 10px 12px 12px; display: grid; gap: 6px; }
        .ur-role-button {
          min-height: 48px; width: 100%;
          border: 1px solid var(--ur-line);
          border-radius: var(--ur-radius-md);
          padding: 8px 11px;
          background: #fff; color: #172033; cursor: pointer; text-align: left;
          display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 10px; align-items: center;
        }
        .ur-role-button.active { border-color: var(--role-accent, var(--ur-blue)); box-shadow: inset 0 0 0 1px var(--role-accent, var(--ur-blue)), 0 8px 20px rgba(11,63,179,.09); color: var(--role-accent, var(--ur-blue)); background: #f7faff; }
        .ur-role-title { display: block; font-size: 13px; font-weight: 900; line-height: 1.2; overflow-wrap: anywhere; }
        .ur-role-subtitle { display: block; margin-top: 2px; color: #64748b; font-size: 11px; line-height: 1.25; font-weight: 650; overflow-wrap: anywhere; }
        .ur-role-count { min-width: 24px; height: 24px; border-radius: 999px; display: grid; place-items: center; background: #eef3ff; color: var(--role-accent, var(--ur-blue)); font-size: 11px; font-weight: 900; }
        .ur-label { color: #5e6678; font-size: 11px; font-weight: 900; text-transform: uppercase; }
        .ur-input, .ur-select { width: 100%; min-height: 40px; border: 1px solid #cdd7e8; border-radius: var(--ur-radius-sm); padding: 0 11px; color: #172033; background: #fff; font: 760 13px/1.2 inherit; min-width: 0; }
        .ur-input:focus, .ur-select:focus, .ur-action-link:focus, .ur-button:focus, .ur-role-button:focus, .ur-segment-button:focus { outline: 0; border-color: var(--ur-blue); box-shadow: 0 0 0 3px rgba(25,120,156,.15); }

        /* ── Компактный блок "Права роли" ─────────────────────────── */
        .ur-perm-list { padding: 0; }
        .ur-perm-row {
          display: flex; align-items: center; justify-content: space-between; gap: 10px;
          padding: 0 14px;
          min-height: 46px;
          border-bottom: 1px solid var(--ur-line);
          transition: background .14s ease;
          position: relative;
        }
        .ur-perm-row:last-child { border-bottom: none; }
        .ur-perm-row:hover { background: #f5f9fc; }
        .ur-perm-label { font-size: 13px; font-weight: 800; color: #172033; min-width: 0; }
        .ur-perm-badge {
          display: inline-flex; align-items: center; gap: 5px;
          min-height: 28px; padding: 0 10px 0 8px;
          border-radius: 999px; border: 1px solid transparent;
          font-size: 12px; font-weight: 900; white-space: nowrap;
          cursor: pointer; user-select: none;
          transition: filter .14s ease, box-shadow .14s ease;
          flex-shrink: 0;
        }
        .ur-perm-badge:hover { filter: brightness(.94); }
        .ur-perm-badge.edit  { color: #047857; background: #d1fae5; border-color: #6ee7b7; }
        .ur-perm-badge.view  { color: var(--ur-blue-dark); background: var(--ur-blue-soft); border-color: #a5d4e4; }
        .ur-perm-badge.none  { color: #6b7280; background: #f1f5f9; border-color: #d1d9e0; }
        .ur-perm-badge svg   { width: 11px; height: 11px; flex-shrink: 0; }
        /* dropdown */
        .ur-perm-dd-wrap { position: relative; }
        .ur-perm-dd {
          position: absolute; top: calc(100% + 6px); right: 0; z-index: 200;
          min-width: 168px;
          background: #fff;
          border: 1px solid #d0dae8;
          border-radius: var(--ur-radius-md);
          box-shadow: 0 16px 48px rgba(11,31,42,.18);
          overflow: hidden;
          animation: urDdIn .16s ease both;
        }
        .ur-perm-dd-item {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 13px;
          cursor: pointer; font-size: 13px; font-weight: 800;
          transition: background .12s ease;
          border: none; background: transparent; width: 100%; text-align: left; font-family: inherit;
        }
        .ur-perm-dd-item:hover { background: #f0f6fa; }
        .ur-perm-dd-item.active { background: #edf6f8; color: var(--ur-blue-dark); }
        .ur-perm-dd-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
        .ur-perm-dd-dot.edit { background: #10b981; }
        .ur-perm-dd-dot.view { background: var(--ur-blue); }
        .ur-perm-dd-dot.none { background: #94a3b8; }
        /* footer */
        .ur-permission-footer { padding: 10px 14px 14px; display: grid; gap: 8px; }
        .ur-permission-state { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 12px; font-weight: 750; min-width: 0; }
        .ur-perm-dirty { color: #92400e; }
        .ur-perm-saved { color: #047857; }
        .ur-perm-idle  { color: #64748b; }
        .ur-role-meta { color: #596374; font-size: 12px; font-weight: 650; line-height: 1.4; padding: 10px 14px 0; margin: 0; overflow-wrap: anywhere; }
        .ur-role-meta strong { color: var(--ur-blue); }
        /* ── legacy segmented (скрываем, заменили на dropdown) ─────── */
        .ur-permissions, .ur-permission-row, .ur-segmented { display: none; }

        .ur-form-card { margin-top: 14px; }
        .ur-user-form { padding: 14px; display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 11px; }
        .ur-field { display: grid; gap: 5px; min-width: 0; }
        .ur-field.full { grid-column: 1 / -1; }
        .ur-readonly-user { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; padding: 11px; border: 1px solid #e2eaf7; border-radius: var(--ur-radius-md); background: #f8fbff; }
        .ur-readonly-item { min-width: 0; }
        .ur-readonly-item span { display: block; margin-bottom: 3px; color: #64748b; font-size: 11px; font-weight: 900; text-transform: uppercase; }
        .ur-readonly-item strong { display: block; color: #172033; font-size: 13px; line-height: 1.35; font-weight: 850; overflow-wrap: anywhere; }
        .ur-form-actions { grid-column: 1 / -1; display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
        .ur-activity { margin-top: 14px; }
        .ur-activity-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .ur-activity-table th, .ur-activity-table td { padding: 10px 14px; border-top: 1px solid var(--ur-line); text-align: left; line-height: 1.35; overflow-wrap: anywhere; }
        .ur-activity-table th { color: #5b6575; font-size: 11px; text-transform: uppercase; background: #fff; }
        .ur-empty { padding: 16px; color: #64748b; font-weight: 700; line-height: 1.45; overflow-wrap: anywhere; }
        .ur-empty.compact { padding: 10px 14px; border-bottom: 1px solid var(--ur-line); background: #fbfcfd; font-size: 12px; }
        .ur-stats { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
        .ur-stat-card { min-height: 96px; border: 1px solid var(--ur-border); border-radius: var(--ur-radius-md); color: #fff; background: var(--ur-blue); padding: 16px; box-shadow: 0 10px 22px rgba(25,120,156,.2); }
        .ur-stat-card:nth-child(2) { background: var(--ur-blue-dark); }
        .ur-stat-card span { display: block; font-size: 11px; font-weight: 900; text-transform: uppercase; opacity: .88; }
        .ur-stat-card strong { display: block; margin-top: 10px; font-size: 30px; line-height: 1; font-weight: 950; }
        @media (max-width: 1180px) {
          .ur-layout { grid-template-columns: 1fr; }
          .ur-side { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .ur-user-filters { grid-template-columns: repeat(2, minmax(0,1fr)); }
        }
        @media (max-width: 760px) {
          .ur-page-head { display: grid; }
          .ur-refresh { width: 100%; }
          .ur-side { grid-template-columns: 1fr; }
          .ur-user-form { grid-template-columns: 1fr; }
          .ur-readonly-user { grid-template-columns: 1fr; }
          .ur-card-head { align-items: stretch; flex-direction: column; }
          .ur-card-head .ur-button { width: 100%; }
          .ur-user-filters { grid-template-columns: 1fr; }
          .ur-pagination { align-items: stretch; flex-direction: column; }
          .ur-pagination > div { justify-content: space-between; }
        }
      `}</style>

      {error && <div className="ur-alert error">{error}</div>}
      {success && <div className="ur-alert success">{success}</div>}

      <div className="ur-layout">
        <div>
          <div className="ur-card">
            <div className="ur-card-head">
              <h3>Пользователи системы</h3>
              <button type="button" className="ur-button primary" onClick={startCreate}>
                + Добавить пользователя
              </button>
            </div>
            <div className="ur-user-filters">
              <input
                className="ur-input"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Поиск по ФИО, email или логину"
              />
              <select className="ur-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">Все роли</option>
                {sortedRoles.map((role) => (
                  <option key={role.id || role.role_name} value={role.role_name}>{getRoleLabel(role.role_name)}</option>
                ))}
              </select>
              <select className="ur-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Все статусы</option>
                <option value="active">Активные</option>
                <option value="inactive">Неактивные</option>
              </select>
              <select className="ur-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="fio">Сортировка: ФИО</option>
                <option value="role">Сортировка: роль</option>
                <option value="status">Сортировка: статус</option>
              </select>
              <select className="ur-select" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                <option value={10}>10 строк</option>
                <option value={25}>25 строк</option>
                <option value={50}>50 строк</option>
              </select>
            </div>
            <div className="ur-table-wrap">
              <table className="ur-table">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Роль</th>
                    <th>Доступные разделы</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedUsers.map((user) => {
                    const currentRole = roleName(user);
                    const details = roleDetails(currentRole);
                    const permissions = permissionsForRole(currentRole);
                    return (
                      <tr key={user.id}>
                        <td>
                          <div className="ur-user-cell" style={{ "--role-accent": details.accent }}>
                            <span className="ur-avatar">{initials(user)}</span>
                            <span>
                              <strong className="ur-name">{userDisplayName(user)}</strong>
                              <span className="ur-email">{userSecondaryLine(user)}</span>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="ur-role-pill" style={{ "--role-accent": details.accent }}>
                            {getRoleLabel(currentRole)}
                          </span>
                        </td>
                        <td><div className="ur-access-cell">{accessSummary(permissions)}</div></td>
                        <td>
                          <span className={`ur-status ${user.is_active === false ? "inactive" : "active"}`}>
                            {user.is_active === false ? "Неактивен" : "Активен"}
                          </span>
                        </td>
                        <td>
                          <div className="ur-row-actions">
                            <button type="button" className="ur-action-link" onClick={() => editUser(user)}>
                              Изменить роль
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && sortedUsers.length === 0 && (
                    <tr>
                      <td colSpan="5"><div className="ur-empty">Пользователи не найдены. Измените условия поиска или фильтры.</div></td>
                    </tr>
                  )}
                  {loading && (
                    <tr>
                      <td colSpan="5"><div className="ur-empty">Загрузка пользователей...</div></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="ur-pagination">
              <span>Показано {sortedUsers.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, sortedUsers.length)} из {sortedUsers.length}</span>
              <div>
                <button type="button" className="ur-button ghost" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>
                  Назад
                </button>
                <span>{page} / {pageCount}</span>
                <button type="button" className="ur-button ghost" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={page >= pageCount}>
                  Вперёд
                </button>
              </div>
            </div>
          </div>

          {showForm && (
            <div className="ur-card ur-form-card">
              <div className="ur-card-head">
                <h3>{form.id ? "Изменение роли пользователя" : "Новый пользователь"}</h3>
                <button type="button" className="ur-button ghost" onClick={resetForm}>Закрыть</button>
              </div>
              <form className="ur-user-form" onSubmit={saveUser}>
                {form.id ? (
                  <div className="ur-readonly-user">
                    <div className="ur-readonly-item">
                      <span>Пользователь</span>
                      <strong>{[form.last_name, form.first_name, form.middle_name].filter(Boolean).join(" ") || form.email}</strong>
                    </div>
                    <div className="ur-readonly-item">
                      <span>Email</span>
                      <strong>{form.email}</strong>
                    </div>
                    <div className="ur-readonly-item">
                      <span>Действие</span>
                      <strong>Изменяется только роль</strong>
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="ur-field">
                      <span className="ur-label">Email</span>
                      <input className="ur-input" type="email" value={form.email} onChange={(event) => updateForm("email", event.target.value)} required />
                    </label>
                    <label className="ur-field">
                      <span className="ur-label">Фамилия</span>
                      <input className="ur-input" value={form.last_name} onChange={(event) => updateForm("last_name", event.target.value)} placeholder="Иванов" />
                    </label>
                    <label className="ur-field">
                      <span className="ur-label">Имя</span>
                      <input className="ur-input" value={form.first_name} onChange={(event) => updateForm("first_name", event.target.value)} placeholder="Иван" />
                    </label>
                    <label className="ur-field">
                      <span className="ur-label">Отчество</span>
                      <input className="ur-input" value={form.middle_name} onChange={(event) => updateForm("middle_name", event.target.value)} placeholder="Иванович" />
                    </label>
                    <label className="ur-field full">
                      <span className="ur-label">Пароль</span>
                      <input className="ur-input" type="password" value={form.password} onChange={(event) => updateForm("password", event.target.value)} minLength={6} required placeholder="Минимум 6 символов" />
                    </label>
                  </>
                )}
                <label className="ur-field full">
                  <span className="ur-label">Роль</span>
                  <select className="ur-select" value={form.role} onChange={(event) => updateForm("role", event.target.value)}>
                    {sortedRoles.map((role) => (
                      <option key={role.id || role.role_name} value={role.role_name}>
                        {getRoleLabel(role.role_name)}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="ur-form-actions">
                  <button type="button" className="ur-button ghost" onClick={resetForm}>Отмена</button>
                  <button type="submit" className="ur-button primary" disabled={saving || sortedRoles.length === 0}>
                    {saving ? "Сохранение..." : form.id ? "Сохранить роль" : "Создать пользователя"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="ur-card ur-activity">
            <div className="ur-card-head">
              <h3>Последние действия</h3>
            </div>
            {!activityLog.length && <div className="ur-empty compact">Реальных действий в текущей сессии пока нет. Ниже показан пример журнала.</div>}
            <table className="ur-activity-table">
              <thead>
                <tr>
                  <th>Дата и время</th>
                  <th>Объект</th>
                  <th>Действие</th>
                  <th>Раздел</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {activityRows.map((item) => (
                  <tr key={item.id}>
                    <td>{item.time}</td>
                    <td>{item.user}</td>
                    <td>{item.action}</td>
                    <td>{item.section}</td>
                    <td><span className="ur-status active">{item.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="ur-side">
          <div className="ur-card">
            <div className="ur-card-head">
              <h3>Роли системы</h3>
            </div>
            <div className="ur-role-list">
              {sortedRoles.map((role) => {
                const details = roleDetails(role.role_name);
                const count = users.filter((user) => roleName(user) === role.role_name).length;
                return (
                  <button
                    key={role.id || role.role_name}
                    type="button"
                    className={`ur-role-button ${selectedRole === role.role_name ? "active" : ""}`}
                    style={{ "--role-accent": details.accent }}
                    onClick={() => setSelectedRole(role.role_name)}
                  >
                    <span>
                      <span className="ur-role-title">{getRoleLabel(role.role_name)}</span>
                      <span className="ur-role-subtitle">{details.description}</span>
                    </span>
                    <span className="ur-role-count">{count}</span>
                  </button>
                );
              })}
              {!loading && sortedRoles.length === 0 && (
                <div className="ur-empty">Роли не найдены.</div>
              )}
            </div>
          </div>

          <div className="ur-card">
            <div className="ur-card-head">
              <h3>Права роли</h3>
            </div>
            <p className="ur-role-meta">
              Роль: <strong>{getRoleLabel(selectedRole)}</strong> · Пользователей: <strong>{selectedRoleUsers}</strong>
            </p>
            <div className="ur-perm-list" role="list">
              {MODULE_DEFINITIONS.map((module) => {
                const lvl = permissionDraft[module.key] || "none";
                const isOpen = openDropdown === module.key;
                const badgeLabel = lvl === "edit" ? "Разрешено" : lvl === "view" ? "Просмотр" : "Запрещено";
                return (
                  <div className="ur-perm-row" key={module.key} role="listitem">
                    <span className="ur-perm-label">{module.label}</span>
                    <div className="ur-perm-dd-wrap">
                      <button
                        type="button"
                        className={`ur-perm-badge ${lvl}`}
                        aria-haspopup="listbox"
                        aria-expanded={isOpen}
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(isOpen ? null : module.key); }}
                      >
                        <svg viewBox="0 0 10 10" fill="currentColor"><circle cx="5" cy="5" r="4"/></svg>
                        {badgeLabel}
                        <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 1l4 4 4-4"/></svg>
                      </button>
                      {isOpen && (
                        <div
                          className="ur-perm-dd"
                          role="listbox"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {PERMISSION_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              role="option"
                              aria-selected={lvl === opt.value}
                              className={`ur-perm-dd-item${lvl === opt.value ? " active" : ""}`}
                              onClick={() => { updatePermission(module.key, opt.value); setOpenDropdown(null); }}
                            >
                              <span className={`ur-perm-dd-dot ${opt.value}`} />
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="ur-permission-footer">
              <div className="ur-permission-state">
                <span className={permissionsDirty ? "ur-perm-dirty" : success && !permissionsDirty ? "ur-perm-saved" : "ur-perm-idle"}>
                  {permissionsDirty ? "• Есть несохранённые изменения" : success && !permissionsDirty ? "✓ Права сохранены" : ""}
                </span>
              </div>
              <button
                type="button"
                className={`ur-button ${permissionsDirty ? "primary" : "ghost"}`}
                style={{ width: "100%" }}
                onClick={saveRolePermissions}
                disabled={!selectedRoleData || !permissionsDirty || savingPermissions}
              >
                {savingPermissions ? "Сохранение..." : "Сохранить права роли"}
              </button>
            </div>
          </div>

          <div className="ur-stats" aria-label="Статистика пользователей">
            <section className="ur-stat-card">
              <span>Всего пользователей</span>
              <strong>{users.length}</strong>
            </section>
            <section className="ur-stat-card">
              <span>Активных сессий</span>
              <strong>{users.filter((user) => user.is_active !== false).length}</strong>
            </section>
          </div>
        </aside>
      </div>
    </section>
  );
}
