const BLOCK_TAG_PATTERN = /<hr\b[^>]*>|<(h[1-3]|p|blockquote|ul|ol|figure)\b[\s\S]*?<\/\1>/gi;

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function decodeEntities(value = "") {
  return String(value)
    .replaceAll("&nbsp;", " ")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripTags(value = "") {
  return decodeEntities(String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function isLikelyHtml(value = "") {
  return /<\/?[a-z][\s\S]*>/i.test(String(value));
}

function normalizeLevel(level) {
  const numeric = Number(level || 2);
  if (numeric <= 2) return 2;
  return 3;
}

function getAttr(markup, attr) {
  const pattern = new RegExp(`${attr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i");
  const match = String(markup).match(pattern);
  return decodeEntities(match?.[1] || match?.[2] || match?.[3] || "");
}

function innerHtml(markup, tag) {
  const pattern = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  return String(markup).match(pattern)?.[1]?.trim() || "";
}

function renderParagraph(block) {
  const html = block?.data?.html ?? block?.data?.text ?? "";
  if (!String(html).trim()) return "";
  return `<p>${isLikelyHtml(html) ? html : escapeHtml(html)}</p>`;
}

function renderImage(block) {
  const url = block?.data?.url || "";
  const caption = block?.data?.caption || "";
  if (!url) return "";
  return `<figure><img src="${escapeHtml(url)}" alt="">${caption ? `<figcaption>${escapeHtml(caption)}</figcaption>` : ""}</figure>`;
}

export function blocksToEditorHtml(blocks = []) {
  return (Array.isArray(blocks) ? blocks : [])
    .map((block) => {
      if (!block || typeof block !== "object") return "";
      if (block.type === "hero") {
        const title = block.data?.title ? `<h2>${escapeHtml(block.data.title)}</h2>` : "";
        const intro = block.data?.intro ? `<p>${escapeHtml(block.data.intro)}</p>` : "";
        return `${title}${intro}`;
      }
      if (block.type === "heading") {
        const text = block.data?.text || block.data?.title || "";
        return text ? `<h${normalizeLevel(block.data?.level)}>${escapeHtml(text)}</h${normalizeLevel(block.data?.level)}>` : "";
      }
      if (block.type === "paragraph") return renderParagraph(block);
      if (block.type === "quote") {
        const quote = block.data?.html || block.data?.text || "";
        const author = block.data?.author || "";
        if (!quote && !author) return "";
        return `<blockquote>${isLikelyHtml(quote) ? quote : escapeHtml(quote)}${author ? `<cite>${escapeHtml(author)}</cite>` : ""}</blockquote>`;
      }
      if (block.type === "list") {
        const Tag = block.data?.ordered ? "ol" : "ul";
        const items = (block.data?.items || []).filter((item) => String(item || "").trim());
        return items.length ? `<${Tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${Tag}>` : "";
      }
      if (block.type === "image") return renderImage(block);
      if (block.type === "divider") return "<hr>";
      return "";
    })
    .filter(Boolean)
    .join("");
}

export function htmlToPlainText(html = "") {
  return stripTags(String(html)
    .replace(/<\/(h[1-3]|p|blockquote|li|figcaption)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " "));
}

export function getEditorTextStats(html = "") {
  const text = htmlToPlainText(html).replace(/\s+/g, " ").trim();
  return {
    words: text ? text.split(/\s+/).length : 0,
    characters: text.length,
  };
}

export function articleToEditorHtml(article = {}) {
  const body = typeof article.body === "string" ? article.body.trim() : "";
  if (body) {
    try {
      const parsed = JSON.parse(body);
      if (Array.isArray(parsed)) return blocksToEditorHtml(parsed);
    } catch {
      return isLikelyHtml(body) ? body : `<p>${escapeHtml(body)}</p>`;
    }
  }
  if (Array.isArray(article.blocks) && article.blocks.length) return blocksToEditorHtml(article.blocks);
  return "";
}

export function editorHtmlToBlocks(html = "") {
  const source = String(html || "").trim();
  if (!htmlToPlainText(source) && !/<img\b/i.test(source) && !/<hr\b/i.test(source)) return [];

  const matches = [...source.matchAll(BLOCK_TAG_PATTERN)];
  const chunks = matches.length ? matches.map((match) => match[0]) : [`<p>${source}</p>`];
  return chunks.map((markup, index) => {
    const tag = markup.match(/^<([a-z0-9]+)/i)?.[1]?.toLowerCase() || "p";
    const id = `wysiwyg-${index + 1}-${tag}`;

    if (tag === "h1" || tag === "h2" || tag === "h3") {
      return { id, type: "heading", data: { text: stripTags(markup), level: normalizeLevel(tag.replace("h", "")), align: "left" } };
    }
    if (tag === "blockquote") {
      const cite = innerHtml(markup, "cite");
      const quote = markup.replace(/<cite\b[\s\S]*?<\/cite>/i, "");
      return { id, type: "quote", data: { html: innerHtml(quote, "blockquote"), author: stripTags(cite) } };
    }
    if (tag === "ul" || tag === "ol") {
      const items = [...markup.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((match) => stripTags(match[1])).filter(Boolean);
      return { id, type: "list", data: { ordered: tag === "ol", items, align: "left" } };
    }
    if (tag === "figure") {
      const imageMarkup = markup.match(/<img\b[^>]*>/i)?.[0] || "";
      return {
        id,
        type: "image",
        data: {
          url: getAttr(imageMarkup, "src"),
          caption: stripTags(innerHtml(markup, "figcaption")),
        },
      };
    }
    if (tag === "hr") return { id, type: "divider", data: {} };
    return { id, type: "paragraph", data: { html: innerHtml(markup, tag) || markup, align: "left" } };
  }).filter((block) => {
    if (block.type === "image") return Boolean(block.data.url);
    if (block.type === "divider") return true;
    if (block.type === "list") return block.data.items.length > 0;
    return Boolean(htmlToPlainText(block.data.html || block.data.text || ""));
  });
}
