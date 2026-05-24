import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { API_BASE } from "../../../constants/index.js";

const PAGE_W = 210; // мм
const PAGE_H = 297; // мм
const MM_TO_CSS_PX = 96 / 25.4;
const PT_TO_CSS_PX = 96 / 72;
const DEFAULT_FONT_FAMILY = "DejaVu";

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
  return text.replace(/\{([^}]+)\}/g, (match, inner) => {
    const key = inner.trim();
    const genderMatch = key.match(/^(?:род|пол|gender)\s*:\s*([^|{}]+)\|([^{}]+)$/i);
    if (genderMatch) {
      const gender = String(userVars?.__gender || userVars?.gender || userVars?.Пол || userVars?.пол || "").toLowerCase();
      return gender === "female" || gender === "женский" || gender === "ж" ? genderMatch[2].trim() : genderMatch[1].trim();
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
function calcAutoFitFontSize(text, baseSizePx, maxWidthPx, maxHeightPx, fontWeight = "400", fontFamily = DEFAULT_FONT_FAMILY) {
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
  gridVisible = true,
  zoom = 1,
  maxFrameWidth = 430,
  images = [], // дополнительные изображения (печать, подпись, логотип)
  onImageMove,
  onImageSelect,
  selectedImageId,
}) {
  const previewFrameRef = useRef(null);
  const [previewWidthPx, setPreviewWidthPx] = useState(0);
  const [draggingElementId, setDraggingElementId] = useState(null);

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

  // ── Signers drag state ───────────────────────────────────────────────────────
  const signersDragRef = useRef({ active: false, startX: 0, startY: 0, origXmm: 0, origYmm: 0 });

  const handleSignersPointerDown = useCallback((e) => {
    if (e.button !== 0 || !onSignersMove) return;
    e.stopPropagation();
    e.preventDefault();
    signersDragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origXmm: signersLayout.x_mm,
      origYmm: signersLayout.y_mm,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [onSignersMove, signersLayout]);

  const handleSignersPointerMove = useCallback((e) => {
    const d = signersDragRef.current;
    if (!d.active || !previewFrameRef.current) return;
    const rect = previewFrameRef.current.getBoundingClientRect();
    const dxMm = ((e.clientX - d.startX) / rect.width) * PAGE_W;
    const dyMm = ((e.clientY - d.startY) / rect.height) * PAGE_H;
    const newXmm = Math.max(0, Math.min(PAGE_W, d.origXmm + dxMm));
    const newYmm = Math.max(0, Math.min(PAGE_H, d.origYmm + dyMm));
    onSignersMove?.(newXmm, newYmm);
  }, [onSignersMove]);

  const handleSignersPointerUp = useCallback(() => {
    signersDragRef.current.active = false;
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
    <div ref={previewFrameRef} style={{
      width: `${Math.round(100 * zoom)}%`,
      aspectRatio: "210 / 297",
      maxWidth: maxFrameWidth ? maxFrameWidth * zoom : undefined,
      position: "relative",
      borderRadius: 8,
      overflow: "hidden",
      boxShadow: bgUrl ? "0 4px 24px rgba(0,0,0,0.18)" : "0 0 0 2px #E2E8F0",
      background: bgUrl ? "transparent" : "#FFFFFF",
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
        {gridVisible && (
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
          </div>
        )}

        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
          {/* Рабочая зона */}
          {gridVisible && (
            <div style={{
              position: "absolute",
              left: `${safePct.xMin}%`, right: `${100 - safePct.xMax}%`,
              top: `${safePct.yMin}%`, bottom: `${100 - safePct.yMax}%`,
              border: "1.5px dashed rgba(25,120,156,0.45)", borderRadius: 3,
              pointerEvents: "none", boxSizing: "border-box",
            }} />
          )}

          {/* Дополнительные изображения (печать, подпись, логотип) */}
          {images.map((img) => (
            <ImageOnCanvas
              key={img.id}
              img={img}
              isSelected={selectedImageId === img.id}
              onSelect={() => onImageSelect?.(img.id)}
              onMove={onImageMove}
              previewFrameRef={previewFrameRef}
            />
          ))}

          {/* Текстовые элементы с auto-shrink (точная имитация бэкенда) */}
          {elements.map((el) => {
            const align = el.align || smartAlign(el.x, safePct.xMin, safePct.xMax);
            const xMm = (el.x / 100) * PAGE_W;
            const defaultMaxWidthMm = align === "center"
              ? Math.max(12, 2 * Math.min(xMm - margins.left - 2, (PAGE_W - margins.right) - xMm - 2))
              : align === "left"
                ? Math.max(12, (PAGE_W - margins.right) - xMm - 2)
                : Math.max(12, xMm - margins.left - 2);
            const maxWidthMm = Math.min(el.maxWidthMm || defaultMaxWidthMm, defaultMaxWidthMm);
            const scaledBase = el.size * PT_TO_CSS_PX * previewScale;
            const maxWPx = maxWidthMm * MM_TO_CSS_PX * previewScale;

            // Подставляем переменные для реалистичного превью
            const resolvedText = applyPreviewVariables(el.text, previewVariables);
            const hasPlaceholder = el.text.includes("{");

            // Вычисляем авто-подгоночный размер с учётом переноса строк
            // (точная имитация бэкендного auto_fit_text)
            // CANVAS_TO_REPORTLAB_FONT_RATIO компенсирует разницу метрик:
            // браузерный Canvas (Arial) шире DejaVu в ReportLab на ~18-22%,
            // поэтому расширяем допустимую ширину, чтобы превью совпадало с PDF.
            const yMm = (el.y / 100) * PAGE_H;
            const maxHMm = Math.max(14, Math.min(el.maxHeightMm || (PAGE_H - margins.bottom - yMm - 2), PAGE_H - margins.bottom - yMm - 2));
            const maxHPx = maxHMm * MM_TO_CSS_PX * previewScale;
            const maxWPxForFit = maxWPx / CANVAS_TO_REPORTLAB_FONT_RATIO;
            const maxHPxForFit = maxHPx / CANVAS_TO_REPORTLAB_FONT_RATIO;
            const { size: displaySize, lines: displayLines } = calcAutoFitFontSize(
              resolvedText,
              scaledBase,
              maxWPxForFit,
              maxHPxForFit,
              el.weight,
              el.fontFamily || DEFAULT_FONT_FAMILY,
            );

            return (
              <div
                key={el.id}
                data-element-id={el.id}
                onPointerDown={(e) => handlePointerDown(e, el.id, el.x, el.y)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onDoubleClick={(e) => { e.stopPropagation(); onElementDoubleClick?.(el.id); }}
                onContextMenu={(e) => handleContextMenu(e, el.id)}
                style={{
                  position: "absolute",
                  left: `${el.x}%`, top: `${el.y}%`,
                  transform: previewTransform(align),
                  fontSize: `${displaySize}px`,
                  color: el.color,
                  fontWeight: el.weight,
                  fontFamily: fontStack(el.fontFamily),
                  width: `${maxWPx}px`,
                  textAlign: align,
                  pointerEvents: onElementMove ? "auto" : "none",
                  cursor: onElementMove ? (draggingElementId === el.id ? "grabbing" : "grab") : "default",
                  lineHeight: el.lineHeight || 1.25,
                  padding: "0 1px",
                  whiteSpace: "pre-wrap",
                  overflowWrap: "anywhere",
                  userSelect: "none",
                  // Подсвечиваем плейсхолдеры или выделенный элемент
                  outline: selectedElementId === el.id
                    ? "2.5px solid rgba(25,120,156,0.85)"
                    : hasPlaceholder ? "2px dashed rgba(239,68,68,0.55)" : undefined,
                  outlineOffset: selectedElementId === el.id ? 3 : 2,
                  boxShadow: selectedElementId === el.id ? "0 0 12px rgba(25,120,156,0.28)" : undefined,
                  borderRadius: selectedElementId === el.id ? 4 : undefined,
                  transition: "outline 150ms, box-shadow 150ms",
                  zIndex: selectedElementId === el.id ? 10 : 1,
                }}
              >
                {displayLines.join("\n")}
              </div>
            );
          })}

          {/* Блок подписантов — точное воспроизведение логики draw_signers_block из pdf_generator.py */}
          {signers.map((s, i) => {
            // ── Геометрия строки (мм → %) ─────────────────────────────────
            const yMm = signersLayout.y_mm + i * signersLayout.row_h_mm + (Number(s.offsetY) || 0);
            const topPct = (yMm / PAGE_H) * 100;
            const leftPct = ((signersLayout.x_mm - signersLayout.band_mm / 2) / PAGE_W) * 100;
            const widthPct = (signersLayout.band_mm / PAGE_W) * 100;
            const rowHPct = (signersLayout.row_h_mm / PAGE_H) * 100;

            // rowH в px для точных вычислений
            const rowHPx = signersLayout.row_h_mm * MM_TO_CSS_PX * previewScale;

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

            return (
              <div
                key={s.id}
                onPointerDown={i === 0 ? handleSignersPointerDown : undefined}
                onPointerMove={i === 0 ? handleSignersPointerMove : undefined}
                onPointerUp={i === 0 ? handleSignersPointerUp : undefined}
                style={{
                position: "absolute",
                top: `${topPct}%`,
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                height: `${Math.max(rowHPct, 2)}%`,
                pointerEvents: onSignersMove ? "auto" : "none",
                cursor: onSignersMove && i === 0 ? "move" : "default",
                boxSizing: "border-box",
                borderTop: onSignersMove && i === 0
                  ? "1.5px dashed rgba(59,130,246,0.55)"
                  : "1px dashed rgba(99,102,241,0.45)",
                overflow: "visible",
                userSelect: "none",
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
                  alignItems: "flex-start",
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
                    textAlign: "left",
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
                  alignItems: "flex-end",
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
                    textAlign: "right",
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
              </div>
            );
          })}

          {/* Легенда блока подписантов (показывается если есть подписанты) */}
          {signers.length > 0 && (() => {
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

function ImageOnCanvas({ img, isSelected, onSelect, onMove, previewFrameRef }) {
  const dragRef = useRef({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });
  const handleDown = (e) => {
    if (e.button !== 0 || !onMove) return;
    e.stopPropagation();
    e.preventDefault();
    onSelect?.();
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, origX: img.x, origY: img.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleMove = (e) => {
    const d = dragRef.current;
    if (!d.active || !previewFrameRef.current) return;
    const rect = previewFrameRef.current.getBoundingClientRect();
    const dx = ((e.clientX - d.startX) / rect.width) * 100;
    const dy = ((e.clientY - d.startY) / rect.height) * 100;
    onMove?.(img.id, Math.max(0, Math.min(100, d.origX + dx)), Math.max(0, Math.min(100, d.origY + dy)));
  };
  const handleUp = () => { dragRef.current.active = false; };
  return (
    <div
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      style={{
        position: "absolute",
        left: `${img.x}%`,
        top: `${img.y}%`,
        width: `${img.width || 25}%`,
        transform: "translate(-50%, -50%)",
        cursor: onMove ? "grab" : "default",
        outline: isSelected ? "2.5px solid rgba(25,120,156,0.85)" : "1px dashed rgba(25,120,156,0.35)",
        outlineOffset: 2,
        borderRadius: 4,
        opacity: img.opacity ?? 1,
        zIndex: isSelected ? 10 : 2,
        userSelect: "none",
      }}
    >
      <img
        src={img.url}
        alt={img.kind === "stamp" ? "Печать" : img.kind === "signature" ? "Подпись" : "Изображение"}
        draggable={false}
        style={{ width: "100%", height: "auto", display: "block", pointerEvents: "none" }}
      />
    </div>
  );
}
