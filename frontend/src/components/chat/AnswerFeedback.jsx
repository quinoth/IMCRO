import { useEffect, useState } from "react";
import { apiRateAssistantAnswer } from "../../api.js";

const SCORE_LABELS = {
  1: "Плохо",
  2: "Слабо",
  3: "Нормально",
  4: "Хорошо",
  5: "Отлично",
};

const STAR_BUTTON_STYLE = {
  width: 26,
  height: 26,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 20,
  lineHeight: 1,
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "inherit",
};

function getManualQuality(message) {
  return message?.manualQuality || message?.manual_quality || null;
}

function getInitialScore(message) {
  return Number(getManualQuality(message)?.score || message?.feedbackScore || 0);
}

function getInitialComment(message) {
  return getManualQuality(message)?.comment || "";
}

function getTags(value) {
  if (value <= 2) return ["low_score"];
  if (value >= 4) return ["high_score"];
  return [];
}

export default function AnswerFeedback({ message, sessionId }) {
  const [score, setScore] = useState(() => getInitialScore(message));
  const [hoverScore, setHoverScore] = useState(0);
  const [pendingScore, setPendingScore] = useState(0);
  const [comment, setComment] = useState(() => getInitialComment(message));
  const [commentOpen, setCommentOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    setScore(getInitialScore(message));
    setComment(getInitialComment(message));
  }, [message]);

  if (!message?.rateable || !message.text || !message.messageId) return null;

  const saveRating = async (value, text = "", { openComment = false } = {}) => {
    if (status === "sending") return;
    setError("");
    setStatus("sending");

    try {
      await apiRateAssistantAnswer({
        sessionId,
        messageId: message.messageId,
        score: value,
        comment: text.trim() || null,
        tags: getTags(value),
      });
      setScore(value);
      setPendingScore(value);
      setStatus("sent");
      if (openComment) {
        setComment("");
        setCommentOpen(true);
      } else {
        setCommentOpen(false);
      }
    } catch (e) {
      setStatus("error");
      setError(e.message || "Не удалось сохранить оценку");
    }
  };

  const selectScore = (value) => {
    setPendingScore(value);
    saveRating(value, "", { openComment: true });
  };

  const saveComment = () => {
    if (!pendingScore) return;
    saveRating(pendingScore, comment, { openComment: false });
  };

  const activeScore = hoverScore || score;

  return (
    <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px solid #E2E8F0" }}>
      <div style={{ display: "grid", gap: 4 }}>
        <span style={{ color: "#64748B", fontSize: 11, fontWeight: 800 }}>Оцените ответ:</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
          {[1, 2, 3, 4, 5].map((value) => {
            const active = value <= activeScore;
            return (
              <button
                key={value}
                type="button"
                title={`${value}: ${SCORE_LABELS[value]}`}
                aria-label={`${value}: ${SCORE_LABELS[value]}`}
                style={{
                  ...STAR_BUTTON_STYLE,
                  color: active ? "#F59E0B" : "#CBD5E1",
                  opacity: status === "sending" ? 0.65 : 1,
                }}
                disabled={status === "sending"}
                onMouseEnter={() => setHoverScore(value)}
                onMouseLeave={() => setHoverScore(0)}
                onFocus={() => setHoverScore(value)}
                onBlur={() => setHoverScore(0)}
                onClick={() => selectScore(value)}
              >
                ★
              </button>
            );
          })}
          {score > 0 && (
            <span style={{ color: "#475569", fontSize: 11, fontWeight: 700 }}>
              {SCORE_LABELS[score] || `${score}/5`}
            </span>
          )}
        </div>
      </div>

      {status === "sent" && (
        <div style={{ marginTop: 5, color: "#047857", fontSize: 11, fontWeight: 800 }}>
          Оценка сохранена.
        </div>
      )}
      {status === "error" && (
        <div style={{ marginTop: 5, color: "#B91C1C", fontSize: 11, fontWeight: 800 }}>
          {error}
        </div>
      )}

      {commentOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Комментарий к оценке"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 900,
            background: "rgba(15, 23, 42, 0.34)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div style={{ width: "min(420px, 100%)", background: "#fff", borderRadius: 10, border: "1px solid #E2E8F0", boxShadow: "0 18px 50px rgba(15,23,42,0.22)", padding: 18 }}>
            <h3 style={{ margin: 0, color: "#0F172A", fontSize: 18, fontWeight: 800 }}>
              Оставить комментарий?
            </h3>
            <p style={{ margin: "6px 0 12px", color: "#64748B", fontSize: 13, lineHeight: 1.45 }}>
              Оценка {pendingScore}/5 сохранена. Комментарий поможет точнее понять качество ответа.
            </p>
            <textarea
              rows={4}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Комментарий к оценке"
              maxLength={1000}
              autoFocus
              style={{
                width: "100%",
                boxSizing: "border-box",
                border: "1px solid #CBD5E1",
                borderRadius: 8,
                padding: "9px 10px",
                color: "#0F172A",
                fontSize: 13,
                fontFamily: "inherit",
                resize: "vertical",
                background: "#fff",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => {
                  setCommentOpen(false);
                  setComment("");
                }}
                disabled={status === "sending"}
                style={{
                  border: "1px solid #CBD5E1",
                  background: "#fff",
                  color: "#475569",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontWeight: 800,
                  cursor: status === "sending" ? "default" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                Без комментария
              </button>
              <button
                type="button"
                onClick={saveComment}
                disabled={status === "sending"}
                style={{
                  border: "1px solid #19789C",
                  background: "#19789C",
                  color: "#fff",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontWeight: 800,
                  cursor: status === "sending" ? "default" : "pointer",
                  fontFamily: "inherit",
                }}
              >
                Сохранить комментарий
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
