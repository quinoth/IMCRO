import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { API_BASE } from "../../../constants/index.js";
import { resizeBox } from "./resizeGeometry.js";

const PAGE_W = 210; // мм
const PAGE_H = 297; // мм
const MM_TO_CSS_PX = 96 / 25.4;
const PT_TO_CSS_PX = 96 / 72;
const PT_TO_MM = 25.4 / 72;
const DEFAULT_FONT_FAMILY = "DejaVu";
const TEXT_MIN_WIDTH_MM = 12;
const TEXT_MIN_HEIGHT_MM = 8;
const IMAGE_MIN_SIZE_MM = 5;
const SIGNER_MIN_WIDTH_MM = 25;
const SIGNER_MIN_HEIGHT_MM = 10;
const RESIZE_HANDLES = [
  ["tl", { left: -7, top: -7 }, "nwse-resize"],
  ["t", { left: "50%", top: -7, transform: "translateX(-50%)" }, "ns-resize"],
  ["tr", { right: -7, top: -7 }, "nesw-resize"],
  ["r", { right: -7, top: "50%", transform: "translateY(-50%)" }, "ew-resize"],
  ["br", { right: -7, bottom: -7 }, "nwse-resize"],
  ["b", { left: "50%", bottom: -7, transform: "translateX(-50%)" }, "ns-resize"],
  ["bl", { left: -7, bottom: -7 }, "nesw-resize"],
  ["l", { left: -7, top: "50%", transform: "translateY(-50%)" }, "ew-resize"],
];

/**
 * Калибровочный коэффициент: браузерный Canvas (Arial/sans-serif) измеряет
 * текст примерно на ~18-22% шире, чем ReportLab с DejaVu Sans.
 * Делим maxWPx на этот коэффициент, чтобы auto-fit в превью давал тот же
 * размер шрифта, что и в генерируемом PDF.
 * Значение подобрано эмпирически; при необходимости скорректируйте.
 */
const CANVAS_TO_REPORTLAB_FONT_RATIO = 0.82;

// ── Плейсхолдеры по умолчанию — «худший случай» для точного превью ───────────
// Используются когда пользователь не вводит собственные значения.
const DEFAULT_PREVIEW_VARS = {
  "ФИО": "Иванов Иван Иванович",
  "фио": "Иванов Иван Иванович",
  "fio": "Иванов Иван Иванович",
  "Мероприятие": "Всероссийская олимпиада по информатике",
  "мероприятие": "Всероссийская олимпиада по информатике",
  "event": "Всероссийская олимпиада по информатике",
  "Дата": "31 декабря 2025 г.",
  "дата": "31 декабря 2025 г.",
  "date": "31 декабря 2025 г.",
  "Номер": "№ 12345",
  "номер": "№ 12345",
};

/** Подставляет переменные в текст шаблона. Возвращает результирующую строку. */
function applyPreviewVariables(text, userVars) {
  if (!text) return text;
  const rendered = text.replace(/\{([^}]+)\}/g, (match, inner) => {
    const key = inner.trim();
    const genderMatch = key.match(/^(?:род|пол|gender)\s*:\s*([^|{}]+)\|([^{}]+)$/i);
    if (genderMatch) {
      const gender = String(userVars?.__gender || userVars?.gender || userVars?.Пол || userVars?.пол || "").toLowerCase();
      return gender === "female" || gender === "женский" || gender === "ж" ? genderMatch[2].trim() : genderMatch[1].trim();
    }
    const grammarParts = key.includes("|")
      ? key.split("|").map((part) => part.trim())
      : (key.includes(":") ? key.split(":").map((part) => part.trim()) : null);
    if (grammarParts && grammarParts[0] && grammarParts[1]) {
      const [baseName, caseName] = grammarParts;
      const grammarCandidates = [
        `${baseName}:${caseName}`,
        `${baseName}_${caseName}`,
        `${baseName} | ${caseName}`,
        key,
        baseName,
      ];
      for (const candidate of grammarCandidates) {
        if (userVars && userVars[candidate] !== undefined) return userVars[candidate];
        if (userVars && userVars[candidate.toLowerCase()] !== undefined) return userVars[candidate.toLowerCase()];
      }
      if (userVars) {
        const normalizedCandidates = grammarCandidates.map((candidate) => candidate.toLowerCase().replace(/\s+/g, ""));
        for (const [k, v] of Object.entries(userVars)) {
          if (normalizedCandidates.includes(k.toLowerCase().replace(/\s+/g, ""))) return v;
        }
      }
    }
    // Пробуем точное совпадение → нижний регистр → дефолты
    if (userVars && (userVars[key] !== undefined)) return userVars[key];
    if (userVars && (userVars[key.toLowerCase()] !== undefined)) return userVars[key.toLowerCase()];
    const normKey = key.toLowerCase().replace(/\s+/g, "");
    // Поиск по нормализованному ключу среди userVars
    if (userVars) {
      for (const [k, v] of Object.entries(userVars)) {
        if (k.toLowerCase().replace(/\s+/g, "") === normKey) return v;
      }
    }
    // Дефолтный «худший случай»
    if (DEFAULT_PREVIEW_VARS[key] !== undefined) return DEFAULT_PREVIEW_VARS[key];
    if (DEFAULT_PREVIEW_VARS[key.toLowerCase()] !== undefined) return DEFAULT_PREVIEW_VARS[key.toLowerCase()];
    for (const [k, v] of Object.entries(DEFAULT_PREVIEW_VARS)) {
      if (k.toLowerCase().replace(/\s+/g, "") === normKey) return v;
    }
    return match; // оставляем плейсхолдер если нет подстановки
  });
  const gender = String(userVars?.__gender || userVars?.gender || userVars?.Пол || userVars?.пол || "").toLowerCase();
  return rendered.replace(
    /(?<![A-Za-zА-Яа-яЁё{}-])([A-Za-zА-Яа-яЁё-]+)\|([A-Za-zА-Яа-яЁё-]+)(?![A-Za-zА-Яа-яЁё{}-])/g,
    (_, maleValue, femaleValue) => (
      gender === "female" || gender === "женский" || gender === "ж" ? femaleValue : maleValue
    ),
  );
}

// ── Утилиты ──────────────────────────────────────────────────────────────────

/** Умное выравнивание: определяем align по позиции X внутри рабочей зоны */
function smartAlign(xPct, xMinPct, xMaxPct) {
  const rel = (xPct - xMinPct) / Math.max(xMaxPct - xMinPct, 1);
  if (rel < 0.28) return "left";
  if (rel > 0.72) return "right";
  return "center";
}

/** CSS transform для превью в зависимости от align */
function previewTransform(align) {
  if (align === "left") return "translateY(-50%)";
  if (align === "right") return "translate(-100%, -50%)";
  return "translate(-50%, -50%)";
}

function textLeftMmFromAnchor(anchorMm, widthMm, align) {
  if (align === "left") return anchorMm;
  if (align === "right") return anchorMm - widthMm;
  return anchorMm - widthMm / 2;
}

function textAnchorMmFromBox(box, align) {
  if (align === "left") return box.leftMm;
  if (align === "right") return box.leftMm + box.widthMm;
  return box.leftMm + box.widthMm / 2;
}

function pctFromMm(valueMm, pageMm) {
  return (valueMm / pageMm) * 100;
}

function getTextLines(text, sizePx, maxWidthPx, fontWeight, fontFamily) {
  if (!_canvas || maxWidthPx <= 0) return String(text || "").split("\n");
  return wrapTextToWidth(text, sizePx, maxWidthPx, fontWeight, fontFamily, _canvas.getContext("2d"));
}

/**
 * Clamp: ограничиваем координату рабочей зоной.
 * Возвращает значение, зажатое между min и max.
 */
/**
 * Auto-shrink шрифта для превью — точная имитация бэкендного auto_fit_text.
 * Учитывает перенос слов: измеряем каждую строку отдельно, проверяем высоту блока.
 * Использует Canvas API для точного измерения ширины текста.
 */
const _canvas = typeof document !== "undefined" ? document.createElement("canvas") : null;

function fontStack(fontFamily) {
  const family = String(fontFamily || DEFAULT_FONT_FAMILY).replace(/"/g, "");
  return `"${family}", "DejaVu Sans", Arial, sans-serif`;
}

function measureTextWidth(text, sizePx, fontWeight, fontFamily, ctx) {
  ctx.font = `${fontWeight} ${sizePx}px ${fontStack(fontFamily)}`;
  return ctx.measureText(text).width;
}

/**
 * Оборачивает текст по словам так, чтобы каждая строка влезала в maxWidthPx.
 * Возвращает массив строк.
 */
function wrapTextToWidth(text, sizePx, maxWidthPx, fontWeight, fontFamily, ctx) {
  if (!text || maxWidthPx <= 0) return [text || ""];
  const resultLines = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) { resultLines.push(""); continue; }
    const words = line.split(/\s+/);
    let current = [];
    for (const w of words) {
      const trial = [...current, w].join(" ");
      if (current.length === 0) {
        if (measureTextWidth(w, sizePx, fontWeight, fontFamily, ctx) <= maxWidthPx) {
          current = [w];
        } else {
          // Слово длиннее контейнера — режем посимвольно
          let acc = "";
          for (const ch of w) {
          if (measureTextWidth(acc + ch, sizePx, fontWeight, fontFamily, ctx) <= maxWidthPx) {
              acc += ch;
            } else {
              if (acc) resultLines.push(acc);
              acc = ch;
            }
          }
          current = acc ? [acc] : [];
        }
      } else if (measureTextWidth(trial, sizePx, fontWeight, fontFamily, ctx) <= maxWidthPx) {
        current.push(w);
      } else {
        resultLines.push(current.join(" "));
        if (measureTextWidth(w, sizePx, fontWeight, fontFamily, ctx) > maxWidthPx) {
          let acc = "";
          for (const ch of w) {
            if (measureTextWidth(acc + ch, sizePx, fontWeight, fontFamily, ctx) <= maxWidthPx) {
              acc += ch;
            } else {
              if (acc) resultLines.push(acc);
              acc = ch;
            }
          }
          current = acc ? [acc] : [];
        } else {
          current = [w];
        }
      }
    }
    if (current.length) resultLines.push(current.join(" "));
  }
  return resultLines.length ? resultLines : [""];
}

/**
 * Подбирает размер шрифта (бинарным поиском) и список строк.
 * Точная JS-имитация бэкендного auto_fit_text из certificate_text.py.
 */
function _calcAutoFitFontSize(text, baseSizePx, maxWidthPx, maxHeightPx, fontWeight = "400", fontFamily = DEFAULT_FONT_FAMILY) {
  if (!_canvas || !text || maxWidthPx <= 0 || maxHeightPx <= 0) {
    return { size: baseSizePx, lines: [text] };
  }
  const ctx = _canvas.getContext("2d");
  const LINE_FACTOR = 1.25;
  const MIN_SIZE = 6;

  function fits(size) {
    const lines = wrapTextToWidth(text, size, maxWidthPx, fontWeight, fontFamily, ctx);
    const height = lines.length * size * LINE_FACTOR;
    return { ok: height <= maxHeightPx, lines };
  }

  // Быстрая проверка: вдруг базовый размер уже влезает?
  const { ok: okMax, lines: linesMax } = fits(baseSizePx);
  if (okMax) return { size: baseSizePx, lines: linesMax };

  // Бинарный поиск
  let lo = MIN_SIZE, hi = baseSizePx;
  let bestSize = MIN_SIZE, bestLines = [text];
  while (hi - lo > 0.25) {
    const mid = (lo + hi) / 2;
    const { ok, lines } = fits(mid);
    if (ok) { bestSize = mid; bestLines = lines; lo = mid; }
    else hi = mid;
  }
  // Финальная проверка
  if (bestLines.length === 1 && bestLines[0] === text) {
    const { lines } = fits(bestSize);
    bestLines = lines;
  }
  return { size: bestSize, lines: bestLines };
}

export default function AccuratePreview({
  bgUrl,
  elements,
  signers,
  signersLayout,
  margins,
  previewVariables, // { "ФИО": "...", "Мероприятие": "..." } — для реалистичного превью
  fontFaces = [],
  selectedElementId, // подсвеченный элемент
  onElementSelect,   // (id) => void — клик по элементу
  onElementMove,     // (id, newX%, newY%) => void — drag & drop
  onElementContextMenu, // (id, clientX, clientY) => void — правый клик
  onElementDoubleClick, // (id) => void — двойной клик → прокрутить к настройкам
  onSignersMove,       // (xMm, yMm) => void — drag блока подписантов
  showGrid = true,
  showSafeZone = true,
  showRulers = true,
  showVariableBadge: _showVariableBadge = false,
  maxWidth = 430,
  images = [],
  selectedImageId = null,
  onImageSelect,
  onImageMove,
  onImageContextMenu,
  selectedSignerId = null,
  onSignerSelect,
  onSignerMove,
  onSignerResize,
  onCanvasDeselect,
  showLiteralVariables = false, // если true — рендерим текст с {переменными} без подстановки
  onElementInlineEdit, // (id, newText) => void
  onElementResize, // (id, widthMm, heightMm) => void
  hideSigners = false,
}) {
  const previewFrameRef = useRef(null);
  const [previewWidthPx, setPreviewWidthPx] = useState(0);
  const [draggingElementId, setDraggingElementId] = useState(null);
  const [draggingImageId, setDraggingImageId] = useState(null);
  const [inlineEditingId, setInlineEditingId] = useState(null);
  const [inlineEditValue, setInlineEditValue] = useState("");
  const inlineEditRef = useRef(null);
  const imageDragRef = useRef({ active: false, id: null, startX: 0, startY: 0, origX: 0, origY: 0 });
  const resizeRef = useRef({ active: false, id: null, kind: null, handle: null, startX: 0, startY: 0, origBox: null, align: "center" });

  const commitInlineEdit = useCallback(() => {
    if (inlineEditingId == null) return;
    onElementInlineEdit?.(inlineEditingId, inlineEditValue);
    setInlineEditingId(null);
  }, [inlineEditingId, inlineEditValue, onElementInlineEdit, setInlineEditingId]);

  const startInlineEdit = useCallback((id, text) => {
    if (!onElementInlineEdit) return;
    setInlineEditValue(text || "");
    setInlineEditingId(id);
    requestAnimationFrame(() => {
      if (inlineEditRef.current) {
        inlineEditRef.current.focus();
        inlineEditRef.current.select();
      }
    });
  }, [onElementInlineEdit, setInlineEditValue, setInlineEditingId]);

  const handleCanvasPointerDown = useCallback((e) => {
    if (e.button !== 0) return;
    if (e.target?.closest?.("[data-canvas-item='true']")) return;
    onCanvasDeselect?.();
  }, [onCanvasDeselect]);

  const handleResizeStart = useCallback((e, kind, id, handle, box, align = "center") => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = {
      active: true, id, kind, handle,
      startX: e.clientX, startY: e.clientY,
      origBox: box,
      align,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const handleResizeMove = useCallback((e) => {
    const r = resizeRef.current;
    if (!r.active || !previewFrameRef.current) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = previewFrameRef.current.getBoundingClientRect();
    const dxMm = ((e.clientX - r.startX) / rect.width) * PAGE_W;
    const dyMm = ((e.clientY - r.startY) / rect.height) * PAGE_H;
    const isLineResize = r.kind === "image" && Number(r.origBox?.heightMm || 0) < 2;
    const resized = resizeBox({
      ...r.origBox,
      dxMm,
      dyMm,
      handle: r.handle,
      minWidthMm: r.kind === "signer" ? SIGNER_MIN_WIDTH_MM : r.kind === "image" ? (isLineResize ? 10 : IMAGE_MIN_SIZE_MM) : TEXT_MIN_WIDTH_MM,
      minHeightMm: r.kind === "signer" ? SIGNER_MIN_HEIGHT_MM : r.kind === "image" ? (isLineResize ? 0.2 : IMAGE_MIN_SIZE_MM) : TEXT_MIN_HEIGHT_MM,
    });

    if (r.kind === "signer") {
      onSignerResize?.(r.id, {
        xMm: resized.leftMm + resized.widthMm / 2,
        yMm: resized.topMm,
        widthMm: resized.widthMm,
        heightMm: resized.heightMm,
      });
      return;
    }

    if (r.kind === "image") {
      onElementResize?.(r.id, r.kind, {
        widthMm: resized.widthMm,
        heightMm: resized.heightMm,
        x: pctFromMm(resized.leftMm + resized.widthMm / 2, PAGE_W),
        y: pctFromMm(resized.topMm + resized.heightMm / 2, PAGE_H),
      });
      return;
    }

    onElementResize?.(r.id, r.kind, {
      maxWidthMm: resized.widthMm,
      maxHeightMm: resized.heightMm,
      x: pctFromMm(textAnchorMmFromBox(resized, r.align), PAGE_W),
      y: pctFromMm(resized.topMm + resized.heightMm / 2, PAGE_H),
    });
  }, [onElementResize, onSignerResize]);

  const handleResizeEnd = useCallback(() => {
    resizeRef.current.active = false;
  }, []);

  const handleImagePointerDown = useCallback((e, imgId, imgX, imgY) => {
    if (e.button !== 0 || !onImageMove) return;
    e.stopPropagation();
    e.preventDefault();
    onImageSelect?.(imgId);
    imageDragRef.current = { active: true, id: imgId, startX: e.clientX, startY: e.clientY, origX: imgX, origY: imgY };
    setDraggingImageId(imgId);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [onImageMove, onImageSelect]);

  const handleImagePointerMove = useCallback((e) => {
    const d = imageDragRef.current;
    if (!d.active || !previewFrameRef.current) return;
    const rect = previewFrameRef.current.getBoundingClientRect();
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const newX = d.origX + (dx / rect.width) * 100;
    const newY = d.origY + (dy / rect.height) * 100;
    onImageMove?.(d.id, Math.max(0, Math.min(100, newX)), Math.max(0, Math.min(100, newY)));
  }, [onImageMove]);

  const handleImagePointerUp = useCallback(() => {
    imageDragRef.current.active = false;
    setDraggingImageId(null);
  }, []);

  const handleImageContextMenu = useCallback((e, imgId) => {
    e.preventDefault();
    e.stopPropagation();
    onImageContextMenu?.(imgId, e.clientX, e.clientY);
  }, [onImageContextMenu]);

  // ── Drag & Drop state ───────────────────────────────────────────────────────
  const dragRef = useRef({ active: false, elId: null, startX: 0, startY: 0, origX: 0, origY: 0 });

  const handlePointerDown = useCallback((e, elId, elX, elY) => {
    if (e.button !== 0) return; // только левая кнопка
    e.stopPropagation();
    e.preventDefault();
    onElementSelect?.(elId);
    dragRef.current = { active: true, elId, startX: e.clientX, startY: e.clientY, origX: elX, origY: elY };
    setDraggingElementId(elId);
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [onElementSelect]);

  const handlePointerMove = useCallback((e) => {
    const d = dragRef.current;
    if (!d.active || !previewFrameRef.current) return;
    const rect = previewFrameRef.current.getBoundingClientRect();
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    const newX = d.origX + (dx / rect.width) * 100;
    const newY = d.origY + (dy / rect.height) * 100;
    onElementMove?.(d.elId, Math.max(0, Math.min(100, newX)), Math.max(0, Math.min(100, newY)));
  }, [onElementMove]);

  const handlePointerUp = useCallback(() => {
    dragRef.current.active = false;
    setDraggingElementId(null);
  }, []);

  const handleContextMenu = useCallback((e, elId) => {
    e.preventDefault();
    e.stopPropagation();
    onElementContextMenu?.(elId, e.clientX, e.clientY);
  }, [onElementContextMenu]);

  // ── Signer drag state ───────────────────────────────────────────────────────
  const signerDragRef = useRef({ active: false, id: null, startX: 0, startY: 0, origXmm: 0, origYmm: 0 });

  const handleSignerPointerDown = useCallback((e, signerId, xMm, yMm, isLocked) => {
    if (e.button !== 0 || isLocked || (!onSignerMove && !onSignersMove)) return;
    e.stopPropagation();
    e.preventDefault();
    onSignerSelect?.(signerId);
    signerDragRef.current = {
      active: true,
      id: signerId,
      startX: e.clientX,
      startY: e.clientY,
      origXmm: xMm,
      origYmm: yMm,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [onSignerMove, onSignerSelect, onSignersMove]);

  const handleSignerPointerMove = useCallback((e) => {
    const d = signerDragRef.current;
    if (!d.active || !previewFrameRef.current) return;
    const rect = previewFrameRef.current.getBoundingClientRect();
    const dxMm = ((e.clientX - d.startX) / rect.width) * PAGE_W;
    const dyMm = ((e.clientY - d.startY) / rect.height) * PAGE_H;
    const newXmm = Math.max(0, Math.min(PAGE_W, d.origXmm + dxMm));
    const newYmm = Math.max(0, Math.min(PAGE_H, d.origYmm + dyMm));
    if (onSignerMove) onSignerMove(d.id, newXmm, newYmm);
    else onSignersMove?.(newXmm, newYmm);
  }, [onSignerMove, onSignersMove]);

  const handleSignerPointerUp = useCallback(() => {
    signerDragRef.current.active = false;
  }, []);

  useEffect(() => {
    if (!previewFrameRef.current || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width || 0;
      setPreviewWidthPx(width);
    });
    observer.observe(previewFrameRef.current);
    return () => observer.disconnect();
  }, []);

  const previewScale = useMemo(() => {
    const naturalWidthPx = PAGE_W * MM_TO_CSS_PX;
    const widthPx = previewWidthPx || naturalWidthPx;
    return widthPx / naturalWidthPx;
  }, [previewWidthPx]);

  const fontFaceCss = useMemo(() => {
    return (fontFaces || [])
      .filter((font) => font?.font_family && font?.font_url)
      .map((font) => {
        const url = String(font.font_url).startsWith("http")
          ? font.font_url
          : `${API_BASE}${font.font_url}`;
        const family = String(font.font_family).replace(/"/g, "");
        return `@font-face{font-family:"${family}";src:url("${url}") format("truetype");font-display:swap;}`;
      })
      .join("\n");
  }, [fontFaces]);

  // Вычисляем безопасную зону в %
  const safePct = useMemo(() => ({
    xMin: (margins.left / PAGE_W) * 100,
    xMax: ((PAGE_W - margins.right) / PAGE_W) * 100,
    yMin: (margins.top / PAGE_H) * 100,
    yMax: ((PAGE_H - margins.bottom) / PAGE_H) * 100,
  }), [margins]);

  return (
    <div ref={previewFrameRef} onPointerDown={handleCanvasPointerDown} style={{
      width: "100%",
      aspectRatio: "210 / 297",
      maxWidth: maxWidth,
      position: "relative",
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: bgUrl ? "0 4px 24px rgba(0,0,0,0.18)" : "0 0 0 2px #E2E8F0",
      background: bgUrl ? "transparent" : "#ffffff",
      margin: "0 auto",
    }}>
      {fontFaceCss && <style>{fontFaceCss}</style>}
      {/* Фон — растягивается на весь контейнер */}
      {bgUrl ? (
        <img src={bgUrl} alt="Фон" style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%", objectFit: "fill",
        }} />
      ) : (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#94A3B8", fontSize: 15,
        }}>
          Загрузите фон
        </div>
      )}

      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}>
        {showGrid && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <svg width="100%" height="100%" viewBox="0 0 210 297" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <pattern id="grid10mm" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(25,120,156,0.08)" strokeWidth="0.25" />
                </pattern>
                <pattern id="grid50mm" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(25,120,156,0.18)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="210" height="297" fill="url(#grid10mm)" />
              <rect width="210" height="297" fill="url(#grid50mm)" />
            </svg>
            {showRulers && (
              <>
                <div style={{ position: "absolute", top: 5, left: 5, fontSize: "8px", color: "rgba(25,120,156,0.6)", fontWeight: "600" }}>
                  0 мм
                </div>
                <div style={{ position: "absolute", top: 5, left: "50%", transform: "translateX(-50%)", fontSize: "8px", color: "rgba(25,120,156,0.6)", fontWeight: "600" }}>
                  105 мм
                </div>
                <div style={{ position: "absolute", top: 5, right: 5, fontSize: "8px", color: "rgba(25,120,156,0.6)", fontWeight: "600" }}>
                  210 мм
                </div>
                <div style={{ position: "absolute", bottom: 5, left: 5, fontSize: "8px", color: "rgba(25,120,156,0.6)", fontWeight: "600" }}>
                  297 мм
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Изображения (печати, подписи, декор) */}
          {images.filter((img) => !img.hidden).map((img, imgIdx) => {
            const widthMm = Number(img.widthMm) || 40;
            const heightMm = Number(img.heightMm) || 25;
            const widthPct = (widthMm / PAGE_W) * 100;
            const heightPct = (heightMm / PAGE_H) * 100;
            const imageBox = {
              leftMm: (Number(img.x) / 100) * PAGE_W - widthMm / 2,
              topMm: (Number(img.y) / 100) * PAGE_H - heightMm / 2,
              widthMm,
              heightMm,
            };
            const opacity = img.opacity ?? 1;
            const isSelected = selectedImageId === img.id;
            const isLocked = !!img.locked;
            const dragAllowed = onImageMove && !isLocked;
            return (
              <div
                key={img.id}
                data-canvas-item="true"
                onPointerDown={dragAllowed ? (e) => handleImagePointerDown(e, img.id, img.x, img.y) : undefined}
                onPointerMove={dragAllowed ? handleImagePointerMove : undefined}
                onPointerUp={dragAllowed ? handleImagePointerUp : undefined}
                onClick={!dragAllowed ? () => onImageSelect?.(img.id) : undefined}
                onContextMenu={(e) => handleImageContextMenu(e, img.id)}
                style={{
                  position: "absolute",
                  left: `${img.x}%`,
                  top: `${img.y}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                  transform: "translate(-50%, -50%)",
                  opacity,
                  cursor: dragAllowed ? (draggingImageId === img.id ? "grabbing" : "grab") : (isLocked ? "not-allowed" : "default"),
                  pointerEvents: (onImageMove || onImageSelect) ? "auto" : "none",
                  userSelect: "none",
                  outline: isSelected
                    ? "2.5px solid rgba(25,120,156,0.85)"
                    : isLocked ? "1px dashed rgba(102,119,131,0.4)" : undefined,
                  outlineOffset: isSelected ? 3 : 0,
                  boxShadow: isSelected ? "0 0 12px rgba(25,120,156,0.28)" : undefined,
                  borderRadius: isSelected ? 4 : undefined,
                  zIndex: typeof img.zIndex === "number" ? img.zIndex : imgIdx + 1,
                }}
              >
                {img.kind === "line" ? (
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: "50%",
                      height: Math.max(1, Number(img.heightMm || 0.55) * MM_TO_CSS_PX * previewScale),
                      transform: "translateY(-50%)",
                      background: img.color || "#1e293b",
                      borderRadius: 999,
                      pointerEvents: "none",
                    }}
                  />
                ) : img.url ? (
                  <img
                    src={img.url}
                    alt={img.label || "изображение"}
                    draggable={false}
                    style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
                  />
                ) : (
                  <div style={{
                    width: "100%", height: "100%", display: "grid", placeItems: "center",
                    border: "1px dashed #9dbfca", borderRadius: 4, color: "#9dbfca",
                    fontSize: 11, background: "rgba(237,246,248,.6)",
                  }}>{img.label || "Изображение"}</div>
                )}
                {isSelected && onElementResize && !isLocked && (
                  <>
                    {RESIZE_HANDLES.map(([handle, pos, cursor]) => (
                      <span
                        key={handle}
                        data-resize-handle={handle}
                        onPointerDown={(e) => handleResizeStart(e, "image", img.id, handle, imageBox)}
                        onPointerMove={handleResizeMove}
                        onPointerUp={handleResizeEnd}
                        onPointerCancel={handleResizeEnd}
                        style={{
                          position: "absolute",
                          ...pos,
                          width: 12,
                          height: 12,
                          background: "#19789c",
                          border: "2px solid #fff",
                          borderRadius: 2,
                          cursor,
                          touchAction: "none",
                          zIndex: 999,
                          boxShadow: "0 1px 4px rgba(15,23,42,.18)",
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })}

          {/* Рабочая зона */}
          {showSafeZone && (
            <div style={{
              position: "absolute",
              left: `${safePct.xMin}%`, right: `${100 - safePct.xMax}%`,
              top: `${safePct.yMin}%`, bottom: `${100 - safePct.yMax}%`,
              border: "2px dashed rgba(25,120,156,0.45)", borderRadius: 3,
              pointerEvents: "none", boxSizing: "border-box",
            }} />
          )}

          {/* Текстовые элементы: resize меняет рамку, а не кегль */}
          {elements.filter((el) => !el.hidden).map((el, elIdx) => {
            const align = el.align || smartAlign(el.x, safePct.xMin, safePct.xMax);
            const xMm = (el.x / 100) * PAGE_W;
            const defaultMaxWidthMm = align === "center"
              ? Math.max(12, 2 * Math.min(xMm - margins.left - 2, (PAGE_W - margins.right) - xMm - 2))
              : align === "left"
                ? Math.max(12, (PAGE_W - margins.right) - xMm - 2)
                : Math.max(12, xMm - margins.left - 2);
            const maxWidthMm = Math.max(TEXT_MIN_WIDTH_MM, Math.min(Number(el.maxWidthMm) || defaultMaxWidthMm, PAGE_W));
            const scaledBase = el.size * PT_TO_CSS_PX * previewScale;
            const maxWPx = maxWidthMm * MM_TO_CSS_PX * previewScale;

            // В режиме редактирования показываем переменные как есть
            const resolvedText = showLiteralVariables
              ? (el.text || "")
              : applyPreviewVariables(el.text, previewVariables);
            const hasPlaceholder = (el.text || "").includes("{");
            const isLocked = !!el.locked;
            const dragAllowed = onElementMove && !isLocked;

            const yMm = (el.y / 100) * PAGE_H;
            const explicitHeightMm = Number(el.maxHeightMm) > 0 ? Number(el.maxHeightMm) : null;
            const maxWPxForFit = maxWPx / CANVAS_TO_REPORTLAB_FONT_RATIO;
            const displaySize = scaledBase;
            const displayLines = getTextLines(
              resolvedText,
              displaySize,
              maxWPxForFit,
              el.weight,
              el.fontFamily || DEFAULT_FONT_FAMILY,
            );
            const lineHeightValue = el.lineHeight || 1.25;
            const naturalHeightMm = Math.max(TEXT_MIN_HEIGHT_MM, displayLines.length * (Number(el.size) || 12) * PT_TO_MM * lineHeightValue);
            const boxHeightMm = Math.max(TEXT_MIN_HEIGHT_MM, explicitHeightMm || naturalHeightMm);
            const boxHeightPx = boxHeightMm * MM_TO_CSS_PX * previewScale;
            const elementBox = {
              leftMm: textLeftMmFromAnchor(xMm, maxWidthMm, align),
              topMm: yMm - boxHeightMm / 2,
              widthMm: maxWidthMm,
              heightMm: boxHeightMm,
            };

            const isEditing = inlineEditingId === el.id;
            const isSelected = selectedElementId === el.id;
            return (
              <div
                key={el.id}
                data-element-id={el.id}
                data-canvas-item="true"
                onPointerDown={dragAllowed && !isEditing ? (e) => handlePointerDown(e, el.id, el.x, el.y) : undefined}
                onPointerMove={dragAllowed && !isEditing ? handlePointerMove : undefined}
                onPointerUp={dragAllowed && !isEditing ? handlePointerUp : undefined}
                onClick={(!dragAllowed && !isEditing) ? () => onElementSelect?.(el.id) : undefined}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (onElementInlineEdit && !isLocked) {
                    startInlineEdit(el.id, el.text || "");
                  } else {
                    onElementDoubleClick?.(el.id);
                  }
                }}
                onContextMenu={(e) => handleContextMenu(e, el.id)}
                style={{
                  position: "absolute",
                  left: `${el.x}%`, top: `${el.y}%`,
                  transform: previewTransform(align),
                  fontSize: `${displaySize}px`,
                  color: el.color,
                  fontWeight: el.weight,
                  fontStyle: el.italic ? "italic" : "normal",
                  textDecoration: el.underline ? "underline" : "none",
                  fontFamily: fontStack(el.fontFamily),
                  width: `${maxWPx}px`,
                  height: explicitHeightMm ? `${boxHeightPx}px` : undefined,
                  textAlign: align,
                  pointerEvents: (onElementMove || onElementSelect || onElementInlineEdit) ? "auto" : "none",
                  cursor: isLocked ? "not-allowed" : (dragAllowed ? (draggingElementId === el.id ? "grabbing" : "grab") : "default"),
                  lineHeight: lineHeightValue,
                  padding: "0 1px",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  userSelect: "none",
                  // Подсвечиваем плейсхолдеры или выделенный элемент
                  outline: isSelected
                    ? "2.5px solid rgba(25,120,156,0.85)"
                    : hasPlaceholder ? "1.5px dashed rgba(25,120,156,0.55)" : (isLocked ? "1px dashed rgba(102,119,131,0.4)" : undefined),
                  background: hasPlaceholder && !isSelected ? "rgba(237,246,248,0.55)" : undefined,
                  outlineOffset: isSelected ? 3 : 2,
                  boxShadow: isSelected ? "0 0 12px rgba(25,120,156,0.28)" : undefined,
                  borderRadius: isSelected ? 4 : undefined,
                  transition: "outline 150ms, box-shadow 150ms",
                  zIndex: typeof el.zIndex === "number" ? el.zIndex : elIdx + 20,
                }}
              >
                {isEditing ? (
                  <textarea
                    ref={inlineEditRef}
                    value={inlineEditValue}
                    onChange={(e) => setInlineEditValue(e.target.value)}
                    onBlur={commitInlineEdit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitInlineEdit(); }
                      if (e.key === "Escape") { setInlineEditingId(null); }
                    }}
                    style={{
                      width: "100%", minHeight: "1.4em",
                      background: "rgba(255,255,255,0.95)",
                      border: "1px solid #19789c",
                      color: el.color,
                      fontWeight: el.weight,
                      fontStyle: el.italic ? "italic" : "normal",
                      textDecoration: el.underline ? "underline" : "none",
                      fontFamily: fontStack(el.fontFamily),
                      fontSize: "inherit",
                      lineHeight: lineHeightValue,
                      textAlign: align,
                      borderRadius: 3,
                      outline: "none",
                      resize: "none",
                      padding: "1px 3px",
                      boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <div style={{
                    height: explicitHeightMm ? "100%" : undefined,
                    overflow: explicitHeightMm ? "hidden" : "visible",
                  }}>
                    {displayLines.join("\n")}
                  </div>
                )}
                {isSelected && onElementResize && !isLocked && !isEditing && (
                  <>
                    {RESIZE_HANDLES.map(([handle, pos, cursor]) => (
                      <span
                        key={handle}
                        data-resize-handle={handle}
                        onPointerDown={(e) => handleResizeStart(e, "element", el.id, handle, elementBox, align)}
                        onPointerMove={handleResizeMove}
                        onPointerUp={handleResizeEnd}
                        onPointerCancel={handleResizeEnd}
                        style={{
                          position: "absolute",
                          ...pos,
                          width: 12,
                          height: 12,
                          background: "#19789c",
                          border: "2px solid #fff",
                          borderRadius: 2,
                          cursor,
                          touchAction: "none",
                          zIndex: 999,
                          boxShadow: "0 1px 4px rgba(15,23,42,.18)",
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })}

          {/* Блок подписантов — точное воспроизведение логики draw_signers_block из pdf_generator.py */}
          {!hideSigners && signers.map((s, i) => {
            if (s.hidden) return null;
            // ── Геометрия строки (мм → %) ─────────────────────────────────
            const xMm = Number(signersLayout.x_mm) || 105;
            const yMm = signersLayout.y_mm + i * signersLayout.row_h_mm + (Number(s.offsetY) || 0);
            const widthMm = Math.max(SIGNER_MIN_WIDTH_MM, Number(signersLayout.band_mm) || 168);
            const heightMm = Math.max(SIGNER_MIN_HEIGHT_MM, Number(signersLayout.row_h_mm) || 32);
            const topPct = (yMm / PAGE_H) * 100;
            const leftPct = ((xMm - widthMm / 2) / PAGE_W) * 100;
            const widthPct = (widthMm / PAGE_W) * 100;
            const rowHPct = (heightMm / PAGE_H) * 100;
            const signerBox = {
              leftMm: xMm - widthMm / 2,
              topMm: yMm,
              widthMm,
              heightMm,
            };

            // rowH в px для точных вычислений
            const rowHPx = heightMm * MM_TO_CSS_PX * previewScale;

            // Пропорции колонок (38 / 24 / 38)
            const FRAC_LEFT = 0.38;
            const FRAC_MID = 0.24;
            const FRAC_RIGHT = 0.38;

            const fontPt = Math.max(5, Math.min(72, Number(signersLayout.font_size) || 10));
            const fsPx = Math.max(6, fontPt * PT_TO_CSS_PX * previewScale);
            const lhPx = fsPx * 1.2; // line-height бэкенда

            // ── Факсимиле ─────────────────────────────────────────────────
            // box_w, box_h как в pdf_generator.py:
            //   box_w = mid_w - 2*pad  (pad=4pt ≈ незначительный, игнорируем в %  )
            //   box_h = row_h_pt * 0.92
            const facScale = Math.max(0.1, Number(s.facScale) || 1);
            // Смещение: в PDF oy вычитается (+oy сдвигает вверх в ReportLab → вниз в CSS)
            const facOffsetXPx = (Number(s.facOffsetX) || 0) * MM_TO_CSS_PX * previewScale;
            const facOffsetYPx = (Number(s.facOffsetY) || 0) * MM_TO_CSS_PX * previewScale; // oy вычитается → + в CSS
            const isSelected = selectedSignerId === s.id;
            const isLocked = !!s.locked;
            const dragAllowed = !isLocked && (onSignerMove || onSignersMove);
            const signerAlign = s.align || "split";
            const positionAlign = signerAlign === "split" ? "left" : signerAlign;
            const nameAlign = signerAlign === "split" ? "right" : signerAlign;

            return (
              <div
                key={s.id}
                data-canvas-item="true"
                onPointerDown={dragAllowed ? (e) => handleSignerPointerDown(e, s.id, xMm, yMm, isLocked) : (e) => { e.stopPropagation(); onSignerSelect?.(s.id); }}
                onPointerMove={dragAllowed ? handleSignerPointerMove : undefined}
                onPointerUp={dragAllowed ? handleSignerPointerUp : undefined}
                onPointerCancel={dragAllowed ? handleSignerPointerUp : undefined}
                style={{
                position: "absolute",
                top: `${topPct}%`,
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                height: `${Math.max(rowHPct, 2)}%`,
                pointerEvents: (onSignerSelect || onSignerMove || onSignersMove) ? "auto" : "none",
                cursor: isLocked ? "not-allowed" : (dragAllowed ? "grab" : "default"),
                boxSizing: "border-box",
                borderTop: s.showLine === false ? "0" : "1px dashed rgba(99,102,241,0.45)",
                outline: isSelected
                  ? "2.5px solid rgba(25,120,156,0.85)"
                  : isLocked ? "1px dashed rgba(102,119,131,0.4)" : undefined,
                outlineOffset: isSelected ? 3 : 0,
                boxShadow: isSelected ? "0 0 12px rgba(25,120,156,0.28)" : undefined,
                borderRadius: isSelected ? 4 : undefined,
                overflow: "visible",
                userSelect: "none",
                zIndex: typeof s.zIndex === "number" ? s.zIndex : 40 + i,
              }}>
                {/* ── Должность — левая колонка, выравнивание по левому краю ── */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${FRAC_LEFT * 100}%`,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: positionAlign === "right" ? "flex-end" : positionAlign === "center" ? "center" : "flex-start",
                  paddingTop: lhPx * 0.15,
                  paddingLeft: 4 * previewScale,
                  boxSizing: "border-box",
                }}>
                  <span style={{
                    fontSize: fsPx,
                    lineHeight: `${lhPx}px`,
                    color: signersLayout.position_color || signersLayout.text_color,
                    fontWeight: signersLayout.font_weight,
                    fontFamily: fontStack(signersLayout.font_family),
                    textAlign: positionAlign,
                    maxWidth: "100%",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    wordBreak: "break-word",
                  }}>
                    {s.position || "Должность"}
                  </span>
                </div>

                {/* ── Факсимиле — центр средней колонки (как в draw_signers_block) ── */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: `${FRAC_LEFT * 100}%`,
                  width: `${FRAC_MID * 100}%`,
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "visible",
                }}>
                  {s.facPreview ? (
                    <img
                      src={s.facPreview}
                      alt=""
                      style={{
                        maxWidth: "96%",
                        maxHeight: `${rowHPx * 0.92}px`,
                        objectFit: "contain",
                        display: "block",
                        transform: `translate(${facOffsetXPx}px, ${facOffsetYPx}px) scale(${facScale})`,
                        transformOrigin: "center center",
                      }}
                    />
                  ) : (
                    <span style={{
                      fontSize: fsPx * 1.4,
                      opacity: 0.22,
                      userSelect: "none",
                    }}>✒</span>
                  )}
                </div>

                {/* ── ФИО — правая колонка, выравнивание по правому краю ── */}
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: `${(FRAC_LEFT + FRAC_MID) * 100}%`,
                  width: `${FRAC_RIGHT * 100}%`,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: nameAlign === "left" ? "flex-start" : nameAlign === "center" ? "center" : "flex-end",
                  paddingTop: lhPx * 0.15,
                  paddingRight: 4 * previewScale,
                  boxSizing: "border-box",
                }}>
                  <span style={{
                    fontSize: fsPx,
                    lineHeight: `${lhPx}px`,
                    color: signersLayout.name_color || signersLayout.text_color,
                    fontWeight: signersLayout.font_weight,
                    fontFamily: fontStack(signersLayout.font_family),
                    textAlign: nameAlign,
                    maxWidth: "100%",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                    wordBreak: "break-word",
                  }}>
                    {s.fullName || "ФИО"}
                  </span>
                </div>

                {/* ── Номер подписанта как маленький бейдж у линии ── */}
                <div style={{
                  position: "absolute",
                  top: -1,
                  left: 0,
                  fontSize: Math.max(4, fsPx * 0.6),
                  color: "rgba(99,102,241,0.5)",
                  fontWeight: 700,
                  lineHeight: 1,
                  padding: "1px 2px",
                  userSelect: "none",
                  pointerEvents: "none",
                }}>
                  {i + 1}
                </div>
                {isSelected && !isLocked && onSignerResize && (
                  <>
                    {RESIZE_HANDLES.map(([handle, pos, cursor]) => (
                      <span
                        key={handle}
                        data-resize-handle={handle}
                        onPointerDown={(e) => handleResizeStart(e, "signer", s.id, handle, signerBox)}
                        onPointerMove={handleResizeMove}
                        onPointerUp={handleResizeEnd}
                        onPointerCancel={handleResizeEnd}
                        style={{
                          position: "absolute",
                          ...pos,
                          width: 12,
                          height: 12,
                          background: "#19789c",
                          border: "2px solid #fff",
                          borderRadius: 2,
                          cursor,
                          touchAction: "none",
                          zIndex: 999,
                          boxShadow: "0 1px 4px rgba(15,23,42,.18)",
                        }}
                      />
                    ))}
                  </>
                )}
              </div>
            );
          })}

          {/* Легенда блока подписантов (показывается если есть подписанты) */}
          {!hideSigners && signers.length > 0 && (() => {
            const topPct = (signersLayout.y_mm / PAGE_H) * 100;
            const leftPct = ((signersLayout.x_mm - signersLayout.band_mm / 2) / PAGE_W) * 100;
            const widthPct = (signersLayout.band_mm / PAGE_W) * 100;
            return (
              <div style={{
                position: "absolute",
                top: `${topPct}%`,
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                transform: "translateY(-100%)",
                display: "flex",
                pointerEvents: "none",
                paddingBottom: 1,
              }}>
                {[["38%", "Должность", "left"], ["24%", "Факс.", "center"], ["38%", "ФИО", "right"]].map(([w, label, align]) => (
                  <div key={label} style={{
                    width: w,
                    fontSize: Math.max(5, 7 * previewScale),
                    color: "rgba(99,102,241,0.55)",
                    textAlign: align,
                    padding: "0 2px",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    boxSizing: "border-box",
                  }}>{label}</div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
