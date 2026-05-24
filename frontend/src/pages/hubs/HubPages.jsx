import { Link, useNavigate, useParams } from "react-router-dom";
import Header from "../../features/nav/Header.jsx";
import Footer from "../../components/Footer.jsx";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import NewsCard from "../../features/news/NewsCard.jsx";
import {
  ARCHIV_ROUTES,
  DEYATELNOST_ROUTES,
  KONKURSY_ROUTES,
  METHODIKA_STATIC_PAGES,
  METHODIKA_SUBJECT_CARDS,
  NOKO_ROUTES,
  methodikaSubjectBySlug,
} from "../../features/admin/articleTaxonomy.js";

function HubShell({ currentUser, onGoAuth, onGoAdmin, onGoProfile, children }) {
  return (
    <div className="hub-page">
      <HubStyles />
      <Header currentUser={currentUser} onGoAuth={onGoAuth} onGoAdmin={onGoAdmin} onGoProfile={onGoProfile} />
      <main className="hub-main">{children}</main>
      <Footer />
    </div>
  );
}

function HubStyles() {
  return (
    <style>{`
      .hub-page { min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(180deg, #fbfdff 0%, #f4f7fb 52%, #eef4fb 100%); color: #0f172a; }
      .hub-main { flex: 1; }
      .hub-shell { width: min(var(--app-page-max, 1180px), calc(100% - 28px)); margin: 0 auto; padding: 34px 0 68px; }
      .hub-hero, .hub-card { border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; box-shadow: 0 18px 50px rgba(15, 23, 42, .06); }
      .hub-hero { padding: 20px; }
      .hub-eyebrow { width: fit-content; padding: 7px 11px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 12px; }
      .hub-hero h1 { font-size: clamp(30px, 9vw, 60px); line-height: 1; margin: 0 0 10px; letter-spacing: 0; }
      .hub-hero p { margin: 0; color: #475569; font-size: 16px; line-height: 1.62; font-weight: 650; }
      .hub-grid, .hub-news-grid, .methodika-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); justify-content: stretch; gap: 14px; margin-top: 18px; width: 100%; }
      .hub-link { display: grid; gap: 10px; min-height: 128px; color: inherit; text-decoration: none; padding: 18px; }
      .hub-link h3 { margin: 0; font-size: 20px; line-height: 1.2; }
      .hub-link p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.45; font-weight: 700; }
      .hub-open { margin-top: auto; width: fit-content; min-height: 36px; border-radius: 8px; background: #ecfdf5; color: #047857; display: inline-flex; align-items: center; padding: 0 12px; font-size: 13px; font-weight: 900; }
      .hub-card, .hub-open { transition: transform var(--app-transition), border-color var(--app-transition), box-shadow var(--app-transition), background-color var(--app-transition), color var(--app-transition); }
      .hub-card:hover { transform: translateY(-2px); border-color: var(--app-border-strong); box-shadow: 0 20px 46px rgba(30, 58, 138, .1); }
      .hub-card:hover .hub-open { background: #1e3a8a; color: #fff; }
      .hub-empty { border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; color: #475569; padding: 18px; font-weight: 750; line-height: 1.55; margin-top: 18px; width: 100%; }
      .hub-section-head { margin: 30px 0 14px; display: flex; align-items: end; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .hub-section-head h2 { margin: 0; font-size: clamp(24px, 6vw, 40px); line-height: 1.08; }
      .methodika-card { display: grid; gap: 10px; padding: 18px; min-height: 176px; }
      .methodika-card h3 { margin: 0; font-size: 20px; line-height: 1.2; }
      .methodika-card p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.45; font-weight: 700; }
      .methodika-metrics { display: grid; gap: 4px; color: #334155; font-size: 13px; font-weight: 800; }
      @media (min-width: 720px) {
        .hub-shell { width: min(var(--app-page-max, 1180px), calc(100% - 44px)); padding-top: 46px; }
      }
      @media (max-width: 520px) {
        .hub-shell { width: min(100% - 24px, var(--app-page-max, 1180px)); }
      }
    `}</style>
  );
}

function formatDate(value) {
  if (!value) return "Нет публикаций";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Нет публикаций";
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function HubNewsList({ title, newsItems, onOpenArticle, onOpenAuthor }) {
  return (
    <section>
      <div className="hub-section-head">
        <h2>{title}</h2>
      </div>
      <div className="hub-news-grid">
        {newsItems.map((item) => (
          <NewsCard key={item.id} news={item} onClick={() => onOpenArticle?.(item)} onAuthorClick={onOpenAuthor} />
        ))}
      </div>
      {!newsItems.length && <div className="hub-empty">В этом разделе пока нет опубликованных материалов.</div>}
    </section>
  );
}

function HubSectionLayout({ title, lead, homePath, homeLabel, children, ...props }) {
  return (
    <HubShell {...props}>
      <div className="hub-shell">
        <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: homeLabel, to: homePath }, { label: title }]} />
        <section className="hub-hero">
          <span className="hub-eyebrow">{homeLabel}</span>
          <h1>{title}</h1>
          <p>{lead}</p>
        </section>
        {children}
      </div>
    </HubShell>
  );
}

export function MethodikaHomePage({ newsItems = [], ...props }) {
  const cards = METHODIKA_SUBJECT_CARDS.map((subject) => {
    const related = newsItems.filter((item) => item.methodika_subject === subject.name);
    return { subject, related };
  });
  return (
    <HubShell {...props}>
      <div className="hub-shell">
        <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Методическое пространство" }]} />
        <section className="hub-hero">
          <span className="hub-eyebrow">Методическое пространство</span>
          <h1>Методическое пространство</h1>
          <p>Предметные кабинеты, методический совет, рекомендации и материалы для педагогов собраны в едином аккуратном разделе.</p>
        </section>
        <div className="methodika-grid">
          {cards.map(({ subject, related }) => (
            <Link key={subject.slug} className="hub-card methodika-card" to={`/metodika/${subject.slug}/`}>
              <h3>{subject.name}</h3>
              <p>{subject.methodist}</p>
              <div className="methodika-metrics">
                <span>Материалов: {related.length}</span>
                <span>Обновление: {formatDate(related[0]?.dateSortValue || related[0]?.date)}</span>
              </div>
              <span className="hub-open">Перейти</span>
            </Link>
          ))}
        </div>
        <div className="hub-section-head">
          <h2>Дополнительные разделы</h2>
        </div>
        <div className="hub-grid">
          {METHODIKA_STATIC_PAGES.map((page) => (
            <Link key={page.path} className="hub-card hub-link" to={page.path}>
              <h3>{page.title}</h3>
              <p>{page.lead}</p>
              <span className="hub-open">Открыть</span>
            </Link>
          ))}
        </div>
      </div>
    </HubShell>
  );
}

export function MethodikaSubjectPage({ newsItems = [], ...props }) {
  const navigate = useNavigate();
  const { predmetSlug } = useParams();
  const subjectName = methodikaSubjectBySlug(predmetSlug || "");
  const subjectNews = newsItems.filter((item) => item.methodika_subject === subjectName);

  if (!subjectName) {
    return (
      <HubSectionLayout {...props} title="Раздел не найден" lead="Проверьте адрес предметного кабинета." homePath="/metodika/" homeLabel="Методическое пространство" />
    );
  }

  return (
    <HubSectionLayout
      {...props}
      title={subjectName}
      lead={`Материалы предметного кабинета: ${subjectName}.`}
      homePath="/metodika/"
      homeLabel="Методическое пространство"
    >
      <HubNewsList
        title="Материалы кабинета"
        newsItems={subjectNews}
        onOpenAuthor={props.onOpenAuthor}
        onOpenArticle={(article) => navigate(`/metodika/${predmetSlug}/${article.slug || article.id}/`, { state: { article } })}
      />
    </HubSectionLayout>
  );
}

export function MethodikaStaticPage({ page, newsItems = [], ...props }) {
  const items = newsItems.filter((item) => item.hub_kind === "methodika" && item.hub_path === page.path.split("/").filter(Boolean).slice(1).join("/"));
  return (
    <HubSectionLayout {...props} title={page.title} lead={page.lead} homePath="/metodika/" homeLabel="Методическое пространство">
      <HubNewsList title="Материалы раздела" newsItems={items} onOpenArticle={props.onOpenArticle} onOpenAuthor={props.onOpenAuthor} />
    </HubSectionLayout>
  );
}

function GenericHubHome({ eyebrow, title, lead, sections, ...props }) {
  return (
    <HubShell {...props}>
      <div className="hub-shell">
        <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: title }]} />
        <section className="hub-hero">
          <span className="hub-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{lead}</p>
        </section>
        <div className="hub-grid">
          {sections.map((section) => (
            <Link key={section.path} className="hub-card hub-link" to={section.path}>
              <h3>{section.title}</h3>
              <p>{section.lead}</p>
              <span className="hub-open">Открыть</span>
            </Link>
          ))}
        </div>
      </div>
    </HubShell>
  );
}

function GenericHubSection({ homePath, homeLabel, section, newsItems = [], kind, sectionField = "hub_path", ...props }) {
  const items = newsItems.filter((item) => {
    if (kind === "noko") return item.noko_section === section.value;
    return item.hub_kind === kind && item[sectionField] === section.value;
  });
  return (
    <HubSectionLayout {...props} homePath={homePath} homeLabel={homeLabel} title={section.title} lead={section.lead}>
      <HubNewsList title="Новости и материалы" newsItems={items} onOpenArticle={props.onOpenArticle} onOpenAuthor={props.onOpenAuthor} />
    </HubSectionLayout>
  );
}

export function NokoHomePage(props) {
  return <GenericHubHome {...props} eyebrow="НОКО" title="Независимая оценка качества образования" lead="Раздел НОКО: оперативная информация, ГИА и тематические сборники." sections={NOKO_ROUTES} />;
}

export function NokoSectionPage({ section, ...props }) {
  return <GenericHubSection {...props} homePath="/noko/" homeLabel="НОКО" section={section} kind="noko" />;
}

export function KonkursyHomePage(props) {
  return <GenericHubHome {...props} eyebrow="Олимпиады и конкурсы" title="Олимпиады и конкурсы" lead="Календарь, результаты и тематические направления для обучающихся, педагогов и организаций." sections={KONKURSY_ROUTES} />;
}

export function KonkursySectionPage({ section, ...props }) {
  return <GenericHubSection {...props} homePath="/konkursy/" homeLabel="Олимпиады и конкурсы" section={section} kind="konkursy" />;
}

export function DeyatelnostHomePage(props) {
  return <GenericHubHome {...props} eyebrow="Деятельность" title="Деятельность" lead="Проекты и направления деятельности МКУ ИМЦРО." sections={DEYATELNOST_ROUTES} />;
}

export function DeyatelnostSectionPage({ section, ...props }) {
  return <GenericHubSection {...props} homePath="/deyatelnost/" homeLabel="Деятельность" section={section} kind="deyatelnost" />;
}

export function ArchivHomePage(props) {
  return <GenericHubHome {...props} eyebrow="Архив" title="Архив" lead="Архив материалов, аналитики и методических наработок прошлых лет." sections={ARCHIV_ROUTES} />;
}

export function ArchivSectionPage({ section, ...props }) {
  return <GenericHubSection {...props} homePath="/archiv/" homeLabel="Архив" section={section} kind="archiv" />;
}
