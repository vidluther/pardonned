---
name: verify
description: Build, serve, and drive the built pardonned site to verify UI changes at the browser surface.
---

# Verifying pardonned changes

Static Astro site — there is no server runtime. Verify against the built `dist/` in a real browser.

## Build & serve

```bash
pnpm build                                  # needs data/pardonned.db (see CLAUDE.md)
cd dist && python3 -m http.server 8123 --bind 127.0.0.1   # run in background
```

## Drive

`playwright` is already a devDependency (used by the scraper) with Chromium installed — write a throwaway `.mjs` in the repo root (so node resolves `playwright` from `node_modules`), run with `node`, delete after.

Key flows live in inline scripts on the pages (e.g. `/search/` filter/sort/pagination state is all client-side, synced to URL params via `history.replaceState`).

## Gotchas

- **PostHog stubbing:** the built pages embed the real PostHog snippet, which does `window.posthog = e` and **clobbers any stub installed via `addInitScript`**. To observe `posthog.capture` calls, patch *after* load: `page.evaluate(() => { window.posthog = { ...window.posthog, capture: (n, p) => window.__ev.push({n, p}) } })`.
- **Windowed pagination on /search:** only pages 1, 2, …, last are clickable from page 1. To reach a deep page, load it via `?page=N` in the URL or click Next repeatedly.
- **Astro dev vs build:** `pnpm dev` works too, but URL-state behavior should be verified against the production build since inline scripts are what ship.
