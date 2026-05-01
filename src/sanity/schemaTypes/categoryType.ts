import { defineField, defineType } from "sanity";

export const categoryType = defineType({
  name: "category",
  title: "Категория",
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
      title: "Название категории",
      description: "Например: Товары для дома, Красота и уход, Канцелярия.",
      type: "string",
      validation: (rule) => rule.required().min(2)
    }),
    defineField({
      name: "description",
      title: "Описание категории",
      description: "Короткое пояснение для страницы категории. Можно оставить пустым.",
      type: "text",
      rows: 3
    }),
    defineField({
      name: "photo",
      title: "Фото категории",
      description: "Добавьте фото для карточки категории на сайте",
      type: "image",
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: "slug",
      title: "Ссылка категории",
      description: "Создается из названия. Нужна для ссылки на категорию.",
      type: "slug",
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
      fieldset: "technical",
      initialValue: 0
    })
  ],
  preview: {
    select: {
      title: "title",
      slug: "slug.current",
      media: "photo"
    },
    prepare({ title, slug, media }) {
      return {
        title: title || "Без названия",
        subtitle: slug ? `/${slug}` : "Ссылка не указана",
        media
      };
    }
  }
});
