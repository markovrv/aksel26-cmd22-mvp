# Запуск проекта

## Основной запуск

```bash
docker compose up -d --build
```

После запуска приложение доступно на одном порту:

```text
http://localhost:8000
```

FastAPI отдает и backend API (`/api/...`), и собранный frontend из `/app/static`.
PostgreSQL работает внутри этого же контейнера, данные лежат в Docker volume
`postgres-data`.

Если до этого запускалась старая compose-схема с отдельными контейнерами
`qualify-backend`, `qualify-frontend`, `qualify-nginx`, `qualify-db`, первый
запуск лучше сделать так:

```bash
docker compose up -d --build --remove-orphans
```

Это удалит старые контейнеры, которые больше не описаны в compose, но не удалит
named volumes с данными.

## Пересборка

Обычная пересборка после изменений:

```bash
docker compose up -d --build
```

Жесткая пересборка без Docker cache:

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```

Это не удаляет базу, потому что named volume остается на месте.

## Когда нужно пересоздать БД

Если нужно начать с чистой базы:

```bash
docker compose down -v
docker compose up -d --build
```

Важно: `down -v` удаляет volume `postgres-data`, то есть все данные БД.

## Локальная frontend-разработка

Регламентный Docker запускает production-сборку frontend без hot reload.

Для полноценного dev-режима с отдельными контейнерами:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

После запуска:

```text
http://localhost:3000  # Vite frontend с HMR
http://localhost:8000  # FastAPI backend с reload
localhost:5432         # PostgreSQL для разработки
```

Если до этого был запущен production-compose, сначала останови его:

```bash
docker compose down
```

Если нужно быстро править интерфейс вообще без frontend-контейнера:

```bash
cd front
npm install
npm run dev
```

Vite откроется на `http://localhost:3000`. API-запросы `/api/...` проксируются
на `http://localhost:8000`, если Docker-приложение запущено.

## Если Docker Hub не отвечает

Ошибка вида:

```text
TLS handshake timeout
```

означает, что Docker не смог скачать базовые образы `node:20-alpine` или
`python:3.12-slim`. Обычно помогает повторить команду позже или переключить
Docker на другой интернет/VPN.
