const URL_REGEX = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/g;
const TRAILING_PUNCTUATION_REGEX = /[.,!?;:]+$/;
const DEFAULT_MAX_LINK_LENGTH = 42;

export function getLinkHref(url) {
  const value = String(url || "").trim();
  if (!value) return "";

  return value.startsWith("www.") ? `https://${value}` : value;
}

export function shortenUrlLabel(url, maxLength = DEFAULT_MAX_LINK_LENGTH) {
  const value = String(url || "").trim();
  if (!value) return "";

  const href = getLinkHref(value);

  try {
    const parsedUrl = new URL(href);
    const hostname = parsedUrl.hostname.replace(/^www\./i, "");
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean).map(part => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });

    if (pathParts.length === 0) return hostname;

    const visiblePath =
      pathParts.length === 1
        ? pathParts[0]
        : `${pathParts[0]}/.../${pathParts[pathParts.length - 1]}`;

    return truncateMiddle(`${hostname}/${visiblePath}`, maxLength);
  } catch {
    return truncateMiddle(value, maxLength);
  }
}

export function linkifyText(text, { isBot = false } = {}) {
  if (!text) return text;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = URL_REGEX.exec(text)) !== null) {
    let leadingText = text.slice(lastIndex, match.index);
    let linkLabel = null;

    if (isBot) {
      const contextualLabel = getContextualLinkLabel(leadingText);
      if (contextualLabel) {
        leadingText = contextualLabel.leadingText;
        linkLabel = contextualLabel.label;
      }
    }

    if (leadingText) parts.push(leadingText);

    const { url, punctuation } = splitTrailingPunctuation(match[0]);
    const href = getLinkHref(url);

    parts.push(
      <a
        key={`${match.index}-${url}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={isBot ? "chat-link-bot" : "chat-link-user"}
        title={href}
      >
        {isBot ? linkLabel || shortenUrlLabel(url) : url}
      </a>
    );

    if (punctuation) parts.push(punctuation);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function getContextualLinkLabel(leadingText) {
  const lineStart = Math.max(leadingText.lastIndexOf("\n"), leadingText.lastIndexOf("\r"));
  const beforeLine = lineStart >= 0 ? leadingText.slice(0, lineStart + 1) : "";
  const linePrefix = leadingText.slice(lineStart + 1);
  const match = linePrefix.match(/^(\s*(?:[-*]\s+|\d+\.\s+)?)([^:\r\n]{2,80}):\s*$/);

  if (!match) return null;

  const label = cleanContextualLabel(match[2]);
  if (!label || /https?:|www\./i.test(label)) return null;

  return {
    leadingText: `${beforeLine}${match[1]}`,
    label,
  };
}

function cleanContextualLabel(value) {
  return value
    .replace(/[*_`]+/g, "")
    .replace(/^\s+|\s+$/g, "");
}

function splitTrailingPunctuation(value) {
  const punctuation = value.match(TRAILING_PUNCTUATION_REGEX)?.[0] || "";
  if (!punctuation) return { url: value, punctuation: "" };

  return {
    url: value.slice(0, -punctuation.length),
    punctuation,
  };
}

function truncateMiddle(value, maxLength) {
  if (value.length <= maxLength) return value;

  const visibleLength = maxLength - 3;
  const startLength = Math.ceil(visibleLength * 0.6);
  const endLength = visibleLength - startLength;

  return `${value.slice(0, startLength)}...${value.slice(value.length - endLength)}`;
}
