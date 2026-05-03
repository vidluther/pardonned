import type { PardonDetail } from "../loaders/pardon-details";
import { formatAdministrationDisplayName } from "./president-names";

/**
 * Atom 1.0 feed generator for the recent-grants feed at /recent.xml.
 *
 * Pure function: takes pre-sorted entries plus site metadata, returns
 * an Atom 1.0 XML document as a string. Kept separate from the APIRoute
 * so the rendering logic is unit-testable without mocking
 * `getCollection`.
 */

export interface AtomEntry {
  id: string;
  data: PardonDetail;
}

export interface AtomFeedOptions {
  siteUrl: string;
  feedTitle: string;
  feedSubtitle: string;
  authorName: string;
  /** Maximum number of entries to include. Default 50. */
  limit?: number;
  /**
   * Optional fuller set of entries used solely to derive per-president
   * term counts (so multi-term display-name suffixes resolve correctly
   * when `entries` is a scoped subset, e.g. current-administration only).
   * Defaults to `entries` itself.
   */
  termContextEntries?: AtomEntry[];
}

const DEFAULT_LIMIT = 50;

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc3339(isoDate: string): string {
  // grant_date is stored as YYYY-MM-DD; Atom requires RFC 3339 timestamps.
  // Use noon UTC to avoid timezone drift around date boundaries.
  return `${isoDate}T12:00:00Z`;
}

function buildTermsIndex(entries: AtomEntry[]): Map<string, Set<number>> {
  const index = new Map<string, Set<number>>();
  for (const entry of entries) {
    let terms = index.get(entry.data.president_name);
    if (!terms) {
      terms = new Set();
      index.set(entry.data.president_name, terms);
    }
    terms.add(entry.data.term_number);
  }
  return index;
}

/**
 * Build an Atom 1.0 feed from pardon detail entries.
 *
 * `entries` should be the full set (used to compute administration display
 * names with correct multi-term suffixes). The function sorts internally
 * by `grant_date` desc and slices to `limit`.
 */
export function buildAtomFeed(entries: AtomEntry[], options: AtomFeedOptions): string {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const sorted = entries
    .slice()
    .sort((a, b) => b.data.grant_date.localeCompare(a.data.grant_date))
    .slice(0, limit);

  const feedUpdated =
    sorted.length > 0 ? toRfc3339(sorted[0].data.grant_date) : new Date().toISOString();

  const termsPerPresident = buildTermsIndex(options.termContextEntries ?? entries);

  const entriesXml = sorted
    .map((entry) => {
      const d = entry.data;
      const detailUrl = `${options.siteUrl}/pardon/details/${d.slug}`;
      const adminDisplay = formatAdministrationDisplayName({
        presidentName: d.president_name,
        termNumber: d.term_number,
        isOnlyTerm: termsPerPresident.get(d.president_name)!.size === 1,
      });
      const clemencyLabel = d.clemency_type === "pardon" ? "Pardon" : "Commutation";
      const summary = `${clemencyLabel} granted to ${d.recipient_name} by ${adminDisplay} on ${d.grant_date}. Offense: ${d.offense}.`;

      return `  <entry>
    <id>tag:pardonned.com,${d.grant_date}:pardon-${escapeXml(d.slug)}</id>
    <title>${escapeXml(d.recipient_name)} — ${clemencyLabel}</title>
    <link rel="alternate" type="text/html" href="${escapeXml(detailUrl)}"/>
    <published>${toRfc3339(d.grant_date)}</published>
    <updated>${toRfc3339(d.grant_date)}</updated>
    <author><name>${escapeXml(adminDisplay)}</name></author>
    <summary type="text">${escapeXml(summary)}</summary>
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <id>${options.siteUrl}/recent.xml</id>
  <title>${escapeXml(options.feedTitle)}</title>
  <subtitle>${escapeXml(options.feedSubtitle)}</subtitle>
  <link rel="self" type="application/atom+xml" href="${options.siteUrl}/recent.xml"/>
  <link rel="alternate" type="text/html" href="${options.siteUrl}/recent"/>
  <updated>${feedUpdated}</updated>
  <author><name>${escapeXml(options.authorName)}</name></author>
${entriesXml}
</feed>
`;
}
