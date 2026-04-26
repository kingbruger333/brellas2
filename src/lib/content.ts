import { client } from "./sanity.client";
import {
  categoriesQuery,
  categoryBySlugQuery,
  featuredProductsQuery,
  productBySlugQuery,
  productsQuery,
  siteSettingsQuery,
  subcategoriesQuery
} from "./queries";
import { Category, Product, SiteSettings, Subcategory } from "./types";

export async function getSiteSettings() {
  return client.fetch<SiteSettings | null>(siteSettingsQuery);
}

export async function getCategories() {
  return client.fetch<Category[]>(categoriesQuery);
}

export async function getCategoryBySlug(slug: string) {
  return client.fetch<Category | null>(categoryBySlugQuery, { slug });
}

export async function getSubcategories() {
  return client.fetch<Subcategory[]>(subcategoriesQuery);
}

export async function getProducts() {
  return client.fetch<Product[]>(productsQuery);
}

export async function getFeaturedProducts() {
  return client.fetch<Product[]>(featuredProductsQuery);
}

export async function getProductBySlug(slug: string) {
  return client.fetch<Product | null>(productBySlugQuery, { slug });
}
