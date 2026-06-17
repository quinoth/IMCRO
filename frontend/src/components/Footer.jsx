import { Link } from "react-router-dom";
import { A11Y_EVENT, disableAccessibilityMode, enableAccessibilityMode, readAccessibilitySettings } from "../accessibility.js";
import { useEffect, useState } from "react";

const FOOTER_COLS = [
  {
    title: "Основное",
    links: [
      { label: "Главная", to: "/" },
      { label: "Сведения об организации", to: "/sveden/" },
      { label: "Новости", to: "/novosti/" },
      { label: "События", to: "/novosti/" },
    ],
  },
  {
    title: "Разделы",
    links: [
      { label: "ТПМПК", to: "/tpmpk/" },
      { label: "Дом учителя", to: "/dom-uchitelya/" },
      { label: "Методическое пространство", to: "/metodicheskoe-prostranstvo/" },
      { label: "НОКО", to: "/noko/" },
    ],
  },
  {
    title: "Направления",
    links: [
      { label: "Деятельность", to: "/deyatelnost/" },
      { label: "Олимпиады и конкурсы", to: "/konkursy/" },
      { label: "Архив", to: "/archiv/" },
    ],
  },
  {
    title: "Полезные ссылки",
    links: [
      { label: "Министерство просвещения РФ", href: "https://edu.gov.ru/" },
      { label: "Портал Госуслуг", href: "https://www.gosuslugi.ru/" },
      { label: "Администрация Иркутска", href: "https://admirk.ru/" },
    ],
  },
];

export default function Footer() {
  const [settings, setSettings] = useState(() => readAccessibilitySettings());

  useEffect(() => {
    const sync = (event) => setSettings(event.detail || readAccessibilitySettings());
    window.addEventListener(A11Y_EVENT, sync);
    return () => window.removeEventListener(A11Y_EVENT, sync);
  }, []);

  function toggleA11y() {
    setSettings(settings.enabled ? disableAccessibilityMode(settings) : enableAccessibilityMode());
  }

  return (
    <footer className="site-footer">
      <style>{`
        .site-footer {
          background: #1F5073;
          color: #ffffff;
          padding: 52px 24px 28px;
        }
        .site-footer-inner {
          width: min(var(--app-page-max, 1180px), 100%);
          margin: 0 auto;
        }
        .site-footer-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 28px;
          margin-bottom: 38px;
        }
        .footer-title {
          margin-bottom: 14px;
          color: #ffffff;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .footer-links {
          display: grid;
          gap: 8px;
        }
        .footer-link {
          width: fit-content;
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          color: rgba(255, 255, 255, 0.82);
          font-size: 14px;
          font-weight: 650;
          text-decoration: none;
        }
        .footer-link:hover,
        .footer-link:focus-visible {
          color: #ffffff;
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .footer-bottom {
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 24px;
          padding-right: 78px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          flex-wrap: wrap;
        }
        .footer-copy {
          color: rgba(255, 255, 255, 0.72);
          font-size: 13px;
          line-height: 1.5;
        }
        .footer-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .footer-a11y-btn {
          min-height: 40px;
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: 8px;
          background: ${settings.enabled ? "rgba(255,255,255,0.16)" : "transparent"};
          color: #ffffff;
          padding: 0 14px;
          font: 900 13px/1 inherit;
          cursor: pointer;
        }
        .footer-a11y-btn:hover,
        .footer-a11y-btn:focus-visible {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          border-color: rgba(255, 255, 255, 0.82);
        }
        body.mky-a11y-mode .site-footer {
          background: var(--app-bg) !important;
          color: var(--app-text) !important;
          border-top: 1px solid var(--app-border-strong) !important;
        }
        body.mky-a11y-mode .footer-bottom {
          border-top-color: var(--app-border-strong) !important;
        }
        body.mky-a11y-mode .footer-title,
        body.mky-a11y-mode .footer-link,
        body.mky-a11y-mode .footer-copy,
        body.mky-a11y-mode .footer-a11y-btn {
          color: var(--app-text) !important;
        }
        body.mky-a11y-mode .footer-a11y-btn {
          border-color: var(--app-border-strong) !important;
          background: var(--app-surface) !important;
        }
        @media (max-width: 900px) {
          .site-footer-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 560px) {
          .site-footer { padding: 38px 18px 24px; }
          .site-footer-grid { grid-template-columns: 1fr; gap: 22px; }
          .footer-bottom { align-items: flex-start; flex-direction: column; padding-right: 0; padding-bottom: 72px; }
          .footer-a11y-btn { width: 100%; }
        }
      `}</style>
      <div className="site-footer-inner">
        <div className="site-footer-grid">
          {FOOTER_COLS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <div className="footer-title">{col.title}</div>
              <div className="footer-links">
                {col.links.map((item) => item.to ? (
                  <Link key={item.label} className="footer-link" to={item.to}>{item.label}</Link>
                ) : (
                  <a key={item.label} className="footer-link" href={item.href} target="_blank" rel="noreferrer">{item.label}</a>
                ))}
              </div>
            </nav>
          ))}
        </div>
        <div className="footer-bottom">
          <div className="footer-copy">© 2026 МКУ развития образования города Иркутска</div>
          <div className="footer-actions">
            <button type="button" className="footer-a11y-btn" aria-pressed={settings.enabled} onClick={toggleA11y}>
              {settings.enabled ? "Обычная версия сайта" : "Версия для слабовидящих"}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
