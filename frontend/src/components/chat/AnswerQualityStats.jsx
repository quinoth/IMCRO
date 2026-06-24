import { useCallback, useEffect, useMemo, useState } from "react";
import { apiAssistantQualityStats } from "../../api.js";
import { cardStyle } from "../certificates/shared/styles.js";
import AlertBanner from "../certificates/shared/AlertBanner.jsx";

function asNumber(value, fallback = null) {
  if (value === "" || value === null || value === undefined) return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function average(items, getter) {
  const values = items.map(getter).filter((value) => Number.isFinite(value));
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatScore(value, maxScore = 5) {
  const score = asNumber(value);
  if (!Number.isFinite(score)) return "-";
  return `${score % 1 ? score.toFixed(1) : score}/${maxScore}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function trimText(value, maxLength = 150) {
  const text = String(value || "").trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function normalizeItem(item) {
  const manualQuality = item?.manual_quality || item?.quality || item?.metadata?.manual_quality || null;
  const session = item?.session || {};
  const manualScore = asNumber(manualQuality?.score);

  return {
    id: item?.message_id || item?.id || crypto.randomUUID(),
    messageId: item?.message_id || item?.id || "",
    createdAt: item?.created_at || item?.createdAt || item?.timestamp || "",
    question: item?.question || item?.prompt || "",
    answer: item?.answer || item?.response || item?.text || "",
    manualQuality,
    manualScore,
    rated: item?.rated === true || Number.isFinite(manualScore),
    manualComment: manualQuality?.comment || "",
    manualTags: Array.isArray(manualQuality?.tags) ? manualQuality.tags : [],
    ratedAt: manualQuality?.rated_at || manualQuality?.ratedAt || "",
    ratedBy: manualQuality?.rated_by?.email || manualQuality?.rated_by?.username || "",
    sessionId: session.session_id || item?.session_id || "",
    scope: session.access_scope || item?.access_scope || "",
  };
}

function normalizeStats(raw) {
  const items = Array.isArray(raw?.items) ? raw.items.map(normalizeItem) : [];
  return {
    items,
    total: asNumber(raw?.count, items.length) || items.length,
    maxScore: asNumber(raw?.max_score, 5) || 5,
  };
}

function getTime(item, key) {
  const date = new Date(item?.[key]);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function applyFilters(items, filters) {
  const useScoreRange = filters.score === "range";
  const minScore = useScoreRange ? asNumber(filters.minScore) : null;
  const maxScore = useScoreRange ? asNumber(filters.maxScore) : null;
  const exactScore = filters.score === "all" || useScoreRange ? null : Number(filters.score);
  const query = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    const hasScore = Number.isFinite(item.manualScore);

    if (filters.ratedState === "rated" && !hasScore) return false;
    if (filters.ratedState === "unrated" && hasScore) return false;
    if (Number.isFinite(exactScore) && item.manualScore !== exactScore) return false;
    if (Number.isFinite(minScore) && (!hasScore || item.manualScore < minScore)) return false;
    if (Number.isFinite(maxScore) && (!hasScore || item.manualScore > maxScore)) return false;

    if (!query) return true;
    const haystack = [
      item.question,
      item.answer,
      item.manualComment,
      item.sessionId,
      item.ratedBy,
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function sortItems(items, sortBy) {
  const sorted = [...items];
  const scoreOr = (item, fallback) => Number.isFinite(item.manualScore) ? item.manualScore : fallback;

  sorted.sort((left, right) => {
    if (sortBy === "created_asc") return getTime(left, "createdAt") - getTime(right, "createdAt");
    if (sortBy === "rated_desc") return getTime(right, "ratedAt") - getTime(left, "ratedAt") || getTime(right, "createdAt") - getTime(left, "createdAt");
    if (sortBy === "rated_asc") {
      const leftTime = getTime(left, "ratedAt") || Number.POSITIVE_INFINITY;
      const rightTime = getTime(right, "ratedAt") || Number.POSITIVE_INFINITY;
      return leftTime - rightTime || getTime(right, "createdAt") - getTime(left, "createdAt");
    }
    if (sortBy === "score_desc") return scoreOr(right, -1) - scoreOr(left, -1) || getTime(right, "createdAt") - getTime(left, "createdAt");
    if (sortBy === "score_asc") return scoreOr(left, 999) - scoreOr(right, 999) || getTime(right, "createdAt") - getTime(left, "createdAt");
    if (sortBy === "unrated_first") {
      const leftUnrated = Number.isFinite(left.manualScore) ? 1 : 0;
      const rightUnrated = Number.isFinite(right.manualScore) ? 1 : 0;
      return leftUnrated - rightUnrated || getTime(right, "createdAt") - getTime(left, "createdAt");
    }
    return getTime(right, "createdAt") - getTime(left, "createdAt");
  });

  return sorted;
}

function getDistribution(items, maxScore, ratedState = "all") {
  const scoreRows = Array.from({ length: maxScore }, (_, index) => {
    const score = maxScore - index;
    return {
      key: String(score),
      label: String(score),
      count: items.filter((item) => item.manualScore === score).length,
      accent: score >= 4 ? "#16A34A" : score <= 2 ? "#DC2626" : "#D97706",
    };
  });

  const unratedRow = {
    key: "unrated",
    label: "Без оценки",
    count: items.filter((item) => !Number.isFinite(item.manualScore)).length,
    accent: "#64748B",
  };

  if (ratedState === "rated") return scoreRows;
  if (ratedState === "unrated") return [unratedRow];
  return [...scoreRows, unratedRow];
}

function Metric({ label, value, accent = "#0F172A" }) {
  return (
    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "14px 16px" }}>
      <div style={{ fontSize: 12, color: "#64748B", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, color: accent, fontWeight: 800, lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

function ScoreBadge({ score, maxScore }) {
  const number = asNumber(score);
  if (!Number.isFinite(number)) {
    return (
      <span style={{ display: "inline-flex", minWidth: 76, color: "#64748B", fontWeight: 800 }}>
        Без оценки
      </span>
    );
  }

  const color = number >= 4 ? "#047857" : number <= 2 ? "#B91C1C" : "#A16207";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", minWidth: 48, color, fontWeight: 800 }}>
      {formatScore(number, maxScore)}
    </span>
  );
}

function DistributionChart({ rows }) {
  const maxCount = Math.max(1, ...rows.map((row) => row.count));
  const chartWidth = 760;
  const chartHeight = 340;
  const margin = { top: 28, right: 34, bottom: 76, left: 62 };
  const innerWidth = chartWidth - margin.left - margin.right;
  const innerHeight = chartHeight - margin.top - margin.bottom;
  const tickStep = Math.max(1, Math.ceil(maxCount / 4));
  const ticks = Array.from(
    new Set([0, tickStep, tickStep * 2, tickStep * 3, maxCount].filter((tick) => tick <= maxCount)),
  );
  const axisY = margin.top + innerHeight;
  const columnGap = 18;
  const columnWidth = Math.max(34, (innerWidth - columnGap * (rows.length - 1)) / rows.length);
  const getY = (count) => axisY - (count / maxCount) * innerHeight;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 2 }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width="100%"
        height={chartHeight}
        role="img"
        aria-label="Диаграмма распределения оценок по количеству ответов"
        style={{ display: "block", minWidth: 680 }}
      >
        <line x1={margin.left} y1={margin.top} x2={margin.left} y2={axisY} stroke="#CBD5E1" strokeWidth="1.5" />
        <line x1={margin.left} y1={axisY} x2={margin.left + innerWidth} y2={axisY} stroke="#CBD5E1" strokeWidth="1.5" />

        {ticks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line x1={margin.left} y1={y} x2={margin.left + innerWidth} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text x={margin.left - 10} y={y + 4} textAnchor="end" fill="#64748B" fontSize="12" fontWeight="700">
                {tick}
              </text>
            </g>
          );
        })}

        {rows.map((row, index) => {
          const x = margin.left + index * (columnWidth + columnGap);
          const y = getY(row.count);
          const height = axisY - y;
          const countInside = height >= 30;
          const labelLines = row.key === "unrated" ? ["Без", "оценки"] : [row.label];
          return (
            <g key={row.key}>
              <rect x={x} y={margin.top} width={columnWidth} height={innerHeight} rx="6" fill="#F8FAFC" stroke="#E2E8F0" />
              {row.count > 0 && (
                <rect x={x} y={y} width={columnWidth} height={Math.max(4, height)} rx="6" fill={row.accent} />
              )}
              <text
                x={x + columnWidth / 2}
                y={countInside ? y + height / 2 + 4 : Math.max(margin.top + 14, y - 8)}
                textAnchor="middle"
                fill={countInside ? "#fff" : "#0F172A"}
                fontSize="13"
                fontWeight="800"
              >
                {row.count}
              </text>
              <text x={x + columnWidth / 2} y={axisY + 20} textAnchor="middle" fill="#475569" fontSize="12" fontWeight="800">
                {labelLines.map((line, lineIndex) => (
                  <tspan key={line} x={x + columnWidth / 2} dy={lineIndex === 0 ? 0 : 14}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}

        <text x={margin.left + innerWidth / 2} y={chartHeight - 12} textAnchor="middle" fill="#475569" fontSize="13" fontWeight="800">
          Оценка
        </text>
        <text x="18" y={margin.top + innerHeight / 2} transform={`rotate(-90 18 ${margin.top + innerHeight / 2})`} textAnchor="middle" fill="#475569" fontSize="13" fontWeight="800">
          Количество ответов
        </text>
      </svg>
    </div>
  );
}

const FIELD_STYLE = {
  height: 38,
  border: "1px solid #CBD5E1",
  borderRadius: 8,
  padding: "0 10px",
  fontFamily: "inherit",
  color: "#0F172A",
  background: "#fff",
};

const LABEL_STYLE = {
  display: "grid",
  gap: 6,
  color: "#475569",
  fontSize: 12,
  fontWeight: 800,
};

export default function AnswerQualityStats() {
  const [rawStats, setRawStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    ratedState: "all",
    score: "all",
    minScore: "",
    maxScore: "",
    sortBy: "created_desc",
    query: "",
  });

  const stats = useMemo(() => normalizeStats(rawStats), [rawStats]);
  const visibleItems = useMemo(
    () => sortItems(applyFilters(stats.items, filters), filters.sortBy),
    [filters, stats.items],
  );
  const distribution = useMemo(
    () => getDistribution(visibleItems, stats.maxScore, filters.ratedState),
    [filters.ratedState, stats.maxScore, visibleItems],
  );
  const ratedItems = visibleItems.filter((item) => Number.isFinite(item.manualScore));
  const unratedCount = visibleItems.length - ratedItems.length;
  const averageScore = average(ratedItems, (item) => item.manualScore);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRawStats(await apiAssistantQualityStats({ limit: 200 }));
    } catch (e) {
      setError(e.message || "Не удалось загрузить статистику качества ответов");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const updateFilter = (key, value) => {
    setFilters((current) => {
      if (key === "score" && value !== "range") {
        return { ...current, score: value, minScore: "", maxScore: "" };
      }
      return { ...current, [key]: value };
    });
  };

  const resetFilters = () => {
    setFilters({
      ratedState: "all",
      score: "all",
      minScore: "",
      maxScore: "",
      sortBy: "created_desc",
      query: "",
    });
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, color: "#0F172A", fontSize: 22, fontWeight: 800 }}>Качество ответов чат-бота</h2>
          </div>
          <button
            type="button"
            onClick={loadStats}
            disabled={loading}
            style={{
              border: "1px solid #CBD5E1",
              background: "#19789C",
              color: "#fff",
              borderRadius: 8,
              padding: "10px 14px",
              fontWeight: 800,
              cursor: loading ? "default" : "pointer",
              fontFamily: "inherit",
            }}
          >
            Обновить
          </button>
        </div>

        {loading && <div style={{ color: "#64748B", fontSize: 14 }}>Загрузка статистики...</div>}

        {!loading && error && (
          <AlertBanner type="warning">
            {error}. Проверьте авторизацию и доступность endpoint `/assistant/quality`.
          </AlertBanner>
        )}

        {!loading && !error && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <Metric label="Ответов" value={visibleItems.length} />
              <Metric label="Оценено" value={ratedItems.length} accent="#047857" />
              <Metric label="Без оценки" value={unratedCount} accent="#64748B" />
              <Metric label="Средний балл" value={averageScore === null ? "-" : formatScore(Number(averageScore.toFixed(1)), stats.maxScore)} accent="#0F766E" />
              <Metric label="Низкие" value={ratedItems.filter((item) => item.manualScore <= 2).length} accent="#B91C1C" />
              <Metric label="Высокие" value={ratedItems.filter((item) => item.manualScore >= 4).length} accent="#047857" />
            </div>
            <div style={{ marginTop: 14, color: "#64748B", fontSize: 13 }}>
              Загружено: {stats.items.length}. Показано после фильтров: {visibleItems.length}.
            </div>
          </>
        )}
      </div>

      {!loading && !error && (
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, color: "#0F172A", fontSize: 18, fontWeight: 800 }}>Ответы</h3>
            <button
              type="button"
              onClick={resetFilters}
              style={{
                border: "1px solid #CBD5E1",
                background: "#F8FAFC",
                color: "#475569",
                borderRadius: 8,
                padding: "8px 12px",
                fontWeight: 800,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Сбросить фильтры
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
            <label style={LABEL_STYLE}>
              Статус
              <select value={filters.ratedState} onChange={(event) => updateFilter("ratedState", event.target.value)} style={FIELD_STYLE}>
                <option value="all">Все ответы</option>
                <option value="rated">С оценкой</option>
                <option value="unrated">Без оценки</option>
              </select>
            </label>
            <label style={LABEL_STYLE}>
              Оценка
              <select value={filters.score} onChange={(event) => updateFilter("score", event.target.value)} style={FIELD_STYLE}>
                <option value="all">Любая</option>
                <option value="range">Диапазон</option>
                {[5, 4, 3, 2, 1].map((score) => (
                  <option key={score} value={score}>{score}</option>
                ))}
              </select>
            </label>
            {filters.score === "range" && (
              <>
                <label style={LABEL_STYLE}>
                  Минимум
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="1"
                    value={filters.minScore}
                    onChange={(event) => updateFilter("minScore", event.target.value)}
                    style={FIELD_STYLE}
                  />
                </label>
                <label style={LABEL_STYLE}>
                  Максимум
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="1"
                    value={filters.maxScore}
                    onChange={(event) => updateFilter("maxScore", event.target.value)}
                    style={FIELD_STYLE}
                  />
                </label>
              </>
            )}
            <label style={LABEL_STYLE}>
              Сортировка
              <select value={filters.sortBy} onChange={(event) => updateFilter("sortBy", event.target.value)} style={FIELD_STYLE}>
                <option value="created_desc">Дата ответа: новые</option>
                <option value="created_asc">Дата ответа: старые</option>
                <option value="rated_desc">Дата оценки: новые</option>
                <option value="rated_asc">Дата оценки: старые</option>
                <option value="score_desc">Оценка 5-1</option>
                <option value="score_asc">Оценка 1-5</option>
                <option value="unrated_first">Без оценки сверху</option>
              </select>
            </label>
            <label style={LABEL_STYLE}>
              Поиск
              <input
                type="search"
                value={filters.query}
                onChange={(event) => updateFilter("query", event.target.value)}
                placeholder="Вопрос, ответ, комментарий"
                style={FIELD_STYLE}
              />
            </label>
          </div>

          {visibleItems.length === 0 ? (
            <div style={{ color: "#64748B", fontSize: 14 }}>Данных по выбранным фильтрам пока нет.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ color: "#64748B", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ padding: "10px 8px" }}>Дата ответа</th>
                    <th style={{ padding: "10px 8px" }}>Оценка</th>
                    <th style={{ padding: "10px 8px" }}>Вопрос</th>
                    <th style={{ padding: "10px 8px" }}>Ответ ассистента</th>
                    <th style={{ padding: "10px 8px" }}>Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "11px 8px", color: "#475569", whiteSpace: "nowrap", verticalAlign: "top" }}>
                        {formatDate(item.createdAt)}
                      </td>
                      <td style={{ padding: "11px 8px", verticalAlign: "top", whiteSpace: "nowrap" }}>
                        <ScoreBadge score={item.manualScore} maxScore={stats.maxScore} />
                      </td>
                      <td style={{ padding: "11px 8px", color: "#0F172A", minWidth: 280, verticalAlign: "top" }}>
                        <div style={{ fontWeight: 700 }}>{trimText(item.question || "-", 180)}</div>
                      </td>
                      <td style={{ padding: "11px 8px", color: "#64748B", minWidth: 320, verticalAlign: "top", lineHeight: 1.5 }}>
                        {trimText(item.answer || "-", 240)}
                      </td>
                      <td style={{ padding: "11px 8px", color: "#64748B", minWidth: 180, verticalAlign: "top" }}>
                        {item.manualComment || "-"}
                        {item.ratedBy && (
                          <div style={{ marginTop: 4, fontSize: 12, color: "#94A3B8" }}>
                            {item.ratedBy}, {formatDate(item.ratedAt)}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {!loading && !error && (
        <div style={cardStyle}>
          <h3 style={{ margin: "0 0 4px", color: "#0F172A", fontSize: 18, fontWeight: 800 }}>Распределение оценок</h3>
          <DistributionChart rows={distribution} />
        </div>
      )}
    </div>
  );
}
