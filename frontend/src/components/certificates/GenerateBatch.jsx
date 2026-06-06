import { useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../../constants/index.js";
import { getApiErrorMessage } from "../../utils/apiError.js";
import { authHeaders } from "../../utils/authHeaders.js";
import { getDownloadFilename } from "../../utils/contentDisposition.js";
import AlertBanner from "./shared/AlertBanner.jsx";
import TemplateLivePreview from "./shared/TemplateLivePreview.jsx";

const FIO_ALIASES = new Set(["фио", "fio", "full_name", "fullname", "полноеимя", "фамилияимяотчество", "name", "участник", "фиоучастника"]);

function normalize(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, "");
}

function rowValue(row, key) {
  if (!row || !key) return "";
  if (row[key] !== undefined) return row[key];
  const normalized = normalize(key);
  const found = Object.keys(row).find((item) => normalize(item) === normalized);
  return found ? row[found] : "";
}

function addCommonAliases(values) {
  const next = { ...values };
  for (const [key, value] of Object.entries(values || {})) {
    const normalized = normalize(key);
    if (FIO_ALIASES.has(normalized)) {
      next["ФИО"] = value;
      next["фио"] = value;
      next.fio = value;
      next["ФИО участника"] = value;
    }
    if (["названиемероприятия", "мероприятие", "event"].includes(normalized)) {
      next["Название мероприятия"] = value;
      next["Мероприятие"] = value;
      next.event = value;
    }
    if (["дата", "date", "датавыдачи"].includes(normalized)) {
      next["Дата"] = value;
      next.date = value;
    }
    if (["достижение", "основание", "результат"].includes(normalized)) {
      next["Достижение"] = value;
    }
  }
  return next;
}

function buildArchiveName() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  return `Грамоты_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
}

export default function GenerateBatch({ templates }) {
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? null);
  const [templateVariables, setTemplateVariables] = useState([]);
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState(null);
  const [parseError, setParseError] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState(null);
  const [msgType, setMsgType] = useState("info");
  const [archiveName, setArchiveName] = useState("");
  const [extraVariables, setExtraVariables] = useState({});
  const [generatedArchive, setGeneratedArchive] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const inputRef = useRef(null);
  const dragCounter = useRef(0);
  const progressRef = useRef(null);

  useEffect(() => {
    if (templates.length && !templates.some((template) => template.id === templateId)) {
      setTemplateId(templates[0].id);
    }
  }, [templateId, templates]);

  useEffect(() => () => {
    clearInterval(progressRef.current);
    if (generatedArchive?.url) URL.revokeObjectURL(generatedArchive.url);
  }, [generatedArchive?.url]);

  useEffect(() => {
    let cancelled = false;
    if (!templateId) {
      setTemplateVariables([]);
      return undefined;
    }
    fetch(`${API_BASE}/certificates/templates/${templateId}/variables`, { headers: authHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error(await getApiErrorMessage(res, "Не удалось загрузить переменные шаблона"));
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setTemplateVariables(Array.isArray(data.variables) ? data.variables : []);
      })
      .catch(() => {
        if (!cancelled) setTemplateVariables([]);
      });
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  const tableColumns = useMemo(() => {
    if (preview?.templateVariables?.length) return preview.templateVariables;
    if (templateVariables.length) return templateVariables;
    if (preview?.headers?.length) return preview.headers.slice(0, 5);
    return ["ФИО участника", "Название мероприятия", "Достижение", "Дата"];
  }, [preview, templateVariables]);
  const missingExtra = Object.keys(extraVariables).filter((key) => !String(extraVariables[key] || "").trim());
  const hasMissingColumns = (preview?.missingColumns || []).length > 0;
  const canGenerate = Boolean(templateId && file && preview && !parseError && !hasMissingColumns && missingExtra.length === 0 && !loading);

  const inspectFile = async (nextFile) => {
    if (!nextFile) return;
    if (!nextFile.name.toLowerCase().match(/\.(xlsx|xlsm)$/)) {
      setParseError("Нужен файл Excel в формате .xlsx или .xlsm.");
      setFile(null);
      setPreview(null);
      return;
    }

    setFile(nextFile);
    setParseError("");
    setPreview(null);
    setMsg(null);
    setGeneratedArchive((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });

    try {
      const fd = new FormData();
      fd.append("file", nextFile);
      if (templateId) fd.append("template_id", String(templateId));
      const res = await fetch(`${API_BASE}/certificates/excel/inspect`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
      });
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Не удалось проверить Excel"));
      const data = await res.json();
      const nextPreview = {
        headers: data.headers || [],
        rows: data.preview_rows || [],
        rowCount: data.row_count || 0,
        fioColumn: data.fio_column || null,
        templateVariables: data.template_variables || [],
        matchedColumns: data.matched_columns || [],
        missingColumns: data.missing_columns || [],
        warnings: data.warnings || [],
        processedPreview: data.processed_preview || [],
      };
      setPreview(nextPreview);
      setArchiveName((prev) => prev || buildArchiveName());
      setExtraVariables({});
    } catch (error) {
      setParseError(error.message || "Не удалось проверить Excel");
      setFile(null);
      setPreview(null);
    }
  };

  useEffect(() => {
    if (file && !loading) inspectFile(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  useEffect(() => {
    if (!loading) {
      setProgress(0);
      return undefined;
    }
    const total = preview?.rowCount || 10;
    const step = 100 / (total * 0.28 + 5);
    progressRef.current = window.setInterval(() => setProgress((value) => Math.min(value + step, 92)), 300);
    return () => window.clearInterval(progressRef.current);
  }, [loading, preview?.rowCount]);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    const controller = new AbortController();
    setAbortController(controller);
    setLoading(true);
    setMsg(null);
    setGeneratedArchive((current) => {
      if (current?.url) URL.revokeObjectURL(current.url);
      return null;
    });

    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("template_id", String(templateId));
      fd.append("response_mode", "json");
      if (archiveName.trim()) fd.append("archive_name", archiveName.trim());
      if (Object.keys(extraVariables).length > 0) {
        fd.append("extra_variables", JSON.stringify(addCommonAliases(extraVariables)));
      }
      const res = await fetch(`${API_BASE}/certificates/batch`, {
        method: "POST",
        headers: authHeaders(),
        body: fd,
        signal: controller.signal,
      });
      window.clearInterval(progressRef.current);
      setProgress(100);
      if (!res.ok) throw new Error(await getApiErrorMessage(res, "Ошибка на сервере"));
      const contentType = res.headers.get("Content-Type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        setGeneratedArchive({
          url: `${API_BASE}${data.file_url}`,
          filename: data.filename || `${archiveName.trim() || buildArchiveName()}.zip`,
          count: data.count || preview?.rowCount || 0,
        });
      } else {
        const blob = await res.blob();
        const cd = res.headers.get("Content-Disposition");
        const filename = getDownloadFilename(cd, `${archiveName.trim() || buildArchiveName()}.zip`);
        const blobUrl = URL.createObjectURL(blob);
        setGeneratedArchive({ url: blobUrl, filename, count: preview?.rowCount || 0 });
      }
      setMsg(`Сформировано грамот: ${preview?.rowCount || 0}. Архив готов к скачиванию.`);
      setMsgType("success");
    } catch (error) {
      if (error.name === "AbortError") {
        setMsg("Создание отменено");
        setMsgType("info");
      } else {
        setMsg(error.message || "Ошибка при создании архива");
        setMsgType("error");
      }
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  };

  const handleCancel = () => {
    window.clearInterval(progressRef.current);
    abortController?.abort();
    setAbortController(null);
    setLoading(false);
  };

  const downloadArchive = () => {
    if (!generatedArchive?.url) return;
    const link = document.createElement("a");
    link.href = generatedArchive.url;
    link.download = generatedArchive.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const firstPreviewValues = useMemo(() => {
    const row = preview?.processedPreview?.[0] || preview?.rows?.[0] || {};
    return addCommonAliases({ ...row, ...extraVariables });
  }, [extraVariables, preview?.processedPreview, preview?.rows]);
  const previewRowsForTable = preview?.processedPreview?.length ? preview.processedPreview : (preview?.rows || []);

  return (
    <section className="batch-certificate">
      <style>{`
        .batch-certificate {
          --batch-primary: #19789c;
          --batch-primary-dark: #004f75;
          display: grid;
          grid-template-columns: minmax(420px, 1.1fr) minmax(360px, .9fr);
          gap: 24px;
          align-items: start;
        }
        .batch-card {
          border: 1px solid #d4e0e6;
          border-radius: 8px;
          background: #fff;
          padding: 22px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, .06);
        }
        .batch-card h2,
        .batch-card h3 {
          margin: 0;
          color: var(--batch-primary-dark);
          line-height: 1.2;
        }
        .batch-card p {
          margin: 7px 0 0;
          color: #667783;
          line-height: 1.5;
          font-weight: 650;
        }
        .batch-flow {
          display: grid;
          gap: 18px;
        }
        .batch-field {
          display: grid;
          gap: 7px;
        }
        .batch-field span,
        .batch-label {
          color: #52636d;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .batch-field input,
        .batch-field select {
          width: 100%;
          min-height: 42px;
          border: 1px solid #d6e0e6;
          border-radius: 8px;
          background: #fbfcfd;
          color: #17232b;
          font: inherit;
          font-size: 14px;
          padding: 0 12px;
          outline: 0;
        }
        .batch-field input:focus,
        .batch-field select:focus {
          border-color: var(--batch-primary);
          box-shadow: 0 0 0 4px rgba(25, 120, 156, .12);
          background: #fff;
        }
        .batch-chip-list {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 10px;
        }
        .batch-chip {
          border-radius: 999px;
          border: 1px solid #cfe0e7;
          background: #edf6f8;
          color: var(--batch-primary-dark);
          padding: 5px 9px;
          font-size: 12px;
          font-weight: 850;
        }
        .batch-chip.success {
          border-color: #bbf7d0;
          background: #ecfdf5;
          color: #047857;
        }
        .batch-chip.error {
          border-color: #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }
        .batch-drop {
          min-height: 178px;
          display: grid;
          place-items: center;
          gap: 7px;
          border: 1.5px dashed #b9cbd4;
          border-radius: 8px;
          background: #f8fbfc;
          text-align: center;
          padding: 22px;
          cursor: pointer;
        }
        .batch-drop.is-active {
          border-color: var(--batch-primary);
          background: #edf6f8;
        }
        .batch-drop.has-file {
          border-color: #22c55e;
          background: #f0fdf4;
        }
        .batch-drop strong {
          color: #17232b;
          font-size: 15px;
        }
        .batch-drop small {
          color: #667783;
          font-weight: 750;
        }
        .batch-data-summary {
          display: grid;
          gap: 12px;
          border: 1px solid #d4e0e6;
          border-radius: 8px;
          background: #f8fbfc;
          padding: 16px;
        }
        .batch-data-summary strong {
          color: #047857;
        }
        .batch-table-wrap {
          overflow-x: auto;
          border: 1px solid #dbe6f5;
          border-radius: 8px;
          background: #fff;
        }
        .batch-table {
          width: 100%;
          min-width: 620px;
          border-collapse: collapse;
          font-size: 13px;
        }
        .batch-table th {
          background: #eef7fa;
          color: var(--batch-primary-dark);
          padding: 10px 12px;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
        }
        .batch-table td {
          border-top: 1px solid #edf2f7;
          color: #334155;
          padding: 11px 12px;
        }
        .batch-extra-grid {
          display: grid;
          gap: 12px;
        }
        .batch-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .batch-primary,
        .batch-secondary,
        .batch-danger {
          min-height: 44px;
          border-radius: 8px;
          padding: 0 16px;
          font: inherit;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }
        .batch-primary {
          border: 1px solid var(--batch-primary);
          background: var(--batch-primary);
          color: #fff;
          box-shadow: 0 10px 22px rgba(25, 120, 156, .24);
        }
        .batch-primary:hover:not(:disabled) {
          background: var(--batch-primary-dark);
          border-color: var(--batch-primary-dark);
        }
        .batch-secondary {
          border: 1px solid #cdd8df;
          background: #fff;
          color: var(--batch-primary-dark);
        }
        .batch-danger {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }
        .batch-primary:disabled,
        .batch-secondary:disabled {
          border-color: #c8d2d8;
          background: #e8eef1;
          color: #7a8b94;
          box-shadow: none;
          cursor: not-allowed;
        }
        .batch-progress {
          display: grid;
          gap: 7px;
        }
        .batch-progress-track {
          height: 10px;
          border-radius: 999px;
          background: #e2e8f0;
          overflow: hidden;
        }
        .batch-progress-track span {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: var(--batch-primary);
          transition: width .25s ease;
        }
        .batch-preview {
          position: sticky;
          top: 88px;
          display: grid;
          gap: 14px;
        }
        @media (max-width: 1120px) {
          .batch-certificate {
            grid-template-columns: 1fr;
          }
          .batch-preview {
            position: static;
          }
        }
      `}</style>

      <div className="batch-card batch-flow">
        <div>
          <h2>Групповой выпуск грамот</h2>
          <p>Загрузите Excel-файл. Колонки таблицы должны совпадать с переменными выбранного шаблона.</p>
        </div>

        <label className="batch-field">
          <span>Выбор шаблона</span>
          <select value={templateId ?? ""} onChange={(event) => setTemplateId(Number(event.target.value) || null)}>
            {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
          </select>
        </label>

        <div>
          <span className="batch-label">Переменные выбранного шаблона</span>
          <div className="batch-chip-list">
            {(templateVariables.length ? templateVariables : ["ФИО участника", "Название мероприятия", "Достижение", "Дата"]).map((key) => (
              <span className="batch-chip" key={key}>{`{${key}}`}</span>
            ))}
          </div>
        </div>

        <div>
          <span className="batch-label">Требуемые столбцы Excel</span>
          <div className="batch-chip-list">
            {(templateVariables.length ? templateVariables : ["ФИО участника"]).map((key) => (
              <span
                className={`batch-chip${preview ? (preview.missingColumns.some((item) => normalize(item) === normalize(key)) ? " error" : " success") : ""}`}
                key={key}
              >
                {key}
              </span>
            ))}
          </div>
        </div>

        <label
          className={`batch-drop${drag ? " is-active" : ""}${file ? " has-file" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            dragCounter.current += 1;
            if (dragCounter.current === 1) setDrag(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            dragCounter.current -= 1;
            if (dragCounter.current === 0) setDrag(false);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            dragCounter.current = 0;
            setDrag(false);
            inspectFile(event.dataTransfer.files?.[0]);
          }}
        >
          <input ref={inputRef} type="file" accept=".xlsx,.xlsm" hidden onChange={(event) => inspectFile(event.target.files?.[0])} />
          <strong>{file ? file.name : drag ? "Отпустите файл здесь" : "Перетащите Excel-файл сюда или выберите файл"}</strong>
          <small>{file ? "Файл проверен, его можно заменить" : "Поддерживаются .xlsx и .xlsm"}</small>
          <button type="button" className="batch-secondary" onClick={(event) => { event.preventDefault(); inputRef.current?.click(); }}>
            Выбрать файл
          </button>
        </label>

        {parseError && <AlertBanner type="error">{parseError}</AlertBanner>}

        {preview && !parseError && preview.missingColumns.length > 0 && (
          <AlertBanner type="error">
            В Excel не найдены обязательные столбцы: {preview.missingColumns.join(", ")}.
          </AlertBanner>
        )}

        {preview && !parseError && (
          <div className="batch-data-summary">
            <strong>Найдено строк: {preview.rowCount}</strong>
            <div className="batch-chip-list">
              {preview.headers.map((header) => (
                <span className="batch-chip success" key={header}>{header}</span>
              ))}
            </div>
            <div className="batch-table-wrap">
              <table className="batch-table">
                <thead>
                  <tr>
                    {tableColumns.map((column) => <th key={column}>{column}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {previewRowsForTable.slice(0, 5).map((row, index) => (
                    <tr key={`${index}-${JSON.stringify(row)}`}>
                      {tableColumns.map((column) => <td key={column}>{rowValue(row, column) || "—"}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.rowCount > previewRowsForTable.length && (
              <p>Показаны первые {previewRowsForTable.length} строк из {preview.rowCount}.</p>
            )}
            {preview.processedPreview?.length > 0 && (
              <p>Предпросмотр показывает обработанные значения с учётом склонений и override-колонок.</p>
            )}
            {preview.warnings?.length > 0 && (
              <AlertBanner type="info">
                {preview.warnings.slice(0, 4).join(" ")}
              </AlertBanner>
            )}
          </div>
        )}

        {Object.keys(extraVariables).length > 0 && (
          <div className="batch-extra-grid">
            <div>
              <h3>Общие значения для всех грамот</h3>
              <p>Эти переменные не найдены в Excel. Заполните их один раз для всего набора.</p>
            </div>
            {Object.keys(extraVariables).map((key) => (
              <label className="batch-field" key={key}>
                <span>{key}</span>
                <input
                  value={extraVariables[key] ?? ""}
                  onChange={(event) => setExtraVariables((prev) => ({ ...prev, [key]: event.target.value }))}
                  placeholder={`Значение для «${key}»`}
                />
              </label>
            ))}
          </div>
        )}

        <label className="batch-field">
          <span>Название архива</span>
          <input value={archiveName} onChange={(event) => setArchiveName(event.target.value)} placeholder="Грамоты_20260524_1030" />
        </label>

        {loading && (
          <div className="batch-progress">
            <div style={{ display: "flex", justifyContent: "space-between", color: "#52636d", fontSize: 13, fontWeight: 850 }}>
              <span>Формируем грамоты</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="batch-progress-track"><span style={{ width: `${progress}%` }} /></div>
          </div>
        )}

        <div className="batch-actions">
          <button type="button" className="batch-primary" onClick={handleGenerate} disabled={!canGenerate}>
            {loading ? "Формируем..." : preview ? `Сформировать ${preview.rowCount} грамот` : "Сформировать грамоты"}
          </button>
          <button type="button" className="batch-secondary" onClick={downloadArchive} disabled={!generatedArchive}>
            Скачать ZIP
          </button>
          {loading && (
            <button type="button" className="batch-danger" onClick={handleCancel}>
              Отмена
            </button>
          )}
        </div>

        {msg && <AlertBanner type={msgType}>{msg}</AlertBanner>}
      </div>

      <aside className="batch-card batch-preview">
        <h3>Предпросмотр одной грамоты</h3>
        <TemplateLivePreview
          templateId={templateId}
          values={firstPreviewValues}
          empty={!preview}
        />
      </aside>
    </section>
  );
}
