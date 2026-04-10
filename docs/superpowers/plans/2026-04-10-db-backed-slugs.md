# DB-Backed Pardon Slugs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move pardon slug generation from build-time JS (`src/lib/slugify.ts` called from every consuming page) into a single post-scrape pass that writes a unique, collision-resolved slug into a new `pardons.slug` column. The content collection loader exposes that column directly, so all pages read `grant.data.slug` instead of recomputing. Fixes both a parser bug that's been producing garbage "NAME"/"DISTRICT"/"SENTENCED"/"OFFENSE" rows on the Obama pages and the long-standing ~33-page gap between DB row count and built page count caused by silent `getStaticPaths` dedup on collision.

**Architecture:** Three small additions + one column. A defensive `name !== "NAME"` check in the two `<td>`-vs-`<th>` parsers (`table-four.ts`, `table-five.ts`) stops the garbage rows at the source. A new pure function `assignSlugs(rows)` in `src/lib/slug-assigner.ts` takes a deterministic `id ASC` pass over every pardon, calls the existing `slugify(name)` to get a base slug (which still respects the manual override map), and walks an escalation chain `base → base-date → base-date-type → base-id` on collision, so row-1-wins-the-clean-slug. A wrapper `assignAllPardonSlugs()` in `src/lib/db.ts` runs that function against all rows and writes back in a single transaction. `scrape.ts` calls it once after all presidents are scraped. The loader exposes `slug` on every entry. Pages drop their `slugify()` imports and read `grant.data.slug` directly.

**Tech Stack:** TypeScript, Drizzle ORM, SQLite, vitest 4, Astro 6 content collections, cheerio. No new dependencies.

**Related issues:** Closes #12, closes #13. Uncovers and fixes an Obama-parser bug as a precondition.

---

## Context

GitHub issue #13 reported that the build log showed ~30 pardons "missing" from `dist/` because Astro's `getStaticPaths` silently dedupes when two entries produce the same `slug` param. Issue #12 proposed moving slug generation out of the pages and into the DB via a "rules engine" at scrape time, so slugs can be unique-constrained at the schema level. Both were filed as separate issues but the #13 body explicitly notes that "this work pairs naturally with #12" — a DB-backed slug column solves both problems in one pass.

Before writing this plan, a one-off investigation script ran `slugify()` over every row in `data/pardonned.db` and enumerated collision clusters. Findings:

- **Total pardons:** 2,349 (grown from 2,149 at the time #13 was filed).
- **Distinct slugs:** 2,316. Rows lost to dedup: **33**.
- **Of those 33 lost rows, ~16 are literal parser garbage**, not a slug problem. Four slug clusters — `name`, `district`, `sentenced`, `offense` — each contain **5 rows** where the `recipient_name` value is literally the string `"NAME"`, `"DISTRICT"`, `"SENTENCED"`, or `"OFFENSE"`. All 20 come from `obama-1` and `obama-2`. They are table-header rows scraped as if they were pardon records.

The parser bug is in both `src/lib/parsers/table-four.ts:32` and `src/lib/parsers/table-five.ts:34`:

```ts
const rows = table.find("tr").not(":has(th)");
```

This filter is supposed to skip header rows by excluding any `<tr>` that contains a `<th>` element. But if the DOJ HTML uses `<td>` for some header rows instead (which it does on the Obama pages for at least 5 dated sub-tables), the filter misses them entirely and the loop parses them as pardon records. Defensive fix: after extracting the name cell, check whether it equals `"NAME"` (case-insensitive) and skip.

That accounts for 16 of the 33 missing pages. The remaining 17 clusters are genuine data collisions and break down into three categories:

1. **Admin-scoped near-duplicates (trump-2):** Three rows (Julio M. Herrera Velutini, Mark T. Rossini, Wanda Vazquez Garced) are each listed twice 5 days apart (2026-01-15 + 2026-01-20), almost certainly a DOJ prelim list followed by the final list. Imaad Shah Zuberi listed 5 months apart (2025-05-28 + 2025-10-01).
2. **Real within-admin double events (trump-1):** The Hammonds (Dwight + Steven) received simultaneous `pardon` + `commutation` on 2018-07-10. Alice Marie Johnson received a 2018 commutation and a 2020 pardon. Judith Negron / Crystal Munoz / Tynice Nichole Hall each received a Feb 18 2020 commutation followed by a Dec 22 2020 commutation (the well-known Trump-1 clemency list that was expanded). These are historically distinct events that deserve distinct pages.
3. **Cross-administration name matches:** Joseph Schwartz, Connie Avalos, Scottie Ladon Dixon, Michael Anthony Tedesco, Jose Alonso Compean — each has rows under two different presidents. May or may not be the same person; domain call.
4. **One data-quality oddity:** `brittany-krambeck` collides with `brittany-krambeck*` (asterisk, biden-1, different grant dates) — probably a DOJ footnote marker scraped as part of the name. Out of scope for this plan; would need parser work on the asterisk handling.

### Slug collision resolution: first-wins + escalation chain

Per user decision: first row by `id ASC` keeps the clean base slug; subsequent colliding rows escalate through `base-date → base-date-type → base-id`. Examples of the resulting URLs:

- `/pardon/details/alice-marie-johnson` → 2018 commutation (row #645, earliest id)
- `/pardon/details/alice-marie-johnson-2020-08-28` → 2020 pardon (row #527 — wait, lower id wins, so #527 keeps `alice-marie-johnson`; this example gets rewritten in the verification step once we know the real id order)
- `/pardon/details/dwight-lincoln-hammond` → pardon (row #505)
- `/pardon/details/dwight-lincoln-hammond-2018-07-10-commutation` → commutation (row #646, same date so `-date` collides, escalates to `-date-type`)

The `base-id` fallback is mathematically guaranteed to succeed (ids are unique), so the escalation chain is total. The `MAX_SLUG_LENGTH = 60` cap still applies to the `base` computed by `slugify()`, but collision-resolved slugs may exceed 60 characters. That is acceptable — the filesystem limit is 255 bytes and the readability-60 design was for the common case, not for the rare collision case where the extra characters carry meaningful disambiguation.

### Why this stays inside one plan instead of splitting into two

The parser fix (tasks 1–2) could technically ship as a standalone PR without touching slugs, but doing so would require inventing a separate schema-change plan for #12/#13 that still has to grapple with 17 leftover real collisions — a smaller version of the same work. Bundling them means one plan, one PR, one re-scrape, and one verification pass. The blast radius is small: 4 parser test additions, 2 parser source edits (1 line each), 1 new file (`slug-assigner.ts` + tests), 1 column added to the schema, 1 wrapper function in `db.ts`, 1 loader update, 5 page edits to drop `slugify()` calls.

### What stays, what goes

- **Stays:** `src/lib/slugify.ts` (used by the new `slug-assigner.ts` as the base-slug producer), `src/lib/pardon-slug-overrides.ts` (still consulted by `slugify()` — the override map is the editorial-slug layer and has no replacement), and `src/lib/__tests__/slugify.test.ts` (no changes — `slugify()` itself is unchanged).
- **Goes:** Every `import { slugify } from ".../slugify"` in a page file (4 files), and every call to `slugify(something.recipient_name)` in page code. Pages read `grant.data.slug` instead.

## File Structure

### Create

- `src/lib/parsers/__tests__/table-four.test.ts` — vitest tests for the defensive header-row skip (first parser test file in the project)
- `src/lib/parsers/__tests__/table-five.test.ts` — same
- `src/lib/slug-assigner.ts` — pure function `assignSlugs(rows): Map<number, string>` implementing the first-wins escalation chain
- `src/lib/__tests__/slug-assigner.test.ts` — unit tests for the assigner, using inline fixtures (no DB)

### Modify

- `src/lib/parsers/table-four.ts:36` — add `if (name.toUpperCase() === "NAME") return;` defensive filter
- `src/lib/parsers/table-five.ts:40` — same defensive filter
- `src/db/schema.ts:19-66` — add `slug: text("slug").unique()` to the `pardons` table definition
- `src/lib/db.ts:12-43` — add `slug TEXT` to the `CREATE TABLE pardons` DDL + add a `CREATE UNIQUE INDEX` statement; add an in-place `PRAGMA table_info` migration step after the DDL executes so existing local DBs get the column without needing a full re-scrape
- `src/lib/db.ts` (bottom) — add `assignAllPardonSlugs()` export that queries `id, recipient_name, grant_date, clemency_type` from every pardon row, calls `assignSlugs()`, and writes the result back in a single transaction
- `src/scraper/scrape.ts:100-104` — after the `for (const source of sources)` loop completes, call `await assignAllPardonSlugs()` so the post-pass runs once per full scrape
- `src/loaders/pardon-details.ts:9-37` — add `slug: z.string()` to the zod schema, add `slug: pardons.slug` to the `.select()` projection
- `src/pages/pardon/details/[slug].astro:6, 14, 182, 192` — remove the `slugify` import, replace `slugify(grant.data.recipient_name)` in `getStaticPaths` with `grant.data.slug`, replace the two other call sites in the frontmatter with `data.slug`
- `src/pages/og/[slug].png.ts:3, 32` — remove `slugify` import, replace the `getStaticPaths` call with `d.slug`
- `src/pages/search.astro:6, 58` — remove `slugify` import, replace `slugify(d.recipient_name)` with `d.slug`
- `src/pages/president/[slug].astro:13, 79` — remove `slugify` import, replace `slugify(grant.recipient_name)` with `grant.slug`

### Delete

Nothing. `src/lib/slugify.ts` and `src/lib/pardon-slug-overrides.ts` both remain — they're still used by the new `slug-assigner.ts` to produce the base slug for each row.

## Worktree Preconditions

Work in `.worktrees/db-backed-slugs/` per project convention (CLAUDE.md gotcha). Symlink `data/` from the main checkout (`ln -sf ../../data data`) so the scrape step in task 8 can reuse an existing DB instead of scraping from scratch mid-task. Full re-scrape happens once, as the final verification step.

---

## Task 1: Fix parseTableFour to skip `<td>`-based header rows

**Files:**
- Create: `src/lib/parsers/__tests__/table-four.test.ts`
- Modify: `src/lib/parsers/table-four.ts:36`

- [ ] **Step 1: Write the failing test**

Create `src/lib/parsers/__tests__/table-four.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseTableFour } from "../table-four";

describe("parseTableFour", () => {
  it("parses a normal 4-column pardon row", () => {
    const html = `
      <html><body>
        <h2>January 16, 2016</h2>
        <table>
          <tr><th>NAME</th><th>DISTRICT</th><th>SENTENCED</th><th>OFFENSE</th></tr>
          <tr><td>Jane Doe</td><td>E.D. Cal.</td><td>24 months</td><td>Fraud</td></tr>
        </table>
      </body></html>
    `;
    const grants = parseTableFour(html, "pardon", "https://example/");
    expect(grants).toHaveLength(1);
    expect(grants[0].recipient_name).toBe("Jane Doe");
  });

  it("skips header rows that use <td> instead of <th>", () => {
    // Obama-era DOJ HTML sometimes uses <td> for headers in later tables
    // on the same page. The :has(th) filter misses these; a content-based
    // check against the sentinel "NAME" value must catch them.
    const html = `
      <html><body>
        <h2>January 16, 2016</h2>
        <table>
          <tr><th>NAME</th><th>DISTRICT</th><th>SENTENCED</th><th>OFFENSE</th></tr>
          <tr><td>Jane Doe</td><td>E.D. Cal.</td><td>24 months</td><td>Fraud</td></tr>
        </table>
        <h2>March 1, 2013</h2>
        <table>
          <tr><td>NAME</td><td>DISTRICT</td><td>SENTENCED</td><td>OFFENSE</td></tr>
          <tr><td>John Smith</td><td>W.D. Tex.</td><td>12 months</td><td>Theft</td></tr>
        </table>
      </body></html>
    `;
    const grants = parseTableFour(html, "pardon", "https://example/");
    expect(grants).toHaveLength(2);
    expect(grants.map((g) => g.recipient_name)).toEqual(["Jane Doe", "John Smith"]);
    expect(grants.map((g) => g.recipient_name)).not.toContain("NAME");
  });

  it("skips header rows regardless of case", () => {
    const html = `
      <html><body>
        <h2>January 16, 2016</h2>
        <table>
          <tr><td>name</td><td>district</td><td>sentenced</td><td>offense</td></tr>
          <tr><td>Jane Doe</td><td>E.D. Cal.</td><td>24 months</td><td>Fraud</td></tr>
        </table>
      </body></html>
    `;
    const grants = parseTableFour(html, "pardon", "https://example/");
    expect(grants).toHaveLength(1);
    expect(grants[0].recipient_name).toBe("Jane Doe");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/lib/parsers/__tests__/table-four.test.ts`
Expected: the first test (`parses a normal 4-column pardon row`) passes. The second test fails with a length-2-vs-3 mismatch — the header row sneaks through and is parsed as a pardon named "NAME". The third test (lowercase) also fails.

- [ ] **Step 3: Add the defensive filter**

Edit `src/lib/parsers/table-four.ts`. In the `rows.each` callback, immediately after `if (!name) return;`, add:

```ts
// Defensive: skip header rows that use <td> instead of <th>. Obama-era
// DOJ HTML is inconsistent — the first table on a page often has proper
// <th> headers (caught by the :has(th) filter above), but later tables
// on the same page reuse <td> for their header rows and slip through.
if (name.toUpperCase() === "NAME") return;
```

Exact edit context:

```ts
      const name = cells.eq(0).text().trim();
      if (!name) return;
      if (name.toUpperCase() === "NAME") return;

      const district = cells.eq(1).text().trim() || null;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/lib/parsers/__tests__/table-four.test.ts`
Expected: all three tests pass.

- [ ] **Step 5: Commit**

```bash
but add src/lib/parsers/table-four.ts src/lib/parsers/__tests__/table-four.test.ts
but commit -m "fix(parser): skip <td>-based header rows in table-four

The Obama DOJ pages contain sub-tables whose header rows use <td>
instead of <th>, slipping past the :has(th) filter and producing 5
garbage pardon records per Obama page with recipient_name values
like 'NAME', 'DISTRICT', 'SENTENCED', 'OFFENSE'. Add a content-based
check against the sentinel 'NAME' value to catch them.

Closes the parser half of #13."
```

---

## Task 2: Fix parseTableFive to skip `<td>`-based header rows

**Files:**
- Create: `src/lib/parsers/__tests__/table-five.test.ts`
- Modify: `src/lib/parsers/table-five.ts:40`

Same bug shape as table-four. No known incidents in the current data (table-five is used for Biden and Trump Term 1, neither of which has garbage rows today), but the fix is cheap and prevents the same class of regression if the DOJ pages drift.

- [ ] **Step 1: Write the failing test**

Create `src/lib/parsers/__tests__/table-five.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseTableFive } from "../table-five";

describe("parseTableFive", () => {
  it("parses a normal 5-column pardon row with warrant link", () => {
    const html = `
      <html><body>
        <h2>December 22, 2020</h2>
        <table>
          <tr><th>NAME</th><th>DISTRICT</th><th>SENTENCED</th><th>OFFENSE</th><th>PUBLIC DISCLOSURE</th></tr>
          <tr>
            <td>Jane Doe</td><td>E.D. Cal.</td><td>24 months</td><td>Fraud</td>
            <td><a href="/pardon/file/123/dl">Download PDF Clemency Warrant</a></td>
          </tr>
        </table>
      </body></html>
    `;
    const grants = parseTableFive(html, "pardon", "https://example/");
    expect(grants).toHaveLength(1);
    expect(grants[0].recipient_name).toBe("Jane Doe");
    expect(grants[0].warrant_url).toContain("/pardon/file/123/dl");
  });

  it("skips header rows that use <td> instead of <th>", () => {
    const html = `
      <html><body>
        <h2>December 22, 2020</h2>
        <table>
          <tr><td>NAME</td><td>DISTRICT</td><td>SENTENCED</td><td>OFFENSE</td><td>PUBLIC DISCLOSURE</td></tr>
          <tr><td>Jane Doe</td><td>E.D. Cal.</td><td>24 months</td><td>Fraud</td><td></td></tr>
        </table>
      </body></html>
    `;
    const grants = parseTableFive(html, "pardon", "https://example/");
    expect(grants).toHaveLength(1);
    expect(grants[0].recipient_name).toBe("Jane Doe");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/lib/parsers/__tests__/table-five.test.ts`
Expected: first test passes, second test fails (2 grants instead of 1).

- [ ] **Step 3: Add the defensive filter**

Edit `src/lib/parsers/table-five.ts`. In the `rows.each` callback, immediately after `if (!name) return;`, add:

```ts
if (name.toUpperCase() === "NAME") return;
```

Exact edit context:

```ts
      const name = cells.eq(0).text().trim();
      if (!name) return;
      if (name.toUpperCase() === "NAME") return;

      // District might be missing on some entries (e.g., Hunter Biden)
      const district = cells.eq(1).text().trim() || null;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/lib/parsers/__tests__/table-five.test.ts`
Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
but add src/lib/parsers/table-five.ts src/lib/parsers/__tests__/table-five.test.ts
but commit -m "fix(parser): skip <td>-based header rows in table-five

Apply the same defensive content check used in table-four. No known
incidents in the current Biden/Trump-1 data, but prevents the same
regression class if the DOJ pages drift."
```

---

## Task 3: Add `slug` column to the pardons schema

**Files:**
- Modify: `src/db/schema.ts:19-66`
- Modify: `src/lib/db.ts:12-43, ~333`

This task does not add any assignment logic — just the column and the migration. Rows will be inserted with a null slug until task 5 wires up the assigner.

- [ ] **Step 1: Add slug to the drizzle schema**

Edit `src/db/schema.ts`. In the `pardons` table definition, add a new column between `recipient_name` and `clemency_type`:

```ts
export const pardons = sqliteTable(
  "pardons",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    administration: integer("administration")
      .notNull()
      .references(() => administrations.id),
    recipient_name: text("recipient_name").notNull(),
    slug: text("slug").unique(),
    clemency_type: text("clemency_type", {
      enum: ["pardon", "commutation"],
    }).notNull(),
    // ... rest unchanged
```

Note: `.unique()` without `.notNull()` because rows are inserted with a null slug and the assigner pass fills them in afterward. SQLite's UNIQUE treats NULLs as distinct, so multiple pending-null rows coexist cleanly during scrape; once the assigner writes back, every row has a non-null unique slug.

- [ ] **Step 2: Update the DDL in db.ts**

Edit `src/lib/db.ts`. Update the `DDL` constant string (lines 12–43) — add `slug TEXT,` after `recipient_name TEXT NOT NULL,` and add a `CREATE UNIQUE INDEX` after the table definition:

```ts
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

CREATE UNIQUE INDEX IF NOT EXISTS pardons_slug_unique ON pardons(slug);
`;
```

- [ ] **Step 3: Add in-place migration for existing DBs**

Still in `src/lib/db.ts`, find the line `await client.executeMultiple(DDL);` (around line 333) and replace that single line with:

```ts
await client.executeMultiple(DDL);

// In-place migration: ALTER existing DBs that predate the slug column.
// SQLite's CREATE TABLE IF NOT EXISTS won't add columns to an existing
// table, so we check for the column via PRAGMA and ALTER if missing.
// Partial index is handled by the CREATE UNIQUE INDEX IF NOT EXISTS in DDL.
{
  const cols = await client.execute("PRAGMA table_info(pardons)");
  const hasSlug = cols.rows.some((r) => r.name === "slug");
  if (!hasSlug) {
    await client.execute("ALTER TABLE pardons ADD COLUMN slug TEXT");
    await client.execute(
      "CREATE UNIQUE INDEX IF NOT EXISTS pardons_slug_unique ON pardons(slug)",
    );
    console.log("Migrated: added pardons.slug column");
  }
}
```

- [ ] **Step 4: Smoke-test the migration on an existing DB**

Run in the worktree with its existing symlinked data/:

```bash
pnpm tsx -e "import('./src/lib/db.js').then(() => import('@libsql/client').then(async ({ createClient }) => { const c = createClient({ url: 'file:./data/pardonned.db' }); const r = await c.execute('PRAGMA table_info(pardons)'); console.log(r.rows.map(x => x.name).join(', ')); c.close(); }))"
```

Expected: column list includes `slug`. If not, inspect the migration output for errors.

Alternative manual check:

```bash
sqlite3 data/pardonned.db "PRAGMA table_info(pardons);" | grep slug
```

Expected output: a line containing `slug|TEXT`.

- [ ] **Step 5: Commit**

```bash
but add src/db/schema.ts src/lib/db.ts
but commit -m "feat(db): add pardons.slug column with in-place migration

Nullable TEXT column with a unique index. Nullable so that rows can
be inserted first and have their slugs computed by a post-scrape
pass in a later commit — SQLite's UNIQUE treats NULLs as distinct,
so multiple pending-null rows coexist during the scrape window.

Existing local DBs are migrated in place via a PRAGMA table_info
check before ALTER TABLE. Fresh DBs get the column via the updated
CREATE TABLE DDL. CI always starts from a fresh DB so the migration
path is only exercised locally.

Preparation for #12/#13."
```

---

## Task 4: Implement `assignSlugs` as a pure function with full test coverage

**Files:**
- Create: `src/lib/slug-assigner.ts`
- Create: `src/lib/__tests__/slug-assigner.test.ts`

The assigner takes an array of minimal row records (id, recipient_name, grant_date, clemency_type) and returns a `Map<number, string>` from row id to final unique slug. The function is pure — no DB access, no side effects — so it's fully unit-testable with inline fixtures and reusable from anywhere.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/slug-assigner.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { assignSlugs, type AssignerRow } from "../slug-assigner";

function row(
  id: number,
  name: string,
  grant_date = "2020-01-01",
  clemency_type: "pardon" | "commutation" = "pardon",
): AssignerRow {
  return { id, recipient_name: name, grant_date, clemency_type };
}

describe("assignSlugs", () => {
  describe("no collisions", () => {
    it("assigns the base slug to a single row", () => {
      const result = assignSlugs([row(1, "Jane Smith")]);
      expect(result.get(1)).toBe("jane-smith");
    });

    it("assigns distinct base slugs to rows with distinct names", () => {
      const result = assignSlugs([row(1, "Jane Smith"), row(2, "John Doe")]);
      expect(result.get(1)).toBe("jane-smith");
      expect(result.get(2)).toBe("john-doe");
    });
  });

  describe("first-wins collision: two rows, same name, different dates", () => {
    it("first id keeps the base slug; second gets -date suffix", () => {
      const rows = [
        row(1, "Alice Marie Johnson", "2018-06-06", "commutation"),
        row(2, "Alice Marie Johnson", "2020-08-28", "pardon"),
      ];
      const result = assignSlugs(rows);
      expect(result.get(1)).toBe("alice-marie-johnson");
      expect(result.get(2)).toBe("alice-marie-johnson-2020-08-28");
    });

    it("first-wins is determined by id, not input order", () => {
      // Deliberately reverse-order the input
      const rows = [
        row(2, "Alice Marie Johnson", "2020-08-28", "pardon"),
        row(1, "Alice Marie Johnson", "2018-06-06", "commutation"),
      ];
      const result = assignSlugs(rows);
      expect(result.get(1)).toBe("alice-marie-johnson");
      expect(result.get(2)).toBe("alice-marie-johnson-2020-08-28");
    });
  });

  describe("escalation: same name AND same date", () => {
    it("escalates to -date-type when -date collides (Hammonds case)", () => {
      // Same person, same day, pardon + commutation
      const rows = [
        row(1, "Dwight Lincoln Hammond", "2018-07-10", "pardon"),
        row(2, "Dwight Lincoln Hammond", "2018-07-10", "commutation"),
      ];
      const result = assignSlugs(rows);
      expect(result.get(1)).toBe("dwight-lincoln-hammond");
      expect(result.get(2)).toBe("dwight-lincoln-hammond-2018-07-10-commutation");
    });
  });

  describe("fallback: everything collides", () => {
    it("uses -id suffix as the final fallback", () => {
      // Three rows with identical name + date + type: unreachable IRL
      // but the algorithm must still produce unique slugs.
      const rows = [
        row(1, "Jane Doe", "2020-01-01", "pardon"),
        row(2, "Jane Doe", "2020-01-01", "pardon"),
        row(3, "Jane Doe", "2020-01-01", "pardon"),
      ];
      const result = assignSlugs(rows);
      expect(result.get(1)).toBe("jane-doe");
      // Row 2's base collides, -date collides (2020-01-01), -date-type
      // collides (jane-doe-2020-01-01-pardon), so it falls through to -id.
      expect(result.get(2)).toBe("jane-doe-2");
      expect(result.get(3)).toBe("jane-doe-3");
    });
  });

  describe("respects slugify() overrides for the base slug", () => {
    it("applies the Jan 6 Committee override as the base for a unique row", () => {
      const jan6Name =
        "The Members of Congress who served on the Select Committee to Investigate the January 6th Attack on the United States Capitol (\u201CSelect Committee\u201D); the staff of the Select Committee, as provided by House Resolution 503 (117th Congress); and the police officers from the D.C. Metropolitan Police Department or the U.S. Capitol Police who testified before the Select Committee";
      const result = assignSlugs([row(1, jan6Name, "2025-01-19", "pardon")]);
      expect(result.get(1)).toBe("january-6th-committee");
    });
  });

  describe("determinism", () => {
    it("produces identical output for identical input", () => {
      const rows = [
        row(1, "Alice", "2020-01-01", "pardon"),
        row(2, "Alice", "2021-01-01", "pardon"),
        row(3, "Bob", "2020-01-01", "pardon"),
      ];
      const a = assignSlugs(rows);
      const b = assignSlugs(rows);
      expect([...a.entries()].sort()).toEqual([...b.entries()].sort());
    });
  });

  describe("every row gets a unique slug", () => {
    it("post-condition: result size equals input size, all values distinct", () => {
      const rows = [
        row(1, "Alice", "2020-01-01", "pardon"),
        row(2, "Alice", "2020-01-01", "commutation"),
        row(3, "Alice", "2021-01-01", "pardon"),
        row(4, "Bob"),
        row(5, "Carol"),
      ];
      const result = assignSlugs(rows);
      expect(result.size).toBe(rows.length);
      const slugs = [...result.values()];
      expect(new Set(slugs).size).toBe(slugs.length);
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/lib/__tests__/slug-assigner.test.ts`
Expected: all tests fail with `Cannot find module '../slug-assigner'`.

- [ ] **Step 3: Implement the assigner**

Create `src/lib/slug-assigner.ts`:

```ts
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
    for (const candidate of candidates) {
      if (!taken.has(candidate)) {
        taken.add(candidate);
        result.set(row.id, candidate);
        break;
      }
    }
  }

  return result;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run src/lib/__tests__/slug-assigner.test.ts`
Expected: all 10 tests pass.

- [ ] **Step 5: Commit**

```bash
but add src/lib/slug-assigner.ts src/lib/__tests__/slug-assigner.test.ts
but commit -m "feat(slugs): add pure assignSlugs collision resolver

First-wins by id. Escalation chain: base → base-date → base-date-type
→ base-id. The -id fallback is mathematically guaranteed to succeed
because ids are unique, so the algorithm is total.

Pure function with 10 unit tests covering: unique case, first-wins
by id (including reverse input order), date escalation, type
escalation for the Hammonds-style same-day pardon+commutation, -id
fallback, override-map respect for the Jan 6 Committee case, and
post-conditions (determinism, every row gets a distinct slug).

Preparation for #12/#13."
```

---

## Task 5: Wire `assignAllPardonSlugs` into the scraper post-pass

**Files:**
- Modify: `src/lib/db.ts` (add `assignAllPardonSlugs` export)
- Modify: `src/scraper/scrape.ts:93-105`

- [ ] **Step 1: Add assignAllPardonSlugs to db.ts**

Edit `src/lib/db.ts`. At the bottom of the file, after `upsertGrants`, add:

```ts
import { assignSlugs } from "./slug-assigner.js";

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
  let collisionsResolved = 0;
  for (const row of rows) {
    const assigned = slugMap.get(row.id);
    // A row's slug differs from its "clean" form iff collision escalation
    // kicked in. We can't easily recompute the base here without duplicating
    // slugify, so instead we count rows whose final slug contains a date
    // or id suffix. This is a rough signal, not a proof.
    if (assigned && /-\d{4}-\d{2}-\d{2}/.test(assigned)) {
      collisionsResolved += 1;
    }
  }

  // Write back in one transaction. Drizzle's libsql driver runs these as
  // individual UPDATE statements inside a transaction; for ~2,500 rows
  // this is fast enough (sub-second on an M-series Mac).
  await db.transaction(async (tx) => {
    for (const [id, slug] of slugMap) {
      await tx.update(pardons).set({ slug }).where(eq(pardons.id, id)).run();
    }
  });

  return { assigned: slugMap.size, collisionsResolved };
}
```

Note: the existing `src/lib/db.ts` already imports `eq` from `drizzle-orm` (line 4) and `pardons` from `../db/schema.js` (line 6), so those imports are already present. The only new import is `assignSlugs`.

- [ ] **Step 2: Call it from the scraper entry point**

Edit `src/scraper/scrape.ts`. At the top, add the import:

```ts
import { upsertGrants, assignAllPardonSlugs } from "../lib/db.js";
```

(replacing the existing `import { upsertGrants } from "../lib/db.js";` at line 3).

Then in the `main()` function, after the `await scrapePresident(...)` call but before the `finally` block, add the slug-assignment step. Find the section:

```ts
  try {
    if (presidentFilter === "all" || !presidentFilter) {
      console.log("Scraping all configured presidents...");
      await scrapePresident();
    } else {
      await scrapePresident(presidentFilter);
    }
  } finally {
    await closeBrowser();
  }
```

Change it to:

```ts
  try {
    if (presidentFilter === "all" || !presidentFilter) {
      console.log("Scraping all configured presidents...");
      await scrapePresident();
    } else {
      await scrapePresident(presidentFilter);
    }

    console.log("\nAssigning slugs...");
    const { assigned, collisionsResolved } = await assignAllPardonSlugs();
    console.log(`  Assigned ${assigned} slugs (${collisionsResolved} collision-resolved)`);
  } finally {
    await closeBrowser();
  }
```

The assigner runs after all presidents, even when only one is scraped — this is necessary because single-president scrapes can still introduce rows whose names collide with pre-existing rows in the DB from earlier scrapes.

- [ ] **Step 3: Smoke-test on the existing DB**

Run the assigner by itself to verify it works against the current `data/pardonned.db` (which already has the slug column from task 3):

```bash
pnpm tsx -e "import { assignAllPardonSlugs } from './src/lib/db.js'; const r = await assignAllPardonSlugs(); console.log(r);"
```

Expected output: `{ assigned: 2349, collisionsResolved: <some number, likely 17 or so> }`.

Then check that every row has a slug:

```bash
sqlite3 data/pardonned.db "SELECT COUNT(*) FROM pardons WHERE slug IS NULL;"
```

Expected: `0`.

And check for duplicates:

```bash
sqlite3 data/pardonned.db "SELECT slug, COUNT(*) c FROM pardons GROUP BY slug HAVING c > 1;"
```

Expected: no rows (the UNIQUE index would have rejected duplicates anyway, but this is the direct check).

- [ ] **Step 4: Commit**

```bash
but add src/lib/db.ts src/scraper/scrape.ts
but commit -m "feat(scraper): assign slugs in a post-scrape pass

Adds assignAllPardonSlugs() which loads every row, runs them through
the pure assignSlugs() resolver, and writes back in one transaction.
Called once from scrape.ts after all presidents are scraped so it
sees the complete dataset when resolving collisions.

Logs an 'assigned N slugs (M collision-resolved)' summary line. The
collision count is approximate (regex matches date-suffixed slugs)
but useful as a smoke signal to notice parser or data regressions.

Closes #12 (storage layer)."
```

---

## Task 6: Expose `slug` through the content collection loader

**Files:**
- Modify: `src/loaders/pardon-details.ts:9-37, 71-93`

- [ ] **Step 1: Add slug to the zod schema**

Edit `src/loaders/pardon-details.ts`. In `pardonDetailSchema`, add `slug: z.string()` between `id` and `administration_slug`:

```ts
export const pardonDetailSchema = z.object({
  id: z.string(),
  slug: z.string(),
  administration_slug: z.string(),
  grant_date: z.string(),
  // ... rest unchanged
```

- [ ] **Step 2: Add slug to the DB projection**

In the same file, in the `.select({...})` call, add `slug: pardons.slug` between `id` and `administration_slug`:

```ts
        const query = db
          .select({
            id: pardons.id,
            slug: pardons.slug,
            administration_slug: administrations.slug,
            grant_date: pardons.grant_date,
            // ... rest unchanged
```

- [ ] **Step 3: Quick sanity check (no test file yet — verified end-to-end in task 8)**

There's no existing unit-test file for the loader, and adding one just for this column is overkill given task 8 does a full build. Instead, run a one-off check:

```bash
pnpm tsx -e "import { pardonDetailsLoader } from './src/loaders/pardon-details.js'; const loader = pardonDetailsLoader(); const store = new Map(); await loader.load({ store: { set: (e) => store.set(e.id, e), clear: () => store.clear() }, logger: console, parseData: async ({ data }) => data, generateDigest: () => 'x' }); const first = [...store.values()][0]; console.log('slug:', first.data.slug, 'name:', first.data.recipient_name);"
```

Expected: a slug value is printed alongside the recipient name. If zod complains about `slug` being required but missing, the DB column hasn't been populated — re-run task 5's smoke step.

- [ ] **Step 4: Commit**

```bash
but add src/loaders/pardon-details.ts
but commit -m "feat(loader): expose pardons.slug on content collection entries

Adds the slug field to the zod schema and the Drizzle SELECT
projection. Downstream pages read grant.data.slug instead of
calling slugify() at build time."
```

---

## Task 7: Replace `slugify()` calls in page files with `grant.data.slug`

**Files:**
- Modify: `src/pages/pardon/details/[slug].astro:6, 14, 182, 192`
- Modify: `src/pages/og/[slug].png.ts:3, 32`
- Modify: `src/pages/search.astro:6, 58`
- Modify: `src/pages/president/[slug].astro:13, 79`

All four changes follow the same pattern: remove the `slugify` import, replace each `slugify(...recipient_name)` call with the corresponding `.slug` field from the loaded data.

- [ ] **Step 1: Update pardon/details/[slug].astro**

Edit `src/pages/pardon/details/[slug].astro`.

Remove line 6:
```ts
import { slugify } from "../../../lib/slugify";
```

Replace line 14 (inside `getStaticPaths`):
```ts
        params: { slug: slugify(grant.data.recipient_name) },
```
with:
```ts
        params: { slug: grant.data.slug },
```

Replace line 182 (inside the breadcrumbs JSON-LD):
```ts
{ name: data.recipient_name, url: `https://pardonned.com/pardon/details/${slugify(data.recipient_name)}` },
```
with:
```ts
{ name: data.recipient_name, url: `https://pardonned.com/pardon/details/${data.slug}` },
```

Replace line 192 (OG image path):
```ts
const ogImagePath = `/og/${slugify(data.recipient_name)}.png`;
```
with:
```ts
const ogImagePath = `/og/${data.slug}.png`;
```

- [ ] **Step 2: Update og/[slug].png.ts**

Edit `src/pages/og/[slug].png.ts`.

Remove line 3:
```ts
import { slugify } from "../../lib/slugify";
```

Replace line 32 (inside `getStaticPaths`):
```ts
      params: { slug: slugify(d.recipient_name) },
```
with:
```ts
      params: { slug: d.slug },
```

- [ ] **Step 3: Update search.astro**

Edit `src/pages/search.astro`.

Remove line 6:
```ts
import { slugify } from "../lib/slugify";
```

Replace line 58 (inside the `searchResults` map):
```ts
        slug: slugify(d.recipient_name),
```
with:
```ts
        slug: d.slug,
```

- [ ] **Step 4: Update president/[slug].astro**

Edit `src/pages/president/[slug].astro`.

Remove line 13:
```ts
import { slugify } from "../../lib/slugify";
```

Replace line 79 (inside the grant href template):
```ts
                `/pardon/details/${slugify(grant.recipient_name)}`;
```
with:
```ts
                `/pardon/details/${grant.slug}`;
```

- [ ] **Step 5: Verify no remaining callers outside the slug layer**

Search for any remaining imports of `slugify` in page or component code. Use ripgrep (or the equivalent Grep tool in your runner):

```bash
rg -n "from ['\"].*slugify['\"]" src/
```

Expected output: exactly two matches — `src/lib/slug-assigner.ts` (the base-slug producer) and `src/lib/__tests__/slugify.test.ts` (the existing unit tests). Any other match is a missed call site; return to the relevant sub-step above and finish the replacement before continuing.

- [ ] **Step 6: Build to verify all four pages compile**

Run: `pnpm build`
Expected: build succeeds. The dist output should contain roughly 2,329 pages (2,349 − 20 header rows), subject to the task 8 re-scrape.

- [ ] **Step 7: Commit**

```bash
but add src/pages/pardon/details/[slug].astro src/pages/og/[slug].png.ts src/pages/search.astro src/pages/president/[slug].astro
but commit -m "refactor(pages): read grant.data.slug instead of slugify()

All four page consumers now read the pre-computed slug from the
content collection entry rather than recomputing at build time.
slugify.ts and pardon-slug-overrides.ts both remain because
slug-assigner.ts still uses slugify() as the base-slug producer.

Closes #13."
```

---

## Task 8: Full re-scrape and end-to-end verification

**Files:** No files modified — this task is verification only.

- [ ] **Step 1: Fresh-scrape the DB**

```bash
rm data/pardonned.db
pnpm scrape
```

Expected runtime: 5–10 minutes. Watch for the "Assigning slugs... Assigned N slugs (M collision-resolved)" line near the end. N should be around **2,329** (2,349 minus 20 header rows stopped by the parser fix). M should be around **17–20** (the real collision clusters, each contributing 1+ resolved rows).

- [ ] **Step 2: Verify row count**

```bash
sqlite3 data/pardonned.db "SELECT COUNT(*) FROM pardons;"
```

Expected: a number around 2,329. If it's still 2,349, the parser fix didn't apply — check tasks 1 and 2 were committed and re-run the scrape.

- [ ] **Step 3: Verify no null slugs**

```bash
sqlite3 data/pardonned.db "SELECT COUNT(*) FROM pardons WHERE slug IS NULL;"
```

Expected: `0`. Non-zero means the assigner didn't run, or it skipped rows.

- [ ] **Step 4: Verify all slugs are unique**

```bash
sqlite3 data/pardonned.db "SELECT slug, COUNT(*) c FROM pardons GROUP BY slug HAVING c > 1;"
```

Expected: no rows. (The UNIQUE index would reject inserts/updates that violate this, but a direct read is a good sanity check.)

- [ ] **Step 5: Verify no garbage slugs**

```bash
sqlite3 data/pardonned.db "SELECT id, slug, recipient_name FROM pardons WHERE slug IN ('name', 'district', 'sentenced', 'offense');"
```

Expected: no rows. If any appear, the parser fix didn't catch them — investigate the row's `recipient_name` and confirm it matches the filter.

- [ ] **Step 6: Verify expected collision-resolved slugs exist**

```bash
sqlite3 data/pardonned.db "SELECT id, slug, recipient_name, grant_date, clemency_type FROM pardons WHERE slug LIKE 'alice-marie-johnson%' ORDER BY id;"
```

Expected: two rows, one with slug `alice-marie-johnson` (lower id, first-wins) and one with a date-suffixed slug.

```bash
sqlite3 data/pardonned.db "SELECT id, slug, recipient_name, grant_date, clemency_type FROM pardons WHERE slug LIKE 'dwight-lincoln-hammond%' ORDER BY id;"
```

Expected: two rows, one with slug `dwight-lincoln-hammond` and one with slug `dwight-lincoln-hammond-2018-07-10-commutation` (the `-date-type` escalation because both rows share the same date).

- [ ] **Step 7: Build the site and verify page count matches row count**

```bash
pnpm build
```

Expected: build completes. The final log line reports "N page(s) built in Xs" — N should equal the pardon row count from step 2 (around 2,329) plus the other non-pardon pages (home, search, OG images, president pages, sitemap, etc.). The detailed pardon page count should match exactly: run

```bash
find dist/pardon/details -maxdepth 1 -type d | wc -l
```

and compare to the DB count. They should differ by 1 (for the `details` directory itself).

- [ ] **Step 8: Spot-check two specific URLs from the collision set**

Open `dist/pardon/details/alice-marie-johnson/index.html` and confirm it's a real, rendered page with the correct recipient name. Then open `dist/pardon/details/dwight-lincoln-hammond-2018-07-10-commutation/index.html` and confirm the same. Neither should be a 404 / missing file.

- [ ] **Step 9: Confirm garbage routes do NOT exist**

```bash
ls dist/pardon/details/ 2>&1 | grep -E "^(name|district|sentenced|offense)$" || echo "no garbage routes found"
```

Expected: `no garbage routes found`.

- [ ] **Step 10: Run lint and existing tests**

```bash
pnpm lint
pnpm test
```

Expected: both clean.

- [ ] **Step 11: Commit the fresh DB-regeneration + close the issues**

The DB file itself is gitignored per CLAUDE.md, so there's nothing to commit in this step. But if any incidental formatter changes were applied during verification, stage them.

```bash
but status
# if any changes: but add <files>; but commit -m "chore: post-verification formatting"
```

Then open a PR with both issues closed in the body:

```bash
gh pr create --title "DB-backed pardon slugs (closes #12, #13)" --body "$(cat <<'EOF'
## Summary
- Move slug generation out of build-time `slugify()` calls into a post-scrape pass that writes a unique, first-wins, collision-resolved slug into a new `pardons.slug` column.
- Fix a parser bug in `parseTableFour` and `parseTableFive` that was producing 20 garbage pardon rows on the Obama pages (literal "NAME"/"DISTRICT"/"SENTENCED"/"OFFENSE" header rows slipping through the `:has(th)` filter).
- Pages now read `grant.data.slug` instead of recomputing, which closes the silent `getStaticPaths` dedup gap that had been dropping ~33 pardons from `dist/`.

Closes #12. Closes #13.

## Test plan
- [x] `pnpm test` green (new: 3 table-four parser tests, 2 table-five parser tests, 10 slug-assigner tests)
- [x] `pnpm lint` clean
- [x] Fresh `pnpm scrape` completes, assigner logs "Assigned N slugs (M collision-resolved)"
- [x] `sqlite3 data/pardonned.db "SELECT COUNT(*) FROM pardons WHERE slug IS NULL"` returns 0
- [x] `sqlite3 data/pardonned.db "SELECT slug, COUNT(*) c FROM pardons GROUP BY slug HAVING c > 1"` returns no rows
- [x] `pnpm build` produces one HTML page per DB row with no dedup gap
- [x] `dist/pardon/details/alice-marie-johnson/index.html` and `dist/pardon/details/dwight-lincoln-hammond-2018-07-10-commutation/index.html` both exist and render correctly
- [x] No `dist/pardon/details/name/`, `dist/pardon/details/district/`, etc.
EOF
)"
```

---

## Verification checklist (summary)

- Parser tests pass: `pnpm vitest run src/lib/parsers/__tests__/`
- Slug-assigner tests pass: `pnpm vitest run src/lib/__tests__/slug-assigner.test.ts`
- Existing slugify tests still pass (`slugify()` itself is unchanged): `pnpm vitest run src/lib/__tests__/slugify.test.ts`
- DB has the column: `sqlite3 data/pardonned.db "PRAGMA table_info(pardons)"` lists `slug TEXT`
- All rows have slugs: `SELECT COUNT(*) FROM pardons WHERE slug IS NULL` = 0
- All slugs unique: `SELECT slug, COUNT(*) FROM pardons GROUP BY slug HAVING COUNT(*) > 1` = no rows
- No garbage rows: `SELECT * FROM pardons WHERE recipient_name IN ('NAME','DISTRICT','SENTENCED','OFFENSE')` = no rows
- Build page count matches row count: `pnpm build` log N equals the DB pardon count
- Known-colliding names resolve to expected URLs (`alice-marie-johnson`, `dwight-lincoln-hammond-2018-07-10-commutation`, etc.)

## Non-goals

- The `brittany-krambeck` / `brittany-krambeck*` asterisk case is left as-is. That's a parser-level data-cleanup concern (strip trailing asterisks from names) that's adjacent but orthogonal to slug uniqueness. File a follow-up issue if needed.
- Cross-administration name collisions (Joseph Schwartz, Connie Avalos, etc.) are resolved by the algorithm into date-suffixed slugs but NOT investigated for "are these actually the same person?". Domain call for the project owner.
- No new "rules engine" DSL. The manual override map in `pardon-slug-overrides.ts` plus the collision escalation in `slug-assigner.ts` together satisfy issue #12's "rules engine" ask without adding a whole new abstraction.
- No admin-scoped URLs (`/pardon/details/trump-2/jane-smith`). The first-wins + escalation chain covers every current collision class with flat URLs.
- No changes to `slugify()` itself. The fallback hash-suffix logic remains for the very-long-name case, even though collision resolution now happens in a separate layer.
