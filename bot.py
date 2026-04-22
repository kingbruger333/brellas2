import logging
from datetime import timezone, timedelta
from html import escape

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup, Update
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
    ConversationHandler,
    MessageHandler,
    filters,
)

BOT_TOKEN = "8646907695:AAEDQJ3ruuv2uuBvddcTQKUo-5ZQg4V48E0"
LEADS_CHAT_ID = -5151727605
LOG_CHAT_ID = -5184189896
SITE_URL = "https://brellas.vercel.app"
MINI_APP_URL = "https://brellas.vercel.app"

(
    LEAD_NAME,
    LEAD_COMPANY,
    LEAD_PHONE,
    LEAD_NEED,
    LEAD_VOLUME,
    LEAD_COMMENT,
    REPLY_TEXT,
) = range(7)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)
ACTIVE_LEAD_USERS = set()
CLIENT_MESSAGE_TARGETS = {}


def main_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("Оставить заявку", callback_data="lead:start")],
            [InlineKeyboardButton("Открыть каталог", url=SITE_URL)],
        ]
    )


def reply_menu() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        [["Оставить заявку", "Открыть каталог"]],
        resize_keyboard=True,
        is_persistent=True,
    )


def back_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton("Назад", callback_data="menu:main")]])


def lead_actions_keyboard(user) -> InlineKeyboardMarkup:
    user_id = user.id if user else 0

    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("Ответить", callback_data=f"lead_reply:{user_id}")],
            [
                InlineKeyboardButton("В работу", callback_data=f"lead_status:work:{user_id}"),
                InlineKeyboardButton("ЗАКРЫТЬ", callback_data=f"lead_status:closed:{user_id}"),
            ],
        ]
    )


async def send_log(context: ContextTypes.DEFAULT_TYPE, text: str) -> None:
    try:
        await context.bot.send_message(LOG_CHAT_ID, text, parse_mode=ParseMode.HTML)
    except Exception:
        logger.exception("Failed to send log")


def message_content_for_log(message) -> str:
    if message.text:
        return message.text
    if message.caption:
        return f"{message.caption} [caption]"
    if message.photo:
        return "[photo]"
    if message.document:
        return f"[document] {message.document.file_name or ''}".strip()
    if message.video:
        return "[video]"
    if message.voice:
        return "[voice]"
    if message.audio:
        return "[audio]"
    if message.sticker:
        return f"[sticker] {message.sticker.emoji or ''}".strip()
    if message.contact:
        return "[contact]"
    if message.location:
        return "[location]"
    return "[unsupported message]"


async def log_incoming_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    message = update.effective_message
    user = update.effective_user
    chat = update.effective_chat

    if not message or not chat or chat.id == LOG_CHAT_ID:
        return

    sent_at = message.date.astimezone(timezone(timedelta(hours=3))).strftime("%d.%m.%Y %H:%M:%S")
    await send_log(
        context,
        (
            "<b>Входящее сообщение боту</b>\n\n"
            f"Время: {escape(sent_at)} МСК\n"
            f"От: {escape(user.full_name if user else 'неизвестно')} "
            f"(@{escape(user.username) if user and user.username else 'без username'})\n"
            f"User ID: {user.id if user else 'неизвестно'}\n"
            f"Чат: {escape(chat.title or chat.full_name or str(chat.id))}\n"
            f"Chat ID: {chat.id}\n\n"
            f"Сообщение:\n{escape(message_content_for_log(message))}"
        ),
    )


async def show_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = (
        "Brellas\n\n"
        "Товары народного потребления оптом для магазинов, маркетплейсов и бизнеса."
    )

    if update.callback_query:
        query = update.callback_query
        await query.answer()
        await query.edit_message_text(text, reply_markup=main_menu())
        return

    await update.message.reply_text(text, reply_markup=reply_menu())
    await update.message.reply_text("Выберите действие:", reply_markup=main_menu())


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    await send_log(
        context,
        f"Старт бота: {escape(user.full_name if user else 'Неизвестный пользователь')} "
        f"(@{escape(user.username) if user and user.username else 'без username'})",
    )
    await show_menu(update, context)


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "Выберите действие в меню. Для отмены текущего ввода отправьте /cancel.",
        reply_markup=reply_menu(),
    )


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await update.message.reply_text("Действие отменено.", reply_markup=reply_menu())
    return ConversationHandler.END


async def back_to_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await show_menu(update, context)
    return ConversationHandler.END


async def lead_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    if update.callback_query:
        query = update.callback_query
        await query.answer()
        await query.edit_message_text("Как вас зовут?", reply_markup=back_menu())
    else:
        await update.message.reply_text("Как вас зовут?", reply_markup=reply_menu())
    return LEAD_NAME


async def open_catalog(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        f"Каталог: {SITE_URL}",
        reply_markup=reply_menu(),
    )


async def lead_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["lead_name"] = update.message.text
    await update.message.reply_text("Название компании?", reply_markup=back_menu())
    return LEAD_COMPANY


async def lead_company(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["lead_company"] = update.message.text
    await update.message.reply_text("Телефон для связи?", reply_markup=back_menu())
    return LEAD_PHONE


async def lead_phone(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["lead_phone"] = update.message.text
    await update.message.reply_text("Что нужно подобрать или закупить?", reply_markup=back_menu())
    return LEAD_NEED


async def lead_need(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["lead_need"] = update.message.text
    await update.message.reply_text("Какой объём закупки планируете?", reply_markup=back_menu())
    return LEAD_VOLUME


async def lead_volume(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["lead_volume"] = update.message.text
    await update.message.reply_text("Комментарий к заявке?", reply_markup=back_menu())
    return LEAD_COMMENT


async def lead_comment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["lead_comment"] = update.message.text
    await send_lead(update, context, "Новая заявка")
    await update.message.reply_text(
        "Спасибо. Заявка отправлена, менеджер свяжется с вами.",
        reply_markup=reply_menu(),
    )
    context.user_data.clear()
    return ConversationHandler.END


async def send_lead(update: Update, context: ContextTypes.DEFAULT_TYPE, title: str) -> None:
    user = update.effective_user
    data = context.user_data
    text = (
        f"<b>{escape(title)}</b>\n"
        "Статус: НОВЫЙ\n\n"
        f"Имя: {escape(data.get('lead_name', ''))}\n"
        f"Компания: {escape(data.get('lead_company', ''))}\n"
        f"Телефон: {escape(data.get('lead_phone', ''))}\n"
        f"Что нужно: {escape(data.get('lead_need', ''))}\n"
        f"Объём: {escape(data.get('lead_volume', ''))}\n"
        f"Комментарий: {escape(data.get('lead_comment', ''))}\n\n"
        f"Telegram: @{escape(user.username) if user and user.username else 'без username'}"
    )
    await context.bot.send_message(
        LEADS_CHAT_ID,
        text,
        parse_mode=ParseMode.HTML,
        reply_markup=lead_actions_keyboard(user),
    )
    await send_log(context, f"Отправлена заявка от {escape(data.get('lead_name', ''))}")


async def update_lead_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    _, action, user_id_text = query.data.split(":", 2)
    user_id = int(user_id_text)
    status = "В работе" if action == "work" else "ЗАКРЫТ"

    if action == "work" and user_id:
        ACTIVE_LEAD_USERS.add(user_id)
    elif action == "closed" and user_id:
        ACTIVE_LEAD_USERS.discard(user_id)

    message_text = query.message.text or ""
    lines = message_text.splitlines()

    if len(lines) > 1 and lines[1].startswith("Статус:"):
        lines[1] = f"Статус: {status}"
    else:
        lines.insert(1, f"Статус: {status}")

    await query.edit_message_text(
        "\n".join(escape(line) for line in lines),
        parse_mode=ParseMode.HTML,
        reply_markup=query.message.reply_markup,
    )
    await send_log(context, f"Статус заявки изменён: {escape(status)}")


async def forward_active_client_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    if not user or user.id not in ACTIVE_LEAD_USERS:
        return

    await context.bot.send_message(
        LEADS_CHAT_ID,
        (
            "<b>Сообщение клиента по заявке</b>\n"
            f"Клиент: {escape(user.full_name)} "
            f"(@{escape(user.username) if user.username else 'без username'})"
        ),
        parse_mode=ParseMode.HTML,
    )
    copied_message = await update.message.copy(chat_id=LEADS_CHAT_ID)
    CLIENT_MESSAGE_TARGETS[copied_message.message_id] = user.id
    await send_log(context, f"Сообщение клиента отправлено в группу заявок: {escape(user.full_name)}")


async def group_reply_to_client(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not update.message or not update.message.reply_to_message:
        return

    target_user_id = CLIENT_MESSAGE_TARGETS.get(update.message.reply_to_message.message_id)
    if not target_user_id:
        return

    manager = update.effective_user
    reply_text = update.message.text

    try:
        await context.bot.send_message(
            target_user_id,
            f"Ответ менеджера Brellas:\n\n{reply_text}",
        )
    except Exception:
        logger.exception("Failed to send reply from group reply")
        await update.message.reply_text("Не удалось отправить ответ клиенту через бота.")
        await send_log(context, "Ошибка отправки ответа клиенту из reply в группе")
        return

    await update.message.reply_text("Ответ отправлен клиенту через бота.")
    await send_log(
        context,
        f"Ответ клиенту через reply отправил {escape(manager.full_name if manager else 'менеджер')}",
    )


async def reply_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    target_user_id = int(query.data.split(":", 1)[1])
    if not target_user_id:
        await query.message.reply_text("Не найден получатель ответа.")
        return ConversationHandler.END

    context.user_data["reply_target_user_id"] = target_user_id
    await query.message.reply_text("Введите ответ клиенту. Следующее сообщение будет отправлено через бота.")
    return REPLY_TEXT


async def send_reply_to_client(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    target_user_id = context.user_data.get("reply_target_user_id")
    if not target_user_id:
        await update.message.reply_text("Не найден получатель ответа.")
        return ConversationHandler.END

    manager = update.effective_user
    reply_text = update.message.text

    try:
        await context.bot.send_message(
            target_user_id,
            f"Ответ менеджера Brellas:\n\n{reply_text}",
        )
    except Exception:
        logger.exception("Failed to send manager reply")
        await update.message.reply_text("Не удалось отправить ответ клиенту.")
        await send_log(context, "Ошибка отправки ответа клиенту")
        context.user_data.pop("reply_target_user_id", None)
        return ConversationHandler.END

    await update.message.reply_text("Ответ отправлен клиенту через бота.")
    await send_log(
        context,
        f"Ответ клиенту отправил {escape(manager.full_name if manager else 'менеджер')}",
    )
    context.user_data.pop("reply_target_user_id", None)
    return ConversationHandler.END


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.exception("Bot error", exc_info=context.error)
    await send_log(context, f"Ошибка бота: {escape(str(context.error))}")


def build_app() -> Application:
    app = Application.builder().token(BOT_TOKEN).build()

    lead_handler = ConversationHandler(
        entry_points=[
            CallbackQueryHandler(lead_start, pattern="^lead:start$"),
            MessageHandler(filters.Regex("^Оставить заявку$"), lead_start),
        ],
        states={
            LEAD_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, lead_name)],
            LEAD_COMPANY: [MessageHandler(filters.TEXT & ~filters.COMMAND, lead_company)],
            LEAD_PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, lead_phone)],
            LEAD_NEED: [MessageHandler(filters.TEXT & ~filters.COMMAND, lead_need)],
            LEAD_VOLUME: [MessageHandler(filters.TEXT & ~filters.COMMAND, lead_volume)],
            LEAD_COMMENT: [MessageHandler(filters.TEXT & ~filters.COMMAND, lead_comment)],
        },
        fallbacks=[
            CallbackQueryHandler(back_to_menu, pattern="^menu:main$"),
            CommandHandler("cancel", cancel),
        ],
    )

    reply_handler = ConversationHandler(
        entry_points=[CallbackQueryHandler(reply_start, pattern="^lead_reply:\\d+$")],
        states={
            REPLY_TEXT: [
                MessageHandler(
                    filters.Chat(LEADS_CHAT_ID) & filters.TEXT & ~filters.COMMAND,
                    send_reply_to_client,
                )
            ],
        },
        fallbacks=[CommandHandler("cancel", cancel)],
    )

    app.add_handler(MessageHandler(filters.ALL, log_incoming_message), group=-1)
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("cancel", cancel))
    app.add_handler(lead_handler)
    app.add_handler(reply_handler)
    app.add_handler(MessageHandler(filters.Regex("^Открыть каталог$"), open_catalog))
    app.add_handler(
        MessageHandler(
            filters.Chat(LEADS_CHAT_ID) & filters.REPLY & filters.TEXT & ~filters.COMMAND,
            group_reply_to_client,
        )
    )
    app.add_handler(MessageHandler(filters.ChatType.PRIVATE & ~filters.COMMAND, forward_active_client_message))
    app.add_handler(CallbackQueryHandler(update_lead_status, pattern="^lead_status:(work|closed):\\d+$"))
    app.add_handler(CallbackQueryHandler(back_to_menu, pattern="^menu:main$"))
    app.add_error_handler(error_handler)

    return app


if __name__ == "__main__":
    if BOT_TOKEN == "PASTE_TOKEN":
        raise RuntimeError("Укажите BOT_TOKEN в верхней части bot.py")

    build_app().run_polling(allowed_updates=Update.ALL_TYPES)
