import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { canAccessAdmin, canAccessDomuAdmin, canAccessTpmpkAdmin, getRoleLabel } from "../auth.js";

const MOCK_USER = {
  id: 1,
  firstName: "Ирина",
  lastName: "Абрамова",
  middleName: "Владимировна",
  username: "abramova_iv",
  email: "abramova@mc.eduirk.ru",
  phone: "+7 (3952) 20-19-85",
  position: "Методист",
  organization: "МКУ развития образования города Иркутска",
  qualification: "Высшая категория",
  workExperience: 14,
  birthDate: "1985-04-20",
  created_at: "2024-09-01T00:00:00",
  role: { role_name: "methodist" },
  nextAttestationDate: "2026-11-01",
  subjects: ["Дополнительное образование", "Методическая работа"],
  certificates: [
    { id: 1, title: "Школьный театр как ресурс воспитания", issuer: "ИРО Иркутской области", hours: 36, date: "2025-11-14" },
    { id: 2, title: "Цифровые инструменты педагога", issuer: "МКУ РОИ", hours: 72, date: "2025-04-20" },
    { id: 3, title: "ФГОС: обновлённые требования", issuer: "Рос. акад. образования", hours: 108, date: "2024-12-05" },
  ],
  achievements: [
    { id: 1, title: "Победитель конкурса «Лучший методист года»", level: "Муниципальный", year: 2025 },
    { id: 2, title: "Участник конкурса «Педагог года Иркутской области»", level: "Региональный", year: 2024 },
    { id: 3, title: "Почётная грамота Министерства просвещения РФ", level: "Федеральный", year: 2023 },
  ],
};

const LEVEL_COLORS = {
  Муниципальный: { bg: "rgba(31, 80, 115, 0.08)", color: "#1F5073" },
  Региональный: { bg: "rgba(31, 80, 115, 0.08)", color: "#1F5073" },
  Федеральный: { bg: "rgba(31, 80, 115, 0.08)", color: "#1F5073" },
};

const TABS = [
  { id: "overview", label: "Обзор", icon: "user" },
  { id: "articles", label: "Мои статьи", icon: "edit" },
  { id: "certificates", label: "Курсы", icon: "graduation" },
  { id: "achievements", label: "Достижения", icon: "award" },
  { id: "admin", label: "Администрирование", icon: "shield" },
  { id: "settings", label: "Настройки", icon: "settings" },
];

function Icon({ name, size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.9",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    arrowLeft: <path d="M15 18l-6-6 6-6" />,
    home: <><path d="m3 10.5 9-7 9 7" /><path d="M5 9.5V20h14V9.5" /><path d="M9 20v-6h6v6" /></>,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 3v18" /></>,
    user: <><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></>,
    graduation: <><path d="m22 10-10-5-10 5 10 5 10-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></>,
    award: <><circle cx="12" cy="8" r="5" /><path d="M8.5 12.5 7 22l5-3 5 3-1.5-9.5" /></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 0 1-4 0v-.09a1.7 1.7 0 0 0-1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 0 1 0-4h.09a1.7 1.7 0 0 0 1.55-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 0 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.28.6.88 1 1.55 1H21a2 2 0 0 1 0 4h-.09c-.67 0-1.27.4-1.55 1Z" /></>,
    mail: <><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.77.59 2.61a2 2 0 0 1-.45 2.11L8 9.7a16 16 0 0 0 6.3 6.3l1.26-1.24a2 2 0 0 1 2.11-.45c.84.27 1.72.47 2.61.59A2 2 0 0 1 22 16.9Z" />,
    calendar: <><path d="M8 2v4" /><path d="M16 2v4" /><path d="M3 10h18" /><rect x="3" y="4" width="18" height="18" rx="3" /></>,
    briefcase: <><path d="M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1" /><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 12h18" /></>,
    building: <><path d="M4 22V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v18" /><path d="M9 22v-4h3v4" /><path d="M8 6h1" /><path d="M12 6h1" /><path d="M8 10h1" /><path d="M12 10h1" /><path d="M8 14h1" /><path d="M12 14h1" /><path d="M17 9h1a2 2 0 0 1 2 2v11" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H21" /><path d="M4 4v15.5A2.5 2.5 0 0 1 6.5 22H21V6a2 2 0 0 0-2-2H6.5A2.5 2.5 0 0 0 4 6.5" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="m9 12 2 2 4-5" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
  };

  return <svg {...common}>{paths[name] || paths.user}</svg>;
}

function Avatar({ user, size = 88, compact = false }) {
  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`;
  return (
    <div className={compact ? "profile-avatar profile-avatar--compact" : "profile-avatar"} style={{ "--avatar-size": `${size}px` }}>
      {initials || "?"}
    </div>
  );
}

function Card({ children, title, icon, action, className = "" }) {
  return (
    <section className={`profile-card ${className}`}>
      {(title || action) && (
        <div className="profile-card__head">
          <div>
            {title && (
              <h2>
                {icon && <span className="profile-card__icon"><Icon name={icon} size={18} /></span>}
                {title}
              </h2>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Tag({ children, tone = "blue" }) {
  return <span className={`profile-tag profile-tag--${tone}`}>{children}</span>;
}

function InfoTile({ icon, label, value, wide = false }) {
  if (!value && value !== 0) return null;
  return (
    <div className={`info-tile ${wide ? "info-tile--wide" : ""}`}>
      <div className="info-tile__icon"><Icon name={icon} size={18} /></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div className="empty-state">
      <span><Icon name={icon} size={34} /></span>
      <p>{text}</p>
    </div>
  );
}

export default function ProfilePage({ user = MOCK_USER, onBack, onAdmin, onTpmpkAdmin, onLogout, userArticles = [] }) {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [editMode, setEditMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    username: user.username || "",
    phone: user.phone || "",
    position: user.position || "",
    organization: user.organization || "",
  });

  const roleName = typeof user.role === "object"
    ? user.role?.role_name
    : user.role || (user.role_id === 1 ? "admin" : user.role_id === 2 ? "methodist" : "user");
  const isUser = roleName === "user";
  const isMethodist = roleName === "methodist";
  const isAdmin = roleName === "admin";
  const isDomuEditor = roleName === "domu_editor";
  const hasAdminAccess = canAccessAdmin({ role: roleName }) || canAccessDomuAdmin({ role: roleName });
  const hasTpmpkAccess = canAccessTpmpkAdmin({ role: roleName });
  const accessDenied = new URLSearchParams(location.search).get("access") === "denied";
  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === "articles") return isMethodist || isAdmin;
    if (tab.id === "admin") return isAdmin || isDomuEditor;
    return true;
  });

  const daysLeft = user.nextAttestationDate
    ? Math.floor((new Date(user.nextAttestationDate) - new Date()) / 86400000)
    : null;

  const attestationProgress = useMemo(() => {
    if (daysLeft === null) return 0;
    const totalWindow = 5 * 365;
    return Math.max(8, Math.min(100, Math.round(((totalWindow - daysLeft) / totalWindow) * 100)));
  }, [daysLeft]);

  const totalHours = (user.certificates || []).reduce((sum, certificate) => sum + (certificate.hours || 0), 0);

  const handleSave = () => {
    setSaved(true);
    setEditMode(false);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="profile-page">
      <style>{`
        .profile-page {
          --profile-bg: var(--imcro-color-bg, #477799);
          --profile-primary: var(--imcro-color-primary, #1F5073);
          --profile-surface: var(--imcro-color-surface, #FFFFFF);
          --profile-text: var(--imcro-color-text, #1a1c1c);
          --profile-muted: var(--imcro-color-text-muted, #42474e);
          --profile-border: var(--imcro-color-border, rgba(31, 80, 115, 0.16));
          --profile-soft: rgba(31, 80, 115, 0.08);
          --profile-shadow: var(--imcro-shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08));
          min-height: 100vh;
          color: var(--profile-text);
          font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: var(--profile-bg);
        }
        .profile-shell { width: min(1180px, calc(100% - 40px)); margin: 0 auto; }
        .profile-topbar {
          position: sticky; top: 0; z-index: 20;
          border-bottom: 1px solid rgba(226, 232, 240, 0.9);
          background: rgba(255, 255, 255, 0.82);
          backdrop-filter: blur(18px);
        }
        .profile-topbar__inner {
          height: 64px; display: flex; align-items: center; gap: 14px;
        }
        .profile-brand {
          display: flex; align-items: center; gap: 10px; font-weight: 800; color: var(--profile-primary);
          letter-spacing: -0.02em;
        }
        .profile-logo {
          width: 34px; height: 34px; border-radius: 12px;
          display: grid; place-items: center; color: white; font-weight: 800;
          background: var(--profile-primary);
          box-shadow: 0 12px 30px rgba(31, 80, 115, 0.24);
        }
        .topbar-spacer { flex: 1; }
        .profile-btn {
          border: 0; border-radius: 14px; min-height: 38px; padding: 0 16px;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          font: inherit; font-size: 13px; font-weight: 800; cursor: pointer;
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
        }
        .profile-btn:hover { transform: translateY(-1px); }
        .profile-btn:focus-visible, .ptab:focus-visible, .pinput:focus-visible {
          outline: 3px solid rgba(31, 80, 115, 0.24);
          outline-offset: 3px;
        }
        .profile-btn--ghost {
          color: var(--profile-primary); background: #fff; border: 1px solid rgba(31, 80, 115, 0.18);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.04);
        }
        .profile-btn--primary {
          color: #fff; background: var(--profile-primary);
          box-shadow: 0 16px 34px rgba(31, 80, 115, 0.22);
        }
        .profile-btn--danger {
          color: #B91C1C; background: #fff; border: 1px solid rgba(248, 113, 113, 0.4);
        }
        .profile-btn--small { min-height: 34px; border-radius: 12px; padding: 0 13px; font-size: 12px; }
        .saved-pill {
          color: var(--profile-primary); background: var(--profile-soft); border: 1px solid rgba(31, 80, 115, 0.16);
          padding: 8px 12px; border-radius: 999px; font-size: 12px; font-weight: 800;
        }
        .profile-hero { padding: 30px 0 24px; }
        .profile-hero__card {
          position: relative; overflow: hidden;
          display: grid; grid-template-columns: auto 1fr auto; gap: 26px; align-items: center;
          min-height: 220px; padding: 34px;
          border: 1px solid rgba(255,255,255,0.78); border-radius: 32px;
          background:
            radial-gradient(circle at 70% 35%, rgba(255,255,255,0.22), transparent 18rem),
            var(--profile-primary);
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.18);
        }
        .profile-hero__card::before {
          content: ""; position: absolute; inset: 16px; border-radius: 26px;
          border: 1px solid rgba(255,255,255,0.14); pointer-events: none;
        }
        .profile-hero__card::after {
          content: ""; position: absolute; right: -90px; top: -120px; width: 360px; height: 360px;
          background: radial-gradient(circle, rgba(255,255,255,0.24), transparent 62%);
        }
        .profile-hero__main, .profile-hero__actions, .profile-avatar { position: relative; z-index: 1; }
        .profile-avatar {
          width: var(--avatar-size); height: var(--avatar-size); border-radius: 28px;
          display: grid; place-items: center;
          color: #fff; font-size: calc(var(--avatar-size) * .28); font-weight: 800;
          background: linear-gradient(145deg, rgba(255,255,255,0.24), rgba(255,255,255,0.08));
          border: 1px solid rgba(255,255,255,0.36);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.35), 0 20px 48px rgba(5, 14, 36, 0.24);
        }
        .profile-avatar--compact {
          border-radius: 13px;
          background: var(--profile-primary);
          border: 0; box-shadow: none; font-size: 12px;
        }
        .profile-kicker {
          display: inline-flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.76);
          font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em;
        }
        .profile-kicker::before {
          content: ""; width: 8px; height: 8px; border-radius: 99px; background: var(--profile-surface);
          box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.18);
        }
        .profile-hero h1 {
          margin: 10px 0 8px; max-width: 720px;
          color: #fff; font-size: clamp(28px, 4vw, 46px); line-height: 1.03; letter-spacing: 0;
        }
        .profile-subtitle { color: rgba(255,255,255,0.78); font-size: 15px; font-weight: 600; }
        .profile-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 18px; }
        .profile-tag {
          display: inline-flex; align-items: center; min-height: 30px; padding: 0 12px; border-radius: 999px;
          font-size: 12px; font-weight: 800; border: 1px solid transparent;
        }
        .profile-tag--hero { color: #fff; background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.2); }
        .profile-tag--blue { color: var(--profile-primary); background: var(--profile-soft); border-color: var(--profile-border); }
        .profile-tag--primary { color: var(--profile-primary); background: var(--profile-soft); border-color: var(--profile-border); }
        .profile-tag--green { color: var(--profile-primary); background: var(--profile-soft); border-color: var(--profile-border); }
        .profile-tag--gray { color: #475569; background: var(--profile-soft); border-color: var(--profile-border); }
        .profile-hero__actions { display: flex; flex-direction: column; gap: 12px; align-items: flex-end; }
        .hero-mini-card {
          min-width: 180px; padding: 14px 16px; border-radius: 20px; color: #fff;
          background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
          backdrop-filter: blur(12px);
        }
        .hero-mini-card span { display: block; color: rgba(255,255,255,0.7); font-size: 12px; font-weight: 700; }
        .hero-mini-card strong { display: block; margin-top: 3px; font-size: 22px; letter-spacing: -0.03em; }
        .profile-layout {
          display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 22px; align-items: start;
          padding-bottom: 52px;
        }
        .profile-sidebar { display: grid; gap: 16px; position: sticky; top: 84px; min-width: 0; }
        .profile-card {
          background: var(--profile-surface); border: 1px solid var(--profile-border); border-radius: 26px;
          min-width: 0; padding: 22px; box-shadow: var(--profile-shadow);
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .profile-access-alert {
          margin-top: 16px;
          padding: 14px 16px;
          border: 1px solid #fecaca;
          border-radius: 8px;
          background: #fff7f7;
          color: #991b1b;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.45;
        }
        .profile-card:hover { transform: translateY(-2px); box-shadow: 0 26px 70px rgba(15,23,42,0.1); border-color: rgba(31,80,115,0.16); }
        .profile-card__head {
          display: flex; justify-content: space-between; gap: 16px; align-items: center; margin-bottom: 18px;
        }
        .profile-card h2 {
          margin: 0; display: flex; align-items: center; gap: 10px;
          font-size: 18px; line-height: 1.2; letter-spacing: -0.02em;
        }
        .profile-card__icon {
          width: 36px; height: 36px; border-radius: 14px; display: grid; place-items: center;
          color: var(--profile-primary); background: var(--profile-soft);
        }
        .ptabs-col { display: grid; gap: 6px; width: 100%; max-width: 100%; }
        .ptab {
          width: 100%; border: 0; border-radius: 16px; padding: 12px 13px;
          display: flex; align-items: center; gap: 11px;
          background: transparent; color: var(--profile-muted); font: inherit; font-size: 14px; font-weight: 800;
          text-align: left; cursor: pointer; transition: background .18s ease, color .18s ease, transform .18s ease;
        }
        .ptab:hover { color: var(--profile-primary); background: var(--profile-soft); transform: translateX(2px); }
        .ptab.active {
          color: var(--profile-primary); background: var(--profile-soft);
          box-shadow: inset 3px 0 0 var(--profile-primary);
        }
        .ptab span {
          width: 34px; height: 34px; border-radius: 13px; display: grid; place-items: center;
          background: var(--profile-soft); color: currentColor;
        }
        .profile-content { display: grid; gap: 18px; min-width: 0; }
        .attestation-card {
          background: var(--profile-surface);
        }
        .eyebrow {
          color: var(--profile-muted); font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em;
        }
        .attestation-date { margin-top: 8px; font-size: 18px; font-weight: 800; color: var(--profile-primary); letter-spacing: -0.02em; }
        .attestation-note {
          margin-top: 10px; display: inline-flex; gap: 6px; align-items: baseline; padding: 8px 10px; border-radius: 14px;
          color: var(--profile-primary); background: var(--profile-soft); font-size: 12px; font-weight: 700;
        }
        .attestation-note strong { font-size: 14px; }
        .progress {
          height: 9px; border-radius: 999px; overflow: hidden; margin-top: 15px;
          background: rgba(31, 80, 115, 0.12);
        }
        .progress span {
          display: block; height: 100%; border-radius: inherit;
          background: var(--profile-primary);
        }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
        .stat-card {
          padding: 18px; border-radius: 22px; border: 1px solid rgba(226,232,240,.86);
          background: #fff; box-shadow: 0 14px 38px rgba(15,23,42,.05);
        }
        .stat-card span { color: var(--profile-muted); font-size: 12px; font-weight: 800; }
        .stat-card strong { display: block; margin-top: 8px; color: var(--profile-primary); font-size: 30px; line-height: 1; letter-spacing: -0.05em; }
        .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .info-tile {
          display: grid; grid-template-columns: 42px 1fr; gap: 12px; align-items: center;
          min-height: 82px; padding: 14px; border-radius: 20px;
          background: var(--profile-surface); border: 1px solid rgba(226,232,240,.9);
        }
        .info-tile--wide { grid-column: 1 / -1; }
        .info-tile__icon {
          width: 42px; height: 42px; border-radius: 16px; display: grid; place-items: center;
          color: var(--profile-primary); background: var(--profile-soft);
        }
        .info-tile span { display: block; color: var(--profile-muted); font-size: 12px; font-weight: 800; }
        .info-tile strong {
          display: block; margin-top: 4px; color: var(--profile-text); font-size: 14px; line-height: 1.35; word-break: break-word;
        }
        .pinput {
          width: 100%; min-height: 46px; padding: 0 14px; border-radius: 15px; border: 1px solid var(--profile-border);
          background: var(--profile-soft); color: var(--profile-text); font: inherit; font-size: 14px; font-weight: 700;
          transition: background .18s ease, border-color .18s ease, box-shadow .18s ease;
        }
        .pinput:focus { background: #fff; border-color: var(--profile-primary); box-shadow: 0 0 0 4px rgba(31,80,115,.18); outline: none; }
        .form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .form-field label {
          display: block; margin-bottom: 7px; color: var(--profile-muted); font-size: 11px; font-weight: 800;
          text-transform: uppercase; letter-spacing: .09em;
        }
        .form-field--wide { grid-column: 1 / -1; }
        .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
        .subjects-cloud { display: flex; flex-wrap: wrap; gap: 10px; }
        .subject-chip {
          display: inline-flex; align-items: center; gap: 8px; min-height: 40px; padding: 0 15px; border-radius: 999px;
          color: var(--profile-primary); background: var(--profile-soft);
          border: 1px solid rgba(31,80,115,.12); font-size: 13px; font-weight: 800;
        }
        .subject-chip::before { content: ""; width: 8px; height: 8px; border-radius: 99px; background: var(--profile-primary); }
        .list-stack { display: grid; gap: 12px; }
        .list-item {
          display: grid; grid-template-columns: 48px 1fr auto; gap: 14px; align-items: center;
          padding: 14px; border-radius: 20px; border: 1px solid rgba(226,232,240,.86);
          background: var(--profile-surface);
        }
        .list-icon {
          width: 48px; height: 48px; border-radius: 17px; display: grid; place-items: center;
          color: var(--profile-primary); background: var(--profile-soft);
        }
        .list-item h3 { margin: 0 0 5px; color: var(--profile-text); font-size: 14px; line-height: 1.3; }
        .list-item p { margin: 0; color: var(--profile-muted); font-size: 13px; font-weight: 600; }
        .list-meta { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 10px; }
        .empty-state {
          display: grid; place-items: center; text-align: center; gap: 12px; min-height: 190px;
          color: var(--profile-muted); border: 1px dashed var(--profile-border); border-radius: 22px; background: var(--profile-soft);
        }
        .empty-state span {
          width: 64px; height: 64px; border-radius: 22px; display: grid; place-items: center;
          color: var(--profile-primary); background: var(--profile-soft);
        }
        .empty-state p { margin: 0; font-size: 14px; font-weight: 700; }
        .security-note {
          margin: 12px 0 0; color: var(--profile-muted); font-size: 12px; line-height: 1.6;
        }
        code { color: var(--profile-primary); font-weight: 800; }
        @media (max-width: 960px) {
          .profile-hero__card { grid-template-columns: auto 1fr; }
          .profile-hero__actions { grid-column: 1 / -1; align-items: stretch; flex-direction: row; }
          .hero-mini-card { min-width: 0; flex: 1; }
          .profile-layout { grid-template-columns: 1fr; }
          .profile-sidebar { position: static; }
          .ptabs-col { grid-template-columns: repeat(5, minmax(140px, 1fr)); overflow-x: auto; padding-bottom: 3px; }
        }
        @media (max-width: 680px) {
          .profile-shell { width: min(100% - 24px, 1180px); }
          .profile-topbar__inner { height: auto; min-height: 64px; padding: 10px 0; flex-wrap: wrap; }
          .profile-brand { order: -1; width: 100%; }
          .profile-hero { padding-top: 18px; }
          .profile-hero__card { grid-template-columns: 1fr; padding: 24px; border-radius: 26px; }
          .profile-avatar { border-radius: 24px; }
          .profile-hero h1 { font-size: 30px; }
          .profile-hero__actions { flex-direction: column; }
          .profile-card { padding: 18px; border-radius: 22px; }
          .stats-grid, .info-grid, .form-grid { grid-template-columns: 1fr; }
          .info-tile--wide, .form-field--wide { grid-column: auto; }
          .list-item { grid-template-columns: 44px 1fr; }
          .list-item .profile-btn { grid-column: 1 / -1; }
          .ptabs-col { grid-template-columns: repeat(5, minmax(132px, 1fr)); }
        }
      `}</style>

      <header className="profile-topbar">
        <div className="profile-shell profile-topbar__inner">
          <button className="profile-btn profile-btn--ghost" onClick={onBack}>
            <Icon name="arrowLeft" size={17} />
            На главную
          </button>
          <div className="profile-brand">
            <span className="profile-logo">ИМ</span>
            <span>Личный кабинет</span>
          </div>
          <div className="topbar-spacer" />
          {saved && <span className="saved-pill">Сохранено</span>}
          {hasTpmpkAccess && onTpmpkAdmin && (
            <button className="profile-btn profile-btn--primary" onClick={onTpmpkAdmin}>
              Кабинет ТПМПК
            </button>
          )}
          {hasAdminAccess && onAdmin && (
            <button className="profile-btn profile-btn--primary" onClick={onAdmin}>
              Админ-панель
            </button>
          )}
          <Avatar user={user} size={34} compact />
          {onLogout && (
            <button className="profile-btn profile-btn--danger" onClick={onLogout}>
              <Icon name="logout" size={16} />
              Выйти
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="profile-hero">
          <div className="profile-shell">
            <div className="profile-hero__card">
              <Avatar user={user} size={118} />
              <div className="profile-hero__main">
                <span className="profile-kicker">{hasTpmpkAccess ? "Рабочий центр психолога ТПМПК" : "Рабочий центр методиста"}</span>
                <h1>{user.lastName} {user.firstName} {user.middleName}</h1>
                <div className="profile-subtitle">
                  {form.position || user.position} · @{form.username || user.username} · {user.email}
                </div>
                <div className="profile-tags">
                  <Tag tone="hero">{getRoleLabel(roleName)}</Tag>
                  {user.qualification && <Tag tone="hero">{user.qualification}</Tag>}
                  <Tag tone="hero">На сайте с {new Date(user.created_at).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</Tag>
                </div>
              </div>
              <div className="profile-hero__actions">
                <div className="hero-mini-card">
                  <span>Обучение</span>
                    <strong>{isAdmin ? "Admin" : `${totalHours} ч.`}</strong>
                </div>
                <button className="profile-btn profile-btn--primary" onClick={() => setEditMode(true)}>
                  <Icon name="edit" size={17} />
                  Редактировать профиль
                </button>
                {hasTpmpkAccess && onTpmpkAdmin && (
                  <button className="profile-btn profile-btn--ghost" onClick={onTpmpkAdmin}>
                    Кабинет ТПМПК
                  </button>
                )}
                {hasAdminAccess && onAdmin && (
                  <button className="profile-btn profile-btn--ghost" onClick={onAdmin}>
                    Админ-панель
                  </button>
                )}
              </div>
            </div>
            {accessDenied && (
              <div className="profile-access-alert" role="alert">
                Доступ к закрытому разделу запрещен для текущей роли.
              </div>
            )}
          </div>
        </section>

        <div className="profile-shell profile-layout">
          <aside className="profile-sidebar">
            <Card>
              <div className="ptabs-col">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`ptab${activeTab === tab.id ? " active" : ""}`}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span><Icon name={tab.icon} size={18} /></span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </Card>

            {isMethodist && daysLeft !== null && (
              <Card className="attestation-card">
                <div className="eyebrow">Аттестация</div>
                <div className="attestation-date">
                  {new Date(user.nextAttestationDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                <div className="attestation-note">
                  <strong>{daysLeft > 0 ? `${Math.ceil(daysLeft / 30)} мес.` : "Просрочена"}</strong>
                  <span>до истечения</span>
                </div>
                <div className="progress" aria-label="Прогресс аттестационного периода">
                  <span style={{ width: `${attestationProgress}%` }} />
                </div>
              </Card>
            )}
          </aside>

          <div className="profile-content">
            {activeTab === "overview" && (
              <>
                <div className="stats-grid">
                  <div className="stat-card">
                    <span>Курсов пройдено</span>
                    <strong>{(user.certificates || []).length}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Достижений</span>
                    <strong>{(user.achievements || []).length}</strong>
                  </div>
                  <div className="stat-card">
                    <span>Часов обучения</span>
                    <strong>{totalHours}</strong>
                  </div>
                </div>

                <Card
                  title="Данные аккаунта"
                  icon="shield"
                  action={
                    <button className="profile-btn profile-btn--ghost profile-btn--small" onClick={() => setEditMode((value) => !value)}>
                      <Icon name="edit" size={15} />
                      {editMode ? "Отмена" : "Изменить"}
                    </button>
                  }
                >
                  {editMode ? (
                    <>
                      <div className="form-grid">
                        {[
                          { label: "Username", key: "username" },
                          { label: "Телефон", key: "phone" },
                          { label: "Должность", key: "position" },
                          { label: "Организация", key: "organization", wide: true },
                        ].map((field) => (
                          <div className={`form-field ${field.wide ? "form-field--wide" : ""}`} key={field.key}>
                            <label>{field.label}</label>
                            <input
                              className="pinput"
                              value={form[field.key]}
                              onChange={(event) => setForm((value) => ({ ...value, [field.key]: event.target.value }))}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="form-actions">
                        <button className="profile-btn profile-btn--ghost" onClick={() => setEditMode(false)}>Отмена</button>
                        <button className="profile-btn profile-btn--primary" onClick={handleSave}>Сохранить изменения</button>
                      </div>
                    </>
                  ) : (
                    <div className="info-grid">
                      <InfoTile icon="mail" label="Email" value={user.email} />
                      <InfoTile icon="user" label="Username" value={`@${form.username}`} />
                      <InfoTile icon="shield" label="Роль" value={getRoleLabel(roleName)} />
                      <InfoTile icon="calendar" label="Регистрация" value={new Date(user.created_at).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })} />
                      <InfoTile icon="phone" label="Телефон" value={form.phone} />
                      <InfoTile icon="calendar" label="Дата рождения" value={user.birthDate ? new Date(user.birthDate).toLocaleDateString("ru-RU") : null} />
                      <InfoTile icon="briefcase" label="Должность" value={form.position} />
                      <InfoTile icon="award" label="Квалификация" value={user.qualification} />
                      <InfoTile icon="building" label="Организация" value={form.organization} wide />
                    </div>
                  )}
                </Card>

                {user.subjects?.length > 0 && (
                  <Card title="Предметы и направления" icon="book">
                    <div className="subjects-cloud">
                      {user.subjects.map((subject) => <span className="subject-chip" key={subject}>{subject}</span>)}
                    </div>
                  </Card>
                )}

                {isUser && (
                  <Card title="Персональная траектория" icon="graduation">
                    <div className="info-grid">
                      <InfoTile icon="book" label="Доступный формат" value="Курсы, мероприятия и материалы ИМЦРО" />
                      <InfoTile icon="award" label="Статус" value="Участник образовательного сообщества" />
                    </div>
                  </Card>
                )}

                {isAdmin && (
                  <Card
                    title="Администрирование платформы"
                    icon="shield"
                    action={onAdmin && (
                      <button className="profile-btn profile-btn--primary profile-btn--small" onClick={onAdmin}>
                        Открыть админку
                      </button>
                    )}
                  >
                    <div className="info-grid">
                      <InfoTile icon="shield" label="Уровень доступа" value="Полное управление контентом и разделами" />
                      <InfoTile icon="edit" label="Рабочая зона" value="Новости, статьи, сертификаты и настройки сайта" />
                      <InfoTile icon="building" label="Организация" value={form.organization} wide />
                    </div>
                  </Card>
                )}
              </>
            )}

            {activeTab === "articles" && (isMethodist || isAdmin) && (
              <Card title="Мои статьи" icon="edit">
                {userArticles.length === 0 ? (
                  <EmptyState icon="edit" text="Статей пока нет" />
                ) : (
                  <div className="list-stack">
                    {userArticles.map((article) => {
                      const statusMap = {
                        published: { tone: "green", label: "Опубликована" },
                        draft: { tone: "primary", label: "Черновик" },
                        archive: { tone: "gray", label: "Архив" },
                      };
                      const status = statusMap[article.status?.name || article.status] || statusMap.archive;
                      return (
                        <article className="list-item" key={article.id}>
                          <div className="list-icon"><Icon name="edit" /></div>
                          <div>
                            <h3>{article.title}</h3>
                            <p>/{article.slug} · обновлено {(article.updated_at || article.updatedAt || "").slice(0, 10)}</p>
                          </div>
                          <Tag tone={status.tone}>{status.label}</Tag>
                        </article>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {activeTab === "admin" && (isAdmin || isDomuEditor) && (
              <Card
                title="Быстрый доступ администратора"
                icon="shield"
                action={onAdmin && (
                  <button className="profile-btn profile-btn--primary profile-btn--small" onClick={onAdmin}>
                    Перейти в /admin
                  </button>
                )}
              >
                <div className="list-stack">
                  <article className="list-item">
                    <div className="list-icon"><Icon name="edit" /></div>
                    <div>
                      <h3>Управление публикациями</h3>
                      <p>Создание, редактирование и публикация материалов сайта.</p>
                    </div>
                    <Tag tone="blue">Доступно</Tag>
                  </article>
                  <article className="list-item">
                    <div className="list-icon"><Icon name="shield" /></div>
                    <div>
                      <h3>Системные разделы</h3>
                      <p>Административные функции доступны только ролям methodist и admin.</p>
                    </div>
                    <Tag tone="green">Защищено</Tag>
                  </article>
                </div>
              </Card>
            )}

            {activeTab === "certificates" && (
              <Card title="Курсы повышения квалификации" icon="graduation">
                {(user.certificates || []).length === 0 ? (
                  <EmptyState icon="graduation" text="Курсов пока нет" />
                ) : (
                  <div className="list-stack">
                    {(user.certificates || []).map((certificate) => (
                      <article className="list-item" key={certificate.id}>
                        <div className="list-icon"><Icon name="graduation" /></div>
                        <div>
                          <h3>{certificate.title}</h3>
                          <p>{certificate.issuer}</p>
                          <div className="list-meta">
                            <Tag tone="blue">{certificate.hours} часов</Tag>
                            <Tag tone="gray">{new Date(certificate.date).toLocaleDateString("ru-RU", { month: "long", year: "numeric" })}</Tag>
                          </div>
                        </div>
                        <button className="profile-btn profile-btn--ghost profile-btn--small">
                          <Icon name="download" size={15} />
                          Скачать
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {activeTab === "achievements" && (
              <Card title="Конкурсы и достижения" icon="award">
                {(user.achievements || []).length === 0 ? (
                  <EmptyState icon="award" text="Достижений пока нет" />
                ) : (
                  <div className="list-stack">
                    {(user.achievements || []).map((achievement) => {
                      const colors = LEVEL_COLORS[achievement.level] || { bg: "var(--profile-soft)", color: "#475569" };
                      return (
                        <article className="list-item" key={achievement.id}>
                          <div className="list-icon"><Icon name="award" /></div>
                          <div>
                            <h3>{achievement.title}</h3>
                            <div className="list-meta">
                              <span className="profile-tag" style={{ background: colors.bg, color: colors.color, borderColor: colors.bg }}>
                                {achievement.level}
                              </span>
                              <Tag tone="gray">{achievement.year}</Tag>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </Card>
            )}

            {activeTab === "settings" && (
              <Card title="Безопасность" icon="settings">
                <div className="form-grid">
                  {["Текущий пароль", "Новый пароль", "Повторите новый пароль"].map((label, index) => (
                    <div className={`form-field ${index === 2 ? "form-field--wide" : ""}`} key={label}>
                      <label>{label}</label>
                      <input type="password" className="pinput" placeholder="••••••••" />
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button className="profile-btn profile-btn--primary">Сохранить пароль</button>
                </div>
                <p className="security-note">
                  Поле <code>password_hash</code> в таблице <code>users</code> обновляется через хеширование bcrypt на сервере.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
