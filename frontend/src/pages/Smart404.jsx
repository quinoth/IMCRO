import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import Header from "../features/nav/Header.jsx";
import { API_BASE } from "../constants/index.js";

const SITE_PAGES = [
  { title: "Главная", href: "/", description: "Новости, мероприятия и основные разделы сайта." },
  { title: "Сведения об ОО", href: "/sveden/", description: "Официальный раздел с 13 обязательными подразделами." },
  { title: "ТПМПК", href: "/tpmpk/", description: "Раздел территориальной психолого-медико-педагогической комиссии." },
  { title: "Запись на обследование ПМПК", href: "/tpmpk/zapis", description: "Онлайн-заявка на обследование ребенка." },
  { title: "Документы ТПМПК", href: "/tpmpk/dokumenty/", description: "Перечень документов для прохождения комиссии." },
  { title: "Бланки и формы", href: "/tpmpk/blanki/", description: "Заявления, согласия и формы для родителей." },
  { title: "График работы комиссии", href: "/tpmpk/grafik/", description: "Расписание приема и режим работы ТПМПК." },
  { title: "Состав комиссии", href: "/tpmpk/sostav/", description: "Специалисты и направления работы комиссии." },
  { title: "Нормативные акты", href: "/tpmpk/npa/", description: "Правовая база и положения ТПМПК." },
  { title: "FAQ", href: "/tpmpk/faq/", description: "Ответы на частые вопросы." },
  { title: "Для родителей", href: "/tpmpk/dlya-roditeley/", description: "Памятки и рекомендации для семей." },
  { title: "Для педагогов", href: "/tpmpk/dlya-pedagogov/", description: "Материалы для образовательных организаций." },
  { title: "Контакты ТПМПК", href: "/tpmpk/kontakty/", description: "Телефон, адрес и порядок обращения." },
];

const POPULAR_SECTIONS = [
  { title: "Главная", href: "/", text: "Новости и события" },
  { title: "Сведения об ОО", href: "/sveden/", text: "Основная информация" },
  { title: "ТПМПК", href: "/tpmpk/", text: "Комиссия и запись" },
  { title: "Дом учителя", href: "/", text: "Городские мероприятия" },
  { title: "Методическое пространство", href: "/", text: "Материалы для педагогов" },
  { title: "Контакты", href: "/tpmpk/kontakty/", text: "Адрес и телефон" },
];

const LEGACY_HINTS = {
  sveden: "/sveden/",
  pmpk: "/tpmpk/",
  pmk: "/tpmpk/",
  docs: "/tpmpk/dokumenty/",
  documents: "/tpmpk/dokumenty/",
  forms: "/tpmpk/blanki/",
  schedule: "/tpmpk/grafik/",
  contacts: "/tpmpk/kontakty/",
  parents: "/tpmpk/dlya-roditeley/",
  teachers: "/tpmpk/dlya-pedagogov/",
};

function normalize(value) {
  return String(value || "").toLowerCase().replace(/[-_/]+/g, " ").trim();
}

function scorePage(pathname, page) {
  const source = normalize(`${page.title} ${page.href} ${page.description}`);
  const query = normalize(pathname);
  if (!query) return 0;
  if (source.includes(query)) return 100;
  return query.split(" ").reduce((score, part) => score + (source.includes(part) ? 16 : 0), 0);
}

export default function Smart404({ currentUser, onGoAuth, onGoAdmin, onGoProfile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Страница не найдена | МКУ развития образования города Иркутска";
  }, []);

  const suggestions = useMemo(() => {
    const parts = normalize(location.pathname).split(" ");
    const legacyTarget = parts.map((part) => LEGACY_HINTS[part]).find(Boolean);
    if (legacyTarget) {
      const match = SITE_PAGES.find((page) => page.href === legacyTarget);
      if (match) return [match, ...SITE_PAGES.filter((page) => page.href !== legacyTarget).slice(0, 2)];
    }
    return [...SITE_PAGES]
      .sort((a, b) => scorePage(location.pathname, b) - scorePage(location.pathname, a))
      .slice(0, 3);
  }, [location.pathname]);

  async function handleSearch(event) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/search/?q=${encodeURIComponent(value)}`);
      if (!response.ok) throw new Error("search failed");
      const data = await response.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch {
      setError("Не удалось выполнить поиск. Попробуйте перейти в один из популярных разделов ниже.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="smart404-page">
      <style>{`
        .smart404-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: #0f172a;
          background:
            radial-gradient(circle at 85% 8%, rgba(124, 58, 237, 0.07), transparent 28%),
            linear-gradient(180deg, #fbfdff 0%, #f4f8fd 56%, #eef4fb 100%);
        }

        .smart404-main {
          flex: 1;
        }

        .smart404-shell {
          width: min(1120px, calc(100% - 28px));
          margin: 0 auto;
          padding: 34px 0 72px;
        }

        .smart404-hero {
          border: 1px solid #dbe6f5;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
          padding: 22px;
          display: grid;
          gap: 22px;
        }

        .smart404-kicker {
          width: fit-content;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(31, 80, 115, 0.08);
          color: #1F5073;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .smart404-title {
          max-width: 760px;
          color: #0f172a;
          font-size: clamp(34px, 7vw, 60px);
          line-height: 1;
          letter-spacing: 0;
          margin: 0;
        }

        .smart404-lead {
          max-width: 760px;
          color: #475569;
          font-size: 17px;
          line-height: 1.58;
          font-weight: 650;
          margin: 0;
        }

        .smart404-search {
          display: grid;
          gap: 10px;
        }

        .smart404-search-row {
          display: grid;
          gap: 10px;
        }

        .smart404-search input {
          width: 100%;
          min-height: 56px;
          border: 1px solid #d7e2f2;
          border-radius: 8px;
          background: #fff;
          color: #0f172a;
          padding: 0 15px;
          font: 800 16px/1.2 inherit;
          outline: none;
        }

        .smart404-search input:focus {
          border-color: #1F5073;
          box-shadow: 0 0 0 4px rgba(31, 80, 115, 0.12);
        }

        .smart404-button,
        .smart404-home {
          min-height: 54px;
          border-radius: 8px;
          border: 0;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #fff;
          background: #1F5073;
          font-weight: 950;
          text-decoration: none;
          cursor: pointer;
          box-shadow: 0 16px 34px rgba(30, 58, 138, 0.18);
        }

        .smart404-button:disabled {
          opacity: 0.72;
          cursor: progress;
        }

        .smart404-grid {
          display: grid;
          gap: 12px;
          margin-top: 20px;
        }

        .smart404-section-title {
          color: #0f172a;
          font-size: 22px;
          line-height: 1.15;
          margin: 10px 0 0;
        }

        .smart404-card,
        .smart404-popular-card {
          border: 1px solid #dbe6f5;
          border-radius: 8px;
          background: #fff;
          color: inherit;
          text-decoration: none;
          padding: 16px;
          display: grid;
          gap: 7px;
          transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .smart404-card:hover,
        .smart404-popular-card:hover {
          transform: translateY(-2px);
          border-color: #1F5073;
          box-shadow: 0 18px 38px rgba(30, 58, 138, 0.09);
        }

        .smart404-card strong,
        .smart404-popular-card strong {
          color: #1e3a8a;
          font-size: 17px;
          line-height: 1.25;
        }

        .smart404-card span,
        .smart404-popular-card span {
          color: #64748b;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 650;
        }

        .smart404-results {
          display: grid;
          gap: 10px;
        }

        .smart404-error {
          border: 1px solid #fed7aa;
          border-radius: 8px;
          background: #fff7ed;
          color: #9a3412;
          padding: 13px 14px;
          font-weight: 800;
          line-height: 1.45;
        }

        .smart404-popular {
          margin-top: 24px;
          display: grid;
          gap: 12px;
        }

        .smart404-actions {
          margin-top: 24px;
          display: grid;
          gap: 10px;
        }

        @media (min-width: 720px) {
          .smart404-shell {
            width: min(1120px, calc(100% - 44px));
            padding-top: 48px;
          }

          .smart404-hero {
            padding: 38px;
          }

          .smart404-search-row {
            grid-template-columns: minmax(0, 1fr) 180px;
          }

          .smart404-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .smart404-popular {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .smart404-actions {
            grid-template-columns: max-content;
          }
        }
      `}</style>

      <Header
        currentUser={currentUser}
        onGoAuth={onGoAuth}
        onGoAdmin={onGoAdmin}
        onGoProfile={onGoProfile}
      />

      <main className="smart404-main">
        <div className="smart404-shell">
          <section className="smart404-hero">
            <span className="smart404-kicker">404</span>
            <h1 className="smart404-title">Страница не найдена</h1>
            <p className="smart404-lead">
              К сожалению, такой страницы не существует. Вот что мы смогли найти:
            </p>

            <div className="smart404-grid" aria-label="Релевантные подсказки">
              {suggestions.map((item) => (
                <Link className="smart404-card" key={item.href} to={item.href}>
                  <strong>{item.title}</strong>
                  <span>{item.description}</span>
                </Link>
              ))}
            </div>

            <form className="smart404-search" onSubmit={handleSearch} role="search">
              <h2 className="smart404-section-title">Поиск по сайту</h2>
              <div className="smart404-search-row">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Например: документы ТПМПК"
                  aria-label="Поиск по сайту"
                />
                <button className="smart404-button" type="submit" disabled={loading}>
                  {loading ? "Ищем..." : "Найти"}
                </button>
              </div>
              {error && <div className="smart404-error" role="alert">{error}</div>}
              {results.length > 0 && (
                <div className="smart404-results" aria-live="polite">
                  {results.map((item) => (
                    <Link className="smart404-card" key={item.url} to={item.url}>
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </Link>
                  ))}
                </div>
              )}
            </form>

            <div>
              <h2 className="smart404-section-title">Популярные разделы</h2>
              <div className="smart404-popular">
                {POPULAR_SECTIONS.map((item) => (
                  <Link className="smart404-popular-card" key={item.title} to={item.href}>
                    <strong>{item.title}</strong>
                    <span>{item.text}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="smart404-actions">
              <button className="smart404-home" type="button" onClick={() => navigate("/")}>
                Вернуться на главную
              </button>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
