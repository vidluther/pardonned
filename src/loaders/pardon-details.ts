import type { Loader } from "astro/loaders";
import { z } from "astro/zod";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { pardons, administrations } from "../db/schema";
import { resolve } from "node:path";

export const pardonDetailSchema = z.object({
  id: z.string(),
  administration_slug: z.string(),
  grant_date: z.string(),
  clemency_type: z.enum(["pardon", "commutation"]),
  offense: z.string(),
  offense_category: z.enum([
    "violent crime",
    "fraud",
    "drug offense",
    "FACE act",
    "immigration",
    "firearms",
    "financial crime",
    "other",
  ]),
  district: z.string().nullable(),
  warrant_url: z.string().nullable(),
  source_url: z.string().nullable(),
  recipient_name: z.string(),
  sentence_in_months: z.number().nullable(),
  fine: z.number().nullable(),
  restitution: z.number().nullable(),
  original_sentence: z.string().nullable(),
  president_name: z.string(),
  term_number: z.number(),
  term_start_date: z.string(),
  term_end_date: z.string().nullable(),
});

export type PardonDetail = z.infer<typeof pardonDetailSchema>;

interface PardonDetailsLoaderOptions {
  /**
   * Path to the SQLite database file.
   * Resolved relative to process.cwd() (project root).
   * Defaults to "data/pardonned.db".
   */
  dbPath?: string;

  /**
   * Optional administration slug filter.
   * When set, only pardons for that administration are loaded.
   * Example: "trump-2"
   */
  administrationSlug?: string;
}

export function pardonDetailsLoader(
  options: PardonDetailsLoaderOptions = {},
): Loader {
  return {
    name: "pardon-details-loader",
    schema: pardonDetailSchema,

    async load({ store, logger, parseData, generateDigest }) {
      const dbPath = resolve(
        process.cwd(),
        options.dbPath ?? "data/pardonned.db",
      );

      logger.info(`Opening SQLite database at ${dbPath}`);

      const client = createClient({ url: "file:" + dbPath });
      const db = drizzle(client);

      try {
        const query = db
          .select({
            id: pardons.id,
            administration_slug: administrations.slug,
            grant_date: pardons.grant_date,
            clemency_type: pardons.clemency_type,
            offense: pardons.offense,
            offense_category: pardons.offense_category,
            district: pardons.district,
            warrant_url: pardons.warrant_url,
            source_url: pardons.source_url,
            recipient_name: pardons.recipient_name,
            sentence_in_months: pardons.sentence_in_months,
            fine: pardons.fine,
            restitution: pardons.restitution,
            original_sentence: pardons.original_sentence,
            president_name: administrations.president_name,
            term_number: administrations.term_number,
            term_start_date: administrations.start_date,
            term_end_date: administrations.end_date,
          })
          .from(pardons)
          .innerJoin(
            administrations,
            eq(pardons.administration, administrations.id),
          );

        const rows = options.administrationSlug
          ? await query
              .where(eq(administrations.slug, options.administrationSlug))
              .all()
          : await query.all();

        logger.info(`Read ${rows.length} rows from SQLite`);

        store.clear();

        for (const row of rows) {
          const id = String(row.id);
          const data = await parseData({ id, data: { ...row, id } });
          const digest = generateDigest(data);
          store.set({ id, data, digest });
        }

        logger.info(`Stored ${rows.length} pardon detail entries`);
      } finally {
        client.close();
      }
    },
  } satisfies Loader;
}
