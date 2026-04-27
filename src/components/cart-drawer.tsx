"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { urlFor } from "@/lib/sanity.image";

type CartDrawerProps = {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
};

type CartOrderItem = {
  title: string;
  sku?: string;
  price: number;
  quantity: number;
  total: number;
  minOrder: number;
};

const CART_KEY = "brellas:cart";
const STORE_EVENT = "brellas:store-updated";

function parseMinOrder(value?: string) {
  const parsed = Number.parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function readCart() {
  try {
    const value = window.localStorage.getItem(CART_KEY);
    return value ? (JSON.parse(value) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveCart(cart: Record<string, number>) {
  window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event(STORE_EVENT));
}

function productImage(product: Product) {
  return product.image?.asset?._ref
    ? urlFor(product.image).width(220).height(220).fit("crop").url()
    : "/placeholder-product.jpg";
}

export function CartDrawer({ isOpen, products, onClose }: CartDrawerProps) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [isMounted, setIsMounted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setIsMounted(true);

    function syncCart() {
      setCart(readCart());
    }

    syncCart();
    window.addEventListener(STORE_EVENT, syncCart);
    window.addEventListener("storage", syncCart);
    return () => {
      window.removeEventListener(STORE_EVENT, syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const productsById = useMemo(() => {
    return new Map(products.map((product) => [product._id, product]));
  }, [products]);

  const items = useMemo(() => {
    return Object.entries(cart)
      .map(([id, quantity]) => {
        const product = productsById.get(id);
        return product ? { product, quantity } : null;
      })
      .filter((item): item is { product: Product; quantity: number } => Boolean(item));
  }, [cart, productsById]);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [items]
  );

  function changeQuantity(product: Product, delta: number) {
    const next = readCart();
    const minimum = parseMinOrder(product.minOrder);
    const current = next[product._id] || minimum;
    const value = Math.max(minimum, current + delta);

    next[product._id] = value;
    saveCart(next);
    setCart(next);
  }

  function removeItem(productId: string) {
    const next = readCart();
    delete next[productId];
    saveCart(next);
    setCart(next);
  }

  function clearCart() {
    saveCart({});
    setCart({});
    setStatus("idle");
    setMessage("");
  }

  function buildOrderItems(): CartOrderItem[] {
    return items.map(({ product, quantity }) => ({
      title: product.title,
      sku: product.sku,
      price: product.price,
      quantity,
      total: product.price * quantity,
      minOrder: parseMinOrder(product.minOrder)
    }));
  }

  function validateMinimums() {
    const invalidItem = items.find(({ product, quantity }) => quantity < parseMinOrder(product.minOrder));
    if (!invalidItem) return "";

    return `Минимальный заказ для товара "${invalidItem.product.title}" — ${parseMinOrder(
      invalidItem.product.minOrder
    )}.`;
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setMessage("");

    if (!items.length) {
      setStatus("error");
      setMessage("Корзина пуста.");
      return;
    }

    const minimumError = validateMinimums();
    if (minimumError) {
      setStatus("error");
      setMessage(minimumError);
      return;
    }

    setStatus("loading");

    const orderItems = buildOrderItems();
    const response = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "cart",
        name,
        phone,
        comment,
        cartItems: orderItems,
        cartTotal: total,
        items: orderItems
          .map((item) => `${item.title}${item.sku ? `, арт. ${item.sku}` : ""} — ${item.quantity} шт.`)
          .join("\n"),
        quantity: String(orderItems.reduce((sum, item) => sum + item.quantity, 0))
      })
    });

    const result = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(result?.error || "Не удалось отправить заявку. Попробуйте ещё раз.");
      return;
    }

    setStatus("success");
    setMessage("Заявка отправлена");
    setName("");
    setPhone("");
    setComment("");
    saveCart({});
    setCart({});
    window.setTimeout(onClose, 900);
  }

  if (!isMounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div className={`drawerOverlay ${isOpen ? "drawerOverlayOpen" : ""}`} aria-hidden={!isOpen}>
      <button className="drawerBackdrop" type="button" onClick={onClose} aria-label="Закрыть корзину" />
      <aside className="drawerPanel" role="dialog" aria-modal="true" aria-label="Корзина">
        <div className="drawerHeader">
          <div>
            <span className="eyebrow">Корзина</span>
            <h2>Ваш заказ</h2>
          </div>
          <button type="button" className="drawerClose" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        {items.length ? (
          <>
            <div className="drawerList">
              {items.map(({ product, quantity }) => {
                const minimum = parseMinOrder(product.minOrder);

                return (
                  <article className="drawerProduct" key={product._id}>
                    <Link href={`/catalog/${product.slug}`} className="drawerProductImage" onClick={onClose}>
                      <Image src={productImage(product)} alt={product.title} width={96} height={96} />
                    </Link>
                    <div className="drawerProductInfo">
                      <Link href={`/catalog/${product.slug}`} onClick={onClose}>
                        {product.title}
                      </Link>
                      <span>{formatPrice(product.price)}</span>
                      <small>Минимум: {minimum}</small>
                      <div className="drawerQty">
                        <button
                          type="button"
                          onClick={() => changeQuantity(product, -1)}
                          disabled={quantity <= minimum}
                          aria-label="Уменьшить"
                        >
                          −
                        </button>
                        <b>{quantity}</b>
                        <button type="button" onClick={() => changeQuantity(product, 1)} aria-label="Увеличить">
                          +
                        </button>
                      </div>
                    </div>
                    <button type="button" className="drawerRemove" onClick={() => removeItem(product._id)}>
                      Удалить
                    </button>
                  </article>
                );
              })}
            </div>

            <form className="drawerCheckoutForm" onSubmit={submitOrder}>
              <label>
                <span>Имя *</span>
                <input value={name} onChange={(event) => setName(event.target.value)} required />
              </label>
              <label>
                <span>Телефон *</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  inputMode="tel"
                  minLength={7}
                  placeholder="+7..."
                />
              </label>
              <label>
                <span>Комментарий</span>
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} />
              </label>

              <div className="drawerSummary">
                <div>
                  <span>Итого</span>
                  <strong>{formatPrice(total)}</strong>
                </div>
                {message ? <p className={`drawerMessage drawerMessage${status}`}>{message}</p> : null}
                <button type="submit" className="primaryButton" disabled={status === "loading"}>
                  {status === "loading" ? "Отправляем..." : "Оформить заказ"}
                </button>
                <button type="button" className="secondaryButton" onClick={clearCart}>
                  Очистить корзину
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="drawerEmpty">
            <h3>Корзина пуста</h3>
            <p>Добавьте товары из каталога, чтобы быстро отправить заявку.</p>
            {message ? <p className={`drawerMessage drawerMessage${status}`}>{message}</p> : null}
            <Link href="/catalog" className="primaryButton" onClick={onClose}>
              Смотреть каталог
            </Link>
          </div>
        )}
      </aside>
    </div>,
    document.body
  );
}
