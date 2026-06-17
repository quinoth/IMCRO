import { QUICK } from "../../constants/index.js";

export default function QuickAccess() {
  return (
    <section style={{ marginTop: 52 }}>
      <style>{`
        .quick-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; }
        .quick-item { background: #fff; border: 1px solid #F1F5F9; border-radius: 14px; padding: 20px; cursor: pointer; transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s; }
        .quick-item:hover { box-shadow: 0 8px 26px rgba(29,78,216,0.1); transform: translateY(-2px); border-color: #BFDBFE; }
      `}</style>

      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 20 }}>
        Быстрый доступ
      </h2>
      <div className="quick-grid">
        {QUICK.map(q => (
          <div key={q.title} className="quick-item">
            <div style={{ fontSize: 28, marginBottom: 10 }}>{q.emoji}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", lineHeight: 1.35, marginBottom: 5 }}>{q.title}</div>
            <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.4 }}>{q.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
