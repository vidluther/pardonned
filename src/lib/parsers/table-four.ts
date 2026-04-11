import * as cheerio from "cheerio";
import type { ParsedGrant } from "./types.js";
import { categorizeOffense } from "./categorize.js";
import { parseDate } from "./parse-date.js";

/**
 * Format C — Bush W. (separate pardons/commutations pages).
 *
 * Structure:
 * - <h2> headings with dates
 * - Tables with 4 columns: NAME | DISTRICT | SENTENCED | OFFENSE
 * - No warrant links
 * - Clemency type from URL
 */
export function parseTableFour(
  html: string,
  pardonType: "pardon" | "commutation",
  sourceUrl: string,
): ParsedGrant[] {
  const $ = cheerio.load(html);
  const grants: ParsedGrant[] = [];

  const headings = $("h2");

  headings.each((_i, heading) => {
    const headingText = $(heading).text().trim();
    const dateStr = parseDate(headingText);
    if (!dateStr) return;

    const table = $(heading).nextAll("table").first();
    if (!table.length) return;

    const rows = table.find("tr").not(":has(th)");

    rows.each((_rowIdx, row) => {
      const cells = $(row).find("td");
      if (cells.length < 4) return;

      const name = cells.eq(0).text().trim();
      if (!name) return;
      // Defensive: skip header rows that use <td> instead of <th>. Obama-era
      // DOJ HTML is inconsistent — the first table on a page often has proper
      // <th> headers (caught by the :has(th) filter above), but later tables
      // on the same page reuse <td> for their header rows and slip through.
      if (name.toUpperCase() === "NAME") return;

      const district = cells.eq(1).text().trim() || null;
      const sentence = cells.eq(2).text().trim() || null;
      const offense = cells.eq(3).text().trim();

      grants.push({
        recipient_name: name,
        warrant_url: null,
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


