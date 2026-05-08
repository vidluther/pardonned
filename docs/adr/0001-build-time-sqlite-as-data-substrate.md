# ADR-0001 — Build-time SQLite as the data substrate, published as a downloadable artifact

**Status:** Accepted.

## Context

Astro SSG sites typically use committed markdown or JSON files as their content source. We chose to scrape DOJ warrant pages into a local SQLite file (`data/pardonned.db`, gitignored) and read it through a Drizzle-backed content-collection loader at build time.

The DB is then made downloadable from the site footer. The CI workflow (`.github/workflows/build-and-deploy.yml`) copies `data/pardonned.db` into `public/pardonned.db` after the scrape, Astro's static-asset handling moves it to `dist/pardonned.db` during build, and the footer (`src/components/Footer.astro:96–101`) renders a `<a href="/pardonned.db" download>` link with the file's `mtime` shown as the "last updated" stamp.

## Decision

The DB is a build artifact, not a runtime store. CI re-runs the scraper on every push to `main` before building. The repo is intentionally not self-contained — bootstrapping a build requires running the scraper or copying a DB from another checkout.

Each successful deploy is also a published snapshot of the underlying data: anyone can download the DB from the footer at any time, and prior deploys' DBs are recoverable from CI artifacts.

## Consequences

- **Pro:** typed joins via Drizzle; cheap upserts during scraping; the schema is a single source of truth across loader, stats, and overrides.
- **Pro:** deploys reflect DOJ's current state automatically.
- **Pro:** the DB-as-download is a transparency feature aligned with the editorial stance — "don't trust us, look at the raw data."
- **Pro:** "data history" is implicitly addressed by CI artifacts and the publicly-downloadable DB on each deploy. Anyone who cares about diffs between two points in time can grab two DBs and run their own comparison.
- **Con:** CI is DOJ-dependent and slow (5–10 min). If DOJ throttles or 5xxs the scrape, the deploy fails. Mitigation: cache the most recent successful DB as a CI artifact and fall back to it on scrape failure.
- **Con:** new-contributor onramp requires either running the scraper or fetching a DB. Documented in `CLAUDE.md` "Database" section.

## Alternatives considered

- **Committed JSON content** — would lose typed joins and balloon the repo on every scrape; no win on transparency since the DB download already provides it.
- **Runtime DB on Cloudflare D1** — would lose static-site simplicity and complicate the publish-the-raw-data story.
- **Markdown-per-pardon files** — ~2000+ files, OG image generation already strains build time, no obvious win.
