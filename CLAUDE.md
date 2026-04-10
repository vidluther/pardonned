# pardonned

A static Astro SSG site cataloguing US presidential pardons, deployed to Cloudflare Pages. The scraper pulls clemency data from DOJ warrant notices, writes to a local SQLite file via Drizzle, and the Astro build reads it through a content collection loader.

## Commands

```bash
pnpm dev             # Astro dev server
pnpm build           # Production build (requires data/pardonned.db)
pnpm test            # vitest (not jest)
pnpm lint            # oxlint
pnpm format          # oxfmt
pnpm scrape          # All presidents, ~5-10 min via Playwright
pnpm scrape:trump2   # Single-president variants: trump2 | biden | trump1 | obama | bush
```

## Data flow

```
DOJ warrants  →  src/scraper/scrape.ts  →  data/pardonned.db  (SQLite + Drizzle)
                                                  ↓
                                 src/loaders/pardon-details.ts  (content collection loader)
                                                  ↓
                                       src/content.config.ts
                                                  ↓
                        src/pages/*.astro  (read via getCollection("pardonDetails"))
                                                  ↓
                                               dist/
                                                  ↓
                       GitHub Actions → Cloudflare Pages (on push to main)
```

The loader joins `pardons` against `administrations` and exposes `administration_slug`, `president_name`, and `term_number` on every entry — consumers never hit the DB directly during build.

## Key files

- `src/db/schema.ts` — Drizzle schema for `administrations` and `pardons` tables
- `src/loaders/pardon-details.ts` — content collection loader (SQLite query + join)
- `src/content.config.ts` — Astro content collection config
- `src/lib/pardon-stats.ts` — `computeStats`, `filterByAdministration`, etc.
- `src/lib/president-names.ts` — display-name formatter + collection index builder
- `src/lib/slugify.ts` — URL slug generator (checks override map, caps at 60 chars with sha1 suffix fallback)
- `src/lib/pardon-slug-overrides.ts` — manual slug overrides for long `recipient_name` values
- `src/scraper/scrape.ts` — scraper entry point
- `.github/workflows/build-and-deploy.yml` — CI: scrape → build → Cloudflare deploy

## Database

`data/pardonned.db` is gitignored but required for builds. Bootstrap options:

```bash
pnpm scrape              # Repopulate from DOJ sources (slow, 5-10 min)
# or copy data/pardonned.db from another checkout
# or symlink from a sibling worktree: ln -sf ../../data data
```

## Testing

- vitest 4, not jest. Tests live in `src/lib/__tests__/*.test.ts`.
- Prefer **inline fixtures over DB access** — see `src/lib/__tests__/president-names.test.ts` and `src/lib/__tests__/slugify.test.ts` for the convention (plain JS objects shaped like collection entries, no loader calls).

## Gotchas

- **U+00A0 non-breaking spaces in `recipient_name`**: scraped from `&nbsp;` in DOJ HTML. Three pardon records have NBSPs in specific positions (Biden family group pardon, Bashir Noorzai commutation, Cedric DeWayne Stephens commutation). Any string comparison against `recipient_name` must account for this — see the override keys in `src/lib/pardon-slug-overrides.ts` that use `\u00A0` explicitly.
- **Long `recipient_name` values need manual slug overrides**: ~21 records have names >50 chars, including one 374-char group clemency (the January 6 Select Committee). If the scraper discovers a new long name, `pnpm build` crashes with `ENAMETOOLONG` on the OG image step — add the new record to `src/lib/pardon-slug-overrides.ts`.
- **Slug collisions cause ~30 pardons to collapse**: `getStaticPaths` deduplicates on the slug param, so two different pardons with the same slugified name produce only one HTML page. Pre-existing issue tracked in #13; don't be surprised when `2149 rows read` produces only `2119 pages built`.
- **`.worktrees/` is the isolated-work convention**: feature work happens in `.worktrees/<branch-name>/` project-local worktrees. Gitignored. Create with `git worktree add .worktrees/<name> -b feature/<name>` and symlink `data/` before building.
- **Home page hero is hardcoded**: `src/pages/index.astro:100` says "Pardons granted by Donald J Trump" regardless of which administration's data is displayed. Interim state until #7 lands.

## Deploy

Pushing to `main` triggers `.github/workflows/build-and-deploy.yml`: runs the scraper, builds the site, uploads `dist/` to Cloudflare Pages via wrangler. Required GitHub Actions secrets:

- `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- `PUBLIC_POSTHOG_PROJECT_TOKEN`, `PUBLIC_POSTHOG_HOST` (baked into HTML at build time, so they must be set as secrets not runtime env)
