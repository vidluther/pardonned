# 08 — Suggested order of work

The briefs in this folder can be done in any order, but here's a sensible sequence if you want to ship continuously:

## Sprint 1 — foundation
1. **`00-design-tokens.md`** — port the design system. Nothing else can land cleanly without this.
2. **`07-shared-components.md`** — extract `<SiteNav>`, `<SiteFooter>`, `<SectionHeader>`, `<Badge>`, `<MoneyFigure>`, `<GrantsTable>`, `<SourceLink>`. These are dependencies for every page brief.

## Sprint 2 — high-traffic pages
3. **`01-homepage.md`** — biggest user-visible win. Pick safe or bold up front.
4. **`02-search.md`** — second-most-trafficked surface. Reuses `<GrantsTable>` from sprint 1.
5. **`04-detail-page.md`** — every search result links here; needs to feel solid.

## Sprint 3 — new surfaces
6. **`03-president-page.md`** — new route, depends on `<GrantsTable>`.
7. **`05-all-presidents.md`** — small page, low risk.
8. **`06-recent-feed.md`** — adds RSS, useful for SEO and journalists.

## What to do before any code

1. **Decide safe vs bold per page.** This is the single biggest design call. Don't let an implementer make it.
2. **Confirm the data shapes** in `00-data-shapes.md` against your actual API. If anything's missing, that's a backend ticket, not a frontend one.
3. **Confirm the route list** with stakeholders. The redesign adds three new routes (`/president/[id]`, `/all-presidents`, `/recent`). Get sign-off before building.

## What to NOT do

- Don't ship safe and bold together — they're alternatives, not complements.
- Don't add charts. The brief was explicit: typography and tables.
- Don't add iconography unless it's already in the live site's vocabulary.
- Don't add editorial commentary. Voice is strictly neutral.
