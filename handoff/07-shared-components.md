# 07 — Shared components to extract

## Goal

When implementing the page briefs, extract these reusable pieces once. They appear on multiple pages and should not be re-implemented per route.

## Components

### `<SiteNav />`
Wordmark + nav links. Active link gets `--accent` underline. Defined in `tokens.css` as `.site-nav` / `.site-nav-inner` / `.wordmark` / `.nav-links`.

Nav links: Home · Search · Presidents · Recent · About.

### `<SiteFooter />`
Faint wordmark + meta line + last-updated timestamp + source link. Defined in `tokens.css` as `.site-footer`.

### `<SectionHeader title deck />`
The masthead pattern from the bold homepage: 2px top border, title left, deck right, 1.2fr / 1fr grid. Reused on every bold-variant page.

```css
.section-header {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 56px;
  align-items: baseline;
  border-top: 2px solid var(--text-primary);
  padding: 28px 0;
}
```

### `<Badge type category />`
Pardon-type and category badges. Defined as `.badge`, `.badge-pardon`, `.badge-commutation`, `.badge-cat`. Color resolution for category badges uses the `--cat-*` tokens.

### `<MoneyFigure value label />`
Restitution / fine display. Accent red, tabular nums, label in caption-grey beneath. Used in the homepage leaderboard, per-president header, and detail-page money strip.

### `<GrantsTable rows columns sortable />`
The sortable, linkable table used on `/search`, `/president/[id]`, and `/all-presidents`. Don't fork; parameterize.

### `<SourceLink url title subtitle />`
The DOJ warrant link block. Defined as `.source-link`. Used on every detail page.

## Notes

- Don't extract anything that only appears once. (E.g. the homepage hero — leave it inline.)
- Keep `SectionHeader` HTML-trivial; it's just a wrapper. Resist the urge to add variants.
