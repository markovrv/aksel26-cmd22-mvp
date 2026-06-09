# qualify

## Документация

- `project-structure.md` - что где лежит и за что отвечает.
- `run-project.md` - команды запуска, hot reload, пересборка, backup.

## Docker Compose

Запуск проекта:

```bash
docker compose up -d --build
```

Docker Compose читает настройки из корневого `.env`.
Пример значений лежит в `.env.example`.

После старта:

- приложение: http://localhost:8000
- API: http://localhost:8000/api
- React routes отдаются тем же FastAPI-приложением из `/app/static`

По регламенту наружу смотрит один порт. Frontend собирается в Docker build
через `npm run build`, копируется в финальный Python-образ и отдается как
статика. Отдельные dev-контейнеры frontend/backend/nginx текущим compose больше
не поднимаются.

PostgreSQL запускается внутри того же контейнера и хранит данные в named volume
`postgres-data`.

## Dev Compose

Для разработки есть отдельный compose-файл:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Он поднимает отдельные контейнеры:

- `frontend` на http://localhost:3000 с Vite HMR;
- `backend` на http://localhost:8000 с `uvicorn --reload`;
- `db` на localhost:5432.

Сдачный `docker-compose.yml` при этом остается production/reglament-вариантом
с одним внешним портом.

Если Docker Hub плохо доступен и базовые образы не скачиваются, ошибка обычно
выглядит так:

```text
TLS handshake timeout
```

В этом случае это проблема доступа к Docker Hub, а не ошибка compose-файла.

База создается из `create.sql` и `insert.sql`.
Чтобы пересоздать базу с нуля:

```bash
docker compose down -v
docker compose up -d --build
```
