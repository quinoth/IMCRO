import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Footer from "../components/Footer.jsx";
import Header from "../features/nav/Header.jsx";
import Breadcrumbs from "../components/Breadcrumbs.jsx";
import {
  SVEDENIYA_NAV_ITEMS,
  SVEDENIYA_ROUTE_TO_ANCHOR,
  svedeniyaPage,
} from "./svedeniya/svedeniyaData.js";
import "./svedeniya/SvedeniyaPage.css";

const ICON_PATHS = {
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9h.01",
  structure: "M6 4h12v5H6V4Zm0 11h5v5H6v-5Zm7 0h5v5h-5v-5Zm-1-6v3m-4 0h8",
  docs: "M7 3h7l4 4v14H7V3Zm7 0v5h5M10 12h6m-6 4h6",
  education: "M3 9l9-5 9 5-9 5-9-5Zm4 3v4c2 2 8 2 10 0v-4",
  standards: "M5 4h14v16H5V4Zm4 5h6m-6 4h6m-6 4h4",
  staff: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  objects: "M4 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M8 7h2m4 0h2M8 11h2m4 0h2M8 15h2m4 0h2M3 21h18",
  support: "M12 21s-7-4.35-7-10a7 7 0 0 1 14 0c0 5.65-7 10-7 10Zm-3-9h6m-3-3v6",
  paid: "M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6",
  budget: "M4 5h16v14H4V5Zm0 4h16M8 13h.01M12 13h4M8 16h.01M12 16h4",
  vacant: "M12 5v14m-7-7h14M5 5h14v14H5V5Z",
  accessible: "M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm0 3v5m-5-3h10m-7 4-2 7m6-7 2 7",
  international: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-8-9h16M12 3c2.4 2.4 3.5 5.4 3.5 9S14.4 18.6 12 21c-2.4-2.4-3.5-5.4-3.5-9S9.6 5.4 12 3Z",
  address: "M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.91.32 1.8.59 2.65a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6.27 6.27l1.25-1.25a2 2 0 0 1 2.11-.45c.85.27 1.74.47 2.65.59A2 2 0 0 1 22 16.92Z",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5l3 2",
  calendar: "M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2Z",
  link: "M10 13a5 5 0 0 0 7.54.54l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15M14 11a5 5 0 0 0-7.54-.54l-2 2a5 5 0 0 0 7.07 7.07l1.15-1.15",
  mail: "M4 4h16v16H4V4Zm0 4 8 5 8-5",
  chevron: "m6 9 6 6 6-6",
  check: "m5 12 4 4L19 6",
};

function Icon({ name }) {
  return (
    <svg className="sv-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={ICON_PATHS[name] || ICON_PATHS.info} />
    </svg>
  );
}

function Seo({ title, description }) {
  useEffect(() => {
    document.title = `${title} | МКУ развития образования города Иркутска`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", description);
  }, [title, description]);

  return null;
}

function linkAttributes(href) {
  if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) {
    return {};
  }

  return { target: "_blank", rel: "noreferrer" };
}

function DocumentLink({ link }) {
  const content = (
    <>
      <span className="sv-doc-mark" aria-hidden="true">
        <Icon name={link.kind === "page" ? "link" : "docs"} />
      </span>
      <span className="sv-doc-title">{link.title}</span>
      {link.meta && <small>{link.meta}</small>}
    </>
  );

  if (!link.href) {
    return (
      <span className="sv-doc-link sv-doc-link-disabled" aria-disabled="true">
        {content}
      </span>
    );
  }

  return (
    <a className="sv-doc-link" href={link.href} {...linkAttributes(link.href)}>
      {content}
    </a>
  );
}

function DetailList({ items, compact = false }) {
  if (!items?.length) return null;

  return (
    <ul className={`sv-detail-list${compact ? " sv-detail-list-compact" : ""}`}>
      {items.map((item) => {
        const detail = typeof item === "string" ? { value: item } : item;
        const value = detail.href ? (
          <a href={detail.href} {...linkAttributes(detail.href)}>{detail.value}</a>
        ) : (
          <span>{detail.value}</span>
        );

        return (
          <li className={detail.icon ? "sv-detail-item sv-detail-item-icon" : "sv-detail-item"} key={`${detail.label || "detail"}-${detail.value}`}>
            {detail.icon && (
              <span className="sv-detail-icon" aria-hidden="true">
                <Icon name={detail.icon} />
              </span>
            )}
            <span className="sv-detail-content">
              {detail.label && <small>{detail.label}</small>}
              {value}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function DocumentLinks({ links }) {
  if (!links?.length) return null;

  return (
    <div className="sv-doc-links">
      {links.map((link) => <DocumentLink link={link} key={`${link.title}-${link.href || "plain"}`} />)}
    </div>
  );
}

function SummaryBlock({ block }) {
  return (
    <section className="sv-summary-block">
      <div className="sv-summary-copy">
        <h3>{block.title}</h3>
        {block.subtitle && <p className="sv-summary-subtitle">{block.subtitle}</p>}
        {block.text && <p>{block.text}</p>}
      </div>
      {block.facts?.length > 0 && (
        <dl className="sv-fact-grid">
          {block.facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function TextBlock({ block, className = "" }) {
  return (
    <section className={`sv-text-block ${className}`.trim()}>
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      {block.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      {block.text && <p>{block.text}</p>}
      <DocumentLinks links={block.links} />
    </section>
  );
}

function ContactsBlock({ block }) {
  return (
    <section className="sv-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      <div className={`sv-contact-grid sv-contact-grid-${block.variant || "default"}`}>
        {block.items.map((item) => (
          <article className="sv-contact-card" key={item.title}>
            <div className="sv-card-head">
              <h3>{item.title}</h3>
              {item.meta && <span>{item.meta}</span>}
            </div>
            {item.text && <p>{item.text}</p>}
            <DetailList items={item.details} compact />
            <DocumentLinks links={item.links} />
          </article>
        ))}
      </div>
    </section>
  );
}

function PlacesBlock({ block }) {
  return (
    <section className="sv-places-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      {block.description && <p>{block.description}</p>}
      <div className="sv-place-list">
        {block.items.map((item) => (
          <article className="sv-place-item" key={item.title}>
            <span aria-hidden="true"><Icon name="address" /></span>
            <strong>{item.title}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

function DocGroupsBlock({ block }) {
  return (
    <div className="sv-doc-groups">
      {block.groups.map((group) => (
        <section className="sv-doc-group" key={group.title}>
          <div className="sv-doc-group-head">
            <h3>{group.title}</h3>
            {group.links?.length > 0 && <span>{group.links.length}</span>}
          </div>
          {group.text && <p>{group.text}</p>}
          <DocumentLinks links={group.links} />
        </section>
      ))}
    </div>
  );
}

function SubdivisionsBlock({ block }) {
  return (
    <section className="sv-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      <div className="sv-subdivision-grid">
        {block.items.map((item) => (
          <article className="sv-subdivision-card" key={item.title}>
            <h3>{item.title}</h3>
            {item.text && <p>{item.text}</p>}
            <DetailList items={item.details} compact />
            <DocumentLinks links={item.links} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ProgramsBlock({ block }) {
  return (
    <section className="sv-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      <div className="sv-program-list">
        {block.items.map((program, index) => (
          <details className="sv-program-card" key={program.title}>
            <summary>
              <span className="sv-program-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="sv-program-summary">
                <strong>{program.title}</strong>
                <span>Руководитель обучения: {program.leader}</span>
              </span>
              <span className="sv-program-badges">
                <b>{program.hours} ч</b>
                <b>{program.capacity} слушателей</b>
              </span>
              <span className="sv-program-chevron" aria-hidden="true"><Icon name="chevron" /></span>
            </summary>
            <div className="sv-program-body">
              {program.description && <p>{program.description}</p>}
              <dl>
                {program.audience && (
                  <div>
                    <dt>Категория слушателей</dt>
                    <dd>{program.audience.replace(/^Категория слушателей:\s*/i, "")}</dd>
                  </div>
                )}
                <div>
                  <dt>Руководитель обучения</dt>
                  <dd>{program.leader}</dd>
                </div>
                <div>
                  <dt>Количество слушателей</dt>
                  <dd>{program.capacity}</dd>
                </div>
                <div>
                  <dt>Количество часов</dt>
                  <dd>{program.hours}</dd>
                </div>
              </dl>
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

function staffInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function StaffValue({ type, value }) {
  if (type === "phone") {
    return <a href={`tel:${value.replace(/[^\d+]/g, "")}`}>{value}</a>;
  }
  if (type === "email") {
    return <a href={`mailto:${value}`}>{value}</a>;
  }
  return <span>{value}</span>;
}

function StaffFactList({ facts }) {
  if (!facts.length) return null;

  return (
    <dl className="sv-staff-meta">
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt>{fact.label}</dt>
          <dd><StaffValue type={fact.type} value={fact.value} /></dd>
        </div>
      ))}
    </dl>
  );
}

function StaffCard({ person, variant }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = person.photo || person.image;
  const showImage = Boolean(imageSrc && !imageFailed);
  const initials = staffInitials(person.name);
  const visibleFacts = [
    { label: "Телефон", value: person.phone, type: "phone" },
    { label: "Email", value: person.email, type: "email" },
    { label: "Кабинет", value: person.office },
    { label: "Подразделение", value: person.department },
    { label: "Направление", value: person.direction },
  ].filter((item) => item.value);
  const expandedFacts = [
    { label: "Образование", value: person.education },
    { label: "Квалификация / специальность", value: person.qualification },
    { label: "Аттестация", value: person.attestation },
    { label: "Общий стаж", value: person.totalExperience },
    { label: "Педагогический стаж", value: person.teachingExperience },
    { label: "Описание", value: person.description },
  ].filter((item) => item.value);

  return (
    <article className={`sv-staff-card sv-staff-card-${variant || "default"}`}>
      <div className={`sv-staff-photo${showImage ? " has-image" : ""}`}>
        {showImage ? (
          <img
            src={imageSrc}
            alt={`Фото: ${person.name}`}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span aria-label={`Фото сотрудника отсутствует, инициалы ${initials}`}>{initials}</span>
        )}
      </div>
      <div className="sv-staff-info">
        <header>
          <h3>{person.name}</h3>
          <p>{person.position}</p>
        </header>
        <StaffFactList facts={visibleFacts} />
        {expandedFacts.length > 0 && (
          <details className="sv-staff-more">
            <summary>
              <span>Подробнее</span>
              <Icon name="chevron" />
            </summary>
            <StaffFactList facts={expandedFacts} />
          </details>
        )}
      </div>
    </article>
  );
}

function StaffBlock({ block }) {
  return (
    <section className="sv-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      <div className={`sv-staff-grid sv-staff-grid-${block.variant || "default"}`}>
        {block.items.map((person) => <StaffCard person={person} variant={block.variant} key={person.name} />)}
      </div>
    </section>
  );
}

function ObjectsBlock({ block }) {
  return (
    <section className="sv-objects-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      {block.metrics?.length > 0 && (
        <dl className="sv-metric-grid">
          {block.metrics.map((metric) => (
            <div key={metric.label}>
              <dt>{metric.value}</dt>
              <dd>{metric.label}</dd>
            </div>
          ))}
        </dl>
      )}
      {block.rooms?.length > 0 && (
        <div className="sv-room-list" aria-label="Учебные помещения">
          {block.rooms.map((room) => (
            <article className="sv-room-card" key={`${room.place}-${room.room}`}>
              <span>{room.place}</span>
              <strong>{room.room}</strong>
              <dl>
                <div><dt>Площадь</dt><dd>{room.area}</dd></div>
                <div><dt>Места</dt><dd>{room.seats}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      )}
      {block.equipment?.length > 0 && (
        <div className="sv-equipment-block">
          <h4>Оборудование</h4>
          <ul className="sv-chip-list">
            {block.equipment.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      )}
      {block.paragraphs?.length > 0 && (
        <div className="sv-readable-text">
          {block.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
      )}
    </section>
  );
}

function VacancyBlock({ block }) {
  return (
    <section className="sv-vacancy-card">
      <div className="sv-vacancy-head">
        <span><Icon name="vacant" /> {block.badge || "Вакансия"}</span>
        <h3>{block.title}</h3>
      </div>
      <div className="sv-vacancy-grid">
        {block.responsibilities?.length > 0 && (
          <div>
            <h4>Обязанности</h4>
            <ul>
              {block.responsibilities.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}
        {block.requirements?.length > 0 && (
          <div>
            <h4>Требования</h4>
            <ul>
              {block.requirements.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}
        {block.terms?.length > 0 && (
          <div>
            <h4>Условия</h4>
            <ul>
              {block.terms.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>
      <DocumentLinks links={block.links} />
    </section>
  );
}

function CardBlock({ block }) {
  return (
    <section className="sv-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      <div className={`sv-card-grid sv-card-grid-${block.variant || "default"}`}>
        {block.items.map((item) => (
          <article className="sv-info-card" id={item.id || undefined} key={item.title}>
            <div className="sv-card-head">
              <h3>{item.title}</h3>
              {item.meta && <span>{item.meta}</span>}
            </div>
            {item.text && <p>{item.text}</p>}
            <DetailList items={item.details} />
            <DocumentLinks links={item.links} />
          </article>
        ))}
      </div>
    </section>
  );
}

function DocumentsBlock({ block }) {
  return <DocGroupsBlock block={block} />;
}

function ListBlock({ block }) {
  return (
    <section className="sv-list-block">
      {block.title && <h3 className="sv-block-title">{block.title}</h3>}
      <ul className="sv-check-list">
        {block.items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

function SectionBlock({ block }) {
  if (block.type === "summary") return <SummaryBlock block={block} />;
  if (block.type === "text") return <TextBlock block={block} />;
  if (block.type === "contacts") return <ContactsBlock block={block} />;
  if (block.type === "places") return <PlacesBlock block={block} />;
  if (block.type === "subdivisions") return <SubdivisionsBlock block={block} />;
  if (block.type === "doc-groups") return <DocGroupsBlock block={block} />;
  if (block.type === "education-overview") return <TextBlock block={block} className="sv-education-overview" />;
  if (block.type === "objects") return <ObjectsBlock block={block} />;
  if (block.type === "vacancy") return <VacancyBlock block={block} />;
  if (block.type === "cards") return <CardBlock block={block} />;
  if (block.type === "documents") return <DocumentsBlock block={block} />;
  if (block.type === "programs") return <ProgramsBlock block={block} />;
  if (block.type === "staff") return <StaffBlock block={block} />;
  if (block.type === "list") return <ListBlock block={block} />;
  if (block.type === "notice" || block.type === "empty") {
    return (
      <section className={`sv-notice sv-notice-${block.tone || "info"}`}>
        <h3>{block.title}</h3>
        <p>{block.text}</p>
      </section>
    );
  }
  return null;
}

function OverviewCard({ section }) {
  const navItem = SVEDENIYA_NAV_ITEMS.find((item) => item.anchor === section.anchor);
  return (
    <Link className="sv-overview-card" to={`${section.path}#${section.anchor}`}>
      <span className="sv-overview-icon"><Icon name={navItem?.icon} /></span>
      <span className="sv-overview-number">{section.number}</span>
      <h3>{navItem?.shortTitle || section.title}</h3>
      <p>{section.summary}</p>
      <strong>{section.status}</strong>
    </Link>
  );
}

function Section({ section }) {
  const navItem = SVEDENIYA_NAV_ITEMS.find((item) => item.anchor === section.anchor);

  return (
    <section className="sv-section" id={section.anchor}>
      <div className="sv-section-head">
        <div className="sv-section-kicker">
          <span className="sv-section-icon"><Icon name={navItem?.icon} /></span>
          <span>Раздел {section.number}</span>
          <span>{navItem?.shortTitle || navItem?.label}</span>
        </div>
        <div className="sv-section-title-row">
          <h2>{section.title}</h2>
          {section.status && <span className="sv-status">{section.status}</span>}
          {section.sourceUrl && (
            <a className="sv-source-link" href={section.sourceUrl} target="_blank" rel="noreferrer">
              Источник
            </a>
          )}
        </div>
        <p>{section.lead}</p>
      </div>
      <div className="sv-section-body">
        {section.blocks.map((block, index) => (
          <SectionBlock block={block} key={`${section.anchor}-${block.type}-${index}`} />
        ))}
      </div>
    </section>
  );
}

export default function SvedeniyaPage({ currentUser, onGoAuth, onGoAdmin, onGoProfile }) {
  const location = useLocation();
  const activeLinkRef = useRef(null);
  const sidebarLinksRef = useRef(null);
  const programmaticScrollTimerRef = useRef(0);
  const programmaticScrollCleanupRef = useRef(null);
  const [activeAnchor, setActiveAnchor] = useState(svedeniyaPage.sections[0].anchor);
  const normalizedPath = location.pathname.replace(/\/+$/, "") || "/";
  const isRootPage = normalizedPath === "/sveden";
  const sectionAnchors = useMemo(() => svedeniyaPage.sections.map((section) => section.anchor), []);
  const activeSection = useMemo(
    () => svedeniyaPage.sections.find((section) => section.anchor === activeAnchor) || svedeniyaPage.sections[0],
    [activeAnchor]
  );

  const scrollToIndex = (event) => {
    event.preventDefault();
    const indexElement = document.getElementById("svedeniya-index");
    if (!indexElement) return;

    window.history.pushState(null, "", `${window.location.pathname}${window.location.search}#svedeniya-index`);
    indexElement.scrollIntoView({ block: "start", behavior: "smooth" });
  };

  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, "/");
    const targetAnchor = location.hash.replace(/^#/, "") || SVEDENIYA_ROUTE_TO_ANCHOR[path];
    let retryTimer = 0;

    const timer = window.setTimeout(() => {
      if (!targetAnchor) return;
      setActiveAnchor(targetAnchor);
      if (!isRootPage) {
        if (programmaticScrollCleanupRef.current) {
          programmaticScrollCleanupRef.current();
        }

        const scrollToTarget = (attempt = 0) => {
          const targetElement = document.getElementById(targetAnchor);
          if (!targetElement) {
            if (attempt < 8) {
              retryTimer = window.setTimeout(() => scrollToTarget(attempt + 1), 60);
            }
            return;
          }
          if (window.location.hash !== `#${targetAnchor}`) {
            window.location.hash = targetAnchor;
          }

          const releaseScrollLock = () => {
            window.removeEventListener("scrollend", releaseScrollLock);
            if (programmaticScrollTimerRef.current) {
              window.clearTimeout(programmaticScrollTimerRef.current);
            }
            programmaticScrollTimerRef.current = 0;
            programmaticScrollCleanupRef.current = null;
            setActiveAnchor(targetAnchor);
            window.dispatchEvent(new Event("scroll"));
          };

          const stickyOffset = window.matchMedia("(max-width: 1039px)").matches ? 154 : 112;
          const top = Math.max(0, targetElement.offsetTop - stickyOffset);
          const distance = Math.abs(targetElement.getBoundingClientRect().top);
          const fallbackDelay = Math.min(2400, Math.max(900, distance * 0.42));

          window.addEventListener("scrollend", releaseScrollLock, { once: true });
          if (typeof window.scrollTo === "function") {
            window.scrollTo({ top, behavior: "smooth" });
          } else if (typeof targetElement.scrollIntoView === "function") {
            targetElement.scrollIntoView({ block: "start", behavior: "smooth" });
          }
          window.setTimeout(() => {
            const currentTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
            if (Math.abs(currentTop - top) > 24) {
              document.documentElement.scrollTop = top;
              document.body.scrollTop = top;
            }
          }, 160);
          programmaticScrollTimerRef.current = window.setTimeout(releaseScrollLock, fallbackDelay);
          programmaticScrollCleanupRef.current = () => {
            window.removeEventListener("scrollend", releaseScrollLock);
            if (retryTimer) {
              window.clearTimeout(retryTimer);
            }
            if (programmaticScrollTimerRef.current) {
              window.clearTimeout(programmaticScrollTimerRef.current);
            }
            programmaticScrollTimerRef.current = 0;
            programmaticScrollCleanupRef.current = null;
          };
        };

        scrollToTarget();
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => scrollToTarget());
        });
      }
    }, 80);

    return () => {
      window.clearTimeout(timer);
      if (retryTimer) {
        window.clearTimeout(retryTimer);
      }
      if (programmaticScrollCleanupRef.current) {
        programmaticScrollCleanupRef.current();
      }
    };
  }, [isRootPage, location.hash, location.pathname]);

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      if (programmaticScrollTimerRef.current) return;

      const stickyOffset = window.matchMedia("(max-width: 1039px)").matches ? 154 : 132;
      const marker = Math.min(window.innerHeight * 0.36, stickyOffset + 90);
      let currentAnchor = sectionAnchors[0];

      sectionAnchors.forEach((anchor) => {
        const element = document.getElementById(anchor);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        if (rect.top <= marker && rect.bottom > stickyOffset) {
          currentAnchor = anchor;
        }
      });

      setActiveAnchor((current) => current === currentAnchor ? current : currentAnchor);
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [sectionAnchors]);

  useEffect(() => {
    const activeLink = activeLinkRef.current;
    const linksRow = sidebarLinksRef.current;
    if (!activeLink || !linksRow || !window.matchMedia("(max-width: 1039px)").matches) return;

    const targetLeft = activeLink.offsetLeft - (linksRow.clientWidth - activeLink.clientWidth) / 2;
    linksRow.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
  }, [activeAnchor]);

  return (
    <div className="sv-page">
      <Seo title={svedeniyaPage.title} description={svedeniyaPage.meta} />
      <Header
        currentUser={currentUser}
        onGoAuth={onGoAuth}
        onGoAdmin={onGoAdmin}
        onGoProfile={onGoProfile}
      />

      <main className="sv-main">
        <div className="sv-shell">
          <Breadcrumbs items={[{ label: "Главная", to: "/" }, { label: "Сведения об образовательной организации" }]} />

          <section className="sv-hero">
            <div className="sv-hero-copy">
              <span className="sv-eyebrow">{svedeniyaPage.eyebrow}</span>
              <h1>{svedeniyaPage.title}</h1>
              <p>{svedeniyaPage.description}</p>
              <div className="sv-hero-actions">
                <a className="sv-primary-action" href="#svedeniya-index" onClick={scrollToIndex}>К подразделам</a>
                <Link className="sv-secondary-action" to="/sveden/document/">Документы</Link>
              </div>
            </div>
            <div className="sv-hero-panel" aria-label="Быстрые переходы">
              {svedeniyaPage.heroHighlights.map((item) => (
                <Link className="sv-hero-highlight" to={item.path} key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="sv-overview" aria-labelledby="svedeniya-index">
            <div className="sv-overview-head">
              <div>
                <span className="sv-section-label">Навигация</span>
                <h2 id="svedeniya-index">Подразделы</h2>
              </div>
              <div className="sv-featured-links">
                {svedeniyaPage.featuredLinks.map((link) => (
                  <Link to={link.path} key={link.path}>{link.label}</Link>
                ))}
              </div>
            </div>
            <div className="sv-overview-grid">
              {svedeniyaPage.sections.map((section) => <OverviewCard section={section} key={section.anchor} />)}
            </div>
          </section>

          <div className="sv-content-layout">
            <nav className="sv-sidebar" aria-label="Меню подразделов">
              <div className="sv-sidebar-card">
                <div className="sv-sidebar-head">
                  <span className="sv-section-label">Сейчас открыт</span>
                  <strong>{activeSection.number}. {activeSection.title}</strong>
                </div>
                <div className="sv-sidebar-links" ref={sidebarLinksRef}>
                  {SVEDENIYA_NAV_ITEMS.map((item) => (
                    <Link
                      className={`sv-sidebar-link${activeAnchor === item.anchor ? " active" : ""}`}
                      key={item.path}
                      ref={activeAnchor === item.anchor ? activeLinkRef : null}
                      to={`${item.path}#${item.anchor}`}
                    >
                      <span><Icon name={item.icon} /></span>
                      <strong>{item.shortTitle || item.label}</strong>
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            <div className="sv-sections">
              {svedeniyaPage.sections.map((section) => <Section section={section} key={section.anchor} />)}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
