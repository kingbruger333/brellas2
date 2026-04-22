import { groq } from "next-sanity";

const productFields = `
  _id,
  title,
  "slug": slug.current,
  sku,
  price,
  minOrder,
  shortDescription,
  description,
  "category": category->{
    _id,
    title,
    "slug": slug.current
  },
  image,
  gallery,
  featured,
  available,
  sortOrder,
  "createdAt": _createdAt
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
    sortOrder,
    "productCount": count(*[_type == "product" && references(^._id)])
  }
`;

export const categoryBySlugQuery = groq`
  *[_type == "category" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    description,
    sortOrder,
    "productCount": count(*[_type == "product" && references(^._id)])
  }
`;

export const productsQuery = groq`
  *[_type == "product"] | order(sortOrder asc, _createdAt desc){
    ${productFields}
  }
`;

export const featuredProductsQuery = groq`
  *[_type == "product" && featured == true] | order(sortOrder asc, _createdAt desc)[0...6]{
    ${productFields}
  }
`;

export const productBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug][0]{
    ${productFields}
  }
`;
