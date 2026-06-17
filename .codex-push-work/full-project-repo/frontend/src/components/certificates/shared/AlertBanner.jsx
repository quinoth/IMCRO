/** Баннер уведомлений: success / error / info */
export default function AlertBanner({ type, children }) {
  const styles = {
    success: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0", icon: "✓" },
    error:   { bg: "#FEF2F2", color: "#DC2626", border: "#FECACA", icon: "!" },
    info:    { bg: "#EDF6F8", color: "#004F75", border: "#B8D4DD", icon: "i" },
    warning: { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A", icon: "!" },
  };
  const s = styles[type] || styles.info;
  return (
    <div
      role="alert"
      style={{
        marginTop: 16,
        padding: "14px 16px",
        borderRadius: 12,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontWeight: 500,
        fontSize: 14,
        lineHeight: 1.55,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <span style={{ flexShrink: 0, fontSize: 16 }}>{s.icon}</span>
      <span>{children}</span>
    </div>
  );
}
