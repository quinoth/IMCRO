import { Link } from "react-router-dom";
import Footer from "../../components/Footer.jsx";
import Header from "../../features/nav/Header.jsx";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import NewsCard from "../../features/news/NewsCard.jsx";
import { DOMU_SECTIONS } from "./domuSections.js";

const contactCards = [
  { label: "Адрес", value: "ул. Литвинова, 14" },
  { label: "Телефон", value: "+7 (3952) 48-12-56" },
  { label: "Режим работы", value: "Пн-Пт: 9:00-17:00" },
];

const pageCopy = {
  "/dom-uchitelya/o-strukturnom-podrazdelenii/": {
    lead: "Дом учителя работает как городская площадка для встреч, обучения, обмена опытом и поддержки педагогического сообщества.",
    items: [
      "Профессиональное общение и поддержка педагогических инициатив.",
      "Городские встречи, семинары и методические события.",
      "Информация о руководителе и документах подразделения будет уточнена.",
    ],
  },
  "/dom-uchitelya/meropriyatiya/": {
    lead: "Раздел собирает ближайшие мероприятия Дома учителя: встречи клубов, мастер-классы, семинары и открытые обсуждения.",
    items: ["Городские методические события", "Клубные встречи педагогов", "Открытые лекции и практикумы"],
  },
  "/dom-uchitelya/kontaktnaya-informaciya/": {
    lead: "Контактная информация подразделения будет уточняться по мере актуализации официальных сведений.",
    items: ["Адрес: ул. Литвинова, 14", "Телефон: +7 (3952) 48-12-56", "Режим работы: Пн-Пт: 9:00-17:00"],
  },
};

function DomuShell({ currentUser, onGoAuth, onGoAdmin, onGoProfile, children }) {
  return (
    <div className="domu-page">
      <DomuStyles />
      <Header currentUser={currentUser} onGoAuth={onGoAuth} onGoAdmin={onGoAdmin} onGoProfile={onGoProfile} />
      <main className="domu-main">{children}</main>
      <Footer />
    </div>
  );
}

function DomuStyles() {
  return (
    <style>{`
      .domu-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        color: var(--imcro-color-text);
        background: var(--imcro-color-bg);
        font-family: Manrope, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .domu-main { flex: 1; }
      .domu-shell { width: min(var(--imcro-container-max, 1280px), calc(100% - 32px)); margin: 0 auto; padding: 34px 0 70px; }
      .domu-hero,
      .domu-content,
      .domu-card {
        border: 1px solid var(--imcro-color-border);
        border-radius: var(--imcro-radius-card);
        background: var(--imcro-color-surface);
        box-shadow: var(--imcro-shadow-card);
      }
      .domu-hero { overflow: hidden; }
      .domu-hero-grid { display: grid; gap: 0; }
      .domu-hero-copy { padding: 30px 20px; display: grid; gap: 18px; align-content: center; }
      .domu-eyebrow { width: fit-content; padding: 7px 11px; border-radius: 999px; background: rgba(31,80,115,0.08); color: var(--imcro-color-primary); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
      .domu-hero h1 { font-size: clamp(38px, 10vw, 78px); line-height: .95; letter-spacing: 0; margin: 0; }
      .domu-hero p, .domu-lead { color: var(--imcro-color-text-muted); font-size: 16px; line-height: 1.62; font-weight: 650; }
      .domu-hero img { width: 100%; min-height: 260px; height: 100%; object-fit: cover; display: block; }
      .domu-contact-grid, .domu-grid, .domu-news-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); justify-content: stretch; gap: 14px; width: 100%; }
      .domu-card { padding: 18px; }
      .domu-contact span { display: block; color: var(--imcro-color-text-muted); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 7px; }
      .domu-contact strong { font-size: 17px; line-height: 1.35; }
      .domu-section-head { margin: 40px 0 16px; display: flex; align-items: end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .domu-section-head h2 { margin: 0; color: var(--imcro-color-surface); font-size: clamp(26px, 5vw, 42px); line-height: 1.08; }
      .domu-section-head p { flex-basis: 100%; max-width: 760px; margin: -6px 0 0; color: rgba(255,255,255,0.84); font-size: 16px; line-height: 1.55; font-weight: 650; }
      .domu-link { min-height: 150px; color: inherit; text-decoration: none; display: grid; align-content: space-between; transition: transform .16s ease, border-color .16s ease; }
      .domu-link:hover { transform: translateY(-2px); border-color: var(--imcro-color-primary); box-shadow: var(--imcro-shadow-card-hover); }
      .domu-link h3 { margin: 0 0 8px; font-size: 20px; line-height: 1.18; }
      .domu-link p { margin: 0; color: var(--imcro-color-text-muted); font-size: 14px; line-height: 1.45; font-weight: 700; }
      .domu-open { margin-top: 18px; width: fit-content; min-height: 38px; padding: 0 13px; border-radius: var(--imcro-radius-button); display: inline-flex; align-items: center; color: #fff; background: var(--imcro-color-primary); font-size: 13px; font-weight: 950; text-decoration: none; }
      .domu-content { display: grid; gap: 18px; padding: 22px; }
      .domu-content h1 { font-size: clamp(32px, 8vw, 62px); line-height: 1; margin: 0; }
      .domu-list { margin: 0; padding: 0; display: grid; gap: 10px; list-style: none; }
      .domu-list li { padding: 14px 16px; border: 1px solid var(--imcro-color-border); border-radius: 8px; background: #fff; color: var(--imcro-color-text); font-weight: 750; }
      .domu-empty { border: 1px solid var(--imcro-color-border); border-radius: var(--imcro-radius-card); background: #fff; color: var(--imcro-color-text-muted); padding: 20px; font-weight: 750; line-height: 1.55; box-shadow: var(--imcro-shadow-card); }
      @media (min-width: 720px) {
        .domu-shell { width: min(var(--imcro-container-max, 1280px), calc(100% - 96px)); padding-top: 46px; }
        .domu-hero-grid { grid-template-columns: minmax(0, 1.02fr) minmax(320px, .8fr); }
        .domu-hero-copy { padding: 54px; min-height: 520px; }
        .domu-content { padding: 34px; }
      }
      @media (max-width: 520px) {
        .domu-shell { width: min(100% - 24px, var(--imcro-container-max, 1280px)); }
      }
    `}</style>
  );
}

export function DomUchitelyaHome(props) {
  const news = props.newsItems || [];
  return (
    <DomuShell {...props}>
      <div className="domu-shell">
        <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Дом учителя" }]} />
        <section className="domu-hero">
          <div className="domu-hero-grid">
            <div className="domu-hero-copy">
              <span className="domu-eyebrow">Городское педагогическое пространство</span>
              <h1>Дом учителя</h1>
              <p>Место для встреч педагогов, профессионального общения, наставничества, мастер-классов и городских образовательных инициатив.</p>
            </div>
            <img src="/images/news2.jpg" alt="Дом учителя" />
          </div>
        </section>

        <section className="domu-section">
          <div className="domu-contact-grid" style={{ marginTop: 18 }}>
            {contactCards.map(item => (
              <article className="domu-card domu-contact" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="domu-section-head">
            <h2>Новости</h2>
            <Link to="/dom-uchitelya/novosti/" className="domu-open">Все новости</Link>
          </div>
          <div className="domu-news-grid">
            {news.slice(0, 3).map(item => (
              <NewsCard key={item.id} news={item} onClick={() => props.onOpenArticle?.(item)} onAuthorClick={props.onOpenAuthor} />
            ))}
          </div>
          {!news.length && (
            <div className="domu-empty">Новости Дома учителя появятся здесь после публикации редактором.</div>
          )}
        </section>

        <section>
          <div className="domu-section-head">
            <h2>Разделы</h2>
          </div>
          <div className="domu-grid">
            {DOMU_SECTIONS.map(section => (
              <Link className="domu-card domu-link" key={section.path} to={section.path}>
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.text}</p>
                </div>
                <span className="domu-open">Открыть</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </DomuShell>
  );
}

export function DomUchitelyaStaticPage({ section, ...props }) {
  const copy = pageCopy[section.path] || { lead: section.text, items: [] };
  return (
    <DomuShell {...props}>
      <div className="domu-shell">
        <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Дом учителя", to: "/dom-uchitelya/" }, { label: section.title }]} />
        <section className="domu-content">
          <span className="domu-eyebrow">Дом учителя</span>
          <h1>{section.title}</h1>
          <p className="domu-lead">{copy.lead}</p>
          <ul className="domu-list">
            {copy.items.map(item => <li key={item}>{item}</li>)}
          </ul>
        </section>
      </div>
    </DomuShell>
  );
}

export function DomUchitelyaNewsPage(props) {
  const news = props.newsItems || [];
  return (
    <DomuShell {...props}>
      <div className="domu-shell">
        <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Дом учителя", to: "/dom-uchitelya/" }, { label: "Новости" }]} />
        <section className="domu-content" style={{ marginBottom: 22 }}>
          <span className="domu-eyebrow">Новости</span>
          <h1>Новости Дома учителя</h1>
          <p className="domu-lead">Актуальные новости, анонсы и материалы Дома учителя.</p>
        </section>
        <div className="domu-news-grid">
          {news.map(item => <NewsCard key={item.id} news={item} onClick={() => props.onOpenArticle?.(item)} onAuthorClick={props.onOpenAuthor} />)}
        </div>
        {!news.length && (
          <div className="domu-empty">В ленте Дома учителя пока нет опубликованных материалов.</div>
        )}
      </div>
    </DomuShell>
  );
}

export function CommonNewsPage(props) {
  const news = props.newsItems || [];
  return (
    <DomuShell {...props}>
      <div className="domu-shell">
        <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Новости" }]} />
        <section className="domu-content" style={{ marginBottom: 22 }}>
          <span className="domu-eyebrow">Новости</span>
          <h1>Новости</h1>
          <p className="domu-lead">Актуальные новости, объявления и материалы МКУ ИМЦРО.</p>
        </section>
        <div className="domu-news-grid">
          {news.map(item => <NewsCard key={item.id} news={item} onClick={() => props.onOpenArticle?.(item)} onAuthorClick={props.onOpenAuthor} />)}
        </div>
        {!news.length && (
          <div className="domu-empty">Новости пока не опубликованы.</div>
        )}
      </div>
    </DomuShell>
  );
}
