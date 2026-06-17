import ArticlesModule from "../../../features/admin/ArticlesModule.jsx";
import AdminLayout from "../../../features/admin/AdminLayout.jsx";

const ADMIN_MODULES = [
  { key: "dashboard", path: "/admin/dashboard", label: "Дашборд", icon: "dashboard" },
  { key: "articles", path: "/admin/dom-uchitelya/", label: "Статьи", icon: "articles" },
  { key: "issue", path: "/admin/certificates", label: "Выпуск грамот", icon: "issue" },
  { key: "editor", path: "/admin/templates", label: "Конструктор шаблонов", icon: "editor" },
  { key: "users", path: "/admin/users", label: "Пользователи и роли", icon: "users" },
  { key: "audit", path: "/admin/audit", label: "Журнал действий", icon: "audit" },
  { key: "settings", path: "/admin/settings", label: "Настройки портала", icon: "settings" },
];

export default function DomUchitelyaAdmin({
  currentUser,
  articles,
  saveArticle,
  deleteArticle,
  changeArticleStatus,
  onArticlesChanged,
}) {
  const domuArticles = articles.filter((article) =>
    ["both", "dom_uchitelya_only"].includes(article.publishing_scope || "imcro_only")
  );

  return (
    <AdminLayout
      modules={ADMIN_MODULES}
      activeKey="articles"
      title="Статьи Дома учителя"
      subtitle="Публикации раздела «Дом учителя» в общей административной системе"
      currentUser={currentUser}
    >
      <ArticlesModule
        currentUser={currentUser}
        articles={domuArticles}
        saveArticle={(article) => saveArticle({ ...article, publishing_scope: article.publishing_scope || "both" })}
        deleteArticle={deleteArticle}
        changeArticleStatus={changeArticleStatus}
        allowedScopes={["both", "dom_uchitelya_only"]}
        defaultScope="both"
        apiPath="/api/admin/dom-uchitelya/news/"
        uploadPath="/api/admin/dom-uchitelya/news/upload-cover/"
        uploadAttachmentPath="/api/admin/dom-uchitelya/news/upload-attachment/"
        isDomuMode
        onArticlesChanged={onArticlesChanged}
      />
    </AdminLayout>
  );
}
