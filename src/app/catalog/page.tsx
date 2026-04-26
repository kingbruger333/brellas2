import { Suspense } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/container";
import { CatalogClient } from "@/components/catalog-client";
import { getCategories, getProducts, getSiteSettings } from "@/lib/content";

export const revalidate = 60;

export default async function CatalogPage() {
  const [settings, products, categories] = await Promise.all([
    getSiteSettings(),
    getProducts(),
    getCategories()
  ]);

  return (
    <>
      <SiteHeader siteTitle={settings?.siteTitle || "Brellas"} categories={categories} products={products} />
      <main>
        <Container>
          <Suspense>
            <CatalogClient
              products={products}
              categories={categories}
              telegramBotUrl={settings?.telegramBotUrl || "#"}
            />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
