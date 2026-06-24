import { cardStyle } from "../certificates/shared/styles.js";
import AlertBanner from "../certificates/shared/AlertBanner.jsx";

function formatDate(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatSeconds(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(2)} с`;
}

function boolText(value) {
  return value ? "Да" : "Нет";
}

function Metric({ label, value, valueColor = "#0F172A", mono = false }) {
  return (
    <div style={{ background: "#F8FAFC", padding: "14px 16px", borderRadius: 10, border: "1px solid #E2E8F0" }}>
      <div style={{ fontSize: 12, color: "#64748B", marginBottom: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>
        {label}
      </div>
      <div style={{
        fontSize: 15,
        fontWeight: 700,
        color: valueColor,
        fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, monospace" : "inherit",
        wordBreak: "break-word",
      }}>
        {value}
      </div>
    </div>
  );
}

export default function StatusPanel({ status, loading, error }) {
  if (loading) {
    return (
      <div style={cardStyle}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0F172A" }}>Состояние ассистента</h2>
        <div style={{ marginTop: 20, color: "#94A3B8", fontSize: 14 }}>Загрузка статуса...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={cardStyle}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0F172A" }}>Состояние ассистента</h2>
        <AlertBanner type="error">Не удалось получить статус: {error}</AlertBanner>
      </div>
    );
  }

  const assistant = status?.assistant || {};
  const scheduler = status?.scheduler || {};
  const bg = status?.background || {};

  const assistantReady = !!assistant.ready;
  const schedulerRunning = !!scheduler.running;
  const taskRunning = !!bg.running;

  const dotColor = taskRunning ? "#F59E0B" : (assistantReady ? "#10B981" : "#EF4444");
  const dotText = taskRunning
    ? `Идет задача: ${bg.mode === "reindex" ? "полная переиндексация" : "обновление индекса"}`
    : (assistantReady ? "Ассистент готов" : `Ассистент: ${assistant.status || "не готов"}`);

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, gap: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0F172A" }}>
          Состояние ассистента
        </h2>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", textAlign: "right" }}>
          <span style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: dotColor,
            boxShadow: `0 0 0 3px ${dotColor}33`,
            animation: taskRunning ? "pulse 1.5s ease-in-out infinite" : "none",
            flexShrink: 0,
          }}/>
          {dotText}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Metric label="Статус" value={assistant.status || "-"} valueColor={assistantReady ? "#047857" : "#B91C1C"} />
        <Metric label="Векторов" value={assistant.vector_count ?? "-"} mono />
        <Metric label="Сессий" value={assistant.sessions ?? "-"} mono />
        <Metric label="Запросов" value={`${assistant.requests_successful ?? 0}/${assistant.requests_total ?? 0}`} mono />
        <Metric label="Ошибок" value={assistant.requests_failed ?? 0} valueColor={assistant.requests_failed ? "#B91C1C" : "#0F172A"} mono />
        <Metric label="Среднее время" value={formatSeconds(assistant.average_request_duration_seconds)} mono />
        <Metric label="Лимит" value={`${assistant.rate_limit_max_requests ?? "-"} за ${assistant.rate_limit_window_seconds ?? "-"} с`} mono />
        <Metric label="Последний запрос" value={formatDate(assistant.last_request_at)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        <Metric label="Векторная база" value={boolText(assistant.vectorstore_ready)} valueColor={assistant.vectorstore_ready ? "#047857" : "#B91C1C"} />
        <Metric label="Embeddings" value={boolText(assistant.embeddings_ready)} valueColor={assistant.embeddings_ready ? "#047857" : "#B91C1C"} />
        <Metric label="Reranker" value={boolText(assistant.reranker_ready)} valueColor={assistant.reranker_ready ? "#047857" : "#B91C1C"} />
      </div>

      {(assistant.last_error || assistant.last_request_error) && (
        <AlertBanner type="error">
          {assistant.last_request_error || assistant.last_error}
        </AlertBanner>
      )}

      {status?.updateError && (
        <AlertBanner type="warning">
          Статус обновления индекса недоступен: {status.updateError}
        </AlertBanner>
      )}

      {(scheduler.running !== undefined || bg.running !== undefined) && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: "20px 0 12px", color: "#0F172A" }}>
            Обновление индекса
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <Metric label="Планировщик" value={schedulerRunning ? "Активен" : "Остановлен"} valueColor={schedulerRunning ? "#047857" : "#64748B"} />
            <Metric label="Интервал" value={scheduler.interval_hours ? `${scheduler.interval_hours} ч.` : "-"} />
            <Metric label="Последний запуск" value={formatDate(scheduler.last_run)} />
            <Metric
              label="Следующий запуск"
              value={scheduler.next_run === "при следующем цикле" ? "при следующем цикле" : formatDate(scheduler.next_run)}
            />
            <Metric
              label="Текущая задача"
              value={taskRunning
                ? `${bg.mode === "reindex" ? "переиндексация" : "обновление"} с ${formatDate(bg.started_at)}`
                : "-"
              }
              valueColor={taskRunning ? "#D97706" : "#0F172A"}
            />
            <Metric label="Последнее время" value={formatSeconds(assistant.last_request_duration_seconds)} mono />
          </div>
        </>
      )}

      {scheduler.last_stats && (
        <div style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "#edf6f8",
          borderRadius: 10,
          border: "1px solid #A9D9E7",
          fontSize: 13,
          color: "#145F7D",
          lineHeight: 1.6,
        }}>
          <strong>Последний прогон:</strong>{" "}
          сайт +{scheduler.last_stats.site?.added ?? 0},
          {" "}~{scheduler.last_stats.site?.updated ?? 0},
          {" "}-{scheduler.last_stats.site?.removed ?? 0};{" "}
          S3 +{scheduler.last_stats.s3?.added ?? 0}
        </div>
      )}

      {!taskRunning && bg.result && (
        <AlertBanner type="success">
          Задача «{bg.result.mode === "full_reindex" ? "переиндексация" : "обновление индекса"}» завершена.
          {bg.result.vectors ? ` Векторов в базе: ${bg.result.vectors}.` : ""}
        </AlertBanner>
      )}
      {!taskRunning && bg.error && (
        <AlertBanner type="error">Ошибка последней задачи: {bg.error}</AlertBanner>
      )}
    </div>
  );
}
