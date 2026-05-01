"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/product-card";
import { Category, Product, Subcategory } from "@/lib/types";

type CatalogClientProps = {
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  telegramBotUrl: string;
  initialCategorySlug?: string;
  categoryTitle?: string;
  categoryDescription?: string;
};

type SortValue = "manual" | "price-asc" | "price-desc" | "newest";

type SearchMatch = {
  product: Product;
  rank: number;
  score: number;
};

const QUERY_STOP_WORDS = new Set(["арт", "артикул", "sku", "код", "товар", "товары"]);

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "c",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ы: "y",
  э: "e",
  ю: "yu",
  я: "ya",
  ь: "",
  ъ: ""
};

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^a-zа-я0-9]+/gi, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function transliterate(value: string) {
  return normalizeText(value)
    .split("")
    .map((char) => CYRILLIC_TO_LATIN[char] ?? char)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function levenshteinDistance(left: string, right: string) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = Array.from({ length: right.length + 1 }, () => 0);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;

    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
    }

    for (let index = 0; index <= right.length; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[right.length];
}

function similarity(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  if (!maxLength) return 1;
  return 1 - levenshteinDistance(left, right) / maxLength;
}

function buildProductSearchText(product: Product) {
  return [
    product.title,
    product.category?.title,
    product.subcategory?.title,
    product.sku,
    product.shortDescription
  ]
    .filter(Boolean)
    .join(" ");
}

function getSearchMatch(product: Product, rawQuery: string): SearchMatch | null {
  const normalizedQuery = normalizeText(rawQuery);

  if (!normalizedQuery) {
    return { product, rank: 3, score: 0 };
  }

  const searchableText = buildProductSearchText(product);
  const normalizedText = normalizeText(searchableText);
  const transliteratedText = transliterate(searchableText);
  const compactText = `${normalizedText} ${transliteratedText}`.replace(/\s+/g, "");
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  const queryTokens = tokenize(normalizedQuery).filter((token) => !QUERY_STOP_WORDS.has(token));
  const transliteratedQueryTokens = queryTokens.map(transliterate);
  const textTokens = tokenize(`${normalizedText} ${transliteratedText}`);

  if (compactQuery && compactText.includes(compactQuery)) {
    return { product, rank: 0, score: compactQuery.length };
  }

  if (!queryTokens.length) {
    return normalizedText.includes(normalizedQuery)
      ? { product, rank: 0, score: normalizedQuery.length }
      : null;
  }

  const exactMatches = queryTokens.filter((token, index) => {
    const transliteratedToken = transliteratedQueryTokens[index];
    return textTokens.includes(token) || textTokens.includes(transliteratedToken);
  });

  if (exactMatches.length === queryTokens.length) {
    return { product, rank: 0, score: exactMatches.join("").length };
  }

  const fuzzyScores = queryTokens.map((token, index) => {
    const transliteratedToken = transliteratedQueryTokens[index];
    const bestTokenScore = Math.max(
      ...textTokens.map((textToken) =>
        Math.max(similarity(token, textToken), similarity(transliteratedToken, textToken))
      )
    );
    return bestTokenScore;
  });
  const fuzzyAverage = fuzzyScores.reduce((sum, score) => sum + score, 0) / fuzzyScores.length;
  const fuzzyThreshold = queryTokens.some((token) => token.length <= 4) ? 0.72 : 0.76;

  if (fuzzyAverage >= fuzzyThreshold && fuzzyScores.every((score) => score >= 0.58)) {
    return { product, rank: 1, score: fuzzyAverage };
  }

  const partialMatches = queryTokens.filter((token, index) => {
    const transliteratedToken = transliteratedQueryTokens[index];
    return textTokens.some(
      (textToken) =>
        textToken.includes(token) ||
        token.includes(textToken) ||
        textToken.includes(transliteratedToken) ||
        transliteratedToken.includes(textToken)
    );
  });

  if (partialMatches.length) {
    return { product, rank: 2, score: partialMatches.join("").length };
  }

  return null;
}

function sortProducts(products: Product[], sort: SortValue) {
  switch (sort) {
    case "price-asc":
      return [...products].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...products].sort((a, b) => b.price - a.price);
    case "newest":
      return [...products].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    default:
      return [...products].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
}

export function CatalogClient({
  products,
  categories,
  subcategories,
  telegramBotUrl,
  initialCategorySlug,
  categoryTitle,
  categoryDescription
}: CatalogClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [expandedCategorySlugs, setExpandedCategorySlugs] = useState<string[]>([]);

  const searchTerm = searchParams.get("q") || "";
  const sort = (searchParams.get("sort") as SortValue | null) || "manual";
  const activeCategorySlug = initialCategorySlug || searchParams.get("category") || "all";
  const requestedSubcategorySlug = searchParams.get("subcategory") || "all";
  const activeSubcategorySlug =
    requestedSubcategorySlug === "all" ||
    subcategories.some(
      (subcategory) =>
        subcategory.slug === requestedSubcategorySlug &&
        (activeCategorySlug === "all" || subcategory.parentCategory?.slug === activeCategorySlug)
    )
      ? requestedSubcategorySlug
      : "all";

  const filteredProducts = useMemo(() => {
    const categoryProducts = products.filter(
      (product) => activeCategorySlug === "all" || product.category?.slug === activeCategorySlug
    );
    const subcategoryProducts = categoryProducts.filter(
      (product) =>
        activeSubcategorySlug === "all" ||
        product.subcategory?.slug === activeSubcategorySlug ||
        !product.subcategory
    );

    if (!normalizeText(searchTerm)) {
      return sortProducts(subcategoryProducts, sort);
    }

    return subcategoryProducts
      .map((product) => getSearchMatch(product, searchTerm))
      .filter((match): match is SearchMatch => Boolean(match))
      .sort((left, right) => {
        if (left.rank !== right.rank) {
          return left.rank - right.rank;
        }

        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return left.product.sortOrder - right.product.sortOrder;
      })
      .map((match) => match.product);
  }, [activeCategorySlug, activeSubcategorySlug, products, searchTerm, sort]);

  const visibleSubcategories = useMemo(() => {
    return subcategories.filter(
      (subcategory) =>
        activeCategorySlug === "all" ||
        subcategory.parentCategory?.slug === activeCategorySlug
    );
  }, [activeCategorySlug, subcategories]);

  const categoryCounts = useMemo(() => {
    return products.reduce<Record<string, number>>((acc, product) => {
      if (!product.category?.slug) {
        return acc;
      }

      acc[product.category.slug] = (acc[product.category.slug] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const subcategoryCounts = useMemo(() => {
    return products.reduce<Record<string, number>>((acc, product) => {
      if (!product.subcategory?.slug) {
        return acc;
      }

      acc[product.subcategory.slug] = (acc[product.subcategory.slug] || 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const subcategoriesByCategory = useMemo(() => {
    return subcategories.reduce<Record<string, Subcategory[]>>((acc, subcategory) => {
      const parentSlug = subcategory.parentCategory?.slug;
      if (!parentSlug) {
        return acc;
      }

      acc[parentSlug] = [...(acc[parentSlug] || []), subcategory];
      return acc;
    }, {});
  }, [subcategories]);

  const hasActiveFilters =
    searchTerm || activeCategorySlug !== "all" || activeSubcategorySlug !== "all" || sort !== "manual";
  const activeCategoryTitle =
    activeCategorySlug === "all"
      ? ""
      : categories.find((category) => category.slug === activeCategorySlug)?.title;
  const activeSubcategoryTitle =
    activeSubcategorySlug === "all"
      ? ""
      : subcategories.find((subcategory) => subcategory.slug === activeSubcategorySlug)?.title;

  function updateQuery(next: { q?: string; sort?: SortValue; subcategory?: string }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.q !== undefined) {
      const preparedQuery = normalizeText(next.q);
      if (preparedQuery) {
        params.set("q", preparedQuery);
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

    if (next.subcategory !== undefined) {
      if (next.subcategory && next.subcategory !== "all") {
        params.set("subcategory", next.subcategory);
      } else {
        params.delete("subcategory");
      }
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function resetFilters() {
    router.replace("/catalog", { scroll: false });
    setIsCategoryDrawerOpen(false);
  }

  function toggleCategory(categorySlug: string) {
    setExpandedCategorySlugs((current) =>
      current.includes(categorySlug)
        ? current.filter((slug) => slug !== categorySlug)
        : [...current, categorySlug]
    );
  }

  function renderCategorySidebar() {
    return (
      <aside className="catalogSidebar" aria-label="Категории каталога">
        <div className="catalogSidebarHead">
          <span>Категории</span>
          <small>{categories.length} разделов</small>
        </div>
        <nav className="catalogSidebarNav">
          <Link
            href="/catalog"
            className={`catalogSidebarLink ${activeCategorySlug === "all" ? "catalogSidebarLinkActive" : ""}`}
            scroll={false}
            onClick={() => setIsCategoryDrawerOpen(false)}
          >
            <span className="catalogSidebarDot" aria-hidden="true" />
            <span className="catalogSidebarText">Все товары</span>
            <span className="catalogSidebarCount">{products.length}</span>
          </Link>

          {categories.map((category) => {
            const categorySubcategories = subcategoriesByCategory[category.slug] || [];
            const isCategoryActive = activeCategorySlug === category.slug;
            const isExpanded = isCategoryActive || expandedCategorySlugs.includes(category.slug);

            return (
              <div key={category._id} className="catalogSidebarGroup">
                <div className={`catalogSidebarCategory ${isCategoryActive ? "catalogSidebarCategoryActive" : ""}`}>
                  <Link
                    href={`/catalog/category/${category.slug}`}
                    className="catalogSidebarCategoryLink"
                    scroll={false}
                    onClick={() => setIsCategoryDrawerOpen(false)}
                  >
                    <span className="catalogSidebarDot" aria-hidden="true" />
                    <span className="catalogSidebarText">{category.title}</span>
                    <span className="catalogSidebarCount">{categoryCounts[category.slug] || 0}</span>
                  </Link>
                  {categorySubcategories.length ? (
                    <button
                      type="button"
                      className="catalogSidebarToggle"
                      aria-label={isExpanded ? "Свернуть подкатегории" : "Раскрыть подкатегории"}
                      aria-expanded={isExpanded}
                      onClick={() => toggleCategory(category.slug)}
                    >
                      <span>{isExpanded ? "−" : "+"}</span>
                    </button>
                  ) : null}
                </div>

                {categorySubcategories.length && isExpanded ? (
                  <div className="catalogSidebarSublist">
                    <Link
                      href={`/catalog/category/${category.slug}`}
                      className={`catalogSidebarSubLink ${
                        isCategoryActive && activeSubcategorySlug === "all" ? "catalogSidebarSubLinkActive" : ""
                      }`}
                      scroll={false}
                      onClick={() => setIsCategoryDrawerOpen(false)}
                    >
                      Все подкатегории
                    </Link>
                    {categorySubcategories.map((subcategory) => (
                      <Link
                        key={subcategory._id}
                        href={`/catalog/category/${category.slug}?subcategory=${subcategory.slug}`}
                        className={`catalogSidebarSubLink ${
                          activeSubcategorySlug === subcategory.slug ? "catalogSidebarSubLinkActive" : ""
                        }`}
                        scroll={false}
                        onClick={() => setIsCategoryDrawerOpen(false)}
                      >
                        <span>{subcategory.title}</span>
                        <span>{subcategoryCounts[subcategory.slug] || 0}</span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>
      </aside>
    );
  }

  return (
    <section className="section">
      <div className="catalogShell">
        <div className="catalogHeader">
          <span className="eyebrow">Каталог Brellas</span>
          <h1>{categoryTitle || "Все товары"}</h1>
          <p>
            {categoryDescription ||
              "Выбирайте товары, сравнивайте цены и отправляйте заявку удобным способом."}
          </p>
        </div>

        <button
          type="button"
          className="catalogMobileCategoriesButton"
          onClick={() => setIsCategoryDrawerOpen(true)}
        >
          Категории
        </button>

        <div className="catalogBody">
          <div className="catalogSidebarDesktop">{renderCategorySidebar()}</div>

          {isCategoryDrawerOpen ? (
            <div className="catalogSidebarDrawer" role="dialog" aria-modal="true" aria-label="Категории">
              <button
                type="button"
                className="catalogSidebarBackdrop"
                aria-label="Закрыть категории"
                onClick={() => setIsCategoryDrawerOpen(false)}
              />
              <div className="catalogSidebarDrawerPanel">
                <div className="catalogSidebarDrawerTop">
                  <strong>Категории</strong>
                  <button
                    type="button"
                    className="catalogSidebarClose"
                    aria-label="Закрыть категории"
                    onClick={() => setIsCategoryDrawerOpen(false)}
                  >
                    ×
                  </button>
                </div>
                {renderCategorySidebar()}
              </div>
            </div>
          ) : null}

          <div className="catalogContent">
            <div className="catalogControls">
              <div className="catalogSearch">
                <label htmlFor="catalog-search" className="catalogLabel">
                  Поиск по товарам
                </label>
                <input
                  id="catalog-search"
                  className="catalogInput"
                  type="search"
                  placeholder="Название, категория, описание или артикул"
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
                  <option value="newest">Сначала недавно добавленные</option>
                  <option value="price-asc">Цена по возрастанию</option>
                  <option value="price-desc">Цена по убыванию</option>
                </select>
              </div>

              <div className="catalogSort">
                <label htmlFor="catalog-subcategory" className="catalogLabel">
                  Подкатегория
                </label>
                <select
                  id="catalog-subcategory"
                  className="catalogSelect"
                  value={activeSubcategorySlug}
                  onChange={(event) => updateQuery({ subcategory: event.target.value })}
                >
                  <option value="all">Все подкатегории</option>
                  {visibleSubcategories.map((subcategory) => (
                    <option key={subcategory._id} value={subcategory.slug}>
                      {subcategory.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {hasActiveFilters ? (
              <div className="activeFilters">
                <span>Активная подборка:</span>
                {activeCategoryTitle ? <span className="filterChip">{activeCategoryTitle}</span> : null}
                {activeSubcategoryTitle ? <span className="filterChip">{activeSubcategoryTitle}</span> : null}
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
                <h2>Ничего не найдено. Попробуйте изменить запрос.</h2>
                <button type="button" className="primaryButton" onClick={resetFilters}>
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
