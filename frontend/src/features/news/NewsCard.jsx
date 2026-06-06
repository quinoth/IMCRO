import { useState } from "react";
import Badge from "../../components/Badge.jsx";

function PinnedBadge() {
  return (
    <span className="news-pin" aria-label="Закреплённая статья" title="Закреплённая статья">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.8 3.2 20.8 9.2 18.7 11.3 17.3 9.9 13.4 13.8 13.8 18.6 12.4 20 8.8 16.4 4.7 20.5 3.5 19.3 7.6 15.2 4 11.6 5.4 10.2 10.2 10.6 14.1 6.7 12.7 5.3 14.8 3.2Z" />
      </svg>
    </span>
  );
}

export default function NewsCard({ news, horizontal = false, onClick, onAuthorClick }) {
  const [hov, setHov] = useState(false);

  if (!news) return null;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: "#fff", borderRadius: 16, overflow: "hidden", cursor: "pointer",
        border: "1px solid rgba(31,80,115,0.16)", display: "flex", 
        flexDirection: horizontal ? "row" : "column",
        boxShadow: hov ? "0 12px 30px rgba(0,0,0,0.15)" : "0 4px 20px rgba(0,0,0,0.08)",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        transition: "box-shadow 0.25s, transform 0.25s",
        height: "100%"
      }}
    >
      <style>{`
        .news-pin {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 34px;
          height: 34px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          color: #fff;
          background: rgba(31, 80, 115, .84);
          border: 1px solid rgba(255,255,255,.55);
          box-shadow: 0 10px 22px rgba(15,23,42,.25);
          backdrop-filter: blur(10px);
          z-index: 1;
        }
        .news-pin svg { width: 18px; height: 18px; fill: currentColor; }
      `}</style>
      <div style={{ height: horizontal ? "auto" : 178, width: horizontal ? "40%" : "100%", overflow: "hidden", flexShrink: 0, position: "relative", background: "rgba(31,80,115,0.08)" }}>
        <img src={news.image} alt={news.title} style={{
          width: "100%", height: "100%", objectFit: "cover", display: "block",
          transform: hov ? "scale(1.06)" : "scale(1)",
          transition: "transform 0.45s cubic-bezier(0.25,0.46,0.45,0.94)",
        }} />
        {news.is_pinned && <PinnedBadge />}
      </div>
      <div style={{ padding: "18px 20px 22px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Badge label={news.category} color={news.categoryColor} bg={news.categoryBg} />
          <span style={{ fontSize: 11, color: "#94A3B8" }}>{news.date}</span>
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", lineHeight: 1.45, margin: "0 0 8px", flex: 1 }}>
          {news.title}
        </h3>
        <p style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6, margin: 0 }}>
          {news.excerpt}
        </p>
        {news.author && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAuthorClick?.(news);
            }}
            style={{ marginTop: 10, border: 0, background: "transparent", color: "#1F5073", font: "700 12px/1.4 inherit", padding: 0, cursor: "pointer", textAlign: "left" }}
          >
            {news.author}
          </button>
        )}
      </div>
    </div>
  );
}
