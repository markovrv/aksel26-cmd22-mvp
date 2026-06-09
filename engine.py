import os

import psycopg2
from dotenv import load_dotenv

load_dotenv()


def analyze_all_attempts():
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASS"), host=os.getenv("DB_HOST")
    )
    cur = conn.cursor()

    cur.execute("SELECT id, raw_answers FROM user_attempts")
    attempts = cur.fetchall()

    for attempt_id, raw_answers in attempts:
        print(f"Обработка попытки ID: {attempt_id}")

        calculated_scores = {}

        for answer in raw_answers:
            cur.execute(
                """
                SELECT skill_id, weight_value 
                FROM answer_weights 
                WHERE answer_text = %s
            """,
                (answer,),
            )

            rules = cur.fetchall()
            for skill_id, weight in rules:
                if skill_id not in calculated_scores:
                    calculated_scores[skill_id] = 0.0
                calculated_scores[skill_id] += weight

        cur.execute("DELETE FROM user_skill_profiles WHERE attempt_id = %s", (attempt_id,))

        for skill_id, total_score in calculated_scores.items():
            cur.execute(
                """
                INSERT INTO user_skill_profiles (attempt_id, skill_id, total_score)
                VALUES (%s, %s, %s)
            """,
                (attempt_id, skill_id, total_score),
            )

    conn.commit()
    cur.close()
    conn.close()
    print("Анализ завершен. Баллы по всем навыкам просуммированы.")


if __name__ == "__main__":
    analyze_all_attempts()
