import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import ArticlePage from "./pages/ArticlePage.jsx";
import AuthorArticlesPage from "./pages/AuthorArticlesPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import Smart404 from "./pages/Smart404.jsx";
import TpmpkZapisPage from "./pages/TpmpkZapisPage.jsx";
import TpmpkAdmin from "./pages/admin/tpmpk/TpmpkAdmin.jsx";
import DomUchitelyaAdmin from "./pages/admin/domUchitelya/DomUchitelyaAdmin.jsx";
import {
  CommonNewsPage,
  DomUchitelyaNewsPage,
  DomUchitelyaStaticPage,
} from "./pages/domUchitelya/DomUchitelyaPages.jsx";
import { DOMU_SECTIONS } from "./pages/domUchitelya/domuSections.js";
import {
  ArchivHomePage,
  ArchivSectionPage,
  DeyatelnostSectionPage,
  HubHomeRoutePage,
  KonkursySectionPage,
  NokoHomePage,
  NokoSectionPage,
} from "./pages/hubs/HubPages.jsx";
import { HUB_HOME_PAGE_ROUTES } from "./pages/hubs/hubHomeConfig.js";
import { getMethodikaArticleBackPath } from "./pages/hubs/hubUtils.js";
import { SectionRoutePage } from "./pages/sections/SectionPages.jsx";
import { SECTION_PAGE_ROUTES } from "./pages/sections/sectionStructure.js";
import SvedeniyaPage from "./pages/SvedeniyaPage.jsx";
import BlankiPage from "./pages/tpmpk/BlankiPage.jsx";
import DlyaPedagogovPage from "./pages/tpmpk/DlyaPedagogovPage.jsx";
import DlyaRoditeleyPage from "./pages/tpmpk/DlyaRoditeleyPage.jsx";
import DokumentyPage from "./pages/tpmpk/DokumentyPage.jsx";
import FaqPage from "./pages/tpmpk/FaqPage.jsx";
import GrafikPage from "./pages/tpmpk/GrafikPage.jsx";
import KontaktyPage from "./pages/tpmpk/KontaktyPage.jsx";
import NpaPage from "./pages/tpmpk/NpaPage.jsx";
import SostavPage from "./pages/tpmpk/SostavPage.jsx";
import ChatBot from "./components/ChatBot.jsx";
import { API_BASE } from "./constants/index.js";
import {
  ARCHIV_ROUTES,
  DEYATELNOST_ROUTES,
  KONKURSY_ROUTES,
  METHODIKA_STATIC_PAGES,
  NOKO_ROUTES,
  methodikaSubjectSlug,
  resolveArticleLocation,
  resolveArticleSectionLabel,
} from "./features/admin/articleTaxonomy.js";
import { htmlToPlainText } from "./features/admin/articleEditorContent.js";
import { canAccessAdmin, canAccessDomuAdmin, canAccessTpmpkAdmin, clearStoredUser, getStoredUser, storeUser } from "./auth.js";

function ScrollToTop() {
  const { pathname } = useLocation();
  const previousPathRef = useRef(pathname);

  useEffect(() => {
    const previousPath = previousPathRef.current;
    previousPathRef.current = pathname;

    if (previousPath.startsWith("/sveden") && pathname.startsWith("/sveden")) {
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const CATEGORY_STYLE = {
  "Мероприятия": { categoryColor: "#fff", categoryBg: "rgba(255,255,255,0.18)" },
  "Курсы": { categoryColor: "#1F5073", categoryBg: "rgba(31,80,115,0.08)" },
  "Достижения": { categoryColor: "#059669", categoryBg: "#ECFDF5" },
  "Новости": { categoryColor: "#D97706", categoryBg: "#FFFBEB" },
  "Проекты": { categoryColor: "#2563EB", categoryBg: "#EFF6FF" },
  "Семинары": { categoryColor: "#D97706", categoryBg: "#FFFBEB" },
  "События": { categoryColor: "#059669", categoryBg: "#ECFDF5" },
};

CATEGORY_STYLE["Новости"] = CATEGORY_STYLE["Новости"] || { categoryColor: "#D97706", categoryBg: "#FFFBEB" };
CATEGORY_STYLE["Дом учителя"] = { categoryColor: "#047857", categoryBg: "#ECFDF5" };
CATEGORY_STYLE["Методическое пространство"] = { categoryColor: "#1D4ED8", categoryBg: "#EFF6FF" };
CATEGORY_STYLE["НОКО"] = { categoryColor: "#1F5073", categoryBg: "rgba(31,80,115,0.08)" };
CATEGORY_STYLE["Олимпиады и конкурсы"] = { categoryColor: "#B45309", categoryBg: "#FEF3C7" };
CATEGORY_STYLE["Деятельность"] = { categoryColor: "#0369A1", categoryBg: "#E0F2FE" };
CATEGORY_STYLE["Архив"] = { categoryColor: "#374151", categoryBg: "#F3F4F6" };

const DEFAULT_CATEGORIES = [
  { id: 1, name: "Мероприятия" },
  { id: 2, name: "Курсы" },
  { id: 3, name: "Достижения" },
  { id: 4, name: "Новости" },
  { id: 5, name: "Проекты" },
  { id: 6, name: "Семинары" },
];

const FALLBACK_IMAGES = [
  "/images/news1.jpg",
  "/images/news2.jpg",
  "/images/news3.jpg",
  "/images/news4.jpg",
];
const ARTICLES_STORAGE_KEY = "mky_articles";
const LEGACY_ARTICLE_STORAGE_KEYS = [
  ARTICLES_STORAGE_KEY,
  "mky_news",
  "mky_admin_articles",
  "mky_admin_news",
  "admin_articles",
  "admin_news",
  "articles",
  "news",
  "mky_events",
  "mky_calendar_events",
  "mky_admin_events",
  "admin_events",
  "events",
  "calendar_events",
];
const LEGACY_DEMO_ARTICLE_SLUGS = new Set([
  "gorodskoy-semeynyy-universitet",
  "kursy-pk-shkolnyy-teatr",
  "otkrytaya-vstrecha-v-dome-uchitelya",
]);

function normalizePublicRoute(path) {
  if (!path) return "";
  const cleanPath = String(path).split("#")[0].split("?")[0] || "/";
  return cleanPath === "/" ? "/" : cleanPath.endsWith("/") ? cleanPath : `${cleanPath}/`;
}

const SECTION_DETAIL_ROUTES = SECTION_PAGE_ROUTES.filter(({ path, node }) => (
  node.level >= 2
  && !normalizePublicRoute(path).startsWith("/tpmpk/")
));

const SECTION_DETAIL_ROUTE_PATHS = new Set(
  SECTION_DETAIL_ROUTES.map(({ path }) => normalizePublicRoute(path)),
);

const LEGACY_NOKO_SECTION_ROUTES = NOKO_ROUTES.filter((section) => (
  !SECTION_DETAIL_ROUTE_PATHS.has(normalizePublicRoute(section.path))
));

const LEGACY_METHODIKA_REDIRECTS = METHODIKA_STATIC_PAGES.map((page) => ({
  path: page.path,
  to: page.path.includes("/rekomendacii/")
    ? "/predmetnye-oblasti/metodicheskie-materialy/"
    : "/metodicheskoe-prostranstvo/",
}));

function simpleSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function getAuthorLabel(item) {
  const fio = [
    item.last_name || item.lastName,
    item.first_name || item.firstName,
    item.middle_name || item.middleName,
  ].filter(Boolean).join(" ");
  return item.author_full_name || item.full_name || item.fullName || fio || item.author_name || item.author || (item.author_id ? `Автор #${item.author_id}` : "Редакция ИМЦРО");
}

function getAuthorKey(item) {
  if (item.author_key) return item.author_key;
  if (item.author_id) return `id-${item.author_id}`;
  return `name-${simpleSlug(getAuthorLabel(item) || "author")}`;
}

function stripMkyPrefix(path) {
  return typeof path === "string" ? path.replace(new RegExp("^/" + "mky" + "(?=/)"), "") : path;
}

function isLegacyDemoArticle(article) {
  const slug = String(article?.slug || article?.id || "").trim();
  return LEGACY_DEMO_ARTICLE_SLUGS.has(slug);
}

function removeLegacyDemoArticles(items) {
  return Array.isArray(items) ? items.filter((article) => !isLegacyDemoArticle(article)) : [];
}

function clearLegacyArticleStorage() {
  try {
    for (const key of LEGACY_ARTICLE_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // Storage can be unavailable in private mode.
  }
}

function getStoredArticles() {
  clearLegacyArticleStorage();
  return [];
}

function persistArticles() {
  clearLegacyArticleStorage();
}

function getNewsSortValue(item) {
  const raw = item.dateSortValue || item.updatedAt || item.createdAt || item.date || "";
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return parsed;
  return Number(item.articleId || item.id || 0);
}

function sortNewsByDateDesc(items) {
  return [...items].sort((left, right) => {
    if (Boolean(left.is_pinned) !== Boolean(right.is_pinned)) return left.is_pinned ? -1 : 1;
    return getNewsSortValue(right) - getNewsSortValue(left);
  });
}

function articleToNewsItem(article) {
  const catObj = DEFAULT_CATEGORIES.find((category) => article.categories?.includes(category.id));
  const catName = resolveArticleSectionLabel(article) || catObj?.name || "Новости";
  const style = CATEGORY_STYLE[catName] ?? CATEGORY_STYLE["Новости"];
  const location = resolveArticleLocation(article);
  const heroBlock = article.blocks?.find((block) => block.type === "hero");
  const paraBlock = article.blocks?.find((block) => block.type === "paragraph");
  const imgBlock = article.blocks?.find((block) => block.type === "image" || block.type === "imagetext");
  const excerpt = article.lead || heroBlock?.data?.intro || article.excerpt || paraBlock?.data?.text || htmlToPlainText(article.body || "") || "";
  const image = stripMkyPrefix(article.cover_image_url || imgBlock?.data?.url || article.image) || FALLBACK_IMAGES[(article.id - 1) % FALLBACK_IMAGES.length];

  return {
    id: article.slug || `admin-${article.id}`,
    articleId: article.id,
    slug: article.slug,
    date: article.updatedAt || article.createdAt || "",
    dateSortValue: article.publishedAt || article.published_at || article.updatedAt || article.createdAt || "",
    category: catName,
    categoryColor: style.categoryColor,
    categoryBg: style.categoryBg,
    title: article.title,
    excerpt: String(excerpt).slice(0, 220),
    image: stripMkyPrefix(image),
    is_pinned: Boolean(article.is_pinned),
    body: article.body || "",
    lead: article.lead || article.excerpt || "",
    cover_image_url: stripMkyPrefix(article.cover_image_url || image),
    blocks: article.blocks || [],
    sections: article.sections || [],
    attachments: article.attachments || [],
    author: getAuthorLabel(article),
    author_id: article.author_id || null,
    author_name: article.author_name || article.author_full_name || article.full_name || article.fullName || "",
    author_full_name: article.author_full_name || article.full_name || article.fullName || "",
    author_first_name: article.author_first_name || article.first_name || article.firstName || "",
    author_last_name: article.author_last_name || article.last_name || article.lastName || "",
    author_middle_name: article.author_middle_name || article.middle_name || article.middleName || "",
    author_key: article.author_key || "",
    authorKey: getAuthorKey(article),
    parentLabel: location.parentLabel,
    parentPath: location.parentPath,
    sectionLabel: location.sectionLabel,
    sectionPath: location.sectionPath,
    publishing_scope: article.publishing_scope || "imcro_only",
    duplicate_to_main: Boolean(article.duplicate_to_main),
    duplicate_to_events: Boolean(article.duplicate_to_events),
    methodika_subject: article.methodika_subject || "",
    dom_uchitelya_section: article.dom_uchitelya_section || "",
    noko_section: article.noko_section || "",
    hub_kind: article.hub_kind || "",
    hub_path: article.hub_path || "",
    _isAdmin: true,
  };
}

function apiArticleToNewsItem(article) {
  return articleToNewsItem({
    ...article,
    id: article.id,
    createdAt: article.created_at,
    updatedAt: article.published_at || article.updated_at || article.created_at,
    publishedAt: article.published_at,
    author: article.author_full_name || article.full_name || article.author_name || "",
    author_name: article.author_name || article.author_full_name || article.full_name || "",
    author_full_name: article.author_full_name || article.author_name || "",
    full_name: article.author_full_name || article.full_name || article.author_name || "",
    first_name: article.author_first_name || "",
    last_name: article.author_last_name || "",
    middle_name: article.author_middle_name || "",
    author_key: article.author_key || "",
    author_id: article.author_id || null,
  });
}

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [articles, setArticles] = useState(() => getStoredArticles());
  const [apiCommonNews, setApiCommonNews] = useState([]);
  const [apiDomuNews, setApiDomuNews] = useState([]);
  const [apiEventsNews, setApiEventsNews] = useState([]);

  const currentUserFullName = useMemo(() => {
    const fio = [currentUser?.lastName, currentUser?.firstName, currentUser?.middleName].filter(Boolean).join(" ");
    return currentUser?.full_name || currentUser?.fullName || fio || currentUser?.author_name || currentUser?.email || "Редакция ИМЦРО";
  }, [currentUser]);

  useEffect(() => {
    persistArticles(articles);
  }, [articles]);

  const saveArticle = useCallback((article) => {
    const now = new Date().toISOString().slice(0, 10);
    setArticles((prev) => {
      const exists = prev.find((item) => item.id === article.id);
      const authorName = article.full_name || article.author_name || article.author || currentUserFullName;
      if (exists) {
        return prev.map((item) => item.id === article.id ? {
          ...item,
          ...article,
          updatedAt: now,
          author: authorName,
          author_name: authorName,
          full_name: authorName,
          author_id: article.author_id || item.author_id || currentUser?.id || null,
        } : item);
      }
      return [...prev, {
        ...article,
        publishing_scope: article.publishing_scope || "imcro_only",
        id: Date.now(),
        createdAt: now,
        updatedAt: now,
        author: authorName,
        author_name: authorName,
        full_name: authorName,
        author_id: article.author_id || currentUser?.id || null,
      }];
    });
  }, [currentUser?.id, currentUserFullName]);

  const deleteArticle = useCallback((id) => {
    setArticles((prev) => prev.filter((article) => article.id !== id));
  }, []);

  const changeArticleStatus = useCallback((id, status) => {
    setArticles((prev) => prev.map((article) =>
      article.id === id ? { ...article, status, updatedAt: new Date().toISOString().slice(0, 10) } : article
    ));
  }, []);

  const loadPublicNews = useCallback(async () => {
    try {
      const [commonRes, domuRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/api/news/`),
        fetch(`${API_BASE}/api/dom-uchitelya/news/`),
        fetch(`${API_BASE}/api/events/`),
      ]);
      if (commonRes.ok) {
        const data = await commonRes.json();
        setApiCommonNews(removeLegacyDemoArticles(data.items || []).map(apiArticleToNewsItem));
      } else {
        setApiCommonNews([]);
      }
      if (domuRes.ok) {
        const data = await domuRes.json();
        setApiDomuNews(removeLegacyDemoArticles(data.items || []).map(apiArticleToNewsItem));
      } else {
        setApiDomuNews([]);
      }
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setApiEventsNews(removeLegacyDemoArticles(data.items || []).map(apiArticleToNewsItem));
      } else {
        setApiEventsNews([]);
      }
    } catch {
      setApiCommonNews([]);
      setApiDomuNews([]);
      setApiEventsNews([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadPublicNews().finally(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [loadPublicNews]);

  const publishedNews = sortNewsByDateDesc(apiCommonNews);
  const eventsNews = sortNewsByDateDesc(apiEventsNews);
  const domuNews = sortNewsByDateDesc(apiDomuNews);
  const allPublicNews = useMemo(() => {
    const map = new Map();
    [...publishedNews, ...eventsNews, ...domuNews].forEach((item) => {
      if (!map.has(item.id)) map.set(item.id, item);
    });
    return [...map.values()];
  }, [publishedNews, eventsNews, domuNews]);

  const openArticle = useCallback((newsItem) => {
    navigate(`/article/${encodeURIComponent(newsItem.slug || newsItem.id)}`, { state: { article: newsItem } });
    window.scrollTo({ top: 0 });
  }, [navigate]);
  const openAuthor = useCallback((newsItem) => {
    navigate(`/authors/${encodeURIComponent(newsItem.authorKey || getAuthorKey(newsItem))}/`, {
      state: { authorName: getAuthorLabel(newsItem) },
    });
    window.scrollTo({ top: 0 });
  }, [navigate]);

  function ArticleRoute() {
    const { id } = useParams();
    const stateArticle = location.state?.article;
    const stateKey = stateArticle ? String(stateArticle.slug || stateArticle.id) : "";
    const freshArticle = allPublicNews.find((item) =>
      String(item.slug || item.id) === id
      || String(item.id) === id
      || (stateKey && (String(item.slug || item.id) === stateKey || String(item.id) === String(stateArticle.articleId || stateArticle.id)))
    );
    const article = freshArticle || stateArticle;
    if (!article) return <Navigate to="/" replace />;
    return (
      <ArticlePage
        article={article}
        onBack={() => navigate("/")}
        currentUser={currentUser}
        onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
        onGoAdmin={goAdmin}
        onGoProfile={() => navigate("/profile")}
        onOpenAuthor={openAuthor}
      />
    );
  }

  function MethodikaArticleRoute() {
    const { predmetSlug, articleSlug } = useParams();
    const stateArticle = location.state?.article;
    const stateKey = stateArticle ? String(stateArticle.slug || stateArticle.id) : "";
    const freshArticle = publishedNews.find((item) =>
      methodikaSubjectSlug(item.methodika_subject || "") === predmetSlug
      && (
        String(item.slug || item.id) === articleSlug
        || String(item.id) === articleSlug
        || (stateKey && (String(item.slug || item.id) === stateKey || String(item.id) === String(stateArticle.articleId || stateArticle.id)))
      )
    );
    const article = freshArticle || stateArticle;
    if (!article) return <Navigate to="/metodicheskoe-prostranstvo/" replace />;
    return (
      <ArticlePage
        article={article}
        onBack={() => navigate(getMethodikaArticleBackPath(article))}
        currentUser={currentUser}
        onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
        onGoAdmin={goAdmin}
        onGoProfile={() => navigate("/profile")}
        onOpenAuthor={openAuthor}
      />
    );
  }

  function RequireAuth({ children }) {
    if (!currentUser) {
      return <Navigate to="/auth?tab=login" replace state={{ from: location.pathname }} />;
    }
    return children;
  }

  function RequireAdmin({ children }) {
    if (!currentUser) {
      return <Navigate to="/auth?tab=login" replace state={{ from: location.pathname }} />;
    }
    if (!canAccessAdmin(currentUser)) {
      return <Navigate to="/profile?access=denied" replace />;
    }
    return children;
  }

  function RequireTpmpkAdmin({ children }) {
    if (!currentUser) {
      return <Navigate to="/auth?tab=login" replace state={{ from: location.pathname }} />;
    }
    if (!canAccessTpmpkAdmin(currentUser)) {
      return <Navigate to="/profile?access=denied" replace />;
    }
    return children;
  }

  function RequireDomuAdmin({ children }) {
    if (!currentUser) {
      return <Navigate to="/auth?tab=login" replace state={{ from: location.pathname }} />;
    }
    if (!canAccessDomuAdmin(currentUser)) {
      return <Navigate to="/profile?access=denied" replace />;
    }
    return children;
  }

  const handleLogin = useCallback((user) => {
    storeUser(user);
    setCurrentUser(user);
    navigate("/profile", { replace: true });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    clearStoredUser();
    setCurrentUser(null);
    navigate("/auth?tab=login", { replace: true });
  }, [navigate]);

  const adminTarget = canAccessAdmin(currentUser)
    ? "/admin"
    : canAccessDomuAdmin(currentUser)
      ? "/admin/dom-uchitelya/"
      : null;
  const goAdmin = adminTarget ? () => navigate(adminTarget) : null;

  const tpmpkPublicProps = {
    currentUser,
    onGoAuth: (tab) => navigate(`/auth?tab=${tab || "login"}`),
    onGoAdmin: goAdmin,
    onGoProfile: () => navigate("/profile"),
  };
  const publicPageProps = {
    currentUser,
    onGoAuth: (tab) => navigate(`/auth?tab=${tab || "login"}`),
    onGoAdmin: goAdmin,
    onGoProfile: () => navigate("/profile"),
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
              onGoAdmin={goAdmin}
              onGoProfile={() => navigate("/profile")}
              currentUser={currentUser}
              publishedNews={publishedNews}
              eventsNews={eventsNews}
              onOpenArticle={openArticle}
              onOpenAuthor={openAuthor}
            />
          }
        />
        <Route
          path="/auth"
          element={
            currentUser
              ? <Navigate to="/profile" replace />
              : <AuthPage onLogin={handleLogin} />
          }
        />
        <Route
          path="/admin/tpmpk/*"
          element={
            <RequireTpmpkAdmin>
              <TpmpkAdmin currentUser={currentUser} onLogout={handleLogout} />
            </RequireTpmpkAdmin>
          }
        />
        <Route
          path="/admin/dom-uchitelya/*"
          element={
            <RequireDomuAdmin>
              <DomUchitelyaAdmin
                currentUser={currentUser}
                articles={articles}
                saveArticle={saveArticle}
                deleteArticle={deleteArticle}
                changeArticleStatus={changeArticleStatus}
                onArticlesChanged={loadPublicNews}
                onLogout={handleLogout}
              />
            </RequireDomuAdmin>
          }
        />
        <Route
          path="/admin/*"
          element={
            <RequireAdmin>
              <AdminPage
                currentUser={currentUser}
                articles={articles}
                saveArticle={saveArticle}
                deleteArticle={deleteArticle}
                changeArticleStatus={changeArticleStatus}
                onArticlesChanged={loadPublicNews}
              />
            </RequireAdmin>
          }
        />
        <Route path="/article/:id" element={<ArticleRoute />} />
        <Route path="/novosti/" element={<CommonNewsPage {...publicPageProps} newsItems={publishedNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />} />
        <Route path="/dom-uchitelya/novosti/" element={<DomUchitelyaNewsPage {...publicPageProps} newsItems={domuNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />} />
        {DOMU_SECTIONS.filter((section) => section.path !== "/dom-uchitelya/novosti/").map((section) => (
          <Route key={section.path} path={section.path} element={<DomUchitelyaStaticPage {...publicPageProps} section={section} />} />
        ))}
        {LEGACY_METHODIKA_REDIRECTS.map((page) => (
          <Route
            key={page.path}
            path={page.path}
            element={<Navigate to={page.to} replace />}
          />
        ))}
        <Route path="/metodika/" element={<Navigate to="/metodicheskoe-prostranstvo/" replace />} />
        <Route path="/metodika/:predmetSlug/:articleSlug/" element={<MethodikaArticleRoute />} />
        <Route path="/metodika/:predmetSlug/" element={<Navigate to="/metodicheskoe-prostranstvo/" replace />} />

        <Route path="/noko/" element={<NokoHomePage {...publicPageProps} />} />
        {SECTION_DETAIL_ROUTES.map(({ path, node }) => (
          <Route
            key={path}
            path={path}
            element={<SectionRoutePage {...publicPageProps} node={node} newsItems={publishedNews} onOpenArticle={openArticle} />}
          />
        ))}
        {LEGACY_NOKO_SECTION_ROUTES.map((section) => (
          <Route
            key={section.path}
            path={section.path}
            element={<NokoSectionPage {...publicPageProps} section={section} newsItems={publishedNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />}
          />
        ))}

        {HUB_HOME_PAGE_ROUTES.filter((route) => route.path !== "/noko/").map((route) => (
          <Route
            key={route.path}
            path={route.path}
            element={<HubHomeRoutePage {...publicPageProps} config={route.config} />}
          />
        ))}

        {KONKURSY_ROUTES.map((section) => (
          <Route
            key={section.path}
            path={section.path}
            element={<KonkursySectionPage {...publicPageProps} section={section} newsItems={publishedNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />}
          />
        ))}

        {DEYATELNOST_ROUTES.map((section) => (
          <Route
            key={section.path}
            path={section.path}
            element={<DeyatelnostSectionPage {...publicPageProps} section={section} newsItems={publishedNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />}
          />
        ))}

        <Route path="/archiv/" element={<ArchivHomePage {...publicPageProps} />} />
        {ARCHIV_ROUTES.map((section) => (
          <Route
            key={section.path}
            path={section.path}
            element={<ArchivSectionPage {...publicPageProps} section={section} newsItems={publishedNews} onOpenArticle={openArticle} onOpenAuthor={openAuthor} />}
          />
        ))}
        <Route path="/authors/:authorKey/" element={<AuthorArticlesPage {...publicPageProps} allNews={allPublicNews} onOpenArticle={openArticle} />} />
        <Route
          path="/tpmpk/zapis"
          element={
            <TpmpkZapisPage
              currentUser={currentUser}
              onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
              onGoAdmin={goAdmin}
              onGoProfile={() => navigate("/profile")}
            />
          }
        />
        <Route
          path="/sveden/*"
          element={
            <SvedeniyaPage
              currentUser={currentUser}
              onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
              onGoAdmin={goAdmin}
              onGoProfile={() => navigate("/profile")}
            />
          }
        />
        <Route path="/tpmpk/dokumenty/" element={<DokumentyPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/blanki/" element={<BlankiPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/grafik/" element={<GrafikPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/sostav/" element={<SostavPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/npa/" element={<NpaPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/faq/" element={<FaqPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/dlya-roditeley/" element={<DlyaRoditeleyPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/dlya-pedagogov/" element={<DlyaPedagogovPage {...tpmpkPublicProps} />} />
        <Route path="/tpmpk/kontakty/" element={<KontaktyPage {...tpmpkPublicProps} />} />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfilePage
                user={currentUser}
                onBack={() => navigate("/")}
                onAdmin={goAdmin}
                onTpmpkAdmin={() => navigate("/admin/tpmpk")}
                onLogout={handleLogout}
              />
            </RequireAuth>
          }
        />
        <Route
          path="*"
          element={
            <Smart404
              currentUser={currentUser}
              onGoAuth={(tab) => navigate(`/auth?tab=${tab || "login"}`)}
              onGoAdmin={goAdmin}
              onGoProfile={() => navigate("/profile")}
            />
          }
        />
      </Routes>
      {!location.pathname.startsWith("/admin") && <ChatBot />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppRoutes />
    </BrowserRouter>
  );
}
