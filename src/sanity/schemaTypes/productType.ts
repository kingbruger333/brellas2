import { defineField, defineType } from "sanity";

export const productType = defineType({
  name: "product",
  title: "Товар",
  type: "document",
  groups: [
    { name: "main", title: "Основное", default: true },
    { name: "sale", title: "Продажа" },
    { name: "photos", title: "Фото" },
    { name: "service", title: "Служебное" }
  ],
  fieldsets: [
    {
      name: "basic",
      title: "Основная информация",
      options: { collapsible: false }
    },
    {
      name: "selling",
      title: "Условия продажи",
      options: { collapsible: false }
    },
    {
      name: "media",
      title: "Фотографии товара",
      options: { collapsible: false }
    },
    {
      name: "technical",
      title: "Служебные поля",
      options: { collapsible: true, collapsed: true }
    }
  ],
  fields: [
    defineField({
      name: "title",
      title: "Название товара",
      description: "Название, которое увидит покупатель на сайте.",
      type: "string",
      group: "main",
      fieldset: "basic",
      validation: (rule) => rule.required().min(2)
    }),
    defineField({
      name: "sku",
      title: "Артикул",
      description: "Внутренний код товара. Можно оставить пустым, если артикула нет.",
      type: "string",
      group: "main",
      fieldset: "basic"
    }),
    defineField({
      name: "category",
      title: "Категория",
      description: "Выберите раздел, в котором товар будет показан.",
      type: "reference",
      to: [{ type: "category" }],
      group: "main",
      fieldset: "basic",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "shortDescription",
      title: "Краткое описание",
      description: "Короткий текст для карточки товара. Лучше 1-2 предложения.",
      type: "text",
      rows: 3,
      group: "main",
      fieldset: "basic",
      validation: (rule) => rule.required().max(220)
    }),
    defineField({
      name: "description",
      title: "Подробное описание",
      description: "Описание для страницы товара: особенности, состав, комплектация, условия.",
      type: "array",
      of: [{ type: "block" }],
      group: "main",
      fieldset: "basic",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "price",
      title: "Оптовая цена",
      description: "Цена за единицу товара в рублях.",
      type: "number",
      group: "sale",
      fieldset: "selling",
      validation: (rule) => rule.required().positive()
    }),
    defineField({
      name: "minOrder",
      title: "Минимальный заказ",
      description: "Например: от 10 шт. или от 30 000 ₽.",
      type: "string",
      group: "sale",
      fieldset: "selling",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "available",
      title: "В наличии",
      description: "Выключите, если товар доступен только под заказ.",
      type: "boolean",
      group: "sale",
      fieldset: "selling",
      initialValue: true
    }),
    defineField({
      name: "featured",
      title: "Показывать на главной",
      description: "Включите, если товар должен попасть в витрину на главной странице.",
      type: "boolean",
      group: "sale",
      fieldset: "selling",
      initialValue: true
    }),
    defineField({
      name: "image",
      title: "Главное фото",
      description: "Основное изображение товара для карточки и страницы товара.",
      type: "image",
      group: "photos",
      fieldset: "media",
      options: {
        hotspot: true
      },
      fields: [
        defineField({
          name: "alt",
          title: "Описание фото",
          description: "Короткое описание изображения для доступности и поиска.",
          type: "string"
        })
      ]
    }),
    defineField({
      name: "gallery",
      title: "Дополнительные фото",
      description: "Добавьте другие ракурсы, упаковку или детали товара.",
      type: "array",
      group: "photos",
      fieldset: "media",
      of: [
        {
          type: "image",
          options: {
            hotspot: true
          }
        }
      ]
    }),
    defineField({
      name: "slug",
      title: "Адрес страницы",
      description: "Создаётся из названия. Нужен для ссылки на товар.",
      type: "slug",
      group: "service",
      fieldset: "technical",
      options: {
        source: "title",
        maxLength: 96
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "sortOrder",
      title: "Порядок сортировки",
      description: "Чем меньше число, тем выше товар в списках при ручной сортировке.",
      type: "number",
      group: "service",
      fieldset: "technical",
      initialValue: 0
    })
  ],
  preview: {
    select: {
      title: "title",
      price: "price",
      sku: "sku",
      category: "category.title",
      available: "available",
      media: "image"
    },
    prepare({ title, price, sku, category, available, media }) {
      const status = available ? "В наличии" : "Под заказ";
      const priceText = typeof price === "number" ? `${price.toLocaleString("ru-RU")} ₽` : "Цена не указана";
      const parts = [priceText, category, status, sku ? `арт. ${sku}` : ""].filter(Boolean);

      return {
        title: title || "Без названия",
        subtitle: parts.join(" • "),
        media
      };
    }
  }
});
