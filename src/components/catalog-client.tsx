"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Category, Product } from "@/lib/types";

type CatalogClientProps = {
  products: Product[];
  categories: Category[];
  telegramBotUrl: string;
  initialCategorySlug?: string;
  categoryTitle?: string;
  categoryDescription?: string;
};

type SortValue = "manual" | "price-asc" | "price-desc" | "newest";

function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function CatalogClient({
  products,
  categories,
  telegramBotUrl,
  initialCategorySlug,
  categoryTitle,
  categoryDescription
}: CatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const searchTerm = searchParams.get("q") || "";
  const sort = (searchParams.get("sort") as SortValue | null) || "manual";
  const activeCategorySlug = initialCategorySlug || searchParams.get("category") || "all";

  const filteredProducts = useMemo(() => {
    const normalizedTerm = normalizeSearch(searchTerm);

    let result = products.filter((product) => {
      const matchesCategory =
        activeCategorySlug === "all" || product.category?.slug === activeCategorySlug;
      const matchesSearch =
        !normalizedTerm || normalizeSearch(product.title).includes(normalizedTerm);

      return matchesCategory && matchesSearch;
    });

    switch (sort) {
      case "price-asc":
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result = [...result].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      default:
        result = [...result].sort((a, b) => {
          if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
          }

          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }

    return result;
  }, [activeCategorySlug, products, searchTerm, sort]);

  const categoryCounts = useMemo(() => {
    return products.reduce<Record<string, number>>((acc, product) => {
      if (!product.category?.slug) {
        return acc;
      }

      acc[product.category.slug] = (acc[product.category.slug] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const hasActiveFilters = searchTerm || activeCategorySlug !== "all" || sort !== "manual";
  const activeCategoryTitle =
    activeCategorySlug === "all"
      ? ""
      : categories.find((category) => category.slug === activeCategorySlug)?.title;

  function updateQuery(next: { q?: string; sort?: SortValue }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.q !== undefined) {
      if (next.q) {
        params.set("q", next.q);
      } else {
        params.delete("q");
      }
    }

    if (next.sort !== undefined) {
      if (next.sort && next.sort !== "manual") {
        params.set("sort", next.sort);
      } else {
        params.delete("sort");
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function resetFilters() {
    router.replace("/catalog", { scroll: false });
  }

  return (
    <section className="section">
      <div className="catalogShell">
        <div className="catalogHeader">
          <span className="eyebrow">Ассортимент</span>
          <h1>{categoryTitle || "Каталог"}</h1>
          <p>
            {categoryDescription ||
              "Подборка товаров для магазинов, маркетплейсов и бизнеса с быстрым поиском и удобной сортировкой."}
          </p>
        </div>

        <div className="catalogControls">
          <div className="catalogSearch">
            <label htmlFor="catalog-search" className="catalogLabel">
              Поиск по товарам
            </label>
            <input
              id="catalog-search"
              className="catalogInput"
              type="search"
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(event) => updateQuery({ q: event.target.value })}
            />
          </div>

          <div className="catalogSort">
            <label htmlFor="catalog-sort" className="catalogLabel">
              Сортировка
            </label>
            <select
              id="catalog-sort"
              className="catalogSelect"
              value={sort}
              onChange={(event) => updateQuery({ sort: event.target.value as SortValue })}
            >
              <option value="manual">По порядку</option>
              <option value="newest">Сначала новые</option>
              <option value="price-asc">Цена по возрастанию</option>
              <option value="price-desc">Цена по убыванию</option>
            </select>
          </div>
        </div>

        <div className="categoryScroller" aria-label="Категории каталога">
          <Link
            href="/catalog"
            className={`categoryChip ${activeCategorySlug === "all" ? "categoryChipActive" : ""}`}
            scroll={false}
          >
            Все товары <span>{products.length}</span>
          </Link>
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/catalog/category/${category.slug}`}
              className={`categoryChip ${
                activeCategorySlug === category.slug ? "categoryChipActive" : ""
              }`}
              scroll={false}
            >
              {category.title} <span>{categoryCounts[category.slug] || 0}</span>
            </Link>
          ))}
        </div>

        {hasActiveFilters ? (
          <div className="activeFilters">
            <span>Подборка:</span>
            {activeCategoryTitle ? <span className="filterChip">{activeCategoryTitle}</span> : null}
            {searchTerm ? <span className="filterChip">Поиск: {searchTerm}</span> : null}
            {sort !== "manual" ? <span className="filterChip">Сортировка включена</span> : null}
            <button type="button" className="resetFiltersButton" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          </div>
        ) : null}

        {filteredProducts.length ? (
          <div className="productGrid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                telegramBotUrl={telegramBotUrl}
              />
            ))}
          </div>
        ) : (
          <div className="emptyState">
            <h2>По вашему запросу товаров пока нет</h2>
            <p>Попробуйте изменить поисковую фразу или посмотреть все товары.</p>
            <button type="button" className="primaryButton" onClick={resetFilters}>
              Сбросить фильтры
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
