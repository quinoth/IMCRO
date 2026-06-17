/**
 * ContextMenu — контекстное меню по правому клику на элементе.
 *
 * Props:
 * - x, y: координаты меню (px, абсолютные)
 * - items: массив { label, icon?, shortcut?, onClick, danger? }
 * - onClose: callback при закрытии
 *
 * Меню закрывается по клику вне, Escape или после выбора пункта.
 * Плавная анимация появления.
 */
import { useEffect, useRef } from "react";

const menuStyle = {
  position: "fixed",
  minWidth: 180,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
  border: "1px solid #E2E8F0",
  padding: "6px 0",
  zIndex: 99999,
  animation: "ctxMenuIn 120ms cubic-bezier(0.22,1,0.36,1)",
  fontFamily: "inherit",
};

const itemStyle = (hover, danger) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "9px 16px",
  fontSize: 13,
  fontWeight: 600,
  color: danger ? "#DC2626" : hover ? "#0F172A" : "#334155",
  background: hover ? "#F1F5F9" : "transparent",
  border: "none",
  width: "100%",
  textAlign: "left",
  cursor: "pointer",
  fontFamily: "inherit",
  transition: "background 80ms, color 80ms",
  borderRadius: 0,
});

const shortcutStyle = {
  marginLeft: "auto",
  fontSize: 11,
  color: "#94A3B8",
  fontWeight: 500,
  paddingLeft: 12,
};

export default function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("keydown", handleEsc, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("keydown", handleEsc, true);
    };
  }, [onClose]);

  // Корректировка позиции чтобы не выходил за экран
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - items.length * 38 - 20);

  return (
    <>
      <style>{`
        @keyframes ctxMenuIn {
          from { opacity: 0; transform: scale(0.92) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div ref={ref} style={{ ...menuStyle, left: adjustedX, top: adjustedY }}>
        {items.map((item, i) =>
          item.separator ? (
            <div key={i} style={{ height: 1, background: "#E2E8F0", margin: "4px 8px" }} />
          ) : (
            <button
              key={i}
              type="button"
              style={itemStyle(false, item.danger)}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              onClick={() => {
                item.onClick?.();
                onClose();
              }}
            >
              {item.icon && <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{item.icon}</span>}
              <span>{item.label}</span>
              {item.shortcut && <span style={shortcutStyle}>{item.shortcut}</span>}
            </button>
          )
        )}
      </div>
    </>
  );
}
