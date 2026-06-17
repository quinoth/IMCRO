export default function DepartmentsSection() {
  const depts = [
    { title: "ТПМПК", desc: "Территориальная психолого-медико-педагогическая комиссия", bg: "#EFF6FF" },
    { title: "Для родителей", desc: "Консультационная помощь", bg: "#ECFDF5" },
    { title: "Профсоюз", desc: "Сотрудникам образовательных и профсоюзных организаций (объединений)", bg: "#EFF6FF" },
    { title: "Здоровое питание", desc: "Методическое сопровождение родительского контроля", bg: "#FFFBEB" },
  ];

  return (
    <section style={{ 
      position: "relative",
      overflow: "hidden",
      background: "linear-gradient(160deg, #F8FAFC 0%, #F1F5F9 100%)", 
      padding: "60px 24px" 
    }}>
      {/* Subtle background glow effects */}
      <div style={{ position: "absolute", top: "0%", left: "-10%", width: "40%", height: "80%", background: "radial-gradient(circle, rgba(226, 232, 240, 0.4) 0%, rgba(248, 250, 252, 0) 70%)", zIndex: 0, pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: "45%", height: "90%", background: "radial-gradient(circle, rgba(191, 219, 254, 0.25) 0%, rgba(248, 250, 252, 0) 70%)", zIndex: 0, pointerEvents: "none" }} />

      <style>{`
        .depts-container { max-width: 1200px; margin: 0 auto; width: 100%; }
        .depts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
        }
        .dept-card {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .dept-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.06);
        }
        .dept-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          color: #0F172A;
          margin-bottom: 24px;
        }
        .dept-btn {
          margin-top: 24px;
          background: #0F172A;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 24px;
          border-radius: 20px;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .dept-btn:hover { background: #1E293B; }
      `}</style>
      
      <div className="depts-container" style={{ position: "relative", zIndex: 1 }}>
        <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "40px" }}>
          Наши подразделения
        </h2>
        
        <div className="depts-grid">
          {depts.map((d, i) => (
            <div key={i} className="dept-card">
              <div className="dept-icon-wrap" style={{ background: d.bg }}>
                {d.title.substring(0, 5)}
              </div>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", lineHeight: 1.5, margin: 0, flex: 1 }}>
                {d.desc}
              </h3>
              <button className="dept-btn">Перейти</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
