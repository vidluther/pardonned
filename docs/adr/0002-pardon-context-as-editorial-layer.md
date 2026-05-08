# ADR-0002 — Pardon Context as a separate editorial layer over DOJ-sourced Pardon records

**Status:** Accepted (boundary established; schema and feature implementation pending — to be opened as a GitHub issue).

## Context

The project has a dual identity: a faithful mirror of what DOJ publishes as Warrants of Clemency, and an investigative re-presentation that points readers at outside reporting on improprieties. Without a clear rule, those two intentions tend to bleed together — e.g. someone might be tempted to extend the DOJ-sourced `offense` field with editorial commentary, or paste news article URLs into `notes`-style columns on the `pardons` table. That contamination would erode the "DOJ is the source of truth" guarantee the project depends on (see [ADR-0001](0001-build-time-sqlite-as-data-substrate.md), where the DB is itself published as a downloadable artifact).

## Decision

Editorial annotations live in a separate concept called **Pardon Context**, attached to Pardon records but stored, queried, and rendered as a distinct layer. The first form will be news article links; the schema may later grow other forms (commentary, related-pardon links, quotes) under the same umbrella.

### Boundary rules

1. **DOJ-sourced fields are read-only with respect to editorial intent.** The scraper writes them; nothing else does. Editorial commentary never lives inside `offense`, `recipient_name`, `original_sentence`, or any other DOJ-sourced column.
2. **Pardon Context never expands the catalog.** If DOJ hasn't published a warrant for a pardon, no amount of news context creates a Pardon record. Context attaches to existing Pardon records only.
3. **Pardon Context is non-authoritative on facts.** It exists to point readers at interpretation, not to assert facts about the pardon itself. UI must render it in a way that makes that boundary visible (e.g. a clearly labelled "Reporting & context" section, distinct from the DOJ data block).
4. **Pardon Context survives re-scrapes.** When the scraper rebuilds the `pardons` table, attached Context must not be orphaned. Implementation should key Context to a stable identifier (the Pardon's `slug` is the current candidate, since slug overrides already pin it).

## Consequences

- **Pro:** the editorial mission gets a real home without compromising the data-mirror promise.
- **Pro:** future agents have a clear rule to point at when someone proposes inlining commentary into DOJ fields.
- **Pro:** anyone downloading `pardonned.db` from the footer still gets unedited DOJ data; the editorial layer is additive, not destructive.
- **Con:** more entities to design, more queries in the loader, more UI surface to maintain.
- **Con:** slug-keyed Context is fragile if a slug gets renamed (e.g. via the override map). Renames need to migrate Context.
- **Con:** the boundary depends on discipline — there is nothing in the schema today that prevents someone from writing editorial text into a DOJ-sourced column. Code review and this ADR are the enforcement mechanism.

## Alternatives considered

- **Inline editorial commentary in DOJ-sourced columns.** Rejected — contaminates the data, breaks the "DOJ is source of truth" guarantee, and corrupts the publicly-downloadable DB artifact (ADR-0001).
- **External commentary site that doesn't bind to specific pardons.** Rejected — loses the per-pardon contextual richness that's the whole editorial point.
- **Markdown files in the repo, one per annotated pardon.** Rejected — fights ADR-0001's SQLite-as-substrate decision; would create two parallel content stores.
