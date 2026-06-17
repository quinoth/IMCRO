import { STATS } from "../../constants/index.js";

export default function Stats() {
  return (
    <section style={{ marginTop: 52 }}>
      <style>{`
        .stats-row { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
        .stat-box { background: #fff; border-radius: 14px; padding: 20px 18px; border: 1px solid #F1F5F9; text-align: center; flex: 1; min-width: 120px; transition: box-shadow 0.2s, transform 0.2s; cursor: default; }
        .stat-box:hover { box-shadow: 0 6px 20px rgba(29,78,216,0.09); transform: translateY(-2px); }
      `}</style>

      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", marginBottom: 20 }}>
        МКУ в цифрах
      </h2>
      <div className="stats-row">
        {STATS.map(s => (
          <div key={s.label} className="stat-box">
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.emoji}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#1D4ED8", letterSpacing: "-0.03em", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 6, lineHeight: 1.4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
