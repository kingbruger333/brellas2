import type { PortableTextBlock } from "next-sanity";
import type { Image } from "sanity";

export type SanityImage = Image & {
  alt?: string;
};

export type Category = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  sortOrder: number;
  productCount?: number;
};

export type ProductCategory = {
  _id: string;
  title: string;
  slug: string;
};

export type Subcategory = {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  parentCategory: ProductCategory | null;
};

export type Product = {
  _id: string;
  title: string;
  slug: string;
  sku?: string;
  price: number;
  minOrder: string;
  shortDescription: string;
  description?: PortableTextBlock[];
  category: ProductCategory | null;
  subcategory?: Subcategory | null;
  photos?: SanityImage[];
  image?: SanityImage;
  gallery?: SanityImage[];
  featured?: boolean;
  available: boolean;
  sortOrder: number;
  createdAt: string;
};

export type SiteSettings = {
  siteTitle: string;
  heroTitle: string;
  heroText: string;
  wholesaleConditions: PortableTextBlock[];
  telegramBotUrl: string;
  contactNote?: string;
};
