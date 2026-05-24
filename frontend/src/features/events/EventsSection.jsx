import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

const EVENTS_PER_PAGE = 8;

export default function EventsSection({ eventsNews = [], onOpenArticle, onOpenAuthor }) {
  const sectionRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);

  const allItems = useMemo(() => {
    return eventsNews.map((news) => ({
      id: news.id,
      title: news.title,
      date: news.date,
      category: news.category,
      image: news.image,
      author: news.author,
      is_pinned: news.is_pinned,
      onClick: () => onOpenArticle?.(news),
      onAuthorClick: () => onOpenAuthor?.(news),
    }));
  }, [eventsNews, onOpenArticle, onOpenAuthor]);

  const pageCount = Math.max(1, Math.ceil(allItems.length / EVENTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, pageCount);

  const pageStart = (safeCurrentPage - 1) * EVENTS_PER_PAGE;
  const items = allItems.slice(pageStart, pageStart + EVENTS_PER_PAGE);

  function switchPage(nextPage) {
    setCurrentPage(nextPage);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <section
      id="calendar"
      ref={sectionRef}
      style={{ position: "relative", overflow: "hidden", background: "linear-gradient(145deg, #1E40AF 0%, #0284C7 100%)", padding: "72px 24px" }}
    >
      <style>{`
        .events-container { max-width: 1200px; margin: 0 auto; width: 100%; }
        .events-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 24px; }
        .events-title { font-size: clamp(24px, 6vw, 36px); font-weight: 800; color: #fff; letter-spacing: 0; margin: 0; }
        .events-all-link {
          height: 40px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.38);
          background: rgba(255,255,255,.14);
          color: #fff;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 0 14px;
          font: 750 13px/1 inherit;
          backdrop-filter: blur(10px);
          transition: transform .18s ease, background .18s ease, border-color .18s ease;
        }
        .events-all-link:hover {
          transform: translateY(-1px);
          background: rgba(255,255,255,.22);
          border-color: rgba(255,255,255,.55);
        }
        .events-all-link svg { width: 16px; height: 16px; }
        .events-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
        .event-card {
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          border: 1px solid rgba(255, 255, 255, 0.4);
          transition: transform 0.25s, box-shadow 0.25s;
          cursor: pointer;
        }
        .event-card:hover { transform: translateY(-4px); box-shadow: 0 16px 32px rgba(0,0,0,0.15); }
        .event-card-top { background-size: cover; background-position: center; height: 160px; border-bottom: 1px solid #E2E8F0; }
        .event-card-bottom { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .events-pagination { margin-top: 24px; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
        .events-page-btn {
          min-width: 36px;
          height: 36px;
          border: 1px solid rgba(255,255,255,.35);
          border-radius: 10px;
          background: rgba(255,255,255,.14);
          color: #fff;
          font: 700 13px/1 inherit;
          cursor: pointer;
          padding: 0 10px;
          transition: all .16s ease;
          backdrop-filter: blur(8px);
        }
        .events-page-btn:hover:not(:disabled) {
          background: rgba(255,255,255,.26);
          border-color: rgba(255,255,255,.65);
        }
        .events-page-btn:disabled { opacity: .45; cursor: default; }
        .events-page-btn.active {
          background: #fff;
          border-color: #fff;
          color: #1E40AF;
        }
        .events-empty {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(255, 255, 255, 0.56);
          border-radius: 12px;
          color: #1e3a8a;
          font-size: 16px;
          font-weight: 850;
          padding: 22px 24px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
        }
        @media (max-width: 560px) {
          .events-empty { padding: 18px; font-size: 15px; }
        }
      `}</style>
      <div className="events-container">
        <div className="events-head">
          <h2 className="events-title">Мероприятия / События</h2>
          <Link className="events-all-link" to="/deyatelnost/">
            <span>Все мероприятия</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m13 5 7 7-7 7" />
            </svg>
          </Link>
        </div>

        {items.length ? (
          <div className="events-grid">
            {items.map((event) => (
              <article key={event.id} className="event-card" onClick={event.onClick}>
                <div className="event-card-top" style={{ backgroundImage: `url(${event.image})` }} />
                <div className="event-card-bottom">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", background: "#EFF6FF", padding: "4px 10px", borderRadius: 12 }}>{event.category || "Событие"}</span>
                    <span style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>{event.date}</span>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0F172A", lineHeight: 1.35, margin: 0 }}>
                    {event.is_pinned ? "📌 " : ""}
                    {event.title}
                  </h3>
                  {event.author && (
                    <button
                      type="button"
                      onClick={(clickEvent) => {
                        clickEvent.stopPropagation();
                        event.onAuthorClick?.();
                      }}
                      style={{ border: 0, background: "transparent", color: "#1D4ED8", font: "700 12px/1.4 inherit", padding: 0, cursor: "pointer", textAlign: "left" }}
                    >
                      {event.author}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="events-empty">События пока не опубликованы.</div>
        )}

        {items.length > 0 && pageCount > 1 && (
          <div className="events-pagination" aria-label="Пагинация мероприятий">
            <button
              type="button"
              className="events-page-btn"
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
                className={`events-page-btn${page === safeCurrentPage ? " active" : ""}`}
                onClick={() => switchPage(page)}
                aria-current={page === safeCurrentPage ? "page" : undefined}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="events-page-btn"
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
