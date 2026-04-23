import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { urlFor } from "@/lib/sanity.image";
import { LeadChoiceButton } from "./lead-choice-button";

type ProductCardProps = {
  product: Product;
  telegramBotUrl: string;
};

export function ProductCard({ product, telegramBotUrl }: ProductCardProps) {
  const categoryTitle = product.category?.title;
  const imageUrl = product.image?.asset?._ref
    ? urlFor(product.image).width(720).height(720).fit("crop").url()
    : "/placeholder-product.jpg";

  return (
    <article className="productCard">
      <Link href={`/catalog/${product.slug}`} className="productImageWrap">
        <div className="productBadgeRow">
          <span className={`stockBadge ${product.available ? "stockBadgeAvailable" : "stockBadgeCustom"}`}>
            {product.available ? "В наличии" : "Под заказ"}
          </span>
          {categoryTitle ? <span className="categoryBadge">{categoryTitle}</span> : null}
        </div>
        <Image
          src={imageUrl}
          alt={product.image?.alt || product.title}
          width={720}
          height={720}
          sizes="(max-width: 760px) calc(100vw - 24px), (max-width: 900px) 50vw, (max-width: 1100px) 33vw, 320px"
          className="productImage"
        />
      </Link>
      <div className="productCardBody">
        <div className="productMeta">
          {categoryTitle ? <span>{categoryTitle}</span> : null}
          {product.sku ? <span>Артикул: {product.sku}</span> : null}
        </div>
        <Link href={`/catalog/${product.slug}`} className="productTitle">
          {product.title}
        </Link>
        <p className="productDescription">{product.shortDescription}</p>
        <div className="productPriceRow">
          <div className="priceBlock">
            <span className="priceLabel">Цена за единицу</span>
            <strong>{formatPrice(product.price)}</strong>
          </div>
          <div className="minOrderBlock">
            <span className="priceLabel">Минимальный заказ</span>
            <span className="minOrderValue">{product.minOrder}</span>
          </div>
        </div>
        <div className="productCardActions">
          <Link href={`/catalog/${product.slug}`} className="secondaryButton">
            Подробнее
          </Link>
          <LeadChoiceButton
            telegramUrl={telegramBotUrl}
            label="Оставить заявку"
            product={{
              title: product.title,
              sku: product.sku,
              category: categoryTitle || undefined
            }}
          />
        </div>
      </div>
    </article>
  );
}
