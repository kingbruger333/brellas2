import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { urlFor } from "@/lib/sanity.image";
import { LeadChoiceButton } from "./lead-choice-button";
import { ProductActions } from "./product-actions";

type ProductCardProps = {
  product: Product;
  telegramBotUrl: string;
};

export function ProductCard({ product, telegramBotUrl }: ProductCardProps) {
  const categoryTitle = product.category?.title;
  const subcategoryTitle = product.subcategory?.title;
  const sectionTitle = [categoryTitle, subcategoryTitle].filter(Boolean).join(" / ");
  const imageUrl = product.image?.asset?._ref
    ? urlFor(product.image).width(760).height(700).fit("crop").url()
    : "/placeholder-product.jpg";

  return (
    <article className="productCard">
      <div className="productImageWrap">
        <Link href={`/catalog/${product.slug}`} aria-label={`Открыть товар ${product.title}`}>
          <Image
            src={imageUrl}
            alt={product.image?.alt || product.title}
            width={760}
            height={700}
            sizes="(max-width: 760px) calc(100vw - 24px), (max-width: 1020px) 50vw, 320px"
            className="productImage"
          />
        </Link>
        <div className="productBadgeRow">
          <span className={`stockBadge ${product.available ? "stockBadgeAvailable" : "stockBadgeCustom"}`}>
            {product.available ? "В наличии" : "Под заказ"}
          </span>
          {sectionTitle ? <span className="categoryBadge">{sectionTitle}</span> : null}
        </div>
        <ProductActions productId={product._id} minOrder={product.minOrder} />
      </div>

      <div className="productCardBody">
        <div className="productMeta">
          {product.sku ? <span>Артикул: {product.sku}</span> : null}
          <span>Мин. заказ: {product.minOrder}</span>
        </div>
        <Link href={`/catalog/${product.slug}`} className="productTitle">
          {product.title}
        </Link>
        <p className="productDescription">{product.shortDescription}</p>
        <div className="productPriceRow">
          <div className="priceBlock">
            <span className="priceLabel">Оптовая цена</span>
            <strong>{formatPrice(product.price)}</strong>
          </div>
        </div>
        <div className="productCardActions">
          <Link href={`/catalog/${product.slug}`} className="secondaryButton">
            Подробнее
          </Link>
          <LeadChoiceButton
            telegramUrl={telegramBotUrl}
            label="Заказать"
            product={{
              title: product.title,
              sku: product.sku,
              category: sectionTitle || undefined
            }}
          />
        </div>
      </div>
    </article>
  );
}
