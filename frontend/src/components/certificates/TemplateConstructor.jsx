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
const QUICK_VARIABLES = ["ФИО", "Мероприятие"];
const SUGGESTED_EXTRA_VARIABLES = ["Дата", "Класс", "Школа", "Должность", "Награда", "Номер приказа", "ФИО руководителя"];
const GRAMMAR_CASES = [
  { value: "", label: "как введено" },
  { value: "именительный", label: "именительный (кто, что)" },
  { value: "родительный", label: "родительный (кого, чего)" },
  { value: "дательный", label: "дательный (кому, чему)" },
  { value: "винительный", label: "винительный (кого, что)" },
  { value: "творительный", label: "творительный (кем, чем)" },
  { value: "предложный", label: "предложный (о ком, о чём)" },
];
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

  // Текстовые элементы (без зашитого блока подписантов — он добавляется отдельной кнопкой)
  const [elements, setElements] = useState([
    { id: 1, text: "ГРАМОТА", x: 50, y: 17, size: 28, color: "#004f75", weight: "700", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
    { id: 2, text: "НАГРАЖДАЕТСЯ", x: 50, y: 28, size: 34, color: "#17232b", weight: "700", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
    { id: 3, text: "{ФИО}", x: 50, y: 40, size: 34, color: "#19789c", weight: "700", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
    { id: 4, text: "{Мероприятие}", x: 50, y: 52, size: 18, color: "#17232b", weight: "600", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
  ]);

  // Подписанты — по умолчанию ни одного; добавляются кнопкой
  const [signers, setSigners] = useState([]);

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

  // ── Новые возможности конструктора ────────────────────────────────────────
  // Пользовательские переменные шаблона
  const [userVariables, setUserVariables] = useState([]);
  const [variableDraft, setVariableDraft] = useState("");
  const [showVariableInput, setShowVariableInput] = useState(false);

  // Изображения (печати, подписи, декор)
  // { id, kind: 'stamp'|'signature'|'image', label, file, url, x, y, widthMm, heightMm, opacity }
  const [images, setImages] = useState([]);
  const [selectedImageId, setSelectedImageId] = useState(null);
  const stampInputRef = useRef(null);
  const signatureInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const imageReplaceInputRef = useRef(null);

  // Сетка, масштаб, слои
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [layersOpen, setLayersOpen] = useState(false);

  // Режим редактирования (видны переменные) или просмотра (тестовые данные)
  const [editorMode, setEditorMode] = useState("edit"); // "edit" | "preview"

  // Грязный флаг для предупреждения и индикатора автосохранения
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Буфер обмена для копирования
  const clipboardRef = useRef(null);

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
      })) : []);
      setImages([]);
      setSelectedImageId(null);

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
      { id: 3, text: "{ФИО}", x: 50, y: 40, size: 34, color: "#19789c", weight: "700", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
      { id: 4, text: "{Мероприятие}", x: 50, y: 52, size: 18, color: "#17232b", weight: "600", fontFamily: DEFAULT_FONT_FAMILY, align: "center" },
    ]);
    setPreviewVariables(DEFAULT_PREVIEW_VARIABLES);
    setSigners([]);
    setImages([]);
    setUserVariables([]);
    setSelectedImageId(null);
    setSelectedElementId(null);
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
    "ctrl+y": () => redo(),
    "ctrl+s": () => { handleSave(); },
    "delete": () => {
      if (selectedElementId) { pushUndo(); removeEl(selectedElementId); }
      else if (selectedElementId == null && typeof window !== "undefined" && window.__tpl_selImg) { /* noop */ }
    },
    "backspace": () => {
      if (selectedElementId) { pushUndo(); removeEl(selectedElementId); }
    },
    "ctrl+d": () => { if (selectedElementId) { pushUndo(); duplicateEl(selectedElementId); } },
    "ctrl+c": () => { if (selectedElementId || selectedImageId) copyElement(); },
    "ctrl+v": () => { if (clipboardRef.current) pasteElement(); },
    "escape": () => { setSelectedElementId(null); setSelectedImageId(null); setCtxMenu(null); setPickerOpenId(null); setLayersOpen(false); },
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

  // ── Грязный флаг + автосохранение черновика в localStorage ────────────────
  const skipDirtyRef = useRef(true);
  useEffect(() => {
    if (skipDirtyRef.current) { skipDirtyRef.current = false; return; }
    setIsDirty(true);
    setAutoSaveStatus("dirty");
  }, [name, elements, signers, margins, signersLayout, bgUrl, images, userVariables]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `cert-constructor-autosave:${editingId || "new"}`;
    clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        setAutoSaveStatus("saving");
        const snapshot = JSON.stringify(stripObjectUrls({
          name, elements, signers, margins, signersLayout, bgUrl,
          userVariables, images: images.map((img) => ({ ...img, file: undefined, url: undefined })),
        }));
        window.localStorage.setItem(key, snapshot);
        setAutoSaveStatus("autosaved");
        setLastSavedAt(new Date());
      } catch { setAutoSaveStatus("error"); }
    }, 12000);
    return () => clearTimeout(autoSaveTimerRef.current);
  }, [name, elements, signers, margins, signersLayout, bgUrl, images, userVariables, editingId]);

  // Предупреждение при выходе со страницы с несохранёнными изменениями
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handler = (e) => {
      if (!isDirty) return undefined;
      e.preventDefault();
      e.returnValue = "У вас есть несохранённые изменения. Покинуть страницу?";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

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

  // ── Пользовательские переменные ───────────────────────────────────────────
  const addCustomVariable = useCallback((rawName) => {
    const cleaned = String(rawName || "").trim().replace(/[{}]/g, "").trim();
    if (!cleaned) {
      setMsg("Введите название переменной"); setMsgType("error"); return;
    }
    if (!/^[А-Яа-яЁё A-Za-z0-9_-]+$/.test(cleaned)) {
      setMsg("Используйте буквы, цифры, пробелы и дефис"); setMsgType("error"); return;
    }
    const exists = [...QUICK_VARIABLES, ...userVariables].some((v) => v.toLowerCase() === cleaned.toLowerCase());
    if (exists) {
      setMsg("Такая переменная уже существует"); setMsgType("error"); return;
    }
    setUserVariables((prev) => [...prev, cleaned]);
    setVariableDraft("");
    setShowVariableInput(false);
    setMsg(`Переменная «${cleaned}» добавлена`);
    setMsgType("success");
  }, [userVariables]);

  const removeCustomVariable = useCallback((name) => {
    setUserVariables((prev) => prev.filter((v) => v !== name));
  }, []);

  // ── Изображения (печати, подписи, декор) ──────────────────────────────────
  const addImage = useCallback((kind, file) => {
    if (!file || !file.type?.startsWith("image/")) {
      setMsg("Выберите файл изображения"); setMsgType("error"); return;
    }
    const url = createTrackedObjectUrl(file);
    const presets = {
      stamp:     { label: "Печать", widthMm: 45, heightMm: 45, x: 70, y: 75, opacity: 0.92 },
      signature: { label: "Подпись", widthMm: 55, heightMm: 22, x: 70, y: 70, opacity: 1 },
      image:     { label: "Изображение", widthMm: 50, heightMm: 30, x: 50, y: 60, opacity: 1 },
    };
    const preset = presets[kind] || presets.image;
    const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    pushUndo();
    setImages((prev) => [...prev, {
      id, kind, label: preset.label,
      file, url, x: preset.x, y: preset.y,
      widthMm: preset.widthMm, heightMm: preset.heightMm,
      opacity: preset.opacity,
    }]);
    setSelectedImageId(id);
    setSelectedElementId(null);
  }, [createTrackedObjectUrl, pushUndo]);

  const updateImage = useCallback((id, patch) => {
    setImages((prev) => prev.map((img) => img.id === id ? { ...img, ...patch } : img));
  }, []);

  const moveImage = useCallback((id, newX, newY) => {
    setImages((prev) => prev.map((img) => img.id === id ? { ...img, x: newX, y: newY } : img));
  }, []);

  const removeImage = useCallback((id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (selectedImageId === id) setSelectedImageId(null);
  }, [selectedImageId]);

  const replaceImage = useCallback((id, file) => {
    if (!file || !file.type?.startsWith("image/")) return;
    const url = createTrackedObjectUrl(file);
    setImages((prev) => prev.map((img) => img.id === id ? { ...img, file, url } : img));
  }, [createTrackedObjectUrl]);

  // ── Слои ───────────────────────────────────────────────────────────────────
  // Порядок в массиве = z-order. Последний элемент сверху.
  const moveLayer = useCallback((kind, id, direction) => {
    const setter = kind === "image" ? setImages : setElements;
    setter((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      let target;
      if (direction === "up") target = Math.min(prev.length - 1, idx + 1);
      else if (direction === "down") target = Math.max(0, idx - 1);
      else if (direction === "front") target = prev.length - 1;
      else if (direction === "back") target = 0;
      else return prev;
      if (target === idx) return prev;
      const [item] = next.splice(idx, 1);
      next.splice(target, 0, item);
      return next;
    });
  }, []);

  const moveElementZ = useCallback((id, direction) => {
    moveLayer("element", id, direction);
  }, [moveLayer]);

  const toggleHidden = useCallback((kind, id) => {
    const setter = kind === "image" ? setImages : setElements;
    setter((prev) => prev.map((item) => item.id === id ? { ...item, hidden: !item.hidden } : item));
  }, []);

  const toggleLocked = useCallback((kind, id) => {
    const setter = kind === "image" ? setImages : setElements;
    setter((prev) => prev.map((item) => item.id === id ? { ...item, locked: !item.locked } : item));
  }, []);

  const centerElementH = useCallback((id) => {
    setElements((prev) => prev.map((e) => e.id === id ? { ...e, x: 50, align: "center" } : e));
  }, []);
  const centerElementV = useCallback((id) => {
    setElements((prev) => prev.map((e) => e.id === id ? { ...e, y: 50 } : e));
  }, []);

  const handleInlineEdit = useCallback((id, newText) => {
    pushUndo();
    setElements((prev) => prev.map((e) => e.id === id ? { ...e, text: newText } : e));
  }, [pushUndo]);

  const handleElementResize = useCallback((id, kind, widthMm, heightMm) => {
    if (kind === "image") {
      setImages((prev) => prev.map((img) => img.id === id ? { ...img, widthMm, heightMm } : img));
    } else {
      setElements((prev) => prev.map((e) => e.id === id ? { ...e, maxWidthMm: widthMm, maxHeightMm: heightMm } : e));
    }
  }, []);

  const copyElement = useCallback(() => {
    if (selectedElementId) {
      const el = elements.find((e) => e.id === selectedElementId);
      if (el) clipboardRef.current = { kind: "element", data: el };
    } else if (selectedImageId) {
      const img = images.find((i) => i.id === selectedImageId);
      if (img) clipboardRef.current = { kind: "image", data: img };
    }
  }, [selectedElementId, selectedImageId, elements, images]);

  const pasteElement = useCallback(() => {
    const buf = clipboardRef.current;
    if (!buf) return;
    pushUndo();
    if (buf.kind === "element") {
      const newId = Math.max(0, ...elements.map((e) => e.id)) + 1;
      const cp = { ...buf.data, id: newId, x: Math.min(95, (buf.data.x || 50) + 3), y: Math.min(95, (buf.data.y || 50) + 3) };
      setElements((prev) => [...prev, cp]);
      setSelectedElementId(newId);
      setSelectedImageId(null);
    } else {
      const newId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
      const cp = { ...buf.data, id: newId, x: Math.min(95, (buf.data.x || 50) + 3), y: Math.min(95, (buf.data.y || 50) + 3) };
      setImages((prev) => [...prev, cp]);
      setSelectedImageId(newId);
      setSelectedElementId(null);
    }
  }, [elements, pushUndo]);

  // Подписанты — отдельный элемент конструктора
  const addSignerSlot = useCallback(() => {
    setSigners((prev) => {
      if (prev.length >= 4) return prev;
      const offset = prev.length * 12;
      return [...prev, {
        id: `s_${Date.now()}_${prev.length}`,
        position: "Должность",
        fullName: "Фамилия И.О.",
        facFile: null, facPreview: null,
        offsetY: offset, facOffsetX: 0, facOffsetY: 0, facScale: 1,
      }];
    });
  }, []);

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
          setIsDirty(false); setAutoSaveStatus("saved"); setLastSavedAt(new Date());
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
      setIsDirty(false); setAutoSaveStatus("saved"); setLastSavedAt(new Date());
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
  const visibleVariables = useMemo(() => {
    const merged = new Set();
    QUICK_VARIABLES.forEach((v) => merged.add(v));
    detectedPlaceholders.forEach((v) => merged.add(v));
    userVariables.forEach((v) => merged.add(v));
    return [...merged];
  }, [detectedPlaceholders, userVariables]);

  const selectedImage = images.find((img) => img.id === selectedImageId) || null;
  const ZOOM_STOPS = [50, 75, 100, 125, 150];
  const setZoomStep = (delta) => {
    const idx = ZOOM_STOPS.indexOf(zoom);
    if (idx === -1) {
      const nearest = ZOOM_STOPS.reduce((acc, v) => (Math.abs(v - zoom) < Math.abs(acc - zoom) ? v : acc), 100);
      setZoom(nearest);
      return;
    }
    const next = Math.max(0, Math.min(ZOOM_STOPS.length - 1, idx + delta));
    setZoom(ZOOM_STOPS[next]);
  };

  const handleSelectElement = (id) => {
    setSelectedElementId(id);
    setSelectedImageId(null);
  };

  const handleSelectImage = (id) => {
    setSelectedImageId(id);
    setSelectedElementId(null);
  };

  const handleStampFile = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (f) addImage("stamp", f);
  };
  const handleSignatureFile = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (f) addImage("signature", f);
  };
  const handleGenericImageFile = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (f) addImage("image", f);
  };
  const handleReplaceImageFile = (e) => {
    const f = e.target.files?.[0]; e.target.value = "";
    if (f && selectedImageId) replaceImage(selectedImageId, f);
  };

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
          --tpl-border-soft: #e5ebef;
          --tpl-soft: #f4f8fa;
          --tpl-muted: #667783;
          --tpl-text: #17232b;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr) 320px;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 0;
          margin: 0;
          background: #f4f7f9;
          border-top: 1px solid var(--tpl-border);
          overflow: hidden;
          font-family: inherit;
        }
        .template-toolbar {
          grid-column: 1 / -1;
          min-height: 56px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 10px 18px;
          border-bottom: 1px solid var(--tpl-border);
          background: #fff;
          flex-wrap: wrap;
        }
        .tpl-toolbar-group {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .tpl-toolbar-title {
          color: var(--tpl-primary-dark);
          font-size: 15px;
          font-weight: 900;
          white-space: nowrap;
        }
        .tpl-back-btn {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--tpl-border);
          border-radius: 8px;
          background: #fff;
          color: var(--tpl-primary-dark);
          cursor: pointer;
          font-size: 16px;
        }
        .tpl-back-btn:hover { border-color: var(--tpl-primary); background: #edf6f8; }
        .tpl-title-input {
          min-height: 34px;
          width: 220px;
          padding: 0 10px;
          border: 1px solid var(--tpl-border);
          border-radius: 8px;
          background: #fff;
          color: var(--tpl-text);
          font: inherit;
          font-size: 14px;
          font-weight: 750;
        }
        .tpl-title-input:focus { outline: 0; border-color: var(--tpl-primary); box-shadow: 0 0 0 3px rgba(25,120,156,.14); }
        .tpl-template-select {
          min-height: 34px;
          max-width: 200px;
          padding: 0 10px;
          border: 1px solid var(--tpl-border);
          border-radius: 8px;
          background: #fff;
          color: var(--tpl-text);
          font: inherit;
          font-size: 13px;
        }
        .tpl-zoom {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--tpl-border);
          border-radius: 8px;
          background: #fff;
          overflow: hidden;
        }
        .tpl-zoom button {
          width: 28px;
          height: 32px;
          border: 0;
          background: transparent;
          color: var(--tpl-text);
          font: inherit;
          font-size: 15px;
          cursor: pointer;
        }
        .tpl-zoom button:hover:not(:disabled) { background: #edf6f8; }
        .tpl-zoom button:disabled { color: #b2bec5; cursor: not-allowed; }
        .tpl-zoom-value {
          min-width: 48px;
          text-align: center;
          color: var(--tpl-text);
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          border-left: 1px solid var(--tpl-border-soft);
          border-right: 1px solid var(--tpl-border-soft);
          height: 32px;
          line-height: 32px;
          background: #f8fbfc;
        }
        .tpl-icon-btn {
          width: 34px;
          height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--tpl-border);
          border-radius: 8px;
          background: #fff;
          color: var(--tpl-text);
          cursor: pointer;
          font-size: 14px;
          padding: 0;
        }
        .tpl-icon-btn:hover:not(:disabled) { border-color: var(--tpl-primary); color: var(--tpl-primary-dark); background: #edf6f8; }
        .tpl-icon-btn:disabled { color: #b2bec5; cursor: not-allowed; }
        .tpl-icon-btn.is-active { border-color: var(--tpl-primary); background: var(--tpl-primary); color: #fff; }
        .tpl-icon-btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
        .tpl-mode-toggle {
          display: inline-flex;
          align-items: center;
          border: 1px solid var(--tpl-border);
          border-radius: 8px;
          background: #f4f7f9;
          padding: 2px;
        }
        .tpl-mode-toggle button {
          min-height: 28px;
          padding: 0 10px;
          border: 0;
          background: transparent;
          color: var(--tpl-text);
          font: inherit;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
          border-radius: 6px;
        }
        .tpl-mode-toggle button.is-active {
          background: var(--tpl-primary);
          color: #fff;
        }
        .tpl-save-status {
          font-size: 12px;
          font-weight: 800;
          color: var(--tpl-muted);
          padding: 0 6px;
          white-space: nowrap;
        }
        .tpl-save-status--saved { color: #047857; }
        .tpl-save-status--autosaved { color: #19789c; }
        .tpl-save-status--saving { color: var(--tpl-primary-dark); }
        .tpl-save-status--dirty { color: #b45309; }
        .tpl-save-status--error { color: #b91c1c; }
        .tpl-btn {
          min-height: 34px;
          padding: 0 12px;
          border: 1px solid var(--tpl-border);
          border-radius: 8px;
          background: #fff;
          color: var(--tpl-text);
          font: inherit;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .tpl-btn:hover:not(:disabled) { border-color: var(--tpl-primary); color: var(--tpl-primary-dark); background: #edf6f8; }
        .tpl-btn:disabled { color: #b2bec5; cursor: not-allowed; }
        .tpl-btn.secondary { border-color: var(--tpl-primary); color: var(--tpl-primary-dark); }
        .tpl-btn.primary {
          border-color: var(--tpl-primary);
          background: var(--tpl-primary);
          color: #fff;
          box-shadow: 0 6px 16px rgba(25,120,156,.22);
        }
        .tpl-btn.primary:hover:not(:disabled) { background: var(--tpl-primary-dark); border-color: var(--tpl-primary-dark); }
        .tpl-btn.primary:disabled { background: #b2bec5; border-color: #b2bec5; box-shadow: none; color: #fff; }
        .tpl-btn.danger { color: #b91c1c; border-color: #fecaca; background: #fef2f2; }
        .tpl-btn.danger:hover { background: #fee2e2; border-color: #fca5a5; }

        .tpl-side {
          min-height: 0;
          background: #fff;
          border-right: 1px solid var(--tpl-border);
          overflow: auto;
        }
        .tpl-side.right {
          border-right: 0;
          border-left: 1px solid var(--tpl-border);
        }
        .tpl-section {
          padding: 16px 16px 18px;
          border-bottom: 1px solid var(--tpl-border-soft);
        }
        .tpl-section h3 {
          margin: 0 0 10px;
          color: var(--tpl-primary-dark);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .tpl-section p.tpl-hint {
          margin: 0 0 10px;
          color: var(--tpl-muted);
          font-size: 12px;
          line-height: 1.45;
        }
        .tpl-var-grid {
          display: grid;
          gap: 6px;
        }
        .tpl-var-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto;
          align-items: center;
          gap: 6px;
          padding: 7px 9px;
          border: 1px solid var(--tpl-border-soft);
          border-radius: 8px;
          background: #f8fbfc;
        }
        .tpl-var-row.custom { background: #edf6f8; border-color: #cfe0e7; }
        .tpl-var-chip {
          min-width: 0;
          color: var(--tpl-primary-dark);
          font-size: 13px;
          font-weight: 850;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .tpl-var-insert {
          min-height: 26px;
          padding: 0 8px;
          border: 1px solid var(--tpl-primary);
          background: #fff;
          color: var(--tpl-primary-dark);
          font: inherit;
          font-size: 11px;
          font-weight: 850;
          border-radius: 6px;
          cursor: pointer;
        }
        .tpl-var-insert:hover { background: var(--tpl-primary); color: #fff; }
        .tpl-var-remove {
          width: 26px;
          height: 26px;
          border: 1px solid var(--tpl-border-soft);
          background: #fff;
          color: #b91c1c;
          border-radius: 6px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          padding: 0;
        }
        .tpl-add-var {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 6px;
          margin-top: 8px;
        }
        .tpl-add-var input {
          min-height: 32px;
          padding: 0 10px;
          border: 1px solid var(--tpl-border);
          border-radius: 8px;
          background: #fff;
          color: var(--tpl-text);
          font: inherit;
          font-size: 13px;
        }
        .tpl-add-var input:focus { outline: 0; border-color: var(--tpl-primary); box-shadow: 0 0 0 3px rgba(25,120,156,.14); }
        .tpl-element-grid {
          display: grid;
          gap: 7px;
        }
        .tpl-element-btn {
          min-height: 38px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 12px;
          border: 1px solid var(--tpl-border-soft);
          border-radius: 8px;
          background: #fff;
          color: var(--tpl-text);
          font: inherit;
          font-size: 13px;
          font-weight: 750;
          cursor: pointer;
          text-align: left;
        }
        .tpl-element-btn:hover { border-color: var(--tpl-primary); background: #edf6f8; color: var(--tpl-primary-dark); }
        .tpl-element-btn svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2; }
        .tpl-block-list {
          display: grid;
          gap: 6px;
          max-height: 280px;
          overflow: auto;
        }
        .tpl-block-row {
          display: grid;
          grid-template-columns: 18px minmax(0, 1fr) auto auto;
          gap: 8px;
          align-items: center;
          padding: 8px 10px;
          border: 1px solid var(--tpl-border-soft);
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
          transition: border .14s ease, background .14s ease;
        }
        .tpl-block-row:hover { border-color: var(--tpl-primary); background: #f3f9fb; }
        .tpl-block-row.is-active { border-color: var(--tpl-primary); background: #edf6f8; }
        .tpl-block-row .tpl-block-kind {
          color: var(--tpl-primary-dark);
          font-size: 12px;
          font-weight: 900;
        }
        .tpl-block-row .tpl-block-label {
          min-width: 0;
          color: var(--tpl-text);
          font-size: 13px;
          font-weight: 700;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .tpl-block-row .tpl-block-tag {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          color: var(--tpl-muted);
          letter-spacing: .04em;
        }
        .tpl-block-row .tpl-block-tag.variable { color: var(--tpl-primary-dark); }
        .tpl-block-row .tpl-block-delete {
          width: 24px;
          height: 24px;
          border: 0;
          background: transparent;
          color: #b91c1c;
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          border-radius: 6px;
        }
        .tpl-block-row .tpl-block-delete:hover { background: #fef2f2; }

        .tpl-canvas-area {
          min-width: 0;
          min-height: 0;
          overflow: auto;
          background-color: #eef3f6;
          background-image: radial-gradient(rgba(143,179,191,.6) 1px, transparent 1px);
          background-size: 22px 22px;
          padding: 32px 24px;
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }
        .tpl-canvas-frame {
          width: 100%;
          max-width: calc(560px * var(--tpl-zoom, 1));
          margin: 0 auto;
          transition: max-width .18s ease;
        }
        .tpl-canvas-sheet {
          background: #fff;
          border: 1px solid #cdd8df;
          box-shadow: 0 24px 60px rgba(15,23,42,.14);
          padding: 12px;
          border-radius: 4px;
        }

        .tpl-props {
          display: grid;
          gap: 12px;
        }
        .tpl-props label {
          display: grid;
          gap: 5px;
          color: #52636d;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: .04em;
          text-transform: uppercase;
        }
        .tpl-props input, .tpl-props select, .tpl-props textarea {
          min-height: 34px;
          border: 1px solid var(--tpl-border);
          border-radius: 8px;
          background: #fff;
          color: var(--tpl-text);
          font: inherit;
          font-size: 14px;
          font-weight: 600;
          padding: 7px 10px;
          outline: 0;
        }
        .tpl-props textarea { resize: vertical; }
        .tpl-props input:focus, .tpl-props select:focus, .tpl-props textarea:focus {
          border-color: var(--tpl-primary);
          box-shadow: 0 0 0 3px rgba(25,120,156,.14);
        }
        .tpl-prop-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .tpl-prop-color {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 8px;
          align-items: center;
        }
        .tpl-prop-color input[type="color"] { padding: 2px; width: 42px; height: 34px; }
        .tpl-toggle-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
          padding: 3px;
          border: 1px solid var(--tpl-border);
          border-radius: 8px;
          background: #f4f7f9;
        }
        .tpl-toggle-row button {
          min-height: 30px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: var(--tpl-text);
          font: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
        }
        .tpl-toggle-row button.is-active {
          background: #fff;
          color: var(--tpl-primary-dark);
          box-shadow: 0 2px 6px rgba(15,23,42,.08);
        }
        .tpl-empty-props {
          padding: 18px 14px;
          color: var(--tpl-muted);
          font-size: 13px;
          line-height: 1.5;
          text-align: center;
        }
        .tpl-divider { height: 1px; background: var(--tpl-border-soft); margin: 6px 0; }

        .tpl-layers-popover {
          position: absolute;
          top: 56px;
          right: 24px;
          width: 380px;
          max-height: 460px;
          background: #fff;
          border: 1px solid var(--tpl-border);
          border-radius: 10px;
          box-shadow: 0 18px 36px rgba(15,23,42,.16);
          z-index: 40;
          overflow: auto;
          padding: 12px;
        }
        .tpl-layers-popover h4 {
          margin: 0 0 8px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          color: var(--tpl-primary-dark);
        }
        .tpl-layer-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto auto auto auto auto auto auto;
          gap: 2px;
          align-items: center;
          padding: 5px 6px;
          border: 1px solid var(--tpl-border-soft);
          border-radius: 6px;
          margin-bottom: 4px;
          background: #fff;
          cursor: pointer;
        }
        .tpl-layer-row.is-active { border-color: var(--tpl-primary); background: #edf6f8; }
        .tpl-layer-row span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          font-weight: 700;
          color: var(--tpl-text);
        }
        .tpl-layer-row button {
          width: 22px;
          height: 22px;
          border: 0;
          background: transparent;
          color: var(--tpl-muted);
          cursor: pointer;
          padding: 0;
          font-size: 13px;
        }
        .tpl-layer-row button:hover { color: var(--tpl-primary-dark); background: #f0f4f6; border-radius: 4px; }
        .tpl-layer-row .delete-btn:hover { color: #b91c1c; background: #fef2f2; }

        @media (max-width: 1280px) {
          .template-workbench {
            grid-template-columns: 240px minmax(0, 1fr) 280px;
          }
        }
        @media (max-width: 1040px) {
          .template-workbench {
            grid-template-columns: 1fr;
            margin: 0;
          }
          .tpl-side, .tpl-side.right { border: 0; border-bottom: 1px solid var(--tpl-border); max-height: none; }
          .tpl-canvas-area { padding: 16px; }
        }
      `}</style>

      <div className="template-toolbar">
        <div className="tpl-toolbar-group" style={{ minWidth: 0, flex: 1 }}>
          <button type="button" className="tpl-back-btn" onClick={() => navigate("/admin/certificates")} aria-label="Назад" title="Назад">
            ←
          </button>
          <span className="tpl-toolbar-title">Конструктор шаблонов</span>
          <input
            className="tpl-title-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label="Название шаблона"
            placeholder="Название шаблона"
          />
          <select
            className="tpl-template-select"
            value={editingId ?? ""}
            disabled={loadingTemplate}
            onChange={(event) => loadTemplate(Number(event.target.value) || null)}
            aria-label="Загрузить шаблон"
            title="Открыть существующий шаблон"
          >
            <option value="">+ Новый шаблон</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>{template.name}</option>
            ))}
          </select>
        </div>

        <div className="tpl-toolbar-group">
          <button type="button" className="tpl-icon-btn" onClick={undo} disabled={undoStack.length === 0} title="Отменить (Ctrl+Z)" aria-label="Отменить">
            <svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-4"/></svg>
          </button>
          <button type="button" className="tpl-icon-btn" onClick={redo} disabled={redoStack.length === 0} title="Повторить (Ctrl+Shift+Z)" aria-label="Повторить">
            <svg viewBox="0 0 24 24"><path d="m15 14 5-5-5-5M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h4"/></svg>
          </button>
          <div className="tpl-zoom" title="Масштаб холста">
            <button type="button" onClick={() => setZoomStep(-1)} disabled={zoom <= ZOOM_STOPS[0]} aria-label="Уменьшить">−</button>
            <span className="tpl-zoom-value">{zoom}%</span>
            <button type="button" onClick={() => setZoomStep(1)} disabled={zoom >= ZOOM_STOPS[ZOOM_STOPS.length - 1]} aria-label="Увеличить">+</button>
          </div>
          <button
            type="button"
            className={`tpl-icon-btn${showGrid ? " is-active" : ""}`}
            onClick={() => setShowGrid((value) => !value)}
            title="Сетка"
            aria-label="Сетка"
            aria-pressed={showGrid}
          >
            <svg viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 10h16M4 16h16M10 4v16M16 4v16"/></svg>
          </button>
          <button
            type="button"
            className={`tpl-icon-btn${layersOpen ? " is-active" : ""}`}
            onClick={() => setLayersOpen((value) => !value)}
            title="Слои"
            aria-label="Слои"
            aria-pressed={layersOpen}
          >
            <svg viewBox="0 0 24 24"><path d="M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 18l9 5 9-5"/></svg>
          </button>
          <div className="tpl-mode-toggle" role="group" aria-label="Режим конструктора">
            <button
              type="button"
              className={editorMode === "edit" ? "is-active" : ""}
              onClick={() => setEditorMode("edit")}
              title="В этом режиме видны переменные {ФИО} и подсказки"
            >Редактирование</button>
            <button
              type="button"
              className={editorMode === "preview" ? "is-active" : ""}
              onClick={() => setEditorMode("preview")}
              title="В этом режиме подставляются тестовые значения переменных"
            >Просмотр</button>
          </div>
        </div>

        <div className="tpl-toolbar-group">
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
          <span className={`tpl-save-status tpl-save-status--${autoSaveStatus || (isDirty ? "dirty" : "idle")}`}>
            {(() => {
              if (saving) return "Сохраняется…";
              if (autoSaveStatus === "saving") return "Сохраняется…";
              if (autoSaveStatus === "saved") return lastSavedAt ? `Сохранено ${lastSavedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Сохранено";
              if (autoSaveStatus === "autosaved") return lastSavedAt ? `Черновик ${lastSavedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : "Черновик сохранён";
              if (autoSaveStatus === "error") return "Ошибка сохранения";
              if (isDirty) return "Есть несохранённые изменения";
              return "Изменений нет";
            })()}
          </span>
          <button type="button" className="tpl-btn secondary" onClick={() => bgInputRef.current?.click()}>
            Загрузить фон
          </button>
          {editingId && (
            <button type="button" className="tpl-btn danger" onClick={handleDeleteTemplate} disabled={saving || loadingTemplate}>
              Удалить
            </button>
          )}
          <button type="button" className="tpl-btn primary" onClick={handleSave} disabled={saving}>
            {saving ? "Сохранение..." : "Сохранить шаблон"}
          </button>
        </div>
      </div>

      {layersOpen && (
        <div className="tpl-layers-popover" role="dialog" aria-label="Слои">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h4 style={{ margin: 0 }}>Слои на холсте</h4>
            <button type="button" className="tpl-icon-btn" style={{ width: 26, height: 26 }} onClick={() => setLayersOpen(false)} aria-label="Закрыть">×</button>
          </div>
          <p style={{ margin: "8px 0 10px", color: "#667783", fontSize: 11, lineHeight: 1.4 }}>
            Сверху списка — верхние слои. Они перекрывают нижние на холсте и в PDF.
          </p>
          {elements.length === 0 && images.length === 0 && (
            <p style={{ margin: 0, color: "#667783", fontSize: 12 }}>Добавьте элементы на холст, чтобы они появились здесь.</p>
          )}
          {[...elements].reverse().map((el) => {
            const isVar = (el.text || "").includes("{");
            const isLocked = !!el.locked;
            const isHidden = !!el.hidden;
            return (
              <div
                key={`el-${el.id}`}
                className={`tpl-layer-row${selectedElementId === el.id ? " is-active" : ""}`}
                onClick={() => handleSelectElement(el.id)}
                style={isHidden ? { opacity: 0.5 } : undefined}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ color: isVar ? "#19789c" : "#667783", fontSize: 11, fontWeight: 900 }}>{isVar ? "▣" : "T"}</span>
                  {el.text}
                </span>
                <button type="button" onClick={(e) => { e.stopPropagation(); pushUndo(); moveElementZ(el.id, "front"); }} title="На передний план" style={{ fontSize: 11 }}>⤒</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); pushUndo(); moveElementZ(el.id, "up"); }} title="Выше">▲</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); pushUndo(); moveElementZ(el.id, "down"); }} title="Ниже">▼</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); pushUndo(); moveElementZ(el.id, "back"); }} title="На задний план" style={{ fontSize: 11 }}>⤓</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleHidden("element", el.id); }} title={isHidden ? "Показать" : "Скрыть"} style={{ color: isHidden ? "#b91c1c" : undefined }}>{isHidden ? "🚫" : "👁"}</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleLocked("element", el.id); }} title={isLocked ? "Разблокировать" : "Заблокировать"} style={{ color: isLocked ? "#b45309" : undefined }}>{isLocked ? "🔒" : "🔓"}</button>
                <button type="button" className="delete-btn" onClick={(e) => { e.stopPropagation(); pushUndo(); removeEl(el.id); }} title="Удалить">×</button>
              </div>
            );
          })}
          {[...images].reverse().map((img) => {
            const isLocked = !!img.locked;
            const isHidden = !!img.hidden;
            return (
              <div
                key={`img-${img.id}`}
                className={`tpl-layer-row${selectedImageId === img.id ? " is-active" : ""}`}
                onClick={() => handleSelectImage(img.id)}
                style={isHidden ? { opacity: 0.5 } : undefined}
              >
                <span>🖼 {img.label || img.kind}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); moveLayer("image", img.id, "front"); }} title="На передний план" style={{ fontSize: 11 }}>⤒</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); moveLayer("image", img.id, "up"); }} title="Выше">▲</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); moveLayer("image", img.id, "down"); }} title="Ниже">▼</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); moveLayer("image", img.id, "back"); }} title="На задний план" style={{ fontSize: 11 }}>⤓</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleHidden("image", img.id); }} title={isHidden ? "Показать" : "Скрыть"} style={{ color: isHidden ? "#b91c1c" : undefined }}>{isHidden ? "🚫" : "👁"}</button>
                <button type="button" onClick={(e) => { e.stopPropagation(); toggleLocked("image", img.id); }} title={isLocked ? "Разблокировать" : "Заблокировать"} style={{ color: isLocked ? "#b45309" : undefined }}>{isLocked ? "🔒" : "🔓"}</button>
                <button type="button" className="delete-btn" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} title="Удалить">×</button>
              </div>
            );
          })}
        </div>
      )}

      <aside className="tpl-side" aria-label="Элементы и переменные">
        <div className="tpl-section">
          <h3>Переменные</h3>
          <p className="tpl-hint">Подставляются при выпуске грамоты. Колонки Excel должны совпадать с названиями.</p>
          <div className="tpl-var-grid">
            {QUICK_VARIABLES.map((key) => (
              <div className="tpl-var-row" key={`base-${key}`}>
                <span className="tpl-var-chip">{`{${key}}`}</span>
                <button type="button" className="tpl-var-insert" onClick={() => { pushUndo(); insertVariableBlock(key); }} title="Вставить на холст">Вставить</button>
                <span style={{ width: 26 }} />
              </div>
            ))}
            {userVariables.map((key) => (
              <div className="tpl-var-row custom" key={`user-${key}`}>
                <span className="tpl-var-chip">{`{${key}}`}</span>
                <button type="button" className="tpl-var-insert" onClick={() => { pushUndo(); insertVariableBlock(key); }} title="Вставить на холст">Вставить</button>
                <button type="button" className="tpl-var-remove" onClick={() => removeCustomVariable(key)} title="Убрать переменную">×</button>
              </div>
            ))}
          </div>
          {showVariableInput ? (
            <div className="tpl-add-var">
              <input
                value={variableDraft}
                onChange={(event) => setVariableDraft(event.target.value)}
                placeholder="Например: Школа"
                onKeyDown={(event) => {
                  if (event.key === "Enter") { event.preventDefault(); addCustomVariable(variableDraft); }
                  if (event.key === "Escape") { setShowVariableInput(false); setVariableDraft(""); }
                }}
                autoFocus
              />
              <button type="button" className="tpl-btn primary" onClick={() => addCustomVariable(variableDraft)} style={{ minHeight: 32, padding: "0 12px" }}>
                Добавить
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="tpl-element-btn"
              style={{ marginTop: 8, justifyContent: "center", color: "var(--tpl-primary-dark)", borderStyle: "dashed", borderColor: "#b9cbd4" }}
              onClick={() => setShowVariableInput(true)}
            >
              + Добавить переменную
            </button>
          )}
        </div>

        <div className="tpl-section">
          <h3>Элементы</h3>
          <div className="tpl-element-grid">
            <button type="button" className="tpl-element-btn" onClick={() => { pushUndo(); addDecorBlock("Новый текст", { y: 46, size: 20 }); }}>
              <svg viewBox="0 0 24 24"><path d="M4 6h16M9 6v14M14 6v14M4 18h6M14 18h6"/></svg>
              Добавить текст
            </button>
            <button type="button" className="tpl-element-btn" onClick={() => { pushUndo(); insertVariableBlock("ФИО"); }}>
              <svg viewBox="0 0 24 24"><path d="M5 8h14M5 12h14M5 16h8"/></svg>
              Вставить переменную
            </button>
            <input type="file" accept="image/*" ref={stampInputRef} style={{ display: "none" }} onChange={handleStampFile} />
            <button type="button" className="tpl-element-btn" onClick={() => stampInputRef.current?.click()}>
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 12h6M12 9v6"/></svg>
              Загрузить печать
            </button>
            <input type="file" accept="image/*" ref={signatureInputRef} style={{ display: "none" }} onChange={handleSignatureFile} />
            <button type="button" className="tpl-element-btn" onClick={() => signatureInputRef.current?.click()}>
              <svg viewBox="0 0 24 24"><path d="M3 18c4-2 6-8 9-8s4 4 9 2"/></svg>
              Загрузить подпись
            </button>
            <input type="file" accept="image/*" ref={imageInputRef} style={{ display: "none" }} onChange={handleGenericImageFile} />
            <button type="button" className="tpl-element-btn" onClick={() => imageInputRef.current?.click()}>
              <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 17 4-5 4 4 3-3 5 5"/><circle cx="9" cy="10" r="1.4"/></svg>
              Добавить изображение
            </button>
            <button type="button" className="tpl-element-btn" onClick={() => bgInputRef.current?.click()}>
              <svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 14l6-4 5 4 4-3 3 3"/></svg>
              Загрузить фон
            </button>
            <button
              type="button"
              className="tpl-element-btn"
              onClick={() => { pushUndo(); addSignerSlot(); }}
              disabled={signers.length >= 4}
              title={signers.length >= 4 ? "Максимум 4 подписанта" : "Добавить подписанта"}
            >
              <svg viewBox="0 0 24 24"><path d="M4 19c2-3 5-4 8-4s6 1 8 4M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/></svg>
              Добавить подписанта {signers.length > 0 ? `(${signers.length}/4)` : ""}
            </button>
          </div>
        </div>

        {editorMode === "preview" && (
          <div className="tpl-section">
            <h3>Тестовые значения переменных</h3>
            <p className="tpl-hint">Используются только для просмотра в конструкторе. На PDF не влияют.</p>
            <div className="tpl-props">
              {(detectedPlaceholders.length ? detectedPlaceholders : ["ФИО", "Мероприятие"]).map((key) => (
                <label key={key}>
                  {key}
                  <input
                    value={previewVariables[key] ?? ""}
                    onChange={(event) => setPreviewVariables((prev) => ({ ...prev, [key]: event.target.value }))}
                    placeholder={DEFAULT_PREVIEW_VARIABLES[key] || `Тестовое значение для «${key}»`}
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {signers.length > 0 && (
          <div className="tpl-section">
            <h3>Подписанты ({signers.length}/4)</h3>
            <p className="tpl-hint">Должность, ФИО и факсимиле каждого подписанта попадают в PDF.</p>
            <div className="tpl-props">
              {signers.map((s, i) => (
                <div key={s.id} style={{ border: "1px solid var(--tpl-border-soft)", borderRadius: 8, padding: 10, display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--tpl-primary-dark)", fontSize: 12, fontWeight: 900 }}>Подписант №{i + 1}</strong>
                    <button type="button" className="tpl-block-delete" onClick={() => setSigners((prev) => prev.filter((x) => x.id !== s.id))} title="Удалить подписанта" aria-label="Удалить подписанта">×</button>
                  </div>
                  <label>
                    Должность
                    <input value={s.position} onChange={(e) => setSigners((prev) => prev.map((x) => x.id === s.id ? { ...x, position: e.target.value } : x))} />
                  </label>
                  <label>
                    ФИО
                    <input value={s.fullName} onChange={(e) => setSigners((prev) => prev.map((x) => x.id === s.id ? { ...x, fullName: e.target.value } : x))} />
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="file"
                      accept="image/*"
                      id={`fac-${s.id}`}
                      style={{ display: "none" }}
                      onChange={(e) => handleFacsimile(s.id, e)}
                    />
                    <button type="button" className="tpl-btn" onClick={() => document.getElementById(`fac-${s.id}`)?.click()} style={{ flex: 1 }}>
                      {s.facPreview ? "Заменить факсимиле" : "Загрузить факсимиле"}
                    </button>
                    {s.facPreview && (
                      <button type="button" className="tpl-btn danger" onClick={() => clearFacsimile(s.id)} title="Удалить факсимиле">×</button>
                    )}
                  </div>
                  {s.facPreview && (
                    <div style={{ display: "flex", justifyContent: "center", padding: 6, background: "#f4f7f9", borderRadius: 6 }}>
                      <img src={s.facPreview} alt="факсимиле" style={{ maxWidth: 120, maxHeight: 48, objectFit: "contain" }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="tpl-section">
          <h3>Блоки на холсте ({elements.length + images.length})</h3>
          {elements.length === 0 && images.length === 0 ? (
            <p style={{ margin: 0, color: "var(--tpl-muted)", fontSize: 12 }}>Добавьте элементы, чтобы они появились в списке.</p>
          ) : (
            <div className="tpl-block-list">
              {elements.map((element) => {
                const isVar = (element.text || "").includes("{");
                return (
                  <div
                    key={`b-${element.id}`}
                    className={`tpl-block-row${selectedElementId === element.id ? " is-active" : ""}`}
                    onClick={() => handleSelectElement(element.id)}
                  >
                    <span className="tpl-block-kind">{isVar ? "▣" : "T"}</span>
                    <span className="tpl-block-label">{element.text}</span>
                    <span className={`tpl-block-tag${isVar ? " variable" : ""}`}>{isVar ? "Переменная" : "Текст"}</span>
                    <button
                      type="button"
                      className="tpl-block-delete"
                      onClick={(e) => { e.stopPropagation(); pushUndo(); removeEl(element.id); }}
                      title="Удалить блок"
                      aria-label="Удалить блок"
                    >×</button>
                  </div>
                );
              })}
              {images.map((img) => (
                <div
                  key={`bi-${img.id}`}
                  className={`tpl-block-row${selectedImageId === img.id ? " is-active" : ""}`}
                  onClick={() => handleSelectImage(img.id)}
                >
                  <span className="tpl-block-kind">⬚</span>
                  <span className="tpl-block-label">{img.label}</span>
                  <span className="tpl-block-tag">{img.kind === "stamp" ? "Печать" : img.kind === "signature" ? "Подпись" : "Изобр."}</span>
                  <button
                    type="button"
                    className="tpl-block-delete"
                    onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                    title="Удалить"
                    aria-label="Удалить изображение"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      <div className="tpl-canvas-area">
        <div className="tpl-canvas-frame" style={{ "--tpl-zoom": zoom / 100 }}>
          <div className="tpl-canvas-sheet">
            <AccuratePreview
              bgUrl={bgUrl}
              elements={elements}
              signers={signers}
              signersLayout={signersLayout}
              margins={margins}
              previewVariables={effectivePreviewVariables}
              fontFaces={availableFonts}
              selectedElementId={selectedElementId}
              onElementSelect={handleSelectElement}
              onElementMove={handleElementMove}
              onElementContextMenu={handleElementContextMenu}
              onElementDoubleClick={handleElementDoubleClick}
              onElementInlineEdit={handleInlineEdit}
              onElementResize={handleElementResize}
              onSignersMove={handleSignersMove}
              showGrid={editorMode === "edit" && showGrid}
              showSafeZone={editorMode === "edit" && showGrid}
              showRulers={editorMode === "edit" && showGrid}
              showLiteralVariables={editorMode === "edit"}
              hideSigners={signers.length === 0}
              maxWidth={9999}
              images={images}
              selectedImageId={selectedImageId}
              onImageSelect={handleSelectImage}
              onImageMove={moveImage}
            />
          </div>
        </div>
      </div>

      <aside className="tpl-side right" aria-label="Свойства выделенного блока">
        <div className="tpl-section">
          <h3>Свойства</h3>

          {selectedImage ? (
            <div className="tpl-props">
              <p className="tpl-hint" style={{ margin: 0 }}>
                {selectedImage.kind === "stamp" ? "Печать организации" : selectedImage.kind === "signature" ? "Подпись" : "Изображение"} · {selectedImage.file?.name || "изображение"}
              </p>
              <div className="tpl-prop-grid-2">
                <label>
                  X (%)
                  <input type="number" min={0} max={100} value={Math.round(selectedImage.x)} onChange={(e) => updateImage(selectedImage.id, { x: Number(e.target.value) })} />
                </label>
                <label>
                  Y (%)
                  <input type="number" min={0} max={100} value={Math.round(selectedImage.y)} onChange={(e) => updateImage(selectedImage.id, { y: Number(e.target.value) })} />
                </label>
              </div>
              <div className="tpl-prop-grid-2">
                <label>
                  Ширина (мм)
                  <input type="number" min={5} max={210} value={selectedImage.widthMm} onChange={(e) => updateImage(selectedImage.id, { widthMm: Number(e.target.value) })} />
                </label>
                <label>
                  Высота (мм)
                  <input type="number" min={5} max={297} value={selectedImage.heightMm} onChange={(e) => updateImage(selectedImage.id, { heightMm: Number(e.target.value) })} />
                </label>
              </div>
              <label>
                Прозрачность
                <input type="range" min={0.2} max={1} step={0.05} value={selectedImage.opacity ?? 1} onChange={(e) => updateImage(selectedImage.id, { opacity: Number(e.target.value) })} />
              </label>
              <input type="file" accept="image/*" ref={imageReplaceInputRef} style={{ display: "none" }} onChange={handleReplaceImageFile} />
              <div className="tpl-prop-grid-2">
                <button type="button" className="tpl-btn" onClick={() => imageReplaceInputRef.current?.click()}>
                  Заменить
                </button>
                <button type="button" className="tpl-btn" onClick={() => toggleLocked("image", selectedImage.id)}>
                  {selectedImage.locked ? "Разблокировать" : "Заблокировать"}
                </button>
              </div>
              <div className="tpl-prop-grid-2">
                <button type="button" className="tpl-btn" onClick={() => toggleHidden("image", selectedImage.id)}>
                  {selectedImage.hidden ? "Показать" : "Скрыть"}
                </button>
                <button type="button" className="tpl-btn" onClick={() => moveLayer("image", selectedImage.id, "front")}>
                  На передний план
                </button>
              </div>
              <button type="button" className="tpl-btn" onClick={() => moveLayer("image", selectedImage.id, "back")}>
                На задний план
              </button>
              <button type="button" className="tpl-btn danger" onClick={() => removeImage(selectedImage.id)}>
                Удалить изображение
              </button>
              <p className="tpl-hint" style={{ margin: 0 }}>
                Изображение видно только в конструкторе. Для применения печати в PDF используйте загрузку факсимиле подписанта.
              </p>
            </div>
          ) : selectedElement ? (
            <div className="tpl-props">
              <label>
                Текст
                <textarea
                  rows={3}
                  value={selectedElement.text}
                  onChange={(event) => updateSelectedElement("text", event.target.value)}
                />
              </label>
              {(selectedElement.text || "").includes("{") && (
                <p className="tpl-hint" style={{ margin: 0 }}>
                  Этот блок содержит переменную. При выпуске грамоты значение будет подставлено автоматически.
                </p>
              )}
              <div className="tpl-prop-grid-2">
                <label>
                  Позиция X (%)
                  <input type="number" min={0} max={100} value={Math.round(selectedElement.x)} onChange={(event) => updateSelectedElement("x", Number(event.target.value))} />
                </label>
                <label>
                  Позиция Y (%)
                  <input type="number" min={0} max={100} value={Math.round(selectedElement.y)} onChange={(event) => updateSelectedElement("y", Number(event.target.value))} />
                </label>
              </div>
              <div className="tpl-prop-grid-2">
                <label>
                  Ширина (мм)
                  <input type="number" min={5} max={210} value={selectedElement.maxWidthMm || ""} onChange={(event) => updateSelectedElement("maxWidthMm", Number(event.target.value) || null)} placeholder="авто" />
                </label>
                <label>
                  Высота (мм)
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
              <div className="tpl-prop-grid-2">
                <label>
                  Размер
                  <input type="number" min={6} max={120} value={selectedElement.size} onChange={(event) => updateSelectedElement("size", Number(event.target.value))} />
                </label>
                <label>
                  Цвет
                  <div className="tpl-prop-color">
                    <input type="color" value={selectedElement.color} onChange={(event) => updateSelectedElement("color", event.target.value)} />
                    <input value={selectedElement.color} onChange={(event) => updateSelectedElement("color", event.target.value)} />
                  </div>
                </label>
              </div>
              <label>
                Начертание
                <div className="tpl-toggle-row">
                  <button
                    type="button"
                    className={selectedElement.weight === "400" ? "is-active" : ""}
                    onClick={() => updateSelectedElement("weight", "400")}
                  >Обычный</button>
                  <button
                    type="button"
                    className={selectedElement.weight === "600" ? "is-active" : ""}
                    onClick={() => updateSelectedElement("weight", "600")}
                  >Полу­жирный</button>
                  <button
                    type="button"
                    className={selectedElement.weight === "700" ? "is-active" : ""}
                    onClick={() => updateSelectedElement("weight", "700")}
                  >Жирный</button>
                </div>
              </label>
              <label>
                Стиль
                <div className="tpl-toggle-row">
                  <button
                    type="button"
                    className={selectedElement.italic ? "is-active" : ""}
                    onClick={() => updateSelectedElement("italic", !selectedElement.italic)}
                    title="Курсив"
                  ><i>I</i></button>
                  <button
                    type="button"
                    className={selectedElement.underline ? "is-active" : ""}
                    onClick={() => updateSelectedElement("underline", !selectedElement.underline)}
                    title="Подчёркивание"
                  ><u>U</u></button>
                  <button
                    type="button"
                    onClick={() => { updateSelectedElement("italic", false); updateSelectedElement("underline", false); }}
                    title="Сбросить стиль"
                  >—</button>
                </div>
              </label>
              <label>
                Выравнивание
                <div className="tpl-toggle-row">
                  {[["left", "Слева"], ["center", "Центр"], ["right", "Справа"]].map(([value, lbl]) => (
                    <button
                      key={value}
                      type="button"
                      className={selectedAlign === value ? "is-active" : ""}
                      onClick={() => updateSelectedElement("align", value)}
                    >{lbl}</button>
                  ))}
                </div>
              </label>
              <div className="tpl-prop-grid-2">
                <button type="button" className="tpl-btn" onClick={() => { pushUndo(); centerElementH(selectedElement.id); }} title="Поставить по центру по горизонтали">
                  ↔ По центру X
                </button>
                <button type="button" className="tpl-btn" onClick={() => { pushUndo(); centerElementV(selectedElement.id); }} title="Поставить по центру по вертикали">
                  ↕ По центру Y
                </button>
              </div>
              <label>
                Межстрочный интервал
                <input type="number" min={1} max={2} step={0.05} value={selectedElement.lineHeight || 1.25} onChange={(event) => updateSelectedElement("lineHeight", Number(event.target.value) || 1.25)} />
              </label>
              {(selectedElement.text || "").includes("{") && (
                <label>
                  Падеж переменной
                  <select
                    value={(() => {
                      const m = (selectedElement.text || "").match(/\{[^}]*\|\s*([^}]+)\}/);
                      return m ? m[1].trim() : "";
                    })()}
                    onChange={(e) => {
                      const cs = e.target.value;
                      const newText = (selectedElement.text || "").replace(/\{([^}|]+)(?:\s*\|[^}]*)?\}/g, (_, name) => (cs ? `{${name.trim()} | ${cs}}` : `{${name.trim()}}`));
                      updateSelectedElement("text", newText);
                    }}
                  >
                    {GRAMMAR_CASES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </label>
              )}
              <div className="tpl-divider" />
              <div className="tpl-prop-grid-2">
                <button type="button" className="tpl-btn" onClick={() => { pushUndo(); toggleHidden("element", selectedElement.id); }}>
                  {selectedElement.hidden ? "Показать" : "Скрыть"}
                </button>
                <button type="button" className="tpl-btn" onClick={() => { pushUndo(); toggleLocked("element", selectedElement.id); }}>
                  {selectedElement.locked ? "Разблокировать" : "Заблокировать"}
                </button>
              </div>
              <div className="tpl-prop-grid-2">
                <button type="button" className="tpl-btn" onClick={() => { pushUndo(); moveElementZ(selectedElement.id, "front"); }}>
                  На передний план
                </button>
                <button type="button" className="tpl-btn" onClick={() => { pushUndo(); moveElementZ(selectedElement.id, "back"); }}>
                  На задний план
                </button>
              </div>
              <button type="button" className="tpl-btn" onClick={() => { pushUndo(); duplicateEl(selectedElement.id); }}>
                Дублировать блок
              </button>
              <button type="button" className="tpl-btn danger" onClick={() => { pushUndo(); removeEl(selectedElement.id); }}>
                Удалить блок
              </button>
            </div>
          ) : (
            <div className="tpl-empty-props">
              Выберите элемент на холсте, чтобы изменить его параметры.
            </div>
          )}
          {msg && <div style={{ marginTop: 12 }}><AlertBanner type={msgType}>{msg}</AlertBanner></div>}
        </div>
      </aside>

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
