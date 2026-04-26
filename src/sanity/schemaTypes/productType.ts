import { defineField, defineType } from "sanity";

function validateMinimumOrder(value?: string) {
  if (!value) {
    return "Укажите минимальный заказ";
  }

  const number = Number(value.match(/\d+/)?.[0]);

  if (!Number.isFinite(number) || number < 1) {
    return "Минимальный заказ должен быть не меньше 1";
  }

  return true;
}

export const productType = defineType({
  name: "product",
  title: "Товар",
  type: "document",
  fieldsets: [
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
      description: "Как товар будет называться на сайте.",
      type: "string",
      validation: (rule) => rule.required().min(2)
    }),
    defineField({
      name: "image",
      title: "Фото товара",
      description: "Добавьте качественное фото товара.",
      type: "image",
      options: {
        hotspot: true
      },
      validation: (rule) => rule.required().warning("Фото желательно добавить перед публикацией"),
      fields: [
        defineField({
          name: "alt",
          title: "Описание фото",
          description: "Коротко опишите, что изображено на фото.",
          type: "string"
        })
      ]
    }),
    defineField({
      name: "gallery",
      title: "Дополнительные фото товара",
      description: "Добавьте другие ракурсы, упаковку или детали товара.",
      type: "array",
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
      name: "price",
      title: "Цена",
      description: "Укажите цену в рублях.",
      type: "number",
      validation: (rule) => rule.required().positive()
    }),
    defineField({
      name: "oldPrice",
      title: "Старая цена",
      description: "Заполните, если нужно показать прежнюю цену в админке.",
      type: "number",
      validation: (rule) => rule.positive().warning("Старая цена должна быть больше 0")
    }),
    defineField({
      name: "sku",
      title: "Артикул",
      description: "Например: BR-001.",
      type: "string"
    }),
    defineField({
      name: "category",
      title: "Категория",
      description: "Выберите раздел, в котором товар будет показан.",
      type: "reference",
      to: [{ type: "category" }],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "subcategory",
      title: "Подкатегория",
      description: "Выберите подкатегорию, если товар относится к более точному разделу",
      type: "reference",
      to: [{ type: "subcategory" }],
      options: {
        filter: ({ document }) => {
          const categoryRef = (document?.category as { _ref?: string } | undefined)?._ref;

          return categoryRef
            ? {
                filter: "parentCategory._ref == $categoryId",
                params: { categoryId: categoryRef }
              }
            : {
                filter: "defined(parentCategory._ref)"
              };
        }
      }
    }),
    defineField({
      name: "minOrder",
      title: "Минимальный заказ",
      description: "Минимальное количество для заказа, например 10.",
      type: "string",
      validation: (rule) => rule.required().custom(validateMinimumOrder)
    }),
    defineField({
      name: "description",
      title: "Описание",
      description: "Кратко опишите товар для клиента.",
      type: "array",
      of: [{ type: "block" }],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "shortDescription",
      title: "Краткое описание для карточки",
      description: "Если заполнить, этот текст будет виден в карточке товара в каталоге.",
      type: "text",
      rows: 3,
      validation: (rule) => rule.max(220).warning("Лучше уложиться в 1-2 предложения")
    }),
    defineField({
      name: "featured",
      title: "Популярный товар",
      description: "Включите, если товар нужно показать в подборке популярных товаров.",
      type: "boolean",
      initialValue: false
    }),
    defineField({
      name: "isNew",
      title: "Новинка",
      description: "Включите, если товар новый в ассортименте.",
      type: "boolean",
      initialValue: false
    }),
    defineField({
      name: "slug",
      title: "Ссылка товара",
      description: "Создается из названия. Нужна для ссылки на товар.",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "available",
      title: "В наличии",
      description: "Выключите, если товар доступен только под заказ.",
      type: "boolean",
      fieldset: "technical",
      initialValue: true
    }),
    defineField({
      name: "sortOrder",
      title: "Порядок сортировки",
      description: "Чем меньше число, тем выше товар в списках при ручной сортировке.",
      type: "number",
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
      subcategory: "subcategory.title",
      media: "image"
    },
    prepare({ title, price, sku, category, subcategory, media }) {
      const priceText =
        typeof price === "number" ? `${price.toLocaleString("ru-RU")} ₽` : "Цена не указана";
      const section = [category, subcategory].filter(Boolean).join(" / ");
      const parts = [priceText, section, sku ? `арт. ${sku}` : ""].filter(Boolean);

      return {
        title: title || "Без названия",
        subtitle: parts.join(" • "),
        media
      };
    }
  }
});
