import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import FeaturedCard from "./FeaturedCard.jsx";
import NewsCard from "./NewsCard.jsx";

const NEWS_PER_PAGE = 8;

export default function NewsFeed({ publishedNews, onOpenArticle, onOpenAuthor }) {
  const sectionRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [animKey, setAnimKey] = useState(0);
  const allNewsItems = useMemo(() => publishedNews || [], [publishedNews]);
  const pageCount = Math.max(1, Math.ceil(allNewsItems.length / NEWS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, pageCount);

  const startIndex = (safeCurrentPage - 1) * NEWS_PER_PAGE;
  const newsItems = allNewsItems.slice(startIndex, startIndex + NEWS_PER_PAGE);
  const featured = newsItems[0];
  const cards = newsItems.slice(1);

  function switchPage(nextPage) {
    setCurrentPage(nextPage);
    setAnimKey((prev) => prev + 1);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section
      ref={sectionRef}
      style={{ position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #FFFFFF 0%, #F1F7FD 100%)", padding: "62px 24px" }}
    >
      <style>{`
        .news-container { max-width: 1200px; margin: 0 auto; width: 100%; }
        .news-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 360px)); gap: 18px; justify-content: center; align-items: stretch; }
        .news-feature-cell { min-height: 420px; width: 100%; max-width: 740px; animation: newsSlideIn .38s cubic-bezier(.2,.8,.2,1); }
        .news-card-cell { width: 100%; max-width: 360px; animation: newsSlideIn .38s cubic-bezier(.2,.8,.2,1); }
        .news-pagination { margin-top: 24px; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
        .news-page-btn {
          min-width: 36px;
          height: 36px;
          border: 1px solid #d8e5f4;
          border-radius: 10px;
          background: #fff;
          color: #334155;
          font: 700 13px/1 inherit;
          cursor: pointer;
          padding: 0 10px;
          transition: all 0.16s ease;
        }
        .news-page-btn:hover:not(:disabled) {
          border-color: #9dc5f4;
          color: #0b63ce;
          background: #f5f9ff;
        }
        .news-page-btn:disabled { opacity: 0.5; cursor: default; }
        .news-page-btn.active {
          border-color: #0b63ce;
          background: #0b63ce;
          color: #fff;
        }
        @keyframes newsSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (min-width: 900px) {
          .news-layout { grid-template-columns: repeat(3, minmax(0, 1fr)); justify-content: stretch; }
          .news-feature-cell { grid-column: span 2; max-width: none; }
          .news-card-cell { max-width: none; }
        }
      `}</style>
      <div className="news-container">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22, gap: 16, flexWrap: "wrap" }}>
          <h2 style={{ fontSize: "clamp(28px, 7vw, 42px)", fontWeight: 800, color: "#0F172A", letterSpacing: 0, lineHeight: 1 }}>Новости</h2>
          <Link to="/novosti/" style={{ fontSize: 14, fontWeight: 700, color: "#1D4ED8", textDecoration: "none" }}>Все новости</Link>
        </div>

        {!featured && (
          <div className="unified-empty-state">
            Материалы пока не опубликованы
          </div>
        )}

        {featured && <div className="news-layout" key={animKey}>
          {featured && (
            <div className="news-feature-cell">
              <FeaturedCard news={featured} onClick={() => onOpenArticle?.(featured)} onAuthorClick={onOpenAuthor} />
            </div>
          )}
          {cards.map((news) => (
            <div className="news-card-cell" key={news.id}>
              <NewsCard news={news} onClick={() => onOpenArticle?.(news)} onAuthorClick={onOpenAuthor} />
            </div>
          ))}
        </div>}

        {pageCount > 1 && (
          <div className="news-pagination" aria-label="Пагинация новостей">
            <button
              type="button"
              className="news-page-btn"
              onClick={() => switchPage(Math.max(1, safeCurrentPage - 1))}
              disabled={safeCurrentPage === 1}
              aria-label="Предыдущая страница"
            >
              ←
            </button>

            {Array.from({ length: pageCount }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`news-page-btn${page === safeCurrentPage ? " active" : ""}`}
                onClick={() => switchPage(page)}
                aria-current={page === safeCurrentPage ? "page" : undefined}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="news-page-btn"
              onClick={() => switchPage(Math.min(pageCount, safeCurrentPage + 1))}
              disabled={safeCurrentPage === pageCount}
              aria-label="Следующая страница"
            >
              →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
