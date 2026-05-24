import { useState } from "react";
import Logo from "../../components/Logo.jsx";
import { NAV } from "../../constants/index.js";

export default function MobileDrawer({ open, onClose }) {
  if (!open) return null;
  return <MobileDrawerPanel onClose={onClose} />;
}

function MobileDrawerPanel({ onClose }) {
  const [exp, setExp] = useState(null);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }} />

      {/* Drawer */}
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "min(340px,100vw)", background: "#fff", display: "flex", flexDirection: "column", overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,0.14)" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo />
          <button onClick={onClose} style={{ background: "#F8FAFC", border: "none", cursor: "pointer", width: 34, height: 34, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="#64748B" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {NAV.map((item, i) => (
            <div key={item.label}>
              <button onClick={() => setExp(exp === i ? null : i)} style={{ width: "100%", background: "none", border: "none", cursor: "pointer", padding: "15px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 15, fontWeight: 600, color: "#0F172A", textAlign: "left" }}>
                {item.label}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: exp === i ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>
                  <path d="M1 4l5 5 5-5" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {exp === i && (
                <div style={{ background: "#F8FAFC", borderTop: "1px solid #F1F5F9", borderBottom: "1px solid #F1F5F9" }}>
                  {item.sub.map((s, idx) => (
                    <div key={idx} style={{ padding: "12px 20px 12px 36px", fontSize: 14, color: "#475569", cursor: "pointer", borderBottom: "1px solid #F1F5F9" }}
                      onMouseOver={e => e.currentTarget.style.color = "#1D4ED8"}
                      onMouseOut={e => e.currentTarget.style.color = "#475569"}
                    >{s}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Contacts */}
        <div style={{ padding: "20px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Контакты</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>+7 (3952) 201 985, 343 705</div>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>123</div>
        </div>
      </div>
    </div>
  );
}
