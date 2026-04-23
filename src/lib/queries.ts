import { groq } from "next-sanity";

const productSharedFields = `
  _id,
  title,
  "slug": slug.current,
  sku,
  price,
  minOrder,
  shortDescription,
  "category": category->{
    _id,
    title,
    "slug": slug.current
  },
  image,
  available,
  sortOrder,
  "createdAt": _createdAt
`;

const productListFields = productSharedFields;

const productDetailFields = `
  ${productSharedFields},
  description,
  gallery
`;

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0]{
    siteTitle,
    heroTitle,
    heroText,
    wholesaleConditions,
    telegramBotUrl,
    contactNote
  }
`;

export const categoriesQuery = groq`
  *[_type == "category"] | order(sortOrder asc, title asc){
    _id,
    title,
    "slug": slug.current,
    description,
    sortOrder
  }
`;

export const categoryBySlugQuery = groq`
  *[_type == "category" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    description,
    sortOrder
  }
`;

export const productsQuery = groq`
  *[_type == "product"] | order(sortOrder asc, _createdAt desc){
    ${productListFields}
  }
`;

export const featuredProductsQuery = groq`
  *[_type == "product" && featured == true] | order(sortOrder asc, _createdAt desc)[0...6]{
    ${productListFields}
  }
`;

export const productBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug][0]{
    ${productDetailFields}
  }
`;
