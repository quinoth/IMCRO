export const DEFAULT_AUTHOR_LABEL = "Редакция ИМЦРО";
export const FALLBACK_NEWS_IMAGE = "/images/news2.jpg";
export const CONTACT_COORDS = { lat: 52.281732, lon: 104.280948 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function looksLikeTechnicalAuthor(value) {
  const text = String(value || "").trim();
  if (!text) return true;
  if (text.includes("@")) return true;
  if (/^Автор #\d+$/i.test(text)) return true;
  if (/\s/.test(text)) return false;
  return /^[a-z0-9_.-]+$/i.test(text);
}

function composeAuthorFullName(news) {
  return [
    news?.last_name || news?.lastName,
    news?.first_name || news?.firstName,
    news?.middle_name || news?.middleName,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
}

export function getNewsAuthorLabel(news) {
  const fio = composeAuthorFullName(news);
  const candidate = news?.author_full_name || news?.full_name || news?.fullName || fio || news?.author_name || news?.author;
  return looksLikeTechnicalAuthor(candidate) ? DEFAULT_AUTHOR_LABEL : candidate;
}

export function getNewsAuthorKey(news) {
  return news?.author_key || news?.authorKey || (news?.author_id ? `id-${news.author_id}` : "");
}

export function getNewsAuthorHref(news) {
  const authorKey = getNewsAuthorKey(news);
  return authorKey ? `/authors/${encodeURIComponent(authorKey)}/` : "/novosti/";
}

export function getFeaturedNews(newsItems = []) {
  if (!Array.isArray(newsItems)) return null;
  return newsItems.find((item) => item && item.title) || null;
}

export function getNewsImage(news) {
  return news?.cover_image_url || news?.image || FALLBACK_NEWS_IMAGE;
}

export function getNewsDescription(news) {
  return news?.lead || news?.excerpt || news?.description || "";
}

export function getNewsHref(news) {
  const slug = news?.slug || news?.id || news?.articleId;
  return slug ? `/article/${encodeURIComponent(slug)}` : "/novosti/";
}

export function getNewsDateTime(news) {
  const raw = news?.published_at || news?.publishedAt || news?.dateSortValue || news?.date || news?.updatedAt || news?.createdAt;
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return String(raw);
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export function buildMapHref(coords = CONTACT_COORDS) {
  const lat = Number(coords.lat).toFixed(6);
  const lon = Number(coords.lon).toFixed(6);
  return `https://yandex.ru/maps/?ll=${lon}%2C${lat}&z=17&pt=${lon}%2C${lat},pm2rdm`;
}

export function buildMapEmbedSrc(coords = CONTACT_COORDS) {
  const lat = Number(coords.lat).toFixed(6);
  const lon = Number(coords.lon).toFixed(6);
  return `https://yandex.ru/map-widget/v1/?ll=${lon}%2C${lat}&z=17&pt=${lon}%2C${lat},pm2rdm`;
}

export function getCarouselState({ scrollLeft = 0, scrollWidth = 0, clientWidth = 0, pageCount = 1 }) {
  const maxScroll = Math.max(0, scrollWidth - clientWidth);
  const progress = maxScroll > 0 ? clamp(scrollLeft / maxScroll, 0, 1) : 0;
  const safePageCount = Math.max(1, pageCount);
  return {
    activeIndex: safePageCount > 1 ? Math.round(progress * (safePageCount - 1)) : 0,
    canPrev: scrollLeft > 1,
    canNext: scrollLeft < maxScroll - 1,
    maxScroll,
    progress,
  };
}
