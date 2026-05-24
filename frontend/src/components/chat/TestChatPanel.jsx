import { useEffect, useRef, useState } from "react";
import { cardStyle } from "../certificates/shared/styles.js";
import { DEMO_CHAT_PROMPTS, getDemoChatReply } from "../../utils/demoChat.js";
import { linkifyText } from "../../utils/chatLinks.jsx";

export default function TestChatPanel() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      from: "bot",
      text:
        "Это демонстрационный frontend-only чат. Он не обращается к backend assistant/RAG API и нужен только для показа предусмотренного интерфейса.",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = (value = input) => {
    const text = value.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      { id: Date.now(), from: "user", text },
      { id: Date.now() + 1, from: "bot", text: getDemoChatReply(text) },
    ]);
    setInput("");
  };

  const clearSession = () => {
    setMessages([
      {
        id: Date.now(),
        from: "bot",
        text: "История очищена. Выберите подсказку или задайте вопрос по навигации портала.",
      },
    ]);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleKey = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div style={{ ...cardStyle, display: "flex", flexDirection: "column", minHeight: 560, maxHeight: "80vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#0f172a" }}>Демо чат-бота</h2>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13, lineHeight: 1.55 }}>
            Без сетевых запросов и без backend RAG. Ответы статические, для демонстрации сценария навигации.
          </p>
        </div>
        <button
          type="button"
          onClick={clearSession}
          style={{
            padding: "8px 14px",
            background: "#f1f5f9",
            color: "#475569",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Новая сессия
        </button>
      </div>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
      }}>
        {DEMO_CHAT_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => send(prompt)}
            style={{
              border: "1px solid #bfdbfe",
              borderRadius: 999,
              padding: "7px 10px",
              background: "#eff6ff",
              color: "#1d4ed8",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: 12,
        background: "#f8fafc",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        marginBottom: 12,
      }}>
        {messages.map((msg) => <TestMessage key={msg.id} msg={msg} />)}
        <div ref={bottomRef} />
      </div>

      <div style={{
        display: "flex",
        gap: 8,
        padding: "10px 12px",
        background: "#f1f5f9",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
      }}>
        <textarea
          ref={inputRef}
          rows={2}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKey}
          placeholder="Напишите вопрос... Enter - отправить, Shift+Enter - новая строка"
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            fontFamily: "inherit",
            fontSize: 14,
            resize: "none",
            color: "#0f172a",
          }}
        />
        <button
          type="button"
          onClick={() => send()}
          disabled={!input.trim()}
          style={{
            padding: "0 20px",
            background: input.trim() ? "#1d4ed8" : "#cbd5e1",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontWeight: 800,
            cursor: input.trim() ? "pointer" : "default",
            fontSize: 14,
          }}
        >
          Отправить
        </button>
      </div>
    </div>
  );
}

function TestMessage({ msg }) {
  const isBot = msg.from === "bot";

  return (
    <div style={{ display: "flex", justifyContent: isBot ? "flex-start" : "flex-end", marginBottom: 12 }}>
      <div style={{
        maxWidth: "88%",
        padding: "12px 16px",
        borderRadius: isBot ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
        background: isBot ? "#fff" : "#1d4ed8",
        color: isBot ? "#0f172a" : "#fff",
        fontSize: 14,
        lineHeight: 1.55,
        whiteSpace: "pre-line",
        border: isBot ? "1px solid #e2e8f0" : "none",
        overflowWrap: "anywhere",
      }}>
        {linkifyText(msg.text, { isBot })}
      </div>
    </div>
  );
}
