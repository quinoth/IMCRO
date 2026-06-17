/** Общие стили для компонентов выпуска грамот */

export const cardStyle = {
  background: "#fff",
  border: "1px solid #d4e0e6",
  borderRadius: 8,
  padding: 26,
  boxShadow: "0 10px 28px rgba(15,23,42,0.06)",
};

export const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 8,
  border: "1px solid #d6e0e6",
  fontSize: 15,
  boxSizing: "border-box",
  outline: "none",
  transition: "border-color 0.15s",
  fontFamily: "inherit",
};

export const labelStyle = {
  display: "block",
  marginBottom: 8,
  fontWeight: 600,
  color: "#475569",
  fontSize: 16,
};

export const primaryBtn = (disabled) => ({
  width: "100%",
  padding: "16px",
  fontSize: 16,
  fontWeight: 700,
  background: disabled ? "#CBD5E1" : "#19789c",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "background 0.15s, transform 0.1s",
  letterSpacing: "0.01em",
});

export const successBtn = (disabled) => ({
  ...primaryBtn(disabled),
  background: disabled ? "#CBD5E1" : "#059669",
});

export const dangerBtn = {
  padding: "6px 12px",
  background: "#FEE2E2",
  color: "#DC2626",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 13,
};

export const sectionBox = (color = "#EFF6FF", border = "#BFDBFE") => ({
  background: color,
  padding: 20,
  borderRadius: 12,
  marginBottom: 24,
  border: `1px solid ${border}`,
});
