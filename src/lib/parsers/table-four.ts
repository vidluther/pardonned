import * as cheerio from "cheerio";
import type { ParsedGrant } from "./types.js";
import { categorizeOffense } from "./categorize.js";

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

function parseDate(text: string): string | null {
  const match = text.match(/(\w+)\s+(\d{1,2}),\s+(\d{4})/);
  if (!match) return null;

  const months: Record<string, string> = {
    January: "01",
    February: "02",
    March: "03",
    April: "04",
    May: "05",
    June: "06",
    July: "07",
    August: "08",
    September: "09",
    October: "10",
    November: "11",
    December: "12",
  };

  const month = months[match[1]];
  if (!month) return null;

  const day = match[2].padStart(2, "0");
  return `${match[3]}-${month}-${day}`;
}
