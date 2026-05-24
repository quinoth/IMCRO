import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { API_BASE } from "../../constants/index.js";
import { getStoredAccessToken } from "../../utils/authHeaders.js";
import { isObjectUrl, revokeObjectUrl, revokeObjectUrls, stripObjectUrls } from "../../utils/objectUrls.js";
import { buildPendingAttachments } from "./articleAttachments.js";
import { generateSlug, genId } from "./adminStore.js";
import {
  ARCHIV_SECTIONS,
  DEYATELNOST_SECTIONS,
  DOMU_SECTIONS,
  KONKURSY_SECTIONS,
  METHODIKA_SECTIONS,
  METHODIKA_SUBJECTS,
  NOKO_SECTIONS,
  ROOT_SECTIONS,
  resolveArticleLocation,
  resolveArticleSectionLabel,
} from "./articleTaxonomy.js";

const STATUS_LABELS = { published: "Опубликовано", draft: "Черновик", scheduled: "Запланировано", archive: "Архив" };
const SCOPE_LABELS = {
  imcro_only: "Основные новости",
  dom_uchitelya_only: "Дом учителя",
  both: "Оба",
};
const ATTACHMENT_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const BLOCK_TYPES = [
  { type: "paragraph", label: "Текст", hint: "Обычный абзац", icon: "T" },
  { type: "heading", label: "Заголовок", hint: "Раздел статьи", icon: "H" },
  { type: "list", label: "Список", hint: "Пункты или шаги", icon: "≡" },
  { type: "image", label: "Изображение", hint: "Фото с подписью", icon: "▧" },
  { type: "quote", label: "Цитата", hint: "Выделенная мысль", icon: "“”" },
  { type: "divider", label: "Разделитель", hint: "Пауза между блоками", icon: "—" },
];

const EMPTY_ARTICLE = {
  title: "",
  slug: "",
  status: "draft",
  lead: "",
  body: "",
  blocks: [],
  attachments: [],
  cover_image_url: "",
  published_at: "",
  is_pinned: false,
  duplicate_to_main: false,
  duplicate_to_events: false,
  publishing_scope: "imcro_only",
  tags: [],
  methodika_subject: "",
  dom_uchitelya_section: "",
  noko_section: "",
  hub_kind: "",
  hub_path: "",
};

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(",", ",");
}

function fromDateInputValue(value) {
  if (!value) return null;
  const ruDate = String(value).trim().match(/^(\d{2})\.(\d{2})\.(\d{4}),?\s+(\d{2}):(\d{2})$/);
  if (ruDate) {
    const [, day, month, year, hour, minute] = ruDate;
    const parsed = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute));
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function formatDateRu(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).replace(",", ",");
}

function getArticleStatusLabel(article) {
  const publishDate = Date.parse(article.published_at || article.publishedAt || "");
  if (article.status === "scheduled" || (article.status === "published" && publishDate && publishDate > Date.now())) {
    return STATUS_LABELS.scheduled;
  }
  return STATUS_LABELS[article.status] || article.status || STATUS_LABELS.draft;
}

function defaultBlock(type = "paragraph") {
  const base = { id: genId(), type, data: {} };
  if (type === "heading") return { ...base, data: { text: "", level: 2, align: "left" } };
  if (type === "list") return { ...base, data: { ordered: false, items: [""], align: "left" } };
  if (type === "image") return { ...base, data: { url: "", caption: "" } };
  if (type === "quote") return { ...base, data: { html: "", author: "" } };
  if (type === "divider") return base;
  return { ...base, data: { html: "", align: "left" } };
}

function normalizeBlock(block) {
  if (!block || typeof block !== "object") return defaultBlock();
  const align = ["left", "center", "right", "justify"].includes(block.data?.align) ? block.data.align : "left";
  if (block.type === "hero") return { id: block.id || genId(), type: "heading", data: { text: block.data?.title || "", level: 1, align } };
  if (block.type === "paragraph") return { id: block.id || genId(), type: "paragraph", data: { html: block.data?.html || block.data?.text || "", align } };
  if (block.type === "heading") return { id: block.id || genId(), type: "heading", data: { text: block.data?.text || block.data?.title || "", level: Number(block.data?.level || 2), align } };
  if (block.type === "list") return { id: block.id || genId(), type: "list", data: { ordered: Boolean(block.data?.ordered), items: Array.isArray(block.data?.items) ? block.data.items : [""], align } };
  if (block.type === "image") return { id: block.id || genId(), type: "image", data: { url: block.data?.url || "", caption: block.data?.caption || "" } };
  if (block.type === "quote") return { id: block.id || genId(), type: "quote", data: { html: block.data?.html || block.data?.text || "", author: block.data?.author || "" } };
  if (block.type === "divider") return { id: block.id || genId(), type: "divider", data: {} };
  return defaultBlock();
}

function parseBodyBlocks(article) {
  if (Array.isArray(article.blocks) && article.blocks.length) return article.blocks.map(normalizeBlock);
  if (typeof article.body === "string" && article.body.trim()) {
    try {
      const parsed = JSON.parse(article.body);
      if (Array.isArray(parsed)) return parsed.map(normalizeBlock);
    } catch {
      return [{ ...defaultBlock("paragraph"), data: { html: article.body } }];
    }
  }
  return [];
}

function normalizeArticle(article, defaultScope) {
  const blocks = parseBodyBlocks(article);
  const firstParagraph = blocks.find((block) => block.type === "paragraph");
  const firstImage = blocks.find((block) => block.type === "image");
  return {
    ...EMPTY_ARTICLE,
    ...article,
    lead: article.lead ?? article.excerpt ?? "",
    blocks,
    body: typeof article.body === "string" ? article.body : JSON.stringify(blocks),
    attachments: Array.isArray(article.attachments) ? article.attachments : [],
    cover_image_url: article.cover_image_url ?? article.image ?? firstImage?.data?.url ?? "",
    published_at: toDateInputValue(article.published_at ?? article.publishedAt),
    publishing_scope: article.publishing_scope || defaultScope,
    tags: Array.isArray(article.tags) ? article.tags : [],
    methodika_subject: article.methodika_subject || "",
    dom_uchitelya_section: article.dom_uchitelya_section || "",
    noko_section: article.noko_section || "",
    hub_kind: article.hub_kind || "",
    hub_path: article.hub_path || "",
    is_pinned: Boolean(article.is_pinned),
    duplicate_to_main: Boolean(article.duplicate_to_main || isHomePlacement(article)),
    duplicate_to_events: Boolean(article.duplicate_to_events),
    _firstParagraph: firstParagraph?.data?.html || "",
  };
}

function plainTextFromBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.type === "heading") return block.data.text || "";
      if (block.type === "list") return (block.data.items || []).join(" ");
      return String(block.data.html || block.data.caption || "").replace(/<[^>]*>/g, " ");
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function getRootSection(article) {
  if (article.dom_uchitelya_section) return "domu";
  if (article.noko_section) return "noko";
  if (article.methodika_subject || article.hub_kind === "methodika") return "methodika";
  if (article.hub_kind === "konkursy") return "konkursy";
  if (article.hub_kind === "deyatelnost") return "deyatelnost";
  if (article.hub_kind === "archiv") return "archiv";
  return "home";
}

function getCategoryLabel(article) {
  return resolveArticleSectionLabel(article, { forceNews: Boolean(article.duplicate_to_main) });
}

function getPlacementLabels(article) {
  const labels = [];
  if (article.duplicate_to_main || isHomePlacement(article)) labels.push("Главная страница");
  if (article.duplicate_to_events) labels.push("Мероприятия");
  const location = resolveArticleLocation(article);
  labels.push(location.sectionLabel || getCategoryLabel(article));
  return labels;
}

function getAuthorLabel(article) {
  return article.author || article.author_name || (article.author_id ? `Автор #${article.author_id}` : "Не указан");
}

function getUserFullName(user) {
  const fio = [user?.lastName, user?.firstName, user?.middleName].filter(Boolean).join(" ");
  return user?.full_name || user?.fullName || fio || user?.author_name || user?.email || "Редакция ИМЦРО";
}

function isHomePlacement(article) {
  return !article.methodika_subject && !article.dom_uchitelya_section && !article.noko_section && !article.hub_kind;
}

function sectionPinKey(article) {
  if (article.dom_uchitelya_section) return `domu:${article.dom_uchitelya_section}`;
  if (article.methodika_subject) return `methodika_subject:${article.methodika_subject}`;
  if (article.hub_kind === "methodika" && article.hub_path) return `methodika_section:${article.hub_path}`;
  if (article.noko_section) return `noko:${article.noko_section}`;
  if (article.hub_kind && article.hub_path) return `${article.hub_kind}:${article.hub_path}`;
  if (article.hub_kind) return `${article.hub_kind}:root`;
  return "home";
}

function pinTargets(article) {
  const keys = new Set([`section:${sectionPinKey(article)}`]);
  if (article.duplicate_to_main || isHomePlacement(article)) keys.add("main_news");
  if (article.duplicate_to_events) keys.add("events");
  return keys;
}

function makeUniqueSlug(value, articles = [], currentId = null) {
  const base = (generateSlug(value) || "article").slice(0, 150);
  const used = new Set(
    articles
      .filter((article) => String(article.id) !== String(currentId || ""))
      .map((article) => article.slug)
      .filter(Boolean),
  );
  if (!used.has(base)) return base;
  let counter = 2;
  let candidate = `${base}-${counter}`;
  while (used.has(candidate)) {
    counter += 1;
    candidate = `${base.slice(0, 160 - String(counter).length - 1)}-${counter}`;
  }
  return candidate;
}

function toPayload(form, nextStatus = form.status, scheduleEnabled = Boolean(form.published_at), articles = [], currentId = null) {
  const lead = form.lead.trim();
  const cover = form.cover_image_url.trim();
  const blocks = (form.blocks || []).map(normalizeBlock);
  const publishedAt = nextStatus === "published"
    ? (scheduleEnabled ? fromDateInputValue(form.published_at) : new Date().toISOString())
    : fromDateInputValue(form.published_at);
  const slug = makeUniqueSlug(form.slug.trim() || form.title, articles, currentId);
  return {
    title: form.title.trim(),
    slug,
    status: nextStatus,
    lead,
    excerpt: lead,
    body: JSON.stringify(blocks),
    blocks,
    cover_image_url: cover || null,
    image: cover || null,
    published_at: publishedAt,
    is_pinned: Boolean(form.is_pinned),
    duplicate_to_main: Boolean(form.duplicate_to_main),
    duplicate_to_events: Boolean(form.duplicate_to_events),
    attachments: form.attachments || [],
    publishing_scope: form.publishing_scope,
    tags: form.tags || [],
    categories: form.categories || [],
    methodika_subject: form.methodika_subject || null,
    dom_uchitelya_section: form.dom_uchitelya_section || null,
    noko_section: form.noko_section || null,
    hub_kind: form.hub_kind || null,
    hub_path: form.hub_path || null,
  };
}

function sortArticles(items) {
  return [...items].sort((left, right) => {
    if (Boolean(left.is_pinned) !== Boolean(right.is_pinned)) return left.is_pinned ? -1 : 1;
    const leftDate = Date.parse(left.published_at || left.updated_at || left.updatedAt || left.created_at || left.createdAt || "");
    const rightDate = Date.parse(right.published_at || right.updated_at || right.updatedAt || right.created_at || right.createdAt || "");
    return (Number.isNaN(rightDate) ? 0 : rightDate) - (Number.isNaN(leftDate) ? 0 : leftDate);
  });
}

function ChipInput({ value, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const tag = input.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInput("");
  };
  return (
    <div className="article-chipbox">
      {value.map((tag) => (
        <span className="article-chip" key={tag}>
          #{tag}
          <button type="button" onClick={() => onChange(value.filter((item) => item !== tag))} aria-label={`Убрать тег ${tag}`}>×</button>
        </span>
      ))}
      <input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={value.length ? "Добавить тег" : "Добавьте теги"}
      />
    </div>
  );
}

function InfoNote({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="article-info-note">
      <button
        type="button"
        className="article-info-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span className="article-info-icon" aria-hidden="true">?</span>
        <span>{title || "Подсказка"}</span>
      </button>
      {open && <p>{children}</p>}
    </div>
  );
}

function RichText({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const savedRangeRef = useRef(null);
  const [fontSize, setFontSize] = useState(22);
  const [fontSizeStatus, setFontSizeStatus] = useState("выделите текст");
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
  }, [value]);
  const getTextNodes = (root) => {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.textContent.trim()) nodes.push(node);
      node = walker.nextNode();
    }
    return nodes;
  };
  const updateFontSizeState = (range) => {
    if (!range || !ref.current) return;
    const sizes = new Set();
    getTextNodes(ref.current).forEach((node) => {
      if (!range.intersectsNode(node)) return;
      const parent = node.parentElement;
      if (!parent) return;
      sizes.add(Math.round(parseFloat(window.getComputedStyle(parent).fontSize)));
    });
    if (sizes.size === 1) {
      const [size] = [...sizes];
      setFontSize(size);
      setFontSizeStatus(`${size}px`);
    } else if (sizes.size > 1) {
      setFontSizeStatus("разный размер");
    }
  };
  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    if (ref.current?.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
      updateFontSizeState(range);
    }
  };
  const command = (name, arg = null) => {
    ref.current?.focus();
    document.execCommand(name, false, arg);
    onChange(ref.current?.innerHTML || "");
    saveSelection();
  };
  const stripNestedFontSizes = (root) => {
    root.querySelectorAll?.("[data-font-size-span], span, font").forEach((element) => {
      element.style?.removeProperty("font-size");
      element.style?.removeProperty("line-height");
      element.removeAttribute?.("size");
      element.removeAttribute?.("data-font-size-span");
    });
  };
  const applyFontSize = (size) => {
    ref.current?.focus();
    const selection = window.getSelection();
    const liveRange = selection && selection.rangeCount > 0 && !selection.isCollapsed ? selection.getRangeAt(0) : null;
    const range = liveRange || savedRangeRef.current;
    if (!range || range.collapsed) return;
    if (!ref.current?.contains(range.commonAncestorContainer)) return;
    const nextRange = range.cloneRange();
    const ancestor = nextRange.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
      ? nextRange.commonAncestorContainer
      : nextRange.commonAncestorContainer.parentElement;
    const existingSpan = ancestor?.closest?.("[data-font-size-span='true']");
    if (existingSpan && existingSpan.textContent === nextRange.toString()) {
      existingSpan.style.fontSize = `${size}px`;
      existingSpan.style.lineHeight = "1.2";
      const updatedRange = document.createRange();
      updatedRange.selectNodeContents(existingSpan);
      selection.removeAllRanges();
      selection.addRange(updatedRange);
      savedRangeRef.current = updatedRange.cloneRange();
      setFontSizeStatus(`${size}px`);
      onChange(ref.current?.innerHTML || "");
      return;
    }
    const span = document.createElement("span");
    span.dataset.fontSizeSpan = "true";
    span.style.fontSize = `${size}px`;
    span.style.lineHeight = "1.2";
    const fragment = nextRange.extractContents();
    stripNestedFontSizes(fragment);
    span.appendChild(fragment);
    nextRange.insertNode(span);
    nextRange.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(nextRange);
    savedRangeRef.current = nextRange.cloneRange();
    setFontSizeStatus(`${size}px`);
    onChange(ref.current?.innerHTML || "");
  };
  const addLink = () => {
    const href = window.prompt("Введите ссылку");
    if (href) command("createLink", href);
  };
  return (
    <div className="block-rich">
      <div className="block-rich-toolbar" aria-label="Форматирование текста">
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => command("bold")} title="Жирный">B</button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => command("italic")} title="Курсив">I</button>
        <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={addLink} title="Ссылка">↗</button>
        <div className="font-size-control" onMouseDown={saveSelection}>
          <input
            type="range"
            min="12"
            max="48"
            step="1"
            value={fontSize}
            onChange={(event) => {
              const size = Number(event.target.value);
              setFontSize(size);
              applyFontSize(size);
            }}
            aria-label="Размер шрифта"
          />
          <input
            type="number"
            min="10"
            max="72"
            value={fontSize}
            onChange={(event) => {
              const size = Math.max(10, Math.min(72, Number(event.target.value) || 22));
              setFontSize(size);
              applyFontSize(size);
            }}
            aria-label="Размер шрифта в пикселях"
          />
          <span className="font-size-status">{fontSizeStatus}</span>
        </div>
      </div>
      <div
        ref={ref}
        className="block-rich-area"
        contentEditable
        role="textbox"
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onPaste={(event) => {
          event.preventDefault();
          const text = event.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
        }}
      />
    </div>
  );
}

const ALIGN_OPTIONS = [
  { value: "left", label: "⇤", title: "По левому краю" },
  { value: "center", label: "≡", title: "По центру" },
  { value: "right", label: "⇥", title: "По правому краю" },
  { value: "justify", label: "☰", title: "По ширине" },
];

function AlignControl({ value = "left", onChange }) {
  return (
    <div className="align-control" aria-label="Выравнивание текста">
      {ALIGN_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          className={value === option.value ? "is-active" : ""}
          onClick={() => onChange(option.value)}
          title={option.title}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function BlockPreview({ block }) {
  if (block.type === "heading") {
    const Tag = `h${Math.min(Math.max(Number(block.data.level || 2), 1), 3)}`;
    return <Tag className="preview-heading" style={{ textAlign: block.data.align || "left" }}>{block.data.text || "Заголовок"}</Tag>;
  }
  if (block.type === "paragraph") return <div className="preview-paragraph" style={{ textAlign: block.data.align || "left" }} dangerouslySetInnerHTML={{ __html: block.data.html || "" }} />;
  if (block.type === "quote") {
    return (
      <blockquote className="preview-quote">
        <div dangerouslySetInnerHTML={{ __html: block.data.html || "" }} />
        {block.data.author && <cite>{block.data.author}</cite>}
      </blockquote>
    );
  }
  if (block.type === "list") {
    const Tag = block.data.ordered ? "ol" : "ul";
    return <Tag className="preview-list" style={{ textAlign: block.data.align || "left" }}>{(block.data.items || []).filter(Boolean).map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</Tag>;
  }
  if (block.type === "image") {
    return (
      <figure className="preview-image">
        {block.data.url ? <img src={block.data.url} alt={block.data.caption || ""} /> : <div>Изображение не загружено</div>}
        {block.data.caption && <figcaption>{block.data.caption}</figcaption>}
      </figure>
    );
  }
  if (block.type === "divider") return <hr className="preview-divider" />;
  return null;
}

function BlockEditor({ block, onChange, onRemove, onMove, index, count, uploadImage, createObjectUrl, moving, dragging, dragOver, onDragStartBlock, onDragOverBlock, onDragEndBlock }) {
  const updateData = (data) => onChange({ ...block, data: { ...block.data, ...data } });
  const handleImageFile = async (file) => {
    if (!file) return;
    updateData({ url: createObjectUrl(file) });
    const uploaded = await uploadImage(file);
    if (uploaded) updateData({ url: uploaded });
  };
  return (
    <article
      className={`block-card${moving ? " is-moving" : ""}${dragging ? " is-dragging" : ""}${dragOver ? " is-drag-over" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const placement = event.clientY > rect.top + rect.height / 2 ? "after" : "before";
        onDragOverBlock(block.id, placement);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onDragEndBlock();
      }}
      onDragEnd={onDragEndBlock}
    >
      <div className="block-handle" aria-label={`Блок ${index + 1}`}>
        <span
          className="drag-grip"
          draggable
          title="Перетащить блок"
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", block.id);
            onDragStartBlock(block.id);
          }}
          onDragEnd={onDragEndBlock}
        >
          ::
        </span>
        <strong>{BLOCK_TYPES.find((item) => item.type === block.type)?.label}</strong>
        <div />
        <button type="button" onClick={() => onMove(block.id, null, -1)} disabled={index === 0} aria-label="Переместить выше">↑</button>
        <button type="button" onClick={() => onMove(block.id, null, 1)} disabled={index === count - 1} aria-label="Переместить ниже">↓</button>
        <button type="button" className="danger" onClick={() => onRemove(block.id)} aria-label="Удалить блок">×</button>
      </div>
      <div className="block-body">
        {block.type === "heading" && (
          <>
            <AlignControl value={block.data.align || "left"} onChange={(align) => updateData({ align })} />
            <div className="block-grid-compact">
              <select value={block.data.level || 2} onChange={(event) => updateData({ level: Number(event.target.value) })}>
                <option value={1}>H1</option>
                <option value={2}>H2</option>
                <option value={3}>H3</option>
              </select>
              <input value={block.data.text || ""} onChange={(event) => updateData({ text: event.target.value })} placeholder="Заголовок раздела" />
            </div>
          </>
        )}
        {block.type === "paragraph" && (
          <>
            <AlignControl value={block.data.align || "left"} onChange={(align) => updateData({ align })} />
            <RichText value={block.data.html || ""} onChange={(html) => updateData({ html })} placeholder="Введите текст. Можно выделить фрагмент и нажать B, I или ссылку." />
          </>
        )}
        {block.type === "quote" && (
          <>
            <RichText value={block.data.html || ""} onChange={(html) => updateData({ html })} placeholder="Текст цитаты" />
            <input value={block.data.author || ""} onChange={(event) => updateData({ author: event.target.value })} placeholder="Автор или источник" />
          </>
        )}
        {block.type === "list" && (
          <>
            <AlignControl value={block.data.align || "left"} onChange={(align) => updateData({ align })} />
            <label className="article-check compact">
              <input type="checkbox" checked={Boolean(block.data.ordered)} onChange={(event) => updateData({ ordered: event.target.checked })} />
              <span>Нумерованный список</span>
            </label>
            {(block.data.items || [""]).map((item, itemIndex) => (
              <div className="list-row" key={itemIndex}>
                <input
                  value={item}
                  onChange={(event) => {
                    const items = [...(block.data.items || [""])];
                    items[itemIndex] = event.target.value;
                    updateData({ items });
                  }}
                  placeholder={`Пункт ${itemIndex + 1}`}
                />
                <button type="button" onClick={() => updateData({ items: (block.data.items || []).filter((_, indexToRemove) => indexToRemove !== itemIndex) })}>×</button>
              </div>
            ))}
            <button type="button" className="mini-add" onClick={() => updateData({ items: [...(block.data.items || []), ""] })}>Добавить пункт</button>
          </>
        )}
        {block.type === "image" && (
          <div
            className="image-drop"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handleImageFile(event.dataTransfer.files?.[0]);
            }}
          >
            {block.data.url ? <img src={block.data.url} alt="" /> : <div>Перетащите изображение сюда</div>}
            <label>
              Загрузить изображение
              <input type="file" accept="image/*" onChange={(event) => handleImageFile(event.target.files?.[0])} />
            </label>
            <input value={block.data.url || ""} onChange={(event) => updateData({ url: event.target.value })} placeholder="/static/articles/covers/image.jpg" />
            <input value={block.data.caption || ""} onChange={(event) => updateData({ caption: event.target.value })} placeholder="Подпись к изображению" />
          </div>
        )}
        {block.type === "divider" && <div className="divider-editor">Разделитель появится как горизонтальная линия в статье.</div>}
      </div>
    </article>
  );
}

function BlockWorkspace({ blocks, onChange, uploadImage, createObjectUrl }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [movingId, setMovingId] = useState("");
  const [draggingId, setDraggingId] = useState("");
  const [dragOverId, setDragOverId] = useState("");
  const lastHoverRef = useRef("");
  const addBlock = (type) => {
    onChange([...blocks, defaultBlock(type)]);
    setPickerOpen(false);
  };
  const updateBlock = (block) => onChange(blocks.map((item) => item.id === block.id ? block : item));
  const removeBlock = (id) => {
    if (!window.confirm("Удалить этот блок из статьи?")) return;
    onChange(blocks.filter((item) => item.id !== id));
  };
  const moveBlock = (draggedId, targetId = null, direction = 0, placement = "before") => {
    const currentIndex = blocks.findIndex((item) => item.id === draggedId);
    if (currentIndex < 0) return;
    const next = [...blocks];
    const [item] = next.splice(currentIndex, 1);
    if (direction) {
      const targetIndex = Math.max(0, Math.min(blocks.length - 1, currentIndex + direction));
      next.splice(targetIndex, 0, item);
    } else {
      const targetIndex = next.findIndex((entry) => entry.id === targetId);
      if (targetIndex < 0) {
        next.push(item);
      } else {
        next.splice(placement === "after" ? targetIndex + 1 : targetIndex, 0, item);
      }
    }
    if (next.map((entry) => entry.id).join("|") === blocks.map((entry) => entry.id).join("|")) return;
    setMovingId(draggedId);
    window.setTimeout(() => setMovingId(""), 260);
    onChange(next);
  };
  const handleDragOverBlock = (targetId, placement) => {
    if (!draggingId || draggingId === targetId) return;
    const hoverKey = `${draggingId}:${targetId}:${placement}`;
    if (lastHoverRef.current === hoverKey) return;
    lastHoverRef.current = hoverKey;
    setDragOverId(targetId);
    moveBlock(draggingId, targetId, 0, placement);
  };
  const endBlockDrag = () => {
    setDraggingId("");
    setDragOverId("");
    lastHoverRef.current = "";
  };
  const addDroppedImage = async (file) => {
    if (!file?.type?.startsWith("image/")) return;
    const block = defaultBlock("image");
    block.data.url = createObjectUrl(file);
    onChange([...blocks, block]);
    const url = await uploadImage(file);
    if (url) onChange([...blocks, { ...block, data: { ...block.data, url } }]);
  };
  return (
    <section
      className="block-workspace"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        if (event.dataTransfer.files?.length) {
          event.preventDefault();
          addDroppedImage(event.dataTransfer.files[0]);
        }
      }}
    >
      <div className="block-toolbar">
        <div>
          <span>Тело статьи</span>
          <strong>{blocks.length} блоков</strong>
        </div>
        <button type="button" onClick={() => setPickerOpen((value) => !value)}>Добавить блок</button>
      </div>
      <InfoNote title="Работа с блоками">
        Добавьте нужный тип блока, заполните поля и меняйте порядок стрелками или перетаскиванием за значок «::». Удаление блока нужно подтвердить.
      </InfoNote>
      {pickerOpen && (
        <div className="block-picker">
          {BLOCK_TYPES.map((blockType) => (
            <button type="button" key={blockType.type} onClick={() => addBlock(blockType.type)}>
              <span>{blockType.icon}</span>
              <strong>{blockType.label}</strong>
              <small>{blockType.hint}</small>
            </button>
          ))}
        </div>
      )}
      {!blocks.length && (
        <button
          type="button"
          className="block-empty"
          onClick={() => setPickerOpen(true)}
        >
          <strong>Начните с первого блока</strong>
          <span>Добавьте текст, заголовок или просто перетащите сюда изображение.</span>
        </button>
      )}
      {blocks.map((block, index) => (
        <BlockEditor
          key={block.id}
          block={block}
          index={index}
          count={blocks.length}
          onChange={updateBlock}
          onRemove={removeBlock}
          onMove={moveBlock}
          uploadImage={uploadImage}
          createObjectUrl={createObjectUrl}
          moving={movingId === block.id}
          dragging={draggingId === block.id}
          dragOver={dragOverId === block.id}
          onDragStartBlock={setDraggingId}
          onDragOverBlock={handleDragOverBlock}
          onDragEndBlock={endBlockDrag}
        />
      ))}
    </section>
  );
}

function ArticlePreviewModal({ article, onClose }) {
  return (
    <div className="preview-modal" role="dialog" aria-modal="true" aria-label="Предпросмотр статьи">
      <div className="preview-modal-panel">
        <div className="preview-modal-head">
          <strong>Предпросмотр статьи</strong>
          <button type="button" onClick={onClose}>Закрыть</button>
        </div>
        <ArticlePreviewV2 article={article} expanded />
      </div>
    </div>
  );
}

function ArticlePreview({ article, expanded = false }) {
  const title = article.title.trim() || "Заголовок статьи";
  const lead = article.lead.trim() || "Лид появится здесь и поможет читателю понять, о чем материал.";
  const date = article.published_at ? new Date(article.published_at).toLocaleString("ru-RU") : "Дата публикации не выбрана";
  return (
    <aside className={expanded ? "article-preview expanded" : "article-preview"} aria-label="Предпросмотр статьи">
      <section className="article-preview-card">
        {article.cover_image_url ? <img src={article.cover_image_url} alt="" /> : <div className="article-preview-image">Обложка</div>}
        <div className="article-preview-meta">
          <span>{SCOPE_LABELS[article.publishing_scope]}</span>
          <span>{date}</span>
          {article.is_pinned && <span>Закреплена</span>}
        </div>
        <h1>{title}</h1>
        <p>{lead}</p>
        <div className="block-preview-stack">
          {(article.blocks || []).length
            ? article.blocks.map((block) => <BlockPreview key={block.id} block={block} />)
            : <div className="article-preview-empty">Добавьте блоки, чтобы увидеть статью.</div>
          }
        </div>
        {Boolean(article.attachments?.length) && (
          <div className="article-attachments-preview">
            <strong>Файлы к статье</strong>
            {article.attachments.map((file) => (
              <a key={file.url || file.name} href={file.url} target="_blank" rel="noreferrer">
                {file.name || "Документ"}{file.type ? ` · ${file.type}` : ""}
              </a>
            ))}
          </div>
        )}
      </section>
      <section className="seo-preview">
        <div className="seo-title">{title}</div>
        <div className="seo-url">imcro.ru/news/{article.slug || "slug-materiala"}</div>
        <p>{lead.slice(0, 160)}</p>
      </section>
      <section className="feed-preview">
        <strong>Карточка в ленте</strong>
        <div>{article.is_pinned ? "Закрепленная новость" : "Обычная новость"}</div>
        <p>{title}</p>
      </section>
    </aside>
  );
}

function ArticlePreviewV2({ article, expanded = false }) {
  const title = article.title.trim() || "Заголовок статьи";
  const lead = article.lead.trim() || "Лид появится здесь и поможет читателю понять, о чем материал.";
  const date = article.published_at ? new Date(article.published_at).toLocaleString("ru-RU") : "Дата публикации не выбрана";
  const sectionLabel = getCategoryLabel(article);
  const location = resolveArticleLocation(article);
  const breadcrumbs = [
    "Главная",
    location.parentLabel,
    location.sectionLabel,
    title,
  ].filter(Boolean);
  return (
    <aside className={expanded ? "article-preview expanded" : "article-preview"} aria-label="Предпросмотр статьи">
      <section className="article-preview-card article-real-preview">
        <nav className="article-preview-breadcrumb" aria-label="Навигация предпросмотра">
          {breadcrumbs.map((crumb, index) => (
            <span key={`${crumb}-${index}`}>{index > 0 && <b>→</b>}{crumb}</span>
          ))}
        </nav>
        {article.cover_image_url ? (
          <div className="article-preview-hero">
            <img src={article.cover_image_url} alt="" />
            {article.is_pinned && (
              <span className="article-preview-pin" aria-label="Закреплённая статья">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M14.8 3.2 20.8 9.2 18.7 11.3 17.3 9.9 13.4 13.8 13.8 18.6 12.4 20 8.8 16.4 4.7 20.5 3.5 19.3 7.6 15.2 4 11.6 5.4 10.2 10.2 10.6 14.1 6.7 12.7 5.3 14.8 3.2Z" />
                </svg>
              </span>
            )}
          </div>
        ) : (
          <div className="article-preview-image">Обложка</div>
        )}
        <div className="article-preview-content-card">
          <div className="article-preview-meta">
            <span>{sectionLabel}</span>
            <span>{date}</span>
            {article.author && <span>{article.author}</span>}
          </div>
          <h1>{title}</h1>
          <p>{lead}</p>
          <div className="block-preview-stack">
            {(article.blocks || []).length
              ? article.blocks.map((block) => <BlockPreview key={block.id} block={block} />)
              : <div className="article-preview-empty">Добавьте блоки, чтобы увидеть статью.</div>
            }
          </div>
          {Boolean(article.attachments?.length) && (
            <div className="article-attachments-preview">
              <strong>Файлы к статье</strong>
              {article.attachments.map((file) => (
                <a key={file.url || file.name} href={file.url} target="_blank" rel="noreferrer">
                  {file.name || "Документ"}{file.type ? ` · ${file.type}` : ""}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </aside>
  );
}

function isArticleOwner(article, currentUser) {
  if (!currentUser?.id) return false;
  return String(article.author_id || "") === String(currentUser.id);
}

function filterArticlesForRole(items, currentUser, isDomuMode) {
  const role = currentUser?.role?.role_name || currentUser?.role || "user";
  return items.filter((article) => {
    if (isDomuMode) {
      const isDomuArticle = ["both", "dom_uchitelya_only"].includes(article.publishing_scope || "imcro_only") && Boolean(article.dom_uchitelya_section);
      if (!isDomuArticle) return false;
    }
    if (role === "admin") return true;
    if (role === "methodist" || role === "domu_editor") return isArticleOwner(article, currentUser);
    return false;
  });
}

function ValidationPanel({ errors, modeLabel }) {
  if (!errors.length) return null;
  return (
    <div className="article-errors" role="alert">
      <strong>Проверьте поля перед сохранением{modeLabel ? ` для раздела ${modeLabel}` : ""}</strong>
      {errors.map((error) => <div key={error}>{error}</div>)}
    </div>
  );
}

function ArticleCardPreview({ article }) {
  const title = article.title.trim() || "Заголовок статьи";
  const lead = article.lead.trim() || "Краткое описание появится здесь после заполнения лида.";
  const date = article.published_at ? new Date(article.published_at).toLocaleDateString("ru-RU") : "Дата не выбрана";
  const sectionLabel = getCategoryLabel(article);
  const author = article.author || "Редакция ИМЦРО";

  return (
    <section className="article-card-preview" aria-label="Предпросмотр карточки статьи">
      {article.cover_image_url ? (
        <img src={article.cover_image_url} alt="" />
      ) : (
        <div className="article-card-preview-image">Обложка статьи</div>
      )}
      <div className="article-card-preview-body">
        <div className="article-card-preview-meta">
          <span>{sectionLabel}</span>
          <span>{date}</span>
          <span>{author}</span>
        </div>
        <h3>{title}</h3>
        <p>{lead}</p>
        <span className="article-card-preview-link">Читать далее</span>
      </div>
    </section>
  );
}

function ArticleForm({
  article,
  currentUser,
  allowedScopes,
  defaultScope,
  articles,
  uploadCover,
  uploadAttachment,
  onSave,
  onCancel,
  isDomuMode,
  apiMode,
}) {
  const isNew = !article?.id;
  const [form, setForm] = useState(() => normalizeArticle(article || { publishing_scope: defaultScope }, defaultScope));
  const [slugLocked, setSlugLocked] = useState(Boolean(article?.slug));
  const [saving, setSaving] = useState(false);
  const [draftNotice, setDraftNotice] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [coverDragActive, setCoverDragActive] = useState(false);
  const [attachmentDragActive, setAttachmentDragActive] = useState(false);
  const [rootSection, setRootSection] = useState(() => isDomuMode ? "domu" : getRootSection(normalizeArticle(article || { publishing_scope: defaultScope }, defaultScope)));
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const formRef = useRef(form);
  const objectUrlsRef = useRef([]);
  const draftKey = `mky_article_block_draft_${article?.id || "new"}_${isDomuMode ? "domu" : "common"}`;
  const role = currentUser?.role?.role_name || currentUser?.role || "user";
  const currentAuthorName = getUserFullName(currentUser);
  const canDuplicateMain = role === "admin" || role === "methodist" || role === "metodist_editor";
  const previewArticle = useMemo(() => {
    const authorName = form.author || form.author_name || form.full_name || currentAuthorName;
    return { ...form, author: authorName, author_name: authorName, full_name: authorName, author_id: form.author_id || currentUser?.id || null };
  }, [currentAuthorName, currentUser?.id, form]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => () => {
    revokeObjectUrls(formRef.current);
    objectUrlsRef.current.forEach(revokeObjectUrl);
    objectUrlsRef.current = [];
  }, []);

  const createLocalObjectUrl = useCallback((file) => {
    const url = URL.createObjectURL(file);
    objectUrlsRef.current.push(url);
    return url;
  }, []);
  const allowedSubjects = role === "methodist" && Array.isArray(currentUser?.allowed_methodika_subjects) && currentUser.allowed_methodika_subjects.length
    ? METHODIKA_SUBJECTS.filter((subject) => currentUser.allowed_methodika_subjects.includes(subject))
    : METHODIKA_SUBJECTS;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      if (window.sessionStorage.getItem(`${draftKey}_seen`) === "1") return;
      const draft = JSON.parse(raw);
      const serverTime = Date.parse(article?.updated_at || article?.updatedAt || 0);
      if (Date.parse(draft.savedAt || 0) > serverTime && draft.form && JSON.stringify(draft.form) !== JSON.stringify(form)) {
        setDraftNotice("Найден локальный черновик.");
        window.sessionStorage.setItem(`${draftKey}_seen`, "1");
      }
    } catch {
      setDraftNotice("");
    }
  }, [article?.id, article?.updated_at, article?.updatedAt, draftKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (!form.title.trim() && !form.lead.trim() && !(form.blocks || []).length && !(form.attachments || []).length) return;
        window.localStorage.setItem(draftKey, JSON.stringify({ savedAt: new Date().toISOString(), form: stripObjectUrls(form) }));
      } catch {
        // Autosave is best-effort; explicit save remains primary.
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [draftKey, form]);

  const set = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateTitle = (value) => {
    setForm((current) => ({
      ...current,
      title: value,
      slug: slugLocked ? current.slug : makeUniqueSlug(value, articles, article?.id),
    }));
  };
  const updateRootSection = (section) => {
    setRootSection(section);
    const meta = ROOT_SECTIONS.find((item) => item.value === section);
    setForm((current) => ({
      ...current,
      publishing_scope: allowedScopes.includes(meta?.scope) ? meta.scope : (allowedScopes[0] || current.publishing_scope),
      duplicate_to_main: section === "home" ? true : false,
      dom_uchitelya_section: section === "domu" ? current.dom_uchitelya_section : "",
      noko_section: section === "noko" ? current.noko_section : "",
      methodika_subject: section === "methodika" ? current.methodika_subject : "",
      hub_kind: section === "methodika" || section === "konkursy" || section === "deyatelnost" || section === "archiv" ? section : "",
      hub_path: section === "methodika" || section === "konkursy" || section === "deyatelnost" || section === "archiv" ? current.hub_path : "",
    }));
  };
  const restoreDraft = () => {
    try {
      const draft = JSON.parse(window.localStorage.getItem(draftKey) || "{}");
      if (draft.form) {
        setForm(stripObjectUrls(draft.form));
        setDraftNotice("");
      }
    } catch {
      setDraftNotice("");
    }
  };
  const dismissDraftNotice = () => setDraftNotice("");
  const addCoverFile = async (file) => {
    if (!file) return;
    if (!file.type?.startsWith("image/")) return;
    if (!apiMode) {
      if (isObjectUrl(form.cover_image_url)) revokeObjectUrl(form.cover_image_url);
      set("cover_image_url", createLocalObjectUrl(file));
      return;
    }
    const url = await uploadCover(file);
    if (url) set("cover_image_url", url);
  };
  const handleCoverUpload = async (event) => {
    await addCoverFile(event.target.files?.[0]);
    event.target.value = "";
  };
  const handleCoverDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setCoverDragActive(false);
    await addCoverFile(event.dataTransfer.files?.[0]);
  };
  const addAttachmentFiles = async (filesInput) => {
    const files = Array.from(filesInput || []);
    if (!files.length) return;
    const pending = buildPendingAttachments(files, apiMode, createLocalObjectUrl);
    setForm((current) => ({ ...current, attachments: [...(current.attachments || []), ...pending] }));
    if (!apiMode) {
      return;
    }
    const uploaded = [];
    for (const file of files) {
      const item = await uploadAttachment(file);
      if (item?.url) uploaded.push(item);
    }
    setForm((current) => ({
      ...current,
      attachments: [...(current.attachments || []).filter((item) => !item.uploading), ...uploaded],
    }));
  };
  const handleAttachmentUpload = async (event) => {
    await addAttachmentFiles(event.target.files);
    event.target.value = "";
  };
  const handleAttachmentDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAttachmentDragActive(false);
    await addAttachmentFiles(event.dataTransfer.files);
  };
  const removeAttachment = (index) => {
    setForm((current) => ({
      ...current,
      attachments: (current.attachments || []).filter((_, itemIndex) => itemIndex !== index),
    }));
  };
  const markTouched = (field) => setTouchedFields((current) => ({ ...current, [field]: true }));
  const showFieldError = (field) => Boolean(attemptedSave || touchedFields[field]);
  const hasText = plainTextFromBlocks(form.blocks).length > 0 || form.blocks.some((block) => block.type === "image" && block.data.url);
  const fieldError = (field) => {
    if (!showFieldError(field)) return "";
    if (field === "title" && !form.title.trim()) return "Заполните заголовок статьи.";
    if (field === "slug" && !form.slug.trim()) return "Заполните slug.";
    if (field === "lead" && !form.lead.trim()) return "Добавьте лид или краткое описание.";
    if (field === "blocks" && !hasText) return "Добавьте тело статьи: текстовый блок или изображение.";
    if (field === "placement") {
      if (!allowedScopes.includes(form.publishing_scope)) return "Выберите допустимую область публикации.";
      if (form.publishing_scope === "dom_uchitelya_only" && !form.dom_uchitelya_section) return "Для Дома учителя нужен раздел.";
      if (isDomuMode && !form.dom_uchitelya_section) return "Для админки Дома учителя раздел обязателен.";
      if (rootSection === "methodika" && !form.methodika_subject && !form.hub_path) return "Выберите предмет или подраздел Методического пространства.";
      if (rootSection === "noko" && !form.noko_section) return "Выберите подраздел НОКО.";
      if ((rootSection === "konkursy" || rootSection === "deyatelnost" || rootSection === "archiv") && !form.hub_path) return "Укажите подраздел выбранного раздела.";
    }
    return "";
  };

  const errors = useMemo(() => {
    const list = [];
    if (!form.title.trim()) list.push("Заполните заголовок.");
    if (!form.slug.trim()) list.push("Заполните slug.");
    if (!form.lead.trim()) list.push("Добавьте лид/анонс.");
    if (!hasText) list.push("Добавьте хотя бы один содержательный блок.");
    if (!allowedScopes.includes(form.publishing_scope)) list.push("Выберите допустимую область публикации.");
    if (!canDuplicateMain && form.duplicate_to_main) list.push("Дублирование на главную доступно только admin, methodist и metodist_editor.");
    if (form.publishing_scope === "dom_uchitelya_only" && !form.dom_uchitelya_section) list.push("Для Дома учителя нужен раздел.");
    if (isDomuMode && !form.dom_uchitelya_section) list.push("Для админки Дома учителя раздел обязателен.");
    if (rootSection === "methodika" && !form.methodika_subject && !form.hub_path) {
      list.push("Для Методического пространства выберите предмет или подраздел.");
    }
    if (role === "methodist" && rootSection === "methodika" && !form.methodika_subject) {
      list.push("Методисту доступно размещение только внутри назначенного предмета.");
    }
    if (rootSection === "noko" && !form.noko_section) list.push("Для НОКО выберите подраздел.");
    if ((rootSection === "konkursy" || rootSection === "deyatelnost" || rootSection === "archiv") && !form.hub_path) {
      list.push("Для выбранного хаба укажите подраздел.");
    }
    if (form.methodika_subject && !allowedSubjects.includes(form.methodika_subject)) list.push("Этот предмет недоступен текущему методисту.");

    if (form.is_pinned) {
      const current = { ...form };
      const targets = [...pinTargets(current)];
      const counters = new Map();
      articles.forEach((item) => {
        if (!item.is_pinned || item.status === "archive") return;
        if (String(item.id) === String(article?.id || "")) return;
        pinTargets(item).forEach((key) => counters.set(key, (counters.get(key) || 0) + 1));
      });
      const exceeded = targets.find((key) => (counters.get(key) || 0) >= 3);
      if (exceeded) {
        list.push("Лимит закрепленных материалов для выбранного раздела/ленты: максимум 3.");
      }
    }
    return list;
  }, [allowedScopes, allowedSubjects, article?.id, articles, canDuplicateMain, form, hasText, isDomuMode, role, rootSection]);

  const handleSave = async (nextStatus) => {
    setAttemptedSave(true);
    if (errors.length) return;
    setSaving(true);
    try {
      const nextForm = {
        ...form,
        status: nextStatus,
        published_at: nextStatus === "published" && !scheduleEnabled && !form.published_at
          ? toDateInputValue(new Date().toISOString())
          : form.published_at,
      };
      const authorName = nextForm.author || nextForm.author_name || nextForm.full_name || currentAuthorName;
      await onSave({
        ...toPayload(nextForm, nextStatus, scheduleEnabled, articles, article?.id),
        author: authorName,
        author_name: authorName,
        full_name: authorName,
        author_id: nextForm.author_id || currentUser?.id || null,
      }, article?.id);
      window.localStorage.removeItem(draftKey);
      onCancel();
    } catch {
      // Error text is shown by the parent module; keep the local draft in place.
    } finally {
      setSaving(false);
    }
  };

  const availableRootSections = isDomuMode
    ? ROOT_SECTIONS.filter((section) => section.value === "domu")
    : ROOT_SECTIONS.filter((section) => section.value !== "domu" || allowedScopes.includes("dom_uchitelya_only") || allowedScopes.includes("both"));
  const publishLabel = isNew ? "Опубликовать" : form.status === "published" ? "Сохранить опубликованной" : "Опубликовать";

  return (
    <div className="article-editor-shell">
      <div className="article-editor-topbar">
        <button type="button" className="article-btn article-btn-muted" onClick={onCancel}>Назад</button>
        <div className="article-editor-title">
          <span>Статьи /</span>
          <h2>{isNew ? "Создать новую" : "Редактирование статьи"}</h2>
        </div>
        <button type="button" className="article-btn article-btn-muted" onClick={() => setPreviewOpen(true)} title="Открыть крупный предпросмотр статьи перед публикацией">Предпросмотр</button>
        <button type="button" className="article-btn article-btn-muted" onClick={() => handleSave("draft")} disabled={saving}>
          В черновик
        </button>
        <button type="button" className="article-btn article-btn-primary" onClick={() => handleSave("published")} disabled={saving}>
          {saving ? "Сохраняю..." : publishLabel}
        </button>
      </div>

      {draftNotice && (
        <div className="article-draft-banner">
          <span>{draftNotice}</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={restoreDraft}>Восстановить</button>
            <button type="button" onClick={dismissDraftNotice}>Скрыть</button>
          </div>
        </div>
      )}

      <div className="article-editor-grid">
        <main className="article-editor-main">
          <section className="article-panel">
            <label className="article-label" htmlFor="article-title">Заголовок</label>
            <input
              id="article-title"
              className="article-title-input"
              value={form.title}
              onChange={(event) => updateTitle(event.target.value)}
              onBlur={() => markTouched("title")}
              placeholder="Например: Городской семинар для педагогов"
            />
            {fieldError("title") && <div className="article-field-error">{fieldError("title")}</div>}
            <label className="article-slug-row">
              <span>URL-адрес / slug</span>
              <input
                value={form.slug}
                onChange={(event) => { setSlugLocked(true); set("slug", generateSlug(event.target.value) || event.target.value); }}
                onBlur={() => { markTouched("slug"); set("slug", makeUniqueSlug(form.slug || form.title, articles, article?.id)); }}
                placeholder="slug-materiala"
              />
              <button type="button" onClick={() => { setSlugLocked(false); set("slug", makeUniqueSlug(form.title, articles, article?.id)); }}>Сгенерировать</button>
            </label>
            {fieldError("slug") && <div className="article-field-error">{fieldError("slug")}</div>}
          </section>

          <section className="article-panel">
            <label className="article-label" htmlFor="article-lead">Лид</label>
            <textarea
              id="article-lead"
              className="article-lead-input"
              rows={3}
              value={form.lead}
              onChange={(event) => set("lead", event.target.value)}
              onBlur={() => markTouched("lead")}
              placeholder="Короткий анонс для карточки и предпросмотра на сайте"
            />
            {fieldError("lead") && <div className="article-field-error">{fieldError("lead")}</div>}
          </section>

          <BlockWorkspace blocks={form.blocks || []} onChange={(blocks) => set("blocks", blocks)} uploadImage={uploadCover} createObjectUrl={createLocalObjectUrl} />
          {fieldError("blocks") && <div className="article-field-error">{fieldError("blocks")}</div>}

          <section className="article-panel">
            <div className="article-label">Обложка</div>
            <InfoNote title="Подсказка">
              Обложка показывается в карточках и в начале статьи. Можно перетащить изображение или вставить готовую ссылку.
            </InfoNote>
            <label
              className={`article-cover-drop${coverDragActive ? " is-active" : ""}${form.cover_image_url ? " has-image" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setCoverDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                setCoverDragActive(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setCoverDragActive(false);
              }}
              onDrop={handleCoverDrop}
            >
              <input className="article-file" type="file" accept="image/*" onChange={handleCoverUpload} />
              {form.cover_image_url ? (
                <>
                  <img className="article-cover-preview" src={form.cover_image_url} alt="" />
                  <span className="article-cover-overlay">Перетащите новое изображение или нажмите для замены</span>
                </>
              ) : (
                <>
                  <span className="article-file-drop-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <path d="M4 17.5 8.5 13l3.2 3.2 2.4-2.4L20 19.7M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm10 4.5h.01" />
                    </svg>
                  </span>
                  <strong>Перетащите главное изображение сюда</strong>
                  <small>или нажмите, чтобы выбрать файл</small>
                </>
              )}
            </label>
            <input className="article-select" value={form.cover_image_url} onChange={(event) => set("cover_image_url", event.target.value)} placeholder="/images/news1.jpg" />
          </section>

          <section className="article-panel">
            <div className="article-label">Файлы</div>
            <InfoNote title="Подсказка">
              Добавьте документы, которые читатель должен скачать вместе со статьей. Поддерживаются PDF, Word, PowerPoint и Excel.
            </InfoNote>
            <label
              className={`article-file-drop${attachmentDragActive ? " is-active" : ""}`}
              onDragEnter={(event) => {
                event.preventDefault();
                setAttachmentDragActive(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
                setAttachmentDragActive(true);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setAttachmentDragActive(false);
              }}
              onDrop={handleAttachmentDrop}
            >
              <input className="article-file" type="file" multiple accept={ATTACHMENT_ACCEPT} onChange={handleAttachmentUpload} />
              <span className="article-file-drop-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3v12m0-12 4.2 4.2M12 3 7.8 7.2M5 14.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3.5" />
                </svg>
              </span>
              <strong>Перетащите файлы сюда</strong>
              <small>или нажмите, чтобы выбрать PDF, DOC, PPT, XLS</small>
            </label>
            <div className="article-attachment-list">
              {(form.attachments || []).map((file, index) => (
                <div className="article-attachment-item" key={`${file.url || file.name}-${index}`}>
                  <a href={file.url || undefined} target="_blank" rel="noreferrer">{file.name || "Документ"}</a>
                  <span>{file.uploading ? "Загрузка..." : file.type || "Файл"}</span>
                  <button type="button" onClick={() => removeAttachment(index)} aria-label="Удалить файл">×</button>
                </div>
              ))}
            </div>
          </section>

          <section className="article-panel">
            <div className="article-label">Теги</div>
            <InfoNote title="Подсказка">
              Введите слово или короткую фразу и нажмите Enter. Теги помогают быстро находить материалы по теме.
            </InfoNote>
            <ChipInput value={form.tags} onChange={(value) => set("tags", value)} />
          </section>

          {attemptedSave && <ValidationPanel errors={errors} modeLabel={isDomuMode ? "Дома учителя" : "общей админки"} />}
        </main>

        <aside className="article-editor-side">
          <div className="article-side-sticky">
            <ArticleCardPreview article={previewArticle} />
          </div>
          <section className="article-panel article-panel-compact">
            <div className="article-label">Публикация</div>
            <InfoNote title="Статус и дата">
              Черновик виден только в редакторе. Для публикации сразу оставьте дату выключенной, для отложенной публикации включите планирование.
            </InfoNote>
            <label className="article-stack-label">
              <span>Статус</span>
              <select value={form.status} onChange={(event) => set("status", event.target.value)}>
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
                <option value="scheduled">Запланировано</option>
                <option value="archive">Архив</option>
              </select>
            </label>
            <label className="article-check">
              <input type="checkbox" checked={form.is_pinned} onChange={(event) => set("is_pinned", event.target.checked)} />
              <span>Закрепить в начале ленты</span>
            </label>
            {canDuplicateMain && rootSection !== "home" && (
              <label className="article-check">
                <input
                  type="checkbox"
                  checked={Boolean(form.duplicate_to_main)}
                  onChange={(event) => set("duplicate_to_main", event.target.checked)}
                />
                <span>Дублировать на главной странице (Новости)</span>
              </label>
            )}
            <label className="article-check">
              <input
                type="checkbox"
                checked={Boolean(form.duplicate_to_events)}
                onChange={(event) => set("duplicate_to_events", event.target.checked)}
              />
              <span>Дублировать в мероприятиях</span>
            </label>
            <label className="article-check">
              <input
                type="checkbox"
                checked={scheduleEnabled}
                onChange={(event) => {
                  setScheduleEnabled(event.target.checked);
                  if (!event.target.checked) set("published_at", "");
                }}
              />
              <span>Запланировать дату публикации</span>
            </label>
            {scheduleEnabled && (
              <label className="article-stack-label">
                <span>Дата публикации</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.published_at}
                  onChange={(event) => set("published_at", event.target.value)}
                  placeholder="24.11.2026, 10:00"
                />
              </label>
            )}
          </section>

          <section className="article-panel article-panel-compact">
            <div className="article-label">Область и разделы</div>
            <InfoNote title="Где появится статья">
              Выберите основной раздел публикации. Дополнительные подразделы уточняют место материала на сайте.
            </InfoNote>
            <label className="article-stack-label">
              <span>Раздел</span>
              <select value={rootSection} onChange={(event) => { markTouched("placement"); updateRootSection(event.target.value); }}>
                {availableRootSections.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
              </select>
            </label>
            {rootSection === "domu" && (
              <label className="article-stack-label">
                <span>Подраздел Дома учителя</span>
                <select value={form.dom_uchitelya_section} onChange={(event) => set("dom_uchitelya_section", event.target.value)}>
                  <option value="">Выберите раздел</option>
                  {DOMU_SECTIONS.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
                </select>
              </label>
            )}
            {rootSection === "methodika" && (
              <>
                <label className="article-stack-label">
                  <span>Предмет Методического пространства</span>
                  <select value={form.methodika_subject} onChange={(event) => { set("methodika_subject", event.target.value); if (event.target.value) set("hub_path", ""); }}>
                    <option value="">Не выбран</option>
                    {allowedSubjects.map((subject) => <option key={subject} value={subject}>{subject}</option>)}
                  </select>
                </label>
                <label className="article-stack-label">
                  <span>Спецподраздел Методики</span>
                  <select value={form.hub_path} onChange={(event) => { set("hub_kind", "methodika"); set("hub_path", event.target.value); if (event.target.value) set("methodika_subject", ""); }}>
                    <option value="">Не выбран</option>
                    {METHODIKA_SECTIONS.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
                  </select>
                </label>
              </>
            )}
            {rootSection === "noko" && (
              <label className="article-stack-label">
                <span>Подраздел НОКО</span>
                <select value={form.noko_section} onChange={(event) => set("noko_section", event.target.value)}>
                  <option value="">Выберите подраздел</option>
                  {NOKO_SECTIONS.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
                </select>
              </label>
            )}
            {rootSection === "konkursy" && (
              <label className="article-stack-label">
                <span>Подраздел конкурсов</span>
                <select value={form.hub_path} onChange={(event) => { set("hub_kind", "konkursy"); set("hub_path", event.target.value); }}>
                  <option value="">Выберите подраздел</option>
                  {KONKURSY_SECTIONS.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
                </select>
              </label>
            )}
            {rootSection === "deyatelnost" && (
              <label className="article-stack-label">
                <span>Подраздел деятельности</span>
                <select value={form.hub_path} onChange={(event) => { set("hub_kind", "deyatelnost"); set("hub_path", event.target.value); }}>
                  <option value="">Выберите подраздел</option>
                  {DEYATELNOST_SECTIONS.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
                </select>
              </label>
            )}
            {rootSection === "archiv" && (
              <label className="article-stack-label">
                <span>Подраздел архива</span>
                <select value={form.hub_path} onChange={(event) => { set("hub_kind", "archiv"); set("hub_path", event.target.value); }}>
                  <option value="">Выберите подраздел</option>
                  {ARCHIV_SECTIONS.map((section) => <option key={section.value} value={section.value}>{section.label}</option>)}
                </select>
              </label>
            )}
            {fieldError("placement") && <div className="article-field-error">{fieldError("placement")}</div>}
          </section>
        </aside>
      </div>
      {previewOpen && <ArticlePreviewModal article={previewArticle} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}

function ArticlesList({ articles, onNew, onEdit, onDelete, onArchive }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [author, setAuthor] = useState("all");
  const [category, setCategory] = useState("all");
  const [placement, setPlacement] = useState("all");
  const [sortBy, setSortBy] = useState("updated");
  const authors = useMemo(
    () => Array.from(new Set(articles.map(getAuthorLabel))).sort((left, right) => left.localeCompare(right, "ru")),
    [articles],
  );
  const categories = useMemo(
    () => Array.from(new Set(articles.map(getCategoryLabel))).sort((left, right) => left.localeCompare(right, "ru")),
    [articles],
  );
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const items = articles.filter((article) => {
      if (query && !`${article.title} ${article.slug} ${getCategoryLabel(article)} ${getAuthorLabel(article)}`.toLowerCase().includes(query)) return false;
      if (status !== "all") {
        if (status === "scheduled" && getArticleStatusLabel(article) !== STATUS_LABELS.scheduled) return false;
        if (status !== "scheduled" && article.status !== status) return false;
      }
      if (author !== "all" && getAuthorLabel(article) !== author) return false;
      if (category !== "all" && getCategoryLabel(article) !== category) return false;
      if (placement !== "all") {
        const inMain = Boolean(article.duplicate_to_main || isHomePlacement(article));
        const inEvents = Boolean(article.duplicate_to_events);
        if (placement === "main" && !inMain) return false;
        if (placement === "events" && !inEvents) return false;
      }
      return true;
    });
    const pinnedSorted = sortArticles(items);
    if (sortBy === "author") return pinnedSorted.sort((left, right) => getAuthorLabel(left).localeCompare(getAuthorLabel(right), "ru"));
    if (sortBy === "category") return pinnedSorted.sort((left, right) => getCategoryLabel(left).localeCompare(getCategoryLabel(right), "ru"));
    if (sortBy === "scope") return pinnedSorted.sort((left, right) => getPlacementLabels(left).join(" / ").localeCompare(getPlacementLabels(right).join(" / "), "ru"));
    if (sortBy === "status") return pinnedSorted.sort((left, right) => getArticleStatusLabel(left).localeCompare(getArticleStatusLabel(right), "ru"));
    return pinnedSorted;
  }, [articles, author, category, placement, search, sortBy, status]);
  const stats = useMemo(() => {
    const published = articles.filter((article) => getArticleStatusLabel(article) === STATUS_LABELS.published).length;
    const drafts = articles.filter((article) => article.status === "draft").length;
    const scheduled = articles.filter((article) => getArticleStatusLabel(article) === STATUS_LABELS.scheduled).length;
    return [
      { label: "Всего материалов", value: articles.length, hint: "в базе статей" },
      { label: "Опубликовано статей", value: published, hint: "доступны на сайте" },
      { label: "Черновики в работе", value: drafts, hint: scheduled ? `запланировано: ${scheduled}` : "ожидают публикации" },
    ];
  }, [articles]);
  return (
    <div className="article-list">
      <div className="article-list-head">
        <div>
          <h2>Статьи</h2>
          <p>Управление новостями, событиями и информационными материалами портала</p>
        </div>
        <button type="button" className="article-btn article-btn-primary" onClick={onNew}>Новая статья</button>
      </div>
      <div className="article-filters">
        <input
          style={{ flex: 1, minWidth: "200px" }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по статьям..."
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">Все статусы</option>
          {Object.entries(STATUS_LABELS).filter(([value]) => value !== "archive").map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          <option value="archive">Архив</option>
        </select>
        <select value={author} onChange={(e) => setAuthor(e.target.value)}>
          <option value="all">Все авторы</option>
          {authors.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Все категории</option>
          {categories.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={placement} onChange={(e) => setPlacement(e.target.value)}>
          <option value="all">Все размещения</option>
          <option value="main">Главная страница</option>
          <option value="events">Мероприятия</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="updated">Сначала новые</option>
          <option value="author">По автору</option>
          <option value="category">По категории</option>
          <option value="status">По статусу</option>
          <option value="scope">По размещению</option>
        </select>
        {(search || status !== "all" || author !== "all" || category !== "all" || placement !== "all") && (
          <button
            className="article-reset-btn"
            onClick={() => {
              setSearch("");
              setStatus("all");
              setAuthor("all");
              setCategory("all");
              setPlacement("all");
            }}
          >
            Сбросить
          </button>
        )}
      </div>
      <div className="article-table-wrap">
        <table className="article-table">
          <thead>
            <tr>
              <th>Материал</th>
              <th>Размещение</th>
              <th>Статус</th>
              <th>Категория</th>
              <th>Автор</th>
              <th>Обновлена</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {!filtered.length && (
              <tr>
                <td colSpan={7} className="article-empty-row">
                  {articles.length ? "По выбранным фильтрам материалы не найдены." : "Пока нет статей. Создайте первый материал или измените фильтры."}
                </td>
              </tr>
            )}
            {filtered.map((article) => {
              const statusLabel = getArticleStatusLabel(article);
              const statusClass = statusLabel === STATUS_LABELS.scheduled ? "scheduled" : (article.status || "draft");
              return (
                <tr key={article.id}>
                  <td>
                    <strong>{article.is_pinned ? "Закреплено: " : ""}{article.title}</strong>
                    <span>/{article.slug}</span>
                  </td>
                  <td>{getPlacementLabels(article).join(" / ")}</td>
                  <td><span className={`article-status-label ${statusClass}`}>{statusLabel}</span></td>
                  <td>{getCategoryLabel(article)}</td>
                  <td>{getAuthorLabel(article)}</td>
                  <td>{formatDateRu(article.updated_at || article.updatedAt || article.created_at || article.createdAt)}</td>
                  <td>
                    <div className="article-row-actions">
                      <button type="button" onClick={() => onEdit(article)}>Редактировать</button>
                      {article.status !== "archive" && (
                        <button type="button" onClick={() => onArchive(article)}>В архив</button>
                      )}
                      <button type="button" className="danger" onClick={() => window.confirm(`Удалить "${article.title}"?`) && onDelete(article)}>
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="article-stat-grid">
        {stats.map((item) => (
          <section className="article-stat-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.hint}</small>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function ArticlesModule({
  currentUser,
  allowedScopes = ["imcro_only", "dom_uchitelya_only", "both"],
  defaultScope = "imcro_only",
  apiPath = "/api/admin/news/",
  uploadPath = "/api/admin/news/upload-cover/",
  uploadAttachmentPath = "/api/admin/news/upload-attachment/",
  isDomuMode = false,
  onArticlesChanged,
  initialCreate = false,
  onEditorClose,
  onNewArticle,
}) {
  const [articles, setArticles] = useState([]);
  const [editing, setEditing] = useState(() => initialCreate ? "new" : null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const lastLoadKeyRef = useRef("");
  const token = getStoredAccessToken();
  const apiMode = Boolean(token);
  const requestAuthHeaders = useMemo(() => token ? { Authorization: `Bearer ${token}` } : {}, [token]);

  const loadArticles = useCallback(async (force = false) => {
    if (!apiMode) {
      setArticles([]);
      setError("Для работы со статьями нужно войти в аккаунт с правами редактора.");
      setLoading(false);
      return;
    }
    const role = typeof currentUser?.role === "object" ? currentUser.role?.role_name : currentUser?.role;
    const loadKey = `${apiPath}:${token}:${currentUser?.id || ""}:${role || ""}:${isDomuMode ? "domu" : "common"}`;
    if (!force && lastLoadKeyRef.current === loadKey) return;
    lastLoadKeyRef.current = loadKey;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}${apiPath}`, { headers: requestAuthHeaders });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      setArticles(filterArticlesForRole((data.items || []).map((article) => normalizeArticle(article, defaultScope)), currentUser, isDomuMode));
    } catch {
      setError("Не удалось загрузить статьи.");
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [apiMode, apiPath, requestAuthHeaders, currentUser, defaultScope, isDomuMode, token]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    if (initialCreate) setEditing("new");
  }, [initialCreate]);

  const saveArticle = async (payload, id) => {
    const nextPayload = { ...payload, publishing_scope: payload.publishing_scope || defaultScope };
    if (!apiMode) {
      setError("Для сохранения статьи нужно войти в аккаунт с правами редактора.");
      return;
    }
    const response = await fetch(`${API_BASE}${apiPath}${id ? `${id}/` : ""}`, {
      method: id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json", ...requestAuthHeaders },
      body: JSON.stringify(nextPayload),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      setError(detail.detail || "Не удалось сохранить статью.");
      throw new Error("Article save failed");
    }
    await loadArticles(true);
    await onArticlesChanged?.();
  };

  const deleteArticle = async (article) => {
    if (!apiMode) {
      setError("Для удаления статьи нужно войти в аккаунт с правами редактора.");
      return;
    }
    const response = await fetch(`${API_BASE}${apiPath}${article.id}/`, { method: "DELETE", headers: requestAuthHeaders });
    if (!response.ok) {
      setError("Не удалось удалить статью.");
      return;
    }
    await loadArticles(true);
    await onArticlesChanged?.();
  };

  const archiveArticle = async (article) => {
    if (!apiMode) {
      setError("Для изменения статьи нужно войти в аккаунт с правами редактора.");
      return;
    }
    const response = await fetch(`${API_BASE}${apiPath}${article.id}/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...requestAuthHeaders },
      body: JSON.stringify({ status: "archive" }),
    });
    if (!response.ok) {
      setError("Не удалось перенести статью в архив.");
      return;
    }
    await loadArticles(true);
    await onArticlesChanged?.();
  };

  const uploadCover = async (file) => {
    if (!apiMode) return "";
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}${uploadPath}`, { method: "POST", headers: requestAuthHeaders, body: formData });
    if (!response.ok) {
      setError("Не удалось загрузить изображение.");
      return "";
    }
    const data = await response.json();
    return `${API_BASE}${data.url}`;
  };

  const uploadAttachment = async (file) => {
    if (!apiMode) return null;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}${uploadAttachmentPath}`, { method: "POST", headers: requestAuthHeaders, body: formData });
    if (!response.ok) {
      setError("Не удалось загрузить файл.");
      return null;
    }
    const data = await response.json();
    return { ...data, url: `${API_BASE}${data.url}` };
  };

  return (
    <div className="articles-module">
      <style>{ARTICLE_CSS}</style>
      {error && <div className="article-errors article-global-error" role="alert">{error}</div>}
      {loading ? (
        <div className="article-loading">Загрузка статей...</div>
      ) : editing ? (
        <ArticleForm
          article={editing === "new" ? null : editing}
          currentUser={currentUser}
          allowedScopes={allowedScopes}
          defaultScope={defaultScope}
          articles={articles}
          uploadCover={uploadCover}
          uploadAttachment={uploadAttachment}
          onSave={saveArticle}
          onCancel={() => {
            setEditing(null);
            onEditorClose?.();
          }}
          isDomuMode={isDomuMode}
          apiMode={apiMode}
        />
      ) : (
        <ArticlesList
          articles={articles}
          onNew={() => {
            setEditing("new");
            onNewArticle?.();
          }}
          onEdit={(article) => setEditing(article)}
          onDelete={deleteArticle}
          onArchive={archiveArticle}
        />
      )}
    </div>
  );
}

const ARTICLE_CSS = `
.articles-module { --article-primary: #19789c; --article-primary-dark: #004f75; color: #17232b; }
.article-btn, .article-row-actions button { min-height: 40px; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; color: #334155; padding: 0 14px; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; }
.article-btn:disabled { opacity: .55; cursor: not-allowed; }
.article-btn-primary { background: var(--article-primary); border-color: var(--article-primary); color: #fff; box-shadow: 0 10px 22px rgba(25, 120, 156, .2); }
.article-btn-muted { background: #fff; color: #475569; }
.article-editor-topbar, .article-list-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; }
.article-editor-title { flex: 1; min-width: 220px; }
.article-editor-title span, .article-list-head span { display: block; color: #64748b; font-size: 12px; font-weight: 900; text-transform: uppercase; margin-bottom: 3px; }
.article-editor-title h2, .article-list-head h2 { margin: 0; color: var(--article-primary-dark); font-size: 28px; line-height: 1.1; }
.article-list-head p { margin: 8px 0 0; color: #52636d; font-size: 15px; line-height: 1.45; font-weight: 650; }
.article-editor-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; align-items: start; }
.article-editor-main, .article-editor-side { display: grid; gap: 14px; min-width: 0; }
.article-panel, .block-workspace { border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; padding: 18px; box-shadow: 0 10px 28px rgba(15, 23, 42, .055); }
.article-panel-compact { padding: 16px; }
.article-info-note { margin: 0 0 12px; }
.article-info-trigger { min-height: 32px; display: inline-flex; align-items: center; gap: 7px; border: 1px solid #cfe0e7; border-radius: 8px; background: #f8fbfc; color: var(--article-primary-dark); padding: 0 10px; font: inherit; font-size: 12px; font-weight: 900; cursor: pointer; }
.article-info-trigger:hover { border-color: var(--article-primary); background: #edf6f8; }
.article-info-note p { margin: 8px 0 0; color: #475569; font-size: 12px; line-height: 1.45; font-weight: 760; padding: 10px 12px; border: 1px solid #cfe0e7; border-radius: 8px; background: #f8fbfc; }
.article-info-icon { width: 24px; height: 24px; border-radius: 999px; display: grid; place-items: center; background: #e7f3f6; color: var(--article-primary-dark); font-size: 13px; font-weight: 950; }
.article-label { display: block; color: #64748b; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 9px; }
.article-title-input { width: 100%; border: 0; outline: 0; background: transparent; color: #0f172a; font: inherit; font-size: clamp(24px, 5vw, 38px); font-weight: 900; line-height: 1.05; }
.article-slug-row { display: flex; align-items: center; gap: 8px; margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 800; flex-wrap: wrap; }
.article-slug-row input { flex: 1; min-width: 180px; border: 0; outline: 0; background: transparent; color: #475569; font: inherit; }
.article-slug-row button, .block-toolbar button, .mini-add { min-height: 34px; border: 1px solid #b8d4dd; border-radius: 8px; background: #edf6f8; color: var(--article-primary-dark); font: inherit; font-size: 12px; font-weight: 900; cursor: pointer; padding: 0 10px; }
.article-lead-input { width: 100%; resize: vertical; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #f8fafc; color: #0f172a; padding: 12px; font: inherit; font-size: 15px; line-height: 1.6; }
.article-select, .article-stack-label input, .article-stack-label select, .block-body input, .block-body select { width: 100%; min-height: 42px; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #f8fafc; color: #0f172a; padding: 0 12px; font: inherit; font-size: 14px; }
.article-select:focus, .article-stack-label input:focus, .article-stack-label select:focus, .article-lead-input:focus, .block-body input:focus, .block-body select:focus, .block-rich-area:focus { outline: 3px solid rgba(25, 120, 156, .18); border-color: var(--article-primary); }
.article-stack-label { display: grid; gap: 7px; margin-top: 12px; color: #475569; font-size: 13px; font-weight: 800; }
.article-check { display: flex; align-items: center; gap: 9px; min-height: 38px; margin-top: 12px; font-weight: 800; color: #334155; }
.article-check.compact { width: fit-content; margin: 0 0 10px; min-height: 32px; padding: 4px 10px 4px 6px; border: 1px solid #b8d4dd; border-radius: 999px; background: #edf6f8; color: var(--article-primary-dark); font-size: 12px; cursor: pointer; }
.article-check.compact input { width: 16px; height: 16px; accent-color: var(--article-primary); }
.block-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.block-toolbar div { flex: 1; display: grid; gap: 2px; }
.block-toolbar span { color: #64748b; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
.block-toolbar strong { color: #0f172a; font-size: 18px; }
.block-picker { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; margin-bottom: 14px; }
.block-picker button { min-height: 82px; border: 1px solid #dbe6f5; border-radius: 8px; background: #f8fafc; display: grid; align-content: center; gap: 3px; text-align: left; padding: 12px; cursor: pointer; font: inherit; }
.block-picker span { color: var(--article-primary-dark); font-weight: 900; }
.block-picker strong { color: #0f172a; font-size: 13px; }
.block-picker small { color: #64748b; font-size: 12px; }
.block-empty { width: 100%; border: 1.5px dashed #bfdbfe; border-radius: 8px; background: #f8fbff; color: #475569; padding: 28px; display: grid; gap: 6px; text-align: center; margin-bottom: 12px; cursor: pointer; font: inherit; transition: transform .18s ease, background .18s ease, border-color .18s ease; }
.block-empty:hover, .block-empty:focus-visible { background: #edf6f8; border-color: var(--article-primary); transform: translateY(-1px); outline: 0; }
.block-card { border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; margin-bottom: 10px; overflow: hidden; transition: transform .24s cubic-bezier(.2,.8,.2,1), box-shadow .24s ease, border-color .24s ease; }
.block-card.is-moving { animation: block-reorder .26s cubic-bezier(.2,.8,.2,1); border-color: #8fc4d4; box-shadow: 0 14px 30px rgba(25, 120, 156, .12); }
.block-card.is-dragging { opacity: .62; transform: scale(.985); box-shadow: 0 18px 36px rgba(15, 23, 42, .18); }
.block-card.is-drag-over { border-color: var(--article-primary); box-shadow: inset 0 0 0 2px rgba(25,120,156,.12); }
.block-card.is-dragging:active { transform: scale(.985); }
@keyframes block-reorder {
  0% { transform: translateY(10px) scale(.99); opacity: .74; }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
.block-handle { display: grid; grid-template-columns: auto auto 1fr auto auto auto; align-items: center; gap: 8px; min-height: 42px; padding: 8px 10px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.block-handle .drag-grip { color: #94a3b8; cursor: grab; font-weight: 900; user-select: none; touch-action: none; }
.block-handle .drag-grip:active { cursor: grabbing; }
.block-handle strong { font-size: 13px; color: #334155; }
.block-handle button { width: 30px; height: 30px; border: 1px solid #cbd5e1; border-radius: 7px; background: #fff; color: #334155; cursor: pointer; }
.block-handle button:disabled { opacity: .35; cursor: not-allowed; }
.block-handle .danger { border-color: #fecaca; color: #b91c1c; background: #fef2f2; }
.block-body { display: grid; gap: 10px; padding: 12px; }
.block-grid-compact { display: grid; grid-template-columns: 90px minmax(0, 1fr); gap: 8px; }
.align-control { width: fit-content; display: inline-flex; gap: 4px; padding: 4px; border: 1px solid #dbe6f5; border-radius: 8px; background: #f8fafc; }
.align-control button { width: 31px; height: 29px; border: 1px solid transparent; border-radius: 7px; background: transparent; color: #475569; font: inherit; font-weight: 900; cursor: pointer; }
.align-control button:hover, .align-control button.is-active { border-color: #b8d4dd; background: #edf6f8; color: var(--article-primary-dark); }
.block-rich { border: 1.5px solid #cbd5e1; border-radius: 8px; overflow: hidden; background: #fff; }
.block-rich-toolbar { display: flex; align-items: center; gap: 4px; padding: 6px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; }
.block-rich-toolbar button { width: 32px; height: 30px; border: 1px solid #cbd5e1; border-radius: 7px; background: #fff; color: #334155; font: inherit; font-weight: 900; cursor: pointer; }
.font-size-control { display: inline-flex; align-items: center; gap: 6px; margin-left: 4px; padding-left: 8px; border-left: 1px solid #e2e8f0; }
.font-size-control input[type="range"] { width: 116px; accent-color: var(--article-primary); }
.font-size-control input[type="number"] { width: 56px; height: 30px; min-height: 30px; padding: 0 6px; border: 1px solid #cbd5e1; border-radius: 7px; background: #fff; color: #0f172a; font: inherit; font-size: 12px; font-weight: 900; }
.font-size-status { min-width: 86px; color: #64748b; font-size: 11px; font-weight: 900; }
.block-rich-area { min-height: 96px; padding: 12px; line-height: 1.45; outline: 0; overflow-wrap: anywhere; user-select: text; }
.block-rich-area [data-font-size-span="true"], .preview-paragraph [data-font-size-span="true"], .article-md [data-font-size-span="true"] { line-height: 1.2; }
.block-rich-area:empty::before { content: attr(data-placeholder); color: #94a3b8; }
.list-row { display: grid; grid-template-columns: minmax(0, 1fr) 38px; gap: 8px; }
.list-row button { border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; color: #b91c1c; cursor: pointer; font-weight: 900; }
.image-drop { display: grid; gap: 10px; border: 1.5px dashed #bfdbfe; border-radius: 8px; background: #f8fbff; padding: 12px; }
.image-drop img { width: 100%; max-height: 300px; object-fit: cover; border-radius: 8px; }
.image-drop div { min-height: 150px; display: grid; place-items: center; color: #64748b; font-weight: 800; }
.image-drop label { width: fit-content; min-height: 36px; display: inline-flex; align-items: center; border: 1px solid #b8d4dd; border-radius: 8px; background: #edf6f8; color: var(--article-primary-dark); padding: 0 12px; cursor: pointer; font-size: 13px; font-weight: 900; }
.image-drop label input { display: none; }
.divider-editor { color: #64748b; font-size: 13px; padding: 10px 0; }
.article-preview { display: grid; gap: 12px; position: static; min-width: 0; }
.article-preview-card, .seo-preview, .feed-preview { border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; padding: 18px; box-shadow: 0 18px 46px rgba(15, 23, 42, .08); }
.article-preview-card img, .article-cover-preview { width: 100%; border-radius: 8px; object-fit: cover; background: #e2e8f0; }
.article-preview-card img { aspect-ratio: 16 / 9; margin-bottom: 14px; }
.article-real-preview { background: #f8fafc; }
.article-preview-breadcrumb { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; color: #64748b; font-size: 13px; font-weight: 900; }
.article-preview-breadcrumb span { display: inline-flex; align-items: center; gap: 8px; }
.article-preview-breadcrumb b { color: #cbd5e1; }
.article-preview-hero { position: relative; overflow: hidden; border-radius: 14px; border: 1px solid #e2e8f0; box-shadow: 0 16px 44px rgba(15,23,42,.12); margin-bottom: 18px; background: #e2e8f0; }
.article-preview-hero img { display: block; width: 100%; max-height: 460px; aspect-ratio: 16 / 9; object-fit: cover; margin: 0; border-radius: 0; }
.article-preview-pin { position: absolute; top: 14px; right: 14px; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 999px; color: #fff; background: rgba(15, 23, 42, .78); border: 1px solid rgba(255,255,255,.5); box-shadow: 0 12px 30px rgba(15,23,42,.28); backdrop-filter: blur(10px); }
.article-preview-pin svg { width: 21px; height: 21px; fill: currentColor; }
.article-preview-content-card { border: 1px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 22px; }
.article-cover-preview { aspect-ratio: 16 / 9; margin-bottom: 0; }
.article-cover-drop { position: relative; min-height: 156px; display: grid; place-items: center; gap: 7px; text-align: center; border: 1.5px dashed #bfdbfe; border-radius: 8px; background: linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%); color: #334155; padding: 18px; cursor: pointer; margin-bottom: 12px; overflow: hidden; transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease; }
.article-cover-drop:hover, .article-cover-drop.is-active { transform: translateY(-1px); border-color: var(--article-primary); background: #edf6f8; box-shadow: 0 14px 30px rgba(25, 120, 156, .12); }
.article-cover-drop.has-image { padding: 0; border-style: solid; background: #e2e8f0; }
.article-cover-drop.has-image .article-cover-preview { width: 100%; height: 100%; min-height: 156px; border-radius: 8px; object-fit: cover; display: block; }
.article-cover-overlay { position: absolute; inset: auto 10px 10px; border-radius: 8px; background: rgba(15, 23, 42, .76); color: #fff; padding: 9px 10px; font-size: 12px; font-weight: 900; line-height: 1.35; backdrop-filter: blur(10px); }
.article-preview-image { aspect-ratio: 16 / 9; display: grid; place-items: center; border-radius: 8px; background: #e2e8f0; color: #64748b; font-weight: 900; margin-bottom: 14px; }
.article-preview-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.article-preview-meta span { border-radius: 6px; background: #ecfdf5; color: #047857; padding: 4px 8px; font-size: 12px; font-weight: 900; }
.article-preview-card h1 { margin: 0 0 10px; font-size: clamp(25px, 5vw, 40px); line-height: 1.08; }
.article-preview-card p { color: #475569; line-height: 1.6; font-weight: 650; }
.block-preview-stack { display: grid; gap: 14px; line-height: 1.7; color: #1f2937; overflow-wrap: anywhere; }
.preview-heading { margin: 12px 0 2px; line-height: 1.2; color: #0f172a; }
.preview-paragraph { color: #334155; line-height: 1.75; }
.preview-paragraph a { color: var(--article-primary-dark); }
.preview-quote { border-left: 4px solid var(--article-primary); background: #edf6f8; color: var(--article-primary-dark); padding: 14px 16px; margin: 0; border-radius: 0 8px 8px 0; }
.preview-quote cite { display: block; margin-top: 8px; color: #64748b; font-size: 13px; }
.preview-list { margin: 0; padding-left: 22px; }
.preview-image { margin: 0; }
.preview-image img { width: 100%; max-height: 460px; object-fit: cover; border-radius: 8px; }
.preview-image div { min-height: 160px; display: grid; place-items: center; background: #f1f5f9; border-radius: 8px; color: #64748b; }
.preview-image figcaption { text-align: center; color: #64748b; font-size: 13px; margin-top: 7px; }
.preview-divider { border: 0; border-top: 2px solid #e2e8f0; width: 100%; }
.seo-title { color: #1a0dab; font-size: 18px; line-height: 1.3; }
.seo-url { color: #047857; font-size: 13px; margin: 4px 0; overflow-wrap: anywhere; }
.seo-preview p, .feed-preview p { margin: 6px 0 0; color: #4b5563; line-height: 1.5; }
.article-chipbox { min-height: 42px; display: flex; align-items: center; flex-wrap: wrap; gap: 6px; border: 1.5px solid #cbd5e1; border-radius: 8px; background: #f8fafc; padding: 6px 8px; }
.article-chipbox input { min-width: 110px; flex: 1; border: 0; outline: 0; background: transparent; font: inherit; }
.article-chip { display: inline-flex; align-items: center; gap: 5px; border-radius: 6px; background: #edf6f8; color: var(--article-primary-dark); padding: 4px 8px; font-size: 12px; font-weight: 900; }
.article-chip button { border: 0; background: transparent; color: inherit; cursor: pointer; font-weight: 900; }
.article-ok { border: 1px solid #bbf7d0; background: #f0fdf4; color: #047857; border-radius: 8px; padding: 12px; font-size: 13px; font-weight: 800; line-height: 1.5; }
.article-errors { border: 1px solid #fecaca; background: #fffafa; color: #b91c1c; border-radius: 8px; padding: 12px; font-size: 13px; font-weight: 800; line-height: 1.5; }
.article-errors strong { display: block; margin-bottom: 6px; color: #991b1b; }
.article-field-error { margin-top: 8px; color: #b91c1c; font-size: 12px; font-weight: 850; }
.article-global-error, .article-draft-banner { margin-bottom: 14px; }
.article-draft-banner { display: flex; align-items: center; justify-content: space-between; gap: 10px; border: 1px solid #fde68a; background: #fffbeb; color: #92400e; border-radius: 8px; padding: 12px; font-size: 13px; font-weight: 800; }
.article-draft-banner button { border: 1px solid #f59e0b; background: #fff; border-radius: 8px; min-height: 34px; padding: 0 10px; color: #92400e; font: inherit; font-weight: 900; cursor: pointer; }
.article-file { display: none; }
.article-file-drop { min-height: 132px; display: grid; place-items: center; gap: 7px; text-align: center; border: 1.5px dashed #bfdbfe; border-radius: 8px; background: linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%); color: #334155; padding: 18px; cursor: pointer; margin-bottom: 12px; transition: transform .18s ease, border-color .18s ease, background .18s ease, box-shadow .18s ease; }
.article-file-drop:hover, .article-file-drop.is-active { transform: translateY(-1px); border-color: var(--article-primary); background: #edf6f8; box-shadow: 0 14px 30px rgba(25, 120, 156, .12); }
.article-file-drop-icon { width: 42px; height: 42px; display: grid; place-items: center; border-radius: 999px; background: #e7f3f6; color: var(--article-primary-dark); }
.article-file-drop-icon svg { width: 23px; height: 23px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.article-file-drop strong { font-size: 14px; line-height: 1.25; color: #0f172a; }
.article-file-drop small { color: #64748b; font-size: 12px; font-weight: 800; line-height: 1.35; }
.article-attachment-list, .article-attachments-preview { display: grid; gap: 8px; }
.article-attachment-item { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 8px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; padding: 8px 10px; }
.article-attachment-item a, .article-attachments-preview a { color: var(--article-primary-dark); font-weight: 800; overflow-wrap: anywhere; }
.article-attachment-item span { color: #64748b; font-size: 12px; font-weight: 900; }
.article-attachment-item button { width: 30px; height: 30px; border: 1px solid #fecaca; border-radius: 7px; background: #fef2f2; color: #b91c1c; cursor: pointer; font-size: 18px; line-height: 1; }
.article-attachments-preview { margin-top: 18px; border-top: 1px solid #e2e8f0; padding-top: 14px; }
.article-attachments-preview strong { color: #0f172a; }
.article-filters { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 12px; 
  margin-bottom: 24px; 
  align-items: center; 
  background: #fff; 
  padding: 20px; 
  border-radius: 8px; 
  border: 1px solid #dbe6f5;
  box-shadow: 0 10px 28px rgba(15, 23, 42, .05);
}
.article-filters input, .article-filters select { 
  height: 44px; 
  border-radius: 8px; 
  border: 1.5px solid #e2e8f0; 
  background-color: #f8fafc;
  color: #1f2d35;
  font: inherit;
  font-size: 14px;
  padding: 0 12px;
  transition: all 0.2s;
}
.article-filters input:focus, .article-filters select:focus {
  background-color: #fff;
  border-color: var(--article-primary);
  box-shadow: 0 0 0 4px rgba(25, 120, 156, 0.1);
}
.article-reset-btn {
  background: none;
  border: none;
  color: var(--article-primary-dark);
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
  padding: 8px;
}
.article-reset-btn:hover { text-decoration: underline; }
.article-table-wrap { overflow-x: auto; border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; box-shadow: 0 10px 28px rgba(15, 23, 42, .05); }
.article-table { width: 100%; min-width: 1080px; border-collapse: collapse; }
.article-table th { background: #eef7fa; color: var(--article-primary-dark); font-size: 11px; text-transform: uppercase; letter-spacing: .04em; text-align: left; padding: 14px 16px; }
.article-table td { border-top: 1px solid #edf2f7; padding: 15px 16px; color: #334155; font-size: 13px; vertical-align: middle; }
.article-table td strong { display: block; color: #0f172a; margin-bottom: 3px; }
.article-table td span { color: #94a3b8; font-size: 12px; }
.article-status-text { color: #334155; font-size: 14px; font-weight: 800; }
.article-table .article-status-label { display: inline-flex; align-items: center; min-height: 25px; border-radius: 999px; padding: 0 10px; background: #eef4f7; color: #334155; font-size: 11px; font-weight: 900; text-transform: uppercase; }
.article-table .article-status-label.published { background: #dcfce7; color: #15803d; }
.article-table .article-status-label.draft { background: #f1f5f9; color: #475569; }
.article-table .article-status-label.scheduled { background: #e0f2fe; color: var(--article-primary-dark); }
.article-row-actions { display: flex; gap: 6px; flex-wrap: nowrap; min-width: max-content; }
.article-row-actions .danger { border-color: #fecaca; color: #b91c1c; background: #fef2f2; }
.article-empty-row, .article-loading { text-align: center; color: #64748b; padding: 34px !important; }
.article-stat-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 24px; }
.article-stat-card { min-height: 92px; border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; padding: 18px 22px; box-shadow: 0 10px 28px rgba(15, 23, 42, .05); }
.article-stat-card span { display: block; color: #667783; font-size: 12px; font-weight: 850; text-transform: uppercase; }
.article-stat-card strong { display: block; margin-top: 6px; color: var(--article-primary-dark); font-size: 28px; line-height: 1.05; font-weight: 950; }
.article-stat-card small { display: block; margin-top: 4px; color: #667783; font-size: 12px; font-weight: 700; }
.article-side-sticky { position: sticky; top: 88px; z-index: 2; }
.article-card-preview { overflow: hidden; border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; box-shadow: 0 14px 36px rgba(15, 23, 42, .08); }
.article-card-preview img, .article-card-preview-image { width: 100%; aspect-ratio: 16 / 9; display: grid; place-items: center; object-fit: cover; background: #eef4f7; color: #667783; font-size: 13px; font-weight: 900; }
.article-card-preview-body { padding: 16px; }
.article-card-preview-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
.article-card-preview-meta span { border-radius: 6px; background: #edf6f8; color: var(--article-primary-dark); padding: 4px 8px; font-size: 11px; font-weight: 900; }
.article-card-preview h3 { margin: 0; color: #0f172a; font-size: 19px; line-height: 1.18; overflow-wrap: anywhere; }
.article-card-preview p { margin: 9px 0 0; color: #52636d; line-height: 1.5; font-size: 14px; font-weight: 650; overflow-wrap: anywhere; }
.article-card-preview-link { display: inline-flex; margin-top: 12px; color: var(--article-primary-dark); font-size: 13px; font-weight: 900; }
.preview-modal { position: fixed; inset: 0; z-index: 1000; background: rgba(15, 23, 42, .58); display: grid; place-items: center; padding: 18px; }
.preview-modal-panel { width: min(980px, 100%); max-height: 92vh; overflow: auto; background: #f8fafc; border-radius: 8px; padding: 16px; }
.preview-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.preview-modal-head button { min-height: 38px; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #334155; padding: 0 12px; cursor: pointer; font: inherit; font-weight: 800; }
.article-preview.expanded { position: static; max-width: 820px; margin: 0 auto; }
@media (min-width: 980px) { .article-editor-grid { grid-template-columns: minmax(0, 1fr) minmax(340px, 390px); } .article-preview { position: static; } }
@media (max-width: 979px) { .article-editor-side { order: -1; } .article-side-sticky { position: static; } }
@media (max-width: 900px) { .article-stat-grid { grid-template-columns: 1fr; } }
@media (max-width: 640px) { .article-panel, .block-workspace { padding: 14px; } .article-editor-topbar, .article-list-head, .article-draft-banner, .block-toolbar { align-items: stretch; flex-direction: column; } .article-btn { width: 100%; } .block-grid-compact, .block-handle { grid-template-columns: 1fr; } .article-empty-row { text-align: left; } }
`;
