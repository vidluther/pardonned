# 05 — All-presidents comparison page

## Goal

Add a `/all-presidents` route — a single-page comparison of every administration's clemency record. Linked from the homepage admin strip and from every per-president page.

## Mockups to mirror

Only one variant for this page: **`all-presidents.html`**.

## Scope

### In
- Sortable table, one row per president-term. Columns: President, Term, Grants, Pardons, Commutations, Restitution forgiven, Fines forgiven.
- Default sort: total grants desc.
- Click any column header to sort by it.
- Each row links to `/president/[id]`.
- Brief editorial preamble (1–2 sentences) explaining what counts as a grant.

### Out
- Filtering. The set is small (~15 rows); filtering adds nothing.
- Charts.

## Acceptance criteria

- All sortable columns sort correctly, including across null values (nulls sort to the bottom regardless of asc/desc).
- Term label is shown as a small grey caption beneath the president's name.
- Restitution column uses `--accent`.
- Page works without JavaScript for the default sort (server-rendered table); JS only enhances re-sorting.

## Notes

- Multiple terms for one president = multiple rows. So Trump appears twice (2017–2021 and 2025–), Obama twice, Clinton twice, etc.
- Combine column for "all terms" total if useful; the mockup keeps each term separate to preserve apples-to-apples comparison with single-term presidents.
