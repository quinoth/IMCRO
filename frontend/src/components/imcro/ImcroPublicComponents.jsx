import { useEffect, useMemo, useRef, useState } from "react";
import "./ImcroPublicComponents.css";

function cx(...values) {
  return values.filter(Boolean).join(" ");
}

function renderIcon(icon, className) {
  if (!icon) return null;
  return (
    <span className={className} aria-hidden="true">
      {icon}
    </span>
  );
}

function LinkedBox({ href, className, children, ...props }) {
  if (href) {
    return (
      <a className={className} href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

function normalizeContacts(contacts) {
  if (Array.isArray(contacts)) {
    return contacts
      .filter(Boolean)
      .map((item) => ({
        label: item.label || item.title || "",
        value: item.value ?? item.text ?? "",
        href: item.href || "",
      }))
      .filter((item) => item.label || item.value);
  }

  if (contacts && typeof contacts === "object") {
    return Object.entries(contacts)
      .map(([label, value]) => {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          return {
            label: value.label || label,
            value: value.value ?? value.text ?? "",
            href: value.href || "",
          };
        }
        return { label, value, href: "" };
      })
      .filter((item) => item.label || item.value);
  }

  return [];
}

const DRAG_THRESHOLD_PX = 8;
const PAGED_SWIPE_THRESHOLD_PX = 44;

function getPagedItemsPerPage() {
  if (typeof window === "undefined") return 10;
  if (window.matchMedia("(min-width: 1500px)").matches) return 10;
  if (window.matchMedia("(min-width: 1000px)").matches) return 8;
  if (window.matchMedia("(min-width: 700px)").matches) return 6;
  if (window.matchMedia("(min-width: 421px)").matches) return 4;
  return 3;
}

function getPagedItemsPerPageFromElement(element) {
  if (!element || typeof globalThis.getComputedStyle !== "function") {
    return getPagedItemsPerPage();
  }

  const styles = globalThis.getComputedStyle(element);
  const columns = Number.parseInt(styles.getPropertyValue("--activity-columns"), 10);
  const rows = Number.parseInt(styles.getPropertyValue("--activity-rows"), 10);

  if (Number.isFinite(columns) && columns > 0 && Number.isFinite(rows) && rows > 0) {
    return columns * rows;
  }

  return getPagedItemsPerPage();
}

function chunkItems(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function shouldReduceMotion() {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  return (
    document.body?.classList.contains("a11y-reduce-motion") ||
    document.body?.dataset.a11yReduceMotion === "true" ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

export function ImcroPage({ children, className = "" }) {
  return <div className={cx("imcro-public-page", className)}>{children}</div>;
}

export function ImcroContainer({ children, className = "" }) {
  return <div className={cx("imcro-container", className)}>{children}</div>;
}

export function ImcroSection({ children, className = "", ...props }) {
  return <section className={cx("imcro-section", className)} {...props}>{children}</section>;
}

export function ImcroCard({ children, className = "", hover = false }) {
  return <div className={cx("imcro-card", hover && "imcro-card-hover", className)}>{children}</div>;
}

export function ImcroButton({
  children,
  href,
  onClick,
  className = "",
  type = "button",
  ...props
}) {
  const classes = cx("imcro-button", className);

  if (href) {
    return (
      <a className={classes} href={href} onClick={onClick} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} type={type} onClick={onClick} {...props}>
      {children}
    </button>
  );
}

export function ImcroServiceCard({
  title,
  description,
  icon,
  href,
  ctaText = "Перейти",
  className = "",
}) {
  return (
    <ImcroCard className={cx("imcro-service-card", className)} hover>
      {renderIcon(icon, "imcro-service-card__icon")}
      <h3 className="imcro-service-card__title">{title}</h3>
      {description && <p className="imcro-service-card__description">{description}</p>}
      <ImcroButton className="imcro-service-card__button" href={href}>
        {ctaText}
      </ImcroButton>
    </ImcroCard>
  );
}

export function ImcroNewsPanel({
  title = "Последние новости",
  items = [],
  allHref,
  className = "",
}) {
  const visibleItems = Array.isArray(items) ? items.slice(0, 3) : [];

  return (
    <ImcroCard className={cx("imcro-news-panel", className)}>
      <div className="imcro-news-panel__head">
        <h2 className="imcro-news-panel__title">{title}</h2>
      </div>

      <div className="imcro-news-panel__list">
        {visibleItems.map((item, index) => (
          <LinkedBox
            key={`${item.title || "news"}-${item.date || index}`}
            className="imcro-news-panel__item"
            href={item.href}
          >
            {item.date && <time className="imcro-news-panel__date">{item.date}</time>}
            <span className="imcro-news-panel__item-title">{item.title}</span>
          </LinkedBox>
        ))}
        {!visibleItems.length && (
          <div className="imcro-news-panel__empty">Материалы пока не опубликованы.</div>
        )}
      </div>

      {allHref && (
        <a className="imcro-news-panel__all" href={allHref}>
          Все новости
        </a>
      )}
    </ImcroCard>
  );
}

export function ImcroEventBanner({
  title,
  description,
  icon,
  imageSrc,
  imageAlt,
  href,
  className = "",
}) {
  if (imageSrc) {
    return (
      <LinkedBox
        className={cx("imcro-event-banner", "imcro-event-banner--image", "imcro-card-hover", className)}
        href={href}
      >
        <img className="imcro-event-banner__image" src={imageSrc} alt={imageAlt || title} loading="lazy" />
        <span className="imcro-event-banner__sr">
          {title}
          {description ? `. ${description}` : ""}
        </span>
      </LinkedBox>
    );
  }

  return (
    <LinkedBox className={cx("imcro-event-banner", "imcro-card-hover", className)} href={href}>
      {renderIcon(icon, "imcro-event-banner__icon")}
      <span className="imcro-event-banner__content">
        <span className="imcro-event-banner__title">{title}</span>
        {description && <span className="imcro-event-banner__description">{description}</span>}
      </span>
    </LinkedBox>
  );
}

export function ImcroContactPanel({
  title,
  description,
  contacts = [],
  actionText,
  actionHref,
  className = "",
}) {
  const normalizedContacts = normalizeContacts(contacts);

  return (
    <ImcroCard className={cx("imcro-contact-panel", className)}>
      {(title || description) && (
        <div className="imcro-contact-panel__intro">
          {title && <h2 className="imcro-contact-panel__title">{title}</h2>}
          {description && <p className="imcro-contact-panel__description">{description}</p>}
        </div>
      )}

      <dl className="imcro-contact-panel__grid">
        {normalizedContacts.map((item, index) => (
          <div className="imcro-contact-panel__item" key={`${item.label}-${index}`}>
            {item.label && <dt>{item.label}</dt>}
            <dd>
              {item.href ? <a href={item.href}>{item.value}</a> : item.value}
            </dd>
          </div>
        ))}
      </dl>

      {actionText && actionHref && (
        <ImcroButton className="imcro-contact-panel__action" href={actionHref}>
          {actionText}
        </ImcroButton>
      )}
    </ImcroCard>
  );
}

export function ImcroActivityCarousel({
  title,
  items = [],
  className = "",
  variant = "carousel",
}) {
  const railRef = useRef(null);
  const carouselRef = useRef(null);
  const isGrid = variant === "grid";
  const isPaged = variant === "paged";
  const [itemsPerPage, setItemsPerPage] = useState(getPagedItemsPerPage);
  const [pageIndex, setPageIndex] = useState(0);
  const pagedPointerRef = useRef({
    pointerId: null,
    startX: 0,
    suppressClick: false,
  });
  const dragRef = useRef({
    hasDragged: false,
    isDragging: false,
    moved: false,
    pointerId: null,
    scrollLeft: 0,
    startX: 0,
    suppressClick: false,
  });
  const pages = useMemo(
    () => chunkItems(Array.isArray(items) ? items : [], itemsPerPage),
    [items, itemsPerPage],
  );
  const pageCount = Math.max(pages.length, 1);
  const activePageIndex = Math.min(pageIndex, pageCount - 1);

  useEffect(() => {
    if (!isPaged || typeof window === "undefined") return undefined;

    const updateItemsPerPage = () => {
      setItemsPerPage(getPagedItemsPerPageFromElement(carouselRef.current));
    };

    updateItemsPerPage();
    const frameId = globalThis.requestAnimationFrame?.(updateItemsPerPage);
    const mediaQueries = [
      "(min-width: 1500px)",
      "(min-width: 1000px)",
      "(min-width: 700px)",
      "(min-width: 421px)",
      "(max-width: 980px)",
      "(max-width: 720px)",
      "(max-width: 420px)",
    ].map((query) => window.matchMedia(query));
    const observer = typeof globalThis.ResizeObserver === "function"
      ? new globalThis.ResizeObserver(updateItemsPerPage)
      : null;

    if (observer && carouselRef.current) {
      observer.observe(carouselRef.current);
      observer.observe(document.documentElement);
    }

    window.addEventListener("resize", updateItemsPerPage);
    globalThis.visualViewport?.addEventListener("resize", updateItemsPerPage);
    mediaQueries.forEach((query) => {
      if (typeof query.addEventListener === "function") {
        query.addEventListener("change", updateItemsPerPage);
      } else {
        query.addListener?.(updateItemsPerPage);
      }
    });

    return () => {
      if (frameId) {
        globalThis.cancelAnimationFrame?.(frameId);
      }
      observer?.disconnect();
      window.removeEventListener("resize", updateItemsPerPage);
      globalThis.visualViewport?.removeEventListener("resize", updateItemsPerPage);
      mediaQueries.forEach((query) => {
        if (typeof query.removeEventListener === "function") {
          query.removeEventListener("change", updateItemsPerPage);
        } else {
          query.removeListener?.(updateItemsPerPage);
        }
      });
    };
  }, [isPaged]);

  useEffect(() => {
    setPageIndex((current) => Math.min(current, pageCount - 1));
  }, [pageCount]);

  function scrollRail(direction) {
    const rail = railRef.current;
    if (!rail) return;

    const card = rail.querySelector(".imcro-activity-carousel__card");
    const cardWidth = card?.getBoundingClientRect().width || 280;
    const railStyle = globalThis.getComputedStyle?.(rail);
    const gap = Number.parseFloat(railStyle?.columnGap || railStyle?.gap || "0") || 0;

    rail.scrollBy({
      left: direction * Math.round((cardWidth + gap) * 2),
      behavior: shouldReduceMotion() ? "auto" : "smooth",
    });
  }

  function endDrag(event) {
    const rail = railRef.current;
    if (!rail || !dragRef.current.isDragging) return;

    const hasDragged = dragRef.current.hasDragged || dragRef.current.moved;

    dragRef.current.isDragging = false;
    dragRef.current.hasDragged = false;
    rail.classList.remove("is-dragging");

    dragRef.current.pointerId = null;

    if (hasDragged) {
      dragRef.current.suppressClick = true;
      event.preventDefault();
      globalThis.setTimeout?.(() => {
        dragRef.current.suppressClick = false;
      }, 0);
    }
  }

  function handlePointerDown(event) {
    if (event.pointerType && event.pointerType !== "mouse") return;
    if (event.button !== 0) return;
    const rail = railRef.current;
    if (!rail) return;

    dragRef.current = {
      hasDragged: false,
      isDragging: true,
      moved: false,
      pointerId: event.pointerId,
      scrollLeft: rail.scrollLeft,
      startX: event.clientX,
      suppressClick: dragRef.current.suppressClick,
    };
  }

  function handlePointerMove(event) {
    const rail = railRef.current;
    if (!rail || !dragRef.current.isDragging) return;

    const deltaX = event.clientX - dragRef.current.startX;
    if (Math.abs(deltaX) < DRAG_THRESHOLD_PX && !dragRef.current.hasDragged) {
      return;
    }

    if (!dragRef.current.hasDragged) {
      dragRef.current.hasDragged = true;
      dragRef.current.moved = true;
      rail.classList.add("is-dragging");
    }

    rail.scrollLeft = dragRef.current.scrollLeft - deltaX;
    event.preventDefault();
  }

  function handleClickCapture(event) {
    if (!dragRef.current.suppressClick && !pagedPointerRef.current.suppressClick) return;

    event.preventDefault();
    event.stopPropagation();
    dragRef.current.moved = false;
    dragRef.current.suppressClick = false;
    pagedPointerRef.current.suppressClick = false;
  }

  function goToPage(nextIndex) {
    setPageIndex(Math.max(0, Math.min(pageCount - 1, nextIndex)));
  }

  function goPaged(direction) {
    goToPage(activePageIndex + direction);
  }

  function handlePagedPointerDown(event) {
    if (!isPaged) return;
    pagedPointerRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      suppressClick: false,
    };
  }

  function handlePagedPointerEnd(event) {
    if (!isPaged || pagedPointerRef.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - pagedPointerRef.current.startX;
    pagedPointerRef.current.pointerId = null;

    if (Math.abs(deltaX) < PAGED_SWIPE_THRESHOLD_PX) return;
    pagedPointerRef.current.suppressClick = true;
    goPaged(deltaX < 0 ? 1 : -1);
    event.preventDefault();
    globalThis.setTimeout?.(() => {
      pagedPointerRef.current.suppressClick = false;
    }, 0);
  }

  function renderActivityCard(item, index, isInactivePage = false) {
    return (
      <LinkedBox
        key={`${item.title || "activity"}-${index}`}
        className="imcro-activity-carousel__card"
        href={item.href}
        tabIndex={isInactivePage ? -1 : undefined}
      >
        {renderIcon(item.icon, "imcro-activity-carousel__icon")}
        <span className="imcro-activity-carousel__card-title">{item.title}</span>
      </LinkedBox>
    );
  }

  if (isPaged) {
    return (
      <section
        className={cx("imcro-activity-carousel", "imcro-activity-carousel--paged", className)}
        ref={carouselRef}
      >
        <div className="imcro-activity-carousel__head">
          {title && <h2 className="imcro-activity-carousel__title">{title}</h2>}
        </div>

        <div className="imcro-activity-carousel__stage">
          <button
            className="imcro-activity-carousel__arrow imcro-activity-carousel__arrow--prev"
            type="button"
            onClick={() => goPaged(-1)}
            disabled={activePageIndex === 0}
            aria-label="Предыдущие направления"
          >
            {"<"}
          </button>
          <div
            className="imcro-activity-carousel__viewport"
            onClickCapture={handleClickCapture}
            onPointerCancel={handlePagedPointerEnd}
            onPointerDown={handlePagedPointerDown}
            onPointerLeave={handlePagedPointerEnd}
            onPointerUp={handlePagedPointerEnd}
          >
            <div
              className="imcro-activity-carousel__pages"
              style={{ transform: `translateX(-${activePageIndex * 100}%)` }}
            >
              {pages.map((pageItems, pageNumber) => (
                <div
                  className="imcro-activity-carousel__page"
                  key={`activity-page-${pageNumber}`}
                  aria-hidden={pageNumber !== activePageIndex}
                >
                  {pageItems.map((item, index) => (
                    renderActivityCard(item, (pageNumber * itemsPerPage) + index, pageNumber !== activePageIndex)
                  ))}
                </div>
              ))}
            </div>
          </div>
          <button
            className="imcro-activity-carousel__arrow imcro-activity-carousel__arrow--next"
            type="button"
            onClick={() => goPaged(1)}
            disabled={activePageIndex >= pageCount - 1}
            aria-label="Следующие направления"
          >
            {">"}
          </button>
        </div>

        {pageCount > 1 && (
          <div className="imcro-activity-carousel__dots" aria-label="Страницы направлений">
            {pages.map((_, index) => (
              <button
                className={`imcro-activity-carousel__dot${index === activePageIndex ? " is-active" : ""}`}
                key={`activity-dot-${index}`}
                type="button"
                onClick={() => goToPage(index)}
                aria-label={`Показать страницу ${index + 1}`}
                aria-pressed={index === activePageIndex}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={cx("imcro-activity-carousel", isGrid && "imcro-activity-carousel--grid", className)}>
      <div className="imcro-activity-carousel__head">
        {title && <h2 className="imcro-activity-carousel__title">{title}</h2>}
      </div>

      <div className="imcro-activity-carousel__stage">
        {!isGrid && (
          <button
            className="imcro-activity-carousel__arrow imcro-activity-carousel__arrow--prev"
            type="button"
            onClick={() => scrollRail(-1)}
            aria-label="Предыдущие направления"
          >
            {"<"}
          </button>
        )}
        <div
          className="imcro-activity-carousel__rail"
          ref={railRef}
          onClickCapture={handleClickCapture}
          onPointerCancel={endDrag}
          onPointerDown={handlePointerDown}
          onPointerLeave={endDrag}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
        >
          {items.map((item, index) => renderActivityCard(item, index))}
        </div>
        {!isGrid && (
          <button
            className="imcro-activity-carousel__arrow imcro-activity-carousel__arrow--next"
            type="button"
            onClick={() => scrollRail(1)}
            aria-label="Следующие направления"
          >
            {">"}
          </button>
        )}
      </div>
    </section>
  );
}
