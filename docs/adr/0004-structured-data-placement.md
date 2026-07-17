# ADR-0004 — Structured-data placement: site schema on home, per-record Article on detail pages

**Status:** Accepted. Governs the PR #64 fix round.

## Context

Before PR #64, every page emitted identical WebSite + Organization + generic WebPage JSON-LD — repetition with no per-page signal. PRD #58 replaced this with differentiated markup; the xhigh review then found the first cut emitted false entity claims (Person for corporations and group clemencies), decades-stale `datePublished` values (grant dates back to 1994), a SearchAction URL violating the trailing-slash policy, and no `image`/`author` (Google's top recommended Article fields).

## Decision

- **Home page only:** WebSite (with SearchAction targeting `/search/?q={search_term_string}` — trailing slash per site policy) + Organization.
- **Detail pages:** BreadcrumbList (kept) + one Article per Pardon record: `headline` (same ≤110-char policy as the title), `description`, `image` (the page's existing `/og/{slug}.png`), `author` and `publisher` (Organization "Pardonned"), `mainEntityOfPage`.
- **`about` typing follows the recipient's actual nature:** Person by default; Organization when the name matches a corporate-suffix heuristic (Inc, LLC, Limited, Corp, …); **omitted entirely for group clemencies** — Recipient is not a first-class entity (CONTEXT.md) and markup must never claim a group of humans is one Person. When ambiguous, omit: no claim beats a false claim.
- **`datePublished` is deliberately omitted.** The grant date is not a publication date (a 1994 warrant would make the page look 30 years stale in SERPs), and a fabricated build date would churn every deploy. We accept Google's "missing recommended field" warning as the lesser evil; the grant date lives in the description and page body.
- **All JSON-LD is serialized with `<` escaped** (`<`) via one shared helper — inline `set:html` scripts must be breakout-proof against scraped text.
- **`og:type` is `article` on detail pages** (threaded Layout → SeoHead), consistent with the Article markup. No `article:published_time`, consistent with omitting `datePublished`.
- **Other routes (search, recent, about, all-presidents, president/*) emit no structured data for now.** The old generic WebPage boilerplate carried ~no value. Real per-type schema (e.g. CollectionPage for Administration pages) is future work, not a regression to restore.

## Consequences

- **Pro:** every emitted claim is true; validation-clean Article markup on ~3,200 pages with the recommended image/author fields.
- **Con:** the missing-`datePublished` warning persists in Search Console — documented as intentional here so nobody "fixes" it back to the grant date.
- **Con:** Administration pages have no structured data until the CollectionPage follow-up lands.

## Alternatives considered

- **`datePublished` = grant date** — rejected: factually wrong for the page and harmful in SERPs.
- **Keep boilerplate everywhere** — rejected: repetition without signal.
- **Dataset schema instead of Article** — plausible for this catalog, but Article + per-record OG image matches how the pages actually read; revisit if rich-result eligibility stays nil.
