export default function MapSection() {
  return (
    <section style={{ background: "linear-gradient(180deg, #F1F5F9 0%, #F8FAFC 100%)", padding: "0 24px 60px" }}>
      <style>{`
        .map-card {
          max-width: 1200px;
          margin: 0 auto;
          background: linear-gradient(135deg, #1E3A8A, #1D4ED8);
          border-radius: 24px;
          padding: 24px;
          display: flex;
          gap: 40px;
          align-items: center;
          box-shadow: 0 12px 32px rgba(15,23,42,0.15);
        }
        .map-embed {
          flex: 1.5;
          height: 340px;
          border-radius: 16px;
          overflow: hidden;
          background: #E2E8F0;
        }
        .map-info {
          flex: 1;
          color: #fff;
          padding-right: 20px;
        }
        .map-info-title {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 24px;
          letter-spacing: -0.01em;
        }
        .map-info-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #E2E8F0;
          line-height: 1.5;
        }
        .map-btn {
          margin-top: 32px;
          background: #fff;
          color: #0F172A;
          border: none;
          padding: 10px 24px;
          border-radius: 20px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .map-btn:hover { background: #F1F5F9; }

        @media (max-width: 800px) {
          .map-card { flex-direction: column; gap: 24px; }
          .map-embed { width: 100%; flex: none; height: 260px; }
          .map-info { padding-right: 0; padding-bottom: 20px; }
        }
      `}</style>
      
      <div className="map-card">
        <div className="map-embed">
          <iframe 
            src="https://yandex.ru/map-widget/v1/?ll=104.2806%2C52.2829&z=15" 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            allowFullScreen={true}
            style={{ display: "block" }}
          ></iframe>
        </div>
        
        <div className="map-info">
          <div className="map-info-title">Контактная информация</div>
          
          <div className="map-info-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>Иркутская область, г. Иркутск,<br/>ул. Ленина, дом 26</span>
          </div>
          
          <div className="map-info-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>+7 (3952) 201 985</span>
          </div>

          <div className="map-info-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            <span>irk_imcro@bk.ru</span>
          </div>

          <button className="map-btn">Все контакты</button>
        </div>
      </div>
    </section>
  );
}
