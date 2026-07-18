# ADR-0006 — Conviction-shaped vs scope-shaped rendering via shared clause predicates

**Status:** Accepted (2026-07-18). Amends ADR-0003 (the clause guards it described as private to `detail-seo.ts` are now shared and generalized).

## Context

ADR-0003 made SERP strings safe against preemptive-pardon legalese and scraper sentinels, but the guards were private to `detail-seo.ts` and covered only SERP strings. The rendered pages still framed preemptive pardons (CONTEXT.md, "Preemptive pardon") as convictions:

- Fauci's detail page said "The conviction · 3 federal counts" — comma-splitting the warrant's scope legalese into fake counts — and rendered `district = "N/A"` literally.
- The atom feed emitted `Offense: Download PDF Clemency Warrant` (Hunter Biden's sentinel) and labeled scope legalese as an "Offense:".
- Search rows showed `· N/A` districts and legalese as a "sentence"; home/recent listings leaked sentinels.

Six records are affected today (Fauci, Milley, Tina Peters, Hunter Biden, the Biden family group, the January 6 Select Committee) — the highest-traffic, highest-scrutiny pages on the site. During the fix round, Tina Peters proved DOJ's legalese phrasing varies: hers is wrapped in curly quotes and omits the "against the United States" clause entirely, so any single-phrasing regex will miss the next variant.

An alternative path was considered and rejected: classify record shape via the planned AI offense classifier (#26/#28), or store it as a schema field/category value. CONTEXT.md ("Offense category" three-axes rule) records why — shape, crime type, and motive are orthogonal axes, and shape is deterministically derivable from the warrant text.

## Decision

1. **Clause predicates live in `src/lib/pardon-clause.ts` — the single source of truth.** Every surface that renders `offense`, `district`, or `original_sentence` must go through it: detail page, home newswire + leaderboard, recent, search, atom feed, and `detail-seo.ts`. No template touches these fields raw.
2. **A record is conviction-shaped iff `realClause(offense, OFFENSE_SENTINELS)` (or its display twin `proseClause`) is non-null.** Otherwise it renders in **scope mode**. Derived at build time, never stored. Preemptive pardons and broken-data records get the same neutral no-conviction-framing treatment — distinguishing "never charged" from "data unavailable" is deferred editorial work (Pardon Context, ADR-0002).
3. **Scope-mode rendering on the detail page:** no conviction framing anywhere — no counts, no "Convicted of", no district under the `<h1>`. The warrant's scope prose renders as a pull-quote under "The pardon / What this pardon covers." (falling back to `original_sentence` when the offense field is a sentinel — Hunter Biden). The District row and the entire "Sentencing & impact" block are omitted.
4. **Em-dash means "unknown"; omission means "inapplicable."** Conviction records with missing data keep em-dash rows. Scope-mode records omit rows/blocks entirely — there was no case, so the values aren't unknown, they don't exist.
5. **Legalese detection anchors on the shared skeleton, not any one phrasing:** `For any|those … offenses … committed`, tested against quote-stripped text (`displayClause` strips wrapping straight/curly double quotes). Validated against every clause value in the database (6,452 values): exactly the 6 known legalese texts match, zero false positives. Tests pin all known phrasing variants as fixtures.
6. **Listing surfaces still display scope legalese** — it is informative and self-describing ("…may have committed…") — but never display sentinels, and the atom feed never labels legalese as "Offense:".
7. **Conviction-page copy:** the offense list leads with a single "Convicted of:" heading — the former "THE CONVICTION" eyebrow + "N federal counts." pairing both double-labeled the section and asserted a count the data doesn't support (the numbering comes from comma-splitting DOJ's string, not charging documents).

## Consequences

- **Pro:** the page, listings, feed, and SERP strings share one predicate and can never disagree about whether a conviction exists.
- **Pro:** the next preemptive pardon (or scraper regression) is handled the day it's scraped — no hardcoded name list to maintain.
- **Con:** the skeleton regex is a heuristic; a hypothetical real offense reading "For any … offenses … committed" would false-positive into scope mode. Accepted: validated against the full dataset, and the failure mode (under-claiming a conviction) is the safe direction — this site must never state a false conviction, per ADR-0003.
- **Con:** presentation-layer guards continue to paper over scraper defects (same trade-off as ADR-0003; upstream scraper fixes remain follow-up work).

## Alternatives considered

- **Store shape in the schema (flag column or `offense_category` value).** Rejected: collapses orthogonal axes into one column (CONTEXT.md three-axes rule) and duplicates information derivable from the text.
- **AI-classify shape alongside #26/#28.** Rejected: the deterministic signal already exists and is free; gating a live falsehood fix on a classifier project delays it for no gain.
- **Hardcoded list of the six slugs.** Rejected: the Tina Peters variant proves phrasing drifts; the next one would slip through as a fake conviction.
