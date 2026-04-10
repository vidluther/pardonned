import "dotenv/config";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, inArray, sql } from "drizzle-orm";
import * as schema from "../db/schema.js";
import { administrations, pardons } from "../db/schema.js";
import type { ParsedGrant } from "./parsers/types.js";
import { parseSentence } from "./parsers/sentences.js";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { assignSlugs } from "./slug-assigner.js";

const DDL = `
CREATE TABLE IF NOT EXISTS administrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  president_name TEXT NOT NULL,
  term_number INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pardons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  administration INTEGER NOT NULL REFERENCES administrations(id),
  recipient_name TEXT NOT NULL,
  slug TEXT,
  clemency_type TEXT NOT NULL CHECK(clemency_type IN ('pardon','commutation')),
  grant_date TEXT NOT NULL,
  warrant_url TEXT,
  source_url TEXT,
  district TEXT,
  offense TEXT NOT NULL,
  offense_category TEXT NOT NULL CHECK(offense_category IN ('violent crime','fraud','drug offense','FACE act','immigration','firearms','financial crime','other')),
  sentence_in_months INTEGER,
  fine REAL,
  restitution REAL,
  original_sentence TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(administration, recipient_name, grant_date, clemency_type)
);
`;

type AdminInsert = typeof administrations.$inferInsert;

const SEED_ADMINISTRATIONS: AdminInsert[] = [
  {
    slug: "mckinley-1",
    president_name: "William McKinley",
    term_number: 1,
    start_date: "1897-03-04",
    end_date: "1901-03-04",
  },
  {
    slug: "mckinley-2",
    president_name: "William McKinley",
    term_number: 2,
    start_date: "1901-03-04",
    end_date: "1901-09-14",
  },
  {
    slug: "t-roosevelt-1",
    president_name: "Theodore Roosevelt",
    term_number: 1,
    start_date: "1901-09-14",
    end_date: "1905-03-04",
  },
  {
    slug: "t-roosevelt-2",
    president_name: "Theodore Roosevelt",
    term_number: 2,
    start_date: "1905-03-04",
    end_date: "1909-03-04",
  },
  {
    slug: "taft-1",
    president_name: "William H. Taft",
    term_number: 1,
    start_date: "1909-03-04",
    end_date: "1913-03-04",
  },
  {
    slug: "wilson-1",
    president_name: "Woodrow Wilson",
    term_number: 1,
    start_date: "1913-03-04",
    end_date: "1917-03-04",
  },
  {
    slug: "wilson-2",
    president_name: "Woodrow Wilson",
    term_number: 2,
    start_date: "1917-03-04",
    end_date: "1921-03-04",
  },
  {
    slug: "harding-1",
    president_name: "Warren Harding",
    term_number: 1,
    start_date: "1921-03-04",
    end_date: "1923-08-02",
  },
  {
    slug: "coolidge-1",
    president_name: "Calvin Coolidge",
    term_number: 1,
    start_date: "1923-08-02",
    end_date: "1925-03-04",
  },
  {
    slug: "coolidge-2",
    president_name: "Calvin Coolidge",
    term_number: 2,
    start_date: "1925-03-04",
    end_date: "1929-03-04",
  },
  {
    slug: "hoover-1",
    president_name: "Herbert Hoover",
    term_number: 1,
    start_date: "1929-03-04",
    end_date: "1933-03-04",
  },
  {
    slug: "fdr-1",
    president_name: "Franklin D. Roosevelt",
    term_number: 1,
    start_date: "1933-03-04",
    end_date: "1937-01-20",
  },
  {
    slug: "fdr-2",
    president_name: "Franklin D. Roosevelt",
    term_number: 2,
    start_date: "1937-01-20",
    end_date: "1941-01-20",
  },
  {
    slug: "fdr-3",
    president_name: "Franklin D. Roosevelt",
    term_number: 3,
    start_date: "1941-01-20",
    end_date: "1945-01-20",
  },
  {
    slug: "fdr-4",
    president_name: "Franklin D. Roosevelt",
    term_number: 4,
    start_date: "1945-01-20",
    end_date: "1945-04-12",
  },
  {
    slug: "truman-1",
    president_name: "Harry S. Truman",
    term_number: 1,
    start_date: "1945-04-12",
    end_date: "1949-01-20",
  },
  {
    slug: "truman-2",
    president_name: "Harry S. Truman",
    term_number: 2,
    start_date: "1949-01-20",
    end_date: "1953-01-20",
  },
  {
    slug: "eisenhower-1",
    president_name: "Dwight D. Eisenhower",
    term_number: 1,
    start_date: "1953-01-20",
    end_date: "1957-01-20",
  },
  {
    slug: "eisenhower-2",
    president_name: "Dwight D. Eisenhower",
    term_number: 2,
    start_date: "1957-01-20",
    end_date: "1961-01-20",
  },
  {
    slug: "kennedy-1",
    president_name: "John F. Kennedy",
    term_number: 1,
    start_date: "1961-01-20",
    end_date: "1963-11-22",
  },
  {
    slug: "lbj-1",
    president_name: "Lyndon B. Johnson",
    term_number: 1,
    start_date: "1963-11-22",
    end_date: "1965-01-20",
  },
  {
    slug: "lbj-2",
    president_name: "Lyndon B. Johnson",
    term_number: 2,
    start_date: "1965-01-20",
    end_date: "1969-01-20",
  },
  {
    slug: "nixon-1",
    president_name: "Richard M. Nixon",
    term_number: 1,
    start_date: "1969-01-20",
    end_date: "1973-01-20",
  },
  {
    slug: "nixon-2",
    president_name: "Richard M. Nixon",
    term_number: 2,
    start_date: "1973-01-20",
    end_date: "1974-08-09",
  },
  {
    slug: "ford-1",
    president_name: "Gerald R. Ford Jr.",
    term_number: 1,
    start_date: "1974-08-09",
    end_date: "1977-01-20",
  },
  {
    slug: "carter-1",
    president_name: "Jimmy E. Carter",
    term_number: 1,
    start_date: "1977-01-20",
    end_date: "1981-01-20",
  },
  {
    slug: "reagan-1",
    president_name: "Ronald W. Reagan",
    term_number: 1,
    start_date: "1981-01-20",
    end_date: "1985-01-20",
  },
  {
    slug: "reagan-2",
    president_name: "Ronald W. Reagan",
    term_number: 2,
    start_date: "1985-01-20",
    end_date: "1989-01-20",
  },
  {
    slug: "bush-sr",
    president_name: "George H.W. Bush",
    term_number: 1,
    start_date: "1989-01-20",
    end_date: "1993-01-20",
  },
  {
    slug: "clinton-1",
    president_name: "William J. Clinton",
    term_number: 1,
    start_date: "1993-01-20",
    end_date: "1997-01-20",
  },
  {
    slug: "clinton-2",
    president_name: "William J. Clinton",
    term_number: 2,
    start_date: "1997-01-20",
    end_date: "2001-01-20",
  },
  {
    slug: "bush-jr-1",
    president_name: "George W. Bush",
    term_number: 1,
    start_date: "2001-01-20",
    end_date: "2005-01-20",
  },
  {
    slug: "bush-jr-2",
    president_name: "George W. Bush",
    term_number: 2,
    start_date: "2005-01-20",
    end_date: "2009-01-20",
  },
  {
    slug: "obama-1",
    president_name: "Barack H. Obama",
    term_number: 1,
    start_date: "2009-01-20",
    end_date: "2013-01-20",
  },
  {
    slug: "obama-2",
    president_name: "Barack H. Obama",
    term_number: 2,
    start_date: "2013-01-20",
    end_date: "2017-01-20",
  },
  {
    slug: "trump-1",
    president_name: "Donald J. Trump",
    term_number: 1,
    start_date: "2017-01-20",
    end_date: "2021-01-20",
  },
  {
    slug: "biden-1",
    president_name: "Joseph R. Biden",
    term_number: 1,
    start_date: "2021-01-20",
    end_date: "2025-01-20",
  },
  {
    slug: "trump-2",
    president_name: "Donald J. Trump",
    term_number: 2,
    start_date: "2025-01-20",
    end_date: null,
  },
];

function getDbPath(): string {
  const raw = process.env.PARDONNED_DB;
  if (!raw) {
    throw new Error("Missing required environment variable: PARDONNED_DB");
  }

  const dbPath = resolve(raw);
  const dir = resolve(dbPath, "..");

  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  return dbPath;
}

const client = createClient({ url: "file:" + getDbPath() });
await client.executeMultiple(DDL);

// In-place migration: ALTER existing DBs that predate the slug column.
// SQLite's CREATE TABLE IF NOT EXISTS won't add columns to an existing
// table, so we check for the column via PRAGMA and ALTER if missing.
// The pardons_slug_unique index is created unconditionally below, OUTSIDE
// this block, because including it in the DDL string caused "no such
// column: slug" errors on existing DBs (CREATE TABLE IF NOT EXISTS is a
// no-op when the table exists, so the index ran before ALTER TABLE added
// the column).
{
  const cols = await client.execute("PRAGMA table_info(pardons)");
  // PRAGMA table_info returns rows with columns: cid, name, type, notnull, dflt_value, pk.
  // libsql exposes them as string-indexed properties, so r.name is the "name" column
  // (the actual column name of the pardon row we're checking for).
  const hasSlug = cols.rows.some((r) => r.name === "slug");
  if (!hasSlug) {
    await client.execute("ALTER TABLE pardons ADD COLUMN slug TEXT");
    console.log("Migrated: added pardons.slug column");
  }
}
// Always ensure the unique index exists (idempotent via IF NOT EXISTS).
// Must stay OUTSIDE the DDL string and OUTSIDE the migration block:
// on existing DBs the migration block adds the column first, and on
// fresh DBs the DDL above creates the column. Either way, the index
// creation here runs after the column is guaranteed to exist.
await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS pardons_slug_unique ON pardons(slug)");

export const db = drizzle(client, { schema });

const adminCount = await db
  .select({ count: sql<number>`count(*)` })
  .from(administrations)
  .get();
if (!adminCount || adminCount.count === 0) {
  await db.insert(administrations).values(SEED_ADMINISTRATIONS).run();
  console.log(`Seeded ${SEED_ADMINISTRATIONS.length} administrations`);
}

const termIdCache = new Map<string, number>();

export async function getTermId(slug: string): Promise<number> {
  const cached = termIdCache.get(slug);
  if (cached !== undefined) return cached;

  const row = await db
    .select({ id: administrations.id })
    .from(administrations)
    .where(eq(administrations.slug, slug))
    .get();

  if (!row) {
    throw new Error(`Could not find an administration for "${slug}"`);
  }

  termIdCache.set(slug, row.id);
  return row.id;
}

export async function getTermForDate(slugs: string[], grantDate: string): Promise<string> {
  if (slugs.length === 1) return slugs[0];

  const data = await db
    .select({
      id: administrations.id,
      slug: administrations.slug,
      start_date: administrations.start_date,
      end_date: administrations.end_date,
    })
    .from(administrations)
    .where(inArray(administrations.slug, slugs))
    .all();

  if (!data.length) {
    throw new Error(`administration not found for slugs ${slugs.join(", ")}`);
  }

  for (const term of data) {
    const start = term.start_date;
    const end = term.end_date || "9999-12-31";
    if (grantDate >= start && grantDate < end) {
      termIdCache.set(term.slug, term.id);
      return term.slug;
    }
  }

  const last = data[data.length - 1];
  termIdCache.set(last.slug, last.id);
  return last.slug;
}

export async function upsertGrants(
  grants: ParsedGrant[],
  slugs: string[],
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < grants.length; i += 50) {
    const batch = grants.slice(i, i + 50);

    const rows = await Promise.all(
      batch.map(async (g) => {
        const slug = await getTermForDate(slugs, g.grant_date);
        const administration = await getTermId(slug);
        const parsed = g.sentence ? parseSentence(g.sentence) : [];
        const first = parsed[0] ?? null;

        return {
          administration,
          recipient_name: g.recipient_name,
          clemency_type: g.pardon_type,
          grant_date: g.grant_date,
          warrant_url: g.warrant_url,
          source_url: g.source_url,
          district: g.district,
          offense: g.offense,
          offense_category: g.offense_category,
          sentence_in_months: first?.sentence_in_months ?? null,
          fine: first?.fine ?? null,
          restitution: first?.restitution ?? null,
          original_sentence: g.sentence ?? null,
        };
      }),
    );

    const seen = new Set<string>();
    const deduped = rows.filter((r) => {
      const key = `${r.administration}|${r.recipient_name}|${r.grant_date}|${r.clemency_type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (deduped.length < rows.length) {
      console.log(`  Deduped batch at index ${i}: ${rows.length} → ${deduped.length}`);
    }

    try {
      const result = await db
        .insert(pardons)
        .values(deduped)
        .onConflictDoUpdate({
          target: [
            pardons.administration,
            pardons.recipient_name,
            pardons.grant_date,
            pardons.clemency_type,
          ],
          set: {
            warrant_url: sql`excluded.warrant_url`,
            source_url: sql`excluded.source_url`,
            district: sql`excluded.district`,
            offense: sql`excluded.offense`,
            offense_category: sql`excluded.offense_category`,
            sentence_in_months: sql`excluded.sentence_in_months`,
            fine: sql`excluded.fine`,
            restitution: sql`excluded.restitution`,
            original_sentence: sql`excluded.original_sentence`,
            updated_at: sql`datetime('now')`,
          },
        })
        .run();

      inserted += result.rowsAffected;
    } catch (err) {
      console.error(`Error upserting batch at index ${i}:`, err);
      skipped += batch.length;
    }
  }

  return { inserted, skipped };
}

/**
 * Load every pardon row, run them through the pure `assignSlugs` collision
 * resolver, and write the results back to the `pardons.slug` column in a
 * single transaction.
 *
 * Always operates on the full dataset, even when called from a single-
 * president scrape (`pnpm scrape:trump2` etc.). This is deliberate:
 * collision resolution needs to see every row, not just the subset that
 * was freshly scraped, because a new trump-2 row can collide with an
 * existing obama row by name.
 *
 * Returns `{ assigned, collisionsResolved }`:
 * - `assigned` equals `slugMap.size`, which equals the total pardons row
 *   count. The assigner algorithm is total (every row gets a slug), so
 *   this is never a subset — treat it as a "rows the algorithm ran over"
 *   counter, not "rows that changed."
 * - `collisionsResolved` is a heuristic count of rows whose final slug
 *   was escalated past the base form (see the comment on the counter
 *   loop below for accuracy caveats).
 */
export async function assignAllPardonSlugs(): Promise<{
  assigned: number;
  collisionsResolved: number;
}> {
  const rows = await db
    .select({
      id: pardons.id,
      recipient_name: pardons.recipient_name,
      grant_date: pardons.grant_date,
      clemency_type: pardons.clemency_type,
    })
    .from(pardons)
    .all();

  const slugMap = assignSlugs(rows);

  // Count how many rows got anything other than a pure base slug — useful
  // as a scrape-log signal to notice regressions in the collision count.
  // Rough signal, not a proof: matches any slug containing a YYYY-MM-DD
  // pattern (covers base-date and base-date-type escalations) but MISSES
  // rows that escalated all the way to `base-<id>` (which end in `-N`,
  // not a date). The `-<id>` fallback is unreachable in current data but
  // could happen in the future — don't trust this counter as exact.
  let collisionsResolved = 0;
  for (const row of rows) {
    const assigned = slugMap.get(row.id);
    if (assigned && /-\d{4}-\d{2}-\d{2}/.test(assigned)) {
      collisionsResolved += 1;
    }
  }

  // Write back in one transaction. Drizzle's libsql driver runs these as
  // individual UPDATE statements inside a transaction; for ~2,500 rows
  // this is fast enough (sub-second on an M-series Mac). On any error
  // (e.g., a UNIQUE constraint violation from a bug in assignSlugs),
  // Drizzle rolls back the entire transaction — slugs are either all
  // written or all left as NULL, never partially populated.
  await db.transaction(async (tx) => {
    for (const [id, slug] of slugMap) {
      await tx.update(pardons).set({ slug }).where(eq(pardons.id, id)).run();
    }
  });

  return { assigned: slugMap.size, collisionsResolved };
}
