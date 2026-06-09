import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    conn = psycopg2.connect(
        dbname='postgres',
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT")
    )
    cur = conn.cursor()
    cur.execute("SELECT datname FROM pg_database;")
    databases = cur.fetchall()
    print("Доступные базы данных на этом сервере:")
    for db in databases:
        print(f" - {db[0]}")
    conn.close()
except Exception as e:
    print(f"Ошибка: {e}")