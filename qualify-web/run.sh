#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

PYTHON_EXEC="/Users/mir/PyCharmProjects/.venv/bin/python3"

echo -e "${BLUE}Очистка портов 3000 и 8000...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null

run_backend() {
    echo -e "${GREEN}Запуск Бэкенда...${NC}"
    osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)/back' && '$PYTHON_EXEC' -m uvicorn main:app --reload --port 8000\""
}

run_frontend() {
    echo -e "${GREEN}Запуск Фронтенда...${NC}"
    osascript -e "tell application \"Terminal\" to do script \"cd '$(pwd)/front' && npm run dev\""
    sleep 3
    open "http://localhost:3000"
}

run_backend
run_frontend

echo -e "${GREEN}Готово! Проект открывается в браузере...${NC}"