# IMCRO — Централизованный образовательный портал МКУ «ИМЦРО» г. Иркутска

Стек: **React/Vite** (frontend) · **FastAPI** (backend) · **PostgreSQL 16** · **Nginx** · **Docker Compose**

---

## Быстрый старт (Docker Compose)

### 1. Подготовка окружения

```bash
cp .env.example .env
```

Откройте `.env` и заполните обязательные переменные:

| Переменная | Описание |
|---|---|
| `DB_PASSWORD` | Пароль PostgreSQL (придумайте надёжный) |
| `SECRET_KEY` | Ключ подписи JWT — `python -c "import secrets; print(secrets.token_hex(32))"` |
| `PD_ENCRYPTION_KEY` | Ключ шифрования персональных данных ТПМПК — аналогично выше |

### 2. Запуск

```bash
docker compose up --build
```

При первом запуске Docker:
- соберёт образы backend и frontend;
- применит Alembic-миграции к PostgreSQL;
- поднимет все три сервиса.

### 3. Проверка

| Адрес | Что открывается |
|---|---|
| `http://localhost` | React SPA (через Nginx) |
| `http://localhost/docs` | OpenAPI-документация backend |
| `http://localhost/health` | Healthcheck backend |

API-запросы из браузера идут на `http://localhost` (порт 80), Nginx проксирует их на `backend:8000`.  
Порт 8000 наружу **не пробрасывается**.

### 4. Остановка

```bash
docker compose down          # остановить контейнеры, сохранить данные
docker compose down -v       # остановить и удалить volume (ДАННЫЕ УДАЛЯТСЯ)
```

---

## Локальная разработка (без Docker)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
cp .env.example .env           # или скопируйте из корня
# отредактируйте .env, задайте DATABASE_URL и SECRET_KEY
alembic upgrade head
uvicorn main:app --reload
```

API: `http://localhost:8000` · Docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
# в .env задайте:  VITE_API_URL=http://localhost:8000
npm run dev
```

Frontend: `http://localhost:5173`

> **Примечание.** В режиме локальной разработки (`npm run dev`) frontend обращается к backend по адресу из `VITE_API_URL`. В production-сборке через Docker `VITE_API_URL` пустой — все API-запросы идут через Nginx.

---

## Структура сервисов

```
docker compose up
│
├── db        postgres:16-alpine   (порт 5432, только внутри Docker-сети)
├── backend   python:3.12-slim     (порт 8000, только внутри Docker-сети)
└── frontend  nginx:1.27-alpine    (порт 80, публичный)
                └─ проксирует /auth /api /users /certificates /static → backend:8000
                └─ отдаёт React SPA из /usr/share/nginx/html
```

---

## Для промышленного размещения

- Настроить HTTPS (Let's Encrypt или сертификат организации).
- Задать `CORS_ORIGINS` с реальным доменом.
- Перенести секреты в защищённое хранилище (не хранить в `.env`-файле на сервере в открытом виде).
- Настроить автоматическое резервное копирование: `backend/scripts/pg_daily_backup.ps1`.
- Установить `ENABLE_DEV_TEST_USERS=false`.