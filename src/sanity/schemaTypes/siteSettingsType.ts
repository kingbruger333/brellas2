import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Настройки сайта",
  type: "document",
  fields: [
    defineField({
      name: "siteTitle",
      title: "Название бренда",
      type: "string",
      initialValue: "Brellas",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "heroTitle",
      title: "Главный заголовок",
      type: "string",
      initialValue: "Brellas — товары народного потребления оптом",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "heroText",
      title: "Подзаголовок",
      type: "text",
      rows: 4,
      initialValue: "Оптовые поставки товаров для магазинов, маркетплейсов и бизнеса",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "wholesaleConditions",
      title: "Условия сотрудничества",
      type: "array",
      of: [{ type: "block" }],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "telegramBotUrl",
      title: "Ссылка для заявок",
      description: "Можно указать https://t.me/имя_бота или просто имя_бота",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "contactNote",
      title: "Текст в блоке заявки",
      type: "string",
      initialValue: "Оставьте запрос, чтобы обсудить ассортимент, объёмы закупки и условия поставки."
    })
  ],
  preview: {
    select: {
      title: "siteTitle",
      subtitle: "heroTitle"
    }
  }
});
