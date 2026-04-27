"use client";

import Image from "next/image";
import { useState } from "react";
import { SanityImage } from "@/lib/types";
import { urlFor } from "@/lib/sanity.image";

type ProductGalleryProps = {
  images: SanityImage[];
  title: string;
};

function imageUrl(image: SanityImage, width: number, height: number) {
  return image.asset?._ref
    ? urlFor(image).width(width).height(height).fit("max").url()
    : "/placeholder-product.jpg";
}

export function ProductGallery({ images, title }: ProductGalleryProps) {
  const safeImages = images.length ? images : [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const activeImage = safeImages[activeIndex];
  const hasManyImages = safeImages.length > 1;

  function showImage(index: number) {
    setActiveIndex((index + safeImages.length) % safeImages.length);
  }

  function handleTouchEnd(clientX: number) {
    if (touchStart === null || !hasManyImages) {
      setTouchStart(null);
      return;
    }

    const distance = clientX - touchStart;

    if (Math.abs(distance) > 42) {
      showImage(activeIndex + (distance < 0 ? 1 : -1));
    }

    setTouchStart(null);
  }

  if (!activeImage) {
    return (
      <div className="productGallery">
        <div className="productMainImage">
          <Image
            src="/placeholder-product.jpg"
            alt={title}
            width={1280}
            height={960}
            sizes="(max-width: 760px) calc(100vw - 24px), (max-width: 1100px) 50vw, 42vw"
            priority
          />
        </div>
      </div>
    );
  }

  return (
    <div className="productGallery productGalleryInteractive">
      {hasManyImages ? (
        <div className="productThumbRail" aria-label="Фотографии товара">
          {safeImages.map((image, index) => (
            <button
              key={`${image.asset?._ref || "photo"}-${index}`}
              type="button"
              className={`productThumbButton ${index === activeIndex ? "productThumbButtonActive" : ""}`}
              onClick={() => showImage(index)}
              aria-label={`Показать фото ${index + 1}`}
              aria-current={index === activeIndex}
            >
              <Image
                src={imageUrl(image, 180, 180)}
                alt={image.alt || title}
                width={180}
                height={180}
                sizes="72px"
              />
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="productMainImage productMainImageInteractive"
        onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        <Image
          key={`${activeImage.asset?._ref || "photo"}-${activeIndex}`}
          src={imageUrl(activeImage, 1280, 960)}
          alt={activeImage.alt || title}
          width={1280}
          height={960}
          sizes="(max-width: 760px) calc(100vw - 24px), (max-width: 1100px) 50vw, 42vw"
          priority
        />
        {hasManyImages ? (
          <>
            <button
              type="button"
              className="galleryArrow galleryArrowPrev"
              onClick={() => showImage(activeIndex - 1)}
              aria-label="Предыдущее фото"
            >
              ←
            </button>
            <button
              type="button"
              className="galleryArrow galleryArrowNext"
              onClick={() => showImage(activeIndex + 1)}
              aria-label="Следующее фото"
            >
              →
            </button>
            <div className="galleryCounter">
              {activeIndex + 1} / {safeImages.length}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
