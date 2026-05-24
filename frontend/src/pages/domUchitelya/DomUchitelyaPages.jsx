import { Link } from "react-router-dom";
import Footer from "../../components/Footer.jsx";
import Header from "../../features/nav/Header.jsx";
import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import NewsCard from "../../features/news/NewsCard.jsx";

const DOMU_SECTIONS = [
  { path: "/dom-uchitelya/o-dome/", title: "О здании", text: "Адрес, руководитель, контакты и режим работы." },
  { path: "/dom-uchitelya/programma/", title: "Программа мероприятий", text: "Анонсы встреч, семинаров и городских событий." },
  { path: "/dom-uchitelya/master-klassy/", title: "Мастер-классы", text: "Практические занятия для педагогов и наставников." },
  { path: "/dom-uchitelya/molodye-pedagogi/", title: "Клуб молодых педагогов", text: "Поддержка специалистов в первые годы работы." },
  { path: "/dom-uchitelya/nastavnichestvo/", title: "Наставничество", text: "Опытные педагоги, методическая помощь и обмен практиками." },
  { path: "/dom-uchitelya/klub-pedagogov/", title: "Клуб педагогов", text: "Профессиональное сообщество и тематические встречи." },
  { path: "/dom-uchitelya/pedagogicheskaya-gostinaya/", title: "Педагогическая гостиная", text: "Открытые разговоры о школе, воспитании и развитии." },
  { path: "/dom-uchitelya/konkursy/", title: "Конкурсы Дома учителя", text: "Конкурсные события, положения и сроки участия." },
  { path: "/dom-uchitelya/itogi/", title: "Итоги и результаты", text: "Результаты мероприятий, списки участников и победителей." },
  { path: "/dom-uchitelya/fotogalereya/", title: "Фотогалерея", text: "Фотографии встреч и событий Дома учителя." },
  { path: "/dom-uchitelya/novosti/", title: "Новости", text: "Собственная лента новостей Дома учителя." },
];

const contactCards = [
  { label: "Адрес", value: "ул. Литвинова, 14" },
  { label: "Телефон", value: "+7 (3952) 48-12-56" },
  { label: "Режим работы", value: "Пн-Пт: 9:00-17:00" },
];

const pageCopy = {
  "/dom-uchitelya/o-dome/": {
    lead: "Дом учителя работает как городская площадка для встреч, обучения, обмена опытом и поддержки педагогического сообщества.",
    items: ["Адрес: ул. Литвинова, 14", "Руководитель и дополнительные контакты уточняются в администрации МКУ ИМЦРО.", "Телефон: +7 (3952) 48-12-56", "Режим работы: Пн-Пт: 9:00-17:00"],
  },
  "/dom-uchitelya/programma/": {
    lead: "Раздел собирает ближайшие мероприятия Дома учителя: встречи клубов, мастер-классы, семинары и открытые обсуждения.",
    items: ["Городские методические события", "Клубные встречи педагогов", "Открытые лекции и практикумы"],
  },
  "/dom-uchitelya/master-klassy/": {
    lead: "Мастер-классы помогают педагогам быстро попробовать новые методики, инструменты и форматы работы.",
    items: ["Практические занятия", "Разбор педагогических кейсов", "Материалы для дальнейшей работы"],
  },
  "/dom-uchitelya/molodye-pedagogi/": {
    lead: "Клуб молодых педагогов объединяет начинающих специалистов и помогает быстрее освоиться в профессии.",
    items: ["Встречи с наставниками", "Профессиональная адаптация", "Обмен опытом и поддержка"],
  },
  "/dom-uchitelya/nastavnichestvo/": {
    lead: "Наставничество связывает опытных педагогов и молодых специалистов вокруг конкретных профессиональных задач.",
    items: ["Наставнические пары", "Методические консультации", "Практики сопровождения"],
  },
  "/dom-uchitelya/klub-pedagogov/": {
    lead: "Клуб педагогов — пространство регулярного общения, профессиональных обсуждений и совместных инициатив.",
    items: ["Тематические встречи", "Профессиональные дискуссии", "Городские инициативы"],
  },
  "/dom-uchitelya/pedagogicheskaya-gostinaya/": {
    lead: "Педагогическая гостиная предназначена для спокойного разговора о важных вопросах образования и воспитания.",
    items: ["Открытые встречи", "Экспертные разговоры", "Обмен школьными практиками"],
  },
  "/dom-uchitelya/konkursy/": {
    lead: "В разделе публикуются конкурсы, положения, сроки и материалы для участников мероприятий Дома учителя.",
    items: ["Анонсы конкурсов", "Положения и требования", "Сроки подачи материалов"],
  },
  "/dom-uchitelya/itogi/": {
    lead: "Здесь размещаются итоги мероприятий, результаты конкурсов и материалы по завершенным событиям.",
    items: ["Итоги встреч", "Результаты конкурсов", "Списки победителей и участников"],
  },
  "/dom-uchitelya/fotogalereya/": {
    lead: "Фотогалерея сохраняет визуальную хронику встреч, мастер-классов и городских педагогических событий.",
    items: ["Фотографии мероприятий", "Альбомы клубов", "Архив событий"],
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
      .domu-page { min-height: 100vh; display: flex; flex-direction: column; color: #0f172a; background: linear-gradient(180deg, #fbfdff 0%, #f4f7fb 52%, #eef4fb 100%); }
      .domu-main { flex: 1; }
      .domu-shell { width: min(var(--app-page-max, 1180px), calc(100% - 28px)); margin: 0 auto; padding: 34px 0 70px; }
      .domu-hero { overflow: hidden; border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; box-shadow: 0 24px 70px rgba(15,23,42,.08); }
      .domu-hero-grid { display: grid; gap: 0; }
      .domu-hero-copy { padding: 30px 20px; display: grid; gap: 18px; align-content: center; }
      .domu-eyebrow { width: fit-content; padding: 7px 11px; border-radius: 999px; background: #ecfdf5; color: #047857; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; }
      .domu-hero h1 { font-size: clamp(38px, 10vw, 78px); line-height: .95; letter-spacing: 0; margin: 0; }
      .domu-hero p, .domu-lead { color: #475569; font-size: 16px; line-height: 1.62; font-weight: 650; }
      .domu-hero img { width: 100%; min-height: 260px; height: 100%; object-fit: cover; display: block; }
      .domu-contact-grid, .domu-grid, .domu-news-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); justify-content: stretch; gap: 14px; width: 100%; }
      .domu-card { border: 1px solid #dbe6f5; border-radius: 8px; background: rgba(255,255,255,.94); padding: 18px; box-shadow: 0 16px 36px rgba(15,23,42,.06); }
      .domu-contact span { display: block; color: #64748b; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 7px; }
      .domu-contact strong { font-size: 17px; line-height: 1.35; }
      .domu-section-head { margin: 40px 0 16px; display: flex; align-items: end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .domu-section-head h2 { margin: 0; font-size: clamp(26px, 5vw, 42px); line-height: 1.08; }
      .domu-link { min-height: 150px; color: inherit; text-decoration: none; display: grid; align-content: space-between; transition: transform .16s ease, border-color .16s ease; }
      .domu-link:hover { transform: translateY(-2px); border-color: #86efac; }
      .domu-link h3 { margin: 0 0 8px; font-size: 20px; line-height: 1.18; }
      .domu-link p { margin: 0; color: #64748b; font-size: 14px; line-height: 1.45; font-weight: 700; }
      .domu-open { margin-top: 18px; width: fit-content; min-height: 38px; padding: 0 13px; border-radius: 8px; display: inline-flex; align-items: center; color: #047857; background: #ecfdf5; font-size: 13px; font-weight: 950; }
      .domu-content { display: grid; gap: 18px; }
      .domu-content h1 { font-size: clamp(32px, 8vw, 62px); line-height: 1; margin: 0; }
      .domu-list { margin: 0; padding: 0; display: grid; gap: 10px; list-style: none; }
      .domu-list li { padding: 14px 16px; border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; color: #334155; font-weight: 750; }
      .domu-empty { border: 1px solid #dbe6f5; border-radius: 8px; background: #fff; color: #475569; padding: 20px; font-weight: 750; line-height: 1.55; }
      @media (min-width: 720px) {
        .domu-shell { width: min(var(--app-page-max, 1180px), calc(100% - 44px)); padding-top: 46px; }
        .domu-hero-grid { grid-template-columns: minmax(0, 1.02fr) minmax(320px, .8fr); }
        .domu-hero-copy { padding: 54px; min-height: 520px; }
      }
      @media (max-width: 520px) {
        .domu-shell { width: min(100% - 24px, var(--app-page-max, 1180px)); }
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
        <div className="domu-section-head" style={{ marginTop: 0 }}>
          <h2>Новости Дома учителя</h2>
        </div>
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
        <div className="domu-section-head" style={{ marginTop: 0 }}>
          <h2>Новости</h2>
        </div>
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
