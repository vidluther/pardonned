import * as cheerio from "cheerio";
import type { ParsedGrant } from "./types.js";
import { resolveUrl } from "./types.js";
import { categorizeOffense } from "./categorize.js";
import { parseDate } from "./parse-date.js";

/**
 * Format A — Trump 2025 combined page.
 *
 * Structure:
 * - <h3> headings with date + count + type, e.g.:
 *   "January 21, 2025 - 1 Pardon"
 *   "March 4, 2025 - 1 Commutation"
 *   "May 28, 2025 - 16 Pardons and 6 Commutations"
 * - Each <h3> is followed by a <table> with columns:
 *   NAME and WARRANT | DISTRICT | SENTENCED | OFFENSE
 * - Name cell links to warrant PDF
 * - Skip headings whose next sibling is a <p> (links to external pages like J6)
 */
export function parseTrump2025(html: string, sourceUrl: string): ParsedGrant[] {
  const $ = cheerio.load(html);
  const grants: ParsedGrant[] = [];

  const headings = $("h3");

  headings.each((_i, heading) => {
    const headingText = $(heading).text().trim();

    // Skip headings without a date pattern
    if (!/\w+ \d{1,2}, \d{4}/.test(headingText)) return;

    // Find the next sibling — if it's not a table, skip (e.g., J6 or election links)
    const nextSibling = $(heading).next();
    if (!nextSibling.is("table")) return;

    const table = nextSibling;
    const dateStr = parseDate(headingText);
    if (!dateStr) return;

    const { pardonCount, commutationCount } = parseCounts(headingText);
    const rows = table.find("tbody tr, tr").not(":has(th)");

    rows.each((rowIdx, row) => {
      const cells = $(row).find("td");
      if (cells.length < 4) return;

      const nameCell = cells.eq(0);
      const name = nameCell.text().trim();
      if (!name) return;

      const link = nameCell.find("a");
      const warrantUrl = resolveUrl(link.attr("href"));

      const district = cells.eq(1).text().trim() || null;
      const sentence = cells.eq(2).text().trim() || null;
      const offense = cells.eq(3).text().trim();

      // Determine clemency type from heading counts
      let pardonType: "pardon" | "commutation";
      if (commutationCount === 0) {
        pardonType = "pardon";
      } else if (pardonCount === 0) {
        pardonType = "commutation";
      } else {
        // Mixed section: first N are pardons, rest are commutations
        pardonType = rowIdx < pardonCount ? "pardon" : "commutation";
      }

      grants.push({
        recipient_name: name,
        warrant_url: warrantUrl,
        district,
        sentence,
        offense,
        offense_category: categorizeOffense(offense),
        pardon_type: pardonType,
        grant_date: dateStr,
        source_url: sourceUrl,
      });
    });
  });

  return grants;
}

function parseCounts(heading: string): {
  pardonCount: number;
  commutationCount: number;
} {
  let pardonCount = 0;
  let commutationCount = 0;

  // Match patterns like "16 Pardons and 6 Commutations", "1 Pardon", "3 Commutations"
  const pardonMatch = heading.match(/(\d+)\s+Pardons?/i);
  const commutationMatch = heading.match(/(\d+)\s+Commutations?/i);

  // Also match "(Amended)" suffix variants
  if (pardonMatch) pardonCount = parseInt(pardonMatch[1], 10);
  if (commutationMatch) commutationCount = parseInt(commutationMatch[1], 10);

  return { pardonCount, commutationCount };
}
