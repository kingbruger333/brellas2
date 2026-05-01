import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/container";
import { CatalogClient } from "@/components/catalog-client";
import { CategoryCardGrid } from "@/components/category-card-grid";
import { getCategories, getProducts, getSiteSettings, getSubcategories } from "@/lib/content";

export const revalidate = 60;

export default async function CatalogPage() {
  const [settings, products, categories, subcategories] = await Promise.all([
    getSiteSettings(),
    getProducts(),
    getCategories(),
    getSubcategories()
  ]);

  return (
    <>
      <SiteHeader siteTitle={settings?.siteTitle || "Brellas"} categories={categories} products={products} />
      <main>
        <Container>
          <section className="categoryShowcase catalogCategoryShowcase" aria-labelledby="catalog-categories-title">
            <div className="sectionTitle">
              <span className="eyebrow">Категории</span>
              <h1 id="catalog-categories-title">Каталог по категориям</h1>
              <p>Выберите раздел каталога Brellas, чтобы перейти к нужной подборке товаров.</p>
            </div>
            <CategoryCardGrid categories={categories} products={products} />
          </section>
          <Suspense>
            <CatalogClient
              products={products}
              categories={categories}
              subcategories={subcategories}
              telegramBotUrl={settings?.telegramBotUrl || "#"}
            />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
