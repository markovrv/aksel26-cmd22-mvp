import os

import psycopg2
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "qualify_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASS"),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
    )


def get_recommendations_for_user(attempt_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT skill_id, total_score FROM user_skill_profiles WHERE attempt_id = %s", (attempt_id,))
    user_skills = dict(cur.fetchall())

    cur.execute("SELECT id, title FROM job_roles")
    roles = cur.fetchall()

    results = []

    for role_id, role_title in roles:
        cur.execute("SELECT skill_id, required_score FROM job_requirements WHERE job_id = %s", (role_id,))
        requirements = cur.fetchall()

        if not requirements:
            continue

        match_score = 0
        total_skills_checked = len(requirements)

        for skill_id, req_score in requirements:
            user_score = user_skills.get(skill_id, 0.0)
            skill_match = min(user_score / req_score, 1.0) if req_score > 0 else 0
            match_score += skill_match

        final_percent = round((match_score / total_skills_checked) * 100, 1)

        results.append({"job_id": role_id, "job_title": role_title, "match_percentage": final_percent})

    cur.close()
    conn.close()

    return sorted(results, key=lambda x: x["match_percentage"], reverse=True)


def get_global_ranking_for_job(job_id: int):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT skill_id, required_score FROM job_requirements WHERE job_id = %s", (job_id,))
    requirements = cur.fetchall()

    if not requirements:
        return []

    cur.execute("SELECT id, full_name, vk_id FROM user_attempts")
    users = cur.fetchall()

    ranking = []
    for attempt_id, name, vk_id in users:
        cur.execute("SELECT skill_id, total_score FROM user_skill_profiles WHERE attempt_id = %s", (attempt_id,))
        user_skills = dict(cur.fetchall())

        match_score = 0
        for skill_id, req_score in requirements:
            u_score = user_skills.get(skill_id, 0.0)
            match_score += min(u_score / req_score, 1.0) if req_score > 0 else 0

        final_percent = round((match_score / len(requirements)) * 100, 1)

        ranking.append(
            {"attempt_id": attempt_id, "candidate_name": name, "vk_id": vk_id, "match_percentage": final_percent}
        )

    cur.close()
    conn.close()

    return sorted(ranking, key=lambda x: x["match_percentage"], reverse=True)


if __name__ == "__main__":
    print("--- Проверка для Пользователя №1 ---")
    user_recs = get_recommendations_for_user(1)
    for rec in user_recs:
        print(f"{rec['job_title']}: {rec['match_percentage']}%")

    print("\n--- Проверка для Вакансии №3 (Бригадир) ---")
    hr_rank = get_global_ranking_for_job(3)
    for rank in hr_rank:
        print(f"{rank['candidate_name']}: {rank['match_percentage']}%")
