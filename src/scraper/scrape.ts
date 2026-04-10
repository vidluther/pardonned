import "dotenv/config";
import { fetchPageHtml, closeBrowser } from "./browser.js";
import { upsertGrants, assignAllPardonSlugs } from "../lib/db.js";
import { PRESIDENT_SOURCES } from "./presidents.js";
import { detectFormat } from "../lib/parsers/detect.js";
import { parseTrump2025 } from "../lib/parsers/trump2025.js";
import { parseTableFive } from "../lib/parsers/table-five.js";
import { parseTableFour } from "../lib/parsers/table-four.js";
import { parseKeyValue } from "../lib/parsers/key-value.js";
import type { ParsedGrant } from "../lib/parsers/types.js";

async function scrapePage(
  url: string,
  pardonType?: "pardon" | "commutation",
): Promise<ParsedGrant[]> {
  console.log(`  Fetching: ${url}`);
  const html = await fetchPageHtml(url);
  const format = detectFormat(html);
  console.log(`  Detected format: ${format}`);

  switch (format) {
    case "trump2025":
      return parseTrump2025(html, url);
    case "table-five":
      return parseTableFive(html, pardonType!, url);
    case "table-four":
      return parseTableFour(html, pardonType!, url);
    case "key-value":
      return parseKeyValue(html, pardonType!, url);
  }
}

async function scrapePresident(slugFilter?: string): Promise<void> {
  const sources = slugFilter
    ? PRESIDENT_SOURCES.filter((s) =>
        s.slugs.some((slug) => {
          // Exact match (e.g., "trump-2" matches "trump-2")
          if (slug === slugFilter) return true;
          // Prefix match only when filter has no term number (e.g., "obama" matches "obama-1", "obama-2")
          if (!/-\d+$/.test(slugFilter)) {
            return slug.startsWith(slugFilter + "-") || slug === slugFilter;
          }
          return false;
        }),
      )
    : PRESIDENT_SOURCES;

  if (sources.length === 0) {
    console.error(`No sources found for "${slugFilter}".`);
    console.error("Available:", PRESIDENT_SOURCES.flatMap((s) => s.slugs).join(", "));
    process.exit(1);
  }

  for (const source of sources) {
    console.log(`\nScraping: ${source.slugs.join(", ")}`);

    let allGrants: ParsedGrant[] = [];

    if (source.combined) {
      const grants = await scrapePage(source.combined);
      allGrants.push(...grants);
    } else {
      if (source.pardons) {
        const grants = await scrapePage(source.pardons, "pardon");
        allGrants.push(...grants);
      }
      if (source.commutations) {
        const grants = await scrapePage(source.commutations, "commutation");
        allGrants.push(...grants);
      }
    }

    console.log(`  Parsed ${allGrants.length} grants total`);

    if (allGrants.length > 0) {
      const result = await upsertGrants(allGrants, source.slugs);
      console.log(`  Inserted: ${result.inserted}, Skipped: ${result.skipped}`);
    }
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let presidentFilter: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--president" && args[i + 1]) {
      presidentFilter = args[i + 1];
      i++;
    }
  }

  try {
    if (presidentFilter === "all" || !presidentFilter) {
      console.log("Scraping all configured presidents...");
      await scrapePresident();
    } else {
      await scrapePresident(presidentFilter);
    }

    // Always runs across ALL pardon rows, not just the president that
    // was scraped — collision resolution needs the full dataset to be
    // correct. So `pnpm scrape:trump2` will still log ~2,500 assigned.
    console.log("\nAssigning slugs...");
    const { assigned, collisionsResolved } = await assignAllPardonSlugs();
    console.log(`  Assigned ${assigned} slugs (${collisionsResolved} collision-resolved)`);
  } finally {
    await closeBrowser();
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
