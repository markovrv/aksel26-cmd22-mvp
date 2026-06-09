# Структура проекта

Этот файл нужен для быстрого входа в проект. Подробности по запуску лежат в
`run-project.md`, Docker-настройки описаны в `README.md`.

## Что это за проект

`Qualify` - MVP модуля для промышленного найма под один завод:
`ООО «Вахруши-Литобувь»`.

Основной сценарий:

1. Пользователь смотрит экскурсию на завод.
2. Переходит к анкете.
3. Заполняет вопросы.
4. Backend сохраняет попытку в PostgreSQL.
5. Алгоритм считает подходящие позиции.
6. Frontend показывает результат пользователю.
7. Кабинет показывает разные данные для разных ролей.

## Корень проекта

```text
.
├── Dockerfile              # Сборка frontend + backend + PostgreSQL в один образ
├── docker-compose.yml      # Сдачный app-сервис наружу на порт 8000
├── docker-compose.dev.yml  # Dev-сервисы: db, backend reload, frontend HMR
├── .env.example            # Пример переменных окружения
├── README.md               # Docker, nginx, backup, общая инфраструктура
├── run-project.md          # Практические команды запуска и пересборки
├── project-structure.md    # Этот файл
├── create.sql              # Создание таблиц БД
├── insert.sql              # Начальные данные и правила скоринга
├── nginx/default.conf      # Старый nginx-конфиг, текущим compose не используется
├── front/                  # React/Vite приложение
└── back/                   # FastAPI backend
```

В корне также есть старые Python-файлы (`bot.py`, `engine.py`, `matcher.py`,
`db_manager.py`, `basic_scenario.py`). Сейчас рабочая Docker-версия использует
код из `back/`. Корневые файлы лучше считать наследием раннего прототипа, пока
они явно не удалены или не перенесены.

## Frontend

```text
front/
├── index.html
├── public/favicon.svg
├── package.json
├── vite.config.ts
├── Dockerfile
└── src/
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── config.ts
    ├── auth.ts
    ├── components/
    │   └── Header.tsx
    ├── data/
    │   ├── questions.ts
    │   └── users.ts
    └── pages/
        ├── ExcursionsPage.tsx
        ├── SurveyPage.tsx
        ├── LoginPage.tsx
        └── DashboardPage.tsx
```

Основные файлы:

- `front/src/App.tsx` - роутинг через `@tanstack/react-router`.
- `front/src/components/Header.tsx` - общая шапка, навигация, вход/выход.
- `front/src/pages/ExcursionsPage.tsx` - главная страница с экскурсией.
- `front/src/pages/SurveyPage.tsx` - анкета, маска телефона, отправка ответов.
- `front/src/pages/LoginPage.tsx` - демо-логин.
- `front/src/pages/DashboardPage.tsx` - кабинеты под разные роли, читает dashboard API.
- `front/src/data/questions.ts` - вопросы анкеты под Вахруши-Литобувь.
- `front/src/data/users.ts` - зашитые демо-пользователи и роли.
- `front/src/auth.ts` - frontend-only авторизация через `localStorage`.
- `front/src/config.ts` - базовый URL API.

### Роуты

```text
/           # Экскурсии
/survey     # Анкета
/login      # Демо-вход
/dashboard  # Ролевой кабинет
/candidates/:attemptId # Профиль кандидата для HR
```

### Демо-пользователи

Пока авторизация полностью моковая и живет на фронте в `front/src/data/users.ts`.

```text
candidate / candidate123  # Соискатель
hr        / hr123         # HR завода
```

Это не безопасная production-авторизация. Для MVP она нужна только, чтобы
показать разные сценарии интерфейса.

## Backend

```text
back/
├── Dockerfile
├── requirements.txt
├── .env.example
├── main.py
├── db_manager.py
├── engine.py
├── matcher.py
├── check_names.py
└── images/
    └── vahrushi_*.jpg
```

Основные файлы:

- `back/main.py` - FastAPI-приложение и API endpoints.
- `back/db_manager.py` - подключение к PostgreSQL, сохранение результатов,
  синхронизация схемы и правил скоринга из `insert.sql`.
- `back/engine.py` - расчет skill scores по ответам анкеты.
- `back/matcher.py` - расчет рекомендаций по вакансиям.
- `back/images/` - фотографии завода для карточки экскурсии.

Backend в Docker запускается через:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API

Основные endpoint-ы:

```text
GET  /api/excursions       # Список экскурсий
POST /api/submit-test      # Отправка анкеты и расчет результата
GET  /api/dashboard/candidate/{vk_id}
GET  /api/dashboard/hr
GET  /api/candidates/{attempt_id}
PATCH /api/candidates/{attempt_id}/status
DELETE /api/candidates/{attempt_id}
```

Dashboard API в MVP защищены упрощенно: frontend отправляет заголовок
`X-Demo-Role` из текущего demo-user. Это не production-безопасность, но уже
показывает разделение доступа по ролям на backend.

`POST /api/submit-test` принимает имя, телефон внутри `full_name`, `vk_id` и
массив ответов. Ответ backend возвращает вместе с рекомендациями:

```json
{
  "status": "success",
  "attempt_id": 1,
  "best_match": {
    "job_id": 1,
    "job_title": "Оператор производственной линии",
    "match_percentage": 86
  },
  "recommendations": []
}
```

## База данных

Главные файлы:

- `create.sql` - таблицы.
- `insert.sql` - начальные данные, вакансии, навыки, веса ответов.

PostgreSQL живет внутри app-контейнера в Docker volume `postgres-data`. SQL из
`create.sql` и `insert.sql` применяется entrypoint-скриптом при запуске
контейнера.

Основные сущности:

- `skills` - навыки/факторы скоринга.
- `answer_weights` - веса ответов по вопросам.
- `job_roles` - вакансии/позиции.
- `job_requirements` - требования вакансий к навыкам.
- `user_attempts` - отправленные анкеты.
- `user_skill_profiles` - рассчитанные баллы кандидата.
- `candidate_pipeline` - HR-статус кандидата, заметка, целевая вакансия.
- `excursion_events` - агрегаты по экскурсии для дашборда завода.
- `app_settings` - служебные флаги приложения, например факт seed демо-данных.

При старте backend добавляет демо-кандидатов с `vk_id` `900001`-`900015`, если
соответствующий seed еще не был применен. После seed ставятся флаги в
`app_settings`, поэтому удаленный через HR-кабинет демо-кандидат не появится
снова после рестарта backend.

## Docker

Сдачный compose:

```text
app # PostgreSQL + FastAPI + собранный React frontend
```

Наружу открыт один порт:

```text
http://localhost:8000
```

Dev compose:

```text
db       # PostgreSQL для разработки
backend  # FastAPI + uvicorn --reload
frontend # Vite dev server + HMR
```

Dev-порты:

```text
http://localhost:3000
http://localhost:8000
localhost:5432
```

## Где менять типовые вещи

- Текст и вид карточки завода: `front/src/pages/ExcursionsPage.tsx`.
- Вопросы анкеты: `front/src/data/questions.ts`.
- Отправку анкеты и экран результата: `front/src/pages/SurveyPage.tsx`.
- Демо-пользователей и роли: `front/src/data/users.ts`.
- Ролевые кабинеты и fallback-данные: `front/src/pages/DashboardPage.tsx`.
- Профиль кандидата: `front/src/pages/CandidatePage.tsx`.
- API endpoints: `back/main.py`.
- Подключение к БД и seed: `back/db_manager.py`.
- Алгоритм скоринга: `back/engine.py` и `back/matcher.py`.
- Таблицы БД: `create.sql`.
- Веса ответов и вакансии: `insert.sql`.
- Старый Nginx proxy: `nginx/default.conf`.
- Docker-сборка: `Dockerfile`, `docker-entrypoint.sh`, `docker-compose.yml`,
  `docker-compose.dev.yml`.

## Что пока моковое

- Авторизация: demo-user хранится во frontend JSON + `localStorage`, backend
  проверяет только mock-заголовок `X-Demo-Role`.
- Кабинеты ролей: основные данные берутся из API, но есть frontend fallback,
  если backend недоступен.
- Пользователь в анкете: нет полноценной связи с учетной записью.
- Админка: нет реального CRUD для вопросов, ролей, вакансий и скоринга.
- Backup базы: в старом compose был отдельный backup-сервис, в текущей
  одно-контейнерной регламентной схеме его нет.

## Что важно не забыть

- Не запускать `docker compose down -v`, если не нужно удалить БД.
- После изменения frontend-зависимостей нужна пересборка Docker-образа.
- После изменения `create.sql` для чистой схемы нужна пересозданная БД.
- Для production авторизацию нужно переносить на backend: пароли хэшировать,
  роли хранить в БД, доступ к API проверять через сессии/JWT.
