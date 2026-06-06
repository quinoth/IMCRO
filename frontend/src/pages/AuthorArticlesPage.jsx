import { useLocation, useParams } from "react-router-dom";
import Header from "../features/nav/Header.jsx";
import Footer from "../components/Footer.jsx";
import NewsCard from "../features/news/NewsCard.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";

function guessAuthorName(authorKey, items, fallback) {
  if (fallback) return fallback;
  const found = items.find((item) => item.authorKey === authorKey);
  return found?.author || "Автор";
}

export default function AuthorArticlesPage({
  currentUser,
  onGoAuth,
  onGoAdmin,
  onGoProfile,
  allNews = [],
  onOpenArticle,
}) {
  const { authorKey } = useParams();
  const location = useLocation();
  const authorName = guessAuthorName(authorKey || "", allNews, location.state?.authorName);
  const authorNews = allNews.filter((item) => item.authorKey === authorKey);

  return (
    <div className="author-page">
      <style>{`
        .author-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: var(--imcro-color-text);
          background: var(--imcro-color-bg);
          font-family: Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }
        .author-main { flex: 1; }
        .author-shell {
          width: min(var(--imcro-container-max, 1280px), calc(100% - 32px));
          margin: 0 auto;
          padding: 34px 0 64px;
        }
        .author-hero,
        .author-empty {
          border: 1px solid var(--imcro-color-border);
          border-radius: var(--imcro-radius-card);
          background: var(--imcro-color-surface);
          box-shadow: var(--imcro-shadow-card);
        }
        .author-hero {
          padding: 22px;
          margin-bottom: 18px;
        }
        .author-kicker {
          width: fit-content;
          padding: 7px 11px;
          border-radius: 999px;
          background: rgba(31,80,115,0.08);
          color: var(--imcro-color-primary);
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .04em;
          margin-bottom: 12px;
        }
        .author-hero h1 {
          margin: 0 0 10px;
          color: var(--imcro-color-text);
          font-size: clamp(30px, 9vw, 60px);
          line-height: 1;
        }
        .author-hero p,
        .author-empty {
          color: var(--imcro-color-text-muted);
          font-size: 16px;
          line-height: 1.6;
          font-weight: 650;
        }
        .author-grid {
          display: grid;
          gap: var(--imcro-gutter);
          grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
        }
        .author-empty {
          padding: 18px;
          margin-top: 18px;
        }
        @media (min-width: 720px) {
          .author-shell {
            width: min(var(--imcro-container-max, 1280px), calc(100% - 96px));
            padding-top: 46px;
          }
          .author-hero { padding: 34px; }
        }
      `}</style>
      <Header currentUser={currentUser} onGoAuth={onGoAuth} onGoAdmin={onGoAdmin} onGoProfile={onGoProfile} />
      <main className="author-main">
        <div className="author-shell">
          <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Новости", to: "/novosti/" }, { label: authorName }]} />
          <section className="author-hero">
            <div className="author-kicker">Автор</div>
            <h1>{authorName}</h1>
            <p>Все публикации автора на сайте.</p>
          </section>
          <div className="author-grid">
            {authorNews.map((item) => (
              <NewsCard key={item.id} news={item} onClick={() => onOpenArticle?.(item)} />
            ))}
          </div>
          {!authorNews.length && (
            <div className="author-empty">
              У этого автора пока нет опубликованных материалов.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
