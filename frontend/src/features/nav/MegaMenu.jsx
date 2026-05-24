import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { canAccessAdmin, canAccessDomuAdmin, canAccessTpmpkAdmin } from "../../auth.js";
import { SVEDENIYA_QUICK_LINKS } from "../../pages/svedeniya/svedeniyaData.js";
import {
  ARCHIV_ROUTES,
  DEYATELNOST_ROUTES,
  DOMU_SECTIONS,
  KONKURSY_ROUTES,
  METHODIKA_STATIC_PAGES,
  NOKO_ROUTES,
} from "../admin/articleTaxonomy.js";

const link = (label, path) => ({ label, path });

const TPMPK_LINKS = [
  link("ТПМПК", "/tpmpk/"),
  link("Запись на обследование", "/tpmpk/zapis"),
  link("Документы", "/tpmpk/dokumenty/"),
  link("Бланки и формы", "/tpmpk/blanki/"),
  link("График работы", "/tpmpk/grafik/"),
  link("Состав комиссии", "/tpmpk/sostav/"),
  link("Нормативные акты", "/tpmpk/npa/"),
  link("Вопросы и ответы", "/tpmpk/faq/"),
  link("Для родителей", "/tpmpk/dlya-roditeley/"),
  link("Для педагогов", "/tpmpk/dlya-pedagogov/"),
  link("Контакты", "/tpmpk/kontakty/"),
];

const COLUMNS = [
  {
    title: "Об организации",
    links: [
      link("Основные сведения", "/sveden/common/"),
      link("Структура и органы управления", "/sveden/struct/"),
      link("Документы", "/sveden/document/"),
      link("Образование", "/sveden/education/"),
      link("Руководство", "/sveden/employees/"),
      link("Материально-техническое обеспечение", "/sveden/objects/"),
      link("Платные образовательные услуги", "/sveden/paid_edu/"),
      link("Доступная среда", "/sveden/ovz/"),
    ],
  },
  {
    title: "Подразделения",
    links: [
      link("ТПМПК", "/tpmpk/"),
      link("Дом учителя", "/dom-uchitelya/"),
      link("Методическое пространство", "/metodika/"),
      link("НОКО", "/noko/"),
      link("Олимпиады и конкурсы", "/konkursy/"),
      link("Деятельность", "/deyatelnost/"),
      link("Архив", "/archiv/"),
    ],
  },
  {
    title: "Мероприятия",
    links: [
      link("Новости и события", "/novosti/"),
      link("Календарь конкурсов", "/konkursy/kalendar/"),
      link("Итоги конкурсов", "/konkursy/itogi/"),
      link("Для обучающихся", "/konkursy/students/"),
      link("Для педагогов", "/konkursy/teachers/"),
      link("Событийный календарь", "/#calendar"),
    ],
  },
  {
    title: "НОКО",
    links: [link("НОКО", "/noko/"), ...NOKO_ROUTES.map((item) => link(item.title, item.path))],
  },
  {
    title: "Дом учителя",
    links: [link("Дом учителя", "/dom-uchitelya/"), link("Новости", "/dom-uchitelya/novosti/"), ...DOMU_SECTIONS.map((item) => link(item.label, `/dom-uchitelya/${item.value}/`))],
  },
];

const METHODIKA_LINKS = [
  link("Методическое пространство", "/metodika/"),
  ...METHODIKA_STATIC_PAGES.map((item) => link(item.title, item.path)),
];

const ACTIVITY_LINKS = [
  link("Деятельность", "/deyatelnost/"),
  ...DEYATELNOST_ROUTES.map((item) => link(item.title, item.path)),
  link("Архив", "/archiv/"),
  ...ARCHIV_ROUTES.map((item) => link(item.title, item.path)),
];

const CONTEST_LINKS = [
  link("Олимпиады и конкурсы", "/konkursy/"),
  ...KONKURSY_ROUTES.map((item) => link(item.title, item.path)),
];

function normalizePath(pathname) {
  if (!pathname) return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export default function MegaMenu({ open, onClose, currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");

  const roleLinks = useMemo(() => {
    const items = [];
    if (canAccessAdmin(currentUser)) {
      items.push(
        link("Админ-панель", "/admin/"),
        link("Статьи", "/admin/articles"),
        link("Генератор грамот", "/admin/certificates"),
        link("Конструктор шаблонов", "/admin/templates"),
        link("Демо чат-бота", "/admin/chat"),
      );
    }
    if (canAccessDomuAdmin(currentUser)) items.push(link("Админка Дома учителя", "/admin/dom-uchitelya/"));
    if (canAccessTpmpkAdmin(currentUser)) items.push(link("Кабинет ТПМПК", "/admin/tpmpk/"));
    return items;
  }, [currentUser]);

  const blueLinks = roleLinks.length ? roleLinks : [
    link("Запись на ТПМПК", "/tpmpk/zapis"),
    link("Новости", "/novosti/"),
    link("Дом учителя", "/dom-uchitelya/"),
  ];

  const allLinks = useMemo(
    () => [
      ...COLUMNS.flatMap((column) => column.links),
      ...METHODIKA_LINKS,
      ...ACTIVITY_LINKS,
      ...CONTEST_LINKS,
      ...TPMPK_LINKS,
      ...roleLinks,
      ...SVEDENIYA_QUICK_LINKS.map((item) => link(item.label, item.path)),
    ],
    [roleLinks],
  );

  const filteredLinks = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return allLinks.filter((item) => item.label.toLowerCase().includes(value)).slice(0, 8);
  }, [allLinks, query]);

  const primaryLinks = [
    link("Главная", "/"),
    link("Сведения об организации", "/sveden/"),
    link("Новости и события", "/novosti/"),
    link("ТПМПК", "/tpmpk/"),
    link("Дом учителя", "/dom-uchitelya/"),
    link("Методическое пространство", "/metodika/"),
    link("НОКО", "/noko/"),
    link("Олимпиады и конкурсы", "/konkursy/"),
  ];

  const compactGroups = [
    { title: "Сведения", links: SVEDENIYA_QUICK_LINKS.map((item) => link(item.label, item.path)) },
    { title: "ТПМПК", links: TPMPK_LINKS.slice(1) },
    { title: "Мероприятия", links: COLUMNS[2].links },
    { title: "Дом учителя", links: [link("Новости", "/dom-uchitelya/novosti/"), ...DOMU_SECTIONS.slice(0, 6).map((item) => link(item.label, `/dom-uchitelya/${item.value}/`))] },
    { title: "Материалы", links: [...METHODIKA_LINKS, ...ACTIVITY_LINKS, ...CONTEST_LINKS].slice(0, 12) },
  ];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function goPath(path) {
    if (!path) return;
    onClose();
    navigate(path);
    if (path.includes("#calendar")) {
      window.setTimeout(() => document.getElementById("calendar")?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  function isActive(path) {
    if (!path || path.includes("#")) return false;
    const current = normalizePath(location.pathname);
    const target = normalizePath(path);
    return target === "/" ? current === "/" : current.startsWith(target);
  }

  function renderLinkButton(item, className) {
    return (
      <button
        className={`${className}${isActive(item.path) ? " is-active" : ""}`}
        type="button"
        key={`${item.path}-${item.label}`}
        onClick={() => goPath(item.path)}
      >
        {item.label}
      </button>
    );
  }

  if (!open) return null;

  return (
    <>
      <style>{`
        .mega-overlay {
          position: fixed;
          top: 83px;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 210;
          background: #f8fafc;
          overflow-y: auto;
          padding: 18px 22px;
          animation: megaFadeIn 0.18s ease-out;
        }

        @keyframes megaFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mega-container {
          max-width: 1280px;
          margin: 0 auto;
        }

        .mega-search-wrap {
          position: relative;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          margin-bottom: 14px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
        }

        .mega-search-results {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          z-index: 2;
          display: grid;
          gap: 6px;
          padding: 10px;
          border: 1px solid #dbe5f1;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.14);
        }

        .mega-search-result {
          min-height: 38px;
          border: 0;
          border-radius: 8px;
          background: #f8fbff;
          color: #0f172a;
          text-align: left;
          padding: 0 12px;
          font: 800 13px/1.25 inherit;
          cursor: pointer;
        }

        .mega-compact-grid {
          display: grid;
          grid-template-columns: 1.05fr repeat(4, minmax(0, 1fr));
          gap: 12px;
          align-items: stretch;
        }

        .mega-hero-card,
        .mega-group-card {
          background: #fff;
          border: 1px solid #dbe5f1;
          border-radius: 12px;
          padding: 14px;
          display: grid;
          align-content: start;
          gap: 9px;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04);
        }

        .mega-hero-card p {
          color: #475569;
          font-size: 13px;
          line-height: 1.5;
          font-weight: 650;
        }

        .mega-group-card {
          min-height: 0;
        }

        .mega-primary-grid,
        .mega-link-grid {
          display: grid;
          gap: 7px;
        }

        .mega-primary-grid {
          grid-template-columns: 1fr;
        }

        .mega-link-grid {
          grid-template-columns: 1fr;
        }

        .mega-sveden-open {
          min-height: 40px;
          width: fit-content;
          border: 1px solid #dbe5f1;
          border-radius: 10px;
          background: #1e3a8a;
          color: #fff;
          padding: 0 14px;
          font: 900 13px/1 inherit;
          cursor: pointer;
        }

        .mega-sveden-link {
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fbff;
          min-height: 34px;
          padding: 8px 10px;
          color: #334155;
          text-align: left;
          font: 850 12px/1.3 inherit;
          cursor: pointer;
          overflow-wrap: anywhere;
        }

        .mega-sveden-link:hover,
        .mega-sveden-link.is-active,
        .mega-sveden-open:hover,
        .mega-search-result:hover {
          background: #0f2f78;
          color: #fff;
        }

        .mega-search-input {
          flex: 1;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          font: 700 15px/1 inherit;
          color: #0f172a;
        }

        .mega-search-close {
          width: 34px;
          height: 34px;
          border: none;
          border-radius: 8px;
          background: #f1f5f9;
          color: #64748b;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .mega-search-close:hover {
          color: #0f172a;
          background: #e2e8f0;
        }

        .mega-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 16px;
          align-items: start;
        }

        .m-card,
        .m-card-blue {
          border-radius: 12px;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 11px;
          box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
        }

        .m-card {
          background: #fff;
          border: 1px solid #eef2f7;
        }

        .m-card-blue {
          background: #1d4ed8;
          color: #fff;
          box-shadow: 0 10px 26px rgba(29, 78, 216, 0.24);
        }

        .m-title {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #0f172a;
        }

        .m-link,
        .m-bold-link,
        .m-link-blue {
          border: 0;
          background: transparent;
          padding: 0;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          line-height: 1.38;
          overflow-wrap: anywhere;
        }

        .m-link {
          font-size: 12.5px;
          font-weight: 600;
          color: #334155;
        }

        .m-bold-link {
          font-size: 12.5px;
          font-weight: 900;
          color: #0f172a;
          text-transform: uppercase;
        }

        .m-link-blue {
          font-size: 12px;
          font-weight: 900;
          color: #fff;
          text-transform: uppercase;
        }

        .m-link:hover,
        .m-link.is-active,
        .m-bold-link:hover,
        .m-bold-link.is-active {
          color: #2563eb;
        }

        .m-link-blue:hover,
        .m-link-blue.is-active {
          opacity: 0.82;
        }

        @media (max-width: 1200px) {
          .mega-compact-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          .mega-hero-card { grid-column: span 3; }
        }

        @media (max-width: 600px) {
          .mega-overlay {
            top: 67px;
            padding: 18px 14px;
          }
          .mega-compact-grid { grid-template-columns: 1fr; }
          .mega-hero-card { grid-column: auto; }
        }
      `}</style>

      <div className="mega-overlay">
        <div className="mega-container">
          <div className="mega-search-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              className="mega-search-input"
              placeholder="Поиск по разделам"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
            />
            <button className="mega-search-close" onClick={onClose} type="button" title="Закрыть меню" aria-label="Закрыть меню">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            {filteredLinks.length > 0 && (
              <div className="mega-search-results">
                {filteredLinks.map((item) => renderLinkButton(item, "mega-search-result"))}
              </div>
            )}
          </div>

          <div className="mega-compact-grid">
            <section className="mega-hero-card">
              <div className="m-title">Быстрый переход &gt;</div>
              <p>Основные разделы сайта, личные кабинеты и востребованные сервисы собраны в компактной сетке.</p>
              <div className="mega-primary-grid">
                {primaryLinks.map((item) => renderLinkButton(item, "mega-sveden-link"))}
              </div>
              <div className="m-card-blue">
                {blueLinks.map((item) => renderLinkButton(item, "m-link-blue"))}
              </div>
            </section>

            {compactGroups.map((group) => (
              <section className="mega-group-card" key={group.title}>
                <div className="m-title">{group.title} &gt;</div>
                <div className="mega-link-grid">
                  {group.links.map((item) => renderLinkButton(item, "mega-sveden-link"))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
