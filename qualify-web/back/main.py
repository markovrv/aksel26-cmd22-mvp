import os
import re
from pathlib import Path
from typing import List, Union
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from db_manager import DBManager
from engine import analyze_all_attempts
from matcher import get_recommendations_for_user

app = FastAPI(title="Qualify GNN API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories
os.makedirs("images", exist_ok=True)

# Mount images
app.mount("/images", StaticFiles(directory="images"), name="images")

db = DBManager()

try:
    analyze_all_attempts()
except Exception as exc:
    print(f"[ENGINE] Initial dashboard analysis skipped: {exc}")


class TestSubmission(BaseModel):
    vk_id: int
    full_name: str
    answers: List[Union[str, dict]]


class CandidateStatusUpdate(BaseModel):
    status: str
    hr_note: str = ""
    target_job_id: int | None = None


STATUS_LABELS = {
    "new": "Новый",
    "review": "На проверке",
    "invited": "Приглашен",
    "rejected": "Не подходит",
}


def require_demo_role(role: str | None, allowed_roles: set[str]):
    if role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Недостаточно прав для демо-роли")


def split_candidate_contact(full_name: str):
    phone_match = re.search(r"(\+7\s?\d{3}\s?\d{3}-?\d{2}-?\d{2})", full_name)
    phone = phone_match.group(1) if phone_match else ""
    name = re.sub(r"\s*\([^)]*\)\s*$", "", full_name).strip()
    return name or full_name, phone


def get_attempt_skills(attempt_id: int):
    with db.conn.cursor() as cur:
        cur.execute(
            """
            SELECT s.name, s.category, usp.total_score
            FROM user_skill_profiles usp
            JOIN skills s ON s.id = usp.skill_id
            WHERE usp.attempt_id = %s
            ORDER BY usp.total_score DESC, s.name
            """,
            (attempt_id,),
        )
        return [
            {"name": name, "category": category, "score": round(float(score), 1)}
            for name, category, score in cur.fetchall()
        ]


def get_pipeline_by_attempt(attempt_id: int):
    with db.conn.cursor() as cur:
        cur.execute(
            """
            SELECT cp.status, cp.hr_note, cp.target_job_id, jr.title
            FROM candidate_pipeline cp
            LEFT JOIN job_roles jr ON jr.id = cp.target_job_id
            WHERE cp.attempt_id = %s
            """,
            (attempt_id,),
        )
        row = cur.fetchone()

    if not row:
        return {
            "status": "new",
            "status_label": STATUS_LABELS["new"],
            "hr_note": "",
            "target_job_id": None,
            "target_job_title": None,
        }

    status, hr_note, target_job_id, target_job_title = row
    return {
        "status": status,
        "status_label": STATUS_LABELS.get(status, status),
        "hr_note": hr_note or "",
        "target_job_id": target_job_id,
        "target_job_title": target_job_title,
    }


def get_attempt_card(attempt_id: int, full_name: str, vk_id: int, completed_at):
    name, phone = split_candidate_contact(full_name)
    recommendations = get_recommendations_for_user(attempt_id)
    best_match = recommendations[0] if recommendations else None
    pipeline = get_pipeline_by_attempt(attempt_id)
    skills = get_attempt_skills(attempt_id)
    explanation = build_match_explanation(skills, best_match)

    return {
        "attempt_id": attempt_id,
        "vk_id": vk_id,
        "name": name,
        "phone": phone,
        "completed_at": completed_at.isoformat() if completed_at else None,
        "status": pipeline["status"],
        "status_label": pipeline["status_label"],
        "hr_note": pipeline["hr_note"],
        "target_job_id": pipeline["target_job_id"],
        "target_job_title": pipeline["target_job_title"],
        "best_match": best_match,
        "recommendations": recommendations,
        "skills": skills,
        "strengths": explanation["strengths"],
        "risks": explanation["risks"],
        "interview_questions": explanation["interview_questions"],
        "match_summary": explanation["match_summary"],
    }


def build_match_explanation(skills, best_match):
    sorted_skills = sorted(skills, key=lambda item: item["score"], reverse=True)
    strengths = [
        f"{item['name']}: высокий балл {item['score']}"
        for item in sorted_skills[:2]
        if item["score"] >= 6
    ]
    risks = [
        f"{item['name']}: стоит проверить на собеседовании, балл {item['score']}"
        for item in sorted_skills[-2:]
        if item["score"] < 6
    ]

    if not strengths and sorted_skills:
        strengths = [f"{sorted_skills[0]['name']}: лучшая зона кандидата, балл {sorted_skills[0]['score']}"]
    if not risks:
        risks = ["Критичных провалов по анкете не выявлено, проверьте мотивацию и готовность к графику."]

    job_title = best_match["job_title"] if best_match else "подходящей позиции"
    return {
        "strengths": strengths,
        "risks": risks,
        "interview_questions": [
            "Попросить кандидата описать действия при браке партии или сбое оборудования.",
            "Уточнить готовность к сменному графику, шуму, запахам материалов и нормам выработки.",
            f"Проверить практический интерес к позиции: {job_title}.",
        ],
        "match_summary": f"Рекомендация основана на сравнении ответов анкеты с требованиями позиции «{job_title}».",
    }


@app.get("/api/excursions")
def get_excursions():
    base_url = os.getenv("PUBLIC_API_BASE_URL", "").rstrip("/")
    image_list = [f"{base_url}/images/vahrushi_{i}.jpg" for i in range(1, 10)]

    return [
        {
            "id": 1,
            "title": "ООО «Вахруши-Литобувь»",
            "location": "Кировская область, пгт Вахруши",
            "tag": "Градообразующее предприятие",
            "desc": "Посетите одно из крупнейших и старейших предприятий по производству литой обуви в России. Вы познакомитесь с современными технологиями литья под давлением из ПВХ и ЭВА, обеспечивающими 100% водонепроницаемость. Экскурсия включает посещение производственных линий, цеха автоматизации и собственной лаборатории тестирования качества ГОСТ.",
            "date": "28 апреля, 10:00",
            "images": image_list
        }
    ]


@app.post("/api/submit-test")
def submit_test(data: TestSubmission):
    try:
        attempt_id = db.save_final_result(data.vk_id, data.full_name, data.answers)
        analyze_all_attempts()
        recommendations = get_recommendations_for_user(attempt_id)
        with db.conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO candidate_pipeline (attempt_id, status, hr_note)
                VALUES (%s, 'new', '')
                ON CONFLICT (attempt_id) DO NOTHING
                """,
                (attempt_id,),
            )
            cur.execute(
                """
                SELECT id, full_name, vk_id, completed_at
                FROM user_attempts
                WHERE id = %s
                """,
                (attempt_id,),
            )
            attempt_row = cur.fetchone()

        candidate_card = get_attempt_card(*attempt_row)
        return {
            "status": "success",
            "message": "Тест успешно пройден!",
            "attempt_id": attempt_id,
            "recommendations": recommendations,
            "best_match": recommendations[0] if recommendations else None,
            "strengths": candidate_card["strengths"],
            "risks": candidate_card["risks"],
            "interview_questions": candidate_card["interview_questions"],
            "match_summary": candidate_card["match_summary"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/candidate/{vk_id}")
def get_candidate_dashboard(vk_id: int, x_demo_role: str | None = Header(default=None)):
    require_demo_role(x_demo_role, {"candidate", "hr"})
    try:
        analyze_all_attempts()
        with db.conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, full_name, vk_id, completed_at
                FROM user_attempts
                WHERE vk_id = %s
                ORDER BY completed_at DESC
                LIMIT 1
                """,
                (vk_id,),
            )
            row = cur.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="У пользователя пока нет анкет")

        attempt_id, full_name, candidate_vk_id, completed_at = row
        return get_attempt_card(attempt_id, full_name, candidate_vk_id, completed_at)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/hr")
def get_hr_dashboard(x_demo_role: str | None = Header(default=None)):
    require_demo_role(x_demo_role, {"hr"})
    return build_hr_dashboard()


def build_hr_dashboard():
    try:
        analyze_all_attempts()
        with db.conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, full_name, vk_id, completed_at
                FROM user_attempts
                ORDER BY completed_at DESC
                """
            )
            attempts = cur.fetchall()

            cur.execute("SELECT id, title FROM job_roles ORDER BY id")
            jobs = [{"id": job_id, "title": title} for job_id, title in cur.fetchall()]

        candidates = [get_attempt_card(attempt_id, full_name, vk_id, completed_at) for attempt_id, full_name, vk_id, completed_at in attempts]
        candidates.sort(
            key=lambda item: item["best_match"]["match_percentage"] if item["best_match"] else 0,
            reverse=True,
        )

        return {
            "jobs": jobs,
            "candidates": candidates,
            "status_options": [{"value": value, "label": label} for value, label in STATUS_LABELS.items()],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/candidates/{attempt_id}")
def get_candidate(attempt_id: int, x_demo_role: str | None = Header(default=None)):
    require_demo_role(x_demo_role, {"candidate", "hr"})
    try:
        analyze_all_attempts()
        with db.conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, full_name, vk_id, completed_at, raw_answers
                FROM user_attempts
                WHERE id = %s
                """,
                (attempt_id,),
            )
            row = cur.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Кандидат не найден")

        candidate_id, full_name, vk_id, completed_at, raw_answers = row
        card = get_attempt_card(candidate_id, full_name, vk_id, completed_at)
        card["answers"] = raw_answers
        return card
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.patch("/api/candidates/{attempt_id}/status")
def update_candidate_status(attempt_id: int, data: CandidateStatusUpdate, x_demo_role: str | None = Header(default=None)):
    require_demo_role(x_demo_role, {"hr"})
    if data.status not in STATUS_LABELS:
        raise HTTPException(status_code=400, detail="Неизвестный статус кандидата")

    try:
        with db.conn.cursor() as cur:
            cur.execute("SELECT id FROM user_attempts WHERE id = %s", (attempt_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Кандидат не найден")

            cur.execute(
                """
                INSERT INTO candidate_pipeline (attempt_id, status, hr_note, target_job_id, updated_at)
                VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (attempt_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    hr_note = EXCLUDED.hr_note,
                    target_job_id = EXCLUDED.target_job_id,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (attempt_id, data.status, data.hr_note, data.target_job_id),
            )

        return {"status": "success", "message": "Статус кандидата обновлен"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/candidates/{attempt_id}")
def delete_candidate(attempt_id: int, x_demo_role: str | None = Header(default=None)):
    require_demo_role(x_demo_role, {"hr"})
    try:
        with db.conn.cursor() as cur:
            cur.execute("SELECT id FROM user_attempts WHERE id = %s", (attempt_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Кандидат не найден")

            cur.execute("DELETE FROM candidate_pipeline WHERE attempt_id = %s", (attempt_id,))
            cur.execute("DELETE FROM user_skill_profiles WHERE attempt_id = %s", (attempt_id,))
            cur.execute("DELETE FROM user_attempts WHERE id = %s", (attempt_id,))

        return {"status": "success", "message": "Кандидат удален"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Serve frontend static files (MUST be after API routes)
static_dir = Path("static")
if static_dir.exists():
    # Mount /assets for JS/CSS
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Catch-all for SPA: serve index.html for any non-API path
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Let API routes pass through
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="Not found")
        # Serve existing static files
        file_path = static_dir / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        # Everything else -> index.html (SPA)
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        raise HTTPException(status_code=404, detail="Not found")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
