import * as cheerio from "cheerio";
import type { PageFormat } from "./types.js";

/**
 * Auto-detect the page format by inspecting the first table's structure.
 *
 * Format A (trump2025): <th> contains "NAME and WARRANT"
 * Format B (table-five): <th> contains "PUBLIC DISCLOSURE"
 * Format C (table-four): <th> contains "NAME" with 4 columns
 * Format D (key-value): No <th> headers, 2 columns
 */
export function detectFormat(html: string): PageFormat {
  const $ = cheerio.load(html);

  const firstTable = $("table").first();
  if (!firstTable.length) {
    throw new Error("No tables found on page — cannot detect format");
  }

  const headers = firstTable
    .find("th")
    .map((_i, th) => $(th).text().trim().toUpperCase())
    .get();

  if (headers.some((h: string) => h.includes("NAME AND WARRANT"))) {
    return "trump2025";
  }

  if (headers.some((h: string) => h.includes("PUBLIC DISCLOSURE"))) {
    return "table-five";
  }

  if (headers.some((h: string) => h === "NAME") && headers.length === 4) {
    return "table-four";
  }

  // No headers or non-standard — check column count
  const firstRow = firstTable.find("tr").first();
  const cellCount = firstRow.find("td").length;
  if (cellCount <= 2 && headers.length === 0) {
    return "key-value";
  }

  // Fallback: if there are headers but we didn't match, try table-four
  if (headers.length >= 3) {
    return "table-four";
  }

  return "key-value";
}
