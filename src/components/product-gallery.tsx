"use client";

import Image from "next/image";
import { useState } from "react";
import { SanityImage } from "@/lib/types";
import { urlFor } from "@/lib/sanity.image";

type ProductGalleryProps = {
  images: SanityImage[];
  title: string;
};

function imageUrl(image: SanityImage, width: number) {
  return image.asset?._ref
    ? urlFor(image).width(width).fit("max").url()
    : "/placeholder-product.jpg";
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const mainImage = images[activeIndex];
  const hasManyImages = images.length > 1;
  const showPrevious = () => setActiveIndex((current) => (current - 1 + images.length) % images.length);
  const showNext = () => setActiveIndex((current) => (current + 1) % images.length);

  return (
    <div className="productGallery">
      <div className="productMainImage">
        <Image
          src={mainImage ? imageUrl(mainImage, 1200) : "/placeholder-product.jpg"}
          alt={mainImage?.alt || title}
          width={1200}
          height={1200}
          sizes="(max-width: 760px) calc(100vw - 24px), (max-width: 1100px) 50vw, 42vw"
          className="productMainImageMedia"
          priority
        />
        {hasManyImages ? (
          <>
            <button
              type="button"
              className="productGalleryArrow productGalleryArrowPrev"
              onClick={showPrevious}
              aria-label="Предыдущее фото"
            >
              ←
            </button>
            <button
              type="button"
              className="productGalleryArrow productGalleryArrowNext"
              onClick={showNext}
              aria-label="Следующее фото"
            >
              →
            </button>
          </>
        ) : null}
      </div>

      {hasManyImages ? (
        <div className="productThumbScroller" aria-label="Фотографии товара">
          {images.map((image, index) => (
            <button
              key={`${image.asset?._ref || "photo"}-${index}`}
              type="button"
              className={`productThumbButton ${index === activeIndex ? "productThumbButtonActive" : ""}`}
              onClick={() => setActiveIndex(index)}
              aria-label={`Показать фото ${index + 1}`}
              aria-current={index === activeIndex}
            >
              <Image
                src={imageUrl(image, 360)}
                alt={image.alt || title}
                width={360}
                height={360}
                sizes="(max-width: 760px) 30vw, (max-width: 1100px) 16vw, 180px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
