# Pardonned redesign — implementation handoff

This folder contains briefs for translating the static HTML mockups in this project into the live Pardonned site (pardonned.com).

## What's in this project

- **`mockups/index.html`** — visual index of every mockup. Open this first.
- **`mockups/home-safe.html` / `mockups/home-bold.html`** — two directions for the homepage
- **`mockups/search-safe.html` / `mockups/search-bold.html`** — search/browse
- **`mockups/president-safe.html` / `mockups/president-bold.html`** — per-president page (currently doesn't exist on the live site)
- **`mockups/detail-safe.html` / `mockups/detail-bold.html`** — single-pardon detail page
- **`mockups/all-presidents.html`** — comparison view across all administrations
- **`recent.html`** — recent grants feed
- **`styles/tokens.css`** — design tokens (colors, type, layout primitives) shared across every page
- **`data/sample.js`** — sample data shaped roughly how it appears on the live site

Everything is plain HTML + a single shared CSS file + per-page inline `<style>` and JS. No build step.

## How to use these briefs

Each `NN-*.md` file is sized for one Claude Code session against the live codebase. They are ordered roughly by dependency — start at 00 and walk forward, or pick the ones you want. Each brief contains:

1. **Goal** — one sentence
2. **Mockups to mirror** — which HTML file(s) in this project
3. **Scope** — what's in, what's out
4. **Acceptance criteria** — the testable bits
5. **Notes** — gotchas, copy decisions, edge cases

## Important: pick a direction first

Every page has a **safe** and a **bold** variant. They're not meant to ship together — pick one per page (or mix-and-match elements). The briefs assume you've decided. If you haven't, do that first; the design decision is upstream of any of this.

Recommended starting decision:
- Most teams ship **safe** for the homepage and search (high-traffic, conservative wins) and **bold** for editorial surfaces (per-president, all-presidents, recent feed).
- Detail pages: **safe** is the more defensible default for SEO and skim-reading.

## Design system

All visual primitives live in `styles/tokens.css`. Colors, type, spacing, and component classes (`.badge`, `.source-link`, `table.data`, `.page-1040`, etc.) are defined once and reused. See `00-design-tokens.md` for the token map and how to port it.

## Data shape

`data/` has the rough JSON shapes the mockups consume. The live API likely differs; `00-data-shapes.md` lists the fields each page needs so you can map them.
