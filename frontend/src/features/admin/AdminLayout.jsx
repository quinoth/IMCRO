import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ICON_PATHS = {
  dashboard: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  articles: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm3 5h6M9 12h6M9 16h4",
  issue: "M4 5h16v10H4V5Zm2 12h12M8 15v4m8-4v4",
  editor: "m5 17 4-4m0 0 6-6 2 2-6 6m-2-2 2 2M4 6l3-3 4 4-3 3L4 6Zm13 7 3 3-4 4-3-3",
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
          align-items: center;
          gap: 12px;
          min-height: 54px;
          margin-bottom: 18px;
          min-width: 0;
        }
        .admin-brand-text {
          min-width: 0;
          transition: opacity .16s ease, width .16s ease;
        }
        .admin-brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          color: #fff;
          background: var(--admin-primary);
          box-shadow: 0 10px 22px rgba(25, 120, 156, .24);
        }
        .admin-brand-mark svg {
          width: 24px;
          height: 24px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2;
        }
        .admin-sidebar-toggle {
          width: 100%;
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin: 0 0 22px;
          border: 1px solid var(--admin-border);
          border-radius: 8px;
          background: #f7fbfc;
          color: var(--admin-primary-dark);
          font: inherit;
          font-size: 13px;
          font-weight: 850;
          cursor: pointer;
        }
        .admin-sidebar-toggle:hover {
          border-color: var(--admin-primary);
          background: #edf6f8;
        }
        .admin-sidebar-toggle svg {
          width: 18px;
          height: 18px;
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
        .admin-sidebar-toggle span {
          overflow: hidden;
          white-space: nowrap;
        }
        .admin-brand strong {
          display: block;
          color: var(--admin-primary-dark);
          font-size: 25px;
          line-height: 1;
          font-weight: 950;
        }
        .admin-brand span {
          display: block;
          margin-top: 4px;
          color: #1f2933;
          font-size: 12px;
          line-height: 1.1;
          font-weight: 850;
          text-transform: uppercase;
        }
        .admin-nav {
          display: grid;
          gap: 8px;
        }
        .admin-nav-button {
          position: relative;
          width: 100%;
          min-height: 48px;
          display: flex;
          align-items: center;
          gap: 14px;
          border: 1px solid transparent;
          border-radius: 8px;
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
          justify-content: center;
          margin-bottom: 16px;
        }
        .admin-shell.is-collapsed .admin-brand-text,
        .admin-shell.is-collapsed .admin-sidebar-toggle span,
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
          border-radius: 8px;
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
        }
        .admin-avatar {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: #fff;
          background: var(--admin-primary-dark);
          font-size: 13px;
          font-weight: 900;
          flex: 0 0 auto;
        }
        .admin-sidebar-user strong,
        .admin-sidebar-user span {
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
          border-radius: 8px;
          background: #fff;
          color: #17232b;
          padding: 0 12px 0 6px;
          font-size: 13px;
          font-weight: 850;
          max-width: 260px;
          min-width: 0;
        }
        .admin-profile-chip .admin-avatar {
          width: 30px;
          height: 30px;
          font-size: 11px;
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
          border-radius: 8px;
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
          .admin-shell.is-collapsed .admin-sidebar-toggle span,
          .admin-shell.is-collapsed .admin-nav-button > span,
          .admin-shell.is-collapsed .admin-sidebar-user div {
            width: auto;
            opacity: 1;
            pointer-events: auto;
          }
          .admin-nav {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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
          <span className="admin-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M12 3 4 7l8 4 8-4-8-4Zm-6 7v5l6 3 6-3v-5" />
            </svg>
          </span>
          <div className="admin-brand-text">
            <strong>ИМЦРО</strong>
            <span>Админ-панель</span>
          </div>
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
          <span>{collapsed ? "Развернуть меню" : "Свернуть меню"}</span>
        </button>

        <nav className="admin-nav">
          {modules.map((module) => (
            <button
              key={module.key}
              type="button"
              className={`admin-nav-button${activeKey === module.key ? " is-active" : ""}`}
              onClick={() => navigate(module.path)}
              data-tooltip={module.label}
              title={collapsed ? module.label : undefined}
            >
              <AdminIcon name={module.icon} />
              <span>{module.label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-user">
          <span className="admin-avatar">{name.slice(0, 2).toUpperCase()}</span>
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
            <div className="admin-profile-chip" title={name}>
              <span className="admin-avatar">{name.slice(0, 2).toUpperCase()}</span>
              <span>{name}</span>
            </div>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
