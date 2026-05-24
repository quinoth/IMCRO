/**
 * TemplateConstructor — полный конструктор шаблонов.
 * Левая панель: настройки (скроллируется).
 * Правая панель: sticky-превью (всегда видно).
 *
 * Возможности:
 * - Загрузка существующего шаблона для редактирования
 * - Создание нового шаблона
 * - Атомарное сохранение (PUT /templates/{id}/full или POST /templates)
 * - Визуальные предупреждения вместо жёстких ограничений
 * - Containment Logic: умное выравнивание текста по краям рабочей зоны
 */
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../constants/index.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { authHeaders } from "../../utils/authHeaders.js";
import { isObjectUrl, revokeObjectUrl, stripObjectUrls } from "../../utils/objectUrls.js";
import AlertBanner from "./shared/AlertBanner.jsx";
import { cardStyle, inputStyle, labelStyle, sectionBox, dangerBtn } from "./shared/styles.js";
import AccuratePreview from "./shared/AccuratePreview.jsx";
import { smartAlign, clamp } from "./shared/previewMath.js";
import useHotkeys from "./shared/useHotkeys.js";
import ContextMenu from "./shared/ContextMenu.jsx";

const PAGE_W = 210; // мм
const PAGE_H = 297; // мм
const DEFAULT_FONT_FAMILY = "DejaVu";
const BUILTIN_FONTS = [
  { font_family: DEFAULT_FONT_FAMILY, font_url: "/static/fonts/DejaVuSans.ttf" },
  { font_family: "Roboto",            font_url: null },
  { font_family: "Montserrat",       font_url: null },
  { font_family: "Open Sans",        font_url: null },
  { font_family: "Playfair Display", font_url: null },
  { font_family: "Oswald",           font_url: null },
];
const QUICK_VARIABLES = ["ФИО", "Класс", "Школа", "Предмет", "Дата", "Мероприятие", "Награда"];
const QUICK_GENDER_VARIANTS = [
  { label: "ученику / ученице", value: "{род:ученику|ученице}" },
  { label: "награждён / награждена", value: "{род:награждён|награждена}" },
  { label: "победитель / победительница", value: "{род:победитель|победительница}" },
];

// Расширенный список для инлайн-пикера
const PICKER_VARIABLES = [
  { key: "ФИО",        desc: "Имя участника (автосклонение)" },
  { key: "Класс",      desc: "Класс или группа, напр. 8А" },
  { key: "Школа",      desc: "Название учебного заведения" },
  { key: "Предмет",    desc: "Учебный предмет или дисциплина" },
  { key: "Дата",       desc: "Дата мероприятия" },
  { key: "Мероприятие", desc: "Название олимпиады / конкурса" },
  { key: "Награда",    desc: "Тип награды: победитель, призёр…" },
];
const PICKER_GENDER_VARIANTS = [
  { label: "Награждён / Награждена",          value: "{род:Награждён|Награждена}" },
  { label: "Ученик / Ученица",                value: "{род:Ученик|Ученица}" },
  { label: "Победитель / Победительница",     value: "{род:Победитель|Победительница}" },
  { label: "Выпускник / Выпускница",          value: "{род:Выпускник|Выпускница}" },
  { label: "Отличник / Отличница",            value: "{род:Отличник|Отличница}" },
  { label: "Призёр / Призёрка",              value: "{род:Призёр|Призёрка}" },
  { label: "Участник / Участница",            value: "{род:Участник|Участница}" },
];

const VARIABLE_HINTS = {
  "ФИО": "Полное имя участника. Поддерживает склонение: {ФИО:дательный}. Подставляется из колонки «ФИО» в Excel.",
  "Класс": "Класс или группа участника, например: 8А, 10Б. Колонка «Класс» в Excel.",
  "Школа": "Название учебного заведения. Колонка «Школа» в Excel.",
  "Предмет": "Название предмета или дисциплины. Колонка «Предмет» в Excel.",
  "Дата": "Дата мероприятия. Вводится при генерации или в колонке «Дата» Excel.",
  "Мероприятие": "Название мероприятия, олимпиады, конкурса. Колонка «Мероприятие» в Excel.",
  "Награда": "Тип награды: победитель, призёр и т.д. Колонка «Награда» в Excel.",
};
const PREVIEW_STORAGE_PREFIX = "certificate-template-preview-vars:";
const DEFAULT_PREVIEW_VARIABLES = {
  "ФИО": "Григорьев Владислав Дмитриевич",
  "Мероприятие": "Всероссийская олимпиада по информатике",
};

function previewStorageKey(templateId) {
  return `${PREVIEW_STORAGE_PREFIX}${templateId}`;
}

function readStoredPreviewVariables(templateId) {
  if (!templateId || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(previewStorageKey(templateId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredPreviewVariables(templateId, placeholders, values) {
  if (!templateId || typeof window === "undefined") return;
  const picked = {};
  for (const key of placeholders) {
    picked[key] = values[key] ?? "";
  }
  window.localStorage.setItem(previewStorageKey(templateId), JSON.stringify(picked));
}

function normalizeFontOption(font) {
  if (!font?.font_family) return null;
  return {
    font_family: String(font.font_family).trim(),
    font_url: font.font_url || null,
  };
}

function mergeFontOptions(...groups) {
  const seen = new Set();
  const result = [];
  for (const group of groups) {
    for (const raw of group || []) {
      const font = normalizeFontOption(raw);
      if (!font || seen.has(font.font_family)) continue;
      seen.add(font.font_family);
      result.push(font);
    }
  }
  return result;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function hasRussianWord(text, pattern) {
  return new RegExp(`(^|[^а-яёa-z0-9_])(?:${pattern})($|[^а-яёa-z0-9_])`, "iu").test(text);
}

function isGenderVariantPlaceholder(key) {
  return /^(?:род|пол|gender)\s*:\s*[^|{}]+\|[^{}]+$/i.test(String(key || "").trim());
}

function getPreviewContext(elements) {
  const chunks = [...elements]
    .sort((a, b) => Number(a.y || 0) - Number(b.y || 0))
    .map((el) => String(el.text || "").replace(/\{[^}]+\}/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const joined = chunks.join(" ");
  return joined.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ").slice(0, 220);
}

function detectPreviewGender(fio) {
  const parts = String(fio || "").trim().split(/\s+/).filter(Boolean);
  const surname = (parts[0] || "").toLowerCase();
  const first = (parts[1] || parts[0] || "").toLowerCase();
  const patronymic = (parts[2] || "").toLowerCase();
  if (patronymic.endsWith("ич")) return "male";
  if (patronymic.endsWith("на")) return "female";
  if (surname.endsWith("ова") || surname.endsWith("ева") || surname.endsWith("ина") || surname.endsWith("ая")) return "female";
  if (first.endsWith("а") || first.endsWith("я")) return "female";
  if (surname.endsWith("ов") || surname.endsWith("ев") || surname.endsWith("ин") || surname.endsWith("ын")) return "male";
  return null;
}

function resolvePreviewDeclension(context, fio) {
  const text = normalizeText(context);
  let gender = null;
  if (hasRussianWord(text, "награжд[её]н")) gender = "male";
  if (hasRussianWord(text, "награждена")) gender = "female";
  gender = gender || detectPreviewGender(fio);
  const useDative = hasRussianWord(text, "вручается|выдан[ао]?|присуждается|предоставляется|адресуется");
  return { caseName: useDative ? "dative" : "nominative", gender };
}

function declinePreviewLastnameDative(lastname, gender) {
  const lower = String(lastname || "").toLowerCase();
  if (gender === "female") {
    if (lower.endsWith("ов") || lower.endsWith("ев") || lower.endsWith("ин") || lower.endsWith("ын")) return `${lastname}ой`;
    if (lower.endsWith("ский") || lower.endsWith("цкий")) return `${lastname.slice(0, -2)}ой`;
    if (lower.endsWith("ова") || lower.endsWith("ева") || lower.endsWith("ина")) return `${lastname.slice(0, -1)}ой`;
    if (lower.endsWith("ая")) return `${lastname.slice(0, -2)}ой`;
    if (lower.endsWith("яя")) return `${lastname.slice(0, -2)}ей`;
    return lastname;
  }
  if (lower.endsWith("ов") || lower.endsWith("ев") || lower.endsWith("ин") || lower.endsWith("ын")) return `${lastname}у`;
  if (lower.endsWith("ский") || lower.endsWith("цкий")) return `${lastname.slice(0, -2)}ому`;
  return lastname;
}

function declinePreviewNameDative(firstname, gender) {
  const lower = String(firstname || "").toLowerCase();
  if (gender === "female") {
    if (lower.endsWith("ия")) return `${firstname.slice(0, -1)}и`;
    if (lower.endsWith("а") || lower.endsWith("я")) return `${firstname.slice(0, -1)}е`;
    return firstname;
  }
  if (lower.endsWith("й") || lower.endsWith("ь")) return `${firstname.slice(0, -1)}ю`;
  if (lower.endsWith("а")) return `${firstname.slice(0, -1)}е`;
  return `${firstname}у`;
}

function declinePreviewPatronymicDative(patronymic, gender) {
  const lower = String(patronymic || "").toLowerCase();
  if (gender === "female" && lower.endsWith("на")) return `${patronymic.slice(0, -1)}е`;
  if (gender !== "female" && lower.endsWith("ич")) return `${patronymic}у`;
  return patronymic;
}

function declinePreviewFio(fio, caseName, gender) {
  const parts = String(fio || "").trim().split(/\s+/).filter(Boolean);
  if (caseName !== "dative" || parts.length < 2) return String(fio || "").trim();
  const declined = [
    declinePreviewLastnameDative(parts[0], gender),
    declinePreviewNameDative(parts[1], gender),
  ];
  if (parts[2]) declined.push(declinePreviewPatronymicDative(parts[2], gender));
  return declined.concat(parts.slice(3)).join(" ");
}

function applyGenderVariantsPreview(text, gender) {
  return String(text || "").replace(/\{([^}]+)\}/g, (match, inner) => {
    const key = inner.trim();
    const genderMatch = key.match(/^(?:род|пол|gender)\s*:\s*([^|{}]+)\|([^{}]+)$/i);
    if (!genderMatch) return match;
    return gender === "female" ? genderMatch[2].trim() : genderMatch[1].trim();
  });
}

// ── Маленькая подсказка-иконка ───────────────────────────────────────────────
function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 6 }}>
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        style={{
          width: 18, height: 18, borderRadius: "50%",
          background: "#E2E8F0", border: "none",
          color: "#64748B", fontSize: 11, fontWeight: 700,
          cursor: "help", lineHeight: 1,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          verticalAlign: "middle", fontFamily: "inherit",
        }}
        aria-label="Подсказка"
      >?</button>
      {show && (
        <div style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          bottom: "calc(100% + 8px)",
          background: "#0F172A",
          color: "#fff",
          fontSize: 12,
          lineHeight: 1.5,
          padding: "8px 12px",
          borderRadius: 8,
          width: 240,
          zIndex: 9999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
          pointerEvents: "none",
          whiteSpace: "normal",
        }}>
          {text}
          <div style={{
            position: "absolute",
            top: "100%", left: "50%",
            transform: "translateX(-50%)",
            border: "5px solid transparent",
            borderTopColor: "#0F172A",
          }} />
        </div>
      )}
    </span>
  );
}

// ── Компонент ───────────────────────────────────────────────────────────────

export default function TemplateConstructor({ templates, onTemplatesSaved }) {
  const navigate = useNavigate();
  // Режим: "new" | "edit"
  const [mode, setMode] = useState("new");
  const [editingId, setEditingId] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Метаданные шаблона
  const [name, setName] = useState("Новый шаблон");
  const [bgUrl, setBgUrl] = useState(null);       // URL уже загруженного фона
  const [bgFile, setBgFile] = useState(null);     // Файл для загрузки

  // Поля грамоты
  const [margins, setMargins] = useState({ left: 12, right: 12, top: 12, bottom: 12 });

  // Блок подписантов
  const [signersLayout, setSignersLayout] = useState({
    y_mm: 248, x_mm: 105, row_h_mm: 32, band_mm: 168,
    font_size: 10, text_color: "#1e293b", font_weight: "400",
    font_family: DEFAULT_FONT_FAMILY, position_color: "", name_color: "",
  });

  // Текстовые элементы
  const [elements, setElements] = useState([
    { id: 1, text: "ГРАМОТА", x: 50, y: 17, size: 28, color: "#004f75", weight: "700", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
    { id: 2, text: "НАГРАЖДАЕТСЯ", x: 50, y: 28, size: 34, color: "#17232b", weight: "700", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
    { id: 3, text: "{ФИО участника}", x: 50, y: 40, size: 34, color: "#19789c", weight: "700", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
    { id: 4, text: "{Название мероприятия}", x: 50, y: 52, size: 18, color: "#17232b", weight: "600", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
    { id: 5, text: "{Дата}", x: 33, y: 78, size: 12, color: "#17232b", weight: "400", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
    { id: 6, text: "Директор ИМЦРО", x: 66, y: 78, size: 12, color: "#17232b", weight: "400", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
    { id: 7, text: "Печать организации", x: 66, y: 72, size: 10, color: "#9dbfca", weight: "600", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
  ]);

  // Подписанты
  const [signers, setSigners] = useState([{
    id: "s1", position: "Директор ИМЦРО", fullName: "Печать организации",
    facFile: null, facPreview: null,
    offsetY: 0, facOffsetX: 0, facOffsetY: 0, facScale: 1,
  }]);

  const objectUrlsRef = useRef([]);
  const [saving, setSaving] = useState(false);
  const [uploadingFont, setUploadingFont] = useState(false);
  const [availableFonts, setAvailableFonts] = useState(BUILTIN_FONTS);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  // Переменные для превью — пользователь вводит значения для реалистичного предпросмотра
  const [previewVariables, setPreviewVariables] = useState(DEFAULT_PREVIEW_VARIABLES);

  // ── UX: выделение, контекстное меню, автосохранение ──────────────────────
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, elementId }
  const [autoSaveStatus, setAutoSaveStatus] = useState(""); // "", "saving", "saved"
  const autoSaveTimerRef = useRef(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const MAX_UNDO = 40;
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !window.localStorage.getItem("constructor-onboarding-v1-dismissed"); } catch { return true; }
  });
  // Инлайн-пикер переменных
  const [pickerOpenId, setPickerOpenId] = useState(null); // id элемента у которого открыт пикер
  const textareaRefs = useRef({}); // { [elId]: HTMLTextAreaElement }

  const bgInputRef = useRef(null);
  const bgDragCounter = useRef(0);
  const [bgDrag, setBgDrag] = useState(false);

  const createTrackedObjectUrl = useCallback((file) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    return url;
  }, []);

  useEffect(() => () => {
    objectUrlsRef.current.forEach(revokeObjectUrl);
    objectUrlsRef.current = [];
  }, []);

  // Вычисляем безопасную зону в %
  const safePct = useMemo(() => ({
    xMin: (margins.left / PAGE_W) * 100,
    xMax: ((PAGE_W - margins.right) / PAGE_W) * 100,
    yMin: (margins.top / PAGE_H) * 100,
    yMax: ((PAGE_H - margins.bottom) / PAGE_H) * 100,
  }), [margins]);

  // Авто-определяем плейсхолдеры из всех элементов
  const detectedPlaceholders = useMemo(() => {
    const found = new Set();
    for (const el of elements) {
      const matches = el.text.matchAll(/\{([^}]+)\}/g);
      for (const m of matches) {
        const key = m[1].trim();
        if (!isGenderVariantPlaceholder(key)) found.add(key);
      }
    }
    return [...found];
  }, [elements]);

  const fioDeclensionPreview = useMemo(() => {
    const originalFio = previewVariables["ФИО"] || previewVariables["фио"] || previewVariables.fio || DEFAULT_PREVIEW_VARIABLES["ФИО"];
    const context = getPreviewContext(elements);
    const resolved = resolvePreviewDeclension(context, originalFio);
    const declinedFio = declinePreviewFio(originalFio, resolved.caseName, resolved.gender);
    return {
      context,
      originalFio,
      declinedFio,
      caseLabel: resolved.caseName === "dative" ? "дательный падеж" : "именительный падеж",
      genderLabel: resolved.gender === "female" ? "женский род" : resolved.gender === "male" ? "мужской род" : "род не определён",
      gender: resolved.gender,
      changed: declinedFio !== originalFio,
    };
  }, [elements, previewVariables]);

  const effectivePreviewVariables = useMemo(() => ({
    ...previewVariables,
    __gender: fioDeclensionPreview.gender || "",
    "ФИО": fioDeclensionPreview.declinedFio,
    "фио": fioDeclensionPreview.declinedFio,
    fio: fioDeclensionPreview.declinedFio,
    FIO: fioDeclensionPreview.declinedFio,
  }), [previewVariables, fioDeclensionPreview]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/certificates/fonts`, { headers: authHeaders() })
      .then((res) => res.ok ? res.json() : Promise.reject(new Error("fonts")))
      .then((data) => {
        if (!cancelled) setAvailableFonts(mergeFontOptions(BUILTIN_FONTS, data.fonts));
      })
      .catch(() => {
        if (!cancelled) setAvailableFonts(BUILTIN_FONTS);
      });
    return () => { cancelled = true; };
  }, []);

  // При появлении нового плейсхолдера — добавляем пустое поле (пользователь заполнит сам)
  useEffect(() => {
    setPreviewVariables(prev => {
      const next = { ...prev };
      let changed = false;
      for (const key of detectedPlaceholders) {
        if (!(key in next)) { next[key] = ""; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [detectedPlaceholders]);

  // ── Загрузка шаблона для редактирования ──────────────────────────────────
  const loadTemplate = useCallback(async (id) => {
    if (!id) { resetToNew(); return; }
    setLoadingTemplate(true);
    try {
      const res = await fetch(`${API_BASE}/certificates/templates/${id}/full`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Не удалось загрузить шаблон"));
      const data = await res.json();
      const t = data.template;

      setMode("edit");
      setEditingId(id);
      setName(t.name);
      setBgUrl(t.background_url ? `${API_BASE}${t.background_url}` : null);
      setBgFile(null);
      setMargins({ left: t.margin_left_mm, right: t.margin_right_mm, top: t.margin_top_mm, bottom: t.margin_bottom_mm });
      setSignersLayout({
        y_mm: t.signers_y_mm, x_mm: t.signers_block_x_mm,
        row_h_mm: t.signers_row_height_mm, band_mm: t.signers_band_width_mm,
        font_size: t.signers_font_size, text_color: t.signers_text_color,
        font_weight: t.signers_font_weight,
        font_family: t.signers_font_family || DEFAULT_FONT_FAMILY,
        position_color: t.signers_position_color || "",
        name_color: t.signers_name_color || "",
      });

      // Конвертируем элементы из мм в %
      setElements(data.elements.map((el, i) => ({
        id: el.id || i + 1,
        text: el.text,
        x: (el.x_mm / PAGE_W) * 100,
        y: (el.y_mm / PAGE_H) * 100,
        size: el.font_size,
        color: el.color || "#0F172A",
        weight: el.font_weight || "400",
        fontFamily: el.font_family || DEFAULT_FONT_FAMILY,
        align: el.align,
        maxWidthMm: el.max_width_mm,
        maxHeightMm: el.max_height_mm,
      })));

      setPreviewVariables({
        ...DEFAULT_PREVIEW_VARIABLES,
        ...readStoredPreviewVariables(id),
      });

      setSigners(data.signers.length > 0 ? data.signers.map((s) => ({
        id: s.id,
        position: s.position,
        fullName: s.full_name,
        facFile: null,
        facPreview: s.facsimile_url ? `${API_BASE}${s.facsimile_url}` : null,
        facUrl: s.facsimile_url,
        offsetY: s.offset_y_mm,
        facOffsetX: s.facsimile_offset_x_mm,
        facOffsetY: s.facsimile_offset_y_mm,
        facScale: s.facsimile_scale,
      })) : [{
        id: "s1", position: "Директор", fullName: "",
        facFile: null, facPreview: null, offsetY: 0, facOffsetX: 0, facOffsetY: 0, facScale: 1,
      }]);

      setMsg(null);
    } catch (e) {
      setMsg(e.message); setMsgType("error");
    } finally {
      setLoadingTemplate(false);
    }
  }, []);

  const resetToNew = () => {
    setMode("new"); setEditingId(null);
    setName("Новый шаблон"); setBgUrl(null); setBgFile(null);
    setMargins({ left: 12, right: 12, top: 12, bottom: 12 });
    setSignersLayout({ y_mm: 248, x_mm: 105, row_h_mm: 32, band_mm: 168, font_size: 10, text_color: "#1e293b", font_weight: "400", font_family: DEFAULT_FONT_FAMILY, position_color: "", name_color: "" });
    setElements([
      { id: 1, text: "ГРАМОТА", x: 50, y: 17, size: 28, color: "#004f75", weight: "700", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
      { id: 2, text: "НАГРАЖДАЕТСЯ", x: 50, y: 28, size: 34, color: "#17232b", weight: "700", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
      { id: 3, text: "{ФИО участника}", x: 50, y: 40, size: 34, color: "#19789c", weight: "700", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
      { id: 4, text: "{Название мероприятия}", x: 50, y: 52, size: 18, color: "#17232b", weight: "600", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
      { id: 5, text: "{Дата}", x: 33, y: 78, size: 12, color: "#17232b", weight: "400", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
      { id: 6, text: "Директор ИМЦРО", x: 66, y: 78, size: 12, color: "#17232b", weight: "400", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
      { id: 7, text: "Печать организации", x: 66, y: 72, size: 10, color: "#9dbfca", weight: "600", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
    ]);
    setPreviewVariables(DEFAULT_PREVIEW_VARIABLES);
    setSigners([{ id: "s1", position: "Директор ИМЦРО", fullName: "Печать организации", facFile: null, facPreview: null, offsetY: 0, facOffsetX: 0, facOffsetY: 0, facScale: 1 }]);
    setMsg(null);
  };

  const handleDeleteTemplate = async () => {
    if (!editingId) return;
    if (!window.confirm(`Удалить шаблон «${name}»? Это действие нельзя отменить.`)) return;

    setLoadingTemplate(true);
    setMsg(null);
    try {
      const res = await fetch(`${API_BASE}/certificates/templates/${editingId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Не удалось удалить шаблон"));

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(previewStorageKey(editingId));
      }
      resetToNew();
      setMsg("Шаблон удалён");
      setMsgType("success");
      onTemplatesSaved?.();
    } catch (e) {
      setMsg(e.message || "Не удалось удалить шаблон");
      setMsgType("error");
    } finally {
      setLoadingTemplate(false);
    }
  };

  // ── Элементы ──────────────────────────────────────────────────────────────
  const addElement = () => {
    const newId = Math.max(0, ...elements.map((e) => e.id)) + 1;
    const cx = (safePct.xMin + safePct.xMax) / 2;
    const cy = (safePct.yMin + safePct.yMax) / 2;
    setElements((prev) => [...prev, { id: newId, text: "Новый текст", x: cx, y: cy, size: 24, color: "#000000", weight: "400", fontFamily: DEFAULT_FONT_FAMILY, maxWidthMm: null }]);
  };
  const insertVariableBlock = (key) => {
    const newId = Math.max(0, ...elements.map((e) => e.id)) + 1;
    const cx = (safePct.xMin + safePct.xMax) / 2;
    const cy = Math.min(safePct.yMax, Math.max(safePct.yMin, 44 + (detectedPlaceholders.length % 4) * 6));
    setElements((prev) => [...prev, {
      id: newId,
      text: `{${key}}`,
      x: cx,
      y: cy,
      size: key === "ФИО" ? 34 : 20,
      color: key === "ФИО" ? "#19789c" : "#334155",
      weight: key === "ФИО" ? "700" : "500",
      fontFamily: DEFAULT_FONT_FAMILY,
      maxWidthMm: null,
    }]);
  };

  const insertGenderVariantBlock = (variantText) => {
    const newId = Math.max(0, ...elements.map((e) => e.id)) + 1;
    const cx = (safePct.xMin + safePct.xMax) / 2;
    const cy = Math.min(safePct.yMax, Math.max(safePct.yMin, 50 + (elements.length % 4) * 6));
    setElements((prev) => [...prev, {
      id: newId,
      text: variantText,
      x: cx,
      y: cy,
      size: 18,
      color: "#475569",
      weight: "400",
      fontFamily: DEFAULT_FONT_FAMILY,
      maxWidthMm: 168,
    }]);
  };

  /** Вставить текст в позицию курсора выбранного textarea */
  const insertAtCursor = useCallback((elId, insertText) => {
    const ta = textareaRefs.current[elId];
    setElements((prev) => {
      const el = prev.find((e) => e.id === elId);
      if (!el) return prev;
      let newText;
      if (ta && document.activeElement === ta) {
        const start = ta.selectionStart ?? ta.value.length;
        const end = ta.selectionEnd ?? ta.value.length;
        newText = ta.value.slice(0, start) + insertText + ta.value.slice(end);
        requestAnimationFrame(() => {
          ta.focus();
          const pos = start + insertText.length;
          ta.setSelectionRange(pos, pos);
        });
      } else {
        newText = (el.text || "") + insertText;
      }
      return prev.map((e) => e.id === elId ? { ...e, text: newText } : e);
    });
    setPickerOpenId(null);
  }, []);

  const updateEl = (id, field, val) => setElements((prev) => prev.map((e) => e.id === id ? { ...e, [field]: val } : e));
  const removeEl = (id) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  /** Дублирование элемента */
  const duplicateEl = (id) => {
    setElements((prev) => {
      const src = prev.find((e) => e.id === id);
      if (!src) return prev;
      const newId = Math.max(0, ...prev.map((e) => e.id)) + 1;
      return [...prev, { ...src, id: newId, y: Math.min(safePct.yMax, src.y + 3) }];
    });
  };

  /** Выравнивание элемента по центру X */
  const centerEl = (id) => {
    const cx = (safePct.xMin + safePct.xMax) / 2;
    updateEl(id, "x", cx);
  };

  /** Drag & Drop: обновление позиции элемента из превью */
  const handleElementMove = useCallback((id, newX, newY) => {
    const clampedX = clamp(newX, safePct.xMin, safePct.xMax);
    const clampedY = clamp(newY, safePct.yMin, safePct.yMax);
    setElements((prev) => prev.map((e) => e.id === id ? { ...e, x: clampedX, y: clampedY } : e));
  }, [safePct]);

  /** Контекстное меню: правый клик на элементе в превью */
  const handleElementContextMenu = useCallback((id, clientX, clientY) => {
    setSelectedElementId(id);
    setCtxMenu({ x: clientX, y: clientY, elementId: id });
  }, []);

  /** Drag блока подписантов на превью */
  const handleSignersMove = useCallback((newXmm, newYmm) => {
    setSignersLayout((p) => ({
      ...p,
      x_mm: Math.round(newXmm * 10) / 10,
      y_mm: Math.round(newYmm * 10) / 10,
    }));
  }, []);

  // ── Undo / Redo (snapshot elements) ─────────────────────────────────────
  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-(MAX_UNDO - 1)), JSON.stringify(elements)]);
    setRedoStack([]);
  }, [elements]);

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[prev.length - 1];
      setRedoStack((r) => [...r, JSON.stringify(elements)]);
      setElements(JSON.parse(snapshot));
      return prev.slice(0, -1);
    });
  }, [elements]);

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const snapshot = prev[prev.length - 1];
      setUndoStack((u) => [...u, JSON.stringify(elements)]);
      setElements(JSON.parse(snapshot));
      return prev.slice(0, -1);
    });
  }, [elements]);

  // ── Двойной клик → прокрутить к карточке элемента ───────────────────────
  const handleElementDoubleClick = useCallback((id) => {
    setSelectedElementId(id);
    setTimeout(() => {
      const card = document.querySelector(`[data-element-card-id="${id}"]`);
      if (!card) return;
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      card.setAttribute("data-pulsing", "1");
      setTimeout(() => card.removeAttribute("data-pulsing"), 900);
    }, 50);
  }, []);

  // ── Hotkeys ─────────────────────────────────────────────────────────────
  useHotkeys({
    "ctrl+z": () => undo(),
    "ctrl+shift+z": () => redo(),
    "ctrl+s": () => { handleSave(); },
    "delete": () => { if (selectedElementId) { pushUndo(); removeEl(selectedElementId); } },
    "ctrl+d": () => { if (selectedElementId) { pushUndo(); duplicateEl(selectedElementId); } },
    "escape": () => { setSelectedElementId(null); setCtxMenu(null); setPickerOpenId(null); },
  });

  // Закрываем пикер по клику вне — bubble-phase на document (capture вызывал гонку с onClick кнопок)
  useEffect(() => {
    if (!pickerOpenId) return;
    const handleClick = () => setPickerOpenId(null);
    const handleKey = (e) => { if (e.key === "Escape") setPickerOpenId(null); };
    document.addEventListener("click", handleClick);        // bubble — пикер сам stopPropagation-ит внутренние клики
    window.addEventListener("keydown", handleKey, true);    // capture — чтобы Escape всегда работал
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKey, true);
    };
  }, [pickerOpenId]);

  // ── Автосохранение (localStorage backup, каждые 15с) ─────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `cert-constructor-autosave:${editingId || "new"}`;
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        const snapshot = JSON.stringify(stripObjectUrls({ name, elements, signers, margins, signersLayout, bgUrl }));
        window.localStorage.setItem(key, snapshot);
        setAutoSaveStatus("saved");
        setTimeout(() => setAutoSaveStatus(""), 2000);
      } catch { /* ignore */ }
    }, 15000);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [name, elements, signers, margins, signersLayout, bgUrl, editingId]);

  // ── Подписанты ────────────────────────────────────────────────────────────
  const addSigner = () => {
    if (signers.length >= 3) return;
    setSigners((prev) => [...prev, { id: `s_${Date.now()}`, position: "Должность", fullName: "", facFile: null, facPreview: null, offsetY: 0, facOffsetX: 0, facOffsetY: 0, facScale: 1 }]);
  };
  const updateSigner = (id, field, val) => setSigners((prev) => prev.map((s) => s.id === id ? { ...s, [field]: val } : s));
  const removeSigner = (id) => setSigners((prev) => prev.length > 1 ? prev.filter((s) => s.id !== id) : prev);

  /** Простая загрузка факсимиле — локальный blob-превью без сетевых вызовов */
  const handleFacsimile = (id, e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSigners((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      if (s.facPreview && s.facFile) revokeObjectUrl(s.facPreview);
      return { ...s, facFile: file, facPreview: createTrackedObjectUrl(file), facUrl: null };
    }));
    // Сбрасываем значение input, чтобы можно было загрузить тот же файл ещё раз
    e.target.value = "";
  };

  /** Удалить факсимиле */
  const clearFacsimile = (id) => {
    if (!window.confirm("Удалить факсимиле этого подписанта?")) return;
    setSigners((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      if (s.facPreview && s.facFile) revokeObjectUrl(s.facPreview);
      return { ...s, facFile: null, facPreview: null, facUrl: null };
    }));
  };

  const handleFontUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["ttf", "otf"].includes(ext)) {
      setMsg("Загрузите файл шрифта .ttf или .otf");
      setMsgType("error");
      return;
    }

    setUploadingFont(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API_BASE}/certificates/upload-font`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Ошибка загрузки шрифта"));
      const uploaded = await res.json();
      setAvailableFonts((prev) => mergeFontOptions(prev, [uploaded]));
      setMsg(`Шрифт «${uploaded.font_family}» загружен`);
      setMsgType("success");
    } catch (err) {
      setMsg(err.message || "Не удалось загрузить шрифт");
      setMsgType("error");
    } finally {
      setUploadingFont(false);
    }
  };

  // ── Сохранение ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true); setMsg(null);
    try {
      // 1. Загружаем фон если новый файл
      let finalBgUrl = bgUrl?.startsWith("blob:") || bgFile ? null : (bgUrl?.replace(API_BASE, "") || null);
      if (bgFile) {
        const fd = new FormData(); fd.append("file", bgFile);
        const r = await fetch(`${API_BASE}/certificates/upload-background`, {
          method: "POST",
          headers: authHeaders(),
          body: fd,
        });
        if (!r.ok) throw new Error(await getApiErrorMessage(r, "Ошибка загрузки фона"));
        finalBgUrl = (await r.json()).background_url;
      }

      // 2. Загружаем факсимиле для новых подписантов
      const signersData = [];
      for (let i = 0; i < Math.min(signers.length, 3); i++) {
        const s = signers[i];
        let facUrl = s.facUrl || null;
        if (s.facFile) {
          const fd = new FormData(); fd.append("file", s.facFile);
          const r = await fetch(`${API_BASE}/certificates/upload-facsimile`, {
            method: "POST",
            headers: authHeaders(),
            body: fd,
          });
          if (!r.ok) throw new Error(await getApiErrorMessage(r, "Ошибка загрузки факсимиле"));
          facUrl = (await r.json()).facsimile_url;
        }
        signersData.push({
          order: i + 1,
          position: (s.position || "").trim() || "—",
          full_name: (s.fullName || "").trim() || "—",
          facsimile_url: facUrl,
          offset_y_mm: Number(s.offsetY) || 0,
          facsimile_offset_x_mm: Number(s.facOffsetX) || 0,
          facsimile_offset_y_mm: Number(s.facOffsetY) || 0,
          facsimile_scale: Math.min(5, Math.max(0.1, Number(s.facScale) || 1)),
        });
      }

      // 3. Конвертируем элементы из % в мм
      const elementsData = elements.map((el) => {
        const align = el.align || smartAlign(el.x, safePct.xMin, safePct.xMax);
        return {
          text: el.text,
          is_variable: el.text.includes("{"),
          x_mm: (el.x / 100) * PAGE_W,
          y_mm: (el.y / 100) * PAGE_H,
          font_size: el.size,
          color: el.color,
          font_weight: el.weight,
          font_family: el.fontFamily || DEFAULT_FONT_FAMILY,
          align,
          max_width_mm: el.maxWidthMm ? Number(el.maxWidthMm) : null,
          max_height_mm: el.maxHeightMm ? Number(el.maxHeightMm) : null,
        };
      });

      const payload = {
        name, background_url: finalBgUrl,
        signers_y_mm: signersLayout.y_mm, signers_block_x_mm: signersLayout.x_mm,
        signers_row_height_mm: signersLayout.row_h_mm, signers_band_width_mm: signersLayout.band_mm,
        signers_font_size: signersLayout.font_size, signers_text_color: signersLayout.text_color,
        signers_font_weight: signersLayout.font_weight,
        signers_font_family: signersLayout.font_family || DEFAULT_FONT_FAMILY,
        signers_position_color: signersLayout.position_color || null,
        signers_name_color: signersLayout.name_color || null,
        margin_left_mm: margins.left, margin_right_mm: margins.right,
        margin_top_mm: margins.top, margin_bottom_mm: margins.bottom,
        elements: elementsData, signers: signersData,
      };

      let res;
      if (mode === "edit" && editingId) {
        // Атомарное обновление
        res = await fetch(`${API_BASE}/certificates/templates/${editingId}/full`, {
          method: "PUT", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(payload),
        });
      } else {
        // Атомарное создание нового шаблона
        res = await fetch(`${API_BASE}/certificates/templates/full`, {
          method: "POST", headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setMode("edit"); setEditingId(created.template.id);
          writeStoredPreviewVariables(created.template.id, detectedPlaceholders, previewVariables);
          setMsg("Шаблон создан и сохранён!"); setMsgType("success");
          onTemplatesSaved?.();
          return;
        }
      }

      if (!res.ok) {
        throw new Error(await getApiErrorMessage(res, "Ошибка сохранения"));
      }
      if (mode === "edit" && editingId) {
        writeStoredPreviewVariables(editingId, detectedPlaceholders, previewVariables);
      }
      setMsg(mode === "edit" ? "Шаблон обновлён!" : "Шаблон сохранён!"); setMsgType("success");
      onTemplatesSaved?.();
    } catch (e) {
      setMsg(e.message || "Ошибка сохранения"); setMsgType("error");
    } finally {
      setSaving(false);
    }
  };

  const selectedElement = elements.find((element) => element.id === selectedElementId) || elements[0] || null;
  const selectedAlign = selectedElement?.align || smartAlign(selectedElement?.x || 50, safePct.xMin, safePct.xMax);
  const addPresetBlock = (key) => {
    pushUndo();
    insertVariableBlock(key);
  };
  const addDecorBlock = (text, overrides = {}) => {
    pushUndo();
    const newId = Math.max(0, ...elements.map((e) => e.id)) + 1;
    setElements((prev) => [...prev, {
      id: newId,
      text,
      x: overrides.x ?? 50,
      y: overrides.y ?? 64,
      size: overrides.size ?? 16,
      color: overrides.color ?? "#17232b",
      weight: overrides.weight ?? "400",
      fontFamily: DEFAULT_FONT_FAMILY,
      align: overrides.align ?? "center",
      maxWidthMm: overrides.maxWidthMm ?? 160,
      maxHeightMm: overrides.maxHeightMm ?? null,
    }]);
    setSelectedElementId(newId);
  };
  const updateSelectedElement = (field, value) => {
    if (!selectedElement) return;
    updateEl(selectedElement.id, field, value);
  };
  const handleCanvasPreview = () => {
    setMsg("Предпросмотр обновляется на холсте в реальном времени.");
    setMsgType("info");
  };
  const visibleVariables = detectedPlaceholders.length
    ? detectedPlaceholders
    : ["ФИО участника", "Название мероприятия", "Дата", "Достижение"];

  return (
    <section
      className="template-workbench"
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && ["s", "d", "z"].includes(event.key.toLowerCase())) {
          event.preventDefault();
        }
      }}
    >
      <style>{`
        .template-workbench {
          --tpl-primary: #19789c;
          --tpl-primary-dark: #004f75;
          --tpl-border: #cdd8df;
          --tpl-soft: #f4f8fa;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          grid-template-rows: auto minmax(0, 1fr);
          gap: 0;
          margin: 0;
          background: #f8fbfc;
          border-top: 1px solid var(--tpl-border);
          overflow: hidden;
        }
        .template-toolbar {
          grid-column: 1 / -1;
          min-height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 24px;
          border-bottom: 1px solid var(--tpl-border);
          background: #fff;
        }
        .template-toolbar-left,
        .template-toolbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .template-toolbar-left {
          min-width: 0;
          flex: 1;
        }
        .template-toolbar strong {
          color: var(--tpl-primary-dark);
          font-size: 20px;
          font-weight: 950;
        }
        .template-title-input {
          width: min(380px, 42vw);
          min-width: 220px;
          font-weight: 850;
        }
        .template-select,
        .template-input,
        .template-props input,
        .template-props select {
          min-height: 40px;
          border: 1px solid #d6e0e6;
          border-radius: 8px;
          background: #fff;
          color: #17232b;
          font: inherit;
          font-size: 14px;
          padding: 0 12px;
          outline: 0;
        }
        .template-input {
          width: 100%;
        }
        .template-tool-button {
          min-height: 40px;
          border-radius: 8px;
          border: 1px solid var(--tpl-primary);
          background: #fff;
          color: var(--tpl-primary-dark);
          padding: 0 16px;
          font: inherit;
          font-size: 14px;
          font-weight: 850;
          cursor: pointer;
        }
        .template-tool-button.icon {
          width: 40px;
          padding: 0;
        }
        .template-tool-button.primary {
          background: var(--tpl-primary);
          color: #fff;
          box-shadow: 0 10px 22px rgba(25, 120, 156, .22);
        }
        .template-tool-button:disabled {
          opacity: .55;
          cursor: not-allowed;
          box-shadow: none;
        }
        .template-side {
          min-height: 0;
          border-right: 1px solid var(--tpl-border);
          background: #fff;
          overflow: auto;
        }
        .template-panel {
          padding: 16px 18px;
          border-bottom: 1px solid var(--tpl-border);
        }
        .template-panel h3 {
          margin: 0 0 14px;
          color: #17232b;
          font-size: 14px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .template-action-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          margin-top: 10px;
        }
        .template-action-grid .template-tool-button {
          width: 100%;
          justify-content: flex-start;
          text-align: left;
        }
        .template-variable-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .template-variable-chip {
          border: 1px solid #cfe0e7;
          border-radius: 999px;
          background: #edf6f8;
          color: var(--tpl-primary-dark);
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 850;
          cursor: pointer;
        }
        .template-variable-chip:hover {
          border-color: var(--tpl-primary);
          background: #e3f1f5;
        }
        .template-block-list {
          display: grid;
          gap: 10px;
        }
        .template-block-button {
          min-height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border: 1px solid #d6e0e6;
          border-radius: 8px;
          background: #fff;
          color: #17232b;
          padding: 0 14px;
          font: inherit;
          font-weight: 800;
          cursor: pointer;
        }
        .template-block-button.is-active {
          border-color: var(--tpl-primary);
          background: #edf6f8;
          color: var(--tpl-primary-dark);
        }
        .template-block-button small {
          color: #667783;
          font-size: 11px;
          font-weight: 850;
        }
        .template-add {
          border-style: dashed;
          justify-content: center;
          color: var(--tpl-primary-dark);
        }
        .template-props {
          display: grid;
          gap: 12px;
        }
        .template-props label {
          display: grid;
          gap: 6px;
          color: #52636d;
          font-size: 12px;
          font-weight: 850;
        }
        .template-prop-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .template-inline-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .template-inline-toggle button {
          min-height: 34px;
          border: 1px solid #d6e0e6;
          border-radius: 8px;
          background: #fff;
          color: #334155;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }
        .template-inline-toggle button.is-active {
          border-color: var(--tpl-primary);
          background: #edf6f8;
          color: var(--tpl-primary-dark);
        }
        .template-color-row {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 8px;
        }
        .template-props input[type="color"] {
          width: 42px;
          padding: 2px;
        }
        .template-align {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          padding: 4px;
          border: 1px solid #d6e0e6;
          border-radius: 8px;
          background: #f0f4f6;
        }
        .template-align button {
          min-height: 34px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          font: inherit;
          font-weight: 900;
          cursor: pointer;
        }
        .template-align button.is-active {
          background: #fff;
          color: var(--tpl-primary-dark);
          box-shadow: 0 4px 12px rgba(15, 23, 42, .08);
        }
        .template-canvas-area {
          min-width: 0;
          min-height: 0;
          overflow: auto;
          background-color: #f5f8fa;
          background-image: radial-gradient(#8fb3bf 1px, transparent 1px);
          background-size: 22px 22px;
          padding: 46px;
        }
        .template-canvas-frame {
          width: clamp(420px, 68vh, 760px);
          margin: 0 auto;
          border: 1px solid #cdd8df;
          background: #fff;
          box-shadow: 0 24px 58px rgba(15, 23, 42, .14);
          padding: 24px;
        }
        .template-message {
          margin-top: 12px;
        }
        @media (max-width: 820px) {
          .template-workbench {
            grid-template-columns: 1fr;
            margin: -16px;
          }
          .template-side {
            border-right: 0;
          }
          .template-canvas-area {
            padding: 22px;
          }
        }
      `}</style>

      <div className="template-toolbar">
        <div className="template-toolbar-left">
          <button type="button" className="template-tool-button" onClick={() => navigate("/admin/certificates")}>
            Назад
          </button>
          <strong>Конструктор шаблонов</strong>
          <input className="template-input template-title-input" value={name} onChange={(event) => setName(event.target.value)} aria-label="Название шаблона" />
          <select
            className="template-select"
            value={editingId ?? ""}
            disabled={loadingTemplate}
            onChange={(event) => loadTemplate(Number(event.target.value) || null)}
            aria-label="Загрузить существующий шаблон"
          >
            <option value="">Новый шаблон</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
        </div>
        <div className="template-toolbar-actions">
          <input
            ref={bgInputRef}
            type="file"
            accept="image/png,image/jpeg"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              if (isObjectUrl(bgUrl)) revokeObjectUrl(bgUrl);
              setBgFile(file);
              setBgUrl(createTrackedObjectUrl(file));
            }}
          />
          <button type="button" className="template-tool-button" onClick={() => bgInputRef.current?.click()}>
            Загрузить фон
          </button>
          <button type="button" className="template-tool-button icon" onClick={undo} disabled={undoStack.length === 0} title="Отменить" aria-label="Отменить">
            ↶
          </button>
          <button type="button" className="template-tool-button icon" onClick={redo} disabled={redoStack.length === 0} title="Повторить" aria-label="Повторить">
            ↷
          </button>
          <button type="button" className="template-tool-button">Сетка</button>
          <button type="button" className="template-tool-button">Слои</button>
          <button type="button" className="template-tool-button" aria-label="Масштаб">
            85%
          </button>
          <button type="button" className="template-tool-button" onClick={handleCanvasPreview}>
            Предпросмотр
          </button>
          <button type="button" className="template-tool-button primary" onClick={handleSave} disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить шаблон"}
          </button>
        </div>
      </div>

      <aside className="template-side">
        <div className="template-panel">
          <h3>Переменные шаблона</h3>
          <div className="template-variable-list">
            {visibleVariables.map((key) => (
              <button
                key={key}
                type="button"
                className="template-variable-chip"
                onClick={() => addPresetBlock(key)}
                title={`Вставить переменную {${key}}`}
              >
                {`{${key}}`}
              </button>
            ))}
          </div>
          <div className="template-action-grid">
            <button type="button" className="template-tool-button" onClick={() => addDecorBlock("Новый текст", { y: 46, size: 20 })}>
              Добавить текстовый блок
            </button>
            <button type="button" className="template-tool-button" onClick={() => addPresetBlock("ФИО участника")}>
              Вставить переменную
            </button>
            <button type="button" className="template-tool-button" onClick={() => addDecorBlock("Подпись", { y: 74, size: 12 })}>
              Добавить подпись
            </button>
            <button type="button" className="template-tool-button" onClick={() => addDecorBlock("Место для печати", { y: 70, size: 11, color: "#8fb3bf" })}>
              Добавить печать
            </button>
            <button type="button" className="template-tool-button" onClick={() => bgInputRef.current?.click()}>
              Загрузить фон
            </button>
          </div>
        </div>

        <div className="template-panel">
          <h3>Блоки на холсте</h3>
          <div className="template-block-list">
            {elements.map((element) => (
              <button
                key={element.id}
                type="button"
                className={`template-block-button${selectedElementId === element.id ? " is-active" : ""}`}
                onClick={() => setSelectedElementId(element.id)}
              >
                <span>{element.text}</span>
                <small>{Math.round(element.size)} pt</small>
              </button>
            ))}
            <button type="button" className="template-block-button template-add" onClick={() => { pushUndo(); addElement(); }}>
              Добавить блок
            </button>
          </div>
        </div>

        <div className="template-panel">
          <h3>Свойства выбранного блока</h3>
          {selectedElement ? (
            <div className="template-props">
              <label>
                Текст
                <textarea
                  className="template-input"
                  rows={3}
                  value={selectedElement.text}
                  onChange={(event) => updateSelectedElement("text", event.target.value)}
                />
              </label>
              <div className="template-prop-grid">
                <label>
                  Позиция X
                  <input type="number" min={0} max={100} value={Math.round(selectedElement.x)} onChange={(event) => updateSelectedElement("x", Number(event.target.value))} />
                </label>
                <label>
                  Позиция Y
                  <input type="number" min={0} max={100} value={Math.round(selectedElement.y)} onChange={(event) => updateSelectedElement("y", Number(event.target.value))} />
                </label>
              </div>
              <div className="template-prop-grid">
                <label>
                  Ширина
                  <input type="number" min={5} max={210} value={selectedElement.maxWidthMm || ""} onChange={(event) => updateSelectedElement("maxWidthMm", Number(event.target.value) || null)} placeholder="авто" />
                </label>
                <label>
                  Высота
                  <input type="number" min={5} max={280} value={selectedElement.maxHeightMm || ""} onChange={(event) => updateSelectedElement("maxHeightMm", Number(event.target.value) || null)} placeholder="авто" />
                </label>
              </div>
              <label>
                Шрифт
                <select value={selectedElement.fontFamily || DEFAULT_FONT_FAMILY} onChange={(event) => updateSelectedElement("fontFamily", event.target.value)}>
                  {availableFonts.map((font) => (
                    <option key={font.font_family} value={font.font_family}>{font.font_family}</option>
                  ))}
                </select>
              </label>
              <div className="template-prop-grid">
                <label>
                  Размер шрифта
                  <input type="number" min={6} max={120} value={selectedElement.size} onChange={(event) => updateSelectedElement("size", Number(event.target.value))} />
                </label>
                <label>
                  Цвет
                  <div className="template-color-row">
                    <input type="color" value={selectedElement.color} onChange={(event) => updateSelectedElement("color", event.target.value)} />
                    <input value={selectedElement.color} onChange={(event) => updateSelectedElement("color", event.target.value)} />
                  </div>
                </label>
              </div>
              <div className="template-inline-toggle">
                <button
                  type="button"
                  className={selectedElement.weight === "700" ? "is-active" : ""}
                  onClick={() => updateSelectedElement("weight", selectedElement.weight === "700" ? "400" : "700")}
                >
                  Жирность
                </button>
                <button type="button" disabled title="Курсив будет добавлен после поддержки в генераторе PDF">
                  Курсив
                </button>
              </div>
              <label>
                Выравнивание
                <div className="template-align">
                  {[
                    ["left", "Слева"],
                    ["center", "Центр"],
                    ["right", "Справа"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={selectedAlign === value ? "is-active" : ""}
                      onClick={() => updateSelectedElement("align", value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </label>
              <label>
                Межстрочный интервал
                <input type="number" min={1} max={2} step={0.05} value={selectedElement.lineHeight || 1.25} onChange={(event) => updateSelectedElement("lineHeight", Number(event.target.value) || 1.25)} />
              </label>
              <button type="button" className="template-tool-button" onClick={() => { pushUndo(); removeEl(selectedElement.id); }}>
                Удалить блок
              </button>
            </div>
          ) : (
            <p style={{ margin: 0, color: "#667783", lineHeight: 1.5 }}>Выберите текстовый блок на холсте или в списке.</p>
          )}
          {msg && <div className="template-message"><AlertBanner type={msgType}>{msg}</AlertBanner></div>}
        </div>
      </aside>

      <div className="template-canvas-area">
        <div className="template-canvas-frame">
          <AccuratePreview
            bgUrl={bgUrl}
            elements={elements}
            signers={signers}
            signersLayout={signersLayout}
            margins={margins}
            previewVariables={effectivePreviewVariables}
            fontFaces={availableFonts}
            selectedElementId={selectedElementId}
            onElementSelect={setSelectedElementId}
            onElementMove={handleElementMove}
            onElementContextMenu={handleElementContextMenu}
            onElementDoubleClick={handleElementDoubleClick}
            onSignersMove={handleSignersMove}
          />
        </div>
      </div>

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[
            { icon: "К", label: "Дублировать", shortcut: "Ctrl+D", onClick: () => { pushUndo(); duplicateEl(ctxMenu.elementId); } },
            { icon: "X", label: "Выровнять по центру X", onClick: () => { pushUndo(); centerEl(ctxMenu.elementId); } },
            { separator: true },
            { icon: "×", label: "Удалить", shortcut: "Del", danger: true, onClick: () => { pushUndo(); removeEl(ctxMenu.elementId); } },
          ]}
        />
      )}
    </section>
  );
}
