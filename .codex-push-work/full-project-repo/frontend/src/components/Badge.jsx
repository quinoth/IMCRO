export default function Badge({ label, color, bg }) {
  return (
    <span style={{
      display: "inline-block",
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      color,
      background: bg,
      borderRadius: 6,
      padding: "3px 9px",
    }}>
      {label}
    </span>
  );
}
