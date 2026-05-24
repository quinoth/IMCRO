export default function HeroSection() {
  return (
    <section style={{
      position: "relative",
      backgroundColor: "#0A1F44", /* Deep dark blue */
      backgroundImage: "linear-gradient(90deg, rgba(10,31,68,0.95) 0%, rgba(10,31,68,0.7) 100%), url('https://mc.eduirk.ru/images/headers/bg.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      minHeight: "440px",
      display: "flex",
      alignItems: "stretch"
    }}>
      <style>{`
        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
          padding: 60px 24px 40px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 40px;
        }
        @media (max-width: 900px) {
          .hero-container {
            flex-direction: column;
          }
        }

        .hero-emblems {
          display: flex;
          gap: 16px;
          margin-top: auto;
          padding-top: 60px;
        }
        .hero-emblem {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        /* Right side search cards */
        .hero-right-cards {
          width: 360px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex-shrink: 0;
        }
        .hero-card {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          padding: 24px;
        }
        .hero-card-input-wrap {
          background: #fff;
          border-radius: 8px;
          padding: 4px 4px 4px 16px;
          display: flex;
          align-items: center;
        }
        .hero-card-input {
          border: none;
          outline: none;
          flex: 1;
          font-size: 14px;
          color: #0F172A;
          width: 100%;
        }
        .hero-card-btn {
          background: #60A5FA;
          color: #fff;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .hero-card-btn:hover { background: #3B82F6; }
        
        .hero-esia-btn {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.4);
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          width: 100%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.15s;
        }
        .hero-esia-btn:hover { background: rgba(255, 255, 255, 0.05); }

      `}</style>
      
      <div className="hero-container">
        
        {/* Left Content */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: "100%" }}>
          <h1 style={{ 
            fontSize: "clamp(32px, 5vw, 44px)", 
            fontWeight: 800, 
            color: "#fff", 
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: 600
          }}>
            МКУ развития образования<br/>города Иркутска
          </h1>
          
          <div className="hero-emblems">
            <div className="hero-emblem" style={{ background: "#CD3232" }}>🏫</div>
            <div className="hero-emblem" style={{ background: "#E5A024" }}>🏛️</div>
            <div className="hero-emblem" style={{ background: "#4A90E2" }}>🎓</div>
            <div className="hero-emblem" style={{ background: "#4CAF50" }}>🌿</div>
            <div className="hero-emblem" style={{ background: "#303F9F" }}>🌐</div>
            <div className="hero-emblem" style={{ background: "#1E293B" }}>🛡️</div>
          </div>
        </div>

        {/* Right Content */}
        <div className="hero-right-cards">
          
          <div className="hero-card">
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              Психолого-педагогическая поддержка
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginBottom: 16 }}>
              Поиск специалистов и запись на прием
            </div>
            <div className="hero-card-input-wrap">
              <input type="text" className="hero-card-input" placeholder="Кого ищем? (Фамилия И. О.)" />
              <button className="hero-card-btn">Найти</button>
            </div>
          </div>

          <div className="hero-card" style={{ padding: "16px 24px" }}>
            <button className="hero-esia-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Вход через Госуслуги
            </button>
          </div>

        </div>

      </div>
    </section>
  );
}
