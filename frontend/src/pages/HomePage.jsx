import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../features/nav/Header.jsx";
import Footer from "../components/Footer.jsx";
import {
  contactInfo,
  directions,
  keyEvents,
  mainSections,
} from "./homePageData.js";
import {
  CONTACT_COORDS,
  buildMapEmbedSrc,
  buildMapHref,
  getCarouselState,
  getFeaturedNews,
  getNewsAuthorHref,
  getNewsAuthorLabel,
  getNewsDateTime,
  getNewsDescription,
  getNewsHref,
  getNewsImage,
} from "./homePageUtils.js";

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function ChevronIcon({ direction = "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {direction === "left" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 6 6 6-6 6" />}
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
          <path d="M7 10.5a2 2 0 1 1 1.1-3.7" />
          <path d="M17 10.5a2 2 0 1 0-1.1-3.7" />
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
          <path d="M9 7h6" />
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
    case "family":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M7 20v-2c0-1.5 1.6-2.8 3.6-2.8h2.8c2 0 3.6 1.3 3.6 2.8v2" />
          <circle cx="12" cy="9" r="3" />
          <path d="M3.5 18.5v-.9c0-1 1-1.9 2.3-2.2" />
          <path d="M20.5 18.5v-.9c0-1-1-1.9-2.3-2.2" />
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
    case "map":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
          <path d="M9 3v15" />
          <path d="M15 6v15" />
        </svg>
      );
    case "culture":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M4 19h16" />
          <path d="M6 17V9l6-4 6 4v8" />
          <path d="M9 17v-5h6v5" />
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
    case "water":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 3s6 6.3 6 11a6 6 0 0 1-12 0c0-4.7 6-11 6-11Z" />
        </svg>
      );
    case "activity":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M4 14h4l2-7 4 10 2-6h4" />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M12 22s7-4 7-10V5l-7-3-7 3v7c0 6 7 10 7 10Z" />
          <path d="m9.5 12 1.8 1.8 3.7-4" />
        </svg>
      );
    case "tools":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="m14.7 6.3 3 3" />
          <path d="M4 20l8.8-8.8" />
          <path d="M16 4l4 4-3 3-4-4 3-3Z" />
          <path d="m5 8 3-3 4 4-3 3" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z" />
          <path d="m18 15 .9 2.6 2.6.9-2.6.9L18 21l-.9-2.6-2.6-.9 2.6-.9L18 15Z" />
        </svg>
      );
    case "mail":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 8 9 6 9-6" />
        </svg>
      );
    case "phone":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.6a2 2 0 0 1-.4 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.8.3 1.7.6 2.6.7a2 2 0 0 1 1.9 2Z" />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" {...common}>
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
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
  const directionsRef = useRef(null);
  const directionsDragRef = useRef({
    active: false,
    horizontal: false,
    moved: false,
    pointerId: null,
    scrollLeft: 0,
    startX: 0,
    startY: 0,
  });
  const suppressDirectionsClickRef = useRef(false);
  const [isDirectionsDragging, setIsDirectionsDragging] = useState(false);
  const [carouselState, setCarouselState] = useState({
    activeIndex: 0,
    activeCardIndex: 0,
    pageCount: 1,
    canPrev: false,
    canNext: false,
    progress: 0,
  });
  const featuredNews = useMemo(() => getFeaturedNews(publishedNews), [publishedNews]);
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

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll(".home-reveal"));
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const revealTimers = [];
    const getRevealDelay = (element) => {
      const value = window.getComputedStyle(element).getPropertyValue("--reveal-delay").trim();
      if (value.endsWith("ms")) return Number.parseFloat(value) || 0;
      if (value.endsWith("s")) return (Number.parseFloat(value) || 0) * 1000;
      return 0;
    };
    const revealElement = (element) => {
      element.classList.add("is-visible");
      const timer = window.setTimeout(() => {
        element.style.transitionDelay = "0ms";
      }, getRevealDelay(element) + 700);
      revealTimers.push(timer);
    };

    if (reducedMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => {
        element.classList.add("is-visible");
        element.style.transitionDelay = "0ms";
      });
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealElement(entry.target);
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.14,
    });

    elements.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      revealTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [featuredNews]);

  const getDirectionsPageCount = useCallback(() => {
    const node = directionsRef.current;
    const card = node?.querySelector(".direction-card");
    if (!node || !card) return 1;
    const styles = window.getComputedStyle(node);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
    const cardWidth = card.getBoundingClientRect().width;
    const visibleCount = Math.max(1, Math.floor((node.clientWidth + gap) / (cardWidth + gap)));
    return Math.max(1, Math.ceil(directions.length / visibleCount));
  }, []);

  const getDirectionsCardMetrics = useCallback(() => {
    const node = directionsRef.current;
    const card = node?.querySelector(".direction-card");
    if (!node || !card) return { cardWidth: 0, gap: 0 };
    const styles = window.getComputedStyle(node);
    return {
      cardWidth: card.getBoundingClientRect().width,
      gap: Number.parseFloat(styles.columnGap || styles.gap || "0") || 0,
    };
  }, []);

  const updateCarouselState = useCallback(() => {
    const node = directionsRef.current;
    if (!node) return;
    const pageCount = getDirectionsPageCount();
    const { cardWidth, gap } = getDirectionsCardMetrics();
    const activeCardIndex = cardWidth > 0
      ? Math.min(directions.length - 1, Math.round(node.scrollLeft / (cardWidth + gap)))
      : 0;
    const nextState = {
      ...getCarouselState({
        scrollLeft: node.scrollLeft,
        scrollWidth: node.scrollWidth,
        clientWidth: node.clientWidth,
        pageCount,
      }),
      activeCardIndex,
      pageCount,
    };
    setCarouselState((prev) => (
      prev.activeIndex === nextState.activeIndex
        && prev.pageCount === nextState.pageCount
        && prev.activeCardIndex === nextState.activeCardIndex
        && prev.canPrev === nextState.canPrev
        && prev.canNext === nextState.canNext
        && Math.abs((prev.progress || 0) - nextState.progress) < 0.002
        ? prev
        : nextState
    ));
  }, [getDirectionsCardMetrics, getDirectionsPageCount]);

  useEffect(() => {
    const node = directionsRef.current;
    if (!node) return undefined;
    let frameId = 0;
    const refresh = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateCarouselState);
    };

    refresh();
    node.addEventListener("scroll", refresh, { passive: true });
    window.addEventListener("resize", refresh);
    return () => {
      window.cancelAnimationFrame(frameId);
      node.removeEventListener("scroll", refresh);
      window.removeEventListener("resize", refresh);
    };
  }, [updateCarouselState]);

  const scrollDirections = useCallback((direction) => {
    const node = directionsRef.current;
    if (!node) return;
    const { cardWidth, gap } = getDirectionsCardMetrics();
    const cardStep = cardWidth > 0 ? (cardWidth + gap) * 3 : 0;
    const step = Math.min(820, Math.max(260, cardStep || node.clientWidth * 0.75));
    node.scrollBy({ left: direction * step, behavior: "smooth" });
  }, [getDirectionsCardMetrics]);

  const endDirectionsDrag = useCallback(() => {
    const node = directionsRef.current;
    const drag = directionsDragRef.current;
    if (!drag.active) return;

    if (node && drag.pointerId !== null && node.hasPointerCapture?.(drag.pointerId)) {
      node.releasePointerCapture(drag.pointerId);
    }

    if (drag.moved) {
      suppressDirectionsClickRef.current = true;
      window.setTimeout(() => {
        suppressDirectionsClickRef.current = false;
      }, 140);
    }

    directionsDragRef.current = {
      active: false,
      horizontal: false,
      moved: false,
      pointerId: null,
      scrollLeft: 0,
      startX: 0,
      startY: 0,
    };
    setIsDirectionsDragging(false);
  }, []);

  const handleDirectionsPointerDown = useCallback((event) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const node = directionsRef.current;
    if (!node) return;

    directionsDragRef.current = {
      active: true,
      horizontal: false,
      moved: false,
      pointerId: event.pointerId,
      scrollLeft: node.scrollLeft,
      startX: event.clientX,
      startY: event.clientY,
    };
    setIsDirectionsDragging(true);

    if (event.pointerType !== "touch") {
      node.setPointerCapture?.(event.pointerId);
    }
  }, []);

  const handleDirectionsPointerMove = useCallback((event) => {
    const node = directionsRef.current;
    const drag = directionsDragRef.current;
    if (!node || !drag.active || drag.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.horizontal) {
      if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return;
      if (Math.abs(deltaX) < Math.abs(deltaY)) return;
      drag.horizontal = true;
      node.setPointerCapture?.(event.pointerId);
    }

    event.preventDefault();
    drag.moved = true;
    node.scrollLeft = drag.scrollLeft - deltaX;
  }, []);

  const handleDirectionsPointerLeave = useCallback((event) => {
    if (event.pointerType === "mouse" && event.buttons === 0) {
      endDirectionsDrag();
    }
  }, [endDirectionsDrag]);

  const handleDirectionsClickCapture = useCallback((event) => {
    if (!suppressDirectionsClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleFeaturedNewsClick = useCallback((event) => {
    if (!featuredNews) return;
    const target = event.target;
    if (target instanceof Element && target.closest("a, button")) return;
    if (onOpenArticle) {
      onOpenArticle(featuredNews);
    } else {
      navigate(featuredNewsHref, { state: { article: featuredNews } });
      window.scrollTo({ top: 0 });
    }
  }, [featuredNews, featuredNewsHref, navigate, onOpenArticle]);

  const handleFeaturedNewsKeyDown = useCallback((event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (onOpenArticle) {
      onOpenArticle(featuredNews);
    } else if (featuredNews) {
      navigate(featuredNewsHref, { state: { article: featuredNews } });
      window.scrollTo({ top: 0 });
    }
  }, [featuredNews, featuredNewsHref, navigate, onOpenArticle]);

  const handleFeaturedNewsLinkClick = useCallback((event) => {
    if (!featuredNews || !onOpenArticle) return;
    event.preventDefault();
    onOpenArticle(featuredNews);
  }, [featuredNews, onOpenArticle]);

  const handleFeaturedAuthorClick = useCallback((event) => {
    if (!featuredNews || !onOpenAuthor) return;
    event.preventDefault();
    onOpenAuthor(featuredNews);
  }, [featuredNews, onOpenAuthor]);

  return (
    <div className="home-page">
      <style>{`
        .home-page {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          color: #121d26;
        }

        .home-page svg {
          width: 1em;
          height: 1em;
        }

        .home-main {
          flex: 1;
          background: #ffffff;
        }

        .home-container {
          width: min(1280px, calc(100% - 48px));
          margin: 0 auto;
        }

        .home-reveal {
          opacity: 0;
          transform: translateY(24px);
          transition:
            opacity 0.62s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.62s cubic-bezier(0.22, 1, 0.36, 1);
          transition-delay: var(--reveal-delay, 0ms);
          will-change: opacity, transform;
        }

        .home-reveal.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .home-top-section {
          background: #ffffff;
          padding: 58px 0 56px;
        }

        .home-top-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.36fr) minmax(340px, 0.94fr);
          gap: 40px;
          align-items: stretch;
        }

        .main-news-column {
          display: flex;
          min-width: 0;
          flex-direction: column;
        }

        .home-section-head {
          min-height: 38px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 26px;
        }

        .home-section-title {
          margin: 0;
          color: #121d26;
          font-size: 24px;
          font-weight: 700;
          line-height: 1.18;
          letter-spacing: 0;
        }

        .home-all-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #005e7d;
          text-decoration: none;
          font-size: 12px;
          font-weight: 800;
          line-height: 1;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .home-all-link svg {
          width: 15px;
          height: 15px;
          stroke: currentColor;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }

        .home-all-link:hover {
          color: #004f75;
        }

        .main-news-card {
          position: relative;
          min-height: 408px;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          overflow: hidden;
          padding: 34px;
          border: 0;
          border-radius: 8px;
          background: linear-gradient(135deg, #19789c 0%, #004f75 100%);
          color: #ffffff;
          text-decoration: none;
          isolation: isolate;
          cursor: pointer;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.15);
          transition: transform 0.22s ease, box-shadow 0.22s ease;
        }

        .main-news-card:not(.is-empty):hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.22);
        }

        .main-news-card:focus-visible {
          outline: 3px solid rgba(25, 120, 156, 0.32);
          outline-offset: 4px;
        }

        .main-news-bg {
          position: absolute;
          inset: 0;
          z-index: -2;
          background-position: center;
          background-size: cover;
          transition: transform 0.28s ease;
        }

        .main-news-card:not(.is-empty):hover .main-news-bg {
          transform: scale(1.04);
        }

        .main-news-card::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background:
            linear-gradient(180deg, rgba(0, 31, 48, 0.05) 0%, rgba(0, 31, 48, 0.99) 100%),
            linear-gradient(90deg, rgba(0, 79, 117, 0.15) 0%, rgba(0, 79, 117, 0.05) 72%);
          transition: opacity 0.2s ease;
        }

        .main-news-card:not(.is-empty):hover::before {
          opacity: 0.88;
        }

        .main-news-content {
          max-width: 760px;
        }

        .main-news-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }

        .main-news-date {
          color: rgba(255, 255, 255, 0.84);
          font-size: 13px;
          font-weight: 600;
        }

        .main-news-author {
          color: rgba(255, 255, 255, 0.84);
          font-size: 13px;
          font-weight: 600;
        }

        .main-news-author-link {
          color: #ffffff;
          text-decoration: underline;
          text-decoration-color: rgba(255, 255, 255, 0.42);
          text-underline-offset: 4px;
          font-weight: 800;
        }

        .main-news-author-link:hover {
          text-decoration-color: #ffffff;
        }

        .main-news-title {
          display: block;
          margin: 0 0 22px;
          color: #ffffff;
          font-size: clamp(26px, 3.1vw, 36px);
          font-weight: 800;
          line-height: 1.13;
          letter-spacing: 0;
          overflow-wrap: anywhere;
        }

        .main-news-description {
          max-width: 660px;
          margin: 0 0 36px;
          color: rgba(255, 255, 255, 0.88);
          font-size: 16px;
          font-weight: 400;
          line-height: 1.65;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .main-news-actions {
          display: flex;
          align-items: center;
          gap: 26px;
          margin-top: auto;
          flex-wrap: wrap;
        }

        .home-primary-btn {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          background: #005e7d;
          color: #ffffff;
          padding: 0 28px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 1px 2px rgba(0, 79, 117, 0.12);
          transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
        }

        .home-primary-btn:hover {
          background: #004f75;
          transform: translateY(-1px);
        }

        .main-news-card .home-primary-btn {
          background: #ffffff;
          color: #004f75;
        }

        .main-news-card .home-primary-btn:hover {
          background: #edf4ff;
        }

        .event-banner-list {
          display: grid;
          gap: 20px;
        }

        .event-banner {
          position: relative;
          display: block;
          aspect-ratio: 3 / 1;
          overflow: hidden;
          border-radius: 8px;
          color: #ffffff;
          text-decoration: none;
          isolation: isolate;
          background: #f4f9fc;
          border: 1px solid rgba(0, 79, 117, 0.12);
          box-shadow: 0 16px 34px rgba(15, 23, 42, 0.16);
          transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
        }

        body.mky-a11y-mode .home-page .event-banner {
          min-height: 0;
        }

        .event-banner-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          border-radius: inherit;
          transition: transform 0.24s ease;
        }

        .event-banner:hover {
          border-color: rgba(0, 79, 117, 0.28);
          transform: translateY(-3px);
          box-shadow: 0 18px 34px rgba(0, 79, 117, 0.2);
        }

        .event-banner:hover .event-banner-image {
          transform: scale(1.025);
        }

        .main-sections-band {
          background: #19789c;
          padding: 58px 0 62px;
        }

        .main-sections-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
        }

        .main-section-card {
          min-height: 206px;
          display: flex;
          flex-direction: column;
          padding: 30px;
          border-radius: 8px;
          background: #ffffff;
          color: #121d26;
          text-decoration: none;
          box-shadow: 0 3px 10px rgba(0, 31, 48, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.74);
          transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
        }

        .main-section-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(0, 31, 48, 0.18);
        }

        .card-icon {
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 24px;
          border-radius: 4px;
          background: #edf4ff;
          color: #005e7d;
          flex: 0 0 auto;
        }

        .card-icon svg {
          width: 24px;
          height: 24px;
        }

        .main-section-card:hover .card-icon,
        .direction-card:hover .card-icon {
          background: #19789c;
          color: #ffffff;
        }

        .main-section-card h3 {
          margin: 0 0 12px;
          color: #111827;
          font-size: 19px;
          font-weight: 700;
          line-height: 1.28;
          letter-spacing: 0;
        }

        .main-section-card p {
          margin: 0;
          color: #3f484d;
          font-size: 14px;
          font-weight: 400;
          line-height: 1.55;
        }

        .directions-section {
          background: linear-gradient(180deg, #ffffff 0%, #f4f9fc 100%);
          overflow: hidden;
          padding: 70px 0 80px;
        }

        .directions-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .directions-kicker {
          margin: 6px 0 0;
          color: #3f484d;
          font-size: 14px;
          line-height: 1.45;
        }

        .carousel-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 0 0 auto;
        }

        .carousel-btn {
          width: 48px;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0, 79, 117, 0.18);
          border-radius: 50%;
          background: #19789c;
          color: #ffffff;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(0, 79, 117, 0.18);
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
        }

        .carousel-btn svg {
          width: 21px;
          height: 21px;
          stroke: currentColor;
          stroke-width: 2.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }

        .carousel-btn:hover {
          border-color: #004f75;
          background: #004f75;
          color: #ffffff;
          transform: translateY(-1px);
          box-shadow: 0 14px 28px rgba(0, 79, 117, 0.22);
        }

        .carousel-btn:disabled {
          border-color: #d8e0e6;
          background: #ffffff;
          color: #9aa8b2;
          cursor: default;
          opacity: 0.6;
          box-shadow: none;
        }

        .carousel-btn:disabled:hover {
          background: #ffffff;
          color: #9aa8b2;
          transform: none;
        }

        .directions-carousel-shell {
          position: relative;
          overflow: hidden;
          margin: 0 -12px;
          padding: 18px 0 8px 12px;
        }

        .directions-carousel-shell::after {
          content: "";
          position: absolute;
          inset: 0 0 0 auto;
          width: min(92px, 18vw);
          pointer-events: none;
          background: linear-gradient(90deg, rgba(244, 249, 252, 0), #f4f9fc 86%);
        }

        .directions-rail {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          scroll-behavior: smooth;
          scrollbar-width: none;
          overscroll-behavior-x: contain;
          padding: 4px 78px 30px 0;
          scroll-snap-type: x mandatory;
          touch-action: pan-y;
          cursor: grab;
          user-select: none;
          -webkit-overflow-scrolling: touch;
        }

        .directions-rail.is-dragging {
          cursor: grabbing;
          scroll-behavior: auto;
          scroll-snap-type: none;
        }

        .directions-rail::-webkit-scrollbar {
          display: none;
        }

        .direction-card {
          position: relative;
          flex: 0 0 clamp(214px, 18vw, 244px);
          min-height: 170px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          padding: 24px;
          border: 1px solid rgba(0, 79, 117, 0.18);
          border-radius: 8px;
          background:
            linear-gradient(180deg, #ffffff 0%, #f9fcfe 100%);
          color: #121d26;
          text-align: center;
          text-decoration: none;
          scroll-snap-align: start;
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07);
          overflow: hidden;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
        }

        body.mky-a11y-mode .home-page .direction-card {
          min-height: 170px;
        }

        .direction-card::before {
          content: "";
          position: absolute;
          inset: 0 auto 0 0;
          width: 4px;
          background: linear-gradient(180deg, #19789c, #004f75);
          opacity: 0;
          transition: opacity 0.22s ease;
        }

        .direction-card:hover {
          border-color: rgba(25, 120, 156, 0.72);
          background: #ffffff;
          box-shadow: 0 20px 40px rgba(0, 79, 117, 0.15);
          transform: translateY(-4px);
        }

        .direction-card.is-active {
          border-color: rgba(25, 120, 156, 0.9);
          box-shadow: 0 20px 38px rgba(0, 79, 117, 0.16);
        }

        .direction-card:hover::before,
        .direction-card.is-active::before {
          opacity: 1;
        }

        .direction-card .card-icon {
          width: 42px;
          height: 42px;
          margin: 0;
          background: #e3f2f8;
          color: #004f75;
        }

        .direction-card .card-icon svg {
          width: 21px;
          height: 21px;
        }

        .direction-title {
          color: #111827;
          font-size: 14.5px;
          font-weight: 800;
          line-height: 1.3;
          overflow-wrap: anywhere;
          text-align: center;
        }

        .carousel-status {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-top: 8px;
        }

        .carousel-progress {
          width: min(460px, 76vw);
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(216, 231, 238, 0.86);
          box-shadow:
            inset 0 0 0 1px rgba(0, 79, 117, 0.09),
            0 8px 18px rgba(0, 79, 117, 0.08);
        }

        .carousel-progress-fill {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #19789c, #004f75);
          transform-origin: left center;
          box-shadow: 0 0 18px rgba(25, 120, 156, 0.32);
          transition: transform 0.18s ease;
        }

        .carousel-count {
          min-width: 46px;
          color: #004f75;
          font-size: 13px;
          font-weight: 900;
          text-align: right;
        }

        .contact-section {
          background: #ffffff;
          padding: 24px 0 70px;
        }

        .contact-card {
          display: grid;
          grid-template-columns: minmax(0, 1.45fr) minmax(290px, 0.9fr);
          gap: 42px;
          align-items: center;
          padding: 30px;
          border-radius: 20px;
          background: linear-gradient(135deg, #19789c 0%, #004f75 100%);
          box-shadow: 0 18px 36px rgba(0, 79, 117, 0.25);
        }

        .map-panel {
          min-height: 340px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: inset 0 0 0 1px rgba(0, 79, 117, 0.1);
          padding: 16px;
        }

        .contact-map-frame {
          width: 100%;
          height: 100%;
          min-height: 308px;
          border: 0;
          border-radius: 8px;
          background: #eef2f6;
        }

        .map-open-link {
          position: absolute;
          left: 32px;
          bottom: 24px;
          min-height: 32px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.94);
          color: #005e7d;
          padding: 0 10px;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
        }

        .map-open-link:hover {
          background: #ffffff;
          color: #004f75;
        }

        .contact-info {
          color: #ffffff;
          padding-right: 14px;
        }

        .contact-info h2 {
          margin: 0 0 28px;
          color: #ffffff;
          font-size: 26px;
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: 0;
        }

        .contact-list {
          display: grid;
          gap: 22px;
          margin-bottom: 32px;
        }

        .contact-item {
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          gap: 14px;
          align-items: start;
        }

        .contact-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        .contact-icon svg {
          width: 21px;
          height: 21px;
        }

        .contact-label {
          display: block;
          margin-bottom: 5px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 11px;
          font-weight: 800;
          line-height: 1;
          text-transform: uppercase;
        }

        .contact-value {
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          line-height: 1.5;
          text-decoration: none;
        }

        .contact-value:hover {
          text-decoration: underline;
          text-underline-offset: 4px;
        }

        .contact-btn {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: #edf4ff;
          color: #004f75;
          padding: 0 26px;
          font-size: 14px;
          font-weight: 800;
          text-decoration: none;
        }

        .contact-btn:hover {
          background: #ffffff;
          transform: translateY(-1px);
        }

        .main-news-card.home-reveal,
        .event-banner.home-reveal,
        .main-section-card.home-reveal,
        .directions-head.home-reveal,
        .contact-card.home-reveal {
          transition:
            opacity 0.62s cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay, 0ms),
            transform 0.62s cubic-bezier(0.22, 1, 0.36, 1) var(--reveal-delay, 0ms),
            box-shadow 0.24s ease,
            border-color 0.24s ease,
            background 0.24s ease;
        }

        @media (prefers-reduced-motion: reduce) {
          .home-reveal,
          .main-news-card.home-reveal,
          .event-banner.home-reveal,
          .main-section-card.home-reveal,
          .directions-head.home-reveal,
          .contact-card.home-reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }

          .directions-rail {
            scroll-behavior: auto;
          }

          .main-news-bg,
          .event-banner-image,
          .carousel-progress-fill {
            transition: none;
          }
        }

        @media (max-width: 1020px) {
          .home-top-grid {
            grid-template-columns: 1fr;
          }

          .main-news-card {
            height: auto;
            min-height: 0;
          }

          .main-sections-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .direction-card {
            flex-basis: calc((100% - 42px) / 3.25);
          }

          .contact-card {
            grid-template-columns: 1fr;
            gap: 30px;
          }

          .contact-info {
            padding: 0 6px 6px;
          }
        }

        @media (max-width: 720px) {
          .home-container {
            width: min(100% - 32px, 1280px);
          }

          .home-top-section {
            padding: 42px 0 44px;
          }

          .home-section-head,
          .directions-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .carousel-controls {
            align-self: flex-end;
          }

          .main-news-card {
            padding: 24px;
          }

          .main-news-title {
            font-size: 26px;
          }

          .event-banner {
            aspect-ratio: 3 / 1;
          }

          body.mky-a11y-mode .home-page .event-banner {
            min-height: 0;
          }

          .main-sections-band {
            padding: 42px 0 46px;
          }

          .main-sections-grid {
            grid-template-columns: 1fr;
          }

          .main-section-card {
            min-height: 0;
            padding: 24px;
          }

          .directions-section {
            padding: 48px 0 58px;
          }

          .directions-carousel-shell {
            margin: 0 -16px;
            padding-left: 16px;
          }

          .directions-carousel-shell::after {
            width: 54px;
          }

          .directions-rail {
            padding-right: 54px;
          }

          .direction-card {
            flex-basis: 74vw;
            min-width: 224px;
            max-width: 304px;
            min-height: 160px;
            padding: 20px;
          }

          body.mky-a11y-mode .home-page .direction-card {
            min-height: 160px;
          }

          .contact-section {
            padding-bottom: 52px;
          }

          .contact-card {
            padding: 18px;
            border-radius: 14px;
          }

          .map-panel {
            min-height: 260px;
            padding: 18px;
          }

          .contact-map-frame {
            min-height: 238px;
          }

          .map-open-link {
            left: 22px;
            bottom: 18px;
          }

          .contact-info h2 {
            font-size: 23px;
          }
        }

        @media (max-width: 420px) {
          .main-news-actions {
            align-items: stretch;
            flex-direction: column;
            gap: 14px;
          }

          .home-primary-btn {
            width: 100%;
          }

          .contact-item {
            grid-template-columns: 36px minmax(0, 1fr);
            gap: 12px;
          }

          .contact-icon {
            width: 36px;
            height: 36px;
          }
        }
      `}</style>

      <Header
        onGoAuth={onGoAuth || ((tab) => navigate(`/auth?tab=${tab || "login"}`))}
        onGoAdmin={onGoAdmin || (() => navigate("/admin"))}
        onGoProfile={onGoProfile}
        currentUser={currentUser}
      />

      <main className="home-main">
        <section className="home-top-section" aria-labelledby="main-news-title">
          <div className="home-container home-top-grid">
            <div className="main-news-column">
              <div className="home-section-head">
                <h1 className="home-section-title" id="main-news-title">Главная новость</h1>
                <Link className="home-all-link" to="/novosti/">
                  <span>Все новости</span>
                  <ArrowRightIcon />
                </Link>
              </div>

              {featuredNews ? (
                <article
                  className="main-news-card home-reveal"
                  role="link"
                  tabIndex={0}
                  onClick={handleFeaturedNewsClick}
                  onKeyDown={handleFeaturedNewsKeyDown}
                >
                  <span className="main-news-bg" style={{ backgroundImage: `url(${featuredNewsImage})` }} aria-hidden="true" />
                  <span className="main-news-content">
                    <span className="main-news-meta">
                      {featuredNewsDateTime && <time className="main-news-date">{featuredNewsDateTime}</time>}
                      <span className="main-news-author">
                        Автор:{" "}
                        <Link
                          className="main-news-author-link"
                          to={featuredNewsAuthorHref}
                          state={{ authorName: featuredNewsAuthor }}
                          onClick={handleFeaturedAuthorClick}
                        >
                          {featuredNewsAuthor}
                        </Link>
                      </span>
                    </span>
                    <span className="main-news-title">{featuredNews.title}</span>
                    {featuredNewsDescription && <span className="main-news-description">{featuredNewsDescription}</span>}
                    <span className="main-news-actions">
                      <Link
                        className="home-primary-btn"
                        to={featuredNewsHref}
                        state={{ article: featuredNews }}
                        onClick={handleFeaturedNewsLinkClick}
                      >
                        Подробнее
                      </Link>
                    </span>
                  </span>
                </article>
              ) : (
                <article className="main-news-card is-empty home-reveal">
                  <div className="main-news-content">
                    <div className="main-news-meta">
                      <span className="main-news-author">Редакция ИМЦРО</span>
                    </div>
                    <h2 className="main-news-title">Новости пока не опубликованы</h2>
                    <p className="main-news-description">
                      После публикации материалов в базе данных здесь появится последняя актуальная новость.
                    </p>
                  </div>
                </article>
              )}
            </div>

            <aside aria-labelledby="key-events-title">
              <div className="home-section-head">
                <h2 className="home-section-title" id="key-events-title">Ключевые мероприятия</h2>
              </div>
              <div className="event-banner-list">
                {keyEvents.map((event) => (
                  <Link
                    key={event.title}
                    className="event-banner home-reveal"
                    to={event.href}
                  >
                    <img className="event-banner-image" src={event.image} alt={event.title} loading="lazy" />
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="main-sections-band" aria-label="Главные разделы">
          <div className="home-container">
            <div className="main-sections-grid">
              {mainSections.map((section, index) => (
                <Link
                  key={section.title}
                  className="main-section-card home-reveal"
                  to={section.href}
                  style={{ "--reveal-delay": `${index * 55}ms` }}
                >
                  <span className="card-icon"><Icon name={section.icon} /></span>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="directions-section" aria-labelledby="directions-title">
          <div className="home-container">
            <div className="directions-head home-reveal">
              <div>
                <h2 className="home-section-title" id="directions-title">Направления деятельности</h2>
                <p className="directions-kicker">
                  Методические объединения, образовательные направления и профессиональные сообщества
                </p>
              </div>
              <div className="carousel-controls" aria-label="Управление каруселью направлений деятельности">
                <button
                  className="carousel-btn"
                  type="button"
                  onClick={() => scrollDirections(-1)}
                  aria-label="Предыдущие направления деятельности"
                  disabled={!carouselState.canPrev}
                >
                  <ChevronIcon direction="left" />
                </button>
                <button
                  className="carousel-btn"
                  type="button"
                  onClick={() => scrollDirections(1)}
                  aria-label="Следующие направления деятельности"
                  disabled={!carouselState.canNext}
                >
                  <ChevronIcon />
                </button>
              </div>
            </div>

            <div className="directions-carousel-shell">
              <div
                className={`directions-rail${isDirectionsDragging ? " is-dragging" : ""}`}
                ref={directionsRef}
                onClickCapture={handleDirectionsClickCapture}
                onDragStart={(event) => event.preventDefault()}
                onPointerCancel={endDirectionsDrag}
                onPointerDown={handleDirectionsPointerDown}
                onPointerLeave={handleDirectionsPointerLeave}
                onPointerMove={handleDirectionsPointerMove}
                onPointerUp={endDirectionsDrag}
              >
                {directions.map((direction, index) => (
                  <Link
                    key={direction.title}
                    className={`direction-card${index === carouselState.activeCardIndex ? " is-active" : ""}`}
                    to={direction.href}
                  >
                    <span className="card-icon"><Icon name={direction.icon} /></span>
                    <span className="direction-title">{direction.title}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="carousel-status" aria-label="Позиция карусели направлений деятельности">
              <div
                className="carousel-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round((carouselState.progress || 0) * 100)}
              >
                <span
                  className="carousel-progress-fill"
                  style={{ transform: `scaleX(${Math.max(0.08, carouselState.progress || 0)})` }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="contact-section" aria-labelledby="contact-title">
          <div className="home-container">
            <div className="contact-card home-reveal">
              <div className="map-panel">
                <iframe
                  className="contact-map-frame"
                  src={mapEmbedSrc}
                  title="Карта расположения МКУ ИМЦРО"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <a className="map-open-link" href={mapHref} target="_blank" rel="noreferrer">
                  <Icon name="map" />
                  <span>Открыть на карте</span>
                </a>
              </div>

              <div className="contact-info">
                <h2 id="contact-title">Контактная информация</h2>
                <div className="contact-list">
                  <div className="contact-item">
                    <span className="contact-icon"><Icon name="pin" /></span>
                    <div>
                      <span className="contact-label">Адрес</span>
                      <span className="contact-value">{contactInfo.address}</span>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon"><Icon name="phone" /></span>
                    <div>
                      <span className="contact-label">Телефон</span>
                      <a className="contact-value" href="tel:+73952201985">{contactInfo.phone}</a>
                    </div>
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon"><Icon name="mail" /></span>
                    <div>
                      <span className="contact-label">Электронная почта</span>
                      <a className="contact-value" href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                    </div>
                  </div>
                </div>
                <a className="contact-btn" href={mapHref} target="_blank" rel="noreferrer">Открыть на карте</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
