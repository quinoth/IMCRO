import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  A11Y_EVENT,
  disableAccessibilityMode,
  enableAccessibilityMode,
  readAccessibilitySettings,
  saveAccessibilitySettings,
} from "../../accessibility.js";
import Logo from "../../components/Logo.jsx";
import MegaMenu from "./MegaMenu.jsx";

const MAIN_NAV_ITEMS = [
  { label: "Главная", href: "/" },
  { label: "Сведения об образовательной организации", href: "/sveden/" },
  { label: "ТПМПК", href: "/tpmpk/" },
  { label: "Дом учителя", href: "/dom-uchitelya/" },
  { label: "Новости", href: "/novosti/" },
  { label: "Безопасность", href: "/bezopasnost/" },
  { label: "Музей", href: "/deyatelnost/muzey/" },
];

function normalizePath(pathname) {
  if (!pathname) return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

function isActiveNavItem(currentPath, href) {
  const target = normalizePath(href);
  if (target === "/") return currentPath === "/";
  return currentPath === target || currentPath.startsWith(target);
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

const A11Y_FONT_OPTIONS = [
  { value: "normal", label: "Обычный", sample: "A", ariaLabel: "Размер шрифта: обычный" },
  { value: "large", label: "Крупный", sample: "A+", ariaLabel: "Размер шрифта: крупный" },
  { value: "xlarge", label: "Очень крупный", sample: "A++", ariaLabel: "Размер шрифта: очень крупный" },
  { value: "xxlarge", label: "Макс.", sample: "A+++", ariaLabel: "Размер шрифта: максимальный" },
];

const A11Y_SCHEME_OPTIONS = [
  { value: "white", label: "Белая", ariaLabel: "Цветовая схема: белый фон, черный текст" },
  { value: "black", label: "Черная", ariaLabel: "Цветовая схема: черный фон, белый текст" },
  { value: "yellow", label: "Черно-желтая", ariaLabel: "Цветовая схема: черный фон, желтый текст" },
  { value: "blue", label: "Голубая", ariaLabel: "Цветовая схема: голубой фон, темный текст" },
  { value: "beige", label: "Бежевая", ariaLabel: "Цветовая схема: бежевый фон, темный текст" },
];

const A11Y_LINE_OPTIONS = [
  { value: "normal", label: "Обычный", ariaLabel: "Интервал между словами: обычный" },
  { value: "large", label: "Увеличенный", ariaLabel: "Интервал между словами: увеличенный" },
  { value: "xlarge", label: "Большой", ariaLabel: "Интервал между словами: большой" },
];

const A11Y_LETTER_OPTIONS = [
  { value: "normal", label: "Обычный", ariaLabel: "Межбуквенный интервал: обычный" },
  { value: "large", label: "Средний", ariaLabel: "Межбуквенный интервал: средний" },
  { value: "xlarge", label: "Большой", ariaLabel: "Межбуквенный интервал: большой" },
];

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

  useEffect(() => {
    if (!a11yPanelOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setA11yPanelOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [a11yPanelOpen]);

  function updateA11ySettings(patch) {
    setA11ySettings((current) => saveAccessibilitySettings({ ...current, ...patch, enabled: true }));
  }

  function handleA11yButtonClick() {
    if (!a11ySettings.enabled) {
      setA11ySettings(enableAccessibilityMode());
      setA11yPanelOpen(true);
      return;
    }

    setA11yPanelOpen((value) => !value);
  }

  function disableA11yMode() {
    setA11ySettings(disableAccessibilityMode(a11ySettings));
    setA11yPanelOpen(false);
  }

  function resetA11ySettings() {
    setA11ySettings(enableAccessibilityMode());
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
          gap: 3px;
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
          padding: 0 7px;
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
          position: static;
          display: inline-flex;
        }

        .header-a11y-panel {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 260;
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: end;
          gap: 8px 18px;
          padding: 10px 18px 12px;
          border-top: 1px solid #bfc7d1;
          border-bottom: 2px solid #1f2937;
          background: #f2f4f7;
          color: #111827;
          box-shadow: none;
        }

        .header-a11y-panel-head {
          display: flex;
          align-items: center;
          align-content: center;
          gap: 8px;
          padding-right: 4px;
        }

        .header-a11y-panel h2,
        .a11y-section-title {
          margin: 0;
          color: inherit;
          font-weight: 900;
        }

        .header-a11y-panel h2 {
          font-size: 17px;
          line-height: 1.15;
          white-space: nowrap;
        }

        .header-a11y-panel p {
          display: none;
          margin: 0;
          color: #374151;
          font-size: 12px;
          line-height: 1.25;
          font-weight: 750;
          white-space: nowrap;
        }

        .a11y-control-section {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }

        .a11y-section-title {
          font-size: 14px;
          line-height: 1.2;
          white-space: nowrap;
        }

        .a11y-choice-list {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 4px;
        }

        .a11y-choice {
          position: relative;
          min-height: 40px !important;
          min-width: 40px !important;
          border: 1px solid #111827;
          border-radius: 4px;
          background: #ffffff;
          color: #111827;
          padding: 6px 10px !important;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          flex-wrap: nowrap;
          font: 850 clamp(16px, 1rem, 20px)/1.15 inherit !important;
          text-align: center;
          cursor: pointer;
          white-space: nowrap;
        }

        .a11y-choice:hover,
        .a11y-choice:focus-visible {
          background: #e5e7eb;
          transform: none;
        }

        .a11y-choice.is-active {
          border-width: 2px;
          box-shadow: inset 0 -3px 0 currentColor;
          outline: 2px solid #1f2937;
          outline-offset: 1px;
        }

        .a11y-choice-state {
          font-size: 0;
          line-height: 1;
        }

        .a11y-choice-state::before {
          content: "✓";
          font-size: 13px;
          font-weight: 950;
        }

        .a11y-font-sample {
          font-size: 20px;
          line-height: 1;
        }

        .a11y-font-choice {
          min-width: 48px;
        }

        .a11y-font-choice > span:not(.a11y-font-sample):not(.a11y-choice-state) {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: clip;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }

        .a11y-font-choice--xlarge .a11y-font-sample {
          font-size: 24px;
        }

        .a11y-font-choice--xxlarge .a11y-font-sample {
          font-size: 27px;
        }

        .a11y-theme-choice {
          min-width: 42px;
          width: 42px;
          padding: 4px;
        }

        .a11y-theme-swatch {
          width: 28px;
          height: 28px;
          border: 2px solid currentColor;
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 950;
          line-height: 1;
        }

        .a11y-theme-choice > span:not(.a11y-theme-swatch):not(.a11y-choice-state) {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: clip;
          clip: rect(0 0 0 0);
          white-space: nowrap;
        }

        .a11y-theme-choice--white .a11y-theme-swatch {
          background: #ffffff;
          color: #000000;
        }

        .a11y-theme-choice--black .a11y-theme-swatch {
          background: #000000;
          color: #ffffff;
        }

        .a11y-theme-choice--yellow .a11y-theme-swatch {
          background: #000000;
          color: #ffff00;
        }

        .a11y-theme-choice--blue .a11y-theme-swatch {
          background: #9dd1ff;
          color: #000000;
        }

        .a11y-theme-choice--beige .a11y-theme-swatch {
          background: #f7f3d0;
          color: #000000;
        }

        .a11y-family-choice--serif {
          font-family: Georgia, "Times New Roman", serif;
        }

        .a11y-panel-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .a11y-action {
          min-height: 40px !important;
          border: 1px solid #111827;
          border-radius: 4px;
          background: #ffffff;
          color: #111827;
          padding: 6px 12px !important;
          font: 900 clamp(16px, 1rem, 20px)/1.2 inherit !important;
          cursor: pointer;
          white-space: nowrap;
        }

        .a11y-action:hover,
        .a11y-action:focus-visible {
          background: #e5e7eb;
          transform: none;
        }

        .a11y-disable {
          border-color: #111827;
          background: #111827;
          color: #ffffff;
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

        .header-spacer.a11y-panel-open {
          height: 184px;
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
            padding: 0 5px;
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

          .header-spacer.a11y-panel-open {
            height: 380px;
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

          .header-a11y-panel {
            width: auto;
            justify-content: stretch;
            align-items: stretch;
            gap: 8px;
            padding: 10px 12px 12px;
          }

          .header-a11y-panel h2 {
            font-size: 16px;
          }

          .header-a11y-panel p {
            font-size: 12px;
            white-space: normal;
          }

          .a11y-control-section {
            align-items: flex-start;
            justify-content: space-between;
          }

          .a11y-choice-list {
            justify-content: flex-end;
          }

          .a11y-theme-choice,
          .a11y-font-choice,
          .a11y-choice {
            justify-content: center;
          }

          .a11y-panel-actions {
            justify-content: stretch;
          }

          .a11y-action {
            flex: 1 1 auto;
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

      <div className={`header-spacer${a11yPanelOpen ? " a11y-panel-open" : ""}`} />

      <header
        className={`site-header-shell${a11yPanelOpen ? " a11y-panel-open" : ""}`}
        style={{ "--header-shadow": scrolled ? "0 10px 28px rgba(15, 23, 42, 0.12)" : "0 2px 12px rgba(15, 23, 42, 0.06)" }}
      >
        <div className="site-header-inner">
          <div className="header-logo-slot">
            <Logo />
          </div>

          <div className={`header-main-area${searchOpen ? " search-mode" : ""}`}>
            <nav className="header-nav" aria-label="Главная навигация">
              {MAIN_NAV_ITEMS.map((item) => {
                const isActive = isActiveNavItem(currentPath, item.href);
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
                onClick={handleA11yButtonClick}
              >
                <EyeIcon />
              </button>
              {a11yPanelOpen && (
                <div className="header-a11y-panel" role="region" aria-labelledby="a11y-panel-title">
                  <div className="header-a11y-panel-head">
                    <h2 id="a11y-panel-title">Версия для слабовидящих</h2>
                    <p>Настройки сохраняются автоматически.</p>
                  </div>

                  <section className="a11y-control-section" aria-labelledby="a11y-font-title">
                    <h3 className="a11y-section-title" id="a11y-font-title">Размер</h3>
                    <div className="a11y-choice-list">
                      {A11Y_FONT_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`a11y-choice a11y-font-choice a11y-font-choice--${option.value}${option.value === a11ySettings.fontSize ? " is-active" : ""}`}
                          aria-label={option.ariaLabel}
                          aria-pressed={option.value === a11ySettings.fontSize}
                          onClick={() => updateA11ySettings({ fontSize: option.value })}
                        >
                          <span className="a11y-font-sample" aria-hidden="true">{option.sample}</span>
                          <span>{option.label}</span>
                          {option.value === a11ySettings.fontSize && <span className="a11y-choice-state">Выбрано</span>}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="a11y-control-section" aria-labelledby="a11y-scheme-title">
                    <h3 className="a11y-section-title" id="a11y-scheme-title">Цвет</h3>
                    <div className="a11y-choice-list">
                      {A11Y_SCHEME_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`a11y-choice a11y-theme-choice a11y-theme-choice--${option.value}${option.value === a11ySettings.scheme ? " is-active" : ""}`}
                          aria-label={option.ariaLabel}
                          aria-pressed={option.value === a11ySettings.scheme}
                          onClick={() => updateA11ySettings({ scheme: option.value })}
                        >
                          <span className="a11y-theme-swatch" aria-hidden="true">Ц</span>
                          <span>{option.label}</span>
                          {option.value === a11ySettings.scheme && <span className="a11y-choice-state">Выбрано</span>}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="a11y-control-section" aria-labelledby="a11y-images-title">
                    <h3 className="a11y-section-title" id="a11y-images-title">Изображения</h3>
                    <div className="a11y-choice-list">
                      <button
                        type="button"
                        className={`a11y-choice${!a11ySettings.hideImages ? " is-active" : ""}`}
                        aria-label="Изображения: включены"
                        aria-pressed={!a11ySettings.hideImages}
                        onClick={() => updateA11ySettings({ hideImages: false })}
                      >
                        <span>Вкл</span>
                        {!a11ySettings.hideImages && <span className="a11y-choice-state">Выбрано</span>}
                      </button>
                      <button
                        type="button"
                        className={`a11y-choice${a11ySettings.hideImages ? " is-active" : ""}`}
                        aria-label="Изображения: выключены"
                        aria-pressed={a11ySettings.hideImages}
                        onClick={() => updateA11ySettings({ hideImages: true })}
                      >
                        <span>Выкл</span>
                        {a11ySettings.hideImages && <span className="a11y-choice-state">Выбрано</span>}
                      </button>
                    </div>
                  </section>

                  <section className="a11y-control-section" aria-labelledby="a11y-line-title">
                    <h3 className="a11y-section-title" id="a11y-line-title">Интервал слов</h3>
                    <div className="a11y-choice-list">
                      {A11Y_LINE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`a11y-choice${option.value === a11ySettings.lineHeight ? " is-active" : ""}`}
                          aria-label={option.ariaLabel}
                          aria-pressed={option.value === a11ySettings.lineHeight}
                          onClick={() => updateA11ySettings({ lineHeight: option.value })}
                        >
                          <span>{option.label}</span>
                          {option.value === a11ySettings.lineHeight && <span className="a11y-choice-state">Выбрано</span>}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="a11y-control-section" aria-labelledby="a11y-letter-title">
                    <h3 className="a11y-section-title" id="a11y-letter-title">Межбуквенный интервал</h3>
                    <div className="a11y-choice-list">
                      {A11Y_LETTER_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={`a11y-choice${option.value === a11ySettings.letterSpacing ? " is-active" : ""}`}
                          aria-label={option.ariaLabel}
                          aria-pressed={option.value === a11ySettings.letterSpacing}
                          onClick={() => updateA11ySettings({ letterSpacing: option.value })}
                        >
                          <span>{option.label}</span>
                          {option.value === a11ySettings.letterSpacing && <span className="a11y-choice-state">Выбрано</span>}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="a11y-control-section" aria-labelledby="a11y-motion-title">
                    <h3 className="a11y-section-title" id="a11y-motion-title">Анимации</h3>
                    <div className="a11y-choice-list">
                      <button
                        type="button"
                        className={`a11y-choice${!a11ySettings.reduceMotion ? " is-active" : ""}`}
                        aria-label="Анимации: включены"
                        aria-pressed={!a11ySettings.reduceMotion}
                        onClick={() => updateA11ySettings({ reduceMotion: false })}
                      >
                        <span>Вкл</span>
                        {!a11ySettings.reduceMotion && <span className="a11y-choice-state">Выбрано</span>}
                      </button>
                      <button
                        type="button"
                        className={`a11y-choice${a11ySettings.reduceMotion ? " is-active" : ""}`}
                        aria-label="Анимации: выключены"
                        aria-pressed={a11ySettings.reduceMotion}
                        onClick={() => updateA11ySettings({ reduceMotion: true })}
                      >
                        <span>Выкл</span>
                        {a11ySettings.reduceMotion && <span className="a11y-choice-state">Выбрано</span>}
                      </button>
                    </div>
                  </section>

                  <div className="a11y-panel-actions">
                    <button type="button" className="a11y-action" onClick={resetA11ySettings}>Сброс</button>
                    <button type="button" className="a11y-action a11y-disable" onClick={disableA11yMode}>Обычная версия</button>
                  </div>
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
