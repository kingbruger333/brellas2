import { defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Категория",
  type: "document",
  groups: [
    { name: "main", title: "Основное", default: true },
    { name: "service", title: "Служебное" }
  ],
  fieldsets: [
    {
      name: "content",
      title: "Информация о категории",
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
      title: "Название категории",
      description: "Например: Товары для дома, Красота и уход, Канцелярия.",
      type: "string",
      group: "main",
      fieldset: "content",
      validation: (rule) => rule.required().min(2)
    }),
    defineField({
      name: "description",
      title: "Описание категории",
      description: "Короткое пояснение для страницы категории. Можно оставить пустым.",
      type: "text",
      rows: 3,
      group: "main",
      fieldset: "content"
    }),
    defineField({
      name: "slug",
      title: "Адрес страницы",
      description: "Создаётся из названия. Нужен для ссылки на категорию.",
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
      description: "Чем меньше число, тем выше категория в списке.",
      type: "number",
      group: "service",
      fieldset: "technical",
      initialValue: 0
    })
  ],
  preview: {
    select: {
      title: "title",
      description: "description",
      sortOrder: "sortOrder"
    },
    prepare({ title, description, sortOrder }) {
      const order = typeof sortOrder === "number" ? `Порядок: ${sortOrder}` : "Порядок не указан";

      return {
        title: title || "Без названия",
        subtitle: description ? `${description} • ${order}` : order
      };
    }
  }
});
