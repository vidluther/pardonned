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
    stats.byCategory[d.offense_category] =
      (stats.byCategory[d.offense_category] ?? 0) + 1;

    if (d.offense_category === "fraud" || d.offense_category === "financial crime") {
      stats.fraudCount++;
    }

    // Sentence aggregation
    if (d.sentence_in_months != null) {
      stats.totalMonthsErased += d.sentence_in_months;
    } else if (
      d.original_sentence?.toLowerCase().includes("life")
    ) {
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

  stats.totalYearsErased =
    Math.round((stats.totalMonthsErased / 12) * 10) / 10;

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
