import { useCallback, useEffect, useState } from "react";
import { apiGetAssistantSettings, apiUpdateAssistantSettings } from "../../api.js";
import { cardStyle, inputStyle, labelStyle, primaryBtn } from "../certificates/shared/styles.js";
import AlertBanner from "../certificates/shared/AlertBanner.jsx";

const NUMERIC_FIELDS = [
  {
    name: "update_interval_hours",
    label: "Интервал обновления индекса, ч.",
    min: 0.01,
    max: 720,
    step: 0.5,
    hint: "Через сколько часов планировщик повторно обновляет базу знаний.",
  },
  {
    name: "question_max_length",
    label: "Максимальная длина запроса, символов",
    min: 1,
    max: 100000,
    step: 1,
    hint: "Более длинный вопрос будет отклонен до обращения к модели.",
  },
  {
    name: "session_ttl_seconds",
    label: "Срок хранения активной сессии, сек.",
    min: 0,
    max: 31536000,
    step: 60,
    hint: "Неактивная in-memory сессия будет удалена после этого срока. 0 отключает очистку по времени.",
  },
  {
    name: "history_max_messages",
    label: "Сообщений в истории диалога",
    min: 0,
    max: 100000,
    step: 1,
    hint: "Максимальное число сохраненных сообщений в одной сессии. 0 отключает обрезку.",
  },
  {
    name: "rate_limit_max_requests",
    label: "Допустимое количество обращений",
    min: 0,
    max: 100000,
    step: 1,
    hint: "Сколько запросов может выполнить пользователь за указанный промежуток. 0 отключает лимит.",
  },
  {
    name: "rate_limit_window_seconds",
    label: "Промежуток для ограничения, сек.",
    min: 0,
    max: 86400,
    step: 1,
    hint: "Окно подсчета обращений. 0 отключает лимит.",
  },
];

function formatDate(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("ru-RU");
}

function numericPayload(settings) {
  return {
    update_interval_hours: Number(settings.update_interval_hours),
    gigachat_model: settings.gigachat_model,
    question_max_length: Number(settings.question_max_length),
    session_ttl_seconds: Number(settings.session_ttl_seconds),
    history_max_messages: Number(settings.history_max_messages),
    rate_limit_window_seconds: Number(settings.rate_limit_window_seconds),
    rate_limit_max_requests: Number(settings.rate_limit_max_requests),
  };
}

export default function AssistantSettingsPanel({ onSaved }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("info");

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      setSettings(await apiGetAssistantSettings());
      setMessage(null);
    } catch (error) {
      setMessage(error.message || "Не удалось загрузить настройки ассистента");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const change = (name, value) => {
    setSettings((current) => ({ ...current, [name]: value }));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const saved = await apiUpdateAssistantSettings(numericPayload(settings));
      setSettings(saved);
      setMessage("Настройки сохранены и применены.");
      setMessageType("success");
      await onSaved?.();
    } catch (error) {
      setMessage(error.message || "Не удалось сохранить настройки ассистента");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0F172A" }}>
            Параметры ассистента
          </h2>
          <p style={{ color: "#64748B", margin: "8px 0 0", fontSize: 14, lineHeight: 1.55 }}>
            Изменения применяются без перезапуска backend. При смене модели активные диалоги начнут новую in-memory сессию.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSettings}
          disabled={loading || saving}
          style={{
            padding: "8px 12px",
            border: "1px solid #CBD5E1",
            borderRadius: 8,
            background: "#F8FAFC",
            color: "#475569",
            cursor: loading || saving ? "default" : "pointer",
            fontWeight: 600,
            fontFamily: "inherit",
          }}
        >
          Обновить
        </button>
      </div>

      {loading && !settings && (
        <div style={{ marginTop: 20, color: "#94A3B8", fontSize: 14 }}>Загрузка настроек...</div>
      )}

      {settings && (
        <form onSubmit={save} style={{ marginTop: 22 }}>
          <label style={{ ...labelStyle, fontSize: 14 }}>
            Используемая модель GigaChat
            <select
              value={settings.gigachat_model}
              onChange={(event) => change("gigachat_model", event.target.value)}
              disabled={saving}
              style={{ ...inputStyle, marginTop: 8, background: "#fff", color: "#0F172A" }}
            >
              {(settings.available_gigachat_models || []).map((model) => (
                <option key={model} value={model} style={{ background: "#fff", color: "#0F172A" }}>{model}</option>
              ))}
            </select>
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 18 }}>
            {NUMERIC_FIELDS.map((field) => (
              <label key={field.name} style={{ ...labelStyle, margin: 0, fontSize: 14 }}>
                {field.label}
                <input
                  type="number"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={settings[field.name]}
                  onChange={(event) => change(field.name, event.target.value)}
                  disabled={saving}
                  required
                  style={{ ...inputStyle, marginTop: 8 }}
                />
                <span style={{ display: "block", marginTop: 6, color: "#94A3B8", fontSize: 12, fontWeight: 400, lineHeight: 1.45 }}>
                  {field.hint}
                </span>
              </label>
            ))}
          </div>

          {settings.updated_at && (
            <div style={{ marginTop: 18, color: "#94A3B8", fontSize: 12 }}>
              Последнее изменение: {formatDate(settings.updated_at)}
            </div>
          )}

          <button type="submit" disabled={saving} style={{ ...primaryBtn(saving), marginTop: 20 }}>
            {saving ? "Сохранение..." : "Сохранить параметры"}
          </button>
        </form>
      )}

      {message && <AlertBanner type={messageType}>{message}</AlertBanner>}
    </div>
  );
}
