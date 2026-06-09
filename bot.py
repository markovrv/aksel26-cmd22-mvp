import os

import vk_api
from dotenv import load_dotenv
from vk_api.longpoll import VkEventType, VkLongPoll

from basic_scenario import *
from db_manager import DBManager
from engine import analyze_all_attempts

load_dotenv()
TOKEN = os.getenv("VK_TOKEN")
GROUP_ID = os.getenv("GROUP_ID")

db = DBManager()
vk_session = vk_api.VkApi(token=TOKEN)
longpoll = VkLongPoll(vk_session, group_id=GROUP_ID)
vk = vk_session.get_api()

user_states = {}

print("========================================")
print("БОТ ЗАПУЩЕН И СЛУШАЕТ СООБЩЕНИЯ...")
print("Активность пользователей будет ниже:")
print("========================================")

for event in longpoll.listen():
    try:
        if event.type == VkEventType.MESSAGE_NEW and event.to_me:
            user_id = event.user_id
            text = event.text

            if user_id not in user_states:
                user_info = vk.users.get(user_id=user_id)[0]
                full_name = f"{user_info['first_name']} {user_info['last_name']}"
                user_states[user_id] = {"full_name": full_name, "scenario": None, "step": None, "answers": []}

            user_state = user_states[user_id]
            full_name = user_state["full_name"]

            print(f">>> [СООБЩЕНИЕ] {full_name} (ID: {user_id}): {text}")

            if text.lower() in ["начать", "start", "/start"]:
                vk.messages.send(user_id=user_id, message="Привет!", random_id=0)

                user_state.update({"scenario": "basic", "step": 0, "answers": []})

                result = handle_basic_scenario(user_state, "")
                for msg_data in result:
                    vk.messages.send(
                        user_id=user_id, message=msg_data["message"], keyboard=msg_data.get("keyboard"), random_id=0
                    )

                user_state["step"] = 1
                continue

            if user_state.get("scenario") == "basic":
                if text != "Начать опрос":
                    user_state["answers"].append(text)

                result = handle_basic_scenario(user_state, text)

                if result:
                    for msg_data in result:
                        vk.messages.send(
                            user_id=user_id, message=msg_data["message"], keyboard=msg_data.get("keyboard"), random_id=0
                        )

                    if "Спасибо!" in result[-1]["message"]:
                        print(f"!!! [ФИНИШ] {full_name} завершил опрос. Сохранение...")
                        db.save_final_result(user_id, full_name, user_state["answers"])

                        print(f"!!! [ENGINE] Авто-анализ данных для {full_name}...")
                        analyze_all_attempts()
                        print(f"!!! [УСПЕХ] Профиль {full_name} рассчитан.")

                        user_state["scenario"] = None
                        user_state["step"] = None
                    else:
                        user_state["step"] += 1
                continue

            vk.messages.send(user_id=user_id, message="Напишите 'Начать', чтобы пройти анкетирование.", random_id=0)

    except Exception as e:
        print(f"[ОШИБКА] {e}")
