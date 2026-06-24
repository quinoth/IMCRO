import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const ICON_PATHS = {
  dashboard: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  articles: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 5h6M9 12h6M9 16h4",
  issue: "M4 5h16v10H4V5Zm2 12h12M8 15v4m8-4v4",
  editor: "m5 17 4-4m0 0 6-6 2 2-6 6m-2-2 2 2M4 6l3-3 4 4-3 3L4 6Zm13 7 3 3-4 4-3-3",
  chat: "M4 5a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-5 4V5Zm5 3h6M9 11h4",
  users: "M16 11a4 4 0 1 0-8 0m8 0a4 4 0 1 1-8 0m8 0c2.2.5 4 2.1 4 4v1H4v-1c0-1.9 1.8-3.5 4-4",
  audit: "M5 4h14v16H5V4Zm4 4h6M9 12h6M9 16h4",
  settings: "M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-5v3m0 12v3M4.2 4.2l2.1 2.1m11.4 11.4 2.1 2.1M3 12h3m12 0h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1",
};

function AdminIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="admin-shell-icon">
      <path d={ICON_PATHS[name] || ICON_PATHS.dashboard} />
    </svg>
  );
}

function userName(currentUser) {
  const fio = [currentUser?.lastName, currentUser?.firstName, currentUser?.middleName]
    .filter(Boolean)
    .join(" ");
  return currentUser?.full_name || currentUser?.fullName || fio || currentUser?.username || currentUser?.email || "Администратор";
}

function shortUserName(currentUser, fullName) {
  const last = currentUser?.lastName || "";
  const first = currentUser?.firstName || "";
  if (last && first) {
    return `${last} ${first.charAt(0).toUpperCase()}.`;
  }
  if (last) return last;
  if (first) return first;
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]} ${parts[1].charAt(0).toUpperCase()}.`;
  }
  return parts[0] || fullName || "";
}

function _userInitials(currentUser, fullName) {
  const last = currentUser?.lastName || "";
  const first = currentUser?.firstName || "";
  if (last || first) {
    return `${(first.charAt(0) || "").toUpperCase()}${(last.charAt(0) || "").toUpperCase()}` || (fullName || "А").slice(0, 2).toUpperCase();
  }
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[1].charAt(0).toUpperCase()}${parts[0].charAt(0).toUpperCase()}`;
  }
  return String(fullName || "А").slice(0, 2).toUpperCase();
}

function userRole(currentUser) {
  const role = typeof currentUser?.role === "object" ? currentUser.role?.role_name : currentUser?.role;
  const labels = {
    admin: "Администратор",
    methodist: "Методист",
    metodist_editor: "Редактор",
    operator: "Оператор",
    tpmpk_admin: "Администратор ТПМПК",
    tpmpk_operator: "Оператор ТПМПК",
    domu_editor: "Редактор Дома учителя",
    user: "Пользователь",
  };
  return labels[role] || "Сотрудник";
}

export default function AdminLayout({ modules, activeKey, title, subtitle, currentUser, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem("imcro-admin-sidebar-collapsed") === "1";
    } catch {
      return false;
    }
  });
  const activeModule = modules.find((item) => item.key === activeKey) || modules[0];
  const displayTitle = title || activeModule?.label || "Админ-панель";
  const name = userName(currentUser);
  const shortName = shortUserName(currentUser, name);

  const isChildActive = (path) => {
    const [childPath, childHash = ""] = String(path || "").split("#");
    const currentPath = location.pathname.replace(/\/+$/, "") || "/";
    const targetPath = childPath.replace(/\/+$/, "") || "/";
    if (currentPath !== targetPath) return false;
    return childHash ? location.hash === `#${childHash}` : !location.hash;
  };

  useEffect(() => {
    try {
      window.localStorage.setItem("imcro-admin-sidebar-collapsed", collapsed ? "1" : "0");
    } catch {
      // localStorage can be unavailable in private mode.
    }
  }, [collapsed]);

  return (
    <div className={`admin-shell${collapsed ? " is-collapsed" : ""}${activeKey === "editor" ? " is-editor" : ""}`}>
      <style>{`
        .admin-shell {
          --admin-primary: #19789c;
          --admin-primary-dark: #004f75;
          --admin-bg: #f4f7f9;
          --admin-panel: #ffffff;
          --admin-border: #cdd8df;
          --admin-border-soft: #e5ebef;
          --admin-text: #17232b;
          --admin-muted: #667783;
          --admin-radius-lg: 18px;
          --admin-radius-md: 12px;
          --admin-radius-sm: 8px;
          min-height: 100vh;
          background: var(--admin-bg);
          color: var(--admin-text);
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          font-family: Inter, "Segoe UI", system-ui, -apple-system, sans-serif;
          transition: grid-template-columns .2s ease;
        }
        .admin-shell.is-collapsed {
          grid-template-columns: 84px minmax(0, 1fr);
        }
        .admin-shell * {
          box-sizing: border-box;
          letter-spacing: 0;
        }
        .admin-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--admin-border);
          background: #fff;
          padding: 24px 20px;
          z-index: 20;
          transition: padding .2s ease;
        }
        .admin-shell.is-collapsed .admin-sidebar {
          padding: 20px 14px;
        }
        .admin-brand {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin-bottom: 20px;
          min-width: 0;
          overflow: hidden;
        }
        .admin-brand-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          min-width: 0;
        }
        .admin-brand-logo-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          min-width: 0;
          flex: 1;
          overflow: hidden;
          transition: opacity .18s ease, max-height .18s ease;
          max-height: 80px;
        }
        .admin-brand-logo-wrap img {
          height: 44px;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          object-position: left center;
          display: block;
        }
        .admin-brand-subtitle {
          font-size: 11px;
          font-weight: 800;
          color: var(--admin-muted);
          letter-spacing: 0.04em;
          text-transform: uppercase;
          white-space: nowrap;
          padding-left: 2px;
        }
        .admin-shell.is-collapsed .admin-brand-logo-wrap {
          opacity: 0;
          max-height: 0;
          pointer-events: none;
          overflow: hidden;
        }
        .admin-shell.is-collapsed .admin-brand-header {
          justify-content: center;
        }
        .admin-sidebar-toggle {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--admin-border);
          border-radius: 8px;
          background: #fff;
          color: var(--admin-primary-dark);
          cursor: pointer;
          flex: 0 0 auto;
          padding: 0;
          transition: background .14s ease, border-color .14s ease;
        }
        .admin-sidebar-toggle:hover {
          border-color: var(--admin-primary);
          background: #edf6f8;
        }
        .admin-sidebar-toggle svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: transform .18s ease;
        }
        .admin-shell.is-collapsed .admin-sidebar-toggle svg {
          transform: rotate(180deg);
        }
        .admin-brand strong {
          display: none;
        }
        .admin-brand span {
          display: none;
        }
        .admin-nav {
          display: grid;
          gap: 8px;
        }
        .admin-nav-item {
          position: relative;
          min-width: 0;
        }
        .admin-nav-button {
          position: relative;
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid transparent;
          border-radius: var(--admin-radius-md);
          background: transparent;
          color: #24323a;
          padding: 0 14px;
          font: inherit;
          font-size: 15px;
          font-weight: 750;
          text-align: left;
          cursor: pointer;
          transition: background .16s ease, color .16s ease, box-shadow .16s ease, border-color .16s ease;
        }
        .admin-nav-button span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .admin-nav-button:hover {
          background: #edf5f8;
          color: var(--admin-primary-dark);
        }
        .admin-nav-button.is-active {
          background: var(--admin-primary);
          color: #fff;
          box-shadow: 0 10px 22px rgba(25, 120, 156, .26);
        }
        .admin-nav-chevron {
          width: 7px;
          height: 7px;
          border-right: 2px solid currentColor;
          border-bottom: 2px solid currentColor;
          transform: rotate(-45deg);
          opacity: .65;
          margin-left: auto;
          flex: 0 0 auto;
        }
        .admin-shell.is-collapsed .admin-nav-chevron {
          display: none;
        }
        .admin-subnav {
          position: absolute;
          left: calc(100% + 10px);
          top: 0;
          z-index: 60;
          width: 220px;
          display: grid;
          gap: 6px;
          padding: 8px;
          border: 1px solid var(--admin-border);
          border-radius: var(--admin-radius-md);
          background: #fff;
          box-shadow: 0 18px 42px rgba(15, 23, 42, .16);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateX(-6px);
          transition: opacity .16s ease, transform .16s ease, visibility .16s ease;
        }
        .admin-subnav::before {
          content: "";
          position: absolute;
          left: -12px;
          top: 0;
          width: 12px;
          height: 100%;
        }
        .admin-nav-item.has-children:hover .admin-subnav,
        .admin-nav-item.has-children:focus-within .admin-subnav {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateX(0);
        }
        .admin-nav-item.has-children .admin-nav-button[data-tooltip]::after {
          display: none;
        }
        .admin-subnav-button {
          min-height: 38px;
          width: 100%;
          border: 1px solid transparent;
          border-radius: var(--admin-radius-sm);
          background: transparent;
          color: #24323a;
          padding: 0 11px;
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          text-align: left;
          cursor: pointer;
        }
        .admin-subnav-button:hover,
        .admin-subnav-button:focus-visible {
          outline: none;
          border-color: #c7dce4;
          background: #edf5f8;
          color: var(--admin-primary-dark);
        }
        .admin-subnav-button.is-active {
          border-color: var(--admin-primary);
          background: var(--admin-primary);
          color: #fff;
        }
        .admin-shell-icon {
          width: 23px;
          height: 23px;
          flex: 0 0 auto;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .admin-shell.is-collapsed .admin-brand {
          margin-bottom: 12px;
        }
        .admin-shell.is-collapsed .admin-brand-text,
        .admin-shell.is-collapsed .admin-nav-button > span,
        .admin-shell.is-collapsed .admin-sidebar-user div {
          width: 0;
          opacity: 0;
          pointer-events: none;
        }
        .admin-shell.is-collapsed .admin-nav-button {
          justify-content: center;
          padding: 0;
          gap: 0;
        }
        .admin-nav-button[data-tooltip]::after {
          content: attr(data-tooltip);
          position: absolute;
          left: calc(100% + 10px);
          top: 50%;
          transform: translateY(-50%);
          min-width: max-content;
          max-width: 240px;
          border-radius: var(--admin-radius-sm);
          background: #0b1f2a;
          color: #fff;
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 800;
          box-shadow: 0 12px 30px rgba(15, 23, 42, .18);
          opacity: 0;
          pointer-events: none;
          visibility: hidden;
          z-index: 50;
        }
        .admin-shell.is-collapsed .admin-nav-button:hover::after,
        .admin-shell.is-collapsed .admin-nav-button:focus-visible::after {
          opacity: 1;
          visibility: visible;
        }
        .admin-sidebar-user {
          margin-top: auto;
          padding-top: 18px;
          border-top: 1px solid var(--admin-border);
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }
        .admin-shell.is-collapsed .admin-sidebar-user {
          justify-content: center;
          gap: 0;
        }
        .admin-avatar {
          width: 36px;
          height: 36px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background: var(--admin-primary-dark);
          flex: 0 0 36px;
          overflow: hidden;
        }
        .admin-avatar svg {
          display: block;
          width: 19px;
          height: 19px;
          fill: none;
          stroke: #fff;
          stroke-width: 1.8;
          stroke-linecap: round;
          stroke-linejoin: round;
          flex-shrink: 0;
        }
        .admin-sidebar-user .admin-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-sidebar-user > div > strong,
        .admin-sidebar-user > div > span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .admin-sidebar-user strong {
          font-size: 13px;
          font-weight: 850;
        }
        .admin-sidebar-user span {
          margin-top: 2px;
          color: var(--admin-muted);
          font-size: 12px;
        }
        .admin-main {
          min-width: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
        }
        .admin-shell.is-editor .admin-main {
          height: 100vh;
          overflow: hidden;
        }
        .admin-topbar {
          position: sticky;
          top: 0;
          z-index: 15;
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 12px 28px;
          border-bottom: 1px solid var(--admin-border);
          background: rgba(255, 255, 255, .96);
          backdrop-filter: blur(14px);
        }
        .admin-top-title {
          min-width: 0;
        }
        .admin-top-title h1 {
          margin: 0;
          color: #0b1f2a;
          font-size: 21px;
          line-height: 1.15;
          font-weight: 900;
        }
        .admin-top-title p {
          margin: 3px 0 0;
          color: var(--admin-muted);
          font-size: 13px;
          font-weight: 650;
          overflow-wrap: anywhere;
        }
        .admin-top-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 14px;
          flex: 0 0 auto;
        }
        .admin-site-link,
        .admin-icon-button {
          min-height: 38px;
          border-radius: 8px;
          border: 1px solid var(--admin-primary);
          background: #fff;
          color: var(--admin-primary-dark);
          font: inherit;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
        }
        .admin-site-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          text-decoration: none;
        }
        .admin-icon-button {
          width: 38px;
          display: grid;
          place-items: center;
          border-color: transparent;
          color: #101820;
        }
        .admin-profile-chip {
          min-height: 38px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          border: 1px solid var(--admin-border);
          border-radius: var(--admin-radius-md);
          background: #fff;
          color: #17232b;
          padding: 0 12px 0 6px;
          font-size: 13px;
          font-weight: 850;
          max-width: 260px;
          min-width: 0;
        }
        .admin-profile-chip .admin-avatar {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .admin-profile-chip .admin-avatar svg {
          width: 16px;
          height: 16px;
        }
        .admin-profile-chip span:last-child {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .admin-icon-button svg,
        .admin-site-link svg {
          width: 18px;
          height: 18px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        .admin-content {
          min-width: 0;
          padding: 28px;
        }
        .admin-shell.is-editor .admin-content {
          min-height: 0;
          overflow: hidden;
          padding: 0;
        }
        .admin-access-card,
        .admin-placeholder,
        .admin-dashboard-card {
          border: 1px solid var(--admin-border-soft);
          border-radius: var(--admin-radius-lg);
          background: #fff;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .06);
        }
        .admin-access-card,
        .admin-placeholder {
          padding: 22px;
        }
        .admin-placeholder h2,
        .admin-access-card h2 {
          margin: 0 0 8px;
          color: var(--admin-primary-dark);
          font-size: 22px;
        }
        .admin-placeholder p,
        .admin-access-card p {
          margin: 0;
          color: var(--admin-muted);
          line-height: 1.55;
          font-weight: 650;
        }
        @media (max-width: 820px) {
          .admin-shell {
            grid-template-columns: 1fr;
          }
          .admin-sidebar {
            position: relative;
            height: auto;
            padding: 16px;
          }
          .admin-shell.is-collapsed .admin-sidebar {
            padding: 16px;
          }
          .admin-brand {
            margin-bottom: 18px;
          }
          .admin-brand-text,
          .admin-shell.is-collapsed .admin-brand-text,
          .admin-shell.is-collapsed .admin-nav-button > span,
          .admin-shell.is-collapsed .admin-sidebar-user div {
            width: auto;
            opacity: 1;
            pointer-events: auto;
          }
          .admin-nav {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          }
          .admin-subnav {
            left: 0;
            top: calc(100% + 6px);
          }
          .admin-shell.is-collapsed .admin-nav-button {
            justify-content: flex-start;
            padding: 0 14px;
            gap: 14px;
          }
          .admin-nav-button[data-tooltip]::after {
            display: none;
          }
          .admin-sidebar-user {
            margin-top: 18px;
          }
          .admin-topbar {
            position: relative;
            align-items: flex-start;
            flex-direction: column;
            padding: 16px;
          }
          .admin-top-actions {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
          }
          .admin-content {
            padding: 16px;
          }
        }
      `}</style>

      <aside className="admin-sidebar" aria-label="Разделы админ-панели">
        <div className="admin-brand">
          <div className="admin-brand-header">
            <div className="admin-brand-logo-wrap">
              <img src="https://mc.eduirk.ru/images/headers/imcro2.png" alt="ИМЦРО" />
              <span className="admin-brand-subtitle">Админ-панель</span>
            </div>
            <button
              className="admin-sidebar-toggle"
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
              title={collapsed ? "Развернуть меню" : "Свернуть меню"}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="admin-nav">
          {modules.map((module) => {
            const hasChildren = Array.isArray(module.children) && module.children.length > 0;
            return (
              <div key={module.key} className={`admin-nav-item${hasChildren ? " has-children" : ""}`}>
                <button
                  type="button"
                  className={`admin-nav-button${activeKey === module.key ? " is-active" : ""}`}
                  onClick={() => navigate(module.path)}
                  data-tooltip={module.label}
                  title={collapsed && !hasChildren ? module.label : undefined}
                >
                  <AdminIcon name={module.icon} />
                  <span>{module.label}</span>
                  {hasChildren && <i className="admin-nav-chevron" aria-hidden="true" />}
                </button>
                {hasChildren && (
                  <div className="admin-subnav" role="menu" aria-label={`${module.label}: подразделы`}>
                    {module.children.map((child) => (
                      <button
                        key={child.key}
                        type="button"
                        role="menuitem"
                        className={`admin-subnav-button${isChildActive(child.path) ? " is-active" : ""}`}
                        onClick={() => navigate(child.path)}
                      >
                        {child.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar-user" title={name}>
          <span className="admin-avatar" aria-hidden="true">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" /></svg>
          </span>
          <div>
            <strong>{name}</strong>
            <span>{userRole(currentUser)}</span>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div className="admin-top-title">
            <h1>{displayTitle}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className="admin-top-actions">
            <a className="admin-site-link" href="/" target="_blank" rel="noreferrer">
              Перейти на сайт
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M14 4h6v6M10 14 20 4M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
              </svg>
            </a>
            <button className="admin-icon-button" type="button" aria-label="Уведомления">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
              </svg>
            </button>
            <div className="admin-profile-chip" title={`${name} • ${userRole(currentUser)}`}>
              <span className="admin-avatar" aria-hidden="true">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.87 3.13-7 7-7s7 3.13 7 7" /></svg>
              </span>
              <span>{shortName}</span>
            </div>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
