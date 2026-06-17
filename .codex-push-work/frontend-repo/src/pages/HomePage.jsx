import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../features/nav/Header.jsx";
import Footer from "../components/Footer.jsx";
import {
  ImcroActivityCarousel,
  ImcroButton,
  ImcroCard,
  ImcroContainer,
  ImcroContactPanel,
  ImcroEventBanner,
  ImcroPage,
  ImcroSection,
  ImcroServiceCard,
} from "../components/imcro/ImcroPublicComponents.jsx";
import {
  contactInfo,
  demoFeaturedNews,
  directions,
  keyEvents,
  mainSections,
} from "./homePageData.js";
import {
  CONTACT_COORDS,
  buildMapEmbedSrc,
  buildMapHref,
  getFeaturedNews,
  getNewsAuthorHref,
  getNewsAuthorLabel,
  getNewsDateTime,
  getNewsDescription,
  getNewsHref,
  getNewsImage,
} from "./homePageUtils.js";
import "./HomePage.css";

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function Icon({ name }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case "graduation":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="m3 9 9-4 9 4-9 4-9-4Z" />
          <path d="M7 11v4.5c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5V11" />
        </svg>
      );
    case "people":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M16 20v-1.5c0-1.7-1.8-3-4-3s-4 1.3-4 3V20" />
          <circle cx="12" cy="9" r="3" />
          <path d="M4.5 19v-1c0-1.2 1.1-2.2 2.7-2.8" />
          <path d="M19.5 19v-1c0-1.2-1.1-2.2-2.7-2.8" />
        </svg>
      );
    case "award":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="m9.5 12-1 8 3.5-2 3.5 2-1-8" />
        </svg>
      );
    case "certificate":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M5 4h14v12H5z" />
          <path d="M8 8h8" />
          <path d="M8 12h5" />
          <path d="m16 16 1.5 4 1.5-2 2 .8-1.5-4" />
        </svg>
      );
    case "bulb":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M8.5 14.5A6 6 0 1 1 15.5 14c-.9.7-1.5 1.7-1.5 3h-4c0-1.1-.5-1.9-1.5-2.5Z" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3V5.5Z" />
          <path d="M4 19a3 3 0 0 1 3-3h13" />
        </svg>
      );
    case "care":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z" />
          <path d="M12 8v7" />
          <path d="M8.5 11.5h7" />
        </svg>
      );
    case "psychology":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 4a5 5 0 0 0-4 8c.9 1.1 1.4 2 1.4 3H15c0-1 .5-1.9 1.4-3A5 5 0 0 0 12 4Z" />
          <path d="M10 9h4" />
        </svg>
      );
    case "child":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <circle cx="12" cy="7" r="3" />
          <path d="M8 14h8" />
          <path d="M12 10v9" />
          <path d="m8 19 4-4 4 4" />
        </svg>
      );
    case "science":
    case "flask":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M10 3h4" />
          <path d="M11 3v5l-5 9a3 3 0 0 0 2.6 4h6.8a3 3 0 0 0 2.6-4l-5-9V3" />
          <path d="M8.5 16h7" />
        </svg>
      );
    case "history":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 5v6h6" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "language":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M4 5h10" />
          <path d="M9 5v14" />
          <path d="M4 19h10" />
          <path d="M17 10l3 9" />
          <path d="M14.5 19 17 10l2.5 9" />
          <path d="M15.5 16h3" />
        </svg>
      );
    case "calculator":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 7h8" />
          <path d="M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
        </svg>
      );
    case "computer":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <rect x="4" y="5" width="16" height="11" rx="2" />
          <path d="M8 20h8" />
          <path d="M12 16v4" />
        </svg>
      );
    case "leaf":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M5 21c8-1 14-7 14-16-9 0-15 6-14 16Z" />
          <path d="M9 17c2-5 5-8 10-12" />
        </svg>
      );
    case "globe":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3c2.2 2.5 3.4 5.5 3.4 9S14.2 18.5 12 21" />
          <path d="M12 3C9.8 5.5 8.6 8.5 8.6 12S9.8 18.5 12 21" />
        </svg>
      );
    case "activity":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M4 14h4l2-7 4 10 2-6h4" />
        </svg>
      );
    case "tools":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="m14.7 6.3 3 3" />
          <path d="M4 20l8.8-8.8" />
          <path d="M16 4l4 4-3 3-4-4 3-3Z" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
          <path d="m18 15 .9 2.6 2.6.9-2.6.9L18 21l-.9-2.6-2.6-.9 2.6-.9L18 15Z" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.9 2Z" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 22s7-4 7-10V5l-7-3-7 3v7c0 6 7 10 7 10Z" />
          <path d="m9.5 12 1.8 1.8 3.7-4" />
        </svg>
      );
    case "clipboard":
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M8 4h8l1 3H7l1-3Z" />
          <path d="M7 5H5v16h14V5h-2" />
          <path d="M8 11h8" />
          <path d="M8 15h6" />
        </svg>
      );
  }
}

function FeaturedNewsPlaceholder() {
  return (
    <div className="home-featured-empty">
      <span className="home-featured-badge">Главная новость</span>
      <h1>Новости пока не опубликованы</h1>
      <p>
        После публикации материалов в базе данных здесь появится последняя актуальная новость.
      </p>
    </div>
  );
}

export default function HomePage({
  onGoAuth,
  onGoAdmin,
  onGoProfile,
  currentUser,
  publishedNews = [],
  onOpenArticle,
  onOpenAuthor,
}) {
  const navigate = useNavigate();
  const featuredNews = useMemo(() => getFeaturedNews(publishedNews) || demoFeaturedNews, [publishedNews]);
  const featuredNewsHref = useMemo(() => getNewsHref(featuredNews), [featuredNews]);
  const featuredNewsDateTime = useMemo(() => getNewsDateTime(featuredNews), [featuredNews]);
  const featuredNewsAuthor = useMemo(() => getNewsAuthorLabel(featuredNews), [featuredNews]);
  const featuredNewsAuthorHref = useMemo(() => getNewsAuthorHref(featuredNews), [featuredNews]);
  const featuredNewsDescription = useMemo(() => getNewsDescription(featuredNews), [featuredNews]);
  const featuredNewsImage = useMemo(() => getNewsImage(featuredNews), [featuredNews]);
  const mapHref = useMemo(() => contactInfo.mapHref || buildMapHref(CONTACT_COORDS), []);
  const mapEmbedSrc = useMemo(() => buildMapEmbedSrc(CONTACT_COORDS), []);

  useEffect(() => {
    document.title = "МКУ ИМЦРО | Главная";
  }, []);

  const openFeaturedNews = useCallback((event) => {
    if (!featuredNews) return;
    event?.preventDefault();

    if (onOpenArticle) {
      onOpenArticle(featuredNews);
    } else {
      navigate(featuredNewsHref, { state: { article: featuredNews } });
      window.scrollTo({ top: 0 });
    }
  }, [featuredNews, featuredNewsHref, navigate, onOpenArticle]);

  const openFeaturedAuthor = useCallback((event) => {
    if (!featuredNews || !onOpenAuthor) return;
    event.preventDefault();
    event.stopPropagation();
    onOpenAuthor(featuredNews);
  }, [featuredNews, onOpenAuthor]);

  const handleFeaturedKeyDown = useCallback((event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    openFeaturedNews(event);
  }, [openFeaturedNews]);

  const contactItems = [
    { label: "Адрес", value: contactInfo.address },
    { label: "Телефон", value: contactInfo.phone, href: "tel:+73952201985" },
    { label: "Email", value: contactInfo.email, href: `mailto:${contactInfo.email}` },
  ];

  return (
    <ImcroPage className="home-page home-page--imcro">
      <Header
        onGoAuth={onGoAuth || ((tab) => navigate(`/auth?tab=${tab || "login"}`))}
        onGoAdmin={onGoAdmin || (() => navigate("/admin"))}
        onGoProfile={onGoProfile}
        currentUser={currentUser}
      />

      <main className="home-main">
        <ImcroContainer>
          <ImcroSection className="home-top-section" aria-labelledby="main-news-title">
            <div className="home-hero-grid">
              <ImcroCard
                className={`home-featured-card${featuredNews ? " is-clickable" : ""}`}
                hover={Boolean(featuredNews)}
              >
                {featuredNews ? (
                  <article
                    className="home-featured-article"
                    role="link"
                    tabIndex={0}
                    onClick={openFeaturedNews}
                    onKeyDown={handleFeaturedKeyDown}
                  >
                    <div className="home-featured-media">
                      <img src={featuredNewsImage} alt={featuredNews.title} loading="eager" />
                      <span className="home-featured-badge">Главная новость</span>
                    </div>
                    <div className="home-featured-content">
                      <div className="home-featured-meta">
                        {featuredNewsDateTime && <time>{featuredNewsDateTime}</time>}
                        <a href={featuredNewsAuthorHref} onClick={openFeaturedAuthor}>
                          {featuredNewsAuthor}
                        </a>
                      </div>
                      <h1 id="main-news-title">{featuredNews.title}</h1>
                      {featuredNewsDescription && <p>{featuredNewsDescription}</p>}
                      <ImcroButton
                        className="home-featured-button"
                        href={featuredNewsHref}
                        onClick={(event) => {
                          event.stopPropagation();
                          openFeaturedNews(event);
                        }}
                      >
                        Подробнее <ArrowRightIcon />
                      </ImcroButton>
                    </div>
                  </article>
                ) : (
                  <FeaturedNewsPlaceholder />
                )}
              </ImcroCard>

              <aside className="home-events-panel" aria-labelledby="key-events-title">
                <div className="home-events-head">
                  <h2 id="key-events-title">Ключевые мероприятия</h2>
                </div>
                <div className="home-events-list">
                  {keyEvents.slice(0, 3).map((event) => (
                    <ImcroEventBanner
                      key={event.title}
                      title={event.title}
                      description={event.description}
                      icon={<Icon name={event.icon} />}
                      imageSrc={event.image}
                      imageAlt={event.title}
                      href={event.href}
                    />
                  ))}
                </div>
              </aside>
            </div>
          </ImcroSection>

          <ImcroSection className="home-services-section" aria-label="Главные разделы">
            <div className="home-services-grid imcro-grid-3">
              {mainSections.map((section) => (
                <ImcroServiceCard
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  icon={<Icon name={section.icon} />}
                  href={section.href}
                  ctaText="Перейти"
                />
              ))}
            </div>
          </ImcroSection>

          <ImcroSection className="home-activity-section">
            <ImcroActivityCarousel
              title="Направления деятельности"
              items={directions.map((item) => ({
                ...item,
                icon: <Icon name={item.icon} />,
              }))}
            />
          </ImcroSection>

          <ImcroSection className="home-contact-section" aria-labelledby="contact-title">
            <div className="home-contact-layout">
              <ImcroCard className="home-map-card">
                <iframe
                  className="home-map-frame"
                  src={mapEmbedSrc}
                  title="Карта расположения МКУ ИМЦРО"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </ImcroCard>
              <ImcroContactPanel
                className="home-contact-panel"
                title="Контактная информация"
                description="Свяжитесь с МКУ ИМЦРО или откройте адрес центра на карте."
                contacts={contactItems}
                actionText="Открыть на карте"
                actionHref={mapHref}
              />
            </div>
          </ImcroSection>
        </ImcroContainer>
      </main>

      <Footer />
    </ImcroPage>
  );
}
