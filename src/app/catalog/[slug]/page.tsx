import { notFound } from "next/navigation";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/container";
import { PortableTextRenderer } from "@/components/portable-text";
import { LeadChoiceButton } from "@/components/lead-choice-button";
import { ProductCard } from "@/components/product-card";
import { ProductActions } from "@/components/product-actions";
import { ProductGallery } from "@/components/product-gallery";
import { getCategories, getProductBySlug, getProducts, getSiteSettings } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { getProductPhotos } from "@/lib/product-photos";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [settings, product, products, categories] = await Promise.all([
    getSiteSettings(),
    getProductBySlug(slug),
    getProducts(),
    getCategories()
  ]);

  if (!product) {
    notFound();
  }

  const gallery = getProductPhotos(product);
  const categoryTitle = product.category?.title;
  const categorySlug = product.category?.slug;
  const subcategoryTitle = product.subcategory?.title;
  const relatedProducts = products
    .filter((item) => item._id !== product._id && item.category?.slug === categorySlug)
    .slice(0, 4);

  return (
    <>
      <SiteHeader siteTitle={settings?.siteTitle || "Brellas"} categories={categories} products={products} />
      <main>
        <Container className="productPageShell">
          <Link href="/catalog" className="backLink">
            ← Вернуться в каталог
          </Link>

          <section className="productLayout">
            <ProductGallery images={gallery} title={product.title} />

            <div className="productDetailPanel">
              <div className="detailTopRow">
                {categoryTitle ? (
                  <span className="eyebrow">
                    {[categoryTitle, subcategoryTitle].filter(Boolean).join(" / ")}
                  </span>
                ) : null}
                <span className={`stockBadge ${product.available ? "stockBadgeAvailable" : "stockBadgeCustom"}`}>
                  {product.available ? "В наличии" : "Под заказ"}
                </span>
              </div>
              <h1 className="productPageTitle">{product.title}</h1>
              <div className="detailMeta">
                {product.sku ? <span>Артикул: {product.sku}</span> : null}
                <span>Минимальный заказ: {product.minOrder}</span>
                {categoryTitle && categorySlug ? (
                  <span>
                    Категория:{" "}
                    <Link href={`/catalog/category/${categorySlug}`} className="inlineLink">
                      {categoryTitle}
                    </Link>
                    {subcategoryTitle ? ` / ${subcategoryTitle}` : ""}
                  </span>
                ) : null}
              </div>
              <p className="productLead">{product.shortDescription}</p>
              <div className="productDetailPrice">
                <span className="priceLabel">Оптовая цена</span>
                <strong>{formatPrice(product.price)}</strong>
              </div>
              <ProductActions productId={product._id} minOrder={product.minOrder} />
              <div className="productCardActions productDetailActions">
                <LeadChoiceButton
                  telegramUrl={settings?.telegramBotUrl || "#"}
                  label="Заказать товар"
                  product={{
                    title: product.title,
                    sku: product.sku,
                    category: [categoryTitle, subcategoryTitle].filter(Boolean).join(" / ") || undefined
                  }}
                />
                <Link href="/#lead-form" className="secondaryButton">
                  Задать вопрос
                </Link>
              </div>
              <div className="richText">
                {product.description ? (
                  <PortableTextRenderer value={product.description} />
                ) : (
                  <p>Подробности по комплектации, наличию и условиям поставки уточняются при заявке.</p>
                )}
              </div>
            </div>
          </section>

          {relatedProducts.length ? (
            <section className="section">
              <div className="sectionTitle">
                <span className="eyebrow">Похожие товары</span>
                <h2>Ещё в категории</h2>
              </div>
              <div className="productGrid">
                {relatedProducts.map((item) => (
                  <ProductCard
                    key={item._id}
                    product={item}
                    telegramBotUrl={settings?.telegramBotUrl || "#"}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
