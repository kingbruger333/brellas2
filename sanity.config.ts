import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { DuplicateProductAction } from "./src/sanity/actions/duplicateProductAction";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "your_project_id";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "brellas-admin",
  title: "Brellas Admin",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Brellas")
          .items([
            S.documentTypeListItem("product").title("Товары"),
            S.documentTypeListItem("category").title("Категории"),
            S.documentTypeListItem("lead").title("Заявки"),
            S.divider(),
            S.documentTypeListItem("siteSettings").title("Настройки сайта")
          ])
    })
  ],
  document: {
    actions: (prev, context) =>
      context.schemaType === "product" ? [...prev, DuplicateProductAction] : prev
  },
  schema: {
    types: schemaTypes
  }
});
