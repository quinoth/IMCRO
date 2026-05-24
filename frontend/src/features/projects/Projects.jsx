import { PROJECTS } from "../../constants/index.js";

export default function Projects() {
  return (
    <section style={{ padding: "56px 24px" }}>
      <style>{`
        .projects-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          margin-top: 32px;
        }
        @media (max-width: 900px) { .projects-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .projects-grid { grid-template-columns: 1fr 1fr; } }

        .project-card {
          display: flex; flex-direction: column; align-items: center;
          text-align: center; gap: 12px; cursor: pointer;
          padding: 24px 16px;
          border-radius: 16px;
          transition: background 0.2s, transform 0.2s;
        }
        .project-card:hover {
          background: #EFF6FF;
          transform: translateY(-3px);
        }
        .project-icon {
          width: 64px; height: 64px; border-radius: 50%;
          background: #F1F5F9;
          display: flex; align-items: center; justify-content: center;
          font-size: 28px;
          transition: background 0.2s;
        }
        .project-card:hover .project-icon { background: #DBEAFE; }
        .project-title {
          font-size: 13px; font-weight: 600; color: #0F172A;
          line-height: 1.45;
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", textTransform: "uppercase" }}>
            Проекты
          </h2>
          <button style={{ fontSize: 13, fontWeight: 600, color: "#1D4ED8", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            Все проекты →
          </button>
        </div>

        <div className="projects-grid">
          {PROJECTS.map((p, i) => (
            <div key={i} className="project-card">
              <div className="project-icon">{p.icon}</div>
              <div className="project-title">{p.title}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
