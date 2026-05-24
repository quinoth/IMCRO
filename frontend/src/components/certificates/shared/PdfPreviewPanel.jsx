/** Панель предпросмотра PDF: iframe + кнопка скачивания */
import { API_BASE } from "../../../constants/index.js";

export default function PdfPreviewPanel({ fileUrl, onDownload, accentColor = "#19789c", emptyText, emptyIcon = "PDF" }) {
  const fullUrl = fileUrl ? `${API_BASE}${fileUrl}` : null;

  if (!fullUrl) {
    return (
      <div
        style={{
          minHeight: 400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#94A3B8",
          fontSize: 15,
          textAlign: "center",
          padding: 32,
          border: "2px dashed #CBD5E1",
          borderRadius: 16,
          lineHeight: 1.6,
          gap: 12,
        }}
      >
        <span style={{ fontSize: 48, opacity: 0.5 }}>{emptyIcon}</span>
        <span>{emptyText || "Сгенерируйте PDF — здесь появится предпросмотр"}</span>
      </div>
    );
  }

  return (
    <div style={{ position: "sticky", top: 92 }}>
      <div
        style={{
          marginBottom: 16,
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          overflow: "hidden",
          background: "#F8FAFC",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          maxHeight: "calc(100vh - 180px)",
        }}
      >
        <iframe
          src={fullUrl}
          style={{ width: "100%", height: "min(640px, calc(100vh - 220px))", border: "none", minHeight: 420 }}
          title="Предпросмотр грамоты"
        />
      </div>
      <button
        type="button"
        onClick={onDownload}
        style={{
          width: "100%",
          padding: "14px",
          background: accentColor,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 15,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        Скачать PDF
      </button>
    </div>
  );
}
