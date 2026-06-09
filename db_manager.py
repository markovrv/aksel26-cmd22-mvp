import os

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import Json

load_dotenv()


class DBManager:
    def __init__(self):
        self.conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME", "qualify_db"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASS"),
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
        )
        self.conn.autocommit = True

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
                    return

            cur.execute(
                """
                INSERT INTO user_attempts (vk_id, full_name, raw_answers) 
                VALUES (%s, %s, %s)
            """,
                (vk_id, full_name, Json(new_answers)),
            )
            print(f"[DB] Сохранен новый результат для {full_name}.")
