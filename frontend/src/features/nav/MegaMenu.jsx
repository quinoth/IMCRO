import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { canAccessAdmin, canAccessDomuAdmin, canAccessTpmpkAdmin } from "../../auth.js";

const link = (label, path) => ({ label, path });

const METHODICAL_LINKS = [
  link("Дошкольное образование", "/metodicheskoe-prostranstvo/doshkolnoe-obrazovanie/"),
  link("Начальное общее образование", "/metodicheskoe-prostranstvo/nachalnoe-obshchee-obrazovanie/"),
  link("Дополнительное образование", "/metodicheskoe-prostranstvo/dopolnitelnoe-obrazovanie/"),
  link("История", "/metodicheskoe-prostranstvo/istoriya/"),
  link("История нашего края", "/metodicheskoe-prostranstvo/istoriya-nashego-kraya/"),
  link("Обществознание", "/metodicheskoe-prostranstvo/obshchestvoznanie/"),
  link("ДНКР", "/metodicheskoe-prostranstvo/dnkr/"),
  link("Русский язык", "/metodicheskoe-prostranstvo/russkiy-yazyk/"),
  link("Иностранные языки", "/metodicheskoe-prostranstvo/inostrannye-yazyki/"),
  link("Математика", "/metodicheskoe-prostranstvo/matematika/"),
  link("Информатика", "/metodicheskoe-prostranstvo/informatika/"),
  link("Химия", "/metodicheskoe-prostranstvo/himiya/"),
  link("Биология", "/metodicheskoe-prostranstvo/biologiya/"),
  link("География", "/metodicheskoe-prostranstvo/geografiya/"),
  link("Байкаловедение", "/metodicheskoe-prostranstvo/baykalovedenie/"),
  link("Физкультура", "/metodicheskoe-prostranstvo/fizkultura/"),
  link("ОБЖ", "/metodicheskoe-prostranstvo/obzh/"),
  link("Технология", "/metodicheskoe-prostranstvo/tehnologiya/"),
  link("Воспитание", "/metodicheskoe-prostranstvo/vospitanie/"),
  link("Психологи", "/metodicheskoe-prostranstvo/psihologi/"),
  link("Социальные педагоги", "/metodicheskoe-prostranstvo/socialnye-pedagogi/"),
  link("Молодые специалисты", "/metodicheskoe-prostranstvo/molodye-specialisty/"),
  link("Инновационная деятельность", "/innovacionnaya-deyatelnost/"),
  link("Методические материалы", "/predmetnye-oblasti/metodicheskie-materialy/"),
  link("Воспитательное пространство", "/vospitatelnoe-prostranstvo/"),
];

const MEGA_MENU_GROUPS = [
  {
    id: "quick",
    groupTitle: "Быстрый переход",
    description: "Самые востребованные страницы и сервисы портала.",
    links: [
      link("Главная", "/"),
      link("Новости", "/novosti/"),
      link("ТПМПК", "/tpmpk/"),
      link("Записаться на приём", "/tpmpk/zapis"),
      link("НОКО", "/noko/"),
      link("Курсы повышения квалификации", "/kpk/"),
      link("Методическое пространство", "/metodicheskoe-prostranstvo/"),
      link("Музей", "/deyatelnost/muzey/"),
    ],
  },
  {
    id: "svedeniya",
    groupTitle: "Сведения об образовательной организации",
    description: "Официальная информация об учреждении и обязательные подразделы.",
    links: [
      link("Сведения об образовательной организации", "/sveden/"),
      link("Документы", "/sveden/document/"),
      link("Образование", "/sveden/education/"),
      link("Руководство", "/sveden/employees/"),
      link("Финансово-хозяйственная деятельность", "/sveden/budget/"),
      link("Доступная среда", "/sveden/ovz/"),
    ],
  },
  {
    id: "tpmpk",
    groupTitle: "ТПМПК",
    description: "Запись на приём, документы, состав и нормативная база комиссии.",
    links: [
      link("Записаться на приём", "/tpmpk/zapis"),
      link("Перечень документов для прохождения ПМПК", "/tpmpk/dokumenty/"),
      link("Состав территориальной ПМПК", "/tpmpk/sostav/"),
      link("Нормативные документы", "/tpmpk/npa/"),
    ],
  },
  {
    id: "noko",
    groupTitle: "НОКО",
    description: "Независимая оценка качества образования и материалы ГИА.",
    links: [
      link("Оперативная информация", "/noko/operativnaya-informaciya/"),
      link("ГИА 9 класс", "/noko/gia-9/"),
      link("ГИА 11 (12) класс", "/noko/gia-11/"),
      link("Сборники и альманахи", "/noko/sborniki/"),
    ],
  },
  {
    id: "courses",
    groupTitle: "Курсы повышения квалификации",
    description: "Программы повышения квалификации и мониторинг дефицитов.",
    links: [
      link("Список курсов повышения квалификации", "/kpk/spisok-kursov-povysheniya-kvalifikacii/"),
      link("Мониторинг профессиональных дефицитов педагогических работников города", "/kpk/monitoring-professionalnyh-deficitov/"),
    ],
  },
  {
    id: "methodical",
    groupTitle: "Методическое пространство",
    description: "Предметные и профессиональные направления методического сопровождения.",
    links: METHODICAL_LINKS,
  },
  {
    id: "contests",
    groupTitle: "Конкурсы и олимпиады",
    description: "Конкурсные, олимпиадные и конференционные направления.",
    links: [
      link("Конкурсы", "/konkursy/"),
      link("Для детей", "/konkursy/dlya-detey/"),
      link("Для педагогов", "/konkursy/dlya-pedagogov/"),
      link("Олимпиады для детей", "/olimpiady-dlya-detey/"),
      link("Всероссийская олимпиада школьников", "/olimpiady-dlya-detey/vserossiyskaya-olimpiada-shkolnikov/"),
      link("Муниципальные и региональные олимпиады", "/olimpiady-dlya-detey/municipalnye-i-regionalnye-olimpiady/"),
      link("Конференции для детей", "/konferencii-dlya-detey/"),
      link("Муниципальные конференции", "/konferencii-dlya-detey/municipalnye-konferencii/"),
      link("Региональные конференции", "/konferencii-dlya-detey/regionalnye-konferencii/"),
      link("Всероссийские конференции", "/konferencii-dlya-detey/vserossiyskie-konferencii/"),
      link("Образовательная программа", "/obrazovatelnaya-programma/"),
    ],
  },
  {
    id: "domu",
    groupTitle: "Дом учителя",
    description: "Профессиональные события, клубы и материалы Дома учителя.",
    links: [
      link("Дом учителя", "/dom-uchitelya/"),
      link("Новости и материалы", "/dom-uchitelya/novosti/"),
      link("Мероприятия", "/dom-uchitelya/programma/"),
      link("Мастер-классы", "/dom-uchitelya/master-klassy/"),
      link("Клуб молодых педагогов", "/dom-uchitelya/molodye-pedagogi/"),
      link("Наставничество", "/dom-uchitelya/nastavnichestvo/"),
    ],
  },
  {
    id: "activity",
    groupTitle: "Деятельность",
    description: "Основные направления работы и профессиональные сообщества.",
    links: [
      link("Деятельность", "/deyatelnost/"),
      link("Предметные области", "/predmetnye-oblasti/"),
      link("НСУ СКИП", "/nsu-skip/"),
      link("Наставничество", "/nastavnichestvo/"),
      link("Молодые педагоги", "/molodye-pedagogi/"),
    ],
  },
  {
    id: "museum",
    groupTitle: "Музей",
    description: "Музейная и краеведческая работа ИМЦРО.",
    links: [
      link("Музей", "/deyatelnost/muzey/"),
    ],
  },
  {
    id: "extra",
    groupTitle: "Дополнительные разделы",
    description: "Полезные страницы и информационная безопасность.",
    links: [
      link("Полезная информация", "/poleznaya-informaciya/"),
      link("Осторожно, мошенники!", "/poleznaya-informaciya/ostorozhno-moshenniki/"),
      link("Муниципальный семейный клуб «ФамилиЯ»", "/municipalnyy-semeynyy-klub-familiya/"),
      link("Безопасность", "/sveden/ovz/"),
    ],
  },
];

const ACTION_LINKS = [
  link("Записаться на приём", "/tpmpk/zapis"),
  link("Новости", "/novosti/"),
  link("Методическое пространство", "/metodicheskoe-prostranstvo/"),
];

function normalizePath(pathname) {
  if (!pathname) return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export default function MegaMenu({ open, onClose, currentUser }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [query, setQuery] = useState("");
  const [activeGroupId, setActiveGroupId] = useState(MEGA_MENU_GROUPS[0].id);

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

  const allLinks = useMemo(
    () => [
      ...MEGA_MENU_GROUPS.flatMap((group) => group.links),
      ...ACTION_LINKS,
      ...roleLinks,
    ],
    [roleLinks],
  );

  const activeGroup = MEGA_MENU_GROUPS.find((group) => group.id === activeGroupId) || MEGA_MENU_GROUPS[0];

  const filteredLinks = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return [];
    return allLinks
      .filter((item) => item.label.toLowerCase().includes(value))
      .slice(0, 9);
  }, [allLinks, query]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  function goPath(path) {
    if (!path) return;
    onClose();
    navigate(path);
  }

  function isActive(path) {
    if (!path || path.includes("#")) return false;
    const current = normalizePath(location.pathname);
    const target = normalizePath(path);
    return target === "/" ? current === "/" : current.startsWith(target);
  }

  function renderLinkButton(item, className = "mega-link-button") {
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
          top: 84px;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 210;
          padding: 16px 16px 0;
          background: rgba(71, 119, 153, 0.92);
          overflow-y: auto;
          overflow-x: hidden;
          animation: megaFadeIn 0.18s ease-out;
        }

        @keyframes megaFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mega-container {
          width: min(1280px, calc(100% - 32px));
          margin: 0 auto;
          display: grid;
          gap: 14px;
          max-height: calc(100vh - 112px);
          overflow-y: auto;
          overflow-x: hidden;
          padding: 0;
          border-radius: 0;
          border: 0;
          background: transparent;
          box-shadow: none;
        }

        .mega-search-wrap {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          padding: 12px 14px;
          border: 1px solid rgba(31, 80, 115, 0.16);
          border-radius: 10px;
          background: #FFFFFF;
          box-shadow: 0 12px 30px rgba(31, 80, 115, 0.16);
        }

        .mega-search-wrap svg {
          flex: 0 0 auto;
          color: #1F5073;
        }

        .mega-search-input {
          flex: 1 1 auto;
          min-width: 0;
          border: 0;
          outline: 0;
          background: transparent;
          color: #1F5073;
          font: 750 14px/1.2 inherit;
        }

        .mega-search-input::placeholder {
          color: rgba(31, 80, 115, 0.68);
        }

        .mega-search-close {
          width: 36px;
          height: 36px;
          flex: 0 0 36px;
          border: 1px solid rgba(31, 80, 115, 0.16);
          border-radius: 8px;
          background: #FFFFFF;
          color: #1F5073;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
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
          border: 1px solid rgba(31, 80, 115, 0.16);
          border-radius: 12px;
          background: #FFFFFF;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15);
        }

        .mega-shell {
          display: grid;
          grid-template-columns: 300px minmax(0, 1fr);
          gap: 14px;
          min-height: clamp(360px, 58vh, 528px);
          align-items: stretch;
        }

        .mega-group-tabs,
        .mega-content-panel {
          border: 1px solid rgba(31, 80, 115, 0.16);
          border-radius: 12px;
          background: #FFFFFF;
          box-shadow: 0 12px 30px rgba(31, 80, 115, 0.14);
        }

        .mega-group-tabs {
          display: grid;
          gap: 5px;
          align-content: start;
          height: 100%;
          min-height: 0;
          max-height: none;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(31, 80, 115, 0.38) transparent;
        }

        .mega-group-tab {
          width: 100%;
          min-height: 42px;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: #1F5073;
          padding: 10px 10px;
          text-align: left;
          font: 850 12.5px/1.18 inherit;
          cursor: pointer;
        }

        .mega-group-tab:hover,
        .mega-group-tab.is-active {
          border-color: rgba(31, 80, 115, 0.16);
          background: #1F5073;
          color: #ffffff;
        }

        .mega-content-panel {
          min-width: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 14px;
          padding: 20px 18px;
          align-self: stretch;
          overflow: hidden;
        }

        .mega-content-head {
          display: grid;
          gap: 7px;
          padding-bottom: 14px;
          border-bottom: 1px solid rgba(31, 80, 115, 0.16);
        }

        .mega-content-head h2 {
          margin: 0;
          color: #1F5073;
          font-size: clamp(24px, 2.1vw, 32px);
          line-height: 1.12;
          letter-spacing: 0;
        }

        .mega-content-head p {
          max-width: 760px;
          margin: 0;
          color: #1F5073;
          font-size: 13.5px;
          line-height: 1.35;
          font-weight: 650;
        }

        .mega-links-grid {
          min-height: 0;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-content: start;
          gap: 9px;
          max-height: none;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 2px;
          scrollbar-width: thin;
          scrollbar-color: rgba(31, 80, 115, 0.38) transparent;
        }

        .mega-link-button,
        .mega-action-link,
        .mega-search-result {
          min-width: 0;
          min-height: 40px;
          border: 1px solid rgba(31, 80, 115, 0.16);
          border-radius: 8px;
          background: #FFFFFF;
          color: #1F5073;
          padding: 9px 10px;
          text-align: left;
          font: 800 12.5px/1.22 inherit;
          cursor: pointer;
          overflow-wrap: anywhere;
          transition: transform 0.14s ease, border-color 0.14s ease, background 0.14s ease, color 0.14s ease;
        }

        .mega-link-button:hover,
        .mega-link-button.is-active,
        .mega-action-link:hover,
        .mega-action-link.is-active,
        .mega-search-result:hover,
        .mega-search-result.is-active,
        .mega-search-close:hover {
          border-color: #1F5073;
          background: #1F5073;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .mega-action-panel {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 14px;
          border: 1px solid rgba(31, 80, 115, 0.16);
          border-radius: 12px;
          background: #FFFFFF;
          box-shadow: 0 12px 30px rgba(31, 80, 115, 0.14);
        }

        .mega-action-panel strong {
          color: #1F5073;
          font-size: 13px;
          line-height: 1.2;
          font-weight: 900;
          white-space: nowrap;
        }

        .mega-action-links {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 8px;
          flex-wrap: wrap;
        }

        .mega-action-link {
          min-height: 36px;
          width: auto;
          flex: 0 0 auto;
          white-space: nowrap;
        }

        body.mky-a11y-mode[data-a11y-scheme="dark"] .mega-overlay,
        body.mky-a11y-mode[data-a11y-scheme="dark"] .mega-container,
        body.mky-a11y-mode[data-a11y-scheme="dark"] .mega-search-wrap,
        body.mky-a11y-mode[data-a11y-scheme="dark"] .mega-search-results,
        body.mky-a11y-mode[data-a11y-scheme="dark"] .mega-group-tabs,
        body.mky-a11y-mode[data-a11y-scheme="dark"] .mega-content-panel,
        body.mky-a11y-mode[data-a11y-scheme="dark"] .mega-action-panel {
          background: #000000 !important;
          color: #ffffff !important;
          border-color: #ffffff !important;
          box-shadow: none !important;
        }

        body.mky-a11y-mode[data-a11y-scheme="dark"] .mega-content-head h2,
        body.mky-a11y-mode[data-a11y-scheme="dark"] .mega-content-head p {
          color: #ffffff !important;
        }

        @media (max-width: 980px) {
          .mega-shell {
            grid-template-columns: 1fr;
            justify-content: stretch;
            min-height: 0;
          }

          .mega-group-tabs {
            height: auto;
            max-height: 220px;
          }

          .mega-content-panel {
            max-height: none;
          }

          .mega-links-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            max-height: min(420px, 52vh);
          }

          .mega-action-panel {
            align-items: flex-start;
            flex-direction: column;
          }

          .mega-action-links {
            width: 100%;
            justify-content: flex-start;
          }
        }

        @media (max-width: 600px) {
          .mega-overlay {
            top: 67px;
            padding: 6px 8px 0;
          }

          .mega-container {
            width: min(100%, calc(100% - 8px));
            max-height: calc(100vh - 82px);
            gap: 10px;
          }

          .mega-search-wrap {
            padding: 8px;
          }

          .mega-shell {
            gap: 10px;
          }

          .mega-group-tabs {
            max-height: 188px;
            border-radius: 12px;
          }

          .mega-content-panel {
            padding: 12px;
            border-radius: 12px;
          }

          .mega-links-grid {
            grid-template-columns: 1fr;
            max-height: min(430px, 50vh);
          }

          .mega-action-panel {
            padding: 10px;
            gap: 10px;
          }

          .mega-action-link {
            width: 100%;
            white-space: normal;
          }
        }
      `}</style>

      <div className="mega-overlay">
        <div className="mega-container">
          <div className="mega-search-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
            {filteredLinks.length > 0 && (
              <div className="mega-search-results">
                {filteredLinks.map((item) => renderLinkButton(item, "mega-search-result"))}
              </div>
            )}
          </div>

          <div className="mega-shell">
            <nav className="mega-group-tabs" aria-label="Группы меню">
              {MEGA_MENU_GROUPS.map((group) => (
                <button
                  key={group.id}
                  className={`mega-group-tab${group.id === activeGroup.id ? " is-active" : ""}`}
                  type="button"
                  aria-pressed={group.id === activeGroup.id}
                  onClick={() => setActiveGroupId(group.id)}
                >
                  {group.groupTitle}
                </button>
              ))}
            </nav>

            <section className="mega-content-panel" aria-labelledby="mega-active-group-title">
              <div className="mega-content-head">
                <h2 id="mega-active-group-title">{activeGroup.groupTitle}</h2>
                <p>{activeGroup.description}</p>
              </div>
              <div className="mega-links-grid">
                {activeGroup.links.map((item) => renderLinkButton(item))}
              </div>
            </section>
          </div>

          <div className="mega-action-panel" aria-label="Быстрые действия">
            <strong>Быстрые действия</strong>
            <div className="mega-action-links">
              {ACTION_LINKS.map((item) => renderLinkButton(item, "mega-action-link"))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
