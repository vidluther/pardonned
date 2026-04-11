# Pardonned 

A website that gives you an easy way to search pardons granted by US Presidents since William Jefferson Clinton took office.

## Local Environment

Edit your .env file and add this.. or whatever you want to call the file. 

```env
# Required for build and scrape
PARDONNED_DB="./data/pardonned.db"
```

Run the scraper first. 
Database is SQLite at `data/pardonned.db` — created at runtime by scraper.
```bash
pnpm scrape 
pnpm dev 
```

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
2. **Node version**: Requires Node >=22.12.0
