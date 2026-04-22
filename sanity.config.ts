import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { DuplicateProductAction } from "./src/sanity/actions/duplicateProductAction";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "your_project_id";
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "default",
  title: "B2B Wholesale Admin",
  basePath: "/studio",
  projectId,
  dataset,
  plugins: [structureTool(), visionTool()],
  document: {
    actions: (prev, context) =>
      context.schemaType === "product" ? [...prev, DuplicateProductAction] : prev
  },
  schema: {
    types: schemaTypes
  }
});
