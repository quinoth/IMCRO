import { Link, useLocation, useParams } from "react-router-dom";
import Header from "../features/nav/Header.jsx";
import Footer from "../components/Footer.jsx";
import NewsCard from "../features/news/NewsCard.jsx";

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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#fbfdff 0%,#f4f7fb 52%,#eef4fb 100%)" }}>
      <Header currentUser={currentUser} onGoAuth={onGoAuth} onGoAdmin={onGoAdmin} onGoProfile={onGoProfile} />
      <main style={{ flex: 1, paddingTop: 72 }}>
        <div style={{ width: "min(1180px, calc(100% - 28px))", margin: "0 auto", padding: "28px 0 64px" }}>
          <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18, color: "#64748b", fontSize: 14, fontWeight: 800 }}>
            <Link to="/" style={{ color: "#1e3a8a", textDecoration: "none" }}>Главная</Link>
            <span>/</span>
            <Link to="/novosti/" style={{ color: "#1e3a8a", textDecoration: "none" }}>Новости</Link>
            <span>/</span>
            <span>{authorName}</span>
          </nav>
          <section style={{ border: "1px solid #dbe6f5", borderRadius: 8, background: "#fff", boxShadow: "0 18px 50px rgba(15,23,42,.06)", padding: 20, marginBottom: 18 }}>
            <div style={{ width: "fit-content", padding: "7px 11px", borderRadius: 999, background: "#ecfdf5", color: "#047857", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".04em", marginBottom: 12 }}>Автор</div>
            <h1 style={{ margin: "0 0 10px", fontSize: "clamp(30px, 9vw, 60px)", lineHeight: 1 }}>{authorName}</h1>
            <p style={{ margin: 0, color: "#475569", fontSize: 16, lineHeight: 1.62, fontWeight: 650 }}>Все публикации автора на сайте.</p>
          </section>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
            {authorNews.map((item) => (
              <NewsCard key={item.id} news={item} onClick={() => onOpenArticle?.(item)} />
            ))}
          </div>
          {!authorNews.length && (
            <div style={{ border: "1px solid #dbe6f5", borderRadius: 8, background: "#fff", color: "#475569", padding: 18, fontWeight: 750, lineHeight: 1.55, marginTop: 18 }}>
              У этого автора пока нет опубликованных материалов.
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
