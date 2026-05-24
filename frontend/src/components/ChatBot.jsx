import { useEffect, useRef, useState } from "react";
import { DEMO_CHAT_PROMPTS, getDemoChatReply } from "../utils/demoChat.js";
import { linkifyText } from "../utils/chatLinks.jsx";

const INITIAL_MESSAGE = {
  id: 1,
  from: "bot",
  text:
    "Здравствуйте! Это демонстрационный чат-бот портала. Я помогу быстро найти основные разделы сайта. Backend RAG/assistant в этой версии не подключён.",
};

function Message({ msg }) {
  const isBot = msg.from === "bot";
  return (
    <div className={`chat-message ${isBot ? "is-bot" : "is-user"}`}>
      {isBot && <div className="chat-avatar" aria-hidden="true">?</div>}
      <div className="chat-bubble">{linkifyText(msg.text, { isBot })}</div>
    </div>
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text) => {
    const value = text.trim();
    if (!value) return;

    setMessages((current) => [
      ...current,
      { id: Date.now(), from: "user", text: value },
      { id: Date.now() + 1, from: "bot", text: getDemoChatReply(value) },
    ]);
    setInput("");
  };

  const clearHistory = () => {
    setMessages([{ ...INITIAL_MESSAGE, id: Date.now() }]);
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 80);
  };

  const handleKey = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      <style>{`
        .chat-window {
          position: fixed;
          right: 24px;
          bottom: 96px;
          z-index: 400;
          width: min(360px, calc(100vw - 32px));
          height: min(520px, calc(100vh - 124px));
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 18px 48px rgba(15, 23, 42, 0.18);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .chat-header {
          background: #1d4ed8;
          color: #fff;
          padding: 14px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .chat-header-title { font-size: 14px; font-weight: 800; }
        .chat-header-note { font-size: 11px; color: rgba(255,255,255,.82); }
        .chat-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,.18);
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }
        .chat-close,
        .chat-clear {
          border: 0;
          border-radius: 8px;
          color: #fff;
          background: rgba(255,255,255,.14);
          cursor: pointer;
          height: 30px;
          padding: 0 9px;
          font: inherit;
        }
        .chat-close:hover,
        .chat-clear:hover { background: rgba(255,255,255,.24); }
        .chat-body {
          flex: 1;
          overflow-y: auto;
          padding: 14px 12px 8px;
          background: #f8fafc;
        }
        .chat-message {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          min-width: 0;
        }
        .chat-message.is-user { justify-content: flex-end; }
        .chat-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #1d4ed8;
          color: #fff;
          display: grid;
          place-items: center;
          font-weight: 800;
          flex: 0 0 auto;
        }
        .chat-bubble {
          max-width: 82%;
          min-width: 0;
          padding: 10px 13px;
          border-radius: 14px;
          font-size: 13px;
          line-height: 1.55;
          white-space: pre-line;
          overflow-wrap: anywhere;
        }
        .chat-message.is-bot .chat-bubble {
          background: #fff;
          color: #0f172a;
          border: 1px solid #e2e8f0;
          border-top-left-radius: 4px;
        }
        .chat-message.is-user .chat-bubble {
          background: #1d4ed8;
          color: #fff;
          border-top-right-radius: 4px;
        }
        .chat-prompts {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0 12px 12px;
          background: #f8fafc;
        }
        .chat-prompt {
          border: 1px solid #bfdbfe;
          border-radius: 999px;
          padding: 7px 10px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .chat-prompt:hover { background: #dbeafe; }
        .chat-input-wrap {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid #e2e8f0;
          background: #fff;
        }
        .chat-input {
          flex: 1;
          min-height: 40px;
          max-height: 92px;
          resize: vertical;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 10px 12px;
          font: inherit;
          font-size: 13px;
          color: #0f172a;
        }
        .chat-input:focus {
          outline: 3px solid rgba(29, 78, 216, .22);
          border-color: #1d4ed8;
        }
        .chat-send {
          width: 40px;
          height: 40px;
          border: 0;
          border-radius: 12px;
          background: #1d4ed8;
          color: #fff;
          cursor: pointer;
          font-weight: 800;
        }
        .chat-send:disabled { background: #cbd5e1; cursor: default; }
        .chat-fab {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 400;
          width: 58px;
          height: 58px;
          border-radius: 50%;
          border: 4px solid #fff;
          background: #1d4ed8;
          color: #fff;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(29,78,216,.34);
          font-size: 24px;
          font-weight: 800;
        }
        .chat-fab:hover { transform: translateY(-2px); }
        .chat-link-bot,
        .chat-link-user {
          text-decoration: underline;
          font-weight: 700;
          overflow-wrap: anywhere;
        }
        .chat-link-bot { color: #1d4ed8; }
        .chat-link-user { color: #fff; }
        body.mky-a11y-mode .chat-window,
        body.mky-a11y-mode .chat-bubble,
        body.mky-a11y-mode .chat-input,
        body.mky-a11y-mode .chat-prompt {
          font-size: inherit;
        }
        @media (max-width: 520px) {
          .chat-window {
            right: 16px;
            bottom: 84px;
            height: min(540px, calc(100vh - 104px));
          }
          .chat-fab { right: 16px; bottom: 16px; }
        }
      `}</style>

      {open && (
        <section className="chat-window" aria-label="Демонстрационный чат-бот">
          <div className="chat-header">
            <div className="chat-icon" aria-hidden="true">?</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="chat-header-title">Демо чат-бот</div>
              <div className="chat-header-note">Frontend-only режим, без RAG-запросов</div>
            </div>
            <button className="chat-clear" type="button" onClick={clearHistory} title="Очистить историю">↺</button>
            <button className="chat-close" type="button" onClick={() => setOpen(false)} title="Закрыть">×</button>
          </div>

          <div className="chat-body">
            {messages.map((msg) => <Message key={msg.id} msg={msg} />)}
            <div ref={bottomRef} />
          </div>

          <div className="chat-prompts" aria-label="Быстрые подсказки">
            {DEMO_CHAT_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" className="chat-prompt" onClick={() => sendMessage(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <div className="chat-input-wrap">
            <textarea
              ref={inputRef}
              className="chat-input"
              rows={1}
              placeholder="Напишите вопрос..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKey}
            />
            <button className="chat-send" type="button" onClick={() => sendMessage(input)} disabled={!input.trim()} title="Отправить">
              →
            </button>
          </div>
        </section>
      )}

      <button className="chat-fab" type="button" onClick={() => setOpen((value) => !value)} title="Открыть демо чат-бот">
        {open ? "×" : "?"}
      </button>
    </>
  );
}
