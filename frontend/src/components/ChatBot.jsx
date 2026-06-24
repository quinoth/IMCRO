import { useState, useEffect, useRef, useCallback } from "react";
import { apiAsk, apiClearChat, apiGetLatestAssistantAnswer } from "../api.js";
import AnswerFeedback from "./chat/AnswerFeedback.jsx";
import { getLinkHref, linkifyText, shortenUrlLabel } from "../utils/chatLinks.jsx";

const SESSION_ID = `web-${crypto.randomUUID()}`;
const CHAT_SIZE_STORAGE_KEY = "mky_chat_window_size";
const DEFAULT_CHAT_SIZE = { width: 340, height: 500 };
const MIN_CHAT_SIZE = { width: 320, height: 420 };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getChatSizeLimits() {
  if (typeof window === "undefined") {
    return { minWidth: MIN_CHAT_SIZE.width, minHeight: MIN_CHAT_SIZE.height, maxWidth: 720, maxHeight: 760 };
  }
  return {
    minWidth: MIN_CHAT_SIZE.width,
    minHeight: MIN_CHAT_SIZE.height,
    maxWidth: Math.max(MIN_CHAT_SIZE.width, window.innerWidth - 48),
    maxHeight: Math.max(MIN_CHAT_SIZE.height, window.innerHeight - 120),
  };
}

function clampChatSize(size) {
  const limits = getChatSizeLimits();
  return {
    width: clamp(Number(size?.width) || DEFAULT_CHAT_SIZE.width, limits.minWidth, limits.maxWidth),
    height: clamp(Number(size?.height) || DEFAULT_CHAT_SIZE.height, limits.minHeight, limits.maxHeight),
  };
}

function getInitialChatSize() {
  try {
    return clampChatSize(JSON.parse(window.localStorage.getItem(CHAT_SIZE_STORAGE_KEY) || "null"));
  } catch {
    return clampChatSize(DEFAULT_CHAT_SIZE);
  }
}

function getResizeCursor(direction) {
  if (direction === "nw" || direction === "se") return "nwse-resize";
  if (direction === "ne" || direction === "sw") return "nesw-resize";
  if (direction === "n" || direction === "s") return "ns-resize";
  return "ew-resize";
}

function Message({ msg, sessionId }) {
  const isBot = msg.from === "bot";
  return (
    <div style={{ display: "flex", justifyContent: isBot ? "flex-start" : "flex-end", marginBottom: 12, minWidth: 0 }}>
      {isBot && (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#19789C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5l-2 2V5Z" stroke="white" strokeWidth="1.3"/>
          </svg>
        </div>
      )}
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

        {isBot && msg.sources?.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #CBD5E1" }}>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>Источники:</div>
            {msg.sources.map((src, i) => (
              <a
                key={`${src.source || src.title || i}-${i}`}
                href={getLinkHref(src.source)}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-source-link"
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

function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#19789C", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 8, marginTop: 2 }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H5l-2 2V5Z" stroke="white" strokeWidth="1.3"/>
        </svg>
      </div>
      <div style={{ padding: "12px 16px", background: "#F1F5F9", borderRadius: "4px 16px 16px 16px", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: "50%", background: "#94A3B8",
            display: "inline-block",
            animation: "typing 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}/>
        ))}
      </div>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [chatSize, setChatSize] = useState(getInitialChatSize);
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "bot",
      text: "Здравствуйте! Я помощник МКУ развития образования города Иркутска. Задайте ваш вопрос.",
      rateable: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(CHAT_SIZE_STORAGE_KEY, JSON.stringify(chatSize));
    } catch {
      // Размер окна чата не критичен, если localStorage недоступен.
    }
  }, [chatSize]);

  useEffect(() => {
    const handleResize = () => setChatSize((size) => clampChatSize(size));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const adjustInputHeight = useCallback(() => {
    const element = inputRef.current;
    if (!element) return;
    const maxHeight = Math.min(160, Math.max(80, Math.round(chatSize.height * 0.28)));
    element.style.height = "auto";
    const nextHeight = Math.min(element.scrollHeight, maxHeight);
    element.style.height = `${nextHeight}px`;
    element.style.overflowY = element.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [chatSize.height]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        adjustInputHeight();
      }, 100);
    }
  }, [adjustInputHeight, open]);

  useEffect(() => {
    adjustInputHeight();
  }, [adjustInputHeight, input, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const question = text.trim();
    if (!question || loading) return;
    setError(null);

    const userMsg = { id: Date.now(), from: "user", text: question };
    const botId = Date.now() + 1;
    const botMsg = { id: botId, from: "bot", text: "", sources: [], question, rateable: false };

    setMessages(m => [...m, userMsg, botMsg]);
    setInput("");
    setLoading(true);

    try {
      const data = await apiAsk(question, SESSION_ID, {
        onDelta: (chunk) => {
          setMessages(m => m.map(msg => (
            msg.id === botId ? { ...msg, text: `${msg.text || ""}${chunk}` } : msg
          )));
        },
      });

      let storedAnswer = null;
      try {
        storedAnswer = await apiGetLatestAssistantAnswer(SESSION_ID, { answer: data.answer || "" });
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
              sources: data.sources || [],
              rewritten: data.rewritten_question,
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
      const errText = e.message || "Не удалось подключиться к серверу";
      setError(errText);
      setMessages(m => m.map(msg => (
        msg.id === botId ? { ...msg, text: `Ошибка: ${errText}`, sources: [], rateable: false } : msg
      )));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearHistory = async () => {
    try {
      await apiClearChat(SESSION_ID);
    } catch (e) {
      void e;
    }
    setError(null);
    setMessages([{
      id: Date.now(),
      from: "bot",
      text: "История очищена. Задайте новый вопрос.",
      rateable: false,
    }]);
  };

  const startResize = (event, direction) => {
    if (window.matchMedia("(max-width: 480px)").matches) return;
    event.preventDefault();
    event.stopPropagation();
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = chatSize.width;
    const startHeight = chatSize.height;
    const resizeDirection = direction || "nw";
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = getResizeCursor(resizeDirection);
    document.body.style.userSelect = "none";

    const handleMove = (moveEvent) => {
      const limits = getChatSizeLimits();
      let nextWidth = startWidth;
      let nextHeight = startHeight;
      if (resizeDirection.includes("w")) nextWidth = startWidth + startX - moveEvent.clientX;
      if (resizeDirection.includes("e")) nextWidth = startWidth + moveEvent.clientX - startX;
      if (resizeDirection.includes("n")) nextHeight = startHeight + startY - moveEvent.clientY;
      if (resizeDirection.includes("s")) nextHeight = startHeight + moveEvent.clientY - startY;
      setChatSize({
        width: clamp(nextWidth, limits.minWidth, limits.maxWidth),
        height: clamp(nextHeight, limits.minHeight, limits.maxHeight),
      });
    };

    const stopResize = () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stopResize);
      window.removeEventListener("pointercancel", stopResize);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  };

  return (
    <>
      <style>{`
        .chat-window {
          position: fixed; bottom: 94px; right: 24px; z-index: 400;
          width: min(var(--chat-width, 340px), calc(100vw - 48px));
          height: min(var(--chat-height, 500px), calc(100vh - 120px));
          min-width: 320px; min-height: 420px; max-height: calc(100vh - 120px);
          background: #fff; border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 16px 48px rgba(0,0,0,0.14);
          display: flex; flex-direction: column;
          animation: chatIn 0.2s ease;
          overflow: hidden;
        }
        @keyframes chatIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes typing {
          0%, 80%, 100% { transform: scale(0.8); opacity: 0.4; }
          40%            { transform: scale(1.1); opacity: 1; }
        }
        .chat-link-bot, .chat-link-user {
          text-decoration: underline;
          word-break: break-all;
          overflow-wrap: anywhere;
          font-weight: 600;
        }
        .chat-link-bot  { color: #19789C; }
        .chat-link-bot:hover  { color: #19789C; }
        .chat-link-user { color: #fff; }
        .chat-link-user:hover { color: #dceaf2; }
        .chat-source-link {
          display: block;
          font-size: 11px;
          color: #19789C;
          font-weight: 600;
          text-decoration: none;
          margin-bottom: 4px;
          padding: 4px 8px;
          background: rgba(25,120,156,0.08);
          border-radius: 6px;
          word-break: break-all;
          overflow-wrap: anywhere;
          line-height: 1.4;
          transition: background 0.15s;
        }
        .chat-source-link:hover { background: rgba(25,120,156,0.14); text-decoration: underline; }
        .chat-input {
          flex: 1; min-height: 20px; border: none; outline: none; background: transparent;
          font-size: 13px; color: #0F172A; font-family: inherit; resize: none;
          line-height: 1.5; overflow-y: hidden;
        }
        .chat-input::placeholder { color: #94A3B8; }
        .chat-send {
          width: 32px; height: 32px; border-radius: 9px; border: none;
          background: #19789C; cursor: pointer; display: flex;
          align-items: center; justify-content: center; flex-shrink: 0;
          transition: background 0.15s, transform 0.1s;
        }
        .chat-send:hover { background: #19789C; transform: scale(1.05); }
        .chat-send:disabled { background: #CBD5E1; cursor: default; transform: none; }
        .chat-fab {
          position: fixed; bottom: 24px; right: 24px; z-index: 400;
          width: 60px; height: 60px; border-radius: 50%;
          background: #19789C; cursor: pointer; color: #fff;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(25,120,156,0.35);
          border: 4px solid #fff;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
        }
        .chat-fab:hover {
          transform: scale(1.08) translateY(-4px);
          box-shadow: 0 12px 32px rgba(25,120,156,0.42);
        }
        .chat-clear {
          background: none; border: none; cursor: pointer; padding: 4px;
          color: rgba(255,255,255,0.7); font-size: 13px;
          border-radius: 6px; transition: color 0.15s;
        }
        .chat-clear:hover { color: #fff; }
        .chat-resize-handle {
          position: absolute; z-index: 5; border: 0; padding: 0;
          background: transparent; touch-action: none;
        }
        .chat-resize-handle:hover { background: rgba(25,120,156,0.1); }
        .chat-resize-top { top: 0; left: 18px; right: 18px; height: 8px; cursor: ns-resize; }
        .chat-resize-right { top: 18px; right: 0; bottom: 18px; width: 8px; cursor: ew-resize; }
        .chat-resize-bottom { left: 18px; right: 18px; bottom: 0; height: 8px; cursor: ns-resize; }
        .chat-resize-left { top: 18px; left: 0; bottom: 18px; width: 8px; cursor: ew-resize; }
        .chat-resize-nw { top: 0; left: 0; width: 20px; height: 20px; cursor: nwse-resize; }
        .chat-resize-ne { top: 0; right: 0; width: 20px; height: 20px; cursor: nesw-resize; }
        .chat-resize-sw { bottom: 0; left: 0; width: 20px; height: 20px; cursor: nesw-resize; }
        .chat-resize-se { bottom: 0; right: 0; width: 20px; height: 20px; cursor: nwse-resize; }
        @media (max-width: 480px) {
          .chat-window { width: calc(100vw - 32px); height: min(500px, calc(100vh - 96px)); min-width: 0; right: 16px; bottom: 80px; }
          .chat-fab { right: 16px; bottom: 16px; }
          .chat-resize-handle { display: none; }
        }
      `}</style>

      {open && (
        <div className="chat-window" style={{ "--chat-width": `${chatSize.width}px`, "--chat-height": `${chatSize.height}px` }}>
          <div className="chat-resize-handle chat-resize-top" aria-hidden="true" onPointerDown={(event) => startResize(event, "n")} />
          <div className="chat-resize-handle chat-resize-right" aria-hidden="true" onPointerDown={(event) => startResize(event, "e")} />
          <div className="chat-resize-handle chat-resize-bottom" aria-hidden="true" onPointerDown={(event) => startResize(event, "s")} />
          <div className="chat-resize-handle chat-resize-left" aria-hidden="true" onPointerDown={(event) => startResize(event, "w")} />
          <div className="chat-resize-handle chat-resize-nw" aria-hidden="true" onPointerDown={(event) => startResize(event, "nw")} />
          <div className="chat-resize-handle chat-resize-ne" aria-hidden="true" onPointerDown={(event) => startResize(event, "ne")} />
          <div className="chat-resize-handle chat-resize-sw" aria-hidden="true" onPointerDown={(event) => startResize(event, "sw")} />
          <div className="chat-resize-handle chat-resize-se" aria-hidden="true" onPointerDown={(event) => startResize(event, "se")} />
          <div style={{ background: "#19789C", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H6l-3 2V5Z" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Помощник МКУ</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: loading ? "#FCD34D" : "#4ADE80", display: "inline-block", transition: "background 0.3s" }}/>
                {loading ? "Печатает..." : "Онлайн"}
              </div>
            </div>
            <button className="chat-clear" onClick={clearHistory} title="Очистить историю">
              Сброс
            </button>
            <button onClick={() => setOpen(false)} style={{ background: "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 12px 8px", display: "flex", flexDirection: "column" }}>
            {messages.map(msg => <Message key={msg.id} msg={msg} sessionId={SESSION_ID} />)}
            {loading && !messages[messages.length - 1]?.text && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "10px 12px 12px", borderTop: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#F8FAFC", border: `1.5px solid ${error ? "#FCA5A5" : "#E2E8F0"}`, borderRadius: 12, padding: "9px 10px 9px 14px", transition: "border-color 0.2s" }}>
              <textarea
                ref={inputRef}
                className="chat-input"
                rows={1}
                placeholder="Напишите вопрос..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKey}
                style={{ maxHeight: Math.min(160, Math.max(80, Math.round(chatSize.height * 0.28))) }}
                disabled={loading}
              />
              <button className="chat-send" onClick={() => sendMessage(input)} disabled={!input.trim() || loading} title="Отправить">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M12.5 1.5L1.5 6l4.5 1.5L7.5 12l5-10.5Z" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <button className="chat-fab" onClick={() => setOpen(v => !v)} title="Написать нам">
        {open ? (
          <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 22 22" fill="none">
            <path d="M3 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7l-4 3V5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M7 9h8M7 12h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </>
  );
}
