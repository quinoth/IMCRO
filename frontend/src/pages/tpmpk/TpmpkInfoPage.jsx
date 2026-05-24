import { useEffect } from "react";
import { Link } from "react-router-dom";
import Footer from "../../components/Footer.jsx";
import Header from "../../features/nav/Header.jsx";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import { getTpmpkPage } from "./tpmpkPagesData.js";

function Seo({ title, description }) {
  useEffect(() => {
    document.title = `${title} | ТПМПК г. Иркутска`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [title, description]);

  return null;
}

function Section({ section }) {
  if (section.type === "table") {
    return (
      <section className="ti-card">
        <h2>{section.title}</h2>
        <div className="ti-table" role="table">
          <div className="ti-table-row ti-table-head" role="row">
            {section.columns.map((column) => <span role="columnheader" key={column}>{column}</span>)}
          </div>
          {section.rows.map((row) => (
            <div className="ti-table-row" role="row" key={row.join("-")}>
              {row.map((cell) => <span role="cell" key={cell}>{cell}</span>)}
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "faq") {
    return (
      <section className="ti-card">
        <h2>{section.title}</h2>
        <div className="ti-faq-list">
          {section.items.map((item) => (
            <details className="ti-faq" key={item.title}>
              <summary>{item.title}</summary>
              <p>{item.text}</p>
            </details>
          ))}
        </div>
      </section>
    );
  }

  if (section.type === "checklist") {
    return (
      <section className="ti-card">
        <h2>{section.title}</h2>
        <ul className="ti-check-list">
          {section.items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    );
  }

  return (
    <section className="ti-card">
      <h2>{section.title}</h2>
      <div className="ti-grid">
        {section.items.map((item) => (
          <article className="ti-mini-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function TpmpkInfoPage({ slug, currentUser, onGoAuth, onGoAdmin, onGoProfile }) {
  const page = getTpmpkPage(slug);

  if (!page) return null;

  return (
    <div className="ti-page">
      <Seo title={page.title} description={page.meta} />
      <style>{`
        .ti-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: #0f172a;
          background:
            radial-gradient(circle at 14% 8%, rgba(124, 58, 237, 0.07), transparent 28%),
            linear-gradient(180deg, #fbfdff 0%, #f3f7fc 54%, #eef4fb 100%);
        }

        .ti-main {
          flex: 1;
        }

        .ti-shell {
          width: min(1120px, calc(100% - 28px));
          margin: 0 auto;
          padding: 30px 0 70px;
        }

        .ti-hero,
        .ti-card {
          border: 1px solid #dbe6f5;
          border-radius: 8px;
          background: rgba(255,255,255,0.94);
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.07);
        }

        .ti-hero {
          position: relative;
          overflow: hidden;
          padding: 28px 18px;
          display: grid;
          gap: 16px;
        }

        .ti-hero::after {
          content: "";
          position: absolute;
          inset: auto -90px -80px auto;
          width: min(360px, 74vw);
          height: 180px;
          border-radius: 999px;
          background: linear-gradient(125deg, rgba(30, 58, 138, 0.1), rgba(124, 58, 237, 0.12));
          transform: rotate(-8deg);
          pointer-events: none;
        }

        .ti-eyebrow {
          position: relative;
          z-index: 1;
          width: fit-content;
          padding: 7px 11px;
          border-radius: 999px;
          background: #f5f3ff;
          color: #6d28d9;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .ti-hero h1 {
          position: relative;
          z-index: 1;
          max-width: 780px;
          margin: 0;
          color: #0f172a;
          font-size: clamp(34px, 7vw, 64px);
          line-height: 1;
          letter-spacing: 0;
        }

        .ti-hero p {
          position: relative;
          z-index: 1;
          max-width: 720px;
          margin: 0;
          color: #475569;
          font-size: clamp(16px, 2.4vw, 20px);
          line-height: 1.55;
          font-weight: 700;
        }

        .ti-actions {
          position: relative;
          z-index: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 6px;
        }

        .ti-primary,
        .ti-secondary {
          min-height: 46px;
          border-radius: 8px;
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-weight: 950;
        }

        .ti-primary {
          color: #fff;
          background: #1e3a8a;
          box-shadow: 0 16px 34px rgba(30,58,138,0.2);
        }

        .ti-secondary {
          color: #1e3a8a;
          background: #fff;
          border: 1px solid #d7e2f2;
        }

        .ti-content {
          display: grid;
          gap: 16px;
          margin-top: 18px;
        }

        .ti-card {
          padding: 18px;
        }

        .ti-card h2 {
          margin: 0 0 14px;
          font-size: clamp(22px, 3vw, 30px);
          line-height: 1.12;
        }

        .ti-grid {
          display: grid;
          gap: 12px;
        }

        .ti-mini-card,
        .ti-faq,
        .ti-check-list li,
        .ti-table-row {
          border: 1px solid #dbe6f5;
          border-radius: 8px;
          background: #fff;
          transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
        }

        .ti-mini-card {
          padding: 16px;
          display: grid;
          gap: 7px;
        }

        .ti-mini-card:hover,
        .ti-faq:hover,
        .ti-check-list li:hover,
        .ti-table-row:not(.ti-table-head):hover {
          transform: translateY(-1px);
          border-color: #c4b5fd;
          box-shadow: 0 14px 30px rgba(30,58,138,.08);
        }

        .ti-mini-card h3 {
          margin: 0;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
        }

        .ti-mini-card p,
        .ti-faq p {
          margin: 0;
          color: #64748b;
          font-weight: 700;
          line-height: 1.5;
        }

        .ti-check-list {
          display: grid;
          gap: 10px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .ti-check-list li {
          position: relative;
          padding: 14px 14px 14px 42px;
          color: #334155;
          font-weight: 800;
          line-height: 1.45;
        }

        .ti-check-list li::before {
          content: "";
          position: absolute;
          left: 14px;
          top: 18px;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: #7c3aed;
          box-shadow: 0 0 0 5px #f5f3ff;
        }

        .ti-table {
          display: grid;
          gap: 8px;
          overflow-x: auto;
        }

        .ti-table-row {
          min-width: 760px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          padding: 13px;
          align-items: center;
        }

        .ti-table-head {
          background: #f8fbff;
          color: #64748b;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .ti-table-row:not(.ti-table-head) {
          color: #334155;
          font-weight: 780;
        }

        .ti-faq-list {
          display: grid;
          gap: 10px;
        }

        .ti-faq {
          padding: 0;
          overflow: hidden;
        }

        .ti-faq summary {
          cursor: pointer;
          padding: 15px 16px;
          color: #0f172a;
          font-weight: 950;
        }

        .ti-faq p {
          padding: 0 16px 16px;
        }

        @media (min-width: 720px) {
          .ti-shell {
            width: min(1120px, calc(100% - 44px));
            padding-top: 42px;
          }

          .ti-hero {
            padding: 42px;
          }

          .ti-content {
            gap: 20px;
            margin-top: 22px;
          }

          .ti-card {
            padding: 24px;
          }

          .ti-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (min-width: 1020px) {
          .ti-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>

      <Header
        currentUser={currentUser}
        onGoAuth={onGoAuth}
        onGoAdmin={onGoAdmin}
        onGoProfile={onGoProfile}
      />

      <main className="ti-main">
        <div className="ti-shell">
          <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "ТПМПК", to: "/tpmpk" }, { label: page.title }]} />

          <section className="ti-hero">
            <span className="ti-eyebrow">{page.eyebrow}</span>
            <h1>{page.title}</h1>
            <p>{page.description}</p>
            <div className="ti-actions">
              <Link className="ti-primary" to="/tpmpk/zapis">Записаться на обследование</Link>
              <Link className="ti-secondary" to="/tpmpk">Вернуться в раздел</Link>
            </div>
          </section>

          <div className="ti-content">
            {page.sections.map((section) => <Section section={section} key={section.title} />)}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
