import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE } from "../constants/index.js";
import GenerateSingle from "../components/certificates/GenerateSingle.jsx";
import GenerateBatch from "../components/certificates/GenerateBatch.jsx";
import TemplateConstructor from "../components/certificates/TemplateConstructor.jsx";
import ArticlesModule from "../features/admin/ArticlesModule.jsx";
import UsersRolesModule from "../features/admin/UsersRolesModule.jsx";
import AdminLayout from "../features/admin/AdminLayout.jsx";
import { canManageUsers, hasPermission } from "../auth.js";
import { authHeaders, getStoredAccessToken } from "../utils/authHeaders.js";

const ADMIN_MODULES = [
  { key: "dashboard", path: "/admin/dashboard", label: "Дашборд", icon: "dashboard" },
  { key: "articles", path: "/admin/articles", label: "Статьи", icon: "articles" },
  { key: "issue", path: "/admin/certificates", label: "Выпуск грамот", icon: "issue" },
  { key: "editor", path: "/admin/templates", label: "Конструктор шаблонов", icon: "editor" },
  { key: "users", path: "/admin/users", label: "Пользователи и роли", icon: "users" },
  { key: "audit", path: "/admin/audit", label: "Журнал действий", icon: "audit" },
  { key: "settings", path: "/admin/settings", label: "Настройки портала", icon: "settings" },
];

const MODULE_META = {
  dashboard: {
    title: "Дашборд",
    subtitle: "Сводка по материалам, выпуску грамот и управлению порталом",
  },
  articles: {
    title: "Статьи",
    subtitle: "Управление новостями, событиями и информационными материалами портала",
  },
  issue: {
    title: "Выпуск грамот",
    subtitle: "Формирование PDF для одного участника или группы участников",
  },
  editor: {
    title: "Конструктор шаблонов",
    subtitle: "Рабочий редактор бланков, текстовых блоков и подписей",
  },
  users: {
    title: "Пользователи и роли",
    subtitle: "Учётные записи сотрудников, роли и матрица прав",
  },
  audit: {
    title: "Журнал действий",
    subtitle: "События администрирования и изменения данных портала",
  },
  settings: {
    title: "Настройки портала",
    subtitle: "Служебные параметры внутренней административной системы",
  },
};

function IssueModule({ templates }) {
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState("single");
  const subTabs = [
    { key: "single", label: "Одному участнику" },
    { key: "batch", label: "Группе участников" },
  ];

  return (
    <section className="issue-admin">
      <style>{`
        .issue-admin {
          --admin-primary: #19789c;
          --admin-primary-dark: #004f75;
        }
        .issue-tabs {
          display: flex;
          gap: 30px;
          border-bottom: 1px solid #cdd8df;
          margin-bottom: 26px;
        }
        .issue-tab {
          min-height: 46px;
          border: 0;
          border-bottom: 3px solid transparent;
          background: transparent;
          color: #1f2d35;
          font: inherit;
          font-size: 15px;
          font-weight: 850;
          cursor: pointer;
          padding: 0 4px;
        }
        .issue-tab.is-active {
          border-bottom-color: var(--admin-primary);
          color: var(--admin-primary-dark);
        }
        .issue-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .issue-constructor-link {
          min-height: 42px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--admin-primary);
          border-radius: 8px;
          background: var(--admin-primary);
          color: #fff;
          padding: 0 16px;
          font: inherit;
          font-size: 14px;
          font-weight: 850;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(25, 120, 156, .2);
        }
        .issue-constructor-link:hover {
          background: var(--admin-primary-dark);
          border-color: var(--admin-primary-dark);
        }
        .issue-empty-state {
          display: grid;
          justify-items: center;
          gap: 12px;
          padding: 46px 24px;
          border: 1px dashed #b9cbd4;
          border-radius: 8px;
          background: #fff;
          text-align: center;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
        }
        .issue-empty-state strong {
          color: var(--admin-primary-dark);
          font-size: 20px;
        }
        .issue-empty-state p {
          max-width: 580px;
          margin: 0;
          color: #667783;
          line-height: 1.55;
          font-weight: 650;
        }
      `}</style>

      <div className="issue-head">
        <div className="issue-tabs" role="tablist" aria-label="Режим выпуска грамот">
          {subTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={subTab === tab.key}
              className={`issue-tab${subTab === tab.key ? " is-active" : ""}`}
              onClick={() => setSubTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button type="button" className="issue-constructor-link" onClick={() => navigate("/admin/templates")}>
          Открыть конструктор шаблонов
        </button>
      </div>

      {templates.length === 0 && (
        <div className="issue-empty-state">
          <strong>Нет доступных шаблонов</strong>
          <p>Создайте шаблон в конструкторе, чтобы начать выпуск грамот для одного участника или группы.</p>
          <button type="button" className="issue-constructor-link" onClick={() => navigate("/admin/templates")}>
            Перейти в конструктор шаблонов
          </button>
        </div>
      )}

      {templates.length > 0 && subTab === "single" && <GenerateSingle templates={templates} />}
      {templates.length > 0 && subTab === "batch" && <GenerateBatch templates={templates} />}
    </section>
  );
}

function DashboardModule() {
  const navigate = useNavigate();
  const cards = [
    ["Материалов в работе", "124", "Статьи, новости и события"],
    ["Опубликовано статей", "84", "Доступны на портале"],
    ["Выпущено грамот", "312", "За текущий учебный год"],
    ["Активных пользователей", "24", "Сотрудники системы"],
  ];
  const quickActions = [
    ["Создать статью", "/admin/articles/new"],
    ["Выпустить грамоту", "/admin/certificates"],
    ["Открыть конструктор", "/admin/templates"],
    ["Управление пользователями", "/admin/users"],
  ];
  const activity = [
    ["Сегодня, 10:24", "Создана статья", "Методические материалы"],
    ["Сегодня, 09:40", "Выпущены грамоты", "24 документа"],
    ["Вчера, 16:12", "Обновлён шаблон", "Грамота за участие"],
  ];
  const latestArticles = [
    ["Городской семинар для педагогов", "Черновик"],
    ["Итоги муниципального конкурса", "Опубликовано"],
    ["Курсы повышения квалификации", "Запланировано"],
  ];
  const latestCertificates = [
    ["Грамота за участие", "Иванов И.И."],
    ["Победитель конкурса", "Петрова М.С."],
    ["Благодарность педагогу", "Сидорова А.Н."],
  ];

  return (
    <section className="dashboard-admin">
      <style>{`
        .dashboard-admin {
          display: grid;
          gap: 18px;
        }
        .dashboard-card {
          border: 1px solid #e5ebef;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .06);
        }
        .dashboard-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .dashboard-stat {
          padding: 18px;
        }
        .dashboard-stat span {
          display: block;
          color: #667783;
          font-size: 12px;
          font-weight: 850;
          text-transform: uppercase;
        }
        .dashboard-stat strong {
          display: block;
          color: #004f75;
          font-size: 32px;
          line-height: 1.05;
          margin-top: 8px;
        }
        .dashboard-stat small {
          display: block;
          color: #667783;
          font-size: 13px;
          margin-top: 6px;
        }
        .dashboard-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr);
          gap: 18px;
          align-items: start;
        }
        .dashboard-section {
          padding: 20px;
        }
        .dashboard-section h2,
        .dashboard-section h3 {
          margin: 0;
          color: #004f75;
          font-size: 20px;
          line-height: 1.2;
        }
        .dashboard-section p {
          margin: 7px 0 0;
          color: #667783;
          line-height: 1.5;
          font-weight: 650;
        }
        .dashboard-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 16px;
        }
        .dashboard-action {
          min-height: 46px;
          border: 1px solid #cdd8df;
          border-radius: 8px;
          background: #f8fbfc;
          color: #004f75;
          font: inherit;
          font-size: 14px;
          font-weight: 850;
          cursor: pointer;
        }
        .dashboard-action:hover {
          border-color: #19789c;
          background: #edf6f8;
        }
        .dashboard-list {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }
        .dashboard-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          padding: 12px;
          border: 1px solid #edf2f4;
          border-radius: 8px;
          background: #fbfcfd;
        }
        .dashboard-row strong {
          display: block;
          color: #17232b;
          font-size: 14px;
          line-height: 1.3;
        }
        .dashboard-row span {
          display: block;
          color: #667783;
          font-size: 12px;
          font-weight: 750;
          margin-top: 3px;
        }
        .dashboard-badge {
          min-height: 25px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0 10px;
          background: #eef4f7;
          color: #004f75;
          font-size: 11px;
          font-weight: 900;
        }
        @media (max-width: 1180px) {
          .dashboard-stats,
          .dashboard-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
        @media (max-width: 760px) {
          .dashboard-stats,
          .dashboard-grid,
          .dashboard-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <div className="dashboard-stats">
        {cards.map(([label, value, hint]) => (
          <div className="dashboard-card dashboard-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{hint}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="dashboard-card dashboard-section">
          <h2>Быстрые действия</h2>
          <p>Основные задачи администратора без лишних переходов.</p>
          <div className="dashboard-actions">
            {quickActions.map(([label, path]) => (
              <button key={label} type="button" className="dashboard-action" onClick={() => navigate(path)}>
                {label}
              </button>
            ))}
          </div>
        </section>
        <section className="dashboard-card dashboard-section">
          <h3>Последние действия</h3>
          <div className="dashboard-list">
            {activity.map(([time, action, subject]) => (
              <div className="dashboard-row" key={`${time}-${action}`}>
                <div>
                  <strong>{action}</strong>
                  <span>{subject}</span>
                </div>
                <span className="dashboard-badge">{time}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="dashboard-card dashboard-section">
          <h3>Последние статьи</h3>
          <div className="dashboard-list">
            {latestArticles.map(([title, status]) => (
              <div className="dashboard-row" key={title}>
                <strong>{title}</strong>
                <span className="dashboard-badge">{status}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="dashboard-card dashboard-section">
          <h3>Последние выпущенные грамоты</h3>
          <div className="dashboard-list">
            {latestCertificates.map(([template, person]) => (
              <div className="dashboard-row" key={`${template}-${person}`}>
                <div>
                  <strong>{template}</strong>
                  <span>{person}</span>
                </div>
                <span className="dashboard-badge">Файл</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

function PlaceholderModule({ title, children }) {
  return (
    <section className="admin-placeholder">
      <h2>{title}</h2>
      <p>{children}</p>
    </section>
  );
}

function AccessDenied({ title }) {
  return (
    <section className="admin-access-card" role="alert">
      <h2>{title}</h2>
      <p>У текущей учётной записи нет прав для работы с этим разделом.</p>
    </section>
  );
}

export default function AdminPage({ currentUser, onArticlesChanged }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const permissions = useMemo(() => ({
    dashboard: true,
    articles: hasPermission(currentUser, "articles", "view"),
    issue: hasPermission(currentUser, "certificates", "view"),
    editor: hasPermission(currentUser, "certificate_templates", "view"),
    users: canManageUsers(currentUser),
    audit: hasPermission(currentUser, "audit_log", "view"),
    settings: hasPermission(currentUser, "portal_settings", "view"),
  }), [currentUser]);

  const activeModule = ADMIN_MODULES.find((module) => location.pathname.startsWith(module.path)) || ADMIN_MODULES[0];
  const activeKey = activeModule.key;
  const needsTemplates = activeKey === "issue" || activeKey === "editor";
  const meta = MODULE_META[activeKey] || MODULE_META.dashboard;

  const loadTemplates = useCallback(async () => {
    if (!needsTemplates || !getStoredAccessToken()) {
      setLoadingTemplates(false);
      return;
    }
    setLoadingTemplates(true);
    try {
      const res = await fetch(`${API_BASE}/certificates/templates`, {
        headers: authHeaders(),
      });
      if (res.ok) setTemplates(await res.json());
    } catch (e) {
      console.error("Ошибка загрузки шаблонов:", e);
    } finally {
      setLoadingTemplates(false);
    }
  }, [needsTemplates]);

  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    document.title = `${meta.title} - ИМЦРО`;
    loadTemplates();
    return () => {
      document.title = "МКУ развития образования города Иркутска";
    };
  }, [loadTemplates, meta.title]);

  let content;
  if (!permissions[activeKey]) {
    content = <AccessDenied title={meta.title} />;
  } else if (needsTemplates && loadingTemplates) {
    content = (
      <div className="admin-placeholder">
        <h2>Загрузка данных</h2>
        <p>Получаем список шаблонов грамот.</p>
      </div>
    );
  } else if (activeKey === "dashboard") {
    content = <DashboardModule />;
  } else if (activeKey === "issue") {
    content = <IssueModule templates={templates} />;
  } else if (activeKey === "editor") {
    content = <TemplateConstructor templates={templates} onTemplatesSaved={loadTemplates} />;
  } else if (activeKey === "articles") {
    content = (
      <ArticlesModule
        currentUser={currentUser}
        onArticlesChanged={onArticlesChanged}
        initialCreate={location.pathname.startsWith("/admin/articles/new")}
        onEditorClose={() => {
          if (location.pathname.startsWith("/admin/articles/new")) navigate("/admin/articles", { replace: true });
        }}
        onNewArticle={() => navigate("/admin/articles/new")}
      />
    );
  } else if (activeKey === "users") {
    content = <UsersRolesModule currentUser={currentUser} />;
  } else if (activeKey === "audit") {
    content = (
      <PlaceholderModule title="Журнал действий">
        Здесь будет отображаться история действий сотрудников: публикации, выпуск грамот, изменения шаблонов и прав доступа.
      </PlaceholderModule>
    );
  } else {
    content = (
      <PlaceholderModule title="Настройки портала">
        Служебные параметры портала будут доступны в этой рабочей области.
      </PlaceholderModule>
    );
  }

  return (
    <AdminLayout
      modules={ADMIN_MODULES}
      activeKey={activeKey}
      title={meta.title}
      subtitle={meta.subtitle}
      currentUser={currentUser}
    >
      {content}
    </AdminLayout>
  );
}
