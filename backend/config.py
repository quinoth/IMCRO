"""
config.py — единое место для всех настроек RAG-системы

Все остальные модули импортируют константы отсюда.
Переменные окружения имеют приоритет над значениями по умолчанию.
"""

from __future__ import annotations

import os


def _first_env_url(*names: str) -> str:
    for name in names:
        value = (os.environ.get(name) or "").strip().rstrip("/")
        if value:
            return value + "/"
    return ""


def _first_public_cors_origin() -> str:
    raw = os.environ.get("CORS_ALLOWED_ORIGINS") or os.environ.get("CORS_ORIGINS") or ""
    for origin in raw.split(","):
        value = origin.strip().rstrip("/")
        if not value:
            continue
        lowered = value.lower()
        if "localhost" in lowered or "127.0.0.1" in lowered:
            continue
        if value.startswith(("http://", "https://")):
            return value + "/"
    return ""


def _legacy_site_url(value: str) -> bool:
    return value.strip().rstrip("/").lower() == "https://mc.eduirk.ru"

# ─────────────────────────────────────────────────────────────────────────────
#  Расписание обновлений
# ─────────────────────────────────────────────────────────────────────────────

UPDATE_INTERVAL_HOURS: float = float(os.environ.get("UPDATE_INTERVAL_HOURS", "24"))
ASSISTANT_ENABLED: bool = os.environ.get("ASSISTANT_ENABLED", "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}

# ─────────────────────────────────────────────────────────────────────────────
#  Краулер сайта
# ─────────────────────────────────────────────────────────────────────────────

_configured_site_start_url = (os.environ.get("SITE_START_URL") or "").strip()
_current_site_start_url = (
    _first_env_url("PUBLIC_SITE_URL", "FRONTEND_URL")
    or _first_public_cors_origin()
    or "https://mc.eduirk.ru/"
)
SITE_START_URL:    str   = (
    _current_site_start_url
    if not _configured_site_start_url or _legacy_site_url(_configured_site_start_url)
    else _configured_site_start_url.rstrip("/") + "/"
)
SITE_MAX_PAGES:    int   = int(os.environ.get("SITE_MAX_PAGES", "2000"))
SITE_CRAWL_DELAY:  float = float(os.environ.get("SITE_CRAWL_DELAY", "0.5"))
SITE_USER_AGENT:   str   = "RAG-Updater/1.0"
SITE_MIN_TEXT_LEN: int   = 50    # страницы короче этого — пропускаем
SITE_CACHE_FILE:   str   = os.environ.get(
    "SITE_CACHE_FILE",
    "./chroma_gigachat/site_pages_cache.json",
)

SITE_SKIP_TAGS: frozenset[str] = frozenset(
    {"script", "style", "nav", "footer", "header", "aside", "noscript"}
)

# ─────────────────────────────────────────────────────────────────────────────
#  Yandex Cloud Object Storage
# ─────────────────────────────────────────────────────────────────────────────

YC_KEY_ID:    str = os.environ.get("YC_KEY_ID",    "")
YC_SECRET_KEY: str = os.environ.get("YC_SECRET_KEY", "")
YC_BUCKET:    str = os.environ.get("YC_BUCKET",    "eduirk")
YC_PREFIX:    str = os.environ.get("YC_PREFIX",    "")
YC_ENDPOINT:  str = "https://storage.yandexcloud.net"
YC_REGION:    str = "ru-central1"

SUPPORTED_DOC_EXTENSIONS: frozenset[str] = frozenset({".pdf", ".docx", ".doc"})
S3_FILE_CACHE_DIR: str = os.environ.get(
    "S3_FILE_CACHE_DIR",
    "./s3_extracted/.cache/s3_documents",
)


def _env_set(name: str, default: str) -> frozenset[str]:
    return frozenset(
        item.strip().lower()
        for item in os.environ.get(name, default).split(",")
        if item.strip()
    )


def _env_tuple(name: str, default: str) -> tuple[str, ...]:
    return tuple(
        item.strip().lower()
        for item in os.environ.get(name, default).split(",")
        if item.strip()
    )


SITE_ASSET_BASE_URL: str = (
    _first_env_url(
        "SITE_ASSET_BASE_URL",
        "BACKEND_PUBLIC_URL",
        "PUBLIC_API_BASE_URL",
        "API_BASE_URL",
        "RENDER_EXTERNAL_URL",
    )
    or SITE_START_URL
)
SITE_DOCUMENT_CACHE_DIR: str = os.environ.get(
    "SITE_DOCUMENT_CACHE_DIR",
    "./s3_extracted/.cache/site_documents",
)
SITE_DOCUMENT_ALLOWED_HOSTS: tuple[str, ...] = _env_tuple("SITE_DOCUMENT_ALLOWED_HOSTS", "")
SITE_ALLOW_EXTERNAL_DOCUMENTS: bool = os.environ.get("SITE_ALLOW_EXTERNAL_DOCUMENTS", "false").strip().lower() in {
    "1",
    "true",
    "yes",
    "on",
}
SITE_DOCUMENT_TIMEOUT_SECONDS: float = float(os.environ.get("SITE_DOCUMENT_TIMEOUT_SECONDS", "30"))
SITE_DOCUMENT_MAX_BYTES: int = int(os.environ.get("SITE_DOCUMENT_MAX_BYTES", str(50 * 1024 * 1024)))


# ─────────────────────────────────────────────────────────────────────────────
#  Доступ к чат-боту
# ─────────────────────────────────────────────────────────────────────────────

ASSISTANT_EMPLOYEE_ROLE_NAMES: frozenset[str] = _env_set(
    "ASSISTANT_EMPLOYEE_ROLE_NAMES",
    "admin,administrator,employee,staff,manager,moderator,editor,"
    "админ,администратор,сотрудник,работник,модератор,редактор",
)

ASSISTANT_INTERNAL_S3_PREFIXES: tuple[str, ...] = _env_tuple(
    "ASSISTANT_INTERNAL_S3_PREFIXES",
    "internal/,private/,staff/,employee/,employees/,служебные/,внутренние/",
)

ASSISTANT_INTERNAL_S3_KEYWORDS: tuple[str, ...] = _env_tuple(
    "ASSISTANT_INTERNAL_S3_KEYWORDS",
    "internal,private,confidential,staff,employee,служебн,внутренн,конфиденц",
)

# ─────────────────────────────────────────────────────────────────────────────
#  OCR (Surya OCR)
# ─────────────────────────────────────────────────────────────────────────────
# Surya автоматически определяет язык — OCR_LANG оставлен для совместимости,
# но движком не используется.
OCR_LANG: str = os.environ.get("OCR_LANG", "rus+eng")
OCR_DPI:  int = int(os.environ.get("OCR_DPI", "192"))   # Surya ресайзит сама — 192 DPI хватает, выше только жрёт RAM на CPU

# ─────────────────────────────────────────────────────────────────────────────
#  Индексация (чанкинг)
# ─────────────────────────────────────────────────────────────────────────────

CHUNK_SIZE:    int = int(os.environ.get("CHUNK_SIZE",    "300"))
CHUNK_OVERLAP: int = int(os.environ.get("CHUNK_OVERLAP", "50"))

# ─────────────────────────────────────────────────────────────────────────────
#  Хранилище состояния
# ─────────────────────────────────────────────────────────────────────────────

STATE_FILE: str = os.environ.get("STATE_FILE", "./update_state.json")
