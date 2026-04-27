import { Product, SanityImage } from "./types";

function hasImageAsset(image?: SanityImage | null): image is SanityImage {
  return Boolean(image?.asset?._ref);
}

export function getProductPhotos(product: Pick<Product, "photos" | "image" | "gallery">) {
  const newPhotos = (product.photos || []).filter(hasImageAsset);

  if (newPhotos.length) {
    return newPhotos;
  }

  return [product.image, ...(product.gallery || [])].filter(hasImageAsset);
}

export function getProductMainPhoto(product: Pick<Product, "photos" | "image" | "gallery">) {
  return getProductPhotos(product)[0] || null;
}
