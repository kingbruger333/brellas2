import { defineField, defineType } from "sanity";

export const leadType = defineType({
  name: "lead",
  title: "Заявка",
  type: "document",
  fields: [
    defineField({
      name: "source",
      title: "Источник",
      type: "string",
      readOnly: true
    }),
    defineField({
      name: "createdAt",
      title: "Дата",
      type: "datetime",
      readOnly: true
    }),
    defineField({
      name: "name",
      title: "Имя",
      type: "string",
      readOnly: true
    }),
    defineField({
      name: "phone",
      title: "Телефон",
      type: "string",
      readOnly: true
    }),
    defineField({
      name: "items",
      title: "Товары / артикулы",
      type: "text",
      readOnly: true
    }),
    defineField({
      name: "quantity",
      title: "Количество",
      type: "string",
      readOnly: true
    }),
    defineField({
      name: "deliveryMethod",
      title: "Способ получения",
      type: "string",
      readOnly: true
    }),
    defineField({
      name: "shippingService",
      title: "Служба доставки",
      type: "string",
      readOnly: true
    }),
    defineField({
      name: "address",
      title: "Адрес / город / ПВЗ",
      type: "string",
      readOnly: true
    }),
    defineField({
      name: "comment",
      title: "Комментарий",
      type: "text",
      readOnly: true
    })
  ],
  preview: {
    select: {
      title: "name",
      phone: "phone",
      createdAt: "createdAt"
    },
    prepare({ title, phone, createdAt }) {
      const date = createdAt ? new Date(createdAt).toLocaleString("ru-RU") : "без даты";

      return {
        title: title || "Заявка без имени",
        subtitle: [phone, date].filter(Boolean).join(" • ")
      };
    }
  }
});
