# Telegram-бот Brellas

## Настройка

1. Откройте `bot.py`.
2. Заполните настройки вверху файла:
   - `BOT_TOKEN`
   - `LEADS_CHAT_ID`
   - `LOG_CHAT_ID`
   - `SITE_URL`
   - `MINI_APP_URL`
   - `MANAGER_CONTACT`

## Запуск

Дважды нажмите `run_bot.bat`.

Или вручную:

```bash
python -m pip install -r requirements.txt
python bot.py
```

Бот работает через long polling, база данных не используется.
