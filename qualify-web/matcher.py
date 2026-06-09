import os

import psycopg2
from dotenv import load_dotenv

load_dotenv()


def get_global_ranking():
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME"), user=os.getenv("DB_USER"), password=os.getenv("DB_PASS"), host=os.getenv("DB_HOST")
    )
    cur = conn.cursor()

    cur.execute("SELECT id, title FROM job_roles")
    roles = cur.fetchall()
    print("\nДоступные должности для оценки:")
    for r in roles:
        print(f"{r[0]}) {r[1]}")

    role_id = input("\nВыберите ID должности для формирования рейтинга: ")

    cur.execute("SELECT skill_id, required_score FROM job_requirements WHERE job_id = %s", (role_id,))
    requirements = cur.fetchall()

    cur.execute("SELECT id, full_name FROM user_attempts")
    users = cur.fetchall()

    results = []
    for attempt_id, name in users:
        cur.execute("SELECT skill_id, total_score FROM user_skill_profiles WHERE attempt_id = %s", (attempt_id,))
        user_skills = dict(cur.fetchall())

        match_score = 0
        for skill_id, req_score in requirements:
            u_score = user_skills.get(skill_id, 0)
            match_score += min(u_score / req_score, 1.0) if req_score > 0 else 0

        final_percent = (match_score / len(requirements)) * 100 if requirements else 0
        results.append((name, final_percent))

    results.sort(key=lambda x: x[1], reverse=True)

    print(f"\n--- РЕЙТИНГ КАНДИДАТОВ ---")
    for i, (name, pct) in enumerate(results, 1):
        print(f"{i}. {name:20} | Соответствие: {pct:>5.1f}%")

    conn.close()


if __name__ == "__main__":
    get_global_ranking()
