import Breadcrumbs from "../../components/Breadcrumbs.jsx";
import Footer from "../../components/Footer.jsx";
import {
  ImcroContactPanel,
  ImcroContainer,
  ImcroButton,
  ImcroNewsPanel,
  ImcroPage,
  ImcroSection,
  ImcroServiceCard,
} from "../../components/imcro/ImcroPublicComponents.jsx";
import Header from "../../features/nav/Header.jsx";
import "./HubHomePageLayout.css";

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

export function HubHomeIcon({ name }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case "award":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" />
          <path d="m9 14-1 7 4-2 4 2-1-7" />
        </svg>
      );
    case "graduation":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="m3 9 9-4 9 4-9 4-9-4Z" />
          <path d="M7 11v4.5c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5V11" />
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
    case "book":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H7a3 3 0 0 0-3 3V5.5Z" />
          <path d="M4 19a3 3 0 0 1 3-3h13" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M5 4h14v17H5z" />
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <path d="M5 9h14" />
        </svg>
      );
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M8 4h8l1 3H7l1-3Z" />
          <path d="M7 5H5v16h14V5h-2" />
          <path d="M8 11h8" />
          <path d="M8 15h6" />
        </svg>
      );
    case "compass":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
          <path d="m15 9-2 5-5 2 2-5 5-2Z" />
        </svg>
      );
    case "document":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
          <path d="M10 13h6" />
          <path d="M10 17h4" />
        </svg>
      );
    case "people":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M16 20v-1.5c0-1.7-1.8-3-4-3s-4 1.3-4 3V20" />
          <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M4.5 19v-1c0-1.2 1.1-2.2 2.7-2.8" />
          <path d="M19.5 19v-1c0-1.2-1.1-2.2-2.7-2.8" />
        </svg>
      );
    case "psychology":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 4a5 5 0 0 0-4 8c.9 1.1 1.4 2 1.4 3H15c0-1 .5-1.9 1.4-3A5 5 0 0 0 12 4Z" />
          <path d="M10 9h4" />
          <path d="M12 7v4" />
        </svg>
      );
    case "science":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M10 3h4" />
          <path d="M11 3v5l-5 9a3 3 0 0 0 2.6 4h6.8a3 3 0 0 0 2.6-4l-5-9V3" />
          <path d="M8.5 16h7" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 22s7-4 7-10V5l-7-3-7 3v7c0 6 7 10 7 10Z" />
          <path d="m9.5 12 1.8 1.8 3.7-4" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
          <path d="m18 15 .9 2.6 2.6 .9-2.6 .9L18 21l-.9-2.6-2.6-.9 2.6-.9L18 15Z" />
        </svg>
      );
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

function renderCardIcon(icon) {
  if (!icon) return null;
  if (typeof icon === "string") return <HubHomeIcon name={icon} />;
  return icon;
}

export function HubHomePageLayout({
  breadcrumbs = [],
  breadcrumbsOutsideHero = false,
  cards = [],
  classNames = {},
  contactBlock,
  ctaText = "Перейти",
  currentUser,
  description,
  gridClassName = "imcro-grid-4",
  heroAction,
  latestNews,
  mainClassName = "",
  onGoAdmin,
  onGoAuth,
  onGoProfile,
  pageClassName = "",
  sectionTitle,
  title,
}) {
  const hasCards = cards.length > 0;

  return (
    <ImcroPage className={cx("hub-home-page", pageClassName)}>
      <Header currentUser={currentUser} onGoAuth={onGoAuth} onGoAdmin={onGoAdmin} onGoProfile={onGoProfile} />

      <main className={cx("hub-home-main", mainClassName)}>
        <ImcroContainer>
          <ImcroSection className={cx("hub-home-hero-section", classNames.heroSection)}>
            {breadcrumbsOutsideHero && (
              <Breadcrumbs className={cx("hub-home-breadcrumbs", classNames.breadcrumbs)} items={breadcrumbs} />
            )}
            <div className={cx("hub-home-hero-grid", classNames.heroGrid)}>
              <div className={cx("hub-home-hero-copy", classNames.heroCopy)}>
                {!breadcrumbsOutsideHero && (
                  <Breadcrumbs className={cx("hub-home-breadcrumbs", classNames.breadcrumbs)} items={breadcrumbs} />
                )}
                <h1>{title}</h1>
                {description && <p>{description}</p>}
                {heroAction?.text && heroAction?.href && (
                  <div className="hub-home-hero-actions">
                    <ImcroButton href={heroAction.href}>{heroAction.text}</ImcroButton>
                  </div>
                )}
              </div>

              {latestNews && (
                <ImcroNewsPanel
                  className={cx("hub-home-news-panel", classNames.newsPanel)}
                  title={latestNews.title}
                  items={latestNews.items}
                  allHref={latestNews.allHref}
                />
              )}
            </div>
          </ImcroSection>

          {hasCards && (
            <ImcroSection className={cx("hub-home-materials-section", classNames.materialsSection)}>
              {sectionTitle && (
                <div className={cx("hub-home-section-head", classNames.sectionHead)}>
                  <h2>{sectionTitle}</h2>
                </div>
              )}
              <div className={cx("hub-home-materials-grid", gridClassName, classNames.cardsGrid)}>
                {cards.map((card) => (
                  <ImcroServiceCard
                    key={card.href || card.title}
                    title={card.title}
                    description={card.description}
                    href={card.href}
                    icon={renderCardIcon(card.icon)}
                    ctaText={card.ctaText || ctaText}
                    className={card.className}
                  />
                ))}
              </div>
            </ImcroSection>
          )}

          {contactBlock && (
            <ImcroSection className={cx("hub-home-contact-section", classNames.contactSection)}>
              <ImcroContactPanel
                className={cx("hub-home-contact-panel", classNames.contactPanel)}
                title={contactBlock.title}
                description={contactBlock.description}
                contacts={contactBlock.contacts}
                actionText={contactBlock.actionText}
                actionHref={contactBlock.actionHref}
              />
            </ImcroSection>
          )}
        </ImcroContainer>
      </main>

      <Footer />
    </ImcroPage>
  );
}
