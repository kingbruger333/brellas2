import logging
from html import escape

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update, WebAppInfo
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

BOT_TOKEN = "PASTE_TOKEN"
LEADS_CHAT_ID = -1001234567890
LOG_CHAT_ID = -1001234567890
SITE_URL = "https://example.com"
MINI_APP_URL = "https://example.com"
MANAGER_CONTACT = "@username"

(
    LEAD_NAME,
    LEAD_COMPANY,
    LEAD_PHONE,
    LEAD_NEED,
    LEAD_VOLUME,
    LEAD_COMMENT,
    PRICE_NAME,
    PRICE_PHONE,
    PRICE_INTEREST,
) = range(9)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def main_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("Оставить заявку", callback_data="lead:start")],
            [InlineKeyboardButton("Запросить прайс", callback_data="price:start")],
            [InlineKeyboardButton("Открыть каталог", url=SITE_URL)],
            [InlineKeyboardButton("Открыть Mini App", web_app=WebAppInfo(url=MINI_APP_URL))],
            [InlineKeyboardButton("Связаться с менеджером", url=f"https://t.me/{MANAGER_CONTACT.lstrip('@')}")],
        ]
    )


def back_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton("Назад", callback_data="menu:main")]])


async def send_log(context: ContextTypes.DEFAULT_TYPE, text: str) -> None:
    try:
        await context.bot.send_message(LOG_CHAT_ID, text, parse_mode=ParseMode.HTML)
    except Exception:
        logger.exception("Failed to send log")


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

    await update.message.reply_text(text, reply_markup=main_menu())


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
        reply_markup=main_menu(),
    )


async def cancel(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await update.message.reply_text("Действие отменено.", reply_markup=main_menu())
    return ConversationHandler.END


async def back_to_menu(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data.clear()
    await show_menu(update, context)
    return ConversationHandler.END


async def lead_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    context.user_data.clear()
    await query.edit_message_text("Как вас зовут?", reply_markup=back_menu())
    return LEAD_NAME


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
        reply_markup=main_menu(),
    )
    context.user_data.clear()
    return ConversationHandler.END


async def price_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()
    context.user_data.clear()
    await query.edit_message_text("Как вас зовут?", reply_markup=back_menu())
    return PRICE_NAME


async def price_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["price_name"] = update.message.text
    await update.message.reply_text("Телефон для связи?", reply_markup=back_menu())
    return PRICE_PHONE


async def price_phone(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["price_phone"] = update.message.text
    await update.message.reply_text("Какие товары или категории интересуют?", reply_markup=back_menu())
    return PRICE_INTEREST


async def price_interest(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["price_interest"] = update.message.text
    await send_price_request(update, context)
    await update.message.reply_text(
        "Спасибо. Запрос на прайс отправлен.",
        reply_markup=main_menu(),
    )
    context.user_data.clear()
    return ConversationHandler.END


async def send_lead(update: Update, context: ContextTypes.DEFAULT_TYPE, title: str) -> None:
    user = update.effective_user
    data = context.user_data
    text = (
        f"<b>{escape(title)}</b>\n\n"
        f"Имя: {escape(data.get('lead_name', ''))}\n"
        f"Компания: {escape(data.get('lead_company', ''))}\n"
        f"Телефон: {escape(data.get('lead_phone', ''))}\n"
        f"Что нужно: {escape(data.get('lead_need', ''))}\n"
        f"Объём: {escape(data.get('lead_volume', ''))}\n"
        f"Комментарий: {escape(data.get('lead_comment', ''))}\n\n"
        f"Telegram: @{escape(user.username) if user and user.username else 'без username'}"
    )
    await context.bot.send_message(LEADS_CHAT_ID, text, parse_mode=ParseMode.HTML)
    await send_log(context, f"Отправлена заявка от {escape(data.get('lead_name', ''))}")


async def send_price_request(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    data = context.user_data
    text = (
        "<b>Запрос прайса</b>\n\n"
        f"Имя: {escape(data.get('price_name', ''))}\n"
        f"Телефон: {escape(data.get('price_phone', ''))}\n"
        f"Интерес: {escape(data.get('price_interest', ''))}\n\n"
        f"Telegram: @{escape(user.username) if user and user.username else 'без username'}"
    )
    await context.bot.send_message(LEADS_CHAT_ID, text, parse_mode=ParseMode.HTML)
    await send_log(context, f"Отправлен запрос прайса от {escape(data.get('price_name', ''))}")


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    logger.exception("Bot error", exc_info=context.error)
    await send_log(context, f"Ошибка бота: {escape(str(context.error))}")


def build_app() -> Application:
    app = Application.builder().token(BOT_TOKEN).build()

    lead_handler = ConversationHandler(
        entry_points=[CallbackQueryHandler(lead_start, pattern="^lead:start$")],
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

    price_handler = ConversationHandler(
        entry_points=[CallbackQueryHandler(price_start, pattern="^price:start$")],
        states={
            PRICE_NAME: [MessageHandler(filters.TEXT & ~filters.COMMAND, price_name)],
            PRICE_PHONE: [MessageHandler(filters.TEXT & ~filters.COMMAND, price_phone)],
            PRICE_INTEREST: [MessageHandler(filters.TEXT & ~filters.COMMAND, price_interest)],
        },
        fallbacks=[
            CallbackQueryHandler(back_to_menu, pattern="^menu:main$"),
            CommandHandler("cancel", cancel),
        ],
    )

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("cancel", cancel))
    app.add_handler(lead_handler)
    app.add_handler(price_handler)
    app.add_handler(CallbackQueryHandler(back_to_menu, pattern="^menu:main$"))
    app.add_error_handler(error_handler)

    return app


if __name__ == "__main__":
    if BOT_TOKEN == "PASTE_TOKEN":
        raise RuntimeError("Укажите BOT_TOKEN в верхней части bot.py")

    build_app().run_polling(allowed_updates=Update.ALL_TYPES)
