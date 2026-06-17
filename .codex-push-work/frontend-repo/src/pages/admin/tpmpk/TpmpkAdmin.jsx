import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../../../constants/index.js";
import { authHeaders, getStoredAccessToken } from "../../../utils/authHeaders.js";

const statusLabels = {
  new: "Новая",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
  done: "Выполнена",
};

const readinessLabels = {
  full: "Полная готовность",
  not_ready: "Документы не готовы",
  psychiatrist_consultation: "Нужна консультация врача-психиатра",
};

const weekLabels = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const DEFAULT_WORKDAY = {
  open_time: "09:00",
  close_time: "17:00",
  lunch_start: "13:00",
  lunch_end: "14:00",
  slot_minutes: 30,
};
const SLOT_MINUTES_MIN = 10;
const SLOT_MINUTES_MAX = 240;
const SLOT_MINUTES_STEP = 5;

const auditActionLabels = {
  update_template: "Обновлен шаблон рабочих дней",
  apply_template: "Шаблон применен к расписанию",
  update_day: "Изменен конкретный день",
  toggle_day: "Изменена доступность дня",
  transfer_day: "Записи перенесены на другую дату",
  create_phone_appointment: "Создана запись со звонка",
  reveal_phone: "Открыт телефон родителя",
  cancel_appointment: "Запись отменена",
  done_appointment: "Запись отмечена выполненной",
};

const auditObjectLabels = {
  appointment: "Запись",
  schedule_template: "Шаблон расписания",
  working_day: "День расписания",
};

const auditPayloadLabels = {
  date: "Дата",
  field: "Поле",
  is_open: "День открыт",
  moved: "Перенесено",
  partial: "Частично",
  status: "Статус",
  target_date: "Новая дата",
  target_day_id: "ID новой даты",
  total: "Всего записей",
  weekdays: "Дни недели",
};

function toLocalDateInputValue(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayIso(offset = 0) {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  return toLocalDateInputValue(value);
}

const emptyManual = {
  child_full_name: "",
  child_age: "7",
  child_registered_irkutsk: true,
  document_readiness: "full",
  parent_phone: "",
  is_repeat: false,
  needs_psychiatrist: false,
  date: todayIso(),
  start_time: "",
};

function formatDate(value, compact = false) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: compact ? "short" : "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value) {
  return String(value || "").slice(0, 5) || "";
}

function appointmentDateTimeLabel(appointment) {
  const dateLabel = formatDate(appointment?.date, true);
  const timeLabel = formatTime(appointment?.start_time) || "-";
  return `${dateLabel}, ${timeLabel}`;
}

function onlyPhoneDigits(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 11);
}

function normalizePhoneDigits(value) {
  const digits = onlyPhoneDigits(value);
  return digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
}

function formatPhoneInput(value) {
  const normalized = normalizePhoneDigits(value);
  const body = normalized.startsWith("7") ? normalized.slice(1) : normalized;
  if (!normalized) return "";
  const area = body.slice(0, 3);
  const first = body.slice(3, 6);
  const second = body.slice(6, 8);
  const third = body.slice(8, 10);
  let result = "+7";
  if (area) result += ` (${area}`;
  if (area.length === 3) result += ")";
  if (first) result += ` ${first}`;
  if (second) result += `-${second}`;
  if (third) result += `-${third}`;
  return result;
}

function phoneForApi(value) {
  const normalized = normalizePhoneDigits(value);
  return `+${normalized}`;
}

function groupAppointmentsByDate(rows) {
  return rows.reduce((groups, item) => {
    const key = item.date || "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

function clampSlotMinutes(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_WORKDAY.slot_minutes;
  return Math.min(SLOT_MINUTES_MAX, Math.max(SLOT_MINUTES_MIN, Math.trunc(number)));
}

function validateSlotMinutes(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "Укажите длительность приема числом.";
  if (number < SLOT_MINUTES_MIN || number > SLOT_MINUTES_MAX) {
    return `Укажите длительность от ${SLOT_MINUTES_MIN} до ${SLOT_MINUTES_MAX} минут.`;
  }
  if (!Number.isInteger(number)) return "Укажите целое количество минут.";
  if (number % SLOT_MINUTES_STEP !== 0) {
    return `Длительность приема должна быть кратна ${SLOT_MINUTES_STEP} минутам. Например: 30, 35, 40.`;
  }
  return "";
}

function normalizeDay(day) {
  return {
    ...day,
    open_time: formatTime(day.open_time) || "09:00",
    close_time: formatTime(day.close_time) || "17:00",
    lunch_start: formatTime(day.lunch_start) || "13:00",
    lunch_end: formatTime(day.lunch_end) || "14:00",
    slot_minutes: Number(day.slot_minutes || 30),
    note: day.note || "",
  };
}

function dayWithDefaults(day, fieldName = "is_open") {
  return {
    ...day,
    [fieldName]: true,
    ...DEFAULT_WORKDAY,
  };
}

function formatAuditValue(key, value) {
  if (Array.isArray(value)) {
    if (key === "weekdays") return value.map((weekday) => weekLabels[weekday] || weekday).join(", ");
    return value.join(", ");
  }
  if (typeof value === "boolean") return value ? "да" : "нет";
  if (key === "status") return statusLabels[value] || value;
  if (key === "date" || key === "target_date") return formatDate(value, true);
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function formatAuditDetails(payload) {
  if (!payload || typeof payload !== "object" || !Object.keys(payload).length) {
    return "Дополнительных данных нет";
  }
  return Object.entries(payload)
    .map(([key, value]) => `${auditPayloadLabels[key] || key}: ${formatAuditValue(key, value)}`)
    .join(" · ");
}

function auditUserLabel(item) {
  return item.user_display_name || item.user_email || item.username || "Неизвестный пользователь";
}

function buildApiError(data) {
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((item) => {
      const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
      if (field === "slot_minutes") {
        return `Длительность приема: укажите значение от ${SLOT_MINUTES_MIN} до ${SLOT_MINUTES_MAX} минут, кратное ${SLOT_MINUTES_STEP}.`;
      }
      return `${field || "Поле"}: ${item.msg || "проверьте значение"}`;
    }).join(" ");
  }
  return "Не удалось сохранить данные. Проверьте выделенные поля.";
}

async function fetchJson(path, options = {}) {
  if (path.startsWith("/api/tpmpk/admin/") && !getStoredAccessToken()) {
    throw new Error("Сессия истекла. Войдите в личный кабинет ТПМПК заново.");
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...authHeaders({ "Content-Type": "application/json" }),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(buildApiError(data));
  }
  return data;
}

function Icon({ name, size = 18 }) {
  const paths = {
    chart: <><path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 16v-5" /><path d="M12 16V8" /><path d="M16 16v-9" /></>,
    calendar: <><path d="M7 3v4" /><path d="M17 3v4" /><path d="M4 9h16" /><rect x="4" y="5" width="16" height="16" rx="3" /></>,
    phone: <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.7.6 2.5a2 2 0 0 1-.5 2.1L8 9.5a16 16 0 0 0 6.5 6.5l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.6.5 2.5.6a2 2 0 0 1 1.7 2Z" /></>,
    list: <><path d="M8 6h13" /><path d="M8 12h13" /><path d="M8 18h13" /><path d="M3 6h.01" /><path d="M3 12h.01" /><path d="M3 18h.01" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    swap: <><path d="M17 3l4 4-4 4" /><path d="M21 7H7a4 4 0 0 0 0 8h1" /><path d="M7 21l-4-4 4-4" /><path d="M3 17h14a4 4 0 0 0 0-8h-1" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></>,
    eye: <><path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.list}
    </svg>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <article className="tp-stat">
      <span>{label}</span>
      <strong>{value ?? "-"}</strong>
      {hint && <small>{hint}</small>}
    </article>
  );
}

function Field({ label, children, error, hint, className = "" }) {
  return (
    <label className={`tp-field${error ? " has-error" : ""}${className ? ` ${className}` : ""}`}>
      <span>{label}</span>
      {children}
      {hint && !error && <small className="tp-field-hint">{hint}</small>}
      {error && <small className="tp-field-error">{error}</small>}
    </label>
  );
}

export default function TpmpkAdmin({ currentUser, onLogout }) {
  const heroRef = useRef(null);
  const didMountRef = useRef(false);
  const modules = useMemo(() => [
    { key: "dashboard", label: "Дашборд", hint: "Сегодня", icon: "chart" },
    { key: "day", label: "Расписание", hint: "День приема", icon: "calendar" },
    { key: "manual", label: "Запись со звонка", hint: "Ручная запись", icon: "phone" },
    { key: "appointments", label: "Все записи", hint: "Журнал заявок", icon: "list" },
    { key: "template", label: "Рабочие дни", hint: "Основное расписание", icon: "clock" },
    { key: "transfer", label: "Перенос дня", hint: "Дополнительно", icon: "swap" },
    { key: "audit", label: "Журнал", hint: "История действий", icon: "book" },
  ], []);

  const [activeModule, setActiveModule] = useState("dashboard");
  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [dashboard, setDashboard] = useState(null);
  const [dayData, setDayData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [template, setTemplate] = useState([]);
  const [days, setDays] = useState([]);
  const [audit, setAudit] = useState([]);
  const [customDayDate, setCustomDayDate] = useState(todayIso());
  const [customDay, setCustomDay] = useState(null);
  const [customDayLoading, setCustomDayLoading] = useState(false);
  const [showCustomDaySettings, setShowCustomDaySettings] = useState(false);
  const [templateErrors, setTemplateErrors] = useState({});
  const [customDayErrors, setCustomDayErrors] = useState({});
  const [manual, setManual] = useState(emptyManual);
  const [manualSlots, setManualSlots] = useState(null);
  const [manualSlotsLoading, setManualSlotsLoading] = useState(false);
  const [manualErrors, setManualErrors] = useState({});
  const [transfer, setTransfer] = useState({ sourceDayId: "", target_date: todayIso(1), allow_partial: false });
  const [transferWarning, setTransferWarning] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [revealedPhones, setRevealedPhones] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const currentDateLabel = useMemo(() => new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date()), []);

  function showToast(type, text) {
    setToast({ type, text });
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(null), 4200);
  }

  async function loadData(view = activeModule) {
    setLoading(true);
    try {
      if (view === "dashboard") setDashboard(await fetchJson(`/api/tpmpk/admin/dashboard/?date=${todayIso()}`));
      if (view === "day") setDayData(await fetchJson(`/api/tpmpk/admin/day/?date=${selectedDate}`));
      if (view === "appointments") setAppointments((await fetchJson("/api/tpmpk/admin/appointments/")).items || []);
      if (view === "template") setTemplate((await fetchJson("/api/tpmpk/admin/template/")).items || []);
      if (view === "transfer") {
        const data = await fetchJson("/api/tpmpk/admin/days/");
        const items = (data.items || []).map(normalizeDay);
        setDays(items);
        setTransfer((prev) => ({ ...prev, sourceDayId: prev.sourceDayId || String(items[0]?.id || "") }));
      }
      if (view === "audit") setAudit((await fetchJson("/api/tpmpk/admin/audit/")).items || []);
    } catch (error) {
      showToast("error", error.message || "Не удалось загрузить данные");
    } finally {
      setLoading(false);
    }
  }

  async function loadManualSlots(dateValue = manual.date) {
    setManualSlotsLoading(true);
    try {
      const data = await fetchJson(`/api/tpmpk/admin/day/?date=${dateValue}`);
      const publicSlots = await fetchJson(`/api/tpmpk/slots/?date=${dateValue}`);
      const freeSlots = (publicSlots || [])
        .filter((slot) => slot.is_available)
        .map((slot) => ({ ...slot, status: "free", appointment: null }));
      setManualSlots({ ...data, slots: freeSlots });
      setManual((prev) => {
        if (prev.date !== dateValue) return prev;
        if (prev.start_time && freeSlots.some((slot) => formatTime(slot.start_time) === formatTime(prev.start_time))) return prev;
        return { ...prev, start_time: formatTime(freeSlots[0]?.start_time) || "" };
      });
    } catch (error) {
      setManualSlots(null);
      showToast("error", error.message || "Не удалось загрузить свободные слоты");
    } finally {
      setManualSlotsLoading(false);
    }
  }

  useEffect(() => {
    document.title = "ТПМПК - личный кабинет психолога";
  }, []);

  useEffect(() => {
    loadData(activeModule);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule]);

  useEffect(() => {
    if (activeModule === "day") loadData("day");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  useEffect(() => {
    if (activeModule !== "template" || !showCustomDaySettings) return;
    loadCustomDay(customDayDate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule, customDayDate, showCustomDaySettings]);

  useEffect(() => {
    if (activeModule !== "manual") return;
    loadManualSlots(manual.date);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule, manual.date]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    window.requestAnimationFrame(() => {
      heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [activeModule]);

  function shiftSelectedDate(offset) {
    const value = new Date(`${selectedDate}T00:00:00`);
    value.setDate(value.getDate() + offset);
    setSelectedDate(toLocalDateInputValue(value));
  }

  function askConfirm(options) {
    setConfirmDialog(options);
  }

  function closeConfirm() {
    setConfirmDialog(null);
  }

  function confirmRevealPhone(appointment) {
    askConfirm({
      title: "Показать телефон?",
      text: "Телефон родителя относится к персональным данным. Откройте его только если он нужен для работы с записью.",
      actionLabel: "Показать телефон",
      tone: "primary",
      onConfirm: () => revealPhone(appointment),
    });
  }

  function confirmStatusChange(appointment, action) {
    askConfirm({
      title: action === "cancel" ? "Отменить запись?" : "Отметить запись выполненной?",
      text: action === "cancel"
        ? "Запись будет исключена из активного расписания. Это действие попадет в журнал."
        : "Запись получит статус «Выполнена» и больше не будет переноситься на другие дни.",
      actionLabel: action === "cancel" ? "Да, отменить" : "Да, завершить",
      tone: action === "cancel" ? "danger" : "primary",
      onConfirm: () => changeStatus(appointment, action),
    });
  }

  async function revealPhone(appointment) {
    try {
      const data = await fetchJson(`/api/tpmpk/admin/appointments/${appointment.id}/reveal-phone/`, { method: "POST" });
      setRevealedPhones((prev) => ({ ...prev, [appointment.id]: data.phone }));
      showToast("success", "Телефон открыт");
    } catch (error) {
      showToast("error", error.message || "Не удалось открыть телефон");
    }
  }

  async function changeStatus(appointment, action) {
    try {
      await fetchJson(`/api/tpmpk/admin/appointments/${appointment.id}/${action}/`, { method: "POST" });
      setSelectedAppointment(null);
      showToast("success", action === "cancel" ? "Запись отменена" : "Запись выполнена");
      await loadData(activeModule);
    } catch (error) {
      showToast("error", error.message || "Ошибка изменения статуса");
    }
  }

  function validateTemplate() {
    const errors = {};
    template.forEach((item) => {
      if (!item.is_working_default) return;
      const slotError = validateSlotMinutes(item.slot_minutes);
      if (slotError) errors[`${item.weekday}.slot_minutes`] = slotError;
    });
    setTemplateErrors(errors);
    return errors;
  }

  async function saveTemplate() {
    const errors = validateTemplate();
    if (Object.keys(errors).length) {
      showToast("error", "Проверьте поля с ошибками в рабочих днях");
      return;
    }
    try {
      const data = await fetchJson("/api/tpmpk/admin/template/", {
        method: "PUT",
        body: JSON.stringify({ items: template.map((item) => ({ ...item, slot_minutes: clampSlotMinutes(item.slot_minutes) })) }),
      });
      showToast("success", `Рабочие дни сохранены, расписание обновлено: ${data.updated_days || 0} дней`);
      await loadData("template");
    } catch (error) {
      showToast("error", error.message || "Ошибка сохранения рабочих дней");
    }
  }

  function validateManual() {
    const errors = {};
    const name = manual.child_full_name.trim();
    const age = Number(manual.child_age);
    const phoneDigits = normalizePhoneDigits(manual.parent_phone);
    const freeSlots = (manualSlots?.slots || []).filter((slot) => slot.status === "free" && !slot.appointment);
    if (name.length < 2 || name.split(/\s+/).length < 2) errors.child_full_name = "Введите фамилию и имя ребенка.";
    if (!Number.isInteger(age) || age < 0 || age > 18) errors.child_age = "Возраст должен быть целым числом от 0 до 18.";
    if (!manual.date) errors.date = "Выберите дату приема.";
    if (!manual.start_time) errors.start_time = "Выберите свободный слот из списка.";
    if (manual.start_time && !freeSlots.some((slot) => formatTime(slot.start_time) === formatTime(manual.start_time))) {
      errors.start_time = "Выбранный слот уже занят или недоступен. Выберите другой.";
    }
    if (phoneDigits.length !== 11 || !["7", "8"].includes(phoneDigits[0])) {
      errors.parent_phone = "Введите 11 цифр. Номер должен начинаться с 7 или 8.";
    }
    setManualErrors(errors);
    return errors;
  }

  async function createManualAppointment(event) {
    event.preventDefault();
    const errors = validateManual();
    if (Object.keys(errors).length) {
      showToast("error", "Проверьте поля ручной записи");
      return;
    }
    try {
      await fetchJson("/api/tpmpk/admin/manual-appointments/", {
        method: "POST",
        body: JSON.stringify({
          ...manual,
          child_age: Number(manual.child_age),
          parent_phone: phoneForApi(manual.parent_phone),
          start_time: `${manual.start_time}:00`,
        }),
      });
      setManual({ ...emptyManual, date: manual.date });
      setManualErrors({});
      await loadManualSlots(manual.date);
      showToast("success", "Запись создана");
      if (activeModule === "day" || activeModule === "dashboard" || activeModule === "appointments") await loadData(activeModule);
    } catch (error) {
      showToast("error", error.message || "Не удалось создать запись");
    }
  }

  async function transferDay(event) {
    event.preventDefault();
    askConfirm({
      title: "Перенести записи?",
      text: "Будут перенесены только активные записи. Выполненные и отмененные записи останутся на месте.",
      actionLabel: "Перенести",
      tone: "primary",
      onConfirm: runTransferDay,
    });
  }

  async function runTransferDay() {
    setTransferWarning(null);
    try {
      const data = await fetchJson(`/api/tpmpk/admin/days/${transfer.sourceDayId}/transfer/`, {
        method: "POST",
        body: JSON.stringify({ target_date: transfer.target_date, allow_partial: transfer.allow_partial }),
      });
      if (data.status === "not_enough_slots") {
        setTransferWarning(data);
        showToast("error", "Недостаточно свободных слотов");
        return;
      }
      if (data.status === "no_appointments") {
        showToast("error", data.message || "В выбранном дне нет записей для переноса");
        setTransferWarning({ message: data.message || "В выбранном дне нет записей для переноса" });
        return;
      }
      if (data.status === "no_free_slots") {
        showToast("error", data.message || "На новую дату нет свободных слотов");
        setTransferWarning({ message: data.message || "На новую дату нет свободных слотов" });
        return;
      }
      showToast("success", `Перенесено записей: ${data.moved?.length || 0}`);
      await loadData("transfer");
    } catch (error) {
      showToast("error", error.message || "Ошибка переноса");
    }
  }

  async function loadCustomDay(dateValue = customDayDate) {
    setCustomDayLoading(true);
    setCustomDayErrors({});
    try {
      const data = await fetchJson(`/api/tpmpk/admin/day/?date=${dateValue}`);
      setCustomDay(normalizeDay(data.day));
    } catch (error) {
      showToast("error", error.message || "Не удалось загрузить день");
    } finally {
      setCustomDayLoading(false);
    }
  }

  async function saveCustomDay() {
    if (!customDay?.id) return;
    const slotError = customDay.is_open ? validateSlotMinutes(customDay.slot_minutes) : "";
    if (slotError) {
      setCustomDayErrors({ slot_minutes: slotError });
      showToast("error", "Проверьте длительность приема");
      return;
    }
    setCustomDayErrors({});
    try {
      const data = await fetchJson(`/api/tpmpk/admin/days/${customDay.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          is_open: customDay.is_open,
          open_time: customDay.is_open ? customDay.open_time : null,
          close_time: customDay.is_open ? customDay.close_time : null,
          lunch_start: customDay.is_open ? customDay.lunch_start : null,
          lunch_end: customDay.is_open ? customDay.lunch_end : null,
          slot_minutes: clampSlotMinutes(customDay.slot_minutes),
          note: customDay.note || "",
        }),
      });
      setCustomDay(normalizeDay(data));
      showToast("success", "Настройки дня сохранены");
    } catch (error) {
      showToast("error", error.message || "Не удалось сохранить день");
    }
  }

  const appointmentRows = (rows) => rows.map((item) => (
    <button className="tp-record-row" key={item.id} type="button" onClick={() => setSelectedAppointment(item)}>
      <span className="tp-record-time">
        <strong>{formatTime(item.start_time)}</strong>
        <small>{formatDate(item.date, true)}</small>
      </span>
      <span className="tp-record-main">
        <strong>{item.child_full_name}</strong>
        <small>{item.child_age} лет, {item.child_registered_irkutsk ? "Иркутск" : "не Иркутск"} · {readinessLabels[item.document_readiness] || "Документы"}</small>
      </span>
      <span className={`tp-status ${item.status}`}>{statusLabels[item.status] || item.status}</span>
    </button>
  ));

  function renderDashboard() {
    const items = dashboard?.today_appointments || [];
    return (
      <section className="tp-module">
        <div className="tp-module-head">
          <div>
            <p>Сегодня, {formatDate(todayIso())}</p>
            <h2>Состояние приема ТПМПК</h2>
          </div>
          <button className="tp-link-btn" type="button" onClick={() => setActiveModule("day")}>Открыть расписание</button>
        </div>
        <div className="tp-stat-grid">
          <StatCard label="Записей сегодня" value={dashboard?.today_count ?? 0} hint="Только текущая дата" />
          <StatCard label="Ближайший свободный слот" value={formatTime(dashboard?.nearest_slot) || "-"} hint="Сегодня" />
          <StatCard label="Новых заявок" value={dashboard?.new_24h ?? 0} hint="За последние дни" />
        </div>
        <div className="tp-panel">
          <div className="tp-panel-head">
            <h3>Записи на сегодня</h3>
            <span>{items.length} записей</span>
          </div>
          <div className="tp-record-list">
            {items.length ? appointmentRows(items) : <div className="tp-empty">На сегодня записей нет.</div>}
          </div>
        </div>
      </section>
    );
  }

  function renderDay() {
    const slots = dayData?.slots || [];
    const day = dayData?.day;
    return (
      <section className="tp-module">
        <div className="tp-datebar">
          <button type="button" onClick={() => shiftSelectedDate(-1)}>← Предыдущий день</button>
          <div>
            <strong>{formatDate(selectedDate)}</strong>
            <span>Расписание приема и занятые слоты</span>
          </div>
          <label className="tp-date-picker">
            <Icon name="calendar" />
            <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} aria-label="Выбрать дату расписания" />
          </label>
          <button type="button" onClick={() => shiftSelectedDate(1)}>Следующий день →</button>
          <button className={selectedDate === todayIso() ? "active" : ""} type="button" onClick={() => setSelectedDate(todayIso())}>Сегодня</button>
        </div>
        {day && (
          <div className={`tp-day-summary ${day.is_open ? "open" : "closed"}`}>
            <strong>{day.is_open ? "День открыт" : "День закрыт"}</strong>
            <span>Прием {formatTime(day.open_time)} - {formatTime(day.close_time)}</span>
            <span>Обед {formatTime(day.lunch_start)} - {formatTime(day.lunch_end)}</span>
            <span>Длительность приема {day.slot_minutes} мин.</span>
          </div>
        )}
        <div className="tp-slot-grid">
          {slots.map((slot) => (
            <button
              className={`tp-slot ${slot.appointment ? "occupied" : "free"}`}
              key={`${slot.working_day_id}-${slot.start_time}`}
              type="button"
              onClick={() => slot.appointment && setSelectedAppointment(slot.appointment)}
            >
              <span className="tp-slot-time">{formatTime(slot.start_time)}</span>
              {slot.appointment ? (
                <span className="tp-slot-text">
                  <strong>{slot.appointment.child_full_name}</strong>
                  <small>{slot.appointment.child_age} лет · {statusLabels[slot.appointment.status]}</small>
                </span>
              ) : (
                <span className="tp-free">Свободно</span>
              )}
            </button>
          ))}
          {!slots.length && <div className="tp-empty full">Расписание на эту дату не создано.</div>}
        </div>
      </section>
    );
  }

  function renderManual() {
    const freeSlots = (manualSlots?.slots || []).filter((slot) => slot.status === "free" && !slot.appointment);
    const day = manualSlots?.day;
    return (
      <section className="tp-module narrow">
        <div className="tp-module-head">
          <div>
            <p>Ручная запись</p>
            <h2>Запись через свободный слот</h2>
          </div>
          <button className="tp-link-btn" type="button" onClick={() => loadManualSlots(manual.date)}>Обновить слоты</button>
        </div>
        <div className="tp-help-card">
          <strong>Как заполнить</strong>
          <span>Выберите дату, затем свободное время. Система не даст создать запись в занятый или закрытый слот.</span>
        </div>
        <form className="tp-form" onSubmit={createManualAppointment}>
          <Field label="ФИО ребенка" error={manualErrors.child_full_name} hint="Укажите фамилию, имя и при наличии отчество.">
            <input value={manual.child_full_name} onChange={(event) => { setManualErrors((prev) => ({ ...prev, child_full_name: "" })); setManual({ ...manual, child_full_name: event.target.value }); }} required placeholder="Иванов Иван Иванович" />
          </Field>
          <Field label="Возраст" error={manualErrors.child_age} hint="Возраст ребенка на момент обращения.">
            <input type="number" min="0" max="18" value={manual.child_age} onChange={(event) => { setManualErrors((prev) => ({ ...prev, child_age: "" })); setManual({ ...manual, child_age: event.target.value }); }} required />
          </Field>
          <Field label="Ребенок прописан в Иркутске?" hint="Это влияет на порядок приема документов.">
            <select value={manual.child_registered_irkutsk ? "true" : "false"} onChange={(event) => setManual({ ...manual, child_registered_irkutsk: event.target.value === "true" })}>
              <option value="true">Да</option>
              <option value="false">Нет</option>
            </select>
          </Field>
          <Field label="Готовность документов" hint="Выберите состояние по словам родителя или законного представителя.">
            <select value={manual.document_readiness} onChange={(event) => setManual({ ...manual, document_readiness: event.target.value })}>
              <option value="full">Полная готовность</option>
              <option value="not_ready">Документы не готовы</option>
              <option value="psychiatrist_consultation">Нужна консультация врача-психиатра</option>
            </select>
          </Field>
          <Field label="Телефон родителя" error={manualErrors.parent_phone}>
            <input
              value={formatPhoneInput(manual.parent_phone)}
              inputMode="tel"
              maxLength={18}
              onChange={(event) => {
                setManualErrors((prev) => ({ ...prev, parent_phone: "" }));
                setManual({ ...manual, parent_phone: normalizePhoneDigits(event.target.value) });
              }}
              required
              placeholder="+7 (___) ___-__-__"
            />
          </Field>
          <Field label="Дата приема" error={manualErrors.date} hint="После выбора даты ниже появятся доступные слоты.">
            <input type="date" value={manual.date} onChange={(event) => { setManualErrors((prev) => ({ ...prev, date: "", start_time: "" })); setManual({ ...manual, date: event.target.value, start_time: "" }); }} required />
          </Field>
          <div className={`tp-slot-picker${manualErrors.start_time ? " has-error" : ""}`}>
            <div className="tp-slot-picker-head">
              <strong>Свободные слоты</strong>
              <span>{manualSlotsLoading ? "Загружаем..." : day?.is_open ? `День открыт, ${freeSlots.length} свободно` : "День закрыт или расписание не создано"}</span>
            </div>
            {day?.is_open && (
              <div className="tp-manual-slots" role="radiogroup" aria-label="Выберите свободное время приема">
                {freeSlots.map((slot) => {
                  const timeValue = formatTime(slot.start_time);
                  return (
                    <button
                      className={`tp-manual-slot${manual.start_time === timeValue ? " active" : ""}`}
                      type="button"
                      key={`${slot.working_day_id}-${slot.start_time}`}
                      onClick={() => {
                        setManualErrors((prev) => ({ ...prev, start_time: "" }));
                        setManual({ ...manual, start_time: timeValue });
                      }}
                      aria-pressed={manual.start_time === timeValue}
                    >
                      {timeValue}
                    </button>
                  );
                })}
                {!manualSlotsLoading && !freeSlots.length && <div className="tp-empty full">На выбранную дату свободных слотов нет. Выберите другой день.</div>}
              </div>
            )}
            {!day?.is_open && !manualSlotsLoading && <div className="tp-empty full">День закрыт для записи. Выберите другую дату или настройте день в расписании.</div>}
            {manualErrors.start_time && <small className="tp-field-error">{manualErrors.start_time}</small>}
          </div>
          <div className="tp-checks">
            <label className="tp-check-card">
              <input type="checkbox" checked={manual.is_repeat} onChange={(event) => setManual({ ...manual, is_repeat: event.target.checked })} />
              <span><strong>Повторное обращение</strong><small>Отметьте, если семья уже обращалась в ТПМПК.</small></span>
            </label>
            <label className="tp-check-card">
              <input type="checkbox" checked={manual.needs_psychiatrist} onChange={(event) => setManual({ ...manual, needs_psychiatrist: event.target.checked })} />
              <span><strong>Нужна консультация психиатра</strong><small>Используйте, если заявитель сообщил о необходимости консультации.</small></span>
            </label>
          </div>
          <button className="tp-primary" type="submit" disabled={manualSlotsLoading}>Создать запись на {manual.start_time || "выбранный слот"}</button>
        </form>
      </section>
    );
  }

  function renderAppointments() {
    const grouped = groupAppointmentsByDate(appointments);
    const dateKeys = Object.keys(grouped).sort((left, right) => {
      if (left === "unknown") return 1;
      if (right === "unknown") return -1;
      return new Date(`${left}T00:00:00`) - new Date(`${right}T00:00:00`);
    });
    return (
      <section className="tp-module">
        <div className="tp-module-head">
          <div>
            <p>Все записи</p>
            <h2>Общий список заявок</h2>
          </div>
        </div>
        <div className="tp-day-groups">
          {dateKeys.length ? dateKeys.map((dateKey) => (
            <section className="tp-day-group" key={dateKey}>
              <div className="tp-day-group-head">
                <div>
                  <strong>{dateKey === "unknown" ? "Дата не указана" : formatDate(dateKey)}</strong>
                  <span>{grouped[dateKey].length} записей</span>
                </div>
              </div>
              <div className="tp-record-list">
                {appointmentRows(grouped[dateKey])}
              </div>
            </section>
          )) : <div className="tp-empty">Записей пока нет.</div>}
        </div>
      </section>
    );
  }

  function renderTemplate() {
    return (
      <section className="tp-module">
        <div className="tp-module-head">
          <div>
            <p>Основной способ составления расписания</p>
            <h2>Рабочие дни</h2>
          </div>
          <button className="tp-primary small" type="button" onClick={saveTemplate}>Сохранить рабочие дни</button>
        </div>
        <div className="tp-week-grid">
          {template.map((item) => (
            <article className={`tp-week-card ${item.is_working_default ? "active" : "off"}`} key={item.weekday}>
              <div className="tp-week-card-head">
                <strong>{weekLabels[item.weekday]}</strong>
                <label className="tp-switch">
                  <input
                    type="checkbox"
                    checked={item.is_working_default}
                    onChange={(event) => setTemplate(template.map((row) => (
                      row.weekday === item.weekday
                        ? (event.target.checked ? dayWithDefaults(row, "is_working_default") : { ...row, is_working_default: false })
                        : row
                    )))}
                  />
                  <span />
                </label>
              </div>
              {item.is_working_default ? (
                <div className="tp-week-fields">
                  <Field label="Прием с"><input type="time" value={formatTime(item.open_time)} onChange={(event) => setTemplate(template.map((row) => row.weekday === item.weekday ? { ...row, open_time: event.target.value } : row))} /></Field>
                  <Field label="Прием до"><input type="time" value={formatTime(item.close_time)} onChange={(event) => setTemplate(template.map((row) => row.weekday === item.weekday ? { ...row, close_time: event.target.value } : row))} /></Field>
                  <Field label="Обед с"><input type="time" value={formatTime(item.lunch_start)} onChange={(event) => setTemplate(template.map((row) => row.weekday === item.weekday ? { ...row, lunch_start: event.target.value } : row))} /></Field>
                  <Field label="Обед до"><input type="time" value={formatTime(item.lunch_end)} onChange={(event) => setTemplate(template.map((row) => row.weekday === item.weekday ? { ...row, lunch_end: event.target.value } : row))} /></Field>
                  <Field label="Длительность приема" error={templateErrors[`${item.weekday}.slot_minutes`]}>
                    <input
                      type="number"
                      min={SLOT_MINUTES_MIN}
                      max={SLOT_MINUTES_MAX}
                      step={SLOT_MINUTES_STEP}
                      value={item.slot_minutes}
                      aria-invalid={Boolean(templateErrors[`${item.weekday}.slot_minutes`])}
                      onChange={(event) => {
                        setTemplateErrors((prev) => ({ ...prev, [`${item.weekday}.slot_minutes`]: "" }));
                        setTemplate(template.map((row) => row.weekday === item.weekday ? { ...row, slot_minutes: event.target.value } : row));
                      }}
                    />
                  </Field>
                </div>
              ) : <div className="tp-day-off">Выходной день</div>}
            </article>
          ))}
        </div>

        <div className="tp-custom-day">
          <button
            className="tp-secondary tp-custom-toggle"
            type="button"
            onClick={() => setShowCustomDaySettings((value) => !value)}
          >
            <Icon name="calendar" />
            {showCustomDaySettings ? "Скрыть индивидуальную настройку" : "Открыть индивидуальную настройку дня"}
          </button>

          {showCustomDaySettings && (
            <>
              <div className="tp-module-head compact">
                <div>
                  <p>Дополнительная настройка</p>
                  <h2>Изменить конкретный день</h2>
                </div>
                <label className="tp-date-picker standalone">
                  <Icon name="calendar" />
                  <input type="date" value={customDayDate} onChange={(event) => setCustomDayDate(event.target.value)} aria-label="Выбрать конкретный день" />
                </label>
              </div>

              {customDayLoading && <div className="tp-inline-loading">Загружаем настройки дня...</div>}

              {customDay && (
                <article className={`tp-week-card tp-specific-day ${customDay.is_open ? "active" : "off"}`}>
                  <div className="tp-week-card-head">
                    <div>
                      <strong>{formatDate(customDay.date)}</strong>
                      <small>{customDay.is_open ? "Рабочий день" : "Выходной день"}</small>
                    </div>
                    <label className="tp-switch">
                      <input
                        type="checkbox"
                        checked={customDay.is_open}
                        onChange={(event) => setCustomDay(event.target.checked ? dayWithDefaults(customDay) : { ...customDay, is_open: false })}
                      />
                      <span />
                    </label>
                  </div>

                  {customDay.is_open ? (
                    <div className="tp-week-fields">
                      <Field label="Прием с"><input type="time" value={formatTime(customDay.open_time)} onChange={(event) => setCustomDay({ ...customDay, open_time: event.target.value })} /></Field>
                      <Field label="Прием до"><input type="time" value={formatTime(customDay.close_time)} onChange={(event) => setCustomDay({ ...customDay, close_time: event.target.value })} /></Field>
                      <Field label="Обед с"><input type="time" value={formatTime(customDay.lunch_start)} onChange={(event) => setCustomDay({ ...customDay, lunch_start: event.target.value })} /></Field>
                      <Field label="Обед до"><input type="time" value={formatTime(customDay.lunch_end)} onChange={(event) => setCustomDay({ ...customDay, lunch_end: event.target.value })} /></Field>
                      <Field label="Длительность приема" error={customDayErrors.slot_minutes}>
                        <input
                          type="number"
                          min={SLOT_MINUTES_MIN}
                          max={SLOT_MINUTES_MAX}
                          step={SLOT_MINUTES_STEP}
                          value={customDay.slot_minutes}
                          aria-invalid={Boolean(customDayErrors.slot_minutes)}
                          onChange={(event) => {
                            setCustomDayErrors((prev) => ({ ...prev, slot_minutes: "" }));
                            setCustomDay({ ...customDay, slot_minutes: event.target.value });
                          }}
                        />
                      </Field>
                      <Field label="Комментарий"><input value={customDay.note || ""} onChange={(event) => setCustomDay({ ...customDay, note: event.target.value })} placeholder="Например: сокращенный день" /></Field>
                    </div>
                  ) : <div className="tp-day-off">Этот день закрыт для записи. Включите переключатель, чтобы сразу подставить 09:00-17:00 и обед 13:00-14:00.</div>}

                  <div className="tp-card-actions">
                    <button className="tp-primary small" type="button" onClick={saveCustomDay}>Сохранить этот день</button>
                    <button className="tp-secondary" type="button" onClick={() => loadCustomDay(customDayDate)}>Вернуть сохраненные значения</button>
                  </div>
                </article>
              )}
            </>
          )}
        </div>
      </section>
    );
  }

  function renderTransfer() {
    return (
      <section className="tp-module narrow">
        <div className="tp-module-head">
          <div>
            <p>Дополнительная функция</p>
            <h2>Перенести записи на другой день</h2>
          </div>
        </div>
        <div className="tp-help-card">
          <strong>Правила переноса</strong>
          <span>Переносятся только активные записи. Выполненные и отмененные записи остаются в исходном дне.</span>
          <span>Если записей для переноса нет, действие не выполняется и журнал не пополняется ложной записью.</span>
        </div>
        <form className="tp-form" onSubmit={transferDay}>
          <Field label="Исходный день">
            <select value={transfer.sourceDayId} onChange={(event) => setTransfer({ ...transfer, sourceDayId: event.target.value })}>
              {days.map((day) => <option key={day.id} value={day.id}>{formatDate(day.date, true)} - {day.is_open ? "открыт" : "закрыт"}</option>)}
            </select>
          </Field>
          <Field label="Новая дата"><input type="date" value={transfer.target_date} onChange={(event) => setTransfer({ ...transfer, target_date: event.target.value })} required /></Field>
          <div className="tp-checks">
            <label className="tp-check-card">
              <input type="checkbox" checked={transfer.allow_partial} onChange={(event) => setTransfer({ ...transfer, allow_partial: event.target.checked })} />
              <span>
                <strong>Перенести только часть записей, если мест на новую дату меньше</strong>
                <small>Если выключено, перенос не начнется, пока для всех записей не найдется свободное время.</small>
              </span>
            </label>
          </div>
          {transferWarning && (
            <div className="tp-warning">
              {transferWarning.message || `Не хватает свободных слотов: записей ${transferWarning.appointments ?? transferWarning.required_slots}, свободно ${transferWarning.free_slots ?? transferWarning.available_slots}. Можно перенести ${transferWarning.can_move ?? 0}.`}
            </div>
          )}
          <button className="tp-primary" type="submit" disabled={!transfer.sourceDayId}>Перенести записи</button>
        </form>
      </section>
    );
  }

  function renderAudit() {
    return (
      <section className="tp-module">
        <div className="tp-module-head">
          <div>
            <p>Журнал</p>
            <h2>История действий</h2>
          </div>
        </div>
        <div className="tp-audit-list">
          {audit.map((item) => (
            <article className="tp-audit-row" key={item.id}>
              <strong>{auditActionLabels[item.action] || item.action}</strong>
              <span>{auditUserLabel(item)}</span>
              <span>{auditObjectLabels[item.object_type] || item.object_type} #{item.object_id}</span>
              <em>{formatAuditDetails(item.payload)}</em>
              <small>{new Date(item.created_at).toLocaleString("ru-RU")}</small>
            </article>
          ))}
          {!audit.length && <div className="tp-empty">Журнал пока пуст.</div>}
        </div>
      </section>
    );
  }

  function renderContent() {
    let content = null;
    if (activeModule === "dashboard") content = renderDashboard();
    if (activeModule === "day") content = renderDay();
    if (activeModule === "manual") content = renderManual();
    if (activeModule === "appointments") content = renderAppointments();
    if (activeModule === "template") content = renderTemplate();
    if (activeModule === "transfer") content = renderTransfer();
    if (activeModule === "audit") content = renderAudit();
    return (
      <>
        {content}
        {loading && <div className="tp-loading-overlay" role="status">Обновляем данные...</div>}
      </>
    );
  }

  const activeLabel = modules.find((item) => item.key === activeModule)?.label || "Кабинет";

  return (
    <div className="tp-admin-page">
      <style>{`
        .tp-admin-page {
          --tp-primary: #19789c;
          --tp-primary-dark: #004f75;
          --tp-primary-soft: #edf6f8;
          --tp-primary-softest: #f8fbfc;
          --tp-primary-line: #b8d4dd;
          --tp-primary-line-strong: #8fc4d4;
          --tp-primary-shadow: rgba(25, 120, 156, .18);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: #0f172a;
          background:
            radial-gradient(circle at 8% 4%, rgba(25, 120, 156, .10), transparent 28%),
            linear-gradient(135deg, #ffffff 0%, var(--tp-primary-soft) 58%, var(--tp-primary-softest) 100%);
        }

        .tp-admin-bar {
          position: sticky;
          top: 0;
          z-index: 110;
          background: rgba(255, 255, 255, 0.93);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.85);
        }

        .tp-admin-shell {
          width: min(1400px, calc(100% - 48px));
          margin: 0 auto;
        }

        .tp-admin-bar-inner {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
        }

        .tp-admin-tabs {
          min-width: 0;
          display: flex;
          gap: 6px;
          padding: 4px;
          border-radius: 8px;
          background: #f1f5f9;
          overflow-x: auto;
        }

        .tp-tab {
          min-height: 54px;
          min-width: 142px;
          padding: 8px 12px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          display: grid;
          grid-template-columns: 20px 1fr;
          align-items: center;
          column-gap: 8px;
          text-align: left;
          font-family: inherit;
          transition: background .18s ease, color .18s ease, box-shadow .18s ease, transform .18s ease;
        }

        .tp-tab:hover {
          transform: translateY(-1px);
        }

        .tp-tab:active {
          transform: translateY(1px) scale(.98);
        }

        .tp-tab strong {
          display: block;
          color: inherit;
          font-size: 14px;
          line-height: 1.15;
        }

        .tp-tab small {
          display: block;
          margin-top: 3px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.1;
        }

        .tp-tab.active {
          background: #fff;
          color: var(--tp-primary);
          box-shadow: 0 10px 24px rgba(25, 120, 156, .1);
        }

        .tp-tab.active small {
          color: var(--tp-primary-dark);
        }

        .tp-exit {
          min-height: 44px;
          flex: 0 0 auto;
          padding: 0 16px;
          border: 1px solid #fecaca;
          border-radius: 8px;
          background: #fff;
          color: #b91c1c;
          font-weight: 850;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .tp-exit:hover {
          background: #fff7f7;
          border-color: #fca5a5;
          box-shadow: 0 12px 24px rgba(185, 28, 28, .10);
        }

        .tp-exit:active {
          transform: translateY(1px) scale(.98);
        }

        .tp-main {
          flex: 1;
          padding: 34px 0 70px;
        }

        .tp-hero {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 24px;
          scroll-margin-top: 86px;
        }

        .tp-hero p,
        .tp-module-head p {
          margin: 0 0 6px;
          color: #64748b;
          font-size: 14px;
          font-weight: 750;
        }

        .tp-hero h1,
        .tp-module-head h2 {
          margin: 0;
          color: #0f172a;
          font-size: clamp(28px, 4vw, 42px);
          line-height: 1.05;
          letter-spacing: 0;
        }

        .tp-date-chip {
          padding: 10px 15px;
          border-radius: 999px;
          border: 1px solid var(--tp-primary-line);
          background: #fff;
          color: var(--tp-primary-dark);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 850;
          box-shadow: 0 12px 30px rgba(25, 120, 156, .1);
        }

        .tp-hero-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tp-site-link {
          min-height: 42px;
          padding: 0 15px;
          border-radius: 8px;
          border: 1px solid var(--tp-primary);
          background: linear-gradient(135deg, var(--tp-primary), var(--tp-primary-dark));
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 12px 24px rgba(25, 120, 156, .18);
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .tp-site-link:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 30px rgba(25, 120, 156, .24);
        }

        .tp-tab:focus-visible,
        .tp-exit:focus-visible,
        .tp-site-link:focus-visible,
        .tp-link-btn:focus-visible,
        .tp-primary:focus-visible,
        .tp-datebar button:focus-visible,
        .tp-date-picker:focus-within,
        .tp-record-row:focus-visible,
        .tp-slot:focus-visible,
        .tp-manual-slot:focus-visible,
        .tp-secondary:focus-visible,
        .tp-danger:focus-visible,
        .tp-modal-head button:focus-visible {
          outline: 3px solid rgba(25, 120, 156, .2);
          outline-offset: 2px;
        }

        .tp-admin-bar {
          display: none;
        }

        .tp-workspace {
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 22px;
          align-items: start;
        }

        .tp-sidebar {
          position: sticky;
          top: 92px;
          display: grid;
          gap: 16px;
        }

        .tp-side-card {
          padding: 22px;
          border: 1px solid rgba(226, 232, 240, .86);
          border-radius: 8px;
          background: rgba(255, 255, 255, .88);
          box-shadow: 0 20px 60px rgba(15, 23, 42, .07);
          backdrop-filter: blur(16px);
        }

        .tp-side-head {
          margin-bottom: 14px;
          padding-bottom: 14px;
          border-bottom: 1px solid #e2e8f0;
        }

        .tp-side-head strong {
          display: block;
          color: #0f172a;
          font-size: 18px;
          line-height: 1.2;
        }

        .tp-side-head span {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          font-weight: 750;
        }

        .tp-side-tabs {
          display: grid;
          gap: 6px;
        }

        .tp-side-tabs .tp-tab {
          width: 100%;
          min-width: 0;
          min-height: 58px;
          padding: 12px 13px;
          border-radius: 8px;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 11px;
        }

        .tp-side-tabs .tp-tab:hover {
          color: var(--tp-primary-dark);
          background: #f8fafc;
          transform: translateX(2px);
        }

        .tp-side-tabs .tp-tab.active {
          color: var(--tp-primary);
          background: linear-gradient(135deg, var(--tp-primary-soft), #f8fbfc);
          box-shadow: inset 3px 0 0 var(--tp-primary);
        }

        .tp-tab-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: grid;
          place-items: center;
          background: #f8fafc;
          color: currentColor;
        }

        .tp-sidebar-meta {
          display: grid;
          gap: 10px;
        }

        .tp-psych-card {
          padding: 16px;
          border-radius: 8px;
          background: linear-gradient(135deg, #0f172a, var(--tp-primary-dark) 62%, var(--tp-primary));
          color: #fff;
          box-shadow: 0 20px 46px var(--tp-primary-shadow);
        }

        .tp-psych-card span {
          display: block;
          margin-bottom: 4px;
          color: rgba(255,255,255,.68);
          font-size: 12px;
          font-weight: 800;
        }

        .tp-psych-card strong {
          display: block;
          font-size: 18px;
          line-height: 1.2;
        }

        .tp-sidebar .tp-exit {
          width: 100%;
          justify-content: center;
          border-radius: 8px;
          box-shadow: 0 10px 24px rgba(15, 23, 42, .04);
        }

        .tp-content {
          min-width: 0;
          position: relative;
        }

        .tp-module {
          animation: tpFade .24s cubic-bezier(.2, .8, .2, 1);
        }

        .tp-module.narrow {
          max-width: 860px;
        }

        @keyframes tpFade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .tp-module-head,
        .tp-panel,
        .tp-form,
        .tp-week-card,
        .tp-day-summary,
        .tp-loading {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: rgba(255, 255, 255, .92);
          box-shadow: 0 18px 44px rgba(15, 23, 42, .07);
        }

        .tp-module-head {
          padding: 24px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .tp-module-head h2 {
          font-size: clamp(24px, 3vw, 32px);
        }

        .tp-link-btn,
        .tp-primary {
          min-height: 46px;
          border: 0;
          border-radius: 8px;
          padding: 0 18px;
          font-family: inherit;
          font-weight: 900;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease, color .18s ease;
        }

        .tp-link-btn {
          background: linear-gradient(135deg, var(--tp-primary-soft), #f8fbfc);
          color: var(--tp-primary-dark);
          box-shadow: inset 0 0 0 1px var(--tp-primary-line);
        }

        .tp-primary {
          background: linear-gradient(135deg, var(--tp-primary), var(--tp-primary-dark));
          color: #fff;
          box-shadow: 0 14px 28px var(--tp-primary-shadow);
        }

        .tp-primary:disabled {
          opacity: .58;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .tp-link-btn:hover,
        .tp-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 36px rgba(15, 23, 42, .13);
        }

        .tp-link-btn:active,
        .tp-primary:active {
          transform: translateY(1px) scale(.98);
          box-shadow: 0 8px 18px rgba(15, 23, 42, .12);
        }

        .tp-primary.small {
          min-height: 42px;
        }

        .tp-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 18px;
        }

        .tp-stat {
          min-height: 138px;
          padding: 20px;
          border: 1px solid var(--tp-primary-line);
          border-radius: 8px;
          background: #fff;
          display: grid;
          align-content: start;
          gap: 7px;
          box-shadow: 0 16px 34px rgba(15, 23, 42, .06);
        }

        .tp-stat span {
          color: #64748b;
          font-size: 13px;
          font-weight: 850;
        }

        .tp-stat strong {
          color: #0f172a;
          font-size: clamp(28px, 3vw, 38px);
          line-height: 1;
        }

        .tp-stat small {
          color: var(--tp-primary);
          font-weight: 800;
        }

        .tp-panel {
          padding: 22px;
        }

        .tp-help-card {
          margin-bottom: 14px;
          padding: 14px 16px;
          border: 1px solid var(--tp-primary-line);
          border-radius: 8px;
          background: linear-gradient(135deg, var(--tp-primary-soft), #f8fbfc);
          color: #334155;
          display: grid;
          gap: 6px;
          font-size: 13px;
          line-height: 1.45;
          font-weight: 760;
        }

        .tp-help-card strong {
          color: var(--tp-primary-dark);
          font-size: 14px;
        }

        .tp-panel-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }

        .tp-panel-head h3 {
          margin: 0;
          font-size: 20px;
        }

        .tp-panel-head span {
          color: #64748b;
          font-weight: 800;
        }

        .tp-record-list {
          display: grid;
          gap: 10px;
        }

        .tp-day-groups {
          display: grid;
          gap: 18px;
        }

        .tp-day-group {
          border: 1px solid var(--tp-primary-line);
          border-radius: 8px;
          background: rgba(255, 255, 255, .94);
          box-shadow: 0 18px 44px rgba(15, 23, 42, .06);
          overflow: hidden;
        }

        .tp-day-group-head {
          padding: 16px 18px;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, var(--tp-primary-soft), #f8fafc);
        }

        .tp-day-group-head strong {
          display: block;
          color: #0f172a;
          font-size: 20px;
          line-height: 1.2;
        }

        .tp-day-group-head span {
          display: block;
          margin-top: 4px;
          color: var(--tp-primary-dark);
          font-size: 13px;
          font-weight: 900;
        }

        .tp-day-group .tp-record-list {
          padding: 14px;
        }

        .tp-record-row {
          width: 100%;
          min-height: 74px;
          padding: 13px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          display: grid;
          grid-template-columns: 72px minmax(0, 1fr) auto;
          gap: 14px;
          align-items: center;
          text-align: left;
          cursor: pointer;
          font-family: inherit;
          transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease, background .16s ease;
        }

        .tp-record-row:hover {
          transform: translateY(-1px);
          border-color: var(--tp-primary-line);
          box-shadow: 0 14px 30px rgba(25, 120, 156, .1);
        }

        .tp-record-row:active {
          transform: translateY(1px) scale(.995);
        }

        .tp-record-time,
        .tp-slot-time {
          color: var(--tp-primary);
          font-size: 20px;
          font-weight: 950;
        }

        .tp-record-time {
          display: grid;
          gap: 4px;
          line-height: 1.05;
        }

        .tp-record-time strong {
          color: var(--tp-primary);
          font-size: 20px;
        }

        .tp-record-time small {
          color: #64748b;
          font-size: 12px;
          font-weight: 850;
        }

        .tp-record-main {
          min-width: 0;
          display: grid;
          gap: 5px;
        }

        .tp-record-main strong,
        .tp-slot-text strong {
          color: #0f172a;
          font-size: 17px;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }

        .tp-record-main small,
        .tp-slot-text small {
          color: #64748b;
          font-size: 14px;
          font-weight: 750;
        }

        .tp-status {
          padding: 7px 10px;
          border-radius: 999px;
          background: var(--tp-primary-soft);
          color: var(--tp-primary-dark);
          font-size: 12px;
          font-weight: 950;
          white-space: nowrap;
        }

        .tp-status.done { background: #ecfdf5; color: #047857; }
        .tp-status.cancelled { background: #fef2f2; color: #b91c1c; }
        .tp-status.confirmed { background: var(--tp-primary-soft); color: var(--tp-primary-dark); }

        .tp-datebar {
          margin-bottom: 18px;
          padding: 14px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          display: grid;
          grid-template-columns: auto minmax(220px, 1fr) minmax(180px, 220px) auto auto;
          gap: 10px;
          align-items: center;
          box-shadow: 0 14px 32px rgba(15, 23, 42, .06);
        }

        .tp-datebar button {
          min-height: 42px;
          border: 1px solid var(--tp-primary-line);
          border-radius: 8px;
          background: #fff;
          color: #004f75;
          padding: 0 14px;
          font-weight: 900;
          cursor: pointer;
          transition: transform .16s ease, box-shadow .16s ease, border-color .16s ease, background .16s ease;
        }

        .tp-datebar button:hover {
          transform: translateY(-1px);
          border-color: var(--tp-primary-line-strong);
          box-shadow: 0 10px 18px rgba(25, 120, 156, .1);
        }

        .tp-datebar button:active {
          transform: translateY(1px) scale(.98);
        }

        .tp-datebar button.active {
          background: var(--tp-primary);
          color: #fff;
          border-color: var(--tp-primary);
        }

        .tp-datebar strong {
          display: block;
          font-size: 18px;
        }

        .tp-datebar span {
          color: #64748b;
          font-size: 13px;
          font-weight: 750;
        }

        .tp-date-picker {
          min-height: 42px;
          padding: 0 11px;
          border: 1px solid var(--tp-primary-line);
          border-radius: 8px;
          background: #fff;
          color: var(--tp-primary-dark);
          display: flex;
          align-items: center;
          gap: 8px;
          transition: border-color .16s ease, box-shadow .16s ease, transform .16s ease;
        }

        .tp-date-picker:hover {
          transform: translateY(-1px);
          border-color: var(--tp-primary-line-strong);
          box-shadow: 0 10px 20px rgba(25, 120, 156, .1);
        }

        .tp-date-picker input {
          min-height: 40px;
          width: 100%;
          border: 0;
          outline: 0;
          background: transparent;
          color: #0f172a;
          font: 850 14px/1 inherit;
        }

        .tp-date-picker.standalone {
          min-width: 220px;
        }

        .tp-day-summary {
          margin-bottom: 18px;
          padding: 16px 18px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px 18px;
          align-items: center;
          color: #334155;
        }

        .tp-day-summary strong {
          color: #047857;
        }

        .tp-day-summary.closed strong {
          color: #b91c1c;
        }

        .tp-slot-grid,
        .tp-week-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 12px;
        }

        .tp-slot {
          min-height: 94px;
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          display: grid;
          grid-template-columns: 70px minmax(0, 1fr);
          gap: 12px;
          align-items: center;
          text-align: left;
          font-family: inherit;
          transition: transform .16s ease, border-color .16s ease, box-shadow .16s ease, background .16s ease;
        }

        .tp-slot.occupied:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 26px rgba(25, 120, 156, .1);
        }

        .tp-slot:active {
          transform: translateY(1px) scale(.995);
        }

        .tp-slot.occupied {
          border-color: var(--tp-primary-line);
          background: #f8fbff;
          cursor: pointer;
        }

        .tp-slot.free {
          color: #64748b;
        }

        .tp-slot-text {
          display: grid;
          gap: 5px;
        }

        .tp-free {
          color: #64748b;
          font-weight: 850;
        }

        .tp-form {
          padding: 24px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .tp-field {
          display: grid;
          gap: 8px;
          color: #334155;
          font-size: 14px;
          font-weight: 850;
        }

        .tp-field input,
        .tp-field select {
          min-height: 46px;
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          color: #0f172a;
          padding: 0 12px;
          font: 750 15px/1 inherit;
        }

        .tp-field input[type="number"] {
          appearance: textfield;
        }

        .tp-field input:focus,
        .tp-field select:focus {
          outline: 3px solid rgba(25, 120, 156, .16);
          border-color: var(--tp-primary);
        }

        .tp-field.has-error {
          color: #b91c1c;
        }

        .tp-field.has-error input,
        .tp-field.has-error select {
          border-color: #ef4444;
          background: #fff7f7;
        }

        .tp-field.has-error input:focus,
        .tp-field.has-error select:focus {
          outline-color: rgba(239, 68, 68, .18);
          border-color: #dc2626;
        }

        .tp-field-error {
          color: #b91c1c;
          font-size: 12px;
          font-weight: 850;
          line-height: 1.35;
        }

        .tp-field-hint {
          color: #64748b;
          font-size: 12px;
          font-weight: 760;
          line-height: 1.35;
        }

        .tp-slot-picker {
          grid-column: 1 / -1;
          display: grid;
          gap: 10px;
          padding: 16px;
          border: 1px solid var(--tp-primary-line);
          border-radius: 8px;
          background: var(--tp-primary-softest);
        }

        .tp-slot-picker.has-error {
          border-color: #fecaca;
          background: #fff7f7;
        }

        .tp-slot-picker-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .tp-slot-picker-head strong {
          color: #0f172a;
          font-size: 16px;
        }

        .tp-slot-picker-head span {
          color: #64748b;
          font-size: 13px;
          font-weight: 850;
        }

        .tp-manual-slots {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
          gap: 8px;
        }

        .tp-manual-slot {
          min-height: 42px;
          border: 1px solid var(--tp-primary-line);
          border-radius: 8px;
          background: #fff;
          color: var(--tp-primary-dark);
          font-family: inherit;
          font-weight: 950;
          cursor: pointer;
          transition: transform .16s ease, box-shadow .16s ease, background .16s ease, color .16s ease, border-color .16s ease;
        }

        .tp-manual-slot:hover {
          transform: translateY(-1px);
          border-color: var(--tp-primary-line-strong);
          box-shadow: 0 10px 20px rgba(25, 120, 156, .12);
        }

        .tp-manual-slot.active {
          background: linear-gradient(135deg, var(--tp-primary), var(--tp-primary-dark));
          color: #fff;
          border-color: transparent;
          box-shadow: 0 12px 24px var(--tp-primary-shadow);
        }

        .tp-checks {
          grid-column: 1 / -1;
          display: grid;
          gap: 10px;
          padding: 14px;
          border-radius: 8px;
          background: #f8fafc;
          color: #334155;
          font-weight: 800;
        }

        .tp-checks label {
          display: flex;
          gap: 10px;
          align-items: flex-start;
        }

        .tp-checks input {
          flex: 0 0 auto;
          width: 18px;
          height: 18px;
        }

        .tp-check-card strong {
          display: block;
          color: #0f172a;
          line-height: 1.25;
        }

        .tp-check-card small {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-size: 13px;
          line-height: 1.35;
        }

        .tp-form .tp-primary {
          grid-column: 1 / -1;
        }

        .tp-week-card {
          padding: 18px;
          transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease, background .18s ease;
        }

        .tp-week-card.off {
          background: #f8fafc;
        }

        .tp-week-card.active {
          border-color: var(--tp-primary-line);
        }

        .tp-week-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 38px rgba(15, 23, 42, .09);
        }

        .tp-week-card-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }

        .tp-week-card-head strong {
          font-size: 18px;
        }

        .tp-week-card-head small {
          display: block;
          margin-top: 4px;
          color: #64748b;
          font-weight: 800;
        }

        .tp-switch {
          position: relative;
          width: 50px;
          height: 28px;
        }

        .tp-switch input {
          position: absolute;
          opacity: 0;
        }

        .tp-switch span {
          position: absolute;
          inset: 0;
          border-radius: 999px;
          background: #cbd5e1;
          cursor: pointer;
          transition: background .18s ease, box-shadow .18s ease;
        }

        .tp-switch span::after {
          content: "";
          position: absolute;
          top: 4px;
          left: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 3px 8px rgba(15, 23, 42, .22);
          transition: transform .18s ease;
        }

        .tp-switch input:checked + span {
          background: linear-gradient(135deg, var(--tp-primary), var(--tp-primary-dark));
          box-shadow: 0 8px 18px var(--tp-primary-shadow);
        }

        .tp-switch input:checked + span::after {
          transform: translateX(22px);
        }

        .tp-week-fields {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .tp-week-fields .tp-field:last-child {
          grid-column: 1 / -1;
        }

        .tp-custom-day {
          margin-top: 18px;
        }

        .tp-custom-toggle {
          width: 100%;
        }

        .tp-module-head.compact {
          margin-top: 18px;
        }

        .tp-specific-day {
          margin-top: 12px;
        }

        .tp-card-actions {
          margin-top: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tp-inline-loading {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: 8px;
          background: var(--tp-primary-soft);
          color: var(--tp-primary-dark);
          font-weight: 850;
        }

        .tp-day-off,
        .tp-empty,
        .tp-loading,
        .tp-warning {
          padding: 18px;
          border-radius: 8px;
          background: #f8fafc;
          color: #64748b;
          font-weight: 800;
        }

        .tp-empty.full {
          grid-column: 1 / -1;
        }

        .tp-warning {
          grid-column: 1 / -1;
          background: var(--tp-primary-soft);
          color: var(--tp-primary-dark);
          border: 1px solid var(--tp-primary-line);
        }

        .tp-audit-list {
          display: grid;
          gap: 10px;
        }

        .tp-audit-row {
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          display: grid;
          grid-template-columns: minmax(180px, .85fr) minmax(160px, .65fr) minmax(140px, .55fr) minmax(220px, 1fr) auto;
          gap: 12px;
          align-items: center;
        }

        .tp-audit-row span,
        .tp-audit-row em,
        .tp-audit-row small {
          color: #64748b;
          font-weight: 750;
        }

        .tp-audit-row em {
          font-style: normal;
          line-height: 1.35;
        }

        .tp-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 500;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(15, 23, 42, .52);
          backdrop-filter: blur(8px);
        }

        .tp-modal {
          width: min(680px, 100%);
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 30px 90px rgba(15, 23, 42, .28);
          overflow: hidden;
        }

        .tp-confirm {
          width: min(440px, 100%);
          border-radius: 8px;
          background: #fff;
          padding: 24px;
          box-shadow: 0 30px 90px rgba(15, 23, 42, .28);
          display: grid;
          gap: 12px;
        }

        .tp-confirm-icon {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: var(--tp-primary-soft);
          color: var(--tp-primary-dark);
          font-weight: 950;
          font-size: 20px;
        }

        .tp-confirm h3 {
          margin: 0;
          color: #0f172a;
          font-size: 22px;
          line-height: 1.15;
        }

        .tp-confirm p {
          margin: 0;
          color: #475569;
          line-height: 1.55;
          font-weight: 720;
        }

        .tp-confirm-actions {
          margin-top: 4px;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }

        .tp-modal-head,
        .tp-modal-actions {
          padding: 18px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .tp-modal-head h3 {
          margin: 0;
          font-size: 22px;
        }

        .tp-modal-head button {
          width: 36px;
          height: 36px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #fff;
          cursor: pointer;
        }

        .tp-modal-body {
          padding: 22px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .tp-detail {
          padding: 13px;
          border-radius: 8px;
          background: #f8fafc;
          display: grid;
          gap: 4px;
        }

        .tp-detail span {
          color: #64748b;
          font-size: 13px;
          font-weight: 800;
        }

        .tp-detail strong {
          color: #0f172a;
          overflow-wrap: anywhere;
        }

        .tp-modal-actions {
          justify-content: flex-start;
          background: #f8fafc;
          border-bottom: 0;
        }

        .tp-secondary,
        .tp-danger {
          min-height: 42px;
          padding: 0 15px;
          border-radius: 8px;
          border: 1px solid transparent;
          font-family: inherit;
          font-weight: 900;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease;
        }

        .tp-secondary {
          background: #fff;
          color: var(--tp-primary-dark);
          border-color: var(--tp-primary-line);
        }

        .tp-danger {
          background: #fef2f2;
          color: #b91c1c;
          border-color: #fecaca;
        }

        .tp-secondary:hover,
        .tp-danger:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 24px rgba(15, 23, 42, .09);
        }

        .tp-secondary:active,
        .tp-danger:active {
          transform: translateY(1px) scale(.98);
        }

        .tp-loading-overlay {
          position: absolute;
          top: 0;
          right: 0;
          z-index: 5;
          padding: 10px 14px;
          border: 1px solid var(--tp-primary-line);
          border-radius: 8px;
          background: rgba(255, 255, 255, .94);
          color: var(--tp-primary-dark);
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 14px 30px rgba(25, 120, 156, .12);
          animation: tpFade .18s ease-out;
        }

        .tp-toast {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 700;
          max-width: min(420px, calc(100% - 48px));
          padding: 14px 18px;
          border-radius: 8px;
          color: #fff;
          font-weight: 850;
          box-shadow: 0 18px 42px rgba(15, 23, 42, .2);
        }

        .tp-toast.success { background: #047857; }
        .tp-toast.error { background: #b91c1c; }

        @media (max-width: 1180px) {
          .tp-workspace {
            grid-template-columns: 1fr;
          }
          .tp-sidebar {
            position: static;
          }
          .tp-side-tabs {
            grid-template-columns: repeat(4, minmax(170px, 1fr));
            overflow-x: auto;
            padding-bottom: 3px;
          }
          .tp-sidebar-meta {
            grid-template-columns: 1fr auto;
            align-items: stretch;
          }
          .tp-sidebar .tp-exit {
            width: auto;
          }
          .tp-datebar {
            grid-template-columns: 1fr 1fr;
          }
          .tp-datebar div {
            grid-column: 1 / -1;
            order: -1;
          }
        }

        @media (max-width: 820px) {
          .tp-admin-shell {
            width: min(100% - 28px, 1400px);
          }
          .tp-hero,
          .tp-module-head,
          .tp-record-row,
          .tp-audit-row {
            align-items: stretch;
            grid-template-columns: 1fr;
            flex-direction: column;
          }
          .tp-stat-grid,
          .tp-form,
          .tp-week-fields,
          .tp-modal-body {
            grid-template-columns: 1fr;
          }
          .tp-record-row {
            display: grid;
          }
          .tp-status {
            width: fit-content;
          }
          .tp-slot {
            grid-template-columns: 1fr;
          }
          .tp-datebar {
            grid-template-columns: 1fr;
          }
          .tp-side-tabs {
            grid-template-columns: repeat(3, minmax(150px, 1fr));
          }
          .tp-hero-actions {
            justify-content: stretch;
          }
          .tp-date-chip,
          .tp-site-link {
            width: 100%;
          }
          .tp-sidebar-meta {
            grid-template-columns: 1fr;
          }
          .tp-sidebar .tp-exit {
            width: 100%;
          }
        }
      `}</style>

      <div className="tp-admin-bar">
        <div className="tp-admin-shell tp-admin-bar-inner">
          <div className="tp-admin-tabs" role="tablist" aria-label="Разделы кабинета ТПМПК">
            {modules.map((item) => (
              <button
                className={`tp-tab${activeModule === item.key ? " active" : ""}`}
                key={item.key}
                type="button"
                onClick={() => setActiveModule(item.key)}
              >
                <Icon name={item.icon} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.hint}</small>
                </span>
              </button>
            ))}
          </div>
          <button className="tp-exit" type="button" onClick={onLogout}>
            <Icon name="logout" />
            Выход
          </button>
        </div>
      </div>

      <main className="tp-main">
        <div className="tp-admin-shell">
          <div className="tp-hero" ref={heroRef}>
            <div>
              <p>Личный кабинет психолога ТПМПК</p>
              <h1>{activeLabel}</h1>
            </div>
            <div className="tp-hero-actions">
              <span className="tp-date-chip">{currentDateLabel}</span>
              <Link className="tp-site-link" to="/">Перейти на сайт</Link>
            </div>
          </div>
          <div className="tp-workspace">
            <aside className="tp-sidebar" aria-label="Разделы личного кабинета ТПМПК">
              <section className="tp-side-card">
                <div className="tp-side-head">
                  <strong>Разделы кабинета</strong>
                  <span>Рабочие инструменты психолога ТПМПК</span>
                </div>
                <div className="tp-side-tabs" role="tablist" aria-label="Разделы кабинета ТПМПК">
                  {modules.map((item) => (
                    <button
                      className={`tp-tab${activeModule === item.key ? " active" : ""}`}
                      key={item.key}
                      type="button"
                      onClick={() => setActiveModule(item.key)}
                    >
                      <span className="tp-tab-icon"><Icon name={item.icon} /></span>
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.hint}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              <div className="tp-sidebar-meta">
                <div className="tp-psych-card">
                  <span>Психолог ТПМПК</span>
                  <strong>{currentUser?.firstName || "Кабинет"}</strong>
                </div>
                <button className="tp-exit" type="button" onClick={onLogout}>
                  <Icon name="logout" />
                  Выход
                </button>
              </div>
            </aside>

            <section className="tp-content">
              {renderContent()}
            </section>
          </div>
        </div>
      </main>

      {selectedAppointment && (
        <div className="tp-modal-backdrop" onClick={() => setSelectedAppointment(null)}>
          <div className="tp-modal" onClick={(event) => event.stopPropagation()}>
            <div className="tp-modal-head">
              <h3>Детали записи</h3>
              <button type="button" onClick={() => setSelectedAppointment(null)}>×</button>
            </div>
            <div className="tp-modal-body">
              <div className="tp-detail"><span>Ребенок</span><strong>{selectedAppointment.child_full_name}</strong></div>
              <div className="tp-detail"><span>Дата и время приема</span><strong>{appointmentDateTimeLabel(selectedAppointment)}</strong></div>
              <div className="tp-detail"><span>Возраст</span><strong>{selectedAppointment.child_age} лет</strong></div>
              <div className="tp-detail"><span>Телефон</span><strong>{revealedPhones[selectedAppointment.id] || "Скрыт"}</strong></div>
              <div className="tp-detail"><span>Статус</span><strong>{statusLabels[selectedAppointment.status]}</strong></div>
              <div className="tp-detail"><span>Прописка в Иркутске</span><strong>{selectedAppointment.child_registered_irkutsk ? "Да" : "Нет"}</strong></div>
              <div className="tp-detail"><span>Документы</span><strong>{readinessLabels[selectedAppointment.document_readiness] || "-"}</strong></div>
            </div>
            <div className="tp-modal-actions">
              {!revealedPhones[selectedAppointment.id] && (
                <button className="tp-secondary" type="button" onClick={() => confirmRevealPhone(selectedAppointment)}>
                  <Icon name="eye" />
                  Показать телефон
                </button>
              )}
              {selectedAppointment.status !== "done" && selectedAppointment.status !== "cancelled" && (
                <>
                  <button className="tp-secondary" type="button" onClick={() => confirmStatusChange(selectedAppointment, "done")}>Завершить</button>
                  <button className="tp-danger" type="button" onClick={() => confirmStatusChange(selectedAppointment, "cancel")}>Отменить</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <div className="tp-modal-backdrop" onClick={closeConfirm}>
          <div className="tp-confirm" role="dialog" aria-modal="true" aria-labelledby="tp-confirm-title" onClick={(event) => event.stopPropagation()}>
            <div className="tp-confirm-icon">!</div>
            <h3 id="tp-confirm-title">{confirmDialog.title}</h3>
            <p>{confirmDialog.text}</p>
            <div className="tp-confirm-actions">
              <button className="tp-secondary" type="button" onClick={closeConfirm}>Отмена</button>
              <button
                className={confirmDialog.tone === "danger" ? "tp-danger" : "tp-primary small"}
                type="button"
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  closeConfirm();
                  await action?.();
                }}
              >
                {confirmDialog.actionLabel || "Подтвердить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`tp-toast ${toast.type}`} role="status">{toast.text}</div>}
    </div>
  );
}
