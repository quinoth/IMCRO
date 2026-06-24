import { useState, useRef, useEffect } from "react";
import { apiAsk, apiClearChat, apiGetLatestAssistantAnswer } from "../../api.js";
import { cardStyle } from "../certificates/shared/styles.js";
import AlertBanner from "../certificates/shared/AlertBanner.jsx";
import AnswerFeedback from "./AnswerFeedback.jsx";
import { getLinkHref, linkifyText, shortenUrlLabel } from "../../utils/chatLinks.jsx";

function makeSessionId() {
  return `admin-test-${crypto.randomUUID()}`;
}

function makeInitialMessages(text = "Здравствуйте! Я помощник МКУ развития образования города Иркутска. Задайте ваш вопрос.") {
  return [{ id: Date.now(), from: "bot", text, rateable: false }];
}

export default function TestChatPanel() {
  const [sessionId] = useState(makeSessionId);
  const [messages, setMessages] = useState(() => makeInitialMessages());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const botId = Date.now() + 1;
    setError(null);
    setInput("");
    setMessages(m => [
      ...m,
      { id: Date.now(), from: "user", text },
      { id: botId, from: "bot", text: "", sources: [], question: text, rateable: false },
    ]);
    setLoading(true);

    try {
      const data = await apiAsk(text, sessionId, {
        onDelta: (chunk) => {
          setMessages(m => m.map(msg => (
            msg.id === botId ? { ...msg, text: `${msg.text || ""}${chunk}` } : msg
          )));
        },
      });

      let storedAnswer = null;
      try {
        storedAnswer = await apiGetLatestAssistantAnswer(sessionId, { answer: data.answer || "" });
      } catch (historyError) {
        void historyError;
      }
      const messageId = data.message_id || storedAnswer?.messageId || storedAnswer?.db_id;
      const manualQuality = storedAnswer?.manual_quality || storedAnswer?.metadata?.manual_quality || null;

      setMessages(m => m.map(msg => (
        msg.id === botId
          ? {
              ...msg,
              text: data.answer || msg.text || "Ассистент не вернул текст ответа.",
              rewritten: data.rewritten_question,
              sources: data.sources || [],
              answerId: data.answer_id,
              messageId,
              requestId: data.request_id,
              conversationId: data.conversation_id,
              quality: storedAnswer?.quality || storedAnswer?.metadata?.quality || null,
              manualQuality,
              feedbackScore: manualQuality?.score || 0,
              rateable: Boolean(messageId),
            }
          : msg
      )));
    } catch (e) {
      const message = e.message || "Ошибка связи с сервером";
      setError(message);
      setMessages(m => m.map(msg => (
        msg.id === botId ? { ...msg, text: `Ошибка: ${message}`, sources: [], rateable: false } : msg
      )));
    } finally {
      setLoading(false);
    }
  };

  const clearSession = async () => {
    try {
      await apiClearChat(sessionId);
    } catch (e) {
      void e;
    }
    setMessages(makeInitialMessages("История очищена. Задайте новый вопрос."));
    setError(null);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div style={{ ...cardStyle, display: "flex", flexDirection: "column", minHeight: 600, maxHeight: "80vh" }}>
      <style>{`
        @keyframes adminChatTyping {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0F172A" }}>Тестовый чат</h2>
          <p style={{ margin: "4px 0 0", color: "#64748B", fontSize: 13 }}>
            Проверяйте качество ответов, переформулировку вопроса, источники и сохранение оценки ответа.
          </p>
        </div>
        <button
          type="button"
          onClick={clearSession}
          disabled={loading}
          style={{
            padding: "8px 14px",
            background: "#F1F5F9",
            color: "#475569",
            border: "1px solid #E2E8F0",
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
            cursor: loading ? "default" : "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Новая сессия
        </button>
      </div>

      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "12px",
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #E2E8F0",
        marginBottom: 12,
      }}>
        {messages.length === 0 && !loading && (
          <div style={{ color: "#94A3B8", fontSize: 14, textAlign: "center", padding: "40px 20px", lineHeight: 1.6 }}>
            Задайте боту вопрос, например:<br/>
            <em>«Как попасть на страницу ТПМПК?»</em><br/>
            или <em>«Какие документы нужны для аттестации?»</em>
          </div>
        )}

        {messages.map(msg => <TestMessage key={msg.id} msg={msg} sessionId={sessionId} />)}

        {loading && !messages[messages.length - 1]?.text && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {error && <AlertBanner type="error">{error}</AlertBanner>}

      <div style={{
        display: "flex",
        gap: 8,
        padding: "10px 12px",
        background: "#F1F5F9",
        borderRadius: 12,
        border: "1px solid #E2E8F0",
      }}>
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Напишите вопрос... Enter - отправить, Shift+Enter - новая строка"
          disabled={loading}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: 14,
            resize: "none",
            color: "#0F172A",
          }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            padding: "0 20px",
            background: !input.trim() || loading ? "#CBD5E1" : "#19789C",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 700,
            cursor: !input.trim() || loading ? "default" : "pointer",
            fontSize: 14,
          }}
        >
          Отправить
        </button>
      </div>
    </div>
  );
}

function BotAvatar() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#19789C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5l-2 2V5Z" stroke="white" strokeWidth="1.3"/>
      </svg>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
      <BotAvatar />
      <div style={{ padding: "12px 16px", background: "#F1F5F9", borderRadius: "4px 16px 16px 16px", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#94A3B8",
            display: "inline-block",
            animation: "adminChatTyping 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}/>
        ))}
      </div>
    </div>
  );
}

function TestMessage({ msg, sessionId }) {
  const isBot = msg.from === "bot";

  return (
    <div style={{
      display: "flex",
      justifyContent: isBot ? "flex-start" : "flex-end",
      marginBottom: 12,
      minWidth: 0,
    }}>
      {isBot && <BotAvatar />}
      <div style={{
        maxWidth: "80%",
        minWidth: 0,
        padding: "10px 14px",
        borderRadius: isBot ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
        background: isBot ? "#F1F5F9" : "#19789C",
        color: isBot ? "#0F172A" : "#fff",
        fontSize: 13,
        lineHeight: 1.55,
        whiteSpace: "pre-line",
        wordBreak: "break-word",
        overflowWrap: "anywhere",
      }}>
        {msg.text ? linkifyText(msg.text, { isBot }) : "Готовлю ответ..."}

        {isBot && msg.rewritten && msg.rewritten !== msg.text && (
          <div style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px dashed #CBD5E1",
            fontSize: 12,
            color: "#64748B",
          }}>
            <strong>Переформулированный вопрос:</strong> {msg.rewritten}
          </div>
        )}

        {isBot && msg.sources?.length > 0 && (
          <div style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: "1px solid #E2E8F0",
          }}>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 6, fontWeight: 600 }}>
              Источники ({msg.sources.length}):
            </div>
            {msg.sources.map((src, i) => (
              <a
                key={`${src.source || src.title || i}-${i}`}
                href={getLinkHref(src.source)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#19789C",
                  textDecoration: "none",
                  marginBottom: 3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={getLinkHref(src.source)}
              >
                {src.title || shortenUrlLabel(src.source)}
              </a>
            ))}
          </div>
        )}

        {isBot && <AnswerFeedback message={msg} sessionId={sessionId} />}
      </div>
    </div>
  );
}
