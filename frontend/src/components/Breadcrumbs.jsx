import { Link } from "react-router-dom";

export default function Breadcrumbs({ items = [], className = "" }) {
  const visibleItems = items.filter(Boolean);
  if (!visibleItems.length) return null;

  return (
    <nav className={`app-breadcrumbs ${className}`.trim()} aria-label="Хлебные крошки">
      <ol>
        {visibleItems.map((item, index) => {
          const isCurrent = index === visibleItems.length - 1 || item.current;
          return (
            <li key={`${item.label}-${index}`}>
              {index > 0 && <span className="app-breadcrumbs-separator" aria-hidden="true">/</span>}
              {item.to && !isCurrent ? (
                <Link to={item.to}>{item.label}</Link>
              ) : (
                <span aria-current={isCurrent ? "page" : undefined}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
