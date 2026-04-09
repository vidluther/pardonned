# Pardonned — Agent Instructions

> Presidential clemency tracker. Astro + SQLite + Tailwind. Deployed to Cloudflare Pages.

## Tech Stack (Corrected from DESIGN.md)

- **Framework**: Astro (static site, not Next.js)
- **DB**: SQLite via `@libsql/client` with Drizzle ORM
- **Styling**: Tailwind CSS — tokens defined in `tailwind.config.ts`
- **Scraper**: Playwright + Cheerio for DOJ data extraction
- **Lint/Format**: oxlint / oxfmt (not ESLint/Prettier)
- **Package Manager**: pnpm

## Key File Locations

| Purpose          | Path                                      |
| ---------------- | ----------------------------------------- |
| Database schema  | `src/db/schema.ts`                        |
| Data loader      | `src/loaders/pardon-details.ts`           |
| Scraper entry    | `src/scraper/scrape.ts`                   |
| Scraper sources  | `src/scraper/presidents.ts`               |
| Design reference | `DESIGN.md` (visual system, color tokens) |

## Environment

```bash
# Required for build and scrape
PARDONNED_DB="./data/pardonned.db"
```

Database is SQLite at `data/pardonned.db` — created at runtime by scraper.

## Commands

```bash
# Dev server
pnpm dev                 # localhost:4321

# Build (requires PARDONNED_DB to exist)
pnpm build

# Lint & format
pnpm lint
pnpm format

# Scrape DOJ pardon data
pnpm scrape              # all presidents
pnpm scrape:trump2       # specific president
pnpm scrape:biden
pnpm scrape:all

# DB admin UI
pnpm db:studio           # Drizzle Kit studio
```

## Data Flow

1. **Scraper** (`pnpm scrape`) → Fetches DOJ pages → Parses HTML → Writes to SQLite
2. **Astro build** → Uses `pardonDetailsLoader` → Queries SQLite → Generates static pages
3. **Output** → Static site in `dist/` deployed to Cloudflare Pages

## Scraper Architecture

- Multiple parsers for different DOJ page formats: `trump2025`, `table-five`, `table-four`, `key-value`
- Auto-detects format via `src/lib/parsers/detect.ts`
- Playwright required: `npx playwright install chromium`
- Presidents configured in `src/scraper/presidents.ts`

## CI/CD (GitHub Actions)

Workflow: `.github/workflows/build-and-deploy.yml`

- Runs daily at 06:00 UTC (cron)
- Scrape → Build → Deploy to Cloudflare Pages
- Requires secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## Important Conventions

- **Colors**: Use Tailwind tokens from config (e.g., `text-accent`, `bg-page`). Never arbitrary values like `text-[#C23B22]`.
- **Restitution**: Always render in `accent` red color per DESIGN.md §8 rule #1.
- **DB path**: Loader resolves relative to `process.cwd()` — always use `data/pardonned.db`.

## Common Gotchas

1. **Build requires DB**: `pnpm build` fails if `data/pardonned.db` doesn't exist. Run `pnpm scrape` first.
2. **Playwright not in deps**: Must install manually: `npx playwright install --with-deps chromium`
3. **Node version**: Requires Node >=22.12.0
