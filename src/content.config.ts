import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { pardonDetailsLoader, pardonDetailSchema } from "./loaders/pardon-details";

const pardonDetails = defineCollection({
  loader: pardonDetailsLoader(),
  schema: pardonDetailSchema,
});

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { pardonDetails, pages };
