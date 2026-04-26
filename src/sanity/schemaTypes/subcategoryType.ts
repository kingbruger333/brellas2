import { defineField, defineType } from "sanity";

export const subcategoryType = defineType({
  name: "subcategory",
  title: "Подкатегория",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Название подкатегории",
      description: "Например: Зонты, Сумки, Товары для кухни.",
      type: "string",
      validation: (rule) => rule.required().min(2)
    }),
    defineField({
      name: "slug",
      title: "Ссылка подкатегории",
      description: "Создается из названия. Нужна для фильтра в каталоге.",
      type: "slug",
      options: {
        source: "title",
        maxLength: 96
      },
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "parentCategory",
      title: "Родительская категория",
      description: "Выберите категорию, к которой относится эта подкатегория.",
      type: "reference",
      to: [{ type: "category" }],
      validation: (rule) => rule.required()
    }),
    defineField({
      name: "description",
      title: "Описание",
      description: "Необязательное описание подкатегории.",
      type: "text",
      rows: 3
    })
  ],
  preview: {
    select: {
      title: "title",
      category: "parentCategory.title",
      description: "description"
    },
    prepare({ title, category, description }) {
      return {
        title: title || "Без названия",
        subtitle: [category, description].filter(Boolean).join(" • ")
      };
    }
  }
});
