const FIO_KEYS = ["ФИО участника", "ФИО", "фио", "fio", "Участник"];
const EVENT_KEYS = ["Название мероприятия", "Мероприятие", "мероприятие", "event"];
const ACHIEVEMENT_KEYS = ["Достижение", "Номинация", "Результат", "Основание"];
const DATE_KEYS = ["Дата", "дата", "date", "Дата выдачи"];

function normalizeKey(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, "");
}

function valueByKeys(values, keys, fallback = "") {
  const entries = Object.entries(values || {});
  for (const key of keys) {
    if (values?.[key]) return values[key];
    const normalized = normalizeKey(key);
    const found = entries.find(([entryKey]) => normalizeKey(entryKey) === normalized);
    if (found?.[1]) return found[1];
  }
  return fallback;
}

function buildExtraRows(values, knownValues) {
  const known = new Set(knownValues.filter(Boolean).map((value) => String(value).trim()));
  return Object.entries(values || {})
    .filter(([, value]) => value && !known.has(String(value).trim()))
    .slice(0, 3);
}

export default function CertificateSheetPreview({
  values,
  templateName,
  empty = false,
  className = "",
}) {
  const fio = valueByKeys(values, FIO_KEYS, empty ? "ФИО участника" : "Иванов Иван Иванович");
  const event = valueByKeys(values, EVENT_KEYS, empty ? "Название мероприятия" : "муниципальном образовательном мероприятии");
  const achievement = valueByKeys(values, ACHIEVEMENT_KEYS, empty ? "Достижение" : "за активное участие и высокие результаты");
  const date = valueByKeys(values, DATE_KEYS, empty ? "Дата" : new Date().toLocaleDateString("ru-RU"));
  const extraRows = buildExtraRows(values, [fio, event, achievement, date]);

  return (
    <div className={`cert-sheet-shell ${className}`.trim()} aria-label="Предпросмотр грамоты">
      <style>{`
        .cert-sheet-shell {
          width: 100%;
          display: grid;
          place-items: center;
          border: 1px solid #dbe5ea;
          border-radius: 8px;
          background: #f3f6f8;
          padding: 24px;
          overflow: auto;
        }
        .cert-sheet {
          width: min(100%, 420px);
          aspect-ratio: 210 / 297;
          position: relative;
          display: grid;
          align-content: stretch;
          border: 10px solid #f7fbfc;
          background:
            linear-gradient(#ffffff, #ffffff) padding-box,
            linear-gradient(135deg, #19789c, #d8e7ed 42%, #004f75) border-box;
          box-shadow: 0 20px 48px rgba(15, 23, 42, .14);
          color: #17232b;
          text-align: center;
          padding: 46px 44px 34px;
        }
        .cert-sheet::before {
          content: "";
          position: absolute;
          inset: 18px;
          border: 1px solid #d8e7ed;
          pointer-events: none;
        }
        .cert-sheet-top {
          align-self: start;
          position: relative;
          z-index: 1;
        }
        .cert-sheet-kicker {
          color: #667783;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: .08em;
          text-transform: uppercase;
        }
        .cert-sheet-title {
          margin: 14px 0 8px;
          color: #004f75;
          font-size: clamp(28px, 6vw, 46px);
          line-height: 1;
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 700;
          letter-spacing: .06em;
        }
        .cert-sheet-subtitle {
          color: #52636d;
          font-size: 12px;
          font-style: italic;
        }
        .cert-sheet-person {
          margin: 44px 0 18px;
          color: #004f75;
          font-size: clamp(23px, 4.5vw, 34px);
          line-height: 1.14;
          font-weight: 900;
        }
        .cert-sheet-text {
          max-width: 92%;
          margin: 0 auto;
          color: #17232b;
          font-size: 14px;
          line-height: 1.45;
          font-weight: 650;
        }
        .cert-sheet-event {
          margin-top: 11px;
          color: #004f75;
          font-weight: 800;
        }
        .cert-sheet-extra {
          margin-top: 16px;
          display: grid;
          gap: 5px;
          color: #52636d;
          font-size: 11px;
          line-height: 1.35;
        }
        .cert-sheet-bottom {
          margin-top: auto;
          position: relative;
          z-index: 1;
        }
        .cert-sheet-signatures {
          display: grid;
          grid-template-columns: 1fr 70px 1fr;
          gap: 10px;
          align-items: end;
          margin-top: 36px;
        }
        .cert-sign-line {
          border-top: 1px solid #9ab3bf;
          padding-top: 7px;
          color: #17232b;
          font-size: 10px;
          line-height: 1.25;
          text-align: left;
        }
        .cert-sign-line:last-child {
          text-align: right;
        }
        .cert-seal {
          width: 70px;
          height: 70px;
          display: grid;
          place-items: center;
          border: 2px solid rgba(25, 120, 156, .28);
          border-radius: 50%;
          color: rgba(25, 120, 156, .42);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
        }
        .cert-sheet-date {
          margin-top: 24px;
          color: #52636d;
          font-size: 11px;
          font-weight: 750;
        }
        @media (max-width: 620px) {
          .cert-sheet-shell {
            padding: 14px;
          }
          .cert-sheet {
            padding: 34px 24px 26px;
            border-width: 8px;
          }
          .cert-sheet-signatures {
            grid-template-columns: 1fr;
          }
          .cert-seal {
            margin: 0 auto;
          }
          .cert-sign-line,
          .cert-sign-line:last-child {
            text-align: center;
          }
        }
      `}</style>
      <article className="cert-sheet">
        <div className="cert-sheet-top">
          <div className="cert-sheet-kicker">{templateName || "Шаблон грамоты"}</div>
          <h2 className="cert-sheet-title">ГРАМОТА</h2>
          <div className="cert-sheet-subtitle">настоящим награждается</div>
          <div className="cert-sheet-person">{fio}</div>
          <div className="cert-sheet-text">
            <div>{achievement}</div>
            <div className="cert-sheet-event">{event}</div>
          </div>
          {extraRows.length > 0 && (
            <div className="cert-sheet-extra">
              {extraRows.map(([key, value]) => (
                <div key={key}>
                  <strong>{key}:</strong> {value}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="cert-sheet-bottom">
          <div className="cert-sheet-signatures">
            <div className="cert-sign-line">Директор ИМЦРО<br />Иванов И.И.</div>
            <div className="cert-seal">Печать</div>
            <div className="cert-sign-line">Председатель комиссии<br />Петров П.П.</div>
          </div>
          <div className="cert-sheet-date">Иркутск, {date}</div>
        </div>
      </article>
    </div>
  );
}
