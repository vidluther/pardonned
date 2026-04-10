/**
 * Format an administration's display name for UI use.
 *
 * Single-term presidents (isOnlyTerm=true) render as just the name.
 * Multi-term presidents render with an ordinal suffix, e.g.
 * "Donald Trump (First Term)".
 */
export function formatAdministrationDisplayName(
  presidentName: string,
  termNumber: number,
  isOnlyTerm: boolean,
): string {
  if (isOnlyTerm) {
    return presidentName;
  }
  return `${presidentName} (${ordinalTermLabel(termNumber)})`;
}

const ORDINAL_TERM_LABELS: Record<number, string> = {
  1: "First Term",
  2: "Second Term",
  3: "Third Term",
  4: "Fourth Term",
};

function ordinalTermLabel(termNumber: number): string {
  return ORDINAL_TERM_LABELS[termNumber] ?? `Term ${termNumber}`;
}

/**
 * A single administration's row in the index — everything a filter UI,
 * headline, or comparison column needs, keyed by administration slug.
 */
export interface AdministrationIndexEntry {
  slug: string;
  displayName: string;
  presidentName: string;
  termNumber: number;
  count: number;
}

/**
 * Minimum shape the index builder needs from each collection entry.
 * Matches what the pardon-details loader already exposes via its schema
 * (administration_slug, president_name, term_number are joined from the
 * administrations table during loading).
 */
interface MinimalEntry {
  data: {
    administration_slug: string;
    president_name: string;
    term_number: number;
  };
}

/**
 * Walk a pardon-details collection and build a per-slug index of
 * display metadata. Handles the "is this president's only term in the
 * dataset" decision by counting distinct term numbers per president_name
 * in a first pass, then producing the index in a second pass.
 *
 * Usage in an Astro page:
 * ```ts
 * import { getCollection } from "astro:content";
 * import { getAdministrationIndex } from "../lib/president-names";
 *
 * const entries = await getCollection("pardonDetails");
 * const index = getAdministrationIndex(entries);
 * // index.get("biden-1")?.displayName === "Joe Biden"
 * ```
 */
export function getAdministrationIndex(
  entries: MinimalEntry[],
): Map<string, AdministrationIndexEntry> {
  const termsPerPresident = new Map<string, Set<number>>();
  for (const entry of entries) {
    const { president_name, term_number } = entry.data;
    let terms = termsPerPresident.get(president_name);
    if (!terms) {
      terms = new Set();
      termsPerPresident.set(president_name, terms);
    }
    terms.add(term_number);
  }

  const index = new Map<string, AdministrationIndexEntry>();
  for (const entry of entries) {
    const { administration_slug, president_name, term_number } = entry.data;
    const existing = index.get(administration_slug);
    if (existing) {
      existing.count++;
      continue;
    }
    const isOnlyTerm = termsPerPresident.get(president_name)!.size === 1;
    index.set(administration_slug, {
      slug: administration_slug,
      displayName: formatAdministrationDisplayName(
        president_name,
        term_number,
        isOnlyTerm,
      ),
      presidentName: president_name,
      termNumber: term_number,
      count: 1,
    });
  }

  return index;
}
