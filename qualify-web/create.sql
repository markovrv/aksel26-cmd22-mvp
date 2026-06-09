-- 1. ТАБЛИЦА ДЛЯ СЫРЫХ РЕЗУЛЬТАТОВ (Сюда пишет бот)
CREATE TABLE IF NOT EXISTS user_attempts (
    id SERIAL PRIMARY KEY,
    vk_id BIGINT NOT NULL,
    full_name TEXT NOT NULL,
    raw_answers JSONB NOT NULL,
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. СПРАВОЧНИК НАВЫКОВ
CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

-- 3. ПРАВИЛА
CREATE TABLE IF NOT EXISTS answer_weights (
    id SERIAL PRIMARY KEY,
    question_index INTEGER,
    answer_text TEXT NOT NULL,
    skill_id INTEGER REFERENCES skills(id),
    weight_value FLOAT NOT NULL
);

-- 4. ИТОГОВЫЙ ПРОФИЛЬ (Сюда заносит данные алгоритм)
CREATE TABLE IF NOT EXISTS user_skill_profiles (
    id SERIAL PRIMARY KEY,
    attempt_id INTEGER REFERENCES user_attempts(id),
    skill_id INTEGER REFERENCES skills(id),
    total_score FLOAT NOT NULL
);

-- 5. СПРАВОЧНИК ДОЛЖНОСТЕЙ
CREATE TABLE IF NOT EXISTS job_roles (
    id SERIAL PRIMARY KEY,
    title TEXT UNIQUE NOT NULL
);

-- 6. ЭТАЛОННЫЕ ТРЕБОВАНИЯ
CREATE TABLE IF NOT EXISTS job_requirements (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES job_roles(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    required_score FLOAT NOT NULL
);

-- 7. HR PIPELINE ПО КАНДИДАТАМ
CREATE TABLE IF NOT EXISTS candidate_pipeline (
    attempt_id INTEGER PRIMARY KEY REFERENCES user_attempts(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'new',
    hr_note TEXT DEFAULT '',
    target_job_id INTEGER REFERENCES job_roles(id) ON DELETE SET NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. СОБЫТИЯ ЭКСКУРСИЙ ДЛЯ ДАШБОРДА ЗАВОДА
CREATE TABLE IF NOT EXISTS excursion_events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    event_date TEXT NOT NULL,
    registered_count INTEGER NOT NULL DEFAULT 0,
    visited_count INTEGER NOT NULL DEFAULT 0,
    completed_tests_count INTEGER NOT NULL DEFAULT 0,
    interview_ready_count INTEGER NOT NULL DEFAULT 0
);

-- 9. СЛУЖЕБНЫЕ ФЛАГИ ПРИЛОЖЕНИЯ
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
