"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { getProductMainPhoto } from "@/lib/product-photos";
import { urlFor } from "@/lib/sanity.image";

type FavoritesDrawerProps = {
  isOpen: boolean;
  products: Product[];
  onClose: () => void;
};

const FAVORITES_KEY = "brellas:favorites";
const CART_KEY = "brellas:cart";
const STORE_EVENT = "brellas:store-updated";

function readFavorites() {
  try {
    const value = window.localStorage.getItem(FAVORITES_KEY);
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

function emitUpdate() {
  window.dispatchEvent(new Event(STORE_EVENT));
}

function parseMinOrder(value?: string) {
  const parsed = Number.parseInt(String(value || "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function productImage(product: Product) {
  const mainPhoto = getProductMainPhoto(product);

  return mainPhoto
    ? urlFor(mainPhoto).width(220).fit("max").url()
    : "/placeholder-product.jpg";
}

export function FavoritesDrawer({ isOpen, products, onClose }: FavoritesDrawerProps) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    function syncFavorites() {
      setFavoriteIds(readFavorites());
    }

    syncFavorites();
    window.addEventListener(STORE_EVENT, syncFavorites);
    window.addEventListener("storage", syncFavorites);
    return () => {
      window.removeEventListener(STORE_EVENT, syncFavorites);
      window.removeEventListener("storage", syncFavorites);
    };
  }, []);

  const productsById = useMemo(() => {
    return new Map(products.map((product) => [product._id, product]));
  }, [products]);

  const favoriteProducts = useMemo(() => {
    return favoriteIds
      .map((id) => productsById.get(id))
      .filter((product): product is Product => Boolean(product));
  }, [favoriteIds, productsById]);

  function removeFavorite(productId: string) {
    const next = readFavorites().filter((id) => id !== productId);
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    setFavoriteIds(next);
    emitUpdate();
  }

  function addToCart(product: Product) {
    const cart = readCart();
    cart[product._id] = cart[product._id] ? cart[product._id] + 1 : parseMinOrder(product.minOrder);
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
    emitUpdate();
  }

  if (!isMounted || !isOpen) {
    return null;
  }

  return createPortal(
    <div className={`drawerOverlay ${isOpen ? "drawerOverlayOpen" : ""}`} aria-hidden={!isOpen}>
      <button className="drawerBackdrop" type="button" onClick={onClose} aria-label="Закрыть избранное" />
      <aside className="drawerPanel" role="dialog" aria-modal="true" aria-label="Избранное">
        <div className="drawerHeader">
          <div>
            <span className="eyebrow">Избранное</span>
            <h2>Сохранённые товары</h2>
          </div>
          <button type="button" className="drawerClose" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>

        {favoriteProducts.length ? (
          <div className="drawerList">
            {favoriteProducts.map((product) => (
              <article className="drawerProduct" key={product._id}>
                <Link href={`/catalog/${product.slug}`} className="drawerProductImage" onClick={onClose}>
                  <Image src={productImage(product)} alt={product.title} width={96} height={96} />
                </Link>
                <div className="drawerProductInfo">
                  <Link href={`/catalog/${product.slug}`} onClick={onClose}>
                    {product.title}
                  </Link>
                  <span>{formatPrice(product.price)}</span>
                  <button type="button" className="cartMiniButton" onClick={() => addToCart(product)}>
                    В корзину
                  </button>
                </div>
                <button type="button" className="drawerRemove" onClick={() => removeFavorite(product._id)}>
                  Удалить
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="drawerEmpty">
            <h3>Вы ещё ничего не добавили</h3>
            <p>Нажимайте на сердечко в карточках товаров, чтобы сохранить их здесь.</p>
            <Link href="/catalog" className="primaryButton" onClick={onClose}>
              Перейти в каталог
            </Link>
          </div>
        )}
      </aside>
    </div>,
    document.body
  );
}
