import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Container } from "@/components/container";
import { PortableTextRenderer } from "@/components/portable-text";
import { LeadChoiceButton } from "@/components/lead-choice-button";
import { getProductBySlug, getSiteSettings } from "@/lib/content";
import { formatPrice } from "@/lib/format";
import { urlFor } from "@/lib/sanity.image";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 60;

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const [settings, product] = await Promise.all([
    getSiteSettings(),
    getProductBySlug(slug)
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

  return (
    <>
      <SiteHeader siteTitle={settings?.siteTitle || "Brellas"} />
      <main>
        <Container>
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
                {categoryTitle ? <span className="eyebrow">{categoryTitle}</span> : null}
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
                  </span>
                ) : null}
              </div>
              <p className="productLead">{product.shortDescription}</p>
              <div className="productDetailPrice">
                <span className="priceLabel">Оптовая цена</span>
                <strong>{formatPrice(product.price)}</strong>
              </div>
              <div className="productCardActions">
                <LeadChoiceButton
                  telegramUrl={settings?.telegramBotUrl || "#"}
                  label="Оставить заявку"
                  product={{
                    title: product.title,
                    sku: product.sku,
                    category: categoryTitle || undefined
                  }}
                />
              </div>
              <div className="richText">
                {product.description ? <PortableTextRenderer value={product.description} /> : null}
              </div>
            </div>
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
