import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import Header from "../features/nav/Header.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import { API_BASE } from "../constants/index.js";

const steps = ["Данные ребёнка", "Дата и время", "Дополнительно", "Контакты и согласия"];

const initialForm = {
  childFullName: "",
  childAge: "",
  childRegisteredIrkutsk: null,
  documentReadiness: "",
  selectedDate: "",
  selectedSlot: "",
  workingDayId: null,
  isRepeat: null,
  needsPsychiatrist: null,
  parentPhone: "+7",
  consentPd: false,
  consentSpecial: false,
};

const SLOT_TAKEN_MESSAGE = "Этот слот уже выбран другим пользователем. Обновите список свободных слотов и выберите другое время.";
const SLOT_LOCK_EXPIRED_MESSAGE = "Время удержания слота истекло. Выберите слот заново.";
const SLOT_LOCK_RENEW_BEFORE_EXPIRY_MS = 60 * 1000;
const SLOT_LOCK_MIN_RENEW_DELAY_MS = 30 * 1000;
const SLOT_LOCK_FALLBACK_RENEW_DELAY_MS = 4 * 60 * 1000;

function todayIso() {
  const value = new Date();
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value) {
  return String(value || "").slice(0, 5);
}

function normalizePhone(value) {
  const digits = value.replace(/\D/g, "");
  const body = digits.startsWith("7") || digits.startsWith("8") ? digits.slice(1) : digits;
  return `+7${body.slice(0, 10)}`;
}

function createSessionId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `slot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function getErrorMessage(response, fallback) {
  const data = await response.json().catch(() => null);
  if (typeof data?.detail === "string") return data.detail;
  if (Array.isArray(data?.detail)) {
    return data.detail.map((item) => item?.msg || item?.message || String(item)).join("; ");
  }
  return fallback;
}

export default function TpmpkZapisPage({ currentUser, onGoAuth, onGoAdmin, onGoProfile }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(0);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [notice, setNotice] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lockSessionId] = useState(createSessionId);
  const [slotLock, setSlotLock] = useState(null);
  const [slotLockLoading, setSlotLockLoading] = useState(false);
  const slotLockRef = useRef(null);

  useEffect(() => {
    document.title = "Запись на обследование ТПМПК";
  }, []);

  useEffect(() => {
    slotLockRef.current = slotLock;
  }, [slotLock]);

  const clearSelectedSlot = useCallback(() => {
    slotLockRef.current = null;
    setSlotLock(null);
    setForm((prev) => ({ ...prev, selectedSlot: "", workingDayId: null }));
  }, []);

  const releaseSlotLock = useCallback(async (lock, { clearState = true } = {}) => {
    if (!lock) return;
    try {
      await fetch(`${API_BASE}/api/tpmpk/slot-locks/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          working_day_id: lock.working_day_id,
          start_time: lock.start_time,
          session_id: lock.session_id || lockSessionId,
        }),
      });
    } catch {
      // Истекшие блокировки очищаются сервером при следующих обращениях.
    } finally {
      if (clearState) {
        setSlotLock((current) => (
          current?.working_day_id === lock.working_day_id && current?.start_time === lock.start_time
            ? null
            : current
        ));
      }
    }
  }, [lockSessionId]);

  useEffect(() => () => {
    if (slotLockRef.current) {
      void releaseSlotLock(slotLockRef.current, { clearState: false });
    }
  }, [releaseSlotLock]);

  useEffect(() => {
    if (!form.selectedDate) {
      setSlots([]);
      setSlotsError("");
      if (slotLockRef.current) {
        void releaseSlotLock(slotLockRef.current);
      }
      return undefined;
    }

    const controller = new AbortController();
    setSlots([]);
    setSlotsError("");
    setSlotsLoading(true);
    if (slotLockRef.current) {
      void releaseSlotLock(slotLockRef.current);
    }
    setForm((prev) => ({ ...prev, selectedSlot: "", workingDayId: null }));

    fetch(`${API_BASE}/api/tpmpk/slots/?date=${encodeURIComponent(form.selectedDate)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Не удалось загрузить свободные слоты"));
        }
        return response.json();
      })
      .then((data) => setSlots(Array.isArray(data) ? data : []))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setSlotsError(error.message || "Не удалось загрузить свободные слоты");
        }
      })
      .finally(() => setSlotsLoading(false));

    return () => controller.abort();
  }, [form.selectedDate, releaseSlotLock]);

  useEffect(() => {
    if (!slotLock?.working_day_id || !slotLock?.start_time || !form.selectedDate) {
      return undefined;
    }

    const expiresAt = Date.parse(slotLock.expires_at);
    const renewDelay = Number.isFinite(expiresAt)
      ? Math.max(SLOT_LOCK_MIN_RENEW_DELAY_MS, expiresAt - Date.now() - SLOT_LOCK_RENEW_BEFORE_EXPIRY_MS)
      : SLOT_LOCK_FALLBACK_RENEW_DELAY_MS;

    const timerId = window.setTimeout(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/tpmpk/slot-locks/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            working_day_id: slotLock.working_day_id,
            date: form.selectedDate,
            start_time: slotLock.start_time,
            session_id: lockSessionId,
          }),
        });
        if (!response.ok) {
          throw new Error(response.status === 409
            ? SLOT_TAKEN_MESSAGE
            : await getErrorMessage(response, SLOT_LOCK_EXPIRED_MESSAGE));
        }
        setSlotLock(await response.json());
      } catch (error) {
        clearSelectedSlot();
        setSubmitError(error.message || SLOT_LOCK_EXPIRED_MESSAGE);
        refreshSlots();
      }
    }, renewDelay);

    return () => window.clearTimeout(timerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotLock, form.selectedDate, lockSessionId, clearSelectedSlot]);

  const availableSlots = useMemo(
    () => slots.filter((slot) => slot.is_available !== false),
    [slots]
  );

  const progress = Math.round(((step + 1) / steps.length) * 100);

  function updateField(field, value) {
    setSubmitError("");
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === "childRegisteredIrkutsk" && value === false) {
      setNotice({
        title: "Обратитесь по месту жительства",
        text: "ТПМПК города Иркутска принимает детей, зарегистрированных на территории Иркутска. Если ребёнок прописан в другом муниципалитете, запись нужно оформить в комиссии по месту жительства.",
      });
    }
    if (field === "documentReadiness" && value === "not_ready") {
      setNotice({
        title: "Сначала подготовьте полный пакет документов",
        text: "Для записи на обследование необходимо собрать все документы по перечню. Откройте раздел с бланками ТПМПК и вернитесь к записи, когда пакет будет готов.",
        link: "/tpmpk/blanki/",
        linkText: "Открыть бланки документов",
      });
    }
  }

  async function selectSlot(slot) {
    setSubmitError("");
    if (!slot?.working_day_id || !slot?.start_time) return;
    if (slotLock?.working_day_id === slot.working_day_id && slotLock?.start_time === slot.start_time) {
      setForm((prev) => ({
        ...prev,
        selectedSlot: slot.start_time,
        workingDayId: slot.working_day_id,
      }));
      return;
    }

    setSlotLockLoading(true);
    try {
      if (slotLock) {
        await releaseSlotLock(slotLock);
      }
      const response = await fetch(`${API_BASE}/api/tpmpk/slot-locks/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          working_day_id: slot.working_day_id,
          date: form.selectedDate,
          start_time: slot.start_time,
          session_id: lockSessionId,
        }),
      });
      if (!response.ok) {
        throw new Error(response.status === 409
          ? SLOT_TAKEN_MESSAGE
          : await getErrorMessage(response, "Не удалось временно удержать слот"));
      }
      const lock = await response.json();
      setSlotLock(lock);
      setForm((prev) => ({
        ...prev,
        selectedSlot: slot.start_time,
        workingDayId: slot.working_day_id,
      }));
    } catch (error) {
      clearSelectedSlot();
      setSubmitError(error.message || SLOT_TAKEN_MESSAGE);
      refreshSlots();
    } finally {
      setSlotLockLoading(false);
    }
  }

  function refreshSlots() {
    const date = form.selectedDate;
    setForm((prev) => ({ ...prev, selectedDate: "" }));
    window.setTimeout(() => setForm((prev) => ({ ...prev, selectedDate: date })), 0);
  }

  function validateStep() {
    if (step === 0) {
      if (form.childFullName.trim().length < 2) return "Введите ФИО ребёнка";
      const age = Number(form.childAge);
      if (!Number.isInteger(age) || age < 0 || age > 18) return "Возраст должен быть от 0 до 18 полных лет";
      if (form.childRegisteredIrkutsk === null) return "Укажите, прописан ли ребёнок в Иркутске";
      if (form.childRegisteredIrkutsk === false) {
        setNotice({
          title: "Обратитесь по месту жительства",
          text: "Продолжить запись нельзя: для прохождения ТПМПК нужно обращаться в комиссию по месту регистрации ребёнка.",
        });
        return "Запись доступна только для детей, зарегистрированных в Иркутске.";
      }
      if (!form.documentReadiness) return "Укажите степень готовности документов";
      if (form.documentReadiness === "not_ready") {
        setNotice({
          title: "Нужен полный пакет документов",
          text: "Продолжить запись можно после подготовки всех документов. В разделе бланков есть формы заявлений и согласий для ТПМПК.",
          link: "/tpmpk/blanki/",
          linkText: "Перейти к бланкам",
        });
        return "Для записи необходимо собрать полный пакет документов.";
      }
    }
    if (step === 1) {
      if (!form.selectedDate) return "Выберите дату приёма";
      if (!form.selectedSlot || !form.workingDayId) return "Выберите свободное время";
    }
    if (step === 2) {
      if (form.isRepeat === null) return "Укажите, повторная ли это комиссия";
      if (form.needsPsychiatrist === null) return "Укажите, нужна ли консультация врача-психиатра";
    }
    if (step === 3) {
      if (!/^\+7\d{10}$/.test(form.parentPhone)) return "Введите телефон в формате +7XXXXXXXXXX";
      if (!form.consentPd || !form.consentSpecial) return "Для записи требуются оба согласия";
    }
    return "";
  }

  function goNext() {
    const error = validateStep();
    if (error) {
      setSubmitError(error);
      return;
    }
    setSubmitError("");
    setStep((value) => Math.min(value + 1, steps.length - 1));
  }

  function goBack() {
    setSubmitError("");
    setStep((value) => Math.max(value - 1, 0));
  }

  function cancelBooking() {
    if (slotLockRef.current) {
      void releaseSlotLock(slotLockRef.current);
    }
    navigate("/tpmpk");
  }

  async function submitAppointment() {
    const error = validateStep();
    if (error) {
      setSubmitError(error);
      return;
    }

    setSubmitLoading(true);
    setSubmitError("");

    try {
      const response = await fetch(`${API_BASE}/api/tpmpk/zapis/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          working_day_id: form.workingDayId,
          start_time: form.selectedSlot,
          lock_session_id: lockSessionId,
          child_full_name: form.childFullName.trim(),
          child_age: Number(form.childAge),
          child_registered_irkutsk: form.childRegisteredIrkutsk,
          document_readiness: form.documentReadiness,
          parent_phone: form.parentPhone,
          is_repeat: Boolean(form.isRepeat),
          needs_psychiatrist: Boolean(form.needsPsychiatrist),
          consent_pd: form.consentPd,
          consent_special: form.consentSpecial,
        }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Не удалось создать запись"));
      }

      const data = await response.json();
      setSuccess({
        appointmentId: data.appointment_id || "будет присвоен оператором",
        date: form.selectedDate,
        time: form.selectedSlot,
      });
      slotLockRef.current = null;
      setSlotLock(null);
    } catch (error) {
      const message = error.message || "Не удалось создать запись";
      const lower = message.toLowerCase();
      if (lower.includes("слот") || lower.includes("занят") || lower.includes("409")) {
        clearSelectedSlot();
        setSubmitError(message.includes("истекло") ? SLOT_LOCK_EXPIRED_MESSAGE : SLOT_TAKEN_MESSAGE);
        refreshSlots();
      } else if (lower.includes("день") || lower.includes("закрыт")) {
        setSubmitError("Выбранный день закрыт для записи. Выберите другую дату.");
      } else {
        setSubmitError(message);
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  function renderChoice(field, value, label) {
    return (
      <button
        type="button"
        className={`tz-choice ${form[field] === value ? "active" : ""}`}
        onClick={() => updateField(field, value)}
      >
        {label}
      </button>
    );
  }

  function renderStep() {
    if (step === 0) {
      return (
        <>
          <p className="tz-kicker">Шаг 1</p>
          <h1>Данные ребёнка</h1>
          <label className="tz-field">
            <span>ФИО ребёнка</span>
            <input
              value={form.childFullName}
              onChange={(event) => updateField("childFullName", event.target.value)}
              placeholder="Иванов Иван Иванович"
              autoComplete="name"
            />
          </label>
          <label className="tz-field narrow">
            <span>Возраст, полных лет</span>
            <input
              type="number"
              min="0"
              max="18"
              value={form.childAge}
              onChange={(event) => updateField("childAge", event.target.value)}
              placeholder="7"
            />
          </label>
          <div className="tz-question">
            <span>Ребёнок прописан на территории Иркутска?</span>
            <div className="tz-choice-grid">
              {renderChoice("childRegisteredIrkutsk", true, "Да")}
              {renderChoice("childRegisteredIrkutsk", false, "Нет")}
            </div>
          </div>
          <div className="tz-question">
            <span>Степень готовности документов</span>
            <div className="tz-choice-grid full">
              {renderChoice("documentReadiness", "full", "Полный пакет (согласно перечню)")}
              {renderChoice("documentReadiness", "not_ready", "Документы в процессе сбора")}
              {renderChoice("documentReadiness", "psychiatrist_consultation", "Нужна только консультация психиатра")}
            </div>
          </div>
        </>
      );
    }

    if (step === 1) {
      return (
        <>
          <p className="tz-kicker">Шаг 2</p>
          <h1>Выберите дату и время</h1>
          <label className="tz-field narrow">
            <span>Дата приёма</span>
            <input
              type="date"
              min={todayIso()}
              value={form.selectedDate}
              onChange={(event) => updateField("selectedDate", event.target.value)}
            />
          </label>
          {slotsLoading && <div className="tz-state">Загружаем свободные слоты...</div>}
          {slotLockLoading && <div className="tz-state">Временно удерживаем выбранное время...</div>}
          {slotsError && <div className="tz-state error">{slotsError}</div>}
          {!slotsLoading && form.selectedDate && !slotsError && availableSlots.length === 0 && (
            <div className="tz-state error">На выбранную дату свободных слотов нет. Попробуйте другой день.</div>
          )}
          {availableSlots.length > 0 && (
            <div className="tz-slots">
              {availableSlots.map((slot) => (
                <button
                  type="button"
                  key={`${slot.working_day_id}-${slot.start_time}`}
                  className={`tz-slot ${form.selectedSlot === slot.start_time ? "active" : ""}`}
                  onClick={() => selectSlot(slot)}
                  disabled={slotLockLoading}
                  title={slot.slot_minutes ? `Длительность приема: ${slot.slot_minutes} минут` : undefined}
                >
                  <span>{formatTime(slot.start_time)}</span>
                  {slot.slot_minutes && <small>{slot.slot_minutes} мин.</small>}
                </button>
              ))}
            </div>
          )}
        </>
      );
    }

    if (step === 2) {
      return (
        <>
          <p className="tz-kicker">Шаг 3</p>
          <h1>Дополнительно</h1>
          <div className="tz-question">
            <span>Это повторная комиссия?</span>
            <div className="tz-choice-grid">
              {renderChoice("isRepeat", true, "Да")}
              {renderChoice("isRepeat", false, "Нет")}
            </div>
          </div>
          <div className="tz-question">
            <span>Нужна консультация врача-психиатра?</span>
            <div className="tz-choice-grid">
              {renderChoice("needsPsychiatrist", true, "Да")}
              {renderChoice("needsPsychiatrist", false, "Нет")}
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <p className="tz-kicker">Шаг 4</p>
        <h1>Телефон и согласия</h1>
        <label className="tz-field narrow">
          <span>Телефон родителя</span>
          <input
            value={form.parentPhone}
            onChange={(event) => updateField("parentPhone", normalizePhone(event.target.value))}
            inputMode="tel"
            placeholder="+73950000000"
            autoComplete="tel"
          />
        </label>
        <div className="tz-review">
          <div><span>Дата</span><strong>{formatDate(form.selectedDate)}</strong></div>
          <div><span>Время</span><strong>{formatTime(form.selectedSlot)}</strong></div>
          <div><span>Ребёнок</span><strong>{form.childFullName}</strong></div>
        </div>
        <label className="tz-checkbox">
          <input
            type="checkbox"
            checked={form.consentPd}
            onChange={(event) => updateField("consentPd", event.target.checked)}
          />
          <span>Даю согласие на обработку персональных данных</span>
        </label>
        <label className="tz-checkbox">
          <input
            type="checkbox"
            checked={form.consentSpecial}
            onChange={(event) => updateField("consentSpecial", event.target.checked)}
          />
          <span>Даю согласие на обработку специальных категорий персональных данных, включая сведения о здоровье ребёнка</span>
        </label>
      </>
    );
  }

  return (
    <div className="tz-page">
      <style>{`
        .tz-page {
          --tz-page-bg: var(--imcro-color-bg, #477799);
          --tz-primary: var(--imcro-color-primary, #1F5073);
          --tz-primary-dark: var(--imcro-color-primary, #1F5073);
          --tz-surface: var(--imcro-color-surface, #FFFFFF);
          --tz-text: var(--imcro-color-text, #1a1c1c);
          --tz-muted: var(--imcro-color-text-muted, #42474e);
          --tz-primary-soft: rgba(31, 80, 115, 0.08);
          --tz-primary-line: var(--imcro-color-border, rgba(31, 80, 115, 0.16));
          --tz-primary-shadow: rgba(31, 80, 115, 0.18);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: var(--tz-text);
          background: var(--tz-page-bg);
        }

        .tz-main {
          flex: 1;
        }

        .tz-shell {
          width: min(1040px, calc(100% - 28px));
          margin: 0 auto;
          padding: 34px 0 68px;
        }

        .tz-card {
          border: 1px solid var(--tz-primary-line);
          border-radius: var(--imcro-radius-card, 16px);
          background: var(--tz-surface);
          box-shadow: var(--imcro-shadow-card, 0 4px 20px rgba(0, 0, 0, 0.08));
          overflow: hidden;
        }

        .tz-head {
          padding: 22px 18px;
          border-bottom: 1px solid var(--tz-primary-line);
          display: grid;
          gap: 14px;
          background:
            radial-gradient(circle at 100% 0%, rgba(31, 80, 115, 0.1), transparent 26%),
            var(--tz-surface);
        }

        .tz-head h2 {
          font-size: clamp(28px, 6vw, 46px);
          line-height: 1.04;
          letter-spacing: 0;
          color: var(--tz-primary);
          max-width: 760px;
        }

        .tz-head p {
          color: var(--tz-muted);
          font-weight: 650;
          line-height: 1.55;
          max-width: 720px;
        }

        .tz-head-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .tz-back {
          color: var(--tz-primary-dark);
          text-decoration: none;
          font-weight: 900;
        }

        .tz-progress-label {
          color: var(--tz-muted);
          font-size: 13px;
          font-weight: 900;
        }

        .tz-progress {
          height: 8px;
          border-radius: 999px;
          background: var(--tz-primary-soft);
          overflow: hidden;
        }

        .tz-progress span {
          display: block;
          width: var(--progress);
          height: 100%;
          border-radius: inherit;
          background: var(--tz-primary);
          transition: width 0.2s ease;
        }

        .tz-body {
          padding: 20px 18px 22px;
        }

        .tz-step {
          display: grid;
          gap: 18px;
        }

        .tz-kicker {
          color: var(--tz-primary);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .tz-step h1,
        .tz-success h1 {
          color: var(--tz-primary);
          font-size: clamp(26px, 5vw, 38px);
          line-height: 1.08;
          letter-spacing: 0;
        }

        .tz-field {
          display: grid;
          gap: 8px;
        }

        .tz-field.narrow {
          max-width: 430px;
        }

        .tz-field span,
        .tz-question > span {
          color: var(--tz-text);
          font-size: 14px;
          font-weight: 900;
        }

        .tz-field input {
          width: 100%;
          min-height: 54px;
          border: 1px solid var(--tz-primary-line);
          border-radius: 8px;
          background: var(--tz-surface);
          color: var(--tz-text);
          padding: 0 15px;
          font: 800 16px/1.2 inherit;
          outline: none;
        }

        .tz-field input:focus {
          border-color: var(--tz-primary);
          box-shadow: 0 0 0 4px rgba(31, 80, 115, 0.16);
        }

        .tz-choice-grid,
        .tz-slots {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .tz-choice-grid.full {
          grid-template-columns: 1fr;
        }

        .tz-question {
          display: grid;
          gap: 10px;
        }

        .tz-choice,
        .tz-slot {
          min-height: 52px;
          border: 1px solid var(--tz-primary-line);
          border-radius: 8px;
          background: var(--tz-surface);
          color: var(--tz-primary-dark);
          font-weight: 950;
          cursor: pointer;
          transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;
        }

        .tz-slot {
          display: grid;
          place-items: center;
          gap: 2px;
          padding: 8px 10px;
        }

        .tz-slot span {
          font-size: 16px;
          line-height: 1;
        }

        .tz-slot small {
          color: var(--tz-muted);
          font-size: 11px;
          font-weight: 900;
        }

        .tz-choice:hover,
        .tz-slot:hover {
          transform: translateY(-1px);
          border-color: var(--tz-primary-line);
          box-shadow: 0 12px 28px rgba(31, 80, 115, 0.1);
        }

        .tz-choice.active,
        .tz-slot.active {
          color: #fff;
          border-color: transparent;
          background: var(--tz-primary);
        }

        .tz-slot.active small {
          color: rgba(255, 255, 255, 0.82);
        }

        .tz-state {
          border: 1px solid var(--tz-primary-line);
          border-radius: 8px;
          padding: 13px 14px;
          background: var(--tz-primary-soft);
          color: var(--tz-primary-dark);
          font-weight: 800;
          line-height: 1.45;
        }

        .tz-state.error,
        .tz-error {
          border-color: #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }

        .tz-review {
          display: grid;
          gap: 10px;
        }

        .tz-review div {
          display: grid;
          gap: 3px;
          padding: 13px;
          border: 1px solid var(--tz-primary-line);
          border-radius: 8px;
          background: var(--tz-primary-soft);
        }

        .tz-review span {
          color: var(--tz-muted);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .tz-review strong {
          color: var(--tz-text);
          overflow-wrap: anywhere;
        }

        .tz-checkbox {
          display: grid;
          grid-template-columns: 22px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
          padding: 13px;
          border: 1px solid var(--tz-primary-line);
          border-radius: 8px;
          background: var(--tz-surface);
          color: var(--tz-text);
          font-weight: 800;
          line-height: 1.45;
        }

        .tz-checkbox input {
          width: 20px;
          height: 20px;
          margin-top: 1px;
          accent-color: var(--tz-primary);
        }

        .tz-actions {
          display: grid;
          gap: 10px;
          margin-top: 22px;
        }

        .tz-primary,
        .tz-secondary {
          min-height: 52px;
          border-radius: 8px;
          border: 0;
          padding: 0 16px;
          font-weight: 950;
          cursor: pointer;
        }

        .tz-primary {
          color: #fff;
          background: var(--tz-primary);
          box-shadow: 0 16px 34px var(--tz-primary-shadow);
        }

        .tz-primary:disabled {
          opacity: 0.72;
          cursor: progress;
        }

        .tz-slot:disabled {
          opacity: 0.72;
          cursor: progress;
          transform: none;
          box-shadow: none;
        }

        .tz-secondary {
          color: var(--tz-primary-dark);
          background: var(--tz-primary-soft);
          border: 1px solid var(--tz-primary-line);
        }

        .tz-primary:hover,
        .tz-secondary:hover,
        .tz-error button:hover,
        .tz-modal-actions a:hover,
        .tz-modal-actions button:hover {
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(31, 80, 115, 0.14);
        }

        .tz-primary:focus-visible,
        .tz-secondary:focus-visible,
        .tz-choice:focus-visible,
        .tz-slot:focus-visible,
        .tz-back:focus-visible,
        .tz-error button:focus-visible,
        .tz-modal-actions a:focus-visible,
        .tz-modal-actions button:focus-visible {
          outline: 3px solid rgba(31, 80, 115, 0.2);
          outline-offset: 3px;
        }

        .tz-error {
          margin-top: 16px;
          border-radius: 8px;
          padding: 13px 14px;
          font-weight: 850;
          line-height: 1.45;
        }

        .tz-error button {
          margin-top: 10px;
          min-height: 38px;
          padding: 0 13px;
          border: 0;
          border-radius: 8px;
          background: var(--tz-primary-dark);
          color: #fff;
          font-weight: 900;
          cursor: pointer;
        }

        .tz-success {
          display: grid;
          gap: 18px;
          padding: 24px 18px;
        }

        .tz-success-mark {
          width: 60px;
          height: 60px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: #fff;
          background: var(--tz-primary);
          font-size: 30px;
          font-weight: 950;
        }

        .tz-success-grid {
          display: grid;
          gap: 10px;
        }

        .tz-success-grid div {
          padding: 14px;
          border: 1px solid var(--tz-primary-line);
          border-radius: 8px;
          background: var(--tz-primary-soft);
          display: grid;
          gap: 4px;
        }

        .tz-success-grid span {
          color: var(--tz-muted);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .tz-success-actions {
          display: grid;
          gap: 10px;
        }

        .tz-modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 600;
          display: grid;
          place-items: center;
          padding: 20px;
          background: rgba(31, 80, 115, 0.48);
          backdrop-filter: blur(8px);
        }

        .tz-modal {
          width: min(520px, 100%);
          border-radius: 8px;
          background: var(--tz-surface);
          box-shadow: 0 28px 80px rgba(15, 23, 42, 0.28);
          padding: 22px;
          display: grid;
          gap: 14px;
        }

        .tz-modal h3 {
          margin: 0;
          color: var(--tz-text);
          font-size: 24px;
          line-height: 1.1;
        }

        .tz-modal p {
          margin: 0;
          color: var(--tz-muted);
          font-weight: 700;
          line-height: 1.55;
        }

        .tz-modal-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        .tz-modal-actions a,
        .tz-modal-actions button {
          min-height: 42px;
          border-radius: 8px;
          padding: 0 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 0;
          font: 900 14px/1 inherit;
          cursor: pointer;
          text-decoration: none;
        }

        .tz-modal-actions a {
          color: #fff;
          background: var(--tz-primary);
        }

        .tz-modal-actions button {
          color: var(--tz-primary-dark);
          background: var(--tz-primary-soft);
          border: 1px solid var(--tz-primary-line);
        }

        @media (min-width: 720px) {
          .tz-shell {
            width: min(1040px, calc(100% - 44px));
            padding-top: 48px;
          }

          .tz-head {
            padding: 34px;
          }

          .tz-body {
            padding: 30px 34px 34px;
          }

          .tz-actions,
          .tz-success-actions {
            grid-template-columns: 180px minmax(0, 1fr);
          }

          .tz-primary {
            grid-column: 2;
          }

          .tz-secondary {
            grid-column: 1;
            grid-row: 1;
          }

          .tz-slots {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          .tz-review,
          .tz-success-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>

      <Header
        currentUser={currentUser}
        onGoAuth={onGoAuth}
        onGoAdmin={onGoAdmin}
        onGoProfile={onGoProfile}
      />

      <main className="tz-main">
        <div className="tz-shell">
          <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "ТПМПК", to: "/tpmpk" }, { label: "Запись" }]} />
          <section className="tz-card">
            {success ? (
              <div className="tz-success" aria-live="polite">
                <div className="tz-success-mark">✓</div>
                <p className="tz-kicker">Запись принята</p>
                <h1>Заявка на обследование сохранена</h1>
                <div className="tz-success-grid">
                  <div><span>Номер записи</span><strong>{success.appointmentId}</strong></div>
                  <div><span>Дата</span><strong>{formatDate(success.date)}</strong></div>
                  <div><span>Время</span><strong>{formatTime(success.time)}</strong></div>
                </div>
                <div className="tz-success-actions">
                  <button type="button" className="tz-secondary" onClick={() => navigate("/tpmpk")}>
                    На страницу ТПМПК
                  </button>
                  <button
                    type="button"
                    className="tz-primary"
                    onClick={() => {
                      slotLockRef.current = null;
                      setForm(initialForm);
                      setSuccess(null);
                      setStep(0);
                      setSlots([]);
                    }}
                  >
                    Создать ещё одну запись
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="tz-head">
                  <div className="tz-head-row">
                    <Link className="tz-back" to="/tpmpk">← ТПМПК</Link>
                    <span className="tz-progress-label">Шаг {step + 1} из {steps.length}: {steps[step]}</span>
                  </div>
                  <h2>Запись ребёнка на обследование</h2>
                  <p>Заполните короткую форму. Свободное время подгружается автоматически после выбора даты.</p>
                  <div className="tz-progress" style={{ "--progress": `${progress}%` }}>
                    <span />
                  </div>
                </div>

                <div className="tz-body">
                  <div className="tz-step">{renderStep()}</div>
                  {submitError && (
                    <div className="tz-error" role="alert">
                      {submitError}
                      {(submitError.includes("слот") || submitError.includes("Слот")) && (
                        <button type="button" onClick={refreshSlots}>Обновить слоты</button>
                      )}
                    </div>
                  )}
                  <div className="tz-actions">
                    <button type="button" className="tz-secondary" onClick={step === 0 ? cancelBooking : goBack}>
                      {step === 0 ? "Отмена" : "Назад"}
                    </button>
                    {step < steps.length - 1 ? (
                      <button type="button" className="tz-primary" onClick={goNext}>
                        Далее
                      </button>
                    ) : (
                      <button type="button" className="tz-primary" onClick={submitAppointment} disabled={submitLoading}>
                        {submitLoading ? "Отправляем..." : "Записаться"}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      {notice && (
        <div className="tz-modal-backdrop" role="presentation" onClick={() => setNotice(null)}>
          <section className="tz-modal" role="dialog" aria-modal="true" aria-labelledby="tz-notice-title" onClick={(event) => event.stopPropagation()}>
            <h3 id="tz-notice-title">{notice.title}</h3>
            <p>{notice.text}</p>
            <div className="tz-modal-actions">
              {notice.link && <Link to={notice.link}>{notice.linkText || "Открыть раздел"}</Link>}
              <button type="button" onClick={() => setNotice(null)}>Понятно</button>
            </div>
          </section>
        </div>
      )}

      <Footer />
    </div>
  );
}
