import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/lib/sanity.env";

export const runtime = "nodejs";

type CartLeadItem = {
  title?: string;
  sku?: string;
  price?: number;
  quantity?: number;
  total?: number;
  minOrder?: number;
};

type LeadPayload = {
  source?: string;
  name?: string;
  phone?: string;
  items?: string;
  quantity?: string;
  deliveryMethod?: string;
  shippingService?: string;
  customShippingService?: string;
  address?: string;
  comment?: string;
  website?: string;
  cartItems?: CartLeadItem[];
  cartTotal?: number;
};

type SavedLead = {
  id: string;
  source: "site" | "cart";
  createdAt: string;
  name: string;
  phone: string;
  items: string;
  quantity: string;
  deliveryMethod: string;
  shippingService: string;
  address: string;
  comment: string;
  cartItems: Required<CartLeadItem>[];
  cartTotal: number;
};

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN || "";
const LEADS_CHAT_ID = process.env.LEADS_CHAT_ID || "-5151727605";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const LEAD_EMAIL_TO = process.env.LEAD_EMAIL_TO || "";
const LEAD_EMAIL_FROM = process.env.LEAD_EMAIL_FROM || "Brellas <onboarding@resend.dev>";
const LEAD_STORAGE_DIRS = [
  process.env.LEAD_STORAGE_DIR,
  path.join(process.cwd(), "data"),
  path.join("/tmp", "brellas-leads")
].filter(Boolean) as string[];
const SANITY_API_WRITE_TOKEN = process.env.SANITY_API_WRITE_TOKEN || "";
const PHONE_MIN_DIGITS = 7;

const sanityWriteClient = SANITY_API_WRITE_TOKEN
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token: SANITY_API_WRITE_TOKEN
    })
  : null;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function phoneIsValid(phone: string): boolean {
  return phone.replace(/\D/g, "").length >= PHONE_MIN_DIGITS;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(value);
}

function normalizeCartItems(items: unknown): Required<CartLeadItem>[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => {
      const rawItem = item as CartLeadItem;
      const title = clean(rawItem.title);
      const price = Number(rawItem.price) || 0;
      const quantity = Number(rawItem.quantity) || 0;
      const minOrder = Number(rawItem.minOrder) || 1;
      const total = Number(rawItem.total) || price * quantity;

      return {
        title,
        sku: clean(rawItem.sku),
        price,
        quantity,
        total,
        minOrder
      };
    })
    .filter((item) => item.title && item.quantity > 0);
}

function cartItemsToText(items: Required<CartLeadItem>[]) {
  return items
    .map((item, index) =>
      [
        `${index + 1}. ${item.title}`,
        item.sku ? `арт. ${item.sku}` : "",
        `${formatCurrency(item.price)} x ${item.quantity} = ${formatCurrency(item.total)}`
      ]
        .filter(Boolean)
        .join(", ")
    )
    .join("\n");
}

function validateCartMinimums(items: Required<CartLeadItem>[]) {
  const invalidItem = items.find((item) => item.quantity < item.minOrder);
  return invalidItem
    ? `Минимальный заказ для товара "${invalidItem.title}" — ${invalidItem.minOrder}.`
    : "";
}

function validateLead(payload: LeadPayload): { lead?: SavedLead; error?: string } {
  if (clean(payload.website)) {
    return { error: "Заявка отклонена." };
  }

  const source: SavedLead["source"] = payload.source === "cart" ? "cart" : "site";
  const cartItems = normalizeCartItems(payload.cartItems);
  const isCartLead = source === "cart" || cartItems.length > 0;
  const name = clean(payload.name);
  const phone = clean(payload.phone);
  const items = isCartLead ? cartItemsToText(cartItems) : clean(payload.items);
  const quantity = isCartLead
    ? String(cartItems.reduce((sum, item) => sum + item.quantity, 0))
    : clean(payload.quantity);
  const deliveryMethod = clean(payload.deliveryMethod);
  const rawShippingService = clean(payload.shippingService);
  const customShippingService = clean(payload.customShippingService);
  const shippingService = rawShippingService === "Другая" ? customShippingService : rawShippingService;
  const address = clean(payload.address);
  const comment = clean(payload.comment);
  const cartTotal = Number(payload.cartTotal) || cartItems.reduce((sum, item) => sum + item.total, 0);

  if (!name) return { error: "Введите имя." };
  if (!phone || !phoneIsValid(phone)) return { error: "Введите корректный телефон." };

  if (isCartLead) {
    if (!cartItems.length) return { error: "Корзина пуста." };
    const minimumError = validateCartMinimums(cartItems);
    if (minimumError) return { error: minimumError };
  } else {
    if (!items) return { error: "Введите товары или артикулы." };
    if (!quantity) return { error: "Введите количество." };
    if (!["Самовывоз", "Доставка по городу", "Транспортная компания"].includes(deliveryMethod)) {
      return { error: "Выберите способ получения." };
    }
    if (deliveryMethod === "Транспортная компания" && !shippingService) {
      return { error: "Выберите службу доставки." };
    }
    if (deliveryMethod !== "Самовывоз" && !address) {
      return { error: "Введите адрес, город или ПВЗ." };
    }
  }

  return {
    lead: {
      id: crypto.randomUUID(),
      source,
      createdAt: new Date().toISOString(),
      name,
      phone,
      items,
      quantity,
      deliveryMethod: isCartLead ? "Не выбран" : deliveryMethod,
      shippingService:
        !isCartLead && deliveryMethod === "Транспортная компания" ? shippingService : "",
      address: !isCartLead && deliveryMethod !== "Самовывоз" ? address : "",
      comment,
      cartItems,
      cartTotal
    }
  };
}

function formatLeadMessage(lead: SavedLead): string {
  const date = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow"
  }).format(new Date(lead.createdAt));
  const isCartLead = lead.source === "cart";

  return [
    isCartLead ? "НОВАЯ ЗАЯВКА ИЗ КОРЗИНЫ" : "НОВАЯ ЗАЯВКА С САЙТА",
    "",
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    "",
    isCartLead ? "Товары в заказе:" : `Товары: ${lead.items}`,
    isCartLead ? lead.items : `Количество: ${lead.quantity}`,
    isCartLead ? `Общая сумма: ${formatCurrency(lead.cartTotal)}` : "",
    "",
    isCartLead ? "" : `Получение: ${lead.deliveryMethod}`,
    isCartLead ? "" : `Служба доставки: ${lead.shippingService || "не требуется"}`,
    isCartLead ? "" : `Адрес: ${lead.address || "не требуется"}`,
    "",
    `Комментарий: ${lead.comment || "нет"}`,
    "",
    `Дата: ${date}`,
    `ID: ${lead.id}`
  ]
    .filter((line, index, lines) => line || lines[index - 1])
    .join("\n");
}

async function saveLeadToFile(lead: SavedLead): Promise<string> {
  let lastError: unknown;

  for (const directory of LEAD_STORAGE_DIRS) {
    try {
      await mkdir(directory, { recursive: true });
      await appendFile(path.join(directory, "leads.jsonl"), `${JSON.stringify(lead)}\n`, "utf8");
      return directory;
    } catch (error) {
      lastError = error;
      console.error(`File lead save failed in ${directory}`, error);
    }
  }

  throw lastError || new Error("No lead storage directory available");
}

async function saveLead(lead: SavedLead): Promise<"sanity" | "file" | "tmp-file"> {
  if (sanityWriteClient) {
    try {
      await sanityWriteClient.create({
        _type: "lead",
        source: lead.source,
        createdAt: lead.createdAt,
        name: lead.name,
        phone: lead.phone,
        items: lead.items,
        quantity: lead.quantity,
        deliveryMethod: lead.deliveryMethod,
        shippingService: lead.shippingService,
        address: lead.address,
        comment: lead.comment,
        cartItems: lead.cartItems,
        cartTotal: lead.cartTotal
      });
      return "sanity";
    } catch (sanityError) {
      console.error("Sanity lead save failed, falling back to file", sanityError);
    }
  }

  const directory = await saveLeadToFile(lead);
  return directory.includes(`${path.sep}tmp`) || directory.startsWith("/tmp") ? "tmp-file" : "file";
}

async function sendTelegram(text: string): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !LEADS_CHAT_ID) {
    console.warn("Telegram lead delivery skipped: missing token or chat id");
    return false;
  }

  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: LEADS_CHAT_ID,
      text
    })
  });

  if (!response.ok) {
    throw new Error(`Telegram error: ${response.status} ${await response.text()}`);
  }

  return true;
}

async function sendEmail(lead: SavedLead, text: string): Promise<boolean> {
  if (!RESEND_API_KEY || !LEAD_EMAIL_TO) {
    console.warn("Email lead delivery skipped: missing RESEND_API_KEY or LEAD_EMAIL_TO");
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: LEAD_EMAIL_FROM,
      to: LEAD_EMAIL_TO,
      subject: `Новая заявка Brellas: ${lead.name}`,
      text
    })
  });

  if (!response.ok) {
    throw new Error(`Email error: ${response.status} ${await response.text()}`);
  }

  return true;
}

export async function POST(request: Request) {
  let payload: LeadPayload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный запрос." }, { status: 400 });
  }

  const { lead, error } = validateLead(payload);
  if (!lead) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  let storage: "sanity" | "file" | "tmp-file";

  try {
    storage = await saveLead(lead);
  } catch (saveError) {
    console.error("Lead save failed", saveError);
    return NextResponse.json({ ok: false, error: "Не удалось сохранить заявку." }, { status: 500 });
  }

  const text = formatLeadMessage(lead);
  const delivery = { telegram: false, email: false };

  try {
    delivery.telegram = await sendTelegram(text);
  } catch (telegramError) {
    console.error("Telegram delivery failed", telegramError);
  }

  try {
    delivery.email = await sendEmail(lead, text);
  } catch (emailError) {
    console.error("Email delivery failed", emailError);
  }

  return NextResponse.json({ ok: true, id: lead.id, storage, delivery });
}
