from __future__ import annotations

import asyncio
import json
import logging
import os
import urllib.parse
import urllib.request
from datetime import timezone, timedelta
from html import escape
from typing import Optional

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, KeyboardButton, ReplyKeyboardMarkup, ReplyKeyboardRemove, Update
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
SITE_URL = "https://brellas.ru"
MINI_APP_URL = "https://brellas.ru"
SANITY_PROJECT_ID = os.getenv("NEXT_PUBLIC_SANITY_PROJECT_ID", "2ftsk62o")
SANITY_DATASET = os.getenv("NEXT_PUBLIC_SANITY_DATASET", "production")
SANITY_API_VERSION = os.getenv("NEXT_PUBLIC_SANITY_API_VERSION", "2025-01-01")
SANITY_API_READ_TOKEN = os.getenv("SANITY_API_READ_TOKEN", "")
PRODUCT_PAGE_SIZE = 8
CATEGORY_PAGE_SIZE = 8
LEAD_COUNTER_FILE = os.getenv("LEAD_COUNTER_FILE", "lead_counter.txt")

(
    ITEM_MODE,
    CATEGORY,
    PRODUCT,
    NAME,
    ITEMS,
    QTY,
    DELIVERY,
    SHIPPING_SERVICE,
    SHIPPING_CUSTOM,
    ADDRESS,
    PHONE,
    COMMENT,
    CONFIRM,
    REPLY_TEXT,
) = range(14)

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)
ACTIVE_LEAD_USERS = set()
CLIENT_MESSAGE_TARGETS = {}
LEAD_COUNTER_LOCK = asyncio.Lock()
LAST_LEAD_NUMBER = 0


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


def item_mode_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("Выбрать товар из каталога", callback_data="item_mode:catalog")],
            [InlineKeyboardButton("Ввести артикул вручную", callback_data="item_mode:manual")],
        ]
    )


def delivery_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("Самовывоз", callback_data="delivery:pickup")],
            [InlineKeyboardButton("Доставка по городу", callback_data="delivery:city")],
            [InlineKeyboardButton("Транспортная компания", callback_data="delivery:company")],
        ]
    )


def shipping_service_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("СДЭК", callback_data="shipping:cdek")],
            [InlineKeyboardButton("Почта России", callback_data="shipping:russian_post")],
            [InlineKeyboardButton("5Post", callback_data="shipping:5post")],
            [InlineKeyboardButton("Другая ТК", callback_data="shipping:other")],
        ]
    )


def phone_keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        [[KeyboardButton("Поделиться номером", request_contact=True)]],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def skip_comment_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[InlineKeyboardButton("Пропустить", callback_data="comment:skip")]])


def confirm_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("Подтвердить", callback_data="lead:confirm")],
            [InlineKeyboardButton("Отмена", callback_data="lead:cancel")],
        ]
    )


def short_button_text(text: str, limit: int = 56) -> str:
    return text if len(text) <= limit else f"{text[: limit - 1]}…"


def categories_keyboard(categories: list[dict], page: int = 0) -> InlineKeyboardMarkup:
    start = page * CATEGORY_PAGE_SIZE
    end = start + CATEGORY_PAGE_SIZE
    rows = []

    for index, category in enumerate(categories[start:end], start=start):
        title = category.get("title") or "Без названия"
        count = category.get("productCount", 0)
        rows.append([InlineKeyboardButton(short_button_text(f"{title} ({count})"), callback_data=f"category:{index}:0")])

    nav = []
    if page > 0:
        nav.append(InlineKeyboardButton("Назад", callback_data=f"categories_page:{page - 1}"))
    if end < len(categories):
        nav.append(InlineKeyboardButton("Дальше", callback_data=f"categories_page:{page + 1}"))
    if nav:
        rows.append(nav)

    rows.append([InlineKeyboardButton("Ввести артикул вручную", callback_data="item_mode:manual")])
    return InlineKeyboardMarkup(rows)


def products_keyboard(products: list[dict], page: int = 0) -> InlineKeyboardMarkup:
    start = page * PRODUCT_PAGE_SIZE
    end = start + PRODUCT_PAGE_SIZE
    rows = []

    for index, product in enumerate(products[start:end], start=start):
        title = product.get("title") or "Без названия"
        sku = product.get("sku")
        stock = "в наличии" if product.get("available", True) else "под заказ"
        label = f"{title} / арт. {sku} / {stock}" if sku else f"{title} / {stock}"
        rows.append([InlineKeyboardButton(short_button_text(label), callback_data=f"product:{index}")])

    nav = []
    if page > 0:
        nav.append(InlineKeyboardButton("Назад", callback_data=f"products_page:{page - 1}"))
    if end < len(products):
        nav.append(InlineKeyboardButton("Дальше", callback_data=f"products_page:{page + 1}"))
    if nav:
        rows.append(nav)

    rows.append([InlineKeyboardButton("К категориям", callback_data="catalog:categories")])
    rows.append([InlineKeyboardButton("Ввести артикул вручную", callback_data="item_mode:manual")])
    return InlineKeyboardMarkup(rows)


def lead_actions_keyboard(user) -> InlineKeyboardMarkup:
    user_id = user.id if user else 0

    return InlineKeyboardMarkup(
        [
            [InlineKeyboardButton("Ответить", callback_data=f"lead_reply:{user_id}")],
            [
                InlineKeyboardButton("В работу", callback_data=f"lead_status:work:{user_id}"),
                InlineKeyboardButton("Закрыть", callback_data=f"lead_status:closed:{user_id}"),
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


def read_lead_counter() -> int:
    try:
        with open(LEAD_COUNTER_FILE, "r", encoding="utf-8") as file:
            return int(file.read().strip() or "0")
    except FileNotFoundError:
        return 0
    except Exception:
        logger.exception("Failed to read lead counter")
        return LAST_LEAD_NUMBER


def write_lead_counter(number: int) -> None:
    with open(LEAD_COUNTER_FILE, "w", encoding="utf-8") as file:
        file.write(str(number))


async def next_lead_number() -> int:
    global LAST_LEAD_NUMBER

    async with LEAD_COUNTER_LOCK:
        current_number = max(read_lead_counter(), LAST_LEAD_NUMBER)
        next_number = current_number + 1
        LAST_LEAD_NUMBER = next_number

        try:
            write_lead_counter(next_number)
        except Exception:
            logger.exception("Failed to write lead counter")

        return next_number


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
        await query.edit_message_text("Как добавить товар в заявку?", reply_markup=item_mode_keyboard())
    else:
        await update.message.reply_text("Как добавить товар в заявку?", reply_markup=item_mode_keyboard())
    return ITEM_MODE


async def open_catalog(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        f"Каталог: {SITE_URL}",
        reply_markup=reply_menu(),
    )


def sanity_fetch_sync(query: str, params: Optional[dict] = None) -> list[dict]:
    query_params = {"query": query}
    for key, value in (params or {}).items():
        query_params[f"${key}"] = json.dumps(value, ensure_ascii=False)

    url = (
        f"https://{SANITY_PROJECT_ID}.apicdn.sanity.io/v{SANITY_API_VERSION}/data/query/"
        f"{SANITY_DATASET}?{urllib.parse.urlencode(query_params)}"
    )
    headers = {"User-Agent": "BrellasTelegramBot/1.0"}
    if SANITY_API_READ_TOKEN:
        headers["Authorization"] = f"Bearer {SANITY_API_READ_TOKEN}"

    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8"))

    if "error" in payload:
        raise RuntimeError(payload["error"].get("description") or "Sanity query error")

    result = payload.get("result")
    return result if isinstance(result, list) else []


async def fetch_categories() -> list[dict]:
    query = """
*[_type == "category"] | order(sortOrder asc, title asc){
  _id,
  title,
  "slug": slug.current,
  "productCount": count(*[_type == "product" && references(^._id)])
}
"""
    return await asyncio.to_thread(sanity_fetch_sync, query)


async def fetch_products_by_category(category_id: str) -> list[dict]:
    query = """
*[_type == "product" && category._ref == $categoryId] | order(sortOrder asc, _createdAt desc){
  _id,
  title,
  sku,
  available,
  "categoryId": category->_id,
  "categoryTitle": category->title
}
"""
    return await asyncio.to_thread(sanity_fetch_sync, query, {"categoryId": category_id})


async def fetch_product_by_sku(sku: str) -> Optional[dict]:
    query = """
*[_type == "product" && lower(sku) == lower($sku)][0...1]{
  _id,
  title,
  sku,
  available,
  "categoryId": category->_id,
  "categoryTitle": category->title
}
"""
    products = await asyncio.to_thread(sanity_fetch_sync, query, {"sku": sku.strip()})
    return products[0] if products else None


def get_text(update: Update) -> str:
    if not update.message or not update.message.text:
        return ""
    return update.message.text.strip()


def phone_is_valid(phone: str) -> bool:
    digits = "".join(ch for ch in phone if ch.isdigit())
    return len(digits) >= 7


def availability_text(product: Optional[dict]) -> str:
    if not product:
        return ""
    return "В наличии" if product.get("available", True) else "Под заказ"


def save_product_to_lead(context: ContextTypes.DEFAULT_TYPE, product: dict) -> None:
    title = product.get("title") or "Без названия"
    sku = product.get("sku") or ""
    category = product.get("categoryTitle") or ""
    context.user_data["lead_product_title"] = title
    context.user_data["lead_product_sku"] = sku
    context.user_data["lead_product_category"] = category
    context.user_data["lead_product_available"] = product.get("available", True)
    context.user_data["lead_items"] = f"{title} / арт. {sku}" if sku else title


def lead_summary(data: dict) -> str:
    address = data.get("lead_address") or "не требуется"
    comment = data.get("lead_comment") or "нет"
    if data.get("lead_product_title"):
        item_text = data.get("lead_product_sku") or "без артикула"
        available = "В наличии" if data.get("lead_product_available", True) else "Под заказ"
        product_lines = (
            f"Товар: {data.get('lead_product_title', '')}\n"
            f"Категория: {data.get('lead_product_category', '')}\n"
            f"Наличие: {available}\n"
        )
    else:
        item_text = data.get("lead_items", "")
        product_lines = ""

    return (
        "===== ВАША ЗАЯВКА =====\n\n"
        f"Имя: {data.get('lead_name', '')}\n"
        f"Артикулы: {item_text}\n"
        f"{product_lines}"
        f"Количество: {data.get('lead_qty', '')}\n"
        f"Получение: {data.get('lead_delivery', '')}\n"
        f"Служба доставки: {data.get('lead_shipping_service') or 'не требуется'}\n"
        f"Адрес / пункт выдачи: {address}\n"
        f"Телефон: {data.get('lead_phone', '')}\n"
        f"Комментарий: {comment}"
    )


async def item_mode(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    mode = query.data.split(":", 1)[1]
    if mode == "manual":
        context.user_data.pop("lead_product_title", None)
        context.user_data.pop("lead_product_sku", None)
        context.user_data.pop("lead_product_category", None)
        context.user_data.pop("lead_product_available", None)
        context.user_data.pop("lead_items", None)
        if context.user_data.get("lead_name"):
            await query.edit_message_text("Введите артикулы через запятую, например: A123, B52, C991")
            return ITEMS
        await query.edit_message_text("Как вас зовут?")
        return NAME

    await query.edit_message_text("Загружаю категории из каталога...")
    try:
        categories = await fetch_categories()
    except Exception:
        logger.exception("Failed to fetch Sanity categories")
        await send_log(context, "Ошибка получения категорий из Sanity")
        await query.edit_message_text(
            "Каталог временно недоступен. Можно ввести артикул вручную.",
            reply_markup=item_mode_keyboard(),
        )
        return ITEM_MODE

    categories = [category for category in categories if category.get("productCount", 0) > 0]
    if not categories:
        await query.edit_message_text(
            "В каталоге пока нет товаров. Можно ввести артикул вручную.",
            reply_markup=item_mode_keyboard(),
        )
        return ITEM_MODE

    context.user_data["catalog_categories"] = categories
    await query.edit_message_text("Выберите категорию:", reply_markup=categories_keyboard(categories))
    return CATEGORY


async def item_mode_hint(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Выберите вариант кнопкой ниже.", reply_markup=item_mode_keyboard())
    return ITEM_MODE


async def categories_page(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    categories = context.user_data.get("catalog_categories") or []
    if not categories:
        await query.edit_message_text("Категории не загружены. Попробуйте выбрать каталог еще раз.", reply_markup=item_mode_keyboard())
        return ITEM_MODE

    page = int(query.data.split(":", 1)[1])
    await query.edit_message_text("Выберите категорию:", reply_markup=categories_keyboard(categories, page))
    return CATEGORY


async def show_categories(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    categories = context.user_data.get("catalog_categories") or []
    if not categories:
        await query.edit_message_text("Категории не загружены. Выберите источник товара заново.", reply_markup=item_mode_keyboard())
        return ITEM_MODE

    await query.edit_message_text("Выберите категорию:", reply_markup=categories_keyboard(categories))
    return CATEGORY


async def select_category(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    categories = context.user_data.get("catalog_categories") or []
    _, index_text, page_text = query.data.split(":", 2)
    category_index = int(index_text)
    page = int(page_text)

    if category_index >= len(categories):
        await query.edit_message_text("Категория не найдена. Выберите категорию заново.", reply_markup=categories_keyboard(categories))
        return CATEGORY

    category = categories[category_index]
    context.user_data["catalog_category_index"] = category_index
    await query.edit_message_text(f"Загружаю товары: {category.get('title', 'категория')}...")

    try:
        products = await fetch_products_by_category(category["_id"])
    except Exception:
        logger.exception("Failed to fetch Sanity products")
        await send_log(context, f"Ошибка получения товаров из Sanity для категории {escape(category.get('title', ''))}")
        await query.edit_message_text("Не удалось загрузить товары. Попробуйте другую категорию.", reply_markup=categories_keyboard(categories, page))
        return CATEGORY

    if not products:
        await query.edit_message_text("В этой категории нет товаров. Выберите другую категорию.", reply_markup=categories_keyboard(categories, page))
        return CATEGORY

    context.user_data["catalog_products"] = products
    await query.edit_message_text(
        f"Выберите товар: {category.get('title', '')}",
        reply_markup=products_keyboard(products),
    )
    return PRODUCT


async def products_page(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    products = context.user_data.get("catalog_products") or []
    if not products:
        await query.edit_message_text("Товары не загружены. Вернитесь к категориям.", reply_markup=categories_keyboard(context.user_data.get("catalog_categories") or []))
        return CATEGORY

    page = int(query.data.split(":", 1)[1])
    category_index = context.user_data.get("catalog_category_index", 0)
    categories = context.user_data.get("catalog_categories") or []
    category_title = categories[category_index].get("title", "") if category_index < len(categories) else ""
    await query.edit_message_text(f"Выберите товар: {category_title}", reply_markup=products_keyboard(products, page))
    return PRODUCT


async def select_product(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    products = context.user_data.get("catalog_products") or []
    product_index = int(query.data.split(":", 1)[1])
    if product_index >= len(products):
        await query.edit_message_text("Товар не найден. Выберите товар заново.", reply_markup=products_keyboard(products))
        return PRODUCT

    product = products[product_index]
    save_product_to_lead(context, product)
    title = context.user_data["lead_product_title"]
    sku = context.user_data["lead_product_sku"]
    stock = availability_text(product)

    text = f"Вы выбрали: {title}\nАртикул: {sku or 'без артикула'}\nНаличие: {stock}"
    if product.get("available", True) is False:
        text += "\n\nТовара сейчас нет в наличии. Заявку можно оставить, менеджер уточнит срок поставки."

    await query.edit_message_text(text)
    if context.user_data.get("lead_name"):
        await query.message.reply_text("Укажите количество. Можно числом или текстом.")
        return QTY

    await query.message.reply_text("Как вас зовут?")
    return NAME


async def catalog_hint(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Выберите вариант кнопкой в сообщении выше.")
    return CATEGORY


async def product_hint(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Выберите товар кнопкой в сообщении выше.")
    return PRODUCT


async def lead_name(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = get_text(update)
    if not text:
        await update.message.reply_text("Введите имя обычным текстом.")
        return NAME

    context.user_data["lead_name"] = text
    if context.user_data.get("lead_items"):
        await update.message.reply_text("Укажите количество. Можно числом или текстом.")
        return QTY

    await update.message.reply_text("Введите артикулы через запятую, например: A123, B52, C991")
    return ITEMS


async def lead_items(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = get_text(update)
    if not text:
        await update.message.reply_text("Введите артикулы одной строкой.")
        return ITEMS

    if "," in text:
        context.user_data["lead_items"] = text
        await update.message.reply_text("Укажите количество. Можно числом или текстом.")
        return QTY

    try:
        product = await fetch_product_by_sku(text)
    except Exception:
        logger.exception("Failed to validate Sanity sku")
        await send_log(context, f"Ошибка проверки артикула в Sanity: {escape(text)}")
        context.user_data["lead_items"] = text
        await update.message.reply_text(
            "Не удалось проверить артикул по каталогу. Я сохраню его как введен. Укажите количество."
        )
        return QTY

    if not product:
        await update.message.reply_text(
            "Товар с таким артикулом не найден. Проверьте артикул или выберите товар из каталога.",
            reply_markup=item_mode_keyboard(),
        )
        return ITEMS

    save_product_to_lead(context, product)
    stock = availability_text(product)
    reply = (
        f"Нашел товар: {context.user_data['lead_product_title']}\n"
        f"Категория: {context.user_data.get('lead_product_category', '')}\n"
        f"Наличие: {stock}"
    )
    if product.get("available", True) is False:
        reply += "\n\nТовара сейчас нет в наличии. Заявку можно оставить, менеджер уточнит срок поставки."

    await update.message.reply_text(reply)
    await update.message.reply_text("Укажите количество. Можно числом или текстом.")
    return QTY


async def lead_qty(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = get_text(update)
    if not text:
        await update.message.reply_text("Укажите количество.")
        return QTY

    context.user_data["lead_qty"] = text
    await update.message.reply_text("Выберите способ получения:", reply_markup=delivery_keyboard())
    return DELIVERY


async def lead_delivery(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    delivery_map = {
        "pickup": "Самовывоз",
        "city": "Доставка по городу",
        "company": "Транспортная компания",
    }
    delivery_key = query.data.split(":", 1)[1]
    delivery = delivery_map.get(delivery_key)
    if not delivery:
        await query.message.reply_text("Выберите способ получения кнопкой ниже.", reply_markup=delivery_keyboard())
        return DELIVERY

    context.user_data["lead_delivery"] = delivery
    if delivery_key == "pickup":
        context.user_data["lead_address"] = ""
        context.user_data["lead_shipping_service"] = ""
        await query.edit_message_text("Телефон для связи?")
        await query.message.reply_text("Можно ввести вручную или нажать кнопку.", reply_markup=phone_keyboard())
        return PHONE

    if delivery_key == "company":
        await query.edit_message_text("Выберите службу доставки:", reply_markup=shipping_service_keyboard())
        return SHIPPING_SERVICE

    context.user_data["lead_shipping_service"] = ""
    await query.edit_message_text("Введите адрес доставки.")
    return ADDRESS


async def lead_delivery_hint(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Выберите способ получения кнопкой ниже.", reply_markup=delivery_keyboard())
    return DELIVERY


async def shipping_service(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    service_map = {
        "cdek": "СДЭК",
        "russian_post": "Почта России",
        "5post": "5Post",
        "other": "Другая ТК",
    }
    service_key = query.data.split(":", 1)[1]
    service = service_map.get(service_key)
    if not service:
        await query.message.reply_text("Выберите службу доставки кнопкой ниже.", reply_markup=shipping_service_keyboard())
        return SHIPPING_SERVICE

    if service_key == "other":
        await query.edit_message_text("Введите название транспортной компании.")
        return SHIPPING_CUSTOM

    context.user_data["lead_shipping_service"] = service
    await query.edit_message_text("Введите адрес пункта выдачи.")
    return ADDRESS


async def shipping_service_hint(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Выберите службу доставки кнопкой ниже.", reply_markup=shipping_service_keyboard())
    return SHIPPING_SERVICE


async def shipping_custom(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = get_text(update)
    if not text:
        await update.message.reply_text("Введите название транспортной компании.")
        return SHIPPING_CUSTOM

    context.user_data["lead_shipping_service"] = text
    await update.message.reply_text("Введите адрес пункта выдачи.")
    return ADDRESS


async def lead_address(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    text = get_text(update)
    if not text:
        if context.user_data.get("lead_delivery") == "Транспортная компания":
            await update.message.reply_text("Введите адрес пункта выдачи.")
        else:
            await update.message.reply_text("Введите адрес доставки.")
        return ADDRESS

    context.user_data["lead_address"] = text
    await update.message.reply_text("Телефон для связи?")
    await update.message.reply_text("Можно ввести вручную или нажать кнопку.", reply_markup=phone_keyboard())
    return PHONE


async def lead_phone(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    if update.message and update.message.contact:
        phone = update.message.contact.phone_number.strip()
    else:
        phone = get_text(update)

    if not phone or not phone_is_valid(phone):
        await update.message.reply_text(
            "Введите корректный телефон или нажмите «Поделиться номером».",
            reply_markup=phone_keyboard(),
        )
        return PHONE

    context.user_data["lead_phone"] = phone
    await update.message.reply_text(
        "Комментарий к заявке? Если комментария нет, нажмите «Пропустить».",
        reply_markup=ReplyKeyboardRemove(),
    )
    await update.message.reply_text("Комментарий необязателен.", reply_markup=skip_comment_keyboard())
    return COMMENT


async def lead_comment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    context.user_data["lead_comment"] = get_text(update)
    await update.message.reply_text(lead_summary(context.user_data), reply_markup=confirm_keyboard())
    return CONFIRM


async def skip_comment(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    context.user_data["lead_comment"] = ""
    await query.edit_message_text(lead_summary(context.user_data), reply_markup=confirm_keyboard())
    return CONFIRM


async def confirm_hint(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    await update.message.reply_text("Проверьте заявку и нажмите «Подтвердить» или «Отмена».")
    return CONFIRM


async def confirm_lead(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    await send_lead(update, context)
    await query.edit_message_text("Заявка отправлена, менеджер свяжется с вами")
    context.user_data.clear()
    return ConversationHandler.END


async def cancel_lead(update: Update, context: ContextTypes.DEFAULT_TYPE) -> int:
    query = update.callback_query
    await query.answer()

    context.user_data.clear()
    await query.edit_message_text("Заявка отменена.")
    return ConversationHandler.END


async def send_lead(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user = update.effective_user
    data = context.user_data
    lead_number = await next_lead_number()
    address = data.get("lead_address") or "не требуется"
    comment = data.get("lead_comment") or "нет"
    if data.get("lead_product_title"):
        item_text = data.get("lead_product_sku") or "без артикула"
        available = "В наличии" if data.get("lead_product_available", True) else "Под заказ"
        product_lines = (
            f"Товар: {escape(data.get('lead_product_title', ''))}\n"
            f"Категория: {escape(data.get('lead_product_category', ''))}\n"
            f"Наличие: {escape(available)}\n"
        )
    else:
        item_text = data.get("lead_items", "")
        product_lines = ""

    text = (
        f"<b>ЗАЯВКА #{lead_number}</b>\n\n"
        "Статус: НОВЫЙ\n\n"
        f"Имя: {escape(data.get('lead_name', ''))}\n"
        f"Артикулы: {escape(item_text)}\n"
        f"{product_lines}"
        f"Количество: {escape(data.get('lead_qty', ''))}\n"
        f"Получение: {escape(data.get('lead_delivery', ''))}\n"
        f"Служба доставки: {escape(data.get('lead_shipping_service') or 'не требуется')}\n"
        f"Адрес / пункт выдачи: {escape(address)}\n"
        f"Телефон: {escape(data.get('lead_phone', ''))}\n"
        f"Комментарий: {escape(comment)}\n\n"
        f"Username: @{escape(user.username) if user and user.username else 'без username'}\n"
        f"User ID: {user.id if user else 'неизвестно'}"
    )
    await context.bot.send_message(
        LEADS_CHAT_ID,
        text,
        parse_mode=ParseMode.HTML,
        reply_markup=lead_actions_keyboard(user),
    )
    await send_log(context, f"Отправлена заявка #{lead_number} от {escape(data.get('lead_name', ''))}")


async def update_lead_status(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()

    _, action, user_id_text = query.data.split(":", 2)
    user_id = int(user_id_text)
    status = "В РАБОТЕ" if action == "work" else "ЗАКРЫТО"

    if action == "work" and user_id:
        ACTIVE_LEAD_USERS.add(user_id)
    elif action == "closed" and user_id:
        ACTIVE_LEAD_USERS.discard(user_id)

    message_text = query.message.text or ""
    lines = message_text.splitlines()
    status_index = next((index for index, line in enumerate(lines) if line.startswith("Статус:")), None)

    if status_index is not None:
        lines[status_index] = f"Статус: {status}"
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
            ITEM_MODE: [
                CallbackQueryHandler(item_mode, pattern="^item_mode:(catalog|manual)$"),
                MessageHandler(filters.ALL & ~filters.COMMAND, item_mode_hint),
            ],
            CATEGORY: [
                CallbackQueryHandler(item_mode, pattern="^item_mode:manual$"),
                CallbackQueryHandler(categories_page, pattern="^categories_page:\\d+$"),
                CallbackQueryHandler(select_category, pattern="^category:\\d+:\\d+$"),
                MessageHandler(filters.ALL & ~filters.COMMAND, catalog_hint),
            ],
            PRODUCT: [
                CallbackQueryHandler(item_mode, pattern="^item_mode:manual$"),
                CallbackQueryHandler(show_categories, pattern="^catalog:categories$"),
                CallbackQueryHandler(products_page, pattern="^products_page:\\d+$"),
                CallbackQueryHandler(select_product, pattern="^product:\\d+$"),
                MessageHandler(filters.ALL & ~filters.COMMAND, product_hint),
            ],
            NAME: [MessageHandler(filters.ALL & ~filters.COMMAND, lead_name)],
            ITEMS: [
                CallbackQueryHandler(item_mode, pattern="^item_mode:(catalog|manual)$"),
                MessageHandler(filters.ALL & ~filters.COMMAND, lead_items),
            ],
            QTY: [MessageHandler(filters.ALL & ~filters.COMMAND, lead_qty)],
            DELIVERY: [
                CallbackQueryHandler(lead_delivery, pattern="^delivery:(pickup|city|company)$"),
                MessageHandler(filters.ALL & ~filters.COMMAND, lead_delivery_hint),
            ],
            SHIPPING_SERVICE: [
                CallbackQueryHandler(shipping_service, pattern="^shipping:(cdek|russian_post|5post|other)$"),
                MessageHandler(filters.ALL & ~filters.COMMAND, shipping_service_hint),
            ],
            SHIPPING_CUSTOM: [MessageHandler(filters.ALL & ~filters.COMMAND, shipping_custom)],
            ADDRESS: [MessageHandler(filters.ALL & ~filters.COMMAND, lead_address)],
            PHONE: [MessageHandler(filters.ALL & ~filters.COMMAND, lead_phone)],
            COMMENT: [
                CallbackQueryHandler(skip_comment, pattern="^comment:skip$"),
                MessageHandler(filters.ALL & ~filters.COMMAND, lead_comment),
            ],
            CONFIRM: [
                CallbackQueryHandler(confirm_lead, pattern="^lead:confirm$"),
                CallbackQueryHandler(cancel_lead, pattern="^lead:cancel$"),
                MessageHandler(filters.ALL & ~filters.COMMAND, confirm_hint),
            ],
        },
        fallbacks=[
            CallbackQueryHandler(back_to_menu, pattern="^menu:main$"),
            CallbackQueryHandler(cancel_lead, pattern="^lead:cancel$"),
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


async def main() -> None:
    app = build_app()
    await app.initialize()
    await app.start()
    await app.updater.start_polling(allowed_updates=Update.ALL_TYPES)
    await asyncio.Event().wait()


if __name__ == "__main__":
    if BOT_TOKEN == "PASTE_TOKEN":
        raise RuntimeError("Укажите BOT_TOKEN в верхней части bot.py")

    asyncio.run(main())
