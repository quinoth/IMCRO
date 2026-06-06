import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  A11Y_EVENT,
  DEFAULT_A11Y_SETTINGS,
  readAccessibilitySettings,
  saveAccessibilitySettings,
} from "../../accessibility.js";
import Logo from "../../components/Logo.jsx";
import MegaMenu from "./MegaMenu.jsx";

const MAIN_NAV_ITEMS = [
  { label: "Главная", href: "/" },
  { label: "Сведения об образовательной организации", href: "/sveden/" },
  { label: "ТПМПК", href: "/tpmpk/" },
  { label: "Новости", href: "/novosti/" },
  { label: "Безопасность", href: "/sveden/ovz/" },
  { label: "Музей", href: "/deyatelnost/muzey/" },
];

function normalizePath(pathname) {
  if (!pathname) return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function SearchIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.8-3.8" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Header({ onGoAuth, onGoAdmin, onGoProfile, currentUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  const searchInputRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [a11yPanelOpen, setA11yPanelOpen] = useState(false);
  const [a11ySettings, setA11ySettings] = useState(() => readAccessibilitySettings());
  const a11yMode = a11ySettings.enabled;

  const currentPath = normalizePath(location.pathname);
  const userInitials = currentUser
    ? `${currentUser.firstName?.[0] || ""}${currentUser.lastName?.[0] || ""}` || "П"
    : "П";
  const currentRole = typeof currentUser?.role === "object" ? currentUser.role?.role_name : currentUser?.role;
  const canShowAdminButton = Boolean(currentUser && onGoAdmin && (currentRole === "admin" || currentRole === "methodist" || currentRole === "domu_editor"));
  const canShowTpmpkCabinetButton = currentRole === "operator";

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  useEffect(() => {
    if (!searchOpen) return undefined;
    searchInputRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [searchOpen]);

  useEffect(() => {
    const sync = (event) => setA11ySettings(event.detail || readAccessibilitySettings());
    window.addEventListener(A11Y_EVENT, sync);
    return () => window.removeEventListener(A11Y_EVENT, sync);
  }, []);

  function updateA11ySettings(patch) {
    setA11ySettings(saveAccessibilitySettings({ ...a11ySettings, ...patch }));
  }

  function resetA11ySettings() {
    setA11ySettings(saveAccessibilitySettings(DEFAULT_A11Y_SETTINGS));
  }

  const navSearchIndex = useMemo(
    () => MAIN_NAV_ITEMS.map((item) => ({ ...item, search: item.label.toLowerCase() })),
    [],
  );

  function goPath(path) {
    if (!path) return;
    setMenuOpen(false);
    const target = normalizePath(path);
    if (target === currentPath) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    navigate(path);
  }

  function executeSearch() {
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return;

    if (normalized.startsWith("/")) {
      navigate(normalized);
      setSearchOpen(false);
      return;
    }

    const byPrefix = navSearchIndex.find((item) => item.search.startsWith(normalized));
    const byContains = navSearchIndex.find((item) => item.search.includes(normalized));
    const target = byPrefix || byContains;
    if (target) {
      goPath(target.href);
      setSearchOpen(false);
    }
  }

  function onSearchSubmit(event) {
    event.preventDefault();
    executeSearch();
  }

  function onSearchKeyDown(event) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    executeSearch();
  }

  return (
    <>
      <style>{`
        .site-header-shell {
          position: fixed;
          inset: 0 0 auto;
          z-index: 240;
          border-bottom: 1px solid rgba(31, 80, 115, 0.16);
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(18px);
          box-shadow: var(--header-shadow);
          transition: background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .site-header-shell *:focus-visible {
          outline: 3px solid #1F5073;
          outline-offset: 2px;
        }

        .site-header-inner {
          max-width: 1440px;
          margin: 0 auto;
          height: 84px;
          min-width: 0;
          padding: 0 18px;
          display: grid;
          grid-template-columns: minmax(188px, 240px) minmax(0, 1fr) auto;
          align-items: center;
          column-gap: 12px;
        }

        .header-logo-slot {
          min-width: 0;
          height: 100%;
          display: flex;
          align-items: center;
        }

        .header-logo-slot img {
          width: clamp(188px, 16vw, 240px) !important;
          height: auto !important;
          max-height: 54px;
        }

        .header-main-area {
          min-width: 0;
          position: relative;
          height: 84px;
          display: flex;
          align-items: center;
        }

        .header-nav {
          width: 100%;
          height: 84px;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          overflow: visible;
          transition: opacity 0.16s ease, transform 0.2s ease, visibility 0.16s ease;
        }

        .header-main-area.search-mode .header-nav {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateX(-18px);
        }

        .header-nav-link {
          position: relative;
          flex: 0 0 auto;
          height: 42px;
          border: 1px solid transparent;
          border-radius: 8px;
          background: transparent;
          color: #1F5073;
          padding: 0 8px;
          font: 800 12px/1.1 inherit;
          letter-spacing: 0;
          white-space: nowrap;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: color 0.16s ease, background 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
        }

        .header-nav-link::after {
          content: "";
          position: absolute;
          left: 14px;
          right: 14px;
          bottom: 7px;
          height: 2px;
          border-radius: 999px;
          background: currentColor;
          opacity: 0;
          transform: scaleX(0.5);
          transition: opacity 0.16s ease, transform 0.16s ease;
        }

        .header-nav-link:hover {
          color: #1F5073;
          background: rgba(31, 80, 115, 0.08);
          border-color: rgba(31, 80, 115, 0.16);
          transform: translateY(-1px);
        }

        .header-nav-link.is-active {
          color: #1F5073;
          background: rgba(31, 80, 115, 0.1);
          border-color: rgba(31, 80, 115, 0.22);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.74);
        }

        .header-nav-link.is-active::after {
          opacity: 0.82;
          transform: scaleX(1);
        }

        .header-search-panel {
          position: absolute;
          inset: 18px 0;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 10px 0 14px;
          border: 1px solid rgba(31, 80, 115, 0.34);
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 16px 36px rgba(31, 80, 115, 0.14);
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          transform: translateX(24px) scaleX(0.95);
          transform-origin: right center;
          transition: opacity 0.18s ease, visibility 0.18s ease, transform 0.2s ease;
        }

        .header-main-area.search-mode .header-search-panel {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
          transform: translateX(0) scaleX(1);
        }

        .header-search-panel svg {
          color: #1F5073;
          flex: 0 0 auto;
        }

        .header-search-input {
          width: 100%;
          min-width: 0;
          height: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #1F5073;
          font: 700 14px/1 inherit;
        }

        .header-search-input::placeholder {
          color: rgba(31, 80, 115, 0.68);
        }

        .header-search-submit,
        .header-search-close,
        .header-icon-btn,
        .header-search-btn,
        .header-menu-btn {
          width: 40px;
          height: 40px;
          flex: 0 0 40px;
          border: 1px solid rgba(31, 80, 115, 0.16);
          border-radius: 8px;
          background: #fff;
          color: #1F5073;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }

        .header-search-submit,
        .header-search-close {
          width: 32px;
          height: 32px;
          flex-basis: 32px;
          background: #ffffff;
        }

        .header-search-submit {
          color: #1F5073;
        }

        .header-search-btn svg,
        .header-icon-btn svg {
          width: 22px;
          height: 22px;
        }

        .header-icon-btn:hover,
        .header-search-btn:hover,
        .header-icon-btn.active,
        .header-search-btn.active,
        .header-menu-btn:hover,
        .header-search-submit:hover,
        .header-search-close:hover {
          border-color: rgba(31, 80, 115, 0.34);
          background: rgba(31, 80, 115, 0.08);
          color: #1F5073;
          transform: translateY(-1px);
        }

        .header-search-btn.active {
          box-shadow: 0 0 0 3px rgba(31, 80, 115, 0.14);
        }

        .header-actions {
          min-width: 0;
          height: 84px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }

        .header-a11y-wrap {
          position: relative;
          display: inline-flex;
        }

        .header-a11y-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          z-index: 260;
          width: min(360px, calc(100vw - 24px));
          display: grid;
          gap: 14px;
          padding: 16px;
          border: 1px solid #c9defb;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.16);
        }

        .header-a11y-panel h2 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
        }

        .header-a11y-panel p {
          margin: 0;
          color: #475569;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 650;
        }

        .a11y-row {
          display: grid;
          gap: 7px;
        }

        .a11y-row label,
        .a11y-toggle-label {
          color: #0f172a;
          font-size: 13px;
          font-weight: 900;
        }

        .a11y-row select {
          width: 100%;
          min-height: 40px;
          border: 1px solid #dbe5f1;
          border-radius: 8px;
          background: #f8fbff;
          color: #0f172a;
          padding: 0 10px;
          font: 750 13px/1 inherit;
        }

        .a11y-toggle-line {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .a11y-switch {
          width: 54px;
          height: 32px;
          border: 1px solid #cbd5e1;
          border-radius: 999px;
          background: #e2e8f0;
          padding: 3px;
          cursor: pointer;
        }

        .a11y-switch span {
          display: block;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.2);
          transform: translateX(0);
        }

        .a11y-switch.is-on {
          background: #0b63ce;
          border-color: #0b63ce;
        }

        .a11y-switch.is-on span {
          transform: translateX(20px);
        }

        .a11y-reset {
          min-height: 38px;
          border: 1px solid #dbe5f1;
          border-radius: 8px;
          background: #ffffff;
          color: #1e3a8a;
          font: 900 13px/1 inherit;
          cursor: pointer;
        }

        .header-admin-btn,
        .header-tpmpk-btn,
        .header-profile-btn,
        .header-auth-btn,
        .header-register-btn {
          height: 40px;
          border: 1px solid rgba(31, 80, 115, 0.16);
          border-radius: 8px;
          background: #fff;
          color: #1F5073;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 12px;
          font: 800 13px/1 inherit;
          white-space: nowrap;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
        }

        .header-register-btn {
          border-color: #1F5073;
          background: #1F5073;
          color: #fff;
          box-shadow: 0 10px 24px rgba(31, 80, 115, 0.18);
        }

        .header-admin-btn:hover,
        .header-tpmpk-btn:hover,
        .header-profile-btn:hover,
        .header-auth-btn:hover {
          border-color: rgba(31, 80, 115, 0.34);
          background: rgba(31, 80, 115, 0.08);
          color: #1F5073;
          transform: translateY(-1px);
        }

        .header-register-btn:hover {
          background: #1F5073;
          border-color: #1F5073;
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(31, 80, 115, 0.22);
        }

        .header-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #1F5073;
          color: #fff;
          font-size: 11px;
          font-weight: 900;
        }

        .header-spacer {
          height: 85px;
        }

        @media (max-width: 1440px) {
          .header-auth-text,
          .header-register-text,
          .header-admin-label,
          .header-tpmpk-label,
          .header-action-label {
            display: none;
          }

          .header-auth-btn,
          .header-register-btn,
          .header-admin-btn,
          .header-tpmpk-btn,
          .header-profile-btn {
            width: 44px;
            padding: 0;
          }

          .header-nav-link {
            font-size: 11.5px;
            padding: 0 6px;
          }
        }

        @media (max-width: 1320px) {
          .header-nav {
            gap: 3px;
          }

          .header-nav-link {
            font-size: 11.1px;
            padding: 0 5px;
          }
        }

        @media (max-width: 1240px) {
          .site-header-inner {
            padding: 0 20px;
            column-gap: 16px;
          }

          .header-nav-link {
            font-size: 11.5px;
            padding: 0 7px;
          }
        }

        @media (max-width: 1279px) {
          .header-nav {
            display: none;
          }

          .header-logo-slot {
            grid-column: 1;
          }

          .header-main-area {
            grid-column: 1 / -1;
            height: 0;
            position: absolute;
            left: 20px;
            right: 20px;
            top: 84px;
            z-index: 1;
            display: block;
          }

          .header-actions {
            grid-column: 3;
          }

          .header-search-panel {
            inset: 0;
            height: 50px;
            transform: translateY(-8px);
            transform-origin: top center;
          }

          .header-main-area.search-mode .header-search-panel {
            transform: translateY(0);
          }

          .site-header-shell:has(.header-main-area.search-mode) {
            padding-bottom: 64px;
          }
        }

        @media (max-width: 720px) {
          .site-header-inner,
          .header-actions {
            height: 68px;
          }

          .site-header-inner {
            padding: 0 12px;
            column-gap: 8px;
            grid-template-columns: minmax(136px, 1fr) 0 auto;
          }

          .header-logo-slot img {
            width: clamp(166px, 43vw, 218px) !important;
            max-height: 46px;
          }

          .header-main-area {
            left: 12px;
            right: 12px;
            top: 68px;
          }

          .header-spacer {
            height: 69px;
          }

          .header-admin-btn,
          .header-tpmpk-btn {
            display: none;
          }

          .header-icon-btn,
          .header-menu-btn,
          .header-search-btn,
          .header-auth-btn,
          .header-register-btn,
          .header-profile-btn {
            width: 40px;
            height: 40px;
            min-width: 40px;
            min-height: 40px;
            flex-basis: 40px;
            padding: 0;
            box-sizing: border-box;
          }

          .header-auth-icon,
          .header-menu-btn svg,
          .header-search-btn svg,
          .header-icon-btn svg {
            flex: 0 0 auto;
          }
        }

        @media (max-width: 520px) {
          .site-header-inner {
            padding: 0 8px;
            column-gap: 5px;
            grid-template-columns: minmax(112px, 1fr) 0 auto;
          }

          .header-actions {
            min-width: max-content;
            gap: 4px;
            overflow: visible;
          }

          .header-logo-slot img {
            width: clamp(118px, 30vw, 150px) !important;
            max-height: 40px;
          }
        }

        @media (max-width: 420px) {
          .site-header-inner {
            padding: 0 6px;
            column-gap: 4px;
            grid-template-columns: minmax(96px, 1fr) 0 auto;
          }

          .header-actions {
            min-width: max-content;
            gap: 4px;
            overflow: visible;
          }

          .header-logo-slot img {
            width: clamp(104px, 29vw, 122px) !important;
            max-height: 40px;
          }

          .header-avatar {
            width: 24px;
            height: 24px;
            font-size: 10px;
          }

          .header-icon-btn,
          .header-menu-btn,
          .header-search-btn,
          .header-auth-btn,
          .header-register-btn,
          .header-profile-btn {
            width: 44px;
            height: 44px;
            min-width: 44px;
            min-height: 44px;
            flex: 0 0 44px;
            padding: 0;
            box-sizing: border-box;
          }

        }
      `}</style>

      <div className="header-spacer" />

      <header
        className="site-header-shell"
        style={{ "--header-shadow": scrolled ? "0 10px 28px rgba(15, 23, 42, 0.12)" : "0 2px 12px rgba(15, 23, 42, 0.06)" }}
      >
        <div className="site-header-inner">
          <div className="header-logo-slot">
            <Logo />
          </div>

          <div className={`header-main-area${searchOpen ? " search-mode" : ""}`}>
            <nav className="header-nav" aria-label="Главная навигация">
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive = item.href === "/" ? currentPath === "/" : currentPath.startsWith(item.href);
                return (
                  <button
                    key={item.href}
                    type="button"
                    className={`header-nav-link${isActive ? " is-active" : ""}`}
                    onClick={() => goPath(item.href)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <form className="header-search-panel" role="search" onSubmit={onSearchSubmit}>
              <SearchIcon />
              <input
                ref={searchInputRef}
                className="header-search-input"
                type="search"
                value={searchQuery}
                placeholder="Поиск по сайту"
                aria-label="Поиск по сайту"
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={onSearchKeyDown}
              />
              <button
                className="header-search-submit"
                type="submit"
                title="Найти"
                aria-label="Найти"
              >
                <SearchIcon />
              </button>
              <button
                className="header-search-close"
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Закрыть поиск"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </form>
          </div>

          <div className="header-actions">
            <button
              className={`header-search-btn${searchOpen ? " active" : ""}`}
              type="button"
              title="Поиск"
              aria-label="Поиск"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((value) => !value)}
            >
              <SearchIcon />
            </button>

            <div className="header-a11y-wrap">
              <button
                className={`header-icon-btn${a11yMode ? " active" : ""}`}
                type="button"
                title="Версия для слабовидящих"
                aria-label="Версия для слабовидящих"
                aria-pressed={a11yMode}
                aria-expanded={a11yPanelOpen}
                onClick={() => setA11yPanelOpen((value) => !value)}
              >
                <EyeIcon />
              </button>
              {a11yPanelOpen && (
                <div className="header-a11y-panel" role="dialog" aria-label="Настройки версии для слабовидящих">
                  <div>
                    <h2>Версия для слабовидящих</h2>
                    <p>Настройки применяются ко всем страницам и сохраняются после перезагрузки.</p>
                  </div>
                  <div className="a11y-toggle-line">
                    <span className="a11y-toggle-label">Режим включён</span>
                    <button type="button" className={`a11y-switch${a11ySettings.enabled ? " is-on" : ""}`} aria-label={a11ySettings.enabled ? "Выключить режим" : "Включить режим"} aria-pressed={a11ySettings.enabled} onClick={() => updateA11ySettings({ enabled: !a11ySettings.enabled })}>
                      <span />
                    </button>
                  </div>
                  <div className="a11y-row">
                    <label htmlFor="a11y-font">Размер шрифта</label>
                    <select id="a11y-font" value={a11ySettings.fontSize} onChange={(event) => updateA11ySettings({ fontSize: event.target.value, enabled: true })}>
                      <option value="large">Крупный</option>
                      <option value="xlarge">Очень крупный</option>
                    </select>
                  </div>
                  <div className="a11y-row">
                    <label htmlFor="a11y-scheme">Цветовая схема</label>
                    <select id="a11y-scheme" value={a11ySettings.scheme} onChange={(event) => updateA11ySettings({ scheme: event.target.value, enabled: true })}>
                      <option value="light">Светлая контрастная</option>
                      <option value="dark">Тёмная контрастная</option>
                      <option value="mono">Чёрно-белая</option>
                    </select>
                  </div>
                  <div className="a11y-row">
                    <label htmlFor="a11y-line">Интервал</label>
                    <select id="a11y-line" value={a11ySettings.lineHeight} onChange={(event) => updateA11ySettings({ lineHeight: event.target.value, enabled: true })}>
                      <option value="wide">Увеличенный</option>
                      <option value="extra">Очень широкий</option>
                    </select>
                  </div>
                  <div className="a11y-toggle-line">
                    <span className="a11y-toggle-label">Скрыть изображения</span>
                    <button type="button" className={`a11y-switch${a11ySettings.hideImages ? " is-on" : ""}`} aria-label={a11ySettings.hideImages ? "Показывать изображения" : "Скрыть изображения"} aria-pressed={a11ySettings.hideImages} onClick={() => updateA11ySettings({ hideImages: !a11ySettings.hideImages, enabled: true })}>
                      <span />
                    </button>
                  </div>
                  <button type="button" className="a11y-reset" onClick={resetA11ySettings}>Сбросить настройки</button>
                </div>
              )}
            </div>

            {canShowAdminButton && (
              <button className="header-admin-btn" type="button" onClick={onGoAdmin} title="Админ-панель">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="2" y="2" width="5" height="5" rx="1.3" />
                  <rect x="9" y="2" width="5" height="5" rx="1.3" />
                  <rect x="2" y="9" width="5" height="5" rx="1.3" />
                  <rect x="9" y="9" width="5" height="5" rx="1.3" />
                </svg>
                <span className="header-admin-label">Админ-панель</span>
              </button>
            )}

            {canShowTpmpkCabinetButton && (
              <button className="header-tpmpk-btn" type="button" onClick={() => goPath("/admin/tpmpk/")} title="Кабинет ТПМПК">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 21s7-4.4 7-10V5l-7-3-7 3v6c0 5.6 7 10 7 10Z" />
                  <path d="M9 12h6" />
                  <path d="M12 9v6" />
                </svg>
                <span className="header-tpmpk-label">Кабинет ТПМПК</span>
              </button>
            )}

            {currentUser ? (
              <button className="header-profile-btn" type="button" onClick={onGoProfile} title="Профиль">
                <span className="header-avatar">{userInitials}</span>
                <span className="header-action-label">{currentUser.firstName || "Профиль"}</span>
              </button>
            ) : (
              <>
                <button className="header-auth-btn" type="button" onClick={() => onGoAuth?.("login")} title="Вход">
                  <span className="header-auth-text">Вход</span>
                  <svg className="header-auth-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                    <path d="m10 17 5-5-5-5" />
                    <path d="M15 12H3" />
                  </svg>
                </button>
                <button className="header-register-btn" type="button" onClick={() => onGoAuth?.("register")} title="Регистрация">
                  <span className="header-register-text">Регистрация</span>
                  <svg className="header-auth-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M19 8v6" />
                    <path d="M22 11h-6" />
                  </svg>
                </button>
              </>
            )}

            <button
              className="header-menu-btn"
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              title="Открыть меню"
              aria-label="Открыть меню"
              aria-expanded={menuOpen}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                {menuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MegaMenu open={menuOpen} onClose={() => setMenuOpen(false)} currentUser={currentUser} />
    </>
  );
}
