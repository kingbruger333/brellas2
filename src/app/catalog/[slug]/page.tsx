import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/container";
import { PortableTextRenderer } from "@/components/portable-text";
import { LeadChoiceButton } from "@/components/lead-choice-button";
import { ProductCard } from "@/components/product-card";
import { ProductActions } from "@/components/product-actions";
import { getCategories, getProductBySlug, getProducts, getSiteSettings } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { urlFor } from "@/lib/sanity.image";

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

  const gallery = [
    ...(product.image ? [product.image] : []),
    ...((product.gallery || []).filter(Boolean))
  ];

  const mainImageUrl = product.image?.asset?._ref
    ? urlFor(product.image).width(1280).height(960).fit("crop").url()
    : "/placeholder-product.jpg";
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
            <div className="productGallery">
              <div className="productMainImage">
                <Image
                  src={mainImageUrl}
                  alt={product.image?.alt || product.title}
                  width={1280}
                  height={960}
                  sizes="(max-width: 760px) calc(100vw - 24px), (max-width: 1100px) 50vw, 42vw"
                  priority
                />
              </div>
              {gallery.length > 1 ? (
                <div className="thumbGrid">
                  {gallery.slice(1).map((image, index) => (
                    <div key={`${product._id}-${index}`} className="productThumb">
                      <Image
                        src={
                          image.asset?._ref
                            ? urlFor(image).width(360).height(360).fit("crop").url()
                            : "/placeholder-product.jpg"
                        }
                        alt={product.title}
                        width={360}
                        height={360}
                        sizes="(max-width: 760px) 30vw, (max-width: 1100px) 16vw, 180px"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

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
