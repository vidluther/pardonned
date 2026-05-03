# 06 — Recent grants feed

## Goal

Add a `/recent` route — a chronological feed of the most recent grants, grouped by month. Useful for journalists and watchers tracking what's been signed lately.

## Mockups to mirror

Only one variant: **`recent.html`**.

## Scope

### In
- Reverse-chronological list of grants, grouped under a month header (`November 2025`, etc.).
- Each entry: date, recipient name (linked to detail), president (linked to per-president), category badge, restitution figure if non-null.
- Pagination by month — load 1–2 months at a time, "Load older" button at the bottom.
- RSS/Atom feed at `/recent.xml` mirroring the same data.

### Out
- Filters. This is a feed, not search.
- Subscribe-by-email.

## Acceptance criteria

- Months with no grants are skipped — don't render an empty month header.
- The feed XML validates against an Atom 1.0 validator.
- Page is server-rendered (this is heavily SEO-relevant content).

## Notes

- The RSS feed is the implicit deliverable for power users — make it discoverable via `<link rel="alternate" type="application/atom+xml" …>` in `<head>`.
- Date format in the list: just the day number, with the month carried by the section header. `12` not `Nov 12, 2025`.
