"use client";

import { FormEvent, useState } from "react";

type LeadFormProps = {
  telegramUrl: string;
};

const deliveryMethods = ["Самовывоз", "Доставка по городу", "Транспортная компания"] as const;
const shippingServices = ["СДЭК", "Почта России", "5Post", "Другая"] as const;

const initialForm = {
  name: "",
  phone: "",
  items: "",
  quantity: "",
  deliveryMethod: "Самовывоз",
  shippingService: "СДЭК",
  customShippingService: "",
  address: "",
  comment: "",
  website: ""
};

export function LeadForm({ telegramUrl }: LeadFormProps) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const isTransport = form.deliveryMethod === "Транспортная компания";
  const needsAddress = form.deliveryMethod !== "Самовывоз";
  const needsCustomShipping = isTransport && form.shippingService === "Другая";

  function updateField(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(result?.error || "Не удалось отправить заявку. Попробуйте ещё раз.");
      return;
    }

    setStatus("success");
    setMessage("Заявка отправлена, мы свяжемся с вами");
    setForm(initialForm);
  }

  return (
    <div className="leadFormShell" id="lead-form">
      <div className="leadFormIntro">
        <span className="eyebrow">Заявка</span>
        <h2>Оставить заявку на оптовую поставку</h2>
        <p>Заполните форму, и менеджер уточнит наличие, объём и условия получения.</p>
        <div className="contactActions">
          <a href="#lead-form" className="primaryButton">Оставить заявку</a>
          {telegramUrl !== "#" ? <a href={telegramUrl} className="secondaryButton" target="_blank" rel="noreferrer">Telegram</a> : null}
          <a href="tel:+79772554989" className="secondaryButton">Позвонить</a>
        </div>
      </div>

      <form className="leadForm" onSubmit={handleSubmit}>
        <input
          type="text"
          name="website"
          value={form.website}
          onChange={(event) => updateField("website", event.target.value)}
          className="honeypotField"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <label className="leadField">
          <span>Имя *</span>
          <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
        </label>

        <label className="leadField">
          <span>Телефон *</span>
          <input
            value={form.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            required
            inputMode="tel"
            minLength={7}
            placeholder="+7..."
          />
        </label>

        <label className="leadField leadFieldWide">
          <span>Товары / артикулы *</span>
          <textarea
            value={form.items}
            onChange={(event) => updateField("items", event.target.value)}
            required
            rows={3}
            placeholder="Например: A123, B52, C991"
          />
        </label>

        <label className="leadField">
          <span>Количество *</span>
          <input value={form.quantity} onChange={(event) => updateField("quantity", event.target.value)} required />
        </label>

        <label className="leadField">
          <span>Способ получения *</span>
          <select value={form.deliveryMethod} onChange={(event) => updateField("deliveryMethod", event.target.value)}>
            {deliveryMethods.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </label>

        {isTransport ? (
          <>
            <label className="leadField">
              <span>Служба доставки *</span>
              <select value={form.shippingService} onChange={(event) => updateField("shippingService", event.target.value)}>
                {shippingServices.map((service) => (
                  <option key={service} value={service}>{service}</option>
                ))}
              </select>
            </label>

            {needsCustomShipping ? (
              <label className="leadField">
                <span>Название ТК *</span>
                <input
                  value={form.customShippingService}
                  onChange={(event) => updateField("customShippingService", event.target.value)}
                  required
                />
              </label>
            ) : null}
          </>
        ) : null}

        {needsAddress ? (
          <label className="leadField leadFieldWide">
            <span>Адрес / Город / ПВЗ *</span>
            <input value={form.address} onChange={(event) => updateField("address", event.target.value)} required />
          </label>
        ) : null}

        <label className="leadField leadFieldWide">
          <span>Комментарий</span>
          <textarea value={form.comment} onChange={(event) => updateField("comment", event.target.value)} rows={3} />
        </label>

        <div className="leadFormFooter">
          <button type="submit" className="primaryButton" disabled={status === "loading"}>
            {status === "loading" ? "Отправляем..." : "Отправить заявку"}
          </button>
          {message ? <p className={`leadFormMessage leadFormMessage${status}`}>{message}</p> : null}
          {status === "success" && telegramUrl !== "#" ? (
            <a href={telegramUrl} className="secondaryButton" target="_blank" rel="noreferrer">Написать в Telegram</a>
          ) : null}
        </div>
      </form>
    </div>
  );
}
