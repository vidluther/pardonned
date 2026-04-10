import { slugify } from "./slugify";

export interface AssignerRow {
  id: number;
  recipient_name: string;
  grant_date: string;
  clemency_type: "pardon" | "commutation";
}

/**
 * Assign a unique URL slug to every pardon row.
 *
 * Algorithm: deterministic pass in ascending `id` order. For each row,
 * compute a base slug via `slugify(recipient_name)` (which consults the
 * manual override map in `pardon-slug-overrides.ts` before falling back
 * to the normalize-and-hash algorithm). Then walk a four-step escalation
 * chain and claim the first candidate not already taken:
 *
 *   1. base
 *   2. base-<grant_date>
 *   3. base-<grant_date>-<clemency_type>
 *   4. base-<id>   (guaranteed unique because ids are unique)
 *
 * The first-wins ordering is intentional: the row with the smallest id
 * (typically the earliest-scraped one) keeps the clean base slug. Later
 * colliding rows carry the disambiguation information in their URL.
 *
 * Every candidate in the winner row's chain is pre-claimed so that a
 * subsequent row with the same base/date/type cannot "steal" a shorter
 * form that belongs to this row's escalation chain. This forces proper
 * escalation for rows sharing a base slug and a date.
 *
 * Returns a `Map<id, slug>`. The caller is responsible for writing the
 * slugs back to the database; this function is pure so it can be tested
 * without a DB.
 */
export function assignSlugs(rows: AssignerRow[]): Map<number, string> {
  const sorted = [...rows].sort((a, b) => a.id - b.id);
  const taken = new Set<string>();
  const result = new Map<number, string>();

  for (const row of sorted) {
    const base = slugify(row.recipient_name);
    const candidates = [
      base,
      `${base}-${row.grant_date}`,
      `${base}-${row.grant_date}-${row.clemency_type}`,
      `${base}-${row.id}`,
    ];

    // Find the first candidate not yet claimed by any earlier row.
    let assigned: string | undefined;
    for (const candidate of candidates) {
      if (!taken.has(candidate)) {
        assigned = candidate;
        break;
      }
    }

    // Pre-claim every candidate in this row's chain. Later rows sharing
    // the same base/date/type will see these slots as taken and escalate
    // past them.
    for (const candidate of candidates) {
      taken.add(candidate);
    }

    // assigned is always defined: `base-<id>` is unique because ids are unique
    // and we pre-claim all candidates, so `base-<id>` for a prior row can
    // only be in `taken` if a prior row's id happened to produce the same
    // string — impossible since each id is distinct.
    result.set(row.id, assigned!);
  }

  return result;
}
