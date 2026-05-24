# Frontend MKY / EduIrk

React/Vite frontend проекта MKY / EduIrk: публичные страницы, административные интерфейсы, редактор статей, генератор грамот и demo-чат.

## Docker

Сначала запустите backend на http://localhost:8000.

Из корня frontend-репозитория:

```bash
docker build --build-arg VITE_API_URL=http://localhost:8000 -t mky-frontend .
docker run --rm -p 5173:80 mky-frontend
```

После запуска frontend доступен на http://localhost:5173.

## Локальный Запуск

Сначала запустите backend на http://localhost:8000. Затем:

```bash
npm install
npm run dev
```

Frontend будет доступен на http://localhost:5173.

По умолчанию API-адрес: http://localhost:8000. Для другого адреса задайте:

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

Если при входе появляется `Failed to fetch`, backend не отвечает или запущен не на том адресе. Проверьте http://localhost:8000/docs.

## Тестовые Пользователи

При запущенном backend с `ENABLE_DEV_TEST_USERS=true` доступны:

- `admin@mky.test` / `admin123`
- `methodist@mky.test` / `methodist123`
- `domu@mky.test` / `domu123`
- `operator@mky.test` / `operator123`
- `user@mky.test` / `user123`

## Проверки

```bash
npm run build
npx eslint src
node scripts/auth.test.mjs
```

Demo-чат остается только frontend UI: ответы статические, сетевые запросы к backend assistant/RAG API не выполняются.
