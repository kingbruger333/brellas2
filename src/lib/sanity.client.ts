import { createClient } from "next-sanity";
import { apiVersion, dataset, projectId } from "./sanity.env";

const token = process.env.SANITY_API_READ_TOKEN?.trim();

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token: token || undefined,
  perspective: "published"
});
