import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../../constants/index.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { authHeaders } from "../../utils/authHeaders.js";
import AlertBanner from "./shared/AlertBanner.jsx";
import TemplateLivePreview from "./shared/TemplateLivePreview.jsx";

const FALLBACK_VARIABLES = ["ФИО участника", "Название мероприятия", "Дата", "Достижение"];

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function defaultValueFor(key) {
  const normalized = normalize(key);
  if (["фио", "fio", "фиоучастника", "участник"].includes(normalized)) return "Иванов Иван Иванович";
  if (["названиемероприятия", "мероприятие", "event"].includes(normalized)) return "Муниципальный этап всероссийской олимпиады";
  if (["достижение", "результат", "основание"].includes(normalized)) return "за высокие результаты и активное участие";
  if (["дата", "date", "датавыдачи"].includes(normalized)) return new Date().toLocaleDateString("ru-RU");
  return "";
}

function fieldTypeFor(key) {
  const normalized = normalize(key);
  return ["названиемероприятия", "мероприятие", "достижение", "основание", "результат"].includes(normalized)
    ? "textarea"
    : "input";
}

function addCommonAliases(values) {
  const next = { ...values };
  for (const [key, value] of Object.entries(values)) {
    const normalized = normalize(key);
    if (["фио", "fio", "фиоучастника", "участник"].includes(normalized)) {
      next["ФИО"] = value;
      next["фио"] = value;
      next.fio = value;
      next["ФИО участника"] = value;
    }
    if (["названиемероприятия", "мероприятие", "event"].includes(normalized)) {
      next["Название мероприятия"] = value;
      next["Мероприятие"] = value;
      next["мероприятие"] = value;
      next.event = value;
    }
    if (["дата", "date", "датавыдачи"].includes(normalized)) {
      next["Дата"] = value;
      next["дата"] = value;
      next.date = value;
    }
    if (["достижение", "основание", "результат"].includes(normalized)) {
      next["Достижение"] = value;
    }
  }
  return next;
}

export default function GenerateSingle({ templates }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? null);
  const [templateVariables, setTemplateVariables] = useState([]);
  const [variables, setVariables] = useState({});
  const [fileUrl, setFileUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingVariables, setLoadingVariables] = useState(false);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  const abortRef = useRef(null);

  useEffect(() => {
    if (templates.length && !templates.some((template) => template.id === templateId)) {
      setTemplateId(templates[0].id);
    }
  }, [templateId, templates]);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    let cancelled = false;
    setFileUrl(null);
    setMsg(null);

    if (!templateId) {
      setTemplateVariables([]);
      setVariables({});
      return undefined;
    }

    setLoadingVariables(true);
    fetch(`${API_BASE}/certificates/templates/${templateId}/variables`, {
      headers: authHeaders(),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await getApiErrorMessage(res, "Не удалось загрузить переменные шаблона"));
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const loaded = Array.isArray(data.variables) ? data.variables : [];
        const nextVariables = loaded.length ? loaded : FALLBACK_VARIABLES;
        setTemplateVariables(nextVariables);
        setVariables((prev) => nextVariables.reduce((result, key) => {
          result[key] = prev[key] ?? defaultValueFor(key);
          return result;
        }, {}));
      })
      .catch((error) => {
        if (cancelled) return;
        setTemplateVariables(FALLBACK_VARIABLES);
        setVariables((prev) => FALLBACK_VARIABLES.reduce((result, key) => {
          result[key] = prev[key] ?? defaultValueFor(key);
          return result;
        }, {}));
        setMsg(error.message || "Не удалось получить переменные шаблона. Показаны базовые поля.");
        setMsgType("error");
      })
      .finally(() => {
        if (!cancelled) setLoadingVariables(false);
      });

    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const missingVariables = useMemo(
    () => templateVariables.filter((key) => !String(variables[key] || "").trim()),
    [templateVariables, variables],
  );
  const disabled = loading || loadingVariables || !templateId || missingVariables.length > 0;

  const updateVariable = (key, value) => {
    setFileUrl(null);
    setVariables((prev) => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!templateId) return;
    if (missingVariables.length > 0) {
      setMsg(`Заполните поля: ${missingVariables.join(", ")}`);
      setMsgType("error");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setMsg(null);
    setFileUrl(null);

    try {
      const res = await fetch(`${API_BASE}/certificates/generate`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ template_id: templateId, variables: addCommonAliases(variables) }),
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setFileUrl(data.file_url);
        setMsg("Грамота сформирована. Проверьте данные и скачайте PDF.");
        setMsgType("success");
      } else {
        setMsg(await getApiErrorMessage(res, "Не удалось сформировать грамоту."));
        setMsgType("error");
      }
    } catch (error) {
      if (error.name === "AbortError") {
        setMsg("Формирование отменено");
        setMsgType("info");
      } else {
        setMsg("Нет связи с сервером. Проверьте подключение.");
        setMsgType("error");
      }
    } finally {
      setLoading(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    try {
      const res = await fetch(`${API_BASE}${fileUrl}`);
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Не удалось скачать PDF"));
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fio = variables["ФИО участника"] || variables["ФИО"] || "участник";
      link.href = blobUrl;
      link.download = `Грамота_${String(fio).replace(/[^а-яёА-ЯЁa-zA-Z0-9 ]/g, "_").slice(0, 60)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 0);
    } catch (error) {
      setMsg(error.message || "Ошибка скачивания PDF");
      setMsgType("error");
    }
  };

  return (
    <section className="single-certificate">
      <style>{`
        .single-certificate {
          --cert-primary: #19789c;
          --cert-primary-dark: #004f75;
          display: grid;
          grid-template-columns: minmax(340px, 520px) minmax(360px, 1fr);
          gap: 24px;
          align-items: start;
        }
        .single-card {
          border: 1px solid #d4e0e6;
          border-radius: 8px;
          background: #fff;
          padding: 22px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .06);
        }
        .single-card h2,
        .single-card h3 {
          margin: 0;
          color: var(--cert-primary-dark);
          line-height: 1.2;
        }
        .single-card h2 {
          font-size: 22px;
        }
        .single-card p {
          margin: 7px 0 0;
          color: #667783;
          line-height: 1.5;
          font-weight: 650;
        }
        .single-form {
          display: grid;
          gap: 16px;
          margin-top: 20px;
        }
        .single-field {
          display: grid;
          gap: 7px;
        }
        .single-field span,
        .single-template-label {
          color: #52636d;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .single-field input,
        .single-field textarea,
        .single-template-select {
          width: 100%;
          border: 1px solid #d6e0e6;
          border-radius: 8px;
          background: #fbfcfd;
          color: #17232b;
          font: inherit;
          font-size: 15px;
          padding: 12px 14px;
          outline: 0;
        }
        .single-field textarea {
          resize: vertical;
          min-height: 82px;
          line-height: 1.45;
        }
        .single-field input:focus,
        .single-field textarea:focus,
        .single-template-select:focus {
          border-color: var(--cert-primary);
          box-shadow: 0 0 0 4px rgba(25, 120, 156, .12);
          background: #fff;
        }
        .single-variable-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 12px;
        }
        .single-variable-chip {
          border-radius: 999px;
          border: 1px solid #cfe0e7;
          background: #edf6f8;
          color: var(--cert-primary-dark);
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 850;
        }
        .single-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 20px;
        }
        .single-primary,
        .single-secondary {
          min-height: 44px;
          border-radius: 8px;
          padding: 0 16px;
          font: inherit;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }
        .single-primary {
          border: 1px solid var(--cert-primary);
          background: var(--cert-primary);
          color: #fff;
          box-shadow: 0 10px 22px rgba(25, 120, 156, .24);
        }
        .single-primary:hover:not(:disabled) {
          background: var(--cert-primary-dark);
          border-color: var(--cert-primary-dark);
        }
        .single-secondary {
          border: 1px solid #cdd8df;
          background: #fff;
          color: var(--cert-primary-dark);
        }
        .single-primary:disabled,
        .single-secondary:disabled {
          border-color: #c8d2d8;
          background: #e8eef1;
          color: #7a8b94;
          box-shadow: none;
          cursor: not-allowed;
        }
        .single-preview {
          position: sticky;
          top: 88px;
          display: grid;
          gap: 14px;
        }
        .single-preview-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .single-ready {
          min-height: 28px;
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 0 10px;
          background: #ecfdf5;
          color: #047857;
          font-size: 12px;
          font-weight: 900;
        }
        @media (max-width: 1120px) {
          .single-certificate {
            grid-template-columns: 1fr;
          }
          .single-preview {
            position: static;
          }
        }
      `}</style>

      <div className="single-card">
        <h2>Данные грамоты</h2>
        <p>Выберите шаблон. Поля ниже строятся по переменным, найденным в выбранном шаблоне.</p>

        <div className="single-form">
          <label className="single-field">
            <span className="single-template-label">Шаблон</span>
            <select className="single-template-select" value={templateId ?? ""} onChange={(event) => setTemplateId(Number(event.target.value) || null)}>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </label>

          <div className="single-variable-list" aria-label="Переменные выбранного шаблона">
            {(templateVariables.length ? templateVariables : FALLBACK_VARIABLES).map((key) => (
              <span className="single-variable-chip" key={key}>{`{${key}}`}</span>
            ))}
          </div>

          {loadingVariables ? (
            <div className="single-card" style={{ boxShadow: "none", background: "#f8fbfc" }}>Загружаем переменные шаблона...</div>
          ) : templateVariables.length > 0 ? (
            templateVariables.map((key) => (
              <label className="single-field" key={key}>
                <span>{key}</span>
                {fieldTypeFor(key) === "textarea" ? (
                  <textarea
                    value={variables[key] ?? ""}
                    onChange={(event) => updateVariable(key, event.target.value)}
                    placeholder={`Введите значение для «${key}»`}
                  />
                ) : (
                  <input
                    value={variables[key] ?? ""}
                    onChange={(event) => updateVariable(key, event.target.value)}
                    placeholder={`Введите значение для «${key}»`}
                  />
                )}
              </label>
            ))
          ) : (
            <div className="single-card" style={{ boxShadow: "none", background: "#f8fbfc" }}>
              В выбранном шаблоне нет переменных. PDF можно сформировать без дополнительных данных.
            </div>
          )}
        </div>

        <div className="single-actions">
          <button type="button" className="single-primary" onClick={handleGenerate} disabled={disabled}>
            {loading ? "Формируем PDF..." : "Сформировать PDF"}
          </button>
          <button type="button" className="single-secondary" onClick={handleDownload} disabled={!fileUrl}>
            Скачать PDF
          </button>
        </div>

        {msg && <AlertBanner type={msgType}>{msg}</AlertBanner>}
      </div>

      <aside className="single-card single-preview">
        <div className="single-preview-head">
          <h3>Предпросмотр грамоты</h3>
          {fileUrl && <span className="single-ready">PDF готов</span>}
        </div>
        <TemplateLivePreview
          templateId={templateId}
          values={addCommonAliases(variables)}
          empty={!templateId}
        />
      </aside>
    </section>
  );
}
