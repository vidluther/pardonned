import type { Loader } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Schema matching the pardon_details view as returned by PostgREST.
 */
export const pardonDetailSchema = z.object({
  id: z.string().uuid(),
  administration_id: z.string().uuid(),
  administration_slug: z.string(),
  grant_date: z.string(), // ISO date from PostgREST
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
   * Override the API host URL (the /v1 base).
   * Defaults to PARDONNED_API_HOST env var.
   */
  apiHost?: string;

  /**
   * Override the API key.
   * Defaults to PARDONNED_API_KEY env var.
   */
  apiKey?: string;

  /**
   * The PostgREST resource path.
   * Defaults to "pardon_details".
   */
  resource?: string;

  /**
   * Optional PostgREST query parameters for filtering.
   * Example: { administration_slug: "eq.trump-2", offense_category: "eq.fraud" }
   */
  filters?: Record<string, string>;
}

export function pardonDetailsLoader(
  options: PardonDetailsLoaderOptions = {},
): Loader {
  return {
    name: "pardon-details-loader",
    schema: pardonDetailSchema,

    async load({ store, logger, parseData, generateDigest }) {
      const apiHost = options.apiHost ?? import.meta.env.PARDONNED_API_HOST;
      const apiKey = options.apiKey ?? import.meta.env.PARDONNED_API_KEY;
      const resource = options.resource ?? "pardon_details";

      if (!apiHost || !apiKey) {
        throw new Error(
          "pardon-details-loader: missing PARDONNED_API_HOST or PARDONNED_API_KEY environment variables.",
        );
      }

      // Build URL with optional PostgREST filters
      const url = new URL(`${apiHost}/${resource}`);
      if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          url.searchParams.set(key, value);
        }
      }

      logger.info(`Fetching from ${url.toString()}`);

      const response = await fetch(url.toString(), {
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
          "Accept-Profile": "pardonned",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `pardon-details-loader: ${response.status} ${response.statusText} from ${url}`,
        );
      }

      const rows: unknown[] = await response.json();
      logger.info(`Received ${rows.length} rows`);

      store.clear();

      for (const row of rows) {
        const raw = row as Record<string, unknown>;
        const id = String(raw.id);

        const data = await parseData({ id, data: raw });
        const digest = generateDigest(data);

        store.set({ id, data, digest });
      }

      logger.info(`Stored ${rows.length} pardon detail entries`);
    },
  } satisfies Loader;
}
