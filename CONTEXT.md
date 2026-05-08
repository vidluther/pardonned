# Context — pardonned

A nicer view of US presidential pardons. The DOJ Office of the Pardon Attorney's pages are the source of truth; this project re-presents them with editorial intent — surfacing patterns, comparisons, and (where evidence exists) improprieties in how clemency power is used. Originated to expose suspected pay-to-pardon corruption inside the Pardon Attorney's office during the second Trump administration; the project name is a play on "Donald" + "pardoned."

**The editorial layer is presentation and context, not data collection.** If DOJ hasn't published it as a warrant, this site doesn't list it.

## Vocabulary

**Pardon** _(umbrella term)_ — any executive grant of clemency catalogued by this project. Used loosely in the project name, the `pardons` table, and most prose. When the specific clemency type matters, use **Pardon (full)** or **Commutation** (see below).

**Pardon (full)** — `clemency_type = "pardon"`. The recipient is forgiven for the offense and (typically) has civil rights restored. Does not imply incarceration; many full pardons are post-sentence.

**Commutation** — `clemency_type = "commutation"`. The recipient's sentence is reduced or ended early, but the conviction stands.

> **Scope note:** the project does not currently model amnesties or reprieves — only pardons (full) and commutations, because that's how DOJ exposes the underlying warrant data.

**Pardon record** — one row in the `pardons` table. Identified by the compound key `(administration, recipient_name, grant_date, clemency_type)`. Counts and statistics on the site are over Pardon records, not over distinct humans.

**Recipient** — the human(s) named in a Pardon record's `recipient_name`. **Not a first-class entity in the schema today.** There is no recipients table and no person-level deduplication. Group clemencies (e.g. Biden family, January 6 Select Committee) are stored as a single Pardon record with multiple humans implicit in the name string. Person-level questions ("how many distinct people did this president pardon?") are not answerable from the current model — see [issue #51](https://github.com/vidluther/pardonned/issues/51) for the planned extraction.

**Administration** — a single presidential term, identified by a slug like `trump-2` or `obama-1`. **One row per term, not per president.** Trump's first term (2017–2021) and second term (2025–) are two different Administrations in this project's vocabulary, and statistics roll up by Administration unless explicitly aggregated to "all terms of President X."

**President** — the human who served. May map to multiple Administrations. Talking about "all pardons issued by this person" is an explicit aggregation across Administrations, not a primary query.

**Term boundary** — the inauguration date that separates one Administration from the next. Encoded in `TERM_BOUNDARIES` (`src/scraper/presidents.ts`) so the scraper can split a DOJ source page that covers both terms of one president into the correct Administration.

**Warrant** _(of clemency)_ — the formal DOJ-published document recording an exercise of the President's clemency power. The project's source of truth: every Pardon record is scraped from a DOJ warrant page, and `warrant_url` on each record points back to it. **Not a first-class entity** in the schema — one warrant typically maps to one Pardon record, but a single warrant can cover multiple recipients (group clemencies).

## Scope of the catalog

The project re-presents what the DOJ Office of the Pardon Attorney has published as a Warrant of Clemency. **Pardons announced by the President but not yet (or never) issued as DOJ warrants are out of scope.** The DOJ pages are the source of truth; this site is a nicer view of them. Do not propose features, scrapers, or data sources that go around DOJ.

**Presidential scope: all Presidents since William Jefferson Clinton.** Currently: Clinton, Bush (43), Obama, Trump (terms 1 and 2), Biden. This rule has no ambiguity around death status — Carter is out because his term predates Clinton's, not because of when he died. Future presidents automatically come into scope; nothing earlier than Clinton ever does.

## Offense category

A closed taxonomy on each Pardon record: `violent crime`, `fraud`, `drug offense`, `FACE act`, `immigration`, `firearms`, `financial crime`, `other`.

The taxonomy is **editorial, not legal**. Categories exist when they help surface patterns this project cares about. `FACE act` is a peer of broader categories (rather than nested under "violent crime" or "other") because the Trump-2 pardons of FACE Act defendants are a focal pattern. **Don't "normalize" or flatten the taxonomy without raising it as an editorial change first.**

Classification today is regex-based via `categorizeOffense()` in `src/lib/parsers/categorize.ts`. **An LLM-backed enhancement is planned in [issue #26](https://github.com/vidluther/pardonned/issues/26)** — the categories themselves stay; only the classifier gets smarter, with a local cache to keep build cost flat. Don't hand-tune the regex map or attempt to swap classifiers ahead of #26 — coordinate with that work.

## Pardon Context (planned, not yet in the schema)

Editorial annotations attached to a specific Pardon record, providing the "why this matters" layer the catalog adds on top of DOJ's bare data. The first planned form is **news article links** — pointers to outside reporting that documents alleged improprieties, recipient backstory, or political context. The schema may grow to support other forms (commentary, related-pardon links, quotes) under the same umbrella.

Pardon Context is **never authoritative on the underlying fact of a Pardon** — DOJ remains the source of truth; Context is interpretation around it. See [ADR-0002](docs/adr/0002-pardon-context-as-editorial-layer.md) for the boundary rules and [issue #52](https://github.com/vidluther/pardonned/issues/52) for the planned implementation.
