import { defineCollection } from "astro:content";
import { pardonDetailsLoader, pardonDetailSchema } from "./loaders/pardon-details";

const pardonDetails = defineCollection({
  loader: pardonDetailsLoader(),
  schema: pardonDetailSchema,
});

export const collections = { pardonDetails };
