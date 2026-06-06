import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../../constants/index.js";
import { authHeaders } from "../../../utils/authHeaders.js";
import AccuratePreview from "./AccuratePreview.jsx";

const PAGE_W = 210;
const PAGE_H = 297;
const DEFAULT_FONT_FAMILY = "DejaVu";

function normalizeElementType(rawType) {
  const type = String(rawType || "text").toLowerCase();
  if (type === "seal") return "stamp";
  if (type === "facsimile") return "signature";
  return type;
}

function isImageElementType(type) {
  return ["image", "stamp", "seal", "signature", "facsimile", "line"].includes(String(type || "").toLowerCase());
}

function sourceUrlToPreview(sourceUrl) {
  if (!sourceUrl) return null;
  return String(sourceUrl).startsWith("http") ? sourceUrl : `${API_BASE}${sourceUrl}`;
}

function mapTemplateForPreview(data) {
  const template = data?.template || {};
  const elements = [];
  const images = [];

  for (const [index, raw] of (data?.elements || []).entries()) {
    const elementType = normalizeElementType(raw.type || raw.element_type);
    const common = {
      id: raw.id || raw.client_id || raw.db_id || `${elementType}_${index}`,
      x: (Number(raw.x_mm || 0) / PAGE_W) * 100,
      y: (Number(raw.y_mm || 0) / PAGE_H) * 100,
      zIndex: typeof raw.z_index === "number" ? raw.z_index : undefined,
      hidden: !!raw.hidden,
      locked: !!raw.locked,
      opacity: raw.opacity ?? 1,
      signerGroupId: raw.signerGroupId || raw.signer_group_id || null,
    };

    if (isImageElementType(elementType)) {
      images.push({
        ...common,
        kind: elementType,
        label: elementType === "line" ? "Линия подписи" : elementType === "stamp" ? "Печать" : elementType === "signature" ? "Подпись" : "Изображение",
        url: sourceUrlToPreview(raw.source_url),
        sourceUrl: raw.source_url || null,
        widthMm: raw.width ?? raw.width_mm ?? raw.max_width_mm ?? (elementType === "line" ? 58 : 40),
        heightMm: raw.height ?? raw.height_mm ?? raw.max_height_mm ?? (elementType === "line" ? 0.55 : 25),
        color: raw.color || "#1e293b",
      });
    } else {
      elements.push({
        ...common,
        text: raw.text || raw.value || "",
        size: raw.font_size || 24,
        color: raw.color || "#0f172a",
        weight: raw.font_weight || "400",
        italic: !!raw.italic,
        underline: !!raw.underline,
        lineHeight: raw.line_height || 1.25,
        fontFamily: raw.font_family || DEFAULT_FONT_FAMILY,
        align: raw.align || "center",
        maxWidthMm: raw.width ?? raw.width_mm ?? raw.max_width_mm,
        maxHeightMm: raw.height ?? raw.height_mm ?? raw.max_height_mm,
      });
    }
  }

  const signers = (data?.signers || []).map((signer, index) => ({
    id: signer.id || `signer_${index}`,
    position: signer.position || "Должность",
    fullName: signer.full_name || "ФИО",
    facPreview: sourceUrlToPreview(signer.facsimile_url),
    offsetY: signer.offset_y_mm || 0,
    facOffsetX: signer.facsimile_offset_x_mm || 0,
    facOffsetY: signer.facsimile_offset_y_mm || 0,
    facScale: signer.facsimile_scale || 1,
    showLine: true,
    align: "split",
  }));

  return {
    backgroundUrl: sourceUrlToPreview(template.background_url),
    elements,
    images,
    signers,
    margins: {
      left: template.margin_left_mm ?? 20,
      right: template.margin_right_mm ?? 20,
      top: template.margin_top_mm ?? 20,
      bottom: template.margin_bottom_mm ?? 20,
    },
    signersLayout: {
      y_mm: template.signers_y_mm ?? 248,
      x_mm: template.signers_block_x_mm ?? 105,
      row_h_mm: template.signers_row_height_mm ?? 32,
      band_mm: template.signers_band_width_mm ?? 168,
      font_size: template.signers_font_size ?? 10,
      text_color: template.signers_text_color ?? "#1e293b",
      font_weight: template.signers_font_weight ?? "400",
      font_family: template.signers_font_family || DEFAULT_FONT_FAMILY,
      position_color: template.signers_position_color || "",
      name_color: template.signers_name_color || "",
    },
  };
}

export default function TemplateLivePreview({ templateId, values, empty = false, maxWidth = 460 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError("");
    if (!templateId) return undefined;
    setLoading(true);
    fetch(`${API_BASE}/certificates/templates/${templateId}/full`, { headers: authHeaders() })
      .then(async (response) => {
        if (!response.ok) throw new Error("Не удалось загрузить предпросмотр шаблона");
        return response.json();
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Не удалось загрузить предпросмотр шаблона");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const mapped = useMemo(() => mapTemplateForPreview(data), [data]);

  if (empty || !templateId) {
    return <div style={{ border: "1px dashed #cbd5e1", borderRadius: 8, padding: 32, color: "#667783", textAlign: "center" }}>Загрузите данные, чтобы увидеть предпросмотр.</div>;
  }

  if (loading) {
    return <div style={{ border: "1px dashed #cbd5e1", borderRadius: 8, padding: 32, color: "#667783", textAlign: "center" }}>Загружаем предпросмотр шаблона...</div>;
  }

  if (error) {
    return <div style={{ border: "1px dashed #fecaca", borderRadius: 8, padding: 32, color: "#b91c1c", textAlign: "center" }}>{error}</div>;
  }

  return (
    <div style={{ border: "1px solid #dbe5ea", borderRadius: 8, background: "#f3f6f8", padding: 18, overflow: "auto" }}>
      <AccuratePreview
        bgUrl={mapped.backgroundUrl}
        elements={mapped.elements}
        images={mapped.images}
        signers={mapped.signers}
        signersLayout={mapped.signersLayout}
        margins={mapped.margins}
        previewVariables={values}
        showGrid={false}
        showSafeZone={false}
        showRulers={false}
        showLiteralVariables={false}
        hideSigners={mapped.signers.length === 0}
        maxWidth={maxWidth}
      />
    </div>
  );
}
