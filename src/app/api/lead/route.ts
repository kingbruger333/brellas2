import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "@/lib/sanity.env";

export const runtime = "nodejs";

type LeadPayload = {
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
};

type SavedLead = {
  id: string;
  source: "site";
  createdAt: string;
  name: string;
  phone: string;
  items: string;
  quantity: string;
  deliveryMethod: string;
  shippingService: string;
  address: string;
  comment: string;
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

function validateLead(payload: LeadPayload): { lead?: SavedLead; error?: string } {
  if (clean(payload.website)) {
    return { error: "Заявка отклонена." };
  }

  const name = clean(payload.name);
  const phone = clean(payload.phone);
  const items = clean(payload.items);
  const quantity = clean(payload.quantity);
  const deliveryMethod = clean(payload.deliveryMethod);
  const rawShippingService = clean(payload.shippingService);
  const customShippingService = clean(payload.customShippingService);
  const shippingService = rawShippingService === "Другая" ? customShippingService : rawShippingService;
  const address = clean(payload.address);
  const comment = clean(payload.comment);

  if (!name) return { error: "Введите имя." };
  if (!phone || !phoneIsValid(phone)) return { error: "Введите корректный телефон." };
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

  return {
    lead: {
      id: crypto.randomUUID(),
      source: "site",
      createdAt: new Date().toISOString(),
      name,
      phone,
      items,
      quantity,
      deliveryMethod,
      shippingService: deliveryMethod === "Транспортная компания" ? shippingService : "",
      address: deliveryMethod === "Самовывоз" ? "" : address,
      comment
    }
  };
}

function formatLeadMessage(lead: SavedLead): string {
  const date = new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow"
  }).format(new Date(lead.createdAt));

  return [
    "НОВАЯ ЗАЯВКА (с сайта)",
    "",
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    "",
    `Товары: ${lead.items}`,
    `Количество: ${lead.quantity}`,
    "",
    `Получение: ${lead.deliveryMethod}`,
    `Служба доставки: ${lead.shippingService || "не требуется"}`,
    `Адрес: ${lead.address || "не требуется"}`,
    "",
    `Комментарий: ${lead.comment || "нет"}`,
    "",
    `Дата: ${date}`,
    `ID: ${lead.id}`
  ].join("\n");
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
        comment: lead.comment
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
