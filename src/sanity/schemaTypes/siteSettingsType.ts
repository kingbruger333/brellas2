import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Настройки сайта",
  type: "document",
  fields: [
    defineField({
      name: "siteTitle",
      title: "Название бренда",
      description: "Название, которое используется на сайте.",
      type: "string",
      initialValue: "Brellas",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "heroTitle",
      title: "Главный заголовок",
      description: "Крупный заголовок на главной странице.",
      type: "string",
      initialValue: "Brellas — товары народного потребления оптом",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "heroText",
      title: "Подзаголовок",
      description: "Короткий текст под главным заголовком.",
      type: "text",
      rows: 4,
      initialValue: "Оптовые поставки товаров для магазинов, маркетплейсов и бизнеса",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "wholesaleConditions",
      title: "Условия сотрудничества",
      description: "Текстовый блок с условиями для клиентов.",
      type: "array",
      of: [{ type: "block" }],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "telegramBotUrl",
      title: "Ссылка для заявок",
      description: "Можно указать https://t.me/имя_бота или просто имя_бота.",
      type: "string",
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "contactNote",
      title: "Текст в блоке заявки",
      description: "Короткая подсказка рядом с формой или кнопкой заявки.",
      type: "string",
      initialValue: "Оставьте запрос, чтобы обсудить ассортимент, объемы закупки и условия поставки."
    })
  ],
  preview: {
    select: {
      title: "siteTitle",
      subtitle: "heroTitle"
    }
  }
});
