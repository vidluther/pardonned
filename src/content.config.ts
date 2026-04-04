import { defineCollection } from "astro:content";
import {
  pardonDetailsLoader,
  pardonDetailSchema,
} from "./loaders/pardon-details";

const pardonDetails = defineCollection({
  loader: pardonDetailsLoader({
    filters: {
      administration_slug: "eq.trump-2",
    },
  }),
  schema: pardonDetailSchema,
});

export const collections = { pardonDetails };
