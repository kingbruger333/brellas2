"use client";

import { useEffect, useState } from "react";

type ProductActionsProps = {
  productId: string;
  minOrder?: string;
};

const FAVORITES_KEY = "brellas:favorites";
const CART_KEY = "brellas:cart";
const STORE_EVENT = "brellas:store-updated";

function parseMinOrder(value?: string) {
  const parsed = Number.parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function readArray(key: string) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

function readCart() {
  try {
    const value = window.localStorage.getItem(CART_KEY);
    return value ? (JSON.parse(value) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function emitStoreUpdate() {
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function ProductActions({ productId, minOrder }: ProductActionsProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [notice, setNotice] = useState("");
  const minimum = parseMinOrder(minOrder);

  useEffect(() => {
    function syncActions() {
      setIsFavorite(readArray(FAVORITES_KEY).includes(productId));
      setInCart(Boolean(readCart()[productId]));
    }

    syncActions();
    window.addEventListener(STORE_EVENT, syncActions);
    window.addEventListener("storage", syncActions);
    return () => {
      window.removeEventListener(STORE_EVENT, syncActions);
      window.removeEventListener("storage", syncActions);
    };
  }, [productId]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(""), 1600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function toggleFavorite() {
    const favorites = readArray(FAVORITES_KEY);
    const next = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];

    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    setIsFavorite(next.includes(productId));
    setNotice(next.includes(productId) ? "Добавлено в избранное" : "Убрано из избранного");
    emitStoreUpdate();
  }

  function addToCart() {
    const cart = readCart();
    cart[productId] = cart[productId] ? cart[productId] + 1 : minimum;
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    setInCart(true);
    setNotice("Товар добавлен в корзину");
    emitStoreUpdate();
  }

  return (
    <div className="quickProductActions">
      <button
        type="button"
        className={`favoriteMiniButton ${isFavorite ? "favoriteMiniButtonActive" : ""}`}
        onClick={toggleFavorite}
        aria-label={isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
      >
        ♥
      </button>
      <button type="button" className="cartMiniButton" onClick={addToCart}>
        {inCart ? "В корзине" : "В корзину"}
      </button>
      <span className={`productActionNotice ${notice ? "productActionNoticeVisible" : ""}`} aria-live="polite">
        {notice}
      </span>
    </div>
  );
}
