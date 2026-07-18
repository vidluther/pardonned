# ADR-0003 — SERP presentation policy lives in the detail-seo module

**Status:** Accepted. Governs the PR #64 fix round (review findings from the xhigh review, 2026-07-17). **Amended by [ADR-0006](0006-conviction-vs-scope-presentation.md) (2026-07-18):** the clause guards described below as module-private (sentinels, legalese regex, `cleanClause`/`realClause`) now live in `src/lib/pardon-clause.ts`, shared by every rendering surface, and the legalese pattern is generalized beyond `/^for any offenses/i` to cover DOJ's phrasing variants (Tina Peters). The SERP policy itself is unchanged.

## Context

A 3-month GSC analysis (`gsc/analysis-2026-07-17.md`) showed detail pages take ~99% of clicks but underperform their positions: top-5 rankings with zero clicks, titles that said only `{recipient} — Pardonned`, descriptions without case facts. PRD #58 introduced `buildDetailSeo()` — one pure function returning `{ title, metaDescription, jsonLd }` — as the single home for SERP policy.

The first implementation assembled facts naively and the review proved that Pardon record fields cannot be trusted raw: preemptive pardons (Fauci, Milley, Biden family, January 6 Committee) carry legalese in `offense` ("For any offenses against the United States which he may have committed…") describing people who were **never convicted**; scraper sentinels leak through (`district = "N/A"`, Hunter Biden's `offense = "Download PDF Clemency Warrant"`); 574 abbreviated districts end in `.`; and group clemencies (see CONTEXT.md — Recipient is not a first-class entity) have name strings up to 374 chars.

## Decision

All SERP-facing strings come from `buildDetailSeo()`. Templates never assemble title/description text.

- **Title:** `{name} — {Pardon|Commutation} by {short president} ({year})`. The recipient name is word-boundary-truncated so the full title stays ≤ ~110 chars (group clemencies would otherwise emit 400-char titles). President short names via an explicit map (Joe Biden, Bill Clinton; both Bushes keep initials) plus a middle-initial strip fallback.
- **Description clause order:** grant sentence → restitution (`$X in restitution abandoned.`, when > 0 — the site's headline data point, placed early so truncation can't drop it) → conviction sentence → original sentence. Truncated at a word boundary to 155 chars.
- **The conviction sentence is emitted only when the offense text describes an actual conviction.** Skip it when the offense matches preemptive-pardon legalese (`/^for any offenses/i`) or when offense/district match known scraper sentinels (`"N/A"`, `"Download PDF Clemency Warrant"`). The sentinel list lives in the module, with tests shaped like the real problem records. A page must never state a false conviction, even when the data is dirty.
- **Trailing periods are stripped from every clause value** before the module adds its own punctuation (fixes `E. D. La..`).
- **NBSP → space normalization applies to SERP strings only.** Slug/override lookups stay byte-exact (repo gotcha).

## Consequences

- **Pro:** policy is testable in isolation (inline fixtures, no DB) and a format change is a one-place edit.
- **Pro:** the page never lies, even over dirty data.
- **Con:** data-quality guards live in the presentation layer, papering over scraper defects. The real fix is upstream in the scraper (junk offense/district on recent high-profile records) — tracked as follow-up work; the guards stay regardless, as insurance against future dirt.

## Alternatives considered

- **Clean the data first, present naively** — slower to ship and still unsafe against the next scraper regression.
- **Template-side assembly** (status quo ante) — scattered policy, unreviewable, already produced the CTR problem.
