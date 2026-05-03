# 02 — Search / browse

## Goal

Replace the live search page with a denser, more filterable, more comparable list. The current search returns a flat list of cards; the redesign turns it into a sortable data table with proper filter controls and date-range support.

## Mockups to mirror

Pick **one**:
- **`search-safe.html`** — table layout, filter chips above. Conservative.
- **`search-bold.html`** — column-rich, sortable headers, inline preview row on click. Power-user oriented.

## Scope

### In
- Filter bar with: text query (recipient name + offense summary), president (multi-select), offense category (multi-select), grant type (pardon/commutation/remission), date range (before/after).
- Table with columns: Date · Recipient · President · Type · Category · Restitution forgiven.
- Sortable by date (default desc), restitution (desc), recipient (asc).
- Each row is a link to the detail page.
- Pagination or infinite scroll — pick one. The mockup uses page-based; either works.
- Empty state: when filters return nothing, show a sentence ("No grants match these filters.") and a "Clear filters" link. Do not show suggested searches.
- URL state: every filter and sort key serializes to query string. Refreshing preserves state. Back-button works.

### Out
- Saved searches.
- Search-result highlighting (the bold mockup has it; cut if it's expensive).
- Map / network view of co-defendants (separate page, future).

## Acceptance criteria

- Filter changes update the URL without a full reload.
- Date range accepts before-only, after-only, or both.
- Restitution column shows `—` when null, never `$0` or `unknown`.
- Sort indicator (▲ / ▼) sits in the header cell, hairline-aligned with the column text.
- Mobile (<700px): table collapses to stacked rows; filter bar becomes a bottom-sheet or accordion.

## Notes

- The bold mockup uses an inline expand-on-click row that previews warrant text. If the API doesn't return warrant text in the search response, drop this — don't request it eagerly.
- Default sort is `date_granted desc`. This matches user expectation for "what's recent."
- Don't show a result count higher than ~9999 without a comma — it tanks information density. The mockup uses `1,904` style throughout.
