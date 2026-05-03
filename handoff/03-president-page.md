# 03 — Per-president page (NEW)

## Goal

Create a new route `/president/[id]` that doesn't currently exist on the live site. It's the canonical landing for a single administration's clemency record.

## Mockups to mirror

Pick **one**:
- **`president-safe.html`** — bordered stat blocks, table of grants below.
- **`president-bold.html`** — editorial masthead with display-scale totals, term context, ranked grants.

## Scope

### In
- Route: `/president/[id]` where `id` is `trump-1`, `trump-2`, `biden`, `obama-2`, etc. (See `00-data-shapes.md` for the closed set.)
- Header: display name, term label ("First term · 2017–2021"), the four totals (grants, pardons, commutations, restitution forgiven, fines forgiven).
- Body: full list of that president's grants, sorted by date desc by default. Same column shape as `/search` results.
- Category breakdown for this president: top 3–5 categories with percentage of their grants.
- Cross-link strip: prev/next president by chronology, link to `/all-presidents`.

### Out
- Co-defendant network view.
- Editorial commentary. Voice is strictly neutral — let the data speak.

## Acceptance criteria

- All current and former presidents with at least 1 grant have a working page.
- Direct links work — `/president/trump-2` is a valid URL even before navigation.
- The grants table is the same component as `/search`'s, just pre-filtered. Don't fork it.
- Header totals are computed server-side or cached; don't recompute on every visit.
- 404 if `id` doesn't match a known president.

## Notes

- Term label format is enforced: `"First term · 2017–2021"`, `"Second term · 2013–2017"`, or just the year range with an em-dash for incumbents. See `data/presidents.json` for examples.
- For incumbent presidents (no term_end), use a single em-dash: `"— · 2025–"`.
- The bold variant uses display-scale stat figures (~64–96px DM Serif Display). On mobile, scale these down to ~36px — they break layout otherwise.
