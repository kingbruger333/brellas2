"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Category, Product } from "@/lib/types";
import { CartDrawer } from "./cart-drawer";
import { Container } from "./container";
import { FavoritesDrawer } from "./favorites-drawer";

type SiteHeaderProps = {
  siteTitle: string;
  categories?: Category[];
  products?: Product[];
};

const FAVORITES_KEY = "brellas:favorites";
const CART_KEY = "brellas:cart";
const STORE_EVENT = "brellas:store-updated";

function normalizeHeaderSearch(value: string) {
  return value
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function readFavoriteCount() {
  try {
    const value = window.localStorage.getItem(FAVORITES_KEY);
    return value ? (JSON.parse(value) as string[]).length : 0;
  } catch {
    return 0;
  }
}

function readCartCount() {
  try {
    const value = window.localStorage.getItem(CART_KEY);
    const cart = value ? (JSON.parse(value) as Record<string, number>) : {};
    return Object.values(cart).reduce((sum, amount) => sum + amount, 0);
  } catch {
    return 0;
  }
}

export function SiteHeader({ siteTitle, categories = [], products = [] }: SiteHeaderProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const visibleCategories = useMemo(() => categories.slice(0, 8), [categories]);

  useEffect(() => {
    function syncCounts() {
      setFavoriteCount(readFavoriteCount());
      setCartCount(readCartCount());
    }

    syncCounts();
    window.addEventListener(STORE_EVENT, syncCounts);
    window.addEventListener("storage", syncCounts);
    return () => {
      window.removeEventListener(STORE_EVENT, syncCounts);
      window.removeEventListener("storage", syncCounts);
    };
  }, []);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const preparedQuery = normalizeHeaderSearch(query);
    router.push(preparedQuery ? `/catalog?q=${encodeURIComponent(preparedQuery)}` : "/catalog");
    setIsCatalogOpen(false);
  }

  return (
    <header className="siteHeader">
      <div className="topUtilityBar">
        <Container className="topUtilityInner">
          <span>Оптовые покупки для магазинов, маркетплейсов и бизнеса</span>
          <nav aria-label="Сервисное меню">
            <a href="/#lead-form">Помощь</a>
            <a href="/#wholesale">Условия</a>
            <Link href="/catalog">Каталог</Link>
            <a href="/#marketplaces">Маркетплейсы</a>
          </nav>
        </Container>
      </div>

      <Container className="siteHeaderInner">
        <Link href="/" className="brand" aria-label="Brellas на главную">
          <span className="brandMark">B</span>
          <span>{siteTitle || "Brellas"}</span>
        </Link>

        <button
          type="button"
          className="catalogButton"
          onClick={() => setIsCatalogOpen((current) => !current)}
          aria-expanded={isCatalogOpen}
        >
          <span>☰</span>
          Каталог
        </button>

        <form className="headerSearch" onSubmit={handleSearchSubmit}>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Поиск по товарам, категориям и артикулам"
            aria-label="Поиск по товарам"
          />
          <button type="submit">Найти</button>
        </form>

        <nav className="headerActions" aria-label="Быстрые действия">
          <a href="/#lead-form" className="headerAction">
            Связь
          </a>
          <button
            type="button"
            className="headerAction headerActionCounter"
            onClick={() => setIsFavoritesOpen(true)}
          >
            Избранное
            {favoriteCount ? <b>{favoriteCount}</b> : null}
          </button>
          <button
            type="button"
            className="headerAction headerActionCounter"
            onClick={() => setIsCartOpen(true)}
          >
            Корзина
            {cartCount ? <b>{cartCount}</b> : null}
          </button>
        </nav>
      </Container>

      <Container className="headerMarketMenu">
        <Link href="/catalog">Все товары</Link>
        <a href="/#popular">Популярное</a>
        <a href="/#marketplaces">Где купить</a>
        <a href="/#wholesale">Оптовые закупки</a>
        <a href="/#lead-form">Заказать подбор</a>
      </Container>

      {isCatalogOpen ? (
        <div className="catalogDropdown">
          <Container className="catalogDropdownInner">
            <div className="catalogDropdownPromo">
              <strong>Каталог Brellas</strong>
              <span>Выберите раздел и быстро найдите товары для закупки.</span>
            </div>
            <div className="catalogDropdownGrid">
              <Link href="/catalog" onClick={() => setIsCatalogOpen(false)}>
                <span>Все товары</span>
                <small>Полный каталог Brellas</small>
              </Link>
              {visibleCategories.map((category) => (
                <Link
                  key={category._id}
                  href={`/catalog/category/${category.slug}`}
                  onClick={() => setIsCatalogOpen(false)}
                >
                  <span>{category.title}</span>
                  <small>{category.description || "Товары раздела"}</small>
                </Link>
              ))}
            </div>
          </Container>
        </div>
      ) : null}

      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        products={products}
        onClose={() => setIsFavoritesOpen(false)}
      />
      <CartDrawer isOpen={isCartOpen} products={products} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}
