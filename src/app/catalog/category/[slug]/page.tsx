import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/container";
import { CatalogClient } from "@/components/catalog-client";
import { getCategories, getCategoryBySlug, getProducts, getSiteSettings } from "@/lib/content";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [settings, products, categories, category] = await Promise.all([
    getSiteSettings(),
    getProducts(),
    getCategories(),
    getCategoryBySlug(slug)
  ]);

  if (!category) {
    notFound();
  }

  return (
    <>
      <SiteHeader siteTitle={settings?.siteTitle || "Brellas"} />
      <main>
        <Container>
          <Suspense>
            <CatalogClient
              products={products}
              categories={categories}
              telegramBotUrl={settings?.telegramBotUrl || "#"}
              initialCategorySlug={category.slug}
              categoryTitle={category.title}
              categoryDescription={category.description}
            />
          </Suspense>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
