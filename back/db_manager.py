import os
import json

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import Json

load_dotenv()


def json_value(value):
    return Json(value, dumps=lambda data: json.dumps(data, ensure_ascii=False))


class DBManager:
    def __init__(self):
        dbname = os.getenv("DB_NAME", "qualify_db")
        user = os.getenv("DB_USER", "postgres")
        host = os.getenv("DB_HOST", "localhost")
        port = os.getenv("DB_PORT", "5432")

        self.conn = psycopg2.connect(
            dbname=dbname,
            user=user,
            password=os.getenv("DB_PASS"),
            host=host,
            port=port,
        )
        self.conn.set_client_encoding("UTF8")
        self.conn.autocommit = True
        with self.conn.cursor() as cur:
            cur.execute("SELECT current_database(), current_user")
            connected_db, connected_user = cur.fetchone()
        print(f"[DB] Connected to PostgreSQL at {host}:{port} db={connected_db} user={connected_user}")
        self.ensure_schema()

    def ensure_schema(self):
        with self.conn.cursor() as cur:
            cur.execute("ALTER TABLE skills ADD COLUMN IF NOT EXISTS category VARCHAR(50)")
            cur.execute("ALTER TABLE answer_weights ADD COLUMN IF NOT EXISTS question_index INTEGER")
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS candidate_pipeline (
                    attempt_id INTEGER PRIMARY KEY REFERENCES user_attempts(id) ON DELETE CASCADE,
                    status TEXT NOT NULL DEFAULT 'new',
                    hr_note TEXT DEFAULT '',
                    target_job_id INTEGER REFERENCES job_roles(id) ON DELETE SET NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS excursion_events (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    event_date TEXT NOT NULL,
                    registered_count INTEGER NOT NULL DEFAULT 0,
                    visited_count INTEGER NOT NULL DEFAULT 0,
                    completed_tests_count INTEGER NOT NULL DEFAULT 0,
                    interview_ready_count INTEGER NOT NULL DEFAULT 0
                )
                """
            )
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS app_settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
                """
            )

        seed_path = os.getenv("DB_SEED_PATH", "/app/insert.sql")
        if os.path.exists(seed_path):
            with open(seed_path, encoding="utf-8") as seed_file:
                seed_sql = seed_file.read().strip()

            if seed_sql:
                with self.conn.cursor() as cur:
                    cur.execute(seed_sql)
                print(f"[DB] Schema and scoring rules synced from {seed_path}")
            else:
                print(f"[DB] Seed file {seed_path} is empty, scoring rules were not synced.")
        else:
            print("[DB] Schema checked. Seed file not found, scoring rules were not synced.")

        self.seed_demo_data()

    def seed_demo_data(self):
        with self.conn.cursor() as cur:
            cur.execute("SELECT key FROM app_settings WHERE key IN ('demo_dashboard_seeded', 'demo_extra_candidates_seeded')")
            seeded_flags = {row[0] for row in cur.fetchall()}
            if "demo_dashboard_seeded" in seeded_flags and "demo_extra_candidates_seeded" in seeded_flags:
                print("[DB] Demo dashboard data already seeded.")
                return

        def make_answers(values):
            return [{"question_index": index + 1, "answer": answer} for index, answer in enumerate(values)]

        demo_attempts = []

        if "demo_dashboard_seeded" not in seeded_flags:
            demo_attempts.extend([
            (
                900001,
                "Никита Морозов (+7 912 345-67-89)",
                [
                    {"question_index": 1, "answer": "Да, более 1 года"},
                    {"question_index": 2, "answer": "Литьё обуви"},
                    {"question_index": 3, "answer": "ПВХ или ЭВА"},
                    {"question_index": 4, "answer": "Готов быстро"},
                    {"question_index": 5, "answer": "Да, свободно"},
                    {"question_index": 6, "answer": "Да, до 3 лет"},
                    {"question_index": 7, "answer": "Да, регулярно"},
                    {"question_index": 8, "answer": "Да, спокойно"},
                    {"question_index": 9, "answer": "Да"},
                    {"question_index": 10, "answer": "Да"},
                    {"question_index": 11, "answer": "Да"},
                    {"question_index": 12, "answer": "Всегда"},
                    {"question_index": 13, "answer": "Сообщу мастеру"},
                    {"question_index": 14, "answer": "Да, привык"},
                    {"question_index": 15, "answer": "Сменный 2/2"},
                    {"question_index": 16, "answer": "Да"},
                    {"question_index": 17, "answer": "Стабильность"},
                    {"question_index": 18, "answer": "Предпочитаю"},
                    {"question_index": 19, "answer": "Переделаю"},
                    {"question_index": 20, "answer": "Попрошу проверить партию"},
                    {"question_index": 21, "answer": "Да"},
                    {"question_index": 22, "answer": "Нет"},
                ],
                "invited",
                "Сильный кандидат на линию литья, можно звать на смену.",
                1,
            ),
            (
                900002,
                "Екатерина Лебедева (+7 922 104-33-18)",
                [
                    {"question_index": 1, "answer": "Да, была практика"},
                    {"question_index": 2, "answer": "Контроль качества"},
                    {"question_index": 3, "answer": "Готовая обувь"},
                    {"question_index": 4, "answer": "Нужна практика"},
                    {"question_index": 5, "answer": "Да, свободно"},
                    {"question_index": 6, "answer": "Да, более 3 лет"},
                    {"question_index": 7, "answer": "Да, эпизодически"},
                    {"question_index": 8, "answer": "Могу, если есть темп"},
                    {"question_index": 9, "answer": "Нет"},
                    {"question_index": 10, "answer": "Да"},
                    {"question_index": 11, "answer": "Да"},
                    {"question_index": 12, "answer": "Всегда"},
                    {"question_index": 13, "answer": "Сообщу мастеру"},
                    {"question_index": 14, "answer": "Могу, если доплатят"},
                    {"question_index": 15, "answer": "5/2"},
                    {"question_index": 16, "answer": "Да"},
                    {"question_index": 17, "answer": "Обучение и рост"},
                    {"question_index": 18, "answer": "Нейтрально"},
                    {"question_index": 19, "answer": "Сообщу мастеру"},
                    {"question_index": 20, "answer": "Попрошу проверить партию"},
                    {"question_index": 21, "answer": "Да"},
                    {"question_index": 22, "answer": "Нет"},
                ],
                "review",
                "Лучше рассмотреть на контроль качества после короткой стажировки.",
                2,
            ),
            (
                900003,
                "Дмитрий Кузнецов (+7 953 442-10-05)",
                [
                    {"question_index": 1, "answer": "Нет, но готов обучаться"},
                    {"question_index": 2, "answer": "Сборка и комплектовка"},
                    {"question_index": 3, "answer": "Текстиль и фурнитура"},
                    {"question_index": 4, "answer": "Нужен наставник"},
                    {"question_index": 5, "answer": "Читаю с трудом"},
                    {"question_index": 6, "answer": "Нет, только практика"},
                    {"question_index": 7, "answer": "Нет"},
                    {"question_index": 8, "answer": "Могу, если есть темп"},
                    {"question_index": 9, "answer": "Нет"},
                    {"question_index": 10, "answer": "Нет"},
                    {"question_index": 11, "answer": "Да"},
                    {"question_index": 12, "answer": "Только если контролируют"},
                    {"question_index": 13, "answer": "Попробую починить сам"},
                    {"question_index": 14, "answer": "Нет"},
                    {"question_index": 15, "answer": "Готов к сверхурочным"},
                    {"question_index": 16, "answer": "Затрудняюсь ответить"},
                    {"question_index": 17, "answer": "Зарплата"},
                    {"question_index": 18, "answer": "Предпочитаю оклад"},
                    {"question_index": 19, "answer": "Сообщу мастеру"},
                    {"question_index": 20, "answer": "Откажусь от работы"},
                    {"question_index": 21, "answer": "Нет"},
                    {"question_index": 22, "answer": "Нет"},
                ],
                "new",
                "Нужна вводная стажировка и проверка по технике безопасности.",
                1,
            ),
            ])

        if "demo_extra_candidates_seeded" not in seeded_flags:
            demo_attempts.extend([
                (
                    900004,
                    "Анна Власова (+7 912 118-45-21)",
                    make_answers([
                        "Да, была практика", "Контроль качества", "Готовая обувь", "Нужна практика", "Да, свободно",
                        "Да, до 3 лет", "Да, эпизодически", "Да, спокойно", "Да", "Да", "Да", "Всегда",
                        "Сообщу мастеру", "Да, привык", "5/2", "Да", "Обучение и рост", "Нейтрально",
                        "Сообщу мастеру", "Попрошу проверить партию", "Да", "Нет",
                    ]),
                    "review",
                    "Подходит на контроль качества, стоит проверить внимательность на тестовой партии.",
                    2,
                ),
                (
                    900005,
                    "Сергей Орлов (+7 922 733-90-11)",
                    make_answers([
                        "Да, более 1 года", "Литьё обуви", "ПВХ или ЭВА", "Готов быстро", "Читаю с трудом",
                        "Да, более 3 лет", "Да, регулярно", "Могу, если есть темп", "Да", "Да", "Да", "Всегда",
                        "Сообщу мастеру", "Да, привык", "Сменный 2/2", "Да", "Зарплата", "Предпочитаю",
                        "Переделаю", "Попрошу проверить партию", "Да", "Нет",
                    ]),
                    "invited",
                    "Сильный производственный опыт, можно приглашать на собеседование по линии.",
                    1,
                ),
                (
                    900006,
                    "Полина Федорова (+7 953 208-64-42)",
                    make_answers([
                        "Нет, но готов обучаться", "Упаковка", "Не работал", "Нужен наставник", "Да, свободно",
                        "Нет, только практика", "Нет", "Да, спокойно", "Нет", "Нет", "Да", "Всегда",
                        "Сообщу мастеру", "Могу, если доплатят", "5/2", "Да", "Стабильность", "Предпочитаю оклад",
                        "Сообщу мастеру", "Попрошу проверить партию", "Да", "Нет",
                    ]),
                    "new",
                    "Можно рассмотреть на стартовую позицию с наставником.",
                    1,
                ),
                (
                    900007,
                    "Артем Беляев (+7 912 506-77-30)",
                    make_answers([
                        "Да, более 1 года", "Сборка и комплектовка", "Резина", "Готов быстро", "Да, свободно",
                        "Да, более 3 лет", "Да, регулярно", "Да, спокойно", "Да", "Да", "Да", "Всегда",
                        "Сообщу мастеру", "Да, привык", "Готов к сверхурочным", "Да", "Стабильность", "Предпочитаю",
                        "Переделаю", "Попрошу проверить партию", "Да", "Нет",
                    ]),
                    "invited",
                    "Высокая надежность и готовность к темпу, кандидат на линию или старшего смены.",
                    3,
                ),
                (
                    900008,
                    "Ольга Нестерова (+7 922 441-27-88)",
                    make_answers([
                        "Да, была практика", "Контроль качества", "Текстиль и фурнитура", "Нужна практика", "Да, свободно",
                        "Да, до 3 лет", "Да, эпизодически", "Да, спокойно", "Нет", "Да", "Да", "Всегда",
                        "Сообщу мастеру", "Нет", "5/2", "Да", "Коллектив", "Нейтрально",
                        "Переделаю", "Попрошу проверить партию", "Да", "Нет",
                    ]),
                    "review",
                    "Хорошая база под контроль качества, уточнить готовность к условиям цеха.",
                    2,
                ),
                (
                    900009,
                    "Михаил Сидоров (+7 953 602-14-75)",
                    make_answers([
                        "Нет, но готов обучаться", "Пока не знаю", "Не работал", "Пока не уверен", "Читаю с трудом",
                        "Нет, только практика", "Нет", "Нет", "Нет", "Нет", "Нет", "Только если контролируют",
                        "Попробую починить сам", "Нет", "5/2", "Затрудняюсь ответить", "Зарплата", "Предпочитаю оклад",
                        "Оставлю, как есть", "Продолжу работу с этим материалом", "Да", "Нет",
                    ]),
                    "rejected",
                    "Высокие риски по безопасности и качеству, пока не рекомендован к стажировке.",
                    1,
                ),
                (
                    900010,
                    "Виктория Громова (+7 912 350-66-09)",
                    make_answers([
                        "Да, была практика", "Упаковка", "Готовая обувь", "Нужна практика", "Да, свободно",
                        "Да, до 3 лет", "Да, эпизодически", "Да, спокойно", "Да", "Да", "Да", "Всегда",
                        "Сообщу мастеру", "Могу, если доплатят", "Сменный 2/2", "Да", "Коллектив", "Нейтрально",
                        "Сообщу мастеру", "Попрошу проверить партию", "Да", "Нет",
                    ]),
                    "new",
                    "Стабильный профиль, можно проверить на упаковке и комплектовке.",
                    1,
                ),
                (
                    900011,
                    "Роман Павлов (+7 922 815-44-62)",
                    make_answers([
                        "Да, более 1 года", "Литьё обуви", "ПВХ или ЭВА", "Готов быстро", "Да, свободно",
                        "Да, более 3 лет", "Да, регулярно", "Да, спокойно", "Да", "Да", "Да", "Всегда",
                        "Сообщу мастеру", "Да, привык", "Вахта", "Да", "Зарплата", "Предпочитаю",
                        "Переделаю", "Попрошу проверить партию", "Да", "Нет",
                    ]),
                    "review",
                    "Сильный профиль по производству, обсудить график и готовность к долгому циклу.",
                    1,
                ),
                (
                    900012,
                    "Наталья Крылова (+7 953 177-33-51)",
                    make_answers([
                        "Да, была практика", "Контроль качества", "Готовая обувь", "Готов быстро", "Да, свободно",
                        "Да, до 3 лет", "Да, эпизодически", "Да, спокойно", "Да", "Да", "Да", "Всегда",
                        "Сообщу мастеру", "Да, привык", "5/2", "Да", "Обучение и рост", "Нейтрально",
                        "Переделаю", "Попрошу проверить партию", "Да", "Нет",
                    ]),
                    "invited",
                    "Приоритетный кандидат на контроль качества.",
                    2,
                ),
                (
                    900013,
                    "Илья Захаров (+7 912 609-18-04)",
                    make_answers([
                        "Да, более 1 года", "Сборка и комплектовка", "Резина", "Нужна практика", "Читаю с трудом",
                        "Да, до 3 лет", "Да, регулярно", "Могу, если есть темп", "Да", "Да", "Да", "Иногда пропускаю",
                        "Сообщу мастеру", "Да, привык", "Сменный 2/2", "Да", "Стабильность", "Предпочитаю",
                        "Переделаю", "Продолжу работу с этим материалом", "Да", "Нет",
                    ]),
                    "review",
                    "Производственный опыт есть, отдельно проверить безопасность и качество решений.",
                    1,
                ),
                (
                    900014,
                    "Дарья Мельникова (+7 922 501-96-72)",
                    make_answers([
                        "Нет, но готов обучаться", "Контроль качества", "Текстиль и фурнитура", "Нужен наставник", "Да, свободно",
                        "Нет, только практика", "Нет", "Да, спокойно", "Нет", "Да", "Да", "Всегда",
                        "Сообщу мастеру", "Могу, если доплатят", "5/2", "Да", "Обучение и рост", "Нейтрально",
                        "Переделаю", "Попрошу проверить партию", "Да", "Нет",
                    ]),
                    "new",
                    "Потенциал для обучения под контроль качества.",
                    2,
                ),
                (
                    900015,
                    "Павел Соловьев (+7 953 740-28-16)",
                    make_answers([
                        "Да, более 1 года", "Литьё обуви", "ПВХ или ЭВА", "Готов быстро", "Да, свободно",
                        "Да, более 3 лет", "Да, регулярно", "Да, спокойно", "Да", "Да", "Да", "Всегда",
                        "Сообщу мастеру", "Да, привык", "Готов к сверхурочным", "Да", "Стабильность", "Предпочитаю",
                        "Переделаю", "Попрошу проверить партию", "Да", "Нет",
                    ]),
                    "invited",
                    "Сильный кандидат с опытом и готовностью к графику.",
                    3,
                ),
            ])

        with self.conn.cursor() as cur:
            for vk_id, full_name, answers, status, note, target_job_id in demo_attempts:
                cur.execute("SELECT id FROM user_attempts WHERE vk_id = %s LIMIT 1", (vk_id,))
                existing_attempt = cur.fetchone()

                if existing_attempt:
                    attempt_id = existing_attempt[0]
                    cur.execute(
                        """
                        UPDATE user_attempts
                        SET full_name = %s
                        WHERE id = %s
                        """,
                        (full_name, attempt_id),
                    )
                else:
                    cur.execute(
                        """
                        INSERT INTO user_attempts (vk_id, full_name, raw_answers)
                        VALUES (%s, %s, %s)
                        RETURNING id
                        """,
                        (vk_id, full_name, json_value(answers)),
                    )
                    attempt_id = cur.fetchone()[0]

                cur.execute(
                    """
                    INSERT INTO candidate_pipeline (attempt_id, status, hr_note, target_job_id)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (attempt_id) DO NOTHING
                    """,
                    (attempt_id, status, note, target_job_id),
                )

            cur.execute("SELECT COUNT(*) FROM excursion_events")
            if cur.fetchone()[0] == 0:
                cur.execute(
                    """
                    INSERT INTO excursion_events (
                        title, event_date, registered_count, visited_count,
                        completed_tests_count, interview_ready_count
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    ("Экскурсия на производство Вахруши-Литобувь", "28 апреля, 10:00", 42, 34, 31, 9),
                )

            cur.execute(
                """
                INSERT INTO app_settings (key, value, updated_at)
                VALUES ('demo_dashboard_seeded', 'true', CURRENT_TIMESTAMP)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
                """
            )
            cur.execute(
                """
                INSERT INTO app_settings (key, value, updated_at)
                VALUES ('demo_extra_candidates_seeded', 'true', CURRENT_TIMESTAMP)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
                """
            )

        print("[DB] Demo dashboard data checked.")

    def save_final_result(self, vk_id, full_name, new_answers):
        with self.conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, raw_answers FROM user_attempts 
                WHERE vk_id = %s 
                ORDER BY completed_at DESC LIMIT 1
            """,
                (vk_id,),
            )

            last_entry = cur.fetchone()

            if last_entry:
                last_id, last_answers = last_entry
                if last_answers == new_answers:
                    cur.execute(
                        """
                        UPDATE user_attempts SET completed_at = CURRENT_TIMESTAMP 
                        WHERE id = %s
                    """,
                        (last_id,),
                    )
                    print(f"[DB] Данные {full_name} идентичны. Обновлен лог времени.")
                    return last_id

            cur.execute(
                """
                INSERT INTO user_attempts (vk_id, full_name, raw_answers) 
                VALUES (%s, %s, %s)
                RETURNING id
            """,
                (vk_id, full_name, json_value(new_answers)),
            )
            attempt_id = cur.fetchone()[0]
            print(f"[DB] Сохранен новый результат для {full_name}.")
            return attempt_id
