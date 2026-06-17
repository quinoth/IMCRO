import Header from "../features/nav/Header.jsx";
import Footer from "../components/Footer.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import Badge from "../components/Badge.jsx";
import { articleToEditorHtml } from "../features/admin/articleEditorContent.js";

function getDate(article) {
  const raw = article?.dateSortValue || article?.date || "";
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return article?.date || "";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(parsed));
}

function StaticContent({ article }) {
  const html = articleToEditorHtml(article);
  if (html) return <div dangerouslySetInnerHTML={{ __html: html }} />;
  return <p style={{ fontSize: 16, color: "#334155", lineHeight: 1.8 }}>{article.excerpt || article.content || ""}</p>;
}

function PinnedBadge() {
  return (
    <span className="article-pin" aria-label="Закреплённая статья" title="Закреплённая статья">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M14.8 3.2 20.8 9.2 18.7 11.3 17.3 9.9 13.4 13.8 13.8 18.6 12.4 20 8.8 16.4 4.7 20.5 3.5 19.3 7.6 15.2 4 11.6 5.4 10.2 10.2 10.6 14.1 6.7 12.7 5.3 14.8 3.2Z" />
      </svg>
    </span>
  );
}

export default function ArticlePage({
  article,
  currentUser,
  onBack,
  onGoAuth,
  onGoAdmin,
  onGoProfile,
  onOpenAuthor,
}) {
  const bodyHtml = articleToEditorHtml(article);
  const heroImage = article.cover_image_url || article.image;
  const breadcrumbs = [
    { label: "Главная", to: "/" },
    article.parentLabel && article.parentPath ? { label: article.parentLabel, to: article.parentPath } : null,
    article.sectionLabel && article.sectionPath ? { label: article.sectionLabel, to: article.sectionPath } : null,
    { label: article.title },
  ].filter(Boolean);

  return (
    <div className="article-page">
      <style>{`
        .article-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: var(--imcro-color-text);
          background: var(--imcro-color-bg);
          font-family: Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .article-main { flex: 1; }
        .article-shell {
          width: min(980px, calc(100% - 32px));
          margin: 0 auto;
          padding: 34px 0 64px;
        }
        .article-media {
          width: 100%;
          overflow: hidden;
          position: relative;
          margin-bottom: 18px;
          border: 1px solid var(--imcro-color-border);
          border-radius: var(--imcro-radius-card);
          background: rgba(31,80,115,0.08);
          box-shadow: var(--imcro-shadow-card);
        }
        .article-media img {
          width: 100%;
          max-height: 460px;
          object-fit: cover;
          display: block;
        }
        .article-card {
          border: 1px solid var(--imcro-color-border);
          border-radius: var(--imcro-radius-card);
          background: var(--imcro-color-surface);
          padding: 22px;
          box-shadow: var(--imcro-shadow-card);
        }
        .article-back {
          min-height: 42px;
          margin-top: 22px;
          border: 1px solid var(--imcro-color-border);
          border-radius: var(--imcro-radius-button);
          padding: 0 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          background: var(--imcro-color-primary);
          font: inherit;
          font-size: 14px;
          font-weight: 800;
          cursor: pointer;
        }
        .article-md { line-height: 1.8; color: #334155; overflow-wrap: anywhere; }
        .article-md > * + * { margin-top: 14px; }
        .article-md h1, .article-md h2, .article-md h3 { color: #0F172A; line-height: 1.25; }
        .article-md ul, .article-md ol { padding-left: 22px; }
        .article-md img { max-width: 100%; border-radius: 12px; }
        .article-md figure { margin: 22px 0; }
        .article-md figcaption { margin-top: 8px; color: #64748B; font-size: 13px; text-align: center; }
        .article-md blockquote { border-left: 4px solid var(--imcro-color-primary); background: rgba(31,80,115,0.08); color: var(--imcro-color-primary); padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 18px 0; }
        .article-md table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .article-md td, .article-md th { border: 1px solid #CBD5E1; padding: 8px 10px; }
        .article-md [data-font-size-span="true"] { line-height: 1.2; }
        .article-pin {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 42px;
          height: 42px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          color: #fff;
          background: rgba(31, 80, 115, .84);
          border: 1px solid rgba(255,255,255,.5);
          box-shadow: 0 12px 30px rgba(15,23,42,.28);
          backdrop-filter: blur(10px);
        }
        .article-pin svg { width: 22px; height: 22px; fill: currentColor; }
        @media (min-width: 720px) {
          .article-shell { width: min(980px, calc(100% - 96px)); padding-top: 46px; }
          .article-card { padding: 30px; }
        }
      `}</style>
      <Header currentUser={currentUser} onGoAuth={onGoAuth} onGoAdmin={onGoAdmin} onGoProfile={onGoProfile} />

      <main className="article-main">
        <div className="article-shell">
          <Breadcrumbs items={breadcrumbs} />

          {heroImage && (
            <div className="article-media">
              <img src={heroImage} alt={article.title} />
              {article.is_pinned && <PinnedBadge />}
            </div>
          )}

          <section className="article-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              {article.category && <Badge label={article.category} color={article.categoryColor} bg={article.categoryBg} />}
              <span style={{ fontSize: 13, color: "#94A3B8" }}>{getDate(article)}</span>
              {article.author && (
                <button
                  type="button"
                  onClick={() => onOpenAuthor?.(article)}
                  style={{ border: 0, background: "transparent", color: "#1F5073", font: "700 13px/1.4 inherit", padding: 0, cursor: "pointer" }}
                >
                  {article.author}
                </button>
              )}
            </div>

            <h1 style={{ fontSize: "clamp(28px, 7vw, 44px)", fontWeight: 800, color: "#0F172A", lineHeight: 1.2, margin: "0 0 14px" }}>
              {article.title}
            </h1>
            {article.lead && <p style={{ margin: "0 0 18px", fontSize: 18, color: "#475569", lineHeight: 1.65, fontWeight: 650 }}>{article.lead}</p>}

            <div className="article-md" style={{ fontSize: 15 }}>
              {bodyHtml ? <div dangerouslySetInnerHTML={{ __html: bodyHtml }} /> : <StaticContent article={article} />}
            </div>

            {Boolean(article.attachments?.length) && (
              <section style={{ marginTop: 26, paddingTop: 16, borderTop: "1px solid #E2E8F0", display: "grid", gap: 10 }}>
                <strong style={{ color: "#0F172A" }}>Файлы к статье</strong>
                {article.attachments.map((file, index) => (
                  <a key={`${file.url || file.name}-${index}`} href={file.url} target="_blank" rel="noreferrer" style={{ color: "#1F5073", fontWeight: 700, overflowWrap: "anywhere" }}>
                    {file.name || "Документ"}{file.type ? ` · ${file.type}` : ""}
                  </a>
                ))}
              </section>
            )}
            {onBack && (
              <button className="article-back" type="button" onClick={onBack}>
                Вернуться назад
              </button>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
