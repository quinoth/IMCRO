import { useState } from "react";
import Badge from "../../components/Badge.jsx";

export default function FeaturedCard({ news, onClick, onAuthorClick }) {
  const [hov, setHov] = useState(false);

  if (!news) return null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative", borderRadius: 18, overflow: "hidden", cursor: "pointer",
        height: "100%", minHeight: 400,
        boxShadow: hov ? "0 24px 56px rgba(0,0,0,0.18)" : "0 4px 20px rgba(0,0,0,0.08)",
        transition: "box-shadow 0.3s",
      }}
    >
      <style>{`
        .featured-pin {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 40px;
          height: 40px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          color: #fff;
          background: rgba(15, 23, 42, .76);
          border: 1px solid rgba(255,255,255,.55);
          box-shadow: 0 12px 26px rgba(15,23,42,.3);
          backdrop-filter: blur(10px);
          z-index: 2;
        }
        .featured-pin svg { width: 21px; height: 21px; fill: currentColor; }
      `}</style>
      <img
        src={news.image}
        alt={news.title}
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover",
          transform: hov ? "scale(1.04)" : "scale(1)",
          transition: "transform 0.55s cubic-bezier(0.25,0.46,0.45,0.94)",
        }}
      />
      {news.is_pinned && (
        <span className="featured-pin" aria-label="Закреплённая статья" title="Закреплённая статья">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M14.8 3.2 20.8 9.2 18.7 11.3 17.3 9.9 13.4 13.8 13.8 18.6 12.4 20 8.8 16.4 4.7 20.5 3.5 19.3 7.6 15.2 4 11.6 5.4 10.2 10.2 10.6 14.1 6.7 12.7 5.3 14.8 3.2Z" />
          </svg>
        </span>
      )}

      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(10,20,50,0.92) 0%, rgba(10,20,50,0.25) 55%, transparent 100%)" }} />

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Badge label={news.category} color={news.categoryColor} bg={news.categoryBg} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>{news.date}</span>
        </div>
        <h3 style={{ fontSize: 21, fontWeight: 800, color: "#fff", lineHeight: 1.35, margin: "0 0 10px", letterSpacing: 0 }}>
          {news.title}
        </h3>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: "0 0 16px" }}>
          {news.excerpt}
        </p>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 600, color: "#93C5FD" }}>
          Читать далее
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M2.5 6.5h8M7.5 3.5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        {news.author && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAuthorClick?.(news);
            }}
            style={{ marginTop: 10, border: 0, background: "transparent", color: "#BFDBFE", font: "700 12px/1.4 inherit", padding: 0, cursor: "pointer" }}
          >
            {news.author}
          </button>
        )}
      </div>
    </div>
  );
}
