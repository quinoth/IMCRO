import { useEffect, useRef, useState } from "react";
import { genId } from "./adminStore.js";
import { revokeObjectUrl } from "../../utils/objectUrls.js";

// ─── Визуальный предпросмотр блоков (читатель) ───────────────────────────────

export function BlockPreview({ block }) {
  switch (block.type) {
    case "heading": {
      const Tag = `h${Math.min(Math.max(Number(block.data.level || 2), 1), 3)}`;
      return (
        <Tag style={{ fontWeight: 800, color: "#0F172A", lineHeight: 1.2, margin: "20px 0 10px", textAlign: block.data.align || "left" }}>
          {block.data.text || block.data.title || "Заголовок"}
        </Tag>
      );
    }
    case "hero":
      return (
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0F172A", lineHeight: 1.3, marginBottom: 12 }}>{block.data.title || "Заголовок"}</h1>
          <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.7 }}>{block.data.intro}</p>
        </div>
      );
    case "paragraph":
      return block.data.html
        ? <div style={{ fontSize: 15, color: "#334155", lineHeight: 1.75, marginBottom: 18, textAlign: block.data.align || "left" }} dangerouslySetInnerHTML={{ __html: block.data.html }} />
        : <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.75, marginBottom: 18, textAlign: block.data.align || "left" }}>{block.data.text}</p>;
    case "quote":
      return (
        <blockquote style={{ borderLeft: "4px solid #19789c", paddingLeft: 20, margin: "24px 0", background: "#edf6f8", borderRadius: "0 12px 12px 0", padding: "16px 20px" }}>
          {block.data.html
            ? <div style={{ fontSize: 16, fontStyle: "italic", color: "#004f75", lineHeight: 1.6, margin: 0 }} dangerouslySetInnerHTML={{ __html: block.data.html }} />
            : <p style={{ fontSize: 16, fontStyle: "italic", color: "#004f75", lineHeight: 1.6, margin: 0 }}>«{block.data.text || ""}»</p>
          }
          {block.data.author && <cite style={{ fontSize: 13, color: "#64748B", marginTop: 8, display: "block" }}>— {block.data.author}</cite>}
        </blockquote>
      );
    case "image":
      return (
        <figure style={{ margin: "24px 0" }}>
          {block.data.url
            ? <img src={block.data.url} alt={block.data.caption} style={{ width: "100%", borderRadius: 12, objectFit: "cover", maxHeight: 400 }} />
            : <div style={{ width: "100%", height: 200, background: "#F1F5F9", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>Изображение не загружено</div>
          }
          {block.data.caption && <figcaption style={{ fontSize: 13, color: "#64748B", textAlign: "center", marginTop: 8 }}>{block.data.caption}</figcaption>}
        </figure>
      );
    case "imagetext":
      return (
        <div style={{ display: "flex", gap: 24, margin: "24px 0", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 40%", minWidth: 220 }}>
            {block.data.url
              ? <img src={block.data.url} alt="" style={{ width: "100%", borderRadius: 12, objectFit: "cover" }} />
              : <div style={{ width: "100%", height: 160, background: "#F1F5F9", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", color: "#94A3B8" }}>Фото</div>
            }
          </div>
          <div style={{ flex: 1 }}>
            {block.data.heading && <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>{block.data.heading}</h3>}
            <p style={{ fontSize: 15, color: "#334155", lineHeight: 1.7 }}>{block.data.text}</p>
          </div>
        </div>
      );
    case "list": {
      const Tag = block.data.ordered ? "ol" : "ul";
      return (
        <Tag style={{ paddingLeft: 24, margin: "16px 0", color: "#334155", fontSize: 15, lineHeight: 1.8, textAlign: block.data.align || "left" }}>
          {(block.data.items || []).map((item, i) => <li key={i}>{item}</li>)}
        </Tag>
      );
    }
    case "divider":
      return <hr style={{ border: "none", borderTop: "2px solid #E2E8F0", margin: "32px 0" }} />;
    default:
      return null;
  }
}

// ─── Редактор одного блока ────────────────────────────────────────────────────

function Field({ label, value, onChange, multiline, placeholder }) {
  const style = {
    width: "100%", padding: "8px 12px", fontSize: 14,
    border: "1.5px solid #E2E8F0", borderRadius: 8,
    outline: "none", fontFamily: "inherit", color: "#0F172A",
    background: "#F8FAFC", boxSizing: "border-box",
    transition: "border-color 0.2s",
    resize: multiline ? "vertical" : "none",
    minHeight: multiline ? 80 : "auto",
  };
  return (
    <div style={{ marginBottom: 10 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</label>}
      {multiline
        ? <textarea style={style} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} onFocus={e => e.target.style.borderColor = "#8fc4d4"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
        : <input style={style} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} onFocus={e => e.target.style.borderColor = "#8fc4d4"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
      }
    </div>
  );
}

function ImageUpload({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const previewUrlRef = useRef("");

  useEffect(() => () => {
    revokeObjectUrl(previewUrlRef.current);
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    // Показываем превью сразу через blob
    revokeObjectUrl(previewUrlRef.current);
    const blob = URL.createObjectURL(file);
    previewUrlRef.current = blob;
    onChange({ url: blob, _file: file });
    setUploading(true);

    // В реальном проекте здесь загрузка на Яндекс Cloud:
    // const formData = new FormData();
    // formData.append("file", file);
    // const res = await fetch("/api/upload", { method: "POST", body: formData });
    // const { url } = await res.json();
    // onChange({ url }); // постоянная ссылка из хранилища

    // Имитация загрузки
    setTimeout(() => {
      setUploading(false);
      // В реальности здесь заменяем blob на url из облака
    }, 1500);
  };

  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>Изображение</label>
      {value?.url && (
        <div style={{ marginBottom: 8, position: "relative" }}>
          <img src={value.url} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8 }} />
          {uploading && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 600 }}>
              Загрузка...
            </div>
          )}
        </div>
      )}
      <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#edf6f8", border: "1.5px solid #b8d4dd", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#19789c" }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v8M4 4l3-3 3 3M2 10v2a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {value?.url ? "Заменить" : "Загрузить фото"}
        <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
      </label>
    </div>
  );
}

export function BlockEditor({ block, onChange }) {
  const update = (field, val) => onChange({ ...block, data: { ...block.data, [field]: val } });

  switch (block.type) {
    case "hero":
      return (
        <>
          <Field label="Заголовок" value={block.data.title} onChange={v => update("title", v)} placeholder="Введите заголовок статьи" />
          <Field label="Вводный абзац" value={block.data.intro} onChange={v => update("intro", v)} multiline placeholder="Краткое введение..." />
        </>
      );
    case "paragraph":
      return <Field label="Текст абзаца" value={block.data.text} onChange={v => update("text", v)} multiline placeholder="Введите текст..." />;
    case "quote":
      return (
        <>
          <Field label="Текст цитаты" value={block.data.text} onChange={v => update("text", v)} multiline placeholder="Текст цитаты..." />
          <Field label="Автор (необязательно)" value={block.data.author} onChange={v => update("author", v)} placeholder="Имя, должность" />
        </>
      );
    case "image":
      return (
        <>
          <ImageUpload value={block.data} onChange={v => onChange({ ...block, data: { ...block.data, ...v } })} />
          <Field label="Подпись к фото" value={block.data.caption} onChange={v => update("caption", v)} placeholder="Необязательная подпись..." />
        </>
      );
    case "imagetext":
      return (
        <>
          <ImageUpload value={block.data} onChange={v => onChange({ ...block, data: { ...block.data, ...v } })} />
          <Field label="Заголовок справа" value={block.data.heading} onChange={v => update("heading", v)} placeholder="Необязательный заголовок" />
          <Field label="Текст справа" value={block.data.text} onChange={v => update("text", v)} multiline placeholder="Текст рядом с изображением..." />
        </>
      );
    case "list": {
      const items = block.data.items || [""];
      return (
        <>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Тип списка</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[{ val: false, label: "• Маркированный" }, { val: true, label: "1. Нумерованный" }].map(opt => (
                <button key={String(opt.val)} onClick={() => update("ordered", opt.val)}
                  style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                    borderColor: block.data.ordered === opt.val ? "#19789c" : "#E2E8F0",
                    background: block.data.ordered === opt.val ? "#edf6f8" : "#fff",
                    color: block.data.ordered === opt.val ? "#19789c" : "#64748B",
                  }}>{opt.label}</button>
              ))}
            </div>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              <input value={item} onChange={e => { const next = [...items]; next[i] = e.target.value; update("items", next); }}
                placeholder={`Пункт ${i + 1}`}
                style={{ flex: 1, padding: "8px 12px", fontSize: 14, border: "1.5px solid #E2E8F0", borderRadius: 8, outline: "none", fontFamily: "inherit", background: "#F8FAFC" }} />
              <button onClick={() => { const next = items.filter((_, j) => j !== i); update("items", next); }}
                style={{ padding: "8px 10px", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, cursor: "pointer", color: "#EF4444", fontSize: 14 }}>×</button>
            </div>
          ))}
          <button onClick={() => update("items", [...items, ""])}
            style={{ fontSize: 13, fontWeight: 600, color: "#19789c", background: "#edf6f8", border: "1.5px solid #b8d4dd", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontFamily: "inherit" }}>
            + Добавить пункт
          </button>
        </>
      );
    }
    case "divider":
      return <p style={{ fontSize: 13, color: "#94A3B8", fontStyle: "italic" }}>Горизонтальный разделитель — нет настроек</p>;
    default:
      return null;
  }
}

// ─── Конструктор блоков ───────────────────────────────────────────────────────

const BLOCK_TYPES = [
  { type: "hero",      label: "Заголовок + введение", icon: "H₁" },
  { type: "paragraph", label: "Текстовый абзац",      icon: "¶"  },
  { type: "quote",     label: "Цитата",               icon: "«»" },
  { type: "image",     label: "Изображение",          icon: "🖼"  },
  { type: "imagetext", label: "Фото + текст",         icon: "📰" },
  { type: "list",      label: "Список",               icon: "≡"  },
  { type: "divider",   label: "Разделитель",          icon: "—"  },
];

const DEFAULT_DATA = {
  hero:      { title: "", intro: "" },
  paragraph: { text: "" },
  quote:     { text: "", author: "" },
  image:     { url: "", caption: "" },
  imagetext: { url: "", heading: "", text: "" },
  list:      { ordered: false, items: [""] },
  divider:   {},
};

export function BlockConstructor({ blocks, onChange }) {
  const [activeId,    setActiveId]    = useState(null);
  const [showPicker,  setShowPicker]  = useState(false);
  const [preview,     setPreview]     = useState(false);

  const addBlock = (type) => {
    const newBlock = { id: genId(), type, data: { ...DEFAULT_DATA[type] } };
    onChange([...blocks, newBlock]);
    setActiveId(newBlock.id);
    setShowPicker(false);
  };

  const updateBlock = (updated) => {
    onChange(blocks.map(b => b.id === updated.id ? updated : b));
  };

  const removeBlock = (id) => {
    onChange(blocks.filter(b => b.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const moveBlock = (id, dir) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (dir === -1 && idx === 0) return;
    if (dir === 1 && idx === blocks.length - 1) return;
    const next = [...blocks];
    [next[idx], next[idx + dir]] = [next[idx + dir], next[idx]];
    onChange(next);
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#475569" }}>Конструктор блоков</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setPreview(v => !v)}
          style={{ padding: "6px 14px", borderRadius: 8, border: "1.5px solid", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            borderColor: preview ? "#19789c" : "#E2E8F0",
            background: preview ? "#edf6f8" : "#fff",
            color: preview ? "#19789c" : "#64748B",
          }}>
          {preview ? "← Редактор" : "Предпросмотр →"}
        </button>
      </div>

      {/* Preview mode */}
      {preview ? (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #F1F5F9", padding: "32px 40px" }}>
          {blocks.length === 0
            ? <p style={{ color: "#94A3B8", textAlign: "center", padding: "40px 0" }}>Блоков пока нет</p>
            : blocks.map(b => <BlockPreview key={b.id} block={b} />)
          }
        </div>
      ) : (
        /* Editor mode */
        <div>
          {blocks.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#94A3B8", fontSize: 14 }}>
              Добавьте первый блок чтобы начать
            </div>
          )}

          {blocks.map((block, idx) => {
            const isActive = activeId === block.id;
            const meta = BLOCK_TYPES.find(t => t.type === block.type);
            return (
              <div key={block.id} style={{
                border: `2px solid ${isActive ? "#19789c" : "#E2E8F0"}`,
                borderRadius: 12, marginBottom: 10, overflow: "hidden",
                transition: "border-color 0.15s",
              }}>
                {/* Block header */}
                <div
                  onClick={() => setActiveId(isActive ? null : block.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                    background: isActive ? "#edf6f8" : "#F8FAFC", cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <span style={{ fontSize: 16, width: 28, textAlign: "center" }}>{meta?.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#334155", flex: 1 }}>{meta?.label}</span>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>#{idx + 1}</span>

                  {/* Move buttons */}
                  <button onClick={e => { e.stopPropagation(); moveBlock(block.id, -1); }}
                    disabled={idx === 0}
                    style={{ padding: "2px 7px", border: "1px solid #E2E8F0", borderRadius: 6, background: "#fff", cursor: idx === 0 ? "default" : "pointer", fontSize: 12, opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                  <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 1); }}
                    disabled={idx === blocks.length - 1}
                    style={{ padding: "2px 7px", border: "1px solid #E2E8F0", borderRadius: 6, background: "#fff", cursor: idx === blocks.length - 1 ? "default" : "pointer", fontSize: 12, opacity: idx === blocks.length - 1 ? 0.3 : 1 }}>↓</button>

                  <button onClick={e => { e.stopPropagation(); if (window.confirm("Удалить этот блок?")) removeBlock(block.id); }}
                    style={{ padding: "2px 7px", border: "1px solid #FECACA", borderRadius: 6, background: "#FEF2F2", cursor: "pointer", color: "#EF4444", fontSize: 12 }}>✕</button>
                </div>

                {/* Block fields */}
                {isActive && (
                  <div style={{ padding: "14px 16px", background: "#fff" }}>
                    <BlockEditor block={block} onChange={updateBlock} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Add block button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowPicker(v => !v)}
              style={{
                width: "100%", padding: "12px", borderRadius: 10,
                border: "2px dashed #b8d4dd", background: "#F8FBFF",
                fontSize: 14, fontWeight: 600, color: "#19789c",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "background 0.15s",
              }}
              onMouseOver={e => e.currentTarget.style.background = "#edf6f8"}
              onMouseOut={e => e.currentTarget.style.background = "#F8FBFF"}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Добавить блок
            </button>

            {showPicker && (
              <div style={{
                position: "absolute", bottom: "calc(100% + 8px)", left: 0, right: 0,
                background: "#fff", border: "1px solid #E2E8F0", borderRadius: 14,
                padding: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 6,
                zIndex: 10,
              }}>
                {BLOCK_TYPES.map(bt => (
                  <button key={bt.type} onClick={() => addBlock(bt.type)}
                    style={{
                      padding: "10px 12px", borderRadius: 9, border: "1.5px solid #E2E8F0",
                      background: "#F8FAFC", cursor: "pointer", fontFamily: "inherit",
                      display: "flex", alignItems: "center", gap: 8,
                      fontSize: 13, fontWeight: 500, color: "#334155",
                      transition: "all 0.12s",
                    }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = "#8fc4d4"; e.currentTarget.style.background = "#edf6f8"; e.currentTarget.style.color = "#19789c"; }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.color = "#334155"; }}
                  >
                    <span style={{ fontSize: 18, width: 24, textAlign: "center" }}>{bt.icon}</span>
                    {bt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
