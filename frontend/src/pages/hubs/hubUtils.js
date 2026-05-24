import { methodikaSubjectSlug } from "../../features/admin/articleTaxonomy.js";

export function getMethodikaArticleBackPath(article) {
  const slug = methodikaSubjectSlug(article?.methodika_subject || "");
  return slug ? `/metodika/${slug}/` : "/metodika/";
}
