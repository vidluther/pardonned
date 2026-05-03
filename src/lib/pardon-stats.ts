import type { PardonDetail } from "../loaders/pardon-details";

/**
 * Computed aggregate statistics for a set of pardon detail entries.
 */
export interface PardonStats {
  /** Total number of clemency grants (pardons + commutations) */
  totalGrants: number;

  /** Number of pardons specifically */
  totalPardons: number;

  /** Number of commutations specifically */
  totalCommutations: number;

  /** Total prison time erased in months */
  totalMonthsErased: number;

  /** Total prison time erased expressed in years (rounded to 1 decimal) */
  totalYearsErased: number;

  /** Total restitution abandoned (sum of restitution amounts) */
  totalRestitutionAbandoned: number;

  /** Total fines abandoned */
  totalFinesAbandoned: number;

  /** Number of fraud-related grants */
  fraudCount: number;

  /** Number of grants that had a life sentence (sentence_in_months is null but original_sentence mentions life) */
  lifeSentenceCount: number;

  /** Breakdown of grants by offense category */
  byCategory: Record<string, number>;

  /** Breakdown of grants by clemency type */
  byType: Record<string, number>;
}

/**
 * Entry shape from getCollection() — each entry wraps the data in { id, data }.
 */
interface CollectionEntry {
  id: string;
  data: PardonDetail;
}

/**
 * Compute aggregate statistics from a collection of pardon detail entries.
 *
 * Usage in an Astro page:
 * ```ts
 * import { getCollection } from "astro:content";
 * import { computeStats } from "../lib/pardon-stats";
 *
 * const entries = await getCollection("pardonDetails");
 * const stats = computeStats(entries);
 * ```
 */
export function computeStats(entries: CollectionEntry[]): PardonStats {
  const stats: PardonStats = {
    totalGrants: entries.length,
    totalPardons: 0,
    totalCommutations: 0,
    totalMonthsErased: 0,
    totalYearsErased: 0,
    totalRestitutionAbandoned: 0,
    totalFinesAbandoned: 0,
    fraudCount: 0,
    lifeSentenceCount: 0,
    byCategory: {},
    byType: {},
  };

  for (const entry of entries) {
    const d = entry.data;

    // Clemency type counts
    if (d.clemency_type === "pardon") {
      stats.totalPardons++;
    } else {
      stats.totalCommutations++;
    }
    stats.byType[d.clemency_type] = (stats.byType[d.clemency_type] ?? 0) + 1;

    // Category counts
    stats.byCategory[d.offense_category] = (stats.byCategory[d.offense_category] ?? 0) + 1;

    if (d.offense_category === "fraud" || d.offense_category === "financial crime") {
      stats.fraudCount++;
    }

    // Sentence aggregation
    if (d.sentence_in_months != null) {
      stats.totalMonthsErased += d.sentence_in_months;
    } else if (d.original_sentence?.toLowerCase().includes("life")) {
      stats.lifeSentenceCount++;
    }

    // Financial aggregation
    if (d.restitution != null) {
      stats.totalRestitutionAbandoned += d.restitution;
    }
    if (d.fine != null) {
      stats.totalFinesAbandoned += d.fine;
    }
  }

  stats.totalYearsErased = Math.round((stats.totalMonthsErased / 12) * 10) / 10;

  return stats;
}

/**
 * Filter entries by offense category.
 */
export function filterByCategory(
  entries: CollectionEntry[],
  category: PardonDetail["offense_category"],
): CollectionEntry[] {
  return entries.filter((e) => e.data.offense_category === category);
}

/**
 * Filter entries by clemency type.
 */
export function filterByType(
  entries: CollectionEntry[],
  type: PardonDetail["clemency_type"],
): CollectionEntry[] {
  return entries.filter((e) => e.data.clemency_type === type);
}

/**
 * Filter entries by administration slug.
 */
export function filterByAdministration(
  entries: CollectionEntry[],
  slug: string,
): CollectionEntry[] {
  return entries.filter((e) => e.data.administration_slug === slug);
}

/** Headline-action surfacing — used by the bold homepage's by-administration strip. */
export interface HeadlineAction {
  count: number;
  date: string;
  category: string;
  clemencyType: "pardon" | "commutation";
}

/**
 * Threshold above which a single-day single-category cluster is loud
 * enough to be worth surfacing as an annotation. Tunable.
 */
export const HEADLINE_ACTION_THRESHOLD = 50;

/**
 * Find the largest single-day single-category cluster of grants in
 * `entries`. Returns null if no cluster reaches HEADLINE_ACTION_THRESHOLD.
 *
 * The bold homepage's by-administration strip uses this to render
 * annotations like "1,617 drug commutations on Jan 19, 2017." under
 * each row. Data-driven: as new categories appear (e.g. `january 6`
 * after the AI reclassification effort lands), this surfaces them
 * automatically without code changes.
 */
export function findHeadlineAction(entries: CollectionEntry[]): HeadlineAction | null {
  interface Bucket {
    count: number;
    date: string;
    category: string;
    pardons: number;
    commutations: number;
  }
  const buckets = new Map<string, Bucket>();
  for (const entry of entries) {
    const d = entry.data;
    const key = `${d.grant_date}|${d.offense_category}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        count: 0,
        date: d.grant_date,
        category: d.offense_category,
        pardons: 0,
        commutations: 0,
      };
      buckets.set(key, bucket);
    }
    bucket.count++;
    if (d.clemency_type === "pardon") bucket.pardons++;
    else bucket.commutations++;
  }

  let max: Bucket | null = null;
  for (const bucket of buckets.values()) {
    if (!max || bucket.count > max.count) max = bucket;
  }
  if (!max || max.count < HEADLINE_ACTION_THRESHOLD) return null;

  return {
    count: max.count,
    date: max.date,
    category: max.category,
    clemencyType: max.commutations > max.pardons ? "commutation" : "pardon",
  };
}
