import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import {
  ImcroButton,
  ImcroCard,
  ImcroContainer,
  ImcroSection,
  ImcroServiceCard,
} from "../../components/imcro/ImcroPublicComponents.jsx";
import "./HubSectionPageLayout.css";

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function getSectionIconText(title) {
  const words = String(title || "")
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);

  if (!words.length) return "ИМ";

  const shortText = words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return shortText || "ИМ";
}

function formatDate(value) {
  if (!value) return "Материал";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getArticleDate(article) {
  return article?.dateSortValue
    || article?.published_at
    || article?.publishedAt
    || article?.date
    || article?.updatedAt
    || article?.createdAt;
}

function getArticleDescription(article) {
  return article?.lead
    || article?.excerpt
    || article?.description
    || "Материал раздела с подробной информацией, документами и методическими рекомендациями.";
}

export function createFallbackArticles(sectionTitle = "раздел") {
  return [
    {
      id: "section-fallback-methodical",
      date: "02.09.2024",
      category: "Методические материалы",
      title: "Опубликованы методические материалы по разделу",
      description: `Подборка материалов для направления «${sectionTitle}» готовится к размещению и будет обновляться ответственными специалистами.`,
      href: "/novosti/",
      isFallback: true,
    },
    {
      id: "section-fallback-documents",
      date: "16.09.2024",
      category: "Документы",
      title: "Обновлены нормативные документы",
      description: "В разделе будут размещены актуальные приказы, положения и официальные документы для образовательных организаций.",
      href: "/novosti/",
      isFallback: true,
    },
    {
      id: "section-fallback-recommendations",
      date: "30.09.2024",
      category: "Рекомендации",
      title: "Добавлены рекомендации для образовательных организаций",
      description: "Материалы помогут быстро найти порядок действий, сроки и контактную информацию по выбранному направлению.",
      href: "/novosti/",
      isFallback: true,
    },
  ];
}

export function ArticleCard({ article, onOpenArticle, className = "" }) {
  const date = formatDate(getArticleDate(article));
  const category = article?.category || article?.type || "Материал";
  const description = getArticleDescription(article);
  const href = article?.href || "";
  const canOpen = Boolean(href || (!article?.isFallback && onOpenArticle));

  function handleClick() {
    if (!canOpen || href) return;
    onOpenArticle?.(article);
  }

  return (
    <article className={cx("hub-section-article", className)}>
      <ImcroCard className="hub-section-article-card" hover>
        <div className="hub-section-article-meta">
          <time>{date}</time>
          <span>{category}</span>
        </div>
        <div className="hub-section-article-body">
          <h3>{article?.title}</h3>
          <p>{description}</p>
        </div>
        {href ? (
          <ImcroButton className="hub-section-article-action" href={href}>
            Подробнее
          </ImcroButton>
        ) : (
          <ImcroButton
            className="hub-section-article-action"
            disabled={!canOpen}
            onClick={handleClick}
          >
            Подробнее
          </ImcroButton>
        )}
      </ImcroCard>
    </article>
  );
}

export function ArticleList({
  title = "Статьи и материалы",
  description = "",
  articles = [],
  fallbackTitle,
  onOpenArticle,
  className = "",
}) {
  const rows = normalizeArray(articles);
  const visibleArticles = rows.length ? rows : createFallbackArticles(fallbackTitle);

  return (
    <ImcroSection className={cx("hub-section-materials-section", className)}>
      <div className="hub-section-block-head">
        <div>
          <h2>{title}</h2>
        </div>
        {description && <p>{description}</p>}
      </div>
      <div className="hub-section-article-list">
        {visibleArticles.map((article, index) => (
          <ArticleCard
            key={article.id || article.slug || `${article.title}-${index}`}
            article={article}
            onOpenArticle={onOpenArticle}
          />
        ))}
      </div>
    </ImcroSection>
  );
}

function ChildSections({ childSections = [] }) {
  const sections = normalizeArray(childSections);
  if (!sections.length) return null;

  return (
    <ImcroSection className="hub-section-children-section">
      <div className="hub-section-block-head">
        <div>
          <h2>Материалы и разделы</h2>
        </div>
      </div>
      <div className="hub-section-child-grid">
        {sections.map((section) => (
          <ImcroServiceCard
            key={section.path || section.href || section.title}
            className="hub-section-child-card"
            title={section.title}
            description={section.description || "Материалы, документы и справочная информация подраздела."}
            icon={getSectionIconText(section.title)}
            href={section.href || section.path}
            ctaText="Открыть"
          />
        ))}
      </div>
    </ImcroSection>
  );
}

export function HubSectionPageLayout({
  title,
  description,
  breadcrumbs = [],
  childSections = [],
  articles = [],
  parentHref,
  parentTitle,
  onOpenArticle,
  className = "",
}) {
  const sections = normalizeArray(childSections);
  const hasChildSections = sections.length > 0;

  return (
    <ImcroContainer className={cx("hub-section-container", className)}>
      <Breadcrumbs className="hub-section-breadcrumbs" items={breadcrumbs} />

      <ImcroSection className="hub-section-hero-section">
        <ImcroCard className="hub-section-hero-card">
          <div className="hub-section-hero-copy">
            <span className="hub-section-kicker">{parentTitle || "Раздел ИМЦРО"}</span>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {parentHref && parentTitle && (
            <div className="hub-section-hero-actions">
              <ImcroButton href={parentHref}>К разделу {parentTitle}</ImcroButton>
            </div>
          )}
        </ImcroCard>
      </ImcroSection>

      <ChildSections childSections={sections} />

      <ArticleList
        title="Статьи и материалы"
        articles={articles}
        fallbackTitle={title}
        onOpenArticle={onOpenArticle}
      />
    </ImcroContainer>
  );
}
