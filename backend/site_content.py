from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urljoin, urlparse

from sqlalchemy import or_

from config import SITE_ASSET_BASE_URL, SITE_START_URL, SUPPORTED_DOC_EXTENSIONS

logger = logging.getLogger("site_content")


TEXT_KEYS = {
    "title",
    "name",
    "label",
    "text",
    "body",
    "content",
    "description",
    "caption",
    "quote",
    "author",
    "lead",
    "excerpt",
}


def _compact(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()


def _absolute_url(value: str, base_url: str) -> str:
    value = (value or "").strip()
    if not value:
        return ""
    if value.startswith(("http://", "https://")):
        return value
    return urljoin(base_url.rstrip("/") + "/", value.lstrip("/"))


def _filename_from_url(url: str) -> str:
    return unquote(urlparse(url).path.rsplit("/", 1)[-1] or "").strip()


def _is_supported_document_url(url: str) -> bool:
    path = unquote(urlparse(url).path).lower()
    return any(path.endswith(ext) for ext in SUPPORTED_DOC_EXTENSIONS)


def _article_url(article) -> str:
    slug = getattr(article, "slug", None) or str(getattr(article, "id", "article"))
    sections = _article_section_keys(article)
    if any(key.startswith("domu:") for key in sections):
        path = f"dom-uchitelya/news/{slug}"
    elif "events" in sections or getattr(article, "duplicate_to_events", False):
        path = f"events/{slug}"
    elif any(key.startswith("methodika") for key in sections):
        path = f"methodika/{slug}"
    elif any(key.startswith("noko:") for key in sections):
        path = f"noko/{slug}"
    else:
        path = f"news/{slug}"
    return _absolute_url(path, SITE_START_URL)


def _article_section_keys(article) -> set[str]:
    keys: set[str] = set()
    for section in getattr(article, "sections", None) or []:
        if isinstance(section, dict):
            key = section.get("key")
        else:
            key = section
        if key:
            keys.add(str(key))
    if keys:
        return keys

    if getattr(article, "duplicate_to_main", False):
        keys.add("home")
    if getattr(article, "duplicate_to_events", False):
        keys.add("events")
    if getattr(article, "dom_uchitelya_section", None):
        keys.add(f"domu:{article.dom_uchitelya_section}")
    if getattr(article, "methodika_subject", None):
        keys.add(f"methodika_subject:{article.methodika_subject}")
    if getattr(article, "hub_kind", None):
        keys.add(f"{article.hub_kind}:{getattr(article, 'hub_path', None) or 'root'}")
    if getattr(article, "noko_section", None):
        keys.add(f"noko:{article.noko_section}")
    return keys or {"home"}


def _collect_block_text(value: Any, parts: list[str]) -> None:
    if isinstance(value, str):
        text = _compact(value)
        if text and not text.startswith(("/", "http://", "https://")):
            parts.append(text)
        return
    if isinstance(value, list):
        for item in value:
            _collect_block_text(item, parts)
        return
    if not isinstance(value, dict):
        return

    for key in TEXT_KEYS:
        if key in value:
            _collect_block_text(value.get(key), parts)
    for key, nested in value.items():
        if key in TEXT_KEYS or key in {"url", "href", "src", "image", "file", "file_url"}:
            continue
        if isinstance(nested, (dict, list)):
            _collect_block_text(nested, parts)


def _article_text(article) -> str:
    parts = [
        f"Материал сайта: {getattr(article, 'title', '')}",
        getattr(article, "excerpt", "") or "",
        getattr(article, "lead", "") or "",
        getattr(article, "body", "") or "",
        getattr(article, "content", "") or "",
    ]
    _collect_block_text(getattr(article, "blocks", None) or [], parts)

    sections = sorted(_article_section_keys(article))
    if sections:
        parts.append("Разделы: " + ", ".join(sections))

    attachments = getattr(article, "attachments", None) or []
    attachment_names = [
        str(item.get("name") or item.get("title") or _filename_from_url(str(item.get("url") or "")))
        for item in attachments
        if isinstance(item, dict) and (item.get("url") or item.get("name") or item.get("title"))
    ]
    if attachment_names:
        parts.append("Вложения: " + ", ".join(_compact(name) for name in attachment_names if _compact(name)))

    return "\n\n".join(_compact(part) for part in parts if _compact(part))


def _article_documents(article, page_url: str) -> dict[str, dict]:
    documents: dict[str, dict] = {}
    for item in getattr(article, "attachments", None) or []:
        if not isinstance(item, dict):
            continue
        raw_url = str(item.get("url") or item.get("href") or item.get("file_url") or "").strip()
        if not raw_url:
            continue
        doc_url = _absolute_url(raw_url, SITE_ASSET_BASE_URL)
        if not _is_supported_document_url(doc_url):
            continue

        filename = _filename_from_url(doc_url)
        title = _compact(str(item.get("name") or item.get("title") or filename))
        documents[doc_url] = {
            "url": doc_url,
            "title": title or filename or doc_url,
            "page_url": page_url,
            "page_title": getattr(article, "title", "") or "",
            "breadcrumb": "Материалы текущего сайта",
            "article_id": getattr(article, "id", None),
        }
    return documents


def load_current_site_content() -> tuple[dict[str, dict], dict[str, dict]]:
    try:
        from database import SessionLocal
        from models import Article
    except Exception as exc:
        logger.warning("[site-content] Не удалось импортировать модели сайта: %s", exc)
        return {}, {}

    pages: dict[str, dict] = {}
    documents: dict[str, dict] = {}

    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        articles = (
            db.query(Article)
            .filter(
                Article.status == "published",
                or_(Article.published_at.is_(None), Article.published_at <= now),
            )
            .order_by(Article.published_at.desc(), Article.created_at.desc(), Article.id.desc())
            .all()
        )
        for article in articles:
            page_url = _article_url(article)
            text = _article_text(article)
            if text:
                pages[page_url] = {
                    "title": getattr(article, "title", "") or "Материал сайта",
                    "text": text,
                    "breadcrumb": "Материалы текущего сайта",
                }
            documents.update(_article_documents(article, page_url))
    except Exception as exc:
        logger.warning("[site-content] Не удалось загрузить материалы сайта из БД: %s", exc)
        return pages, documents
    finally:
        db.close()

    logger.info("[site-content] Загружено из БД: %s страниц, %s документов", len(pages), len(documents))
    return pages, documents
