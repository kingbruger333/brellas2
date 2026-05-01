import Image from "next/image";
import Link from "next/link";
import { Category, Product } from "@/lib/types";
import { urlFor } from "@/lib/sanity.image";

type CategoryCardGridProps = {
  categories: Category[];
  products: Product[];
  limit?: number;
};

export function CategoryCardGrid({ categories, products, limit }: CategoryCardGridProps) {
  const visibleCategories = typeof limit === "number" ? categories.slice(0, limit) : categories;

  if (!visibleCategories.length) {
    return null;
  }

  return (
    <div className="categoryPhotoGrid">
      {visibleCategories.map((category) => {
        const count = products.filter((product) => product.category?.slug === category.slug).length;
        const imageUrl = category.photo
          ? urlFor(category.photo).width(960).height(720).fit("crop").url()
          : null;

        return (
          <Link
            key={category._id}
            href={`/catalog/category/${category.slug}`}
            className={`categoryPhotoCard ${imageUrl ? "" : "categoryPhotoCardFallback"}`}
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={category.title}
                fill
                sizes="(max-width: 680px) 100vw, (max-width: 1120px) 50vw, 25vw"
                className="categoryPhotoCardImage"
              />
            ) : null}
            <span className="categoryPhotoCardShade" aria-hidden="true" />
            <span className="categoryPhotoCardContent">
              <span className="categoryPhotoCardMeta">{count} товаров</span>
              <span className="categoryPhotoCardTitle">{category.title}</span>
              <span className="categoryPhotoCardButton">Смотреть</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
