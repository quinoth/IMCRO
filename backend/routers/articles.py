"""
Роутер /articles — CRUD статей + категории + теги.

Конвертация блоков редактора → поле content (хранится в БД):
  paragraph   → текст абзаца как есть
  hero        → /titleAndIntroduction(заголовок, введение)
  quote       → /quote(текст, автор)
  image       → /image(url)
  imagetext   → /imageAndText(url, текст)
  list        → /list(тип, пункт1, пункт2, …)
  divider     → /separator()
Блоки разделяются символом \\n.
"""

from collections import defaultdict
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import (
    Article,
    ArticleCategory,
    ArticleStatus,
    ArticleTag,
    Category,
    Tag,
    User,
)

router = APIRouter(prefix="/articles", tags=["articles"])
ARTICLE_STATUS_NAMES = ("published", "draft", "archive")


# ─── Конвертация блоков → content ────────────────────────────────────────────

def _esc(text: str) -> str:
    """Экранируем запятые внутри аргументов."""
    return str(text or "").replace("\\", "\\\\").replace(",", "\\,")


def blocks_to_content(blocks: List[Dict[str, Any]]) -> str:
    lines = []
    for b in blocks:
        t = b.get("type", "")
        d = b.get("data", {})

        if t == "paragraph":
            v = (d.get("text") or "").strip()
            if v:
                lines.append(v)

        elif t == "hero":
            lines.append(f"/titleAndIntroduction({_esc(d.get('title',''))}, {_esc(d.get('intro',''))})")

        elif t == "quote":
            lines.append(f"/quote({_esc(d.get('text',''))}, {_esc(d.get('author',''))})")

        elif t == "image":
            lines.append(f"/image({_esc(d.get('url',''))})")

        elif t == "imagetext":
            lines.append(f"/imageAndText({_esc(d.get('url',''))}, {_esc(d.get('text',''))})")

        elif t == "list":
            list_type = "ordered" if d.get("ordered") else "unordered"
            items = [_esc(i) for i in (d.get("items") or []) if str(i).strip()]
            if items:
                lines.append(f"/list({', '.join([list_type] + items)})")

        elif t == "divider":
            lines.append("/separator()")

    return "\n".join(lines)


# ─── Вспомогательные функции ─────────────────────────────────────────────────

def _ensure_statuses(db: Session) -> None:
    existing = {
        name
        for (name,) in db.query(ArticleStatus.name)
        .filter(ArticleStatus.name.in_(ARTICLE_STATUS_NAMES))
        .all()
    }
    missing = [
        ArticleStatus(name=name)
        for name in ARTICLE_STATUS_NAMES
        if name not in existing
    ]
    if missing:
        db.add_all(missing)
        db.commit()


def _status_id(db: Session, name: str) -> int:
    obj = db.query(ArticleStatus).filter(ArticleStatus.name == name).first()
    if not obj:
        obj = ArticleStatus(name=name)
        db.add(obj)
        db.flush()
    return obj.id


def _serialize(article: Article, db: Session) -> dict:
    return _serialize_many([article], db)[0]


def _serialize_many(articles: list[Article], db: Session) -> list[dict]:
    if not articles:
        return []

    article_ids = [article.id for article in articles]
    status_ids = {
        article.status_id
        for article in articles
        if article.status_id is not None
    }
    author_ids = {
        article.author_id
        for article in articles
        if article.author_id is not None
    }

    statuses = {
        status.id: status
        for status in (
            db.query(ArticleStatus).filter(ArticleStatus.id.in_(status_ids)).all()
            if status_ids
            else []
        )
    }
    authors = {
        author.id: author
        for author in (
            db.query(User).filter(User.id.in_(author_ids)).all()
            if author_ids
            else []
        )
    }

    categories_by_article: dict[int, list[Category]] = defaultdict(list)
    for article_id, category in (
        db.query(ArticleCategory.article_id, Category)
        .select_from(ArticleCategory)
        .join(Category, Category.id == ArticleCategory.category_id)
        .filter(ArticleCategory.article_id.in_(article_ids))
        .all()
    ):
        categories_by_article[article_id].append(category)

    tags_by_article: dict[int, list[Tag]] = defaultdict(list)
    for article_id, tag in (
        db.query(ArticleTag.article_id, Tag)
        .select_from(ArticleTag)
        .join(Tag, Tag.id == ArticleTag.tag_id)
        .filter(ArticleTag.article_id.in_(article_ids))
        .all()
    ):
        tags_by_article[article_id].append(tag)

    return [
        _serialize_with_related(
            article,
            status=statuses.get(article.status_id),
            author=authors.get(article.author_id),
            categories=categories_by_article[article.id],
            tags=tags_by_article[article.id],
        )
        for article in articles
    ]


def _serialize_with_related(
    article: Article,
    *,
    status: ArticleStatus | None,
    author: User | None,
    categories: list[Category],
    tags: list[Tag],
) -> dict:
    return {
        "id":           article.id,
        "title":        article.title,
        "slug":         article.slug,
        "content":      article.content,
        "status_id":    article.status_id,
        "author_id":    article.author_id,
        "created_at":   article.created_at.isoformat() if article.created_at else None,
        "updated_at":   article.updated_at.isoformat() if article.updated_at else None,
        "status":       {"id": status.id, "name": status.name} if status else None,
        "author":       {"id": author.id, "email": author.email} if author else None,
        "categories":   [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories],
        "tags":         [{"id": t.id, "name": t.name, "slug": t.slug} for t in tags],
        "category_ids": [c.id for c in categories],
        "tag_ids":      [t.id for t in tags],
    }


# ─── Эндпоинты статей ────────────────────────────────────────────────────────

@router.get("/", response_model=List[dict])
def list_articles(status: Optional[str] = None, db: Session = Depends(get_db)):
    """Список статей. ?status=published — только опубликованные."""
    _ensure_statuses(db)
    q = db.query(Article)
    if status:
        s = db.query(ArticleStatus).filter(ArticleStatus.name == status).first()
        if s:
            q = q.filter(Article.status_id == s.id)
    articles = q.order_by(Article.created_at.desc()).all()
    return _serialize_many(articles, db)


@router.get("/{article_id}", response_model=dict)
def get_article(article_id: int, db: Session = Depends(get_db)):
    a = db.query(Article).filter(Article.id == article_id).first()
    if not a:
        raise HTTPException(404, "Статья не найдена")
    return _serialize(a, db)


@router.post("/", response_model=dict, status_code=201)
def create_article(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Создать статью.
    Принимает: { title, slug, status, blocks, categories, tags }
    blocks конвертируются в content на сервере.
    """
    _ensure_statuses(db)

    title = (payload.get("title") or "").strip()
    if not title:
        raise HTTPException(400, "Заголовок обязателен")

    slug = (payload.get("slug") or title.lower().replace(" ", "-"))[:80]
    content = blocks_to_content(payload.get("blocks") or [])
    sid = _status_id(db, payload.get("status", "draft"))

    article = Article(
        title=title,
        slug=slug,
        content=content,
        status_id=sid,
        author_id=current_user.id,
    )
    db.add(article)
    db.flush()

    for cid in (payload.get("categories") or []):
        if db.query(Category).filter(Category.id == cid).first():
            db.add(ArticleCategory(article_id=article.id, category_id=cid))

    for tid in (payload.get("tags") or []):
        if db.query(Tag).filter(Tag.id == tid).first():
            db.add(ArticleTag(article_id=article.id, tag_id=tid))

    db.commit()
    db.refresh(article)
    return _serialize(article, db)


@router.put("/{article_id}", response_model=dict)
def update_article(
    article_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    _ensure_statuses(db)
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(404, "Статья не найдена")

    if "title" in payload:
        article.title = payload["title"]
    if "slug" in payload:
        article.slug = payload["slug"]
    if "blocks" in payload:
        article.content = blocks_to_content(payload["blocks"])
    if "status" in payload:
        article.status_id = _status_id(db, payload["status"])

    if "categories" in payload:
        db.query(ArticleCategory).filter(ArticleCategory.article_id == article_id).delete()
        for cid in payload["categories"]:
            if db.query(Category).filter(Category.id == cid).first():
                db.add(ArticleCategory(article_id=article_id, category_id=cid))

    if "tags" in payload:
        db.query(ArticleTag).filter(ArticleTag.article_id == article_id).delete()
        for tid in payload["tags"]:
            if db.query(Tag).filter(Tag.id == tid).first():
                db.add(ArticleTag(article_id=article_id, tag_id=tid))

    db.commit()
    db.refresh(article)
    return _serialize(article, db)


@router.patch("/{article_id}/status", response_model=dict)
def change_status(
    article_id: int,
    payload: dict,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    _ensure_statuses(db)
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(404, "Статья не найдена")
    article.status_id = _status_id(db, payload.get("status", "draft"))
    db.commit()
    db.refresh(article)
    return _serialize(article, db)


@router.delete("/{article_id}", status_code=204)
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(404, "Статья не найдена")
    db.query(ArticleCategory).filter(ArticleCategory.article_id == article_id).delete()
    db.query(ArticleTag).filter(ArticleTag.article_id == article_id).delete()
    db.delete(article)
    db.commit()


# ─── Категории ───────────────────────────────────────────────────────────────

@router.get("/meta/categories", response_model=List[dict])
def list_categories(db: Session = Depends(get_db)):
    return [{"id": c.id, "name": c.name, "slug": c.slug} for c in db.query(Category).all()]


@router.post("/meta/categories", response_model=dict, status_code=201)
def create_category(
    payload: dict,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "Имя обязательно")
    c = Category(name=name, slug=payload.get("slug", name.lower().replace(" ", "-")))
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "name": c.name, "slug": c.slug}


@router.put("/meta/categories/{cid}", response_model=dict)
def update_category(
    cid: int,
    payload: dict,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    c = db.query(Category).filter(Category.id == cid).first()
    if not c:
        raise HTTPException(404, "Не найдена")
    if "name" in payload:
        c.name = payload["name"]
    if "slug" in payload:
        c.slug = payload["slug"]
    db.commit()
    db.refresh(c)
    return {"id": c.id, "name": c.name, "slug": c.slug}


@router.delete("/meta/categories/{cid}", status_code=204)
def delete_category(
    cid: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    c = db.query(Category).filter(Category.id == cid).first()
    if not c:
        raise HTTPException(404, "Не найдена")
    db.query(ArticleCategory).filter(ArticleCategory.category_id == cid).delete()
    db.delete(c)
    db.commit()


# ─── Теги ─────────────────────────────────────────────────────────────────────

@router.get("/meta/tags", response_model=List[dict])
def list_tags(db: Session = Depends(get_db)):
    return [{"id": t.id, "name": t.name, "slug": t.slug} for t in db.query(Tag).all()]


@router.post("/meta/tags", response_model=dict, status_code=201)
def create_tag(
    payload: dict,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "Имя обязательно")
    t = Tag(name=name, slug=payload.get("slug", name.lower().replace(" ", "-")))
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"id": t.id, "name": t.name, "slug": t.slug}


@router.put("/meta/tags/{tid}", response_model=dict)
def update_tag(
    tid: int,
    payload: dict,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    t = db.query(Tag).filter(Tag.id == tid).first()
    if not t:
        raise HTTPException(404, "Не найден")
    if "name" in payload:
        t.name = payload["name"]
    if "slug" in payload:
        t.slug = payload["slug"]
    db.commit()
    db.refresh(t)
    return {"id": t.id, "name": t.name, "slug": t.slug}


@router.delete("/meta/tags/{tid}", status_code=204)
def delete_tag(
    tid: int,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    t = db.query(Tag).filter(Tag.id == tid).first()
    if not t:
        raise HTTPException(404, "Не найден")
    db.query(ArticleTag).filter(ArticleTag.tag_id == tid).delete()
    db.delete(t)
    db.commit()
