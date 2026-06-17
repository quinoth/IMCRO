import { Link } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import Header from "../features/nav/Header.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";

const phone = "+73952481256";
const phoneLabel = "+7 (3952) 48-12-56";

const contactCards = [
  { label: "Адрес", value: "г. Иркутск, ул. Лыткина, 75А" },
  { label: "Режим работы", value: "Пн-Пт: 9:00-17:00" },
  { label: "Кабинет", value: "Приём родителей и документов, кабинет ТПМПК" },
];

const quickLinks = [
  { title: "Для родителей", href: "/tpmpk/dlya-roditeley/", text: "Подготовка к обследованию" },
  { title: "Для педагогов", href: "/tpmpk/dlya-pedagogov/", text: "Материалы для образовательных организаций" },
  { title: "Состав комиссии", href: "/tpmpk/sostav/", text: "Специалисты и направления работы" },
  { title: "Нормативные акты", href: "/tpmpk/npa/", text: "Правовая база работы комиссии" },
  { title: "FAQ", href: "/tpmpk/faq/", text: "Ответы на частые вопросы" },
  { title: "Контакты", href: "/tpmpk/kontakty/", text: "Телефон, адрес и схема обращения" },
  { title: "Документы", href: "/tpmpk/dokumenty/", text: "Перечень для прохождения комиссии" },
  { title: "Бланки", href: "/tpmpk/blanki/", text: "Заявления и формы согласий" },
  { title: "График работы", href: "/tpmpk/grafik/", text: "Расписание приёма и записи" },
];

export default function TpmpkPage({ currentUser, onGoAuth, onGoAdmin, onGoProfile }) {
  return (
    <div className="tpmpk-page">
      <style>{`
        .tpmpk-page {
          --tpmpk-primary: #19789c;
          --tpmpk-primary-dark: #004f75;
          --tpmpk-primary-soft: #edf6f8;
          --tpmpk-primary-line: #b8d4dd;
          --tpmpk-primary-shadow: rgba(25, 120, 156, 0.22);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: #0f172a;
          background:
            radial-gradient(circle at 12% 7%, rgba(25, 120, 156, 0.08), transparent 30%),
            linear-gradient(180deg, #fbfdff 0%, #f3f9fb 52%, var(--tpmpk-primary-soft) 100%);
        }

        .tpmpk-main {
          flex: 1;
        }

        .tpmpk-shell {
          width: min(1180px, calc(100% - 28px));
          margin: 0 auto;
          padding: 34px 0 72px;
        }

        .tpmpk-hero {
          border: 1px solid #dbe6f5;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.92);
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
          overflow: hidden;
        }

        .tpmpk-hero-inner {
          position: relative;
          min-height: 520px;
          padding: 34px 20px;
          display: grid;
          align-content: center;
          gap: 24px;
        }

        .tpmpk-hero-inner::after {
          content: "";
          position: absolute;
          inset: auto -90px -92px auto;
          width: min(440px, 72vw);
          height: 220px;
          border-radius: 999px;
          background: linear-gradient(125deg, rgba(25, 120, 156, 0.13), rgba(0, 79, 117, 0.1));
          transform: rotate(-8deg);
          pointer-events: none;
        }

        .tpmpk-eyebrow {
          width: fit-content;
          padding: 7px 11px;
          border-radius: 999px;
          background: var(--tpmpk-primary-soft);
          color: var(--tpmpk-primary-dark);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .tpmpk-hero-copy {
          position: relative;
          z-index: 1;
          max-width: 850px;
          display: grid;
          gap: 18px;
        }

        .tpmpk-hero h1 {
          max-width: 980px;
          color: #0f172a;
          font-size: clamp(34px, 7vw, 68px);
          line-height: 1;
          letter-spacing: 0;
        }

        .tpmpk-hero p {
          max-width: 760px;
          color: #475569;
          font-size: clamp(16px, 2.4vw, 20px);
          line-height: 1.55;
          font-weight: 650;
        }

        .tpmpk-actions {
          display: grid;
          gap: 10px;
          margin-top: 6px;
        }

        .tpmpk-primary,
        .tpmpk-phone {
          min-height: 58px;
          border-radius: 8px;
          padding: 0 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          text-decoration: none;
          font-weight: 950;
        }

        .tpmpk-primary {
          color: #fff;
          background: linear-gradient(135deg, var(--tpmpk-primary), var(--tpmpk-primary-dark));
          box-shadow: 0 18px 38px var(--tpmpk-primary-shadow);
          transition: transform 0.16s ease, box-shadow 0.16s ease;
        }

        .tpmpk-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 22px 46px rgba(25, 120, 156, 0.28);
        }

        .tpmpk-phone {
          color: var(--tpmpk-primary-dark);
          background: #fff;
          border: 1px solid var(--tpmpk-primary-line);
          font-size: 18px;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
        }

        .tpmpk-primary:focus-visible,
        .tpmpk-phone:focus-visible,
        .tpmpk-link-card:focus-visible {
          outline: 3px solid rgba(25, 120, 156, 0.2);
          outline-offset: 3px;
        }

        .tpmpk-section {
          margin-top: 26px;
        }

        .tpmpk-contact-grid,
        .tpmpk-link-grid {
          display: grid;
          gap: 12px;
        }

        .tpmpk-contact-card {
          border: 1px solid #dbe6f5;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.9);
          padding: 18px;
          min-height: 112px;
          display: grid;
          align-content: center;
          gap: 7px;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.06);
        }

        .tpmpk-contact-card span {
          color: #64748b;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .tpmpk-contact-card strong {
          color: #0f172a;
          font-size: 17px;
          line-height: 1.35;
        }

        .tpmpk-section-head {
          margin: 42px 0 16px;
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 18px;
        }

        .tpmpk-section-head h2 {
          color: #0f172a;
          font-size: clamp(26px, 4vw, 40px);
          line-height: 1.08;
          letter-spacing: 0;
        }

        .tpmpk-section-head p {
          max-width: 440px;
          color: #64748b;
          font-weight: 700;
          line-height: 1.5;
        }

        .tpmpk-link-card {
          min-height: 164px;
          border: 1px solid #dbe6f5;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.92);
          padding: 18px;
          color: inherit;
          text-decoration: none;
          display: grid;
          gap: 18px;
          align-content: space-between;
          box-shadow: 0 16px 38px rgba(15, 23, 42, 0.06);
          transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .tpmpk-link-card:hover {
          transform: translateY(-2px);
          border-color: var(--tpmpk-primary-line);
          box-shadow: 0 20px 44px rgba(25, 120, 156, 0.12);
        }

        .tpmpk-link-card h3 {
          color: #0f172a;
          font-size: 21px;
          line-height: 1.18;
          margin-bottom: 7px;
        }

        .tpmpk-link-card p {
          color: #64748b;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 700;
        }

        .tpmpk-open {
          width: fit-content;
          min-height: 38px;
          padding: 0 13px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          color: var(--tpmpk-primary-dark);
          background: var(--tpmpk-primary-soft);
          font-size: 13px;
          font-weight: 950;
        }

        @media (min-width: 720px) {
          .tpmpk-shell {
            width: min(1180px, calc(100% - 44px));
            padding-top: 46px;
          }

          .tpmpk-hero-inner {
            padding: 52px;
          }

          .tpmpk-actions {
            grid-template-columns: max-content max-content;
          }

          .tpmpk-contact-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          .tpmpk-link-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1040px) {
          .tpmpk-link-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 719px) {
          .tpmpk-section-head {
            display: grid;
            align-items: start;
          }

          .tpmpk-hero-inner {
            min-height: 590px;
          }
        }
      `}</style>

      <Header
        currentUser={currentUser}
        onGoAuth={onGoAuth}
        onGoAdmin={onGoAdmin}
        onGoProfile={onGoProfile}
      />

      <main className="tpmpk-main">
        <div className="tpmpk-shell">
          <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "ТПМПК" }]} />
          <section className="tpmpk-hero">
            <div className="tpmpk-hero-inner">
              <div className="tpmpk-hero-copy">
                <span className="tpmpk-eyebrow">ТПМПК г. Иркутска</span>
                <h1>Территориальная психолого-медико-педагогическая комиссия (ТПМПК) г. Иркутска</h1>
                <p>
                  Помогаем определить образовательный маршрут ребёнка и подобрать условия обучения с учётом его потребностей.
                </p>
                <div className="tpmpk-actions">
                  <Link className="tpmpk-primary" to="/tpmpk/zapis">
                    Записать ребёнка на обследование
                  </Link>
                  <a className="tpmpk-phone" href={`tel:${phone}`}>
                    {phoneLabel}
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="tpmpk-section" aria-label="Контактная информация">
            <div className="tpmpk-contact-grid">
              {contactCards.map((item) => (
                <article className="tpmpk-contact-card" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
          </section>

          <section className="tpmpk-section">
            <div className="tpmpk-section-head">
              <h2>Разделы ТПМПК</h2>
              <p>Короткие пути к документам, бланкам, контактам и материалам для родителей и педагогов.</p>
            </div>

            <div className="tpmpk-link-grid">
              {quickLinks.map((item) => (
                <Link className="tpmpk-link-card" key={item.title} to={item.href}>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                  <span className="tpmpk-open">
                    Открыть <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
