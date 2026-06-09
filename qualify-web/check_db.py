import os

import psycopg2
from dotenv import load_dotenv

load_dotenv()

GREEN = "\033[0;32m"
NC = "\033[0m"

try:
    conn = psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT", "5432"),
    )
    print(f"{GREEN}Успех! Python подключился к базе данных.{NC}")
    conn.close()
except Exception as e:
    print(f"Ошибка подключения: {e}")
