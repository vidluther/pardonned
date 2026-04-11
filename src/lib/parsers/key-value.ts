import * as cheerio from "cheerio";
import type { ParsedGrant } from "./types.js";
import { categorizeOffense } from "./categorize.js";
import { parseDate } from "./parse-date.js";

type CheerioTable = cheerio.Cheerio<any>;

/**
 * Format D — Obama and earlier (separate pardons/commutations pages).
 *
 * These pages use 2-column key-value tables with variable rows per person.
 *
 * Pardons (3 rows per person):
 *   [empty, Name] → ["Offense:", text(District)] → ["Sentence:", text]
 *
 * Commutations (4-5+ rows per person):
 *   [empty, Name] → ["Offense:", text] → ["District/Date:", text]
 *   → ["Sentence:", text] → optional ["Terms of grant:", text]
 *   → optional continuation rows [empty, "2. ..."]
 *
 * Bush commutations use a SINGLE table with 1-cell date separator rows.
 *
 * The parser uses label-based accumulation: a new person starts only when
 * we see an empty-label row whose value looks like a name (not a numbered
 * continuation like "2. 45 months...").
 */
export function parseKeyValue(
  html: string,
  pardonType: "pardon" | "commutation",
  sourceUrl: string,
): ParsedGrant[] {
  const $ = cheerio.load(html);
  const grants: ParsedGrant[] = [];

  // Strategy: collect date headings and tables, then match them.
  // Some pages interleave headings and tables (1:1 mapping by position),
  // while others have a single table with in-line date rows.

  const dateHeadings = $("h2")
    .filter((_i, h) => parseDate($(h).text().trim()) !== null)
    .toArray();

  const tables = $("table").toArray();

  if (dateHeadings.length > 0 && tables.length > 0) {
    // Use nextUntil to find tables between each heading and the next H2
    let matched = 0;
    for (const heading of dateHeadings) {
      const headingText = $(heading).text().trim();
      const dateStr = parseDate(headingText)!;

      const betweenTables = $(heading).nextUntil("h2").filter("table");
      betweenTables.each((_ti, tbl) => {
        const tableGrants = parseTable($, $(tbl), pardonType, sourceUrl, dateStr);
        grants.push(...tableGrants);
      });
      matched += betweenTables.length;
    }

    if (matched > 0) return grants;
  }

  // Fallback: process all tables directly (handles single-table with in-line dates)
  console.log(`    [key-value] Fallback: processing ${tables.length} tables with inline dates`);
  for (const table of tables) {
    const tableGrants = parseTable(
      $,
      $(table),
      pardonType,
      sourceUrl,
      null, // date will come from in-line date rows
    );
    grants.push(...tableGrants);
  }

  return grants;
}

function parseTable(
  $: cheerio.CheerioAPI,
  table: CheerioTable,
  pardonType: "pardon" | "commutation",
  sourceUrl: string,
  defaultDate: string | null,
): ParsedGrant[] {
  // Mixed-format pages (e.g. Obama pardons) contain sub-tables that use
  // the 4-column NAME | DISTRICT | SENTENCED | OFFENSE layout inside a
  // page that otherwise uses key-value format. Detect these and parse
  // them with the 4-column logic instead of key-value accumulation.
  if (isFourColumnTable($, table) && defaultDate) {
    return parseFourColumnSubTable($, table, pardonType, sourceUrl, defaultDate);
  }

  const grants: ParsedGrant[] = [];
  const rows = table.find("tr");

  let current: PersonRecord | null = null;
  let currentDate = defaultDate;
  let lastField: string | null = null; // Track which field was last set for continuations

  rows.each((_r, row) => {
    const cells = $(row).find("td");

    // Check for <th> name rows (older Obama format uses TH for person names)
    if (cells.length === 0) {
      const thCells = $(row).find("th");
      if (thCells.length > 0) {
        // TH rows contain person names — process each TH as a separate person.
        // Defensive: some Obama sub-tables use <th> for COLUMN HEADERS, not
        // person names (e.g. <th>NAME</th><th>DISTRICT</th>...). These slip
        // past isNameValue() because the strings look name-ish. Skip any TH
        // whose text matches a known column-header sentinel.
        thCells.each((_ti, th) => {
          const name = $(th).text().trim();
          if (isHeaderSentinel(name)) return;
          if (name && isNameValue(name)) {
            // Flush previous person
            if (current?.name && currentDate) {
              grants.push(buildGrant(current, pardonType, currentDate, sourceUrl));
            }
            current = {
              name,
              offense: null,
              district: null,
              sentence: null,
              terms: null,
            };
            lastField = null;
          }
        });
      }
      return;
    }

    // Single-cell row: could be an in-line date separator OR a name (older format)
    if (cells.length === 1) {
      const cellText = cells.eq(0).text().trim();
      if (!cellText) return;

      const parsed = parseDate(cellText);
      if (parsed) {
        // Date separator row
        if (current?.name) {
          grants.push(buildGrant(current, pardonType, currentDate!, sourceUrl));
          current = null;
        }
        currentDate = parsed;
      } else if (isNameValue(cellText)) {
        // Single-cell name row (older Obama format: name in one cell, no empty first col)
        if (current?.name && currentDate) {
          grants.push(buildGrant(current, pardonType, currentDate, sourceUrl));
        }
        current = {
          name: cellText,
          offense: null,
          district: null,
          sentence: null,
          terms: null,
        };
        lastField = null;
      }
      return;
    }

    const label = cells.eq(0).text().trim();
    const value = cells.eq(1).text().trim();

    if (label === "") {
      // Empty label: either a new person name or a continuation row
      if (isNameValue(value)) {
        // Flush previous person
        if (current?.name && currentDate) {
          grants.push(buildGrant(current, pardonType, currentDate, sourceUrl));
        }
        current = {
          name: value,
          offense: null,
          district: null,
          sentence: null,
          terms: null,
        };
        lastField = null;
      } else if (current && lastField) {
        // Continuation row — append to the last field
        appendToField(current, lastField, value);
      }
    } else if (current) {
      const normalizedLabel = label.toLowerCase().replace(/[:\s]/g, "");

      if (normalizedLabel === "offense" || normalizedLabel === "offenses") {
        current.offense = value;
        lastField = "offense";
      } else if (
        normalizedLabel === "district" ||
        normalizedLabel.includes("district") ||
        normalizedLabel === "district/date"
      ) {
        const parsed = parseDistrictDate(value);
        current.district = parsed.district;
        lastField = "district";
      } else if (normalizedLabel === "sentence") {
        current.sentence = value;
        lastField = "sentence";
      } else if (normalizedLabel === "sentenced") {
        current.sentence = value;
        lastField = "sentence";
      } else if (normalizedLabel === "termsofgrant" || normalizedLabel === "terms") {
        current.terms = value;
        lastField = "terms";
      }
    }
  });

  // Flush last person
  if (current !== null && currentDate) {
    grants.push(buildGrant(current, pardonType, currentDate, sourceUrl));
  }

  return grants;
}

/**
 * Check whether a table uses the 4-column layout (NAME | DISTRICT | SENTENCED | OFFENSE).
 * Used to detect mixed-format pages where some sub-tables use a different layout
 * than the one that format-detection chose.
 */
function isFourColumnTable($: cheerio.CheerioAPI, table: CheerioTable): boolean {
  const headerRow = table.find("tr").first();
  const thCells = headerRow.find("th");
  if (thCells.length < 4) return false;

  const headers = thCells
    .map((_i, th) => $(th).text().trim().toUpperCase())
    .get();

  return (
    headers.length >= 4 &&
    headers[0] === "NAME" &&
    headers[1] === "DISTRICT" &&
    headers[2] === "SENTENCED" &&
    headers[3] === "OFFENSE"
  );
}

/**
 * Parse a 4-column sub-table found inside a key-value format page.
 * Mirrors the logic of parseTableFour but uses the date from the surrounding h2 heading.
 */
function parseFourColumnSubTable(
  $: cheerio.CheerioAPI,
  table: CheerioTable,
  pardonType: "pardon" | "commutation",
  sourceUrl: string,
  grantDate: string,
): ParsedGrant[] {
  const grants: ParsedGrant[] = [];
  const rows = table.find("tr").not(":has(th)");

  rows.each((_rowIdx, row) => {
    const cells = $(row).find("td");
    if (cells.length < 4) return;

    const name = cells.eq(0).text().trim();
    if (!name) return;
    // Skip residual header rows that use <td> instead of <th>
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
      grant_date: grantDate,
      source_url: sourceUrl,
    });
  });

  return grants;
}

interface PersonRecord {
  name: string;
  offense: string | null;
  district: string | null;
  sentence: string | null;
  terms: string | null;
}

/**
 * Column-header strings that appear as <th> cells in some Obama sub-tables
 * and would otherwise be parsed as "person" rows, producing garbage records
 * with recipient_name values like "NAME"/"DISTRICT"/"SENTENCED"/"OFFENSE".
 */
const COLUMN_HEADER_SENTINELS = new Set(["NAME", "DISTRICT", "SENTENCED", "OFFENSE"]);

function isHeaderSentinel(value: string): boolean {
  return COLUMN_HEADER_SENTINELS.has(value.trim().toUpperCase());
}

/**
 * Determine if a value in an empty-label row is a person's name (vs a continuation).
 * Continuation rows typically start with a number+period like "2." or "3."
 */
function isNameValue(value: string): boolean {
  if (!value) return false;
  // Numbered continuations: "2. 45 months' imprisonment..."
  if (/^\d+\./.test(value)) return false;
  // Sentence-like continuations that start with lowercase or special chars
  if (/^[a-z(]/.test(value)) return false;
  // Values that look like sentences (contain common sentence keywords right at start)
  if (/^(?:Life|Time served|No punishment)/i.test(value) && !value.includes(",")) {
    // Could be a name like "Life" or a sentence — check for imprisonment keywords
    if (/imprisonment|probation|supervised|confinement/i.test(value)) return false;
  }
  return true;
}

function appendToField(person: PersonRecord, field: string, value: string): void {
  switch (field) {
    case "offense":
      person.offense = person.offense ? `${person.offense}; ${value}` : value;
      break;
    case "sentence":
      person.sentence = person.sentence ? `${person.sentence}; ${value}` : value;
      break;
    case "district":
      person.district = person.district ? `${person.district}; ${value}` : value;
      break;
    case "terms":
      person.terms = person.terms ? `${person.terms}; ${value}` : value;
      break;
  }
}

function buildGrant(
  person: PersonRecord,
  pardonType: "pardon" | "commutation",
  grantDate: string,
  sourceUrl: string,
): ParsedGrant {
  let offense = person.offense || "";
  let district = person.district;

  // If no separate district field, try extracting from offense text
  if (!district && offense) {
    const extracted = extractDistrict(offense);
    offense = extracted.offense;
    district = extracted.district;
  }

  // Append terms to sentence if present
  let sentence = person.sentence;
  if (person.terms) {
    sentence = sentence ? `${sentence} (Terms: ${person.terms})` : person.terms;
  }

  return {
    recipient_name: person.name,
    warrant_url: null,
    district,
    sentence,
    offense,
    offense_category: categorizeOffense(offense),
    pardon_type: pardonType,
    grant_date: grantDate,
    source_url: sourceUrl,
  };
}

function parseDistrictDate(text: string): { district: string | null } {
  // Handle formats like:
  // "District of Maryland; October 8, 2008"
  // "1. & 2. District of South Carolina; 1. & 2. December 18, 2008"
  const parts = text.split(";");
  const district = parts[0]?.trim() || null;
  return { district };
}

function extractDistrict(offenseText: string): {
  offense: string;
  district: string | null;
} {
  const districtPattern =
    /\(([^)]*(?:District|Division|Court|Puerto Rico|Guam|Virgin Islands)[^)]*)\)\s*$/i;
  const match = offenseText.match(districtPattern);

  if (match) {
    const district = match[1].trim();
    const offense = offenseText.slice(0, match.index).trim();
    return { offense, district };
  }

  return { offense: offenseText, district: null };
}


