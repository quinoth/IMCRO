import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../../components/Footer.jsx";
import { ImcroPage } from "../../components/imcro/ImcroPublicComponents.jsx";
import Header from "../../features/nav/Header.jsx";
import { HubSectionPageLayout } from "../hubs/HubSectionPageLayout.jsx";
import {
  findSectionByPath,
  getSectionBreadcrumbItems,
  normalizePath,
} from "./sectionStructure.js";

function nodeSearchTerms(node) {
  const pathParts = normalizePath(node.path).split("/").filter(Boolean);
  return [
    node.title,
    node.rootTitle,
    node.parentTitle,
    ...pathParts,
  ].filter(Boolean).map((value) => String(value).toLowerCase());
}

function articleMatchesNode(item, node) {
  const itemPaths = [
    item?.sectionPath,
    item?.parentPath,
  ].filter(Boolean).map(normalizePath);
  const nodePath = normalizePath(node.path);

  if (itemPaths.some((path) => path === nodePath || (node.level === 1 && path.startsWith(nodePath)))) {
    return true;
  }

  const haystack = [
    item?.parentLabel,
    item?.sectionLabel,
    item?.noko_section,
    item?.hub_kind,
    item?.hub_path,
    item?.methodika_subject,
    item?.title,
  ].filter(Boolean).join(" ").toLowerCase();

  return nodeSearchTerms(node).some((term) => term.length > 3 && haystack.includes(term));
}

function getSectionArticles(newsItems = [], node) {
  if (!Array.isArray(newsItems)) return [];
  return newsItems
    .filter((item) => item?.title && articleMatchesNode(item, node))
    .slice(0, 12);
}

function getSectionDescription(node) {
  return node.description || "Официальные материалы, документы и навигация по подразделу МКУ ИМЦРО.";
}

function getSectionBreadcrumbs(node) {
  return getSectionBreadcrumbItems(node).map((item) => ({
    label: item.label,
    href: item.to || "",
  }));
}

export function SectionRoutePage({ node, newsItems = [], ...props }) {
  const navigate = useNavigate();
  const articles = getSectionArticles(newsItems, node);
  const parentNode = node.parentPath ? findSectionByPath(node.parentPath) : null;

  useEffect(() => {
    document.title = `${node.title} | МКУ ИМЦРО`;
  }, [node.title]);

  const handleOpenArticle = props.onOpenArticle || ((article) => {
    const slug = article?.slug || article?.id || article?.articleId;
    if (!slug || article.isFallback) return;
    navigate(`/article/${encodeURIComponent(slug)}`, { state: { article } });
    window.scrollTo({ top: 0 });
  });

  return (
    <ImcroPage className="hub-section-page">
      <Header
        currentUser={props.currentUser}
        onGoAuth={props.onGoAuth}
        onGoAdmin={props.onGoAdmin}
        onGoProfile={props.onGoProfile}
      />
      <main className="hub-section-main">
        <HubSectionPageLayout
          title={node.title}
          description={getSectionDescription(node)}
          breadcrumbs={getSectionBreadcrumbs(node)}
          childSections={node.children || []}
          articles={articles}
          parentHref={parentNode?.path || node.rootPath}
          parentTitle={parentNode?.title || node.rootTitle}
          onOpenArticle={handleOpenArticle}
          showArticleList={!node.cardsOnly}
        />
      </main>
      <Footer />
    </ImcroPage>
  );
}
