# 00 — Data shapes (live)

Snapshot of how pardon data is actually shaped in the codebase as of 2026-05.
Do not re-derive this from code — update this file when the schema changes.

## Source of truth

`data/pardonned.db` (SQLite, gitignored). Schema in `src/db/schema.ts`.
The Astro build never reads the DB directly — it goes through the content
collection loader in `src/loaders/pardon-details.ts`.

## Tables

### `administrations`

| Column           | Type     | Notes                                                  |
|------------------|----------|--------------------------------------------------------|
| id               | integer  | PK, autoincrement                                      |
| slug             | text     | unique, e.g. `trump-2`, `biden-1`, `bush-jr-2`         |
| president_name   | text     | display name, e.g. `Donald J. Trump`                   |
| term_number      | integer  | 1, 2, 3, 4 — every admin has one, even single-termers  |
| start_date       | text     | ISO date                                               |
| end_date         | text?    | ISO date, null for incumbents                          |
| created_at       | text     | timestamp                                              |
| updated_at       | text     | timestamp                                              |

37 rows in the live DB, McKinley-onward. The site only renders modern-era
(Clinton-onward, 9 rows) — see `/all-presidents` scope.

### `pardons`

| Column                | Type     | Notes                                                       |
|-----------------------|----------|-------------------------------------------------------------|
| id                    | integer  | PK, autoincrement                                           |
| administration        | integer  | FK → administrations.id                                     |
| recipient_name        | text     | as written in DOJ source. May contain U+00A0 NBSPs.         |
| slug                  | text?    | unique. Null only during ingest; populated before build.    |
| clemency_type         | enum     | `pardon` \| `commutation`. **No `remission` exists.**       |
| grant_date            | text     | ISO date                                                    |
| warrant_url           | text?    | DOJ warrant PDF URL                                         |
| source_url            | text?    | DOJ clemency listing page URL                               |
| district              | text?    | e.g. `S.D.N.Y.`                                             |
| offense               | text     | one-line description from the warrant                       |
| offense_category      | enum     | 8 values, see below                                         |
| sentence_in_months    | integer? | numeric sentence; null if unparseable or life               |
| fine                  | real?    | USD                                                         |
| restitution           | real?    | USD                                                         |
| original_sentence     | text?    | raw string from warrant — fallback when months is null      |
| created_at, updated_at| text     | timestamps                                                  |

**Offense categories (closed enum, 8 values, as of 2026-05):**
`violent crime`, `fraud`, `drug offense`, `FACE act`, `immigration`,
`firearms`, `financial crime`, `other`.

**Not yet in the data:** `january 6`, `political corruption`, `cryptocurrency`.
A separate AI-reclassification effort will surface these. UI code must NOT
hardcode category names — iterate over what the data contains.

**Volume (2026-05 snapshot):** 3,205 grants total.
- drug offense: 2,157 (67%)
- other: 532
- fraud: 328
- violent crime: 89
- financial crime: 55
- firearms: 25
- FACE act: 16
- immigration: 3

## What the loader returns to Astro

`src/loaders/pardon-details.ts` joins `pardons` against `administrations`
and stores entries in the `pardonDetails` content collection. Each entry's
`data` shape (Zod schema in the same file):

```ts
type PardonDetail = {
  id: string                  // stringified pardons.id (NOT the slug)
  slug: string                // unique URL slug, e.g. "paul-manafort"
  administration_slug: string // e.g. "trump-1"
  recipient_name: string
  clemency_type: "pardon" | "commutation"
  grant_date: string          // ISO date
  offense: string
  offense_category: "violent crime" | "fraud" | "drug offense" | "FACE act" | "immigration" | "firearms" | "financial crime" | "other"
  district: string | null
  warrant_url: string | null
  source_url: string | null
  sentence_in_months: number | null
  fine: number | null
  restitution: number | null
  original_sentence: string | null
  president_name: string      // joined from administrations
  term_number: number         // joined
  term_start_date: string     // joined
  term_end_date: string | null
}
```

Consumers should never query the DB directly. Use:

```ts
const all = await getCollection("pardonDetails");
```

## Helpers (`src/lib/*`)

- `computeStats(entries)` — totals, by-category, by-type. Categories are
  whatever the data contains; do not assume a fixed set.
- `filterByAdministration(entries, slug)` / `filterByCategory` / `filterByType`.
- `getAdministrationIndex(entries)` → `Map<slug, { displayName, presidentName, termNumber, termStartDate, count }>`. Use this anywhere you need a list of presidents.
- `formatAdministrationDisplayName({ presidentName, termNumber, isOnlyTerm })` — applies the "(First Term)" / "(Second Term)" suffix when a president has multiple terms in the dataset.
- `slugify(name)` — derives URL slug. Pass `recipient_name` unmodified
  (do not pre-normalize NBSPs etc. — the override lookup is byte-exact).

## Live URL inventory (for SEO / redirect work)

| Route                          | File                                       |
|--------------------------------|--------------------------------------------|
| `/`                            | `src/pages/index.astro`                    |
| `/about`                       | `src/pages/about.astro`                    |
| `/search`                      | `src/pages/search.astro`                   |
| `/president/[slug]`            | `src/pages/president/[slug].astro`         |
| `/pardon/details/[slug]`       | `src/pages/pardon/details/[slug].astro`    |
| `/og/home.png`                 | `src/pages/og/home.png.ts`                 |
| `/og/search.png`               | `src/pages/og/search.png.ts`               |
| `/og/[slug].png`               | `src/pages/og/[slug].png.ts`               |
| `/og/president/[slug].png`     | `src/pages/og/president/[slug].png.ts`     |

Anything not in this table is net-new.

## Mockup → reality field mapping

For implementers porting a `data/sample.js` mockup field to live code:

| Mockup field            | Live equivalent                                      |
|-------------------------|------------------------------------------------------|
| `id` (slug-shaped)      | `slug` (the integer `id` is internal-only)           |
| `name`                  | `recipient_name`                                     |
| `president`             | `administration_slug`                                |
| `type`                  | `clemency_type`                                      |
| `date`                  | `grant_date`                                         |
| `offense`               | `offense` (one line) — there is no separate summary  |
| `category`              | `offense_category`                                   |
| `categoryLabel`         | derive via title-case; do not store separately       |
| `restitution`           | `restitution`                                        |
| `fine`                  | `fine`                                               |
| `sentence`              | `sentence_in_months` + `original_sentence` fallback  |
| `warrantText`           | **does not exist** — only `warrant_url` to PDF       |
| `codefendants`          | **does not exist** — drop from any rendering        |
| `notes`                 | **does not exist** — drop                            |
| `district`              | `district`                                           |

## Out-of-band content not in the DB

- **The 1,500 January 6 individual pardons under Trump-2.** Not currently
  ingested. Trump-2's existing 121 grants exclude J6. The site footnotes
  this on the per-president page (`isTrump` check at `src/pages/president/[slug].astro:114`). When the AI-reclass + scraper update lands, the J6 records will land with `offense_category = "january 6"` (new enum value) and the footnote can drop.
- **`warrant_text`** — the bold detail-page mockup imagines a pull-quote
  from the warrant text. The DB only stores the URL. Pull-quote treatment
  is conditional on the field existing; for now it never renders.
