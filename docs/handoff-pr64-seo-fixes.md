# Handoff: fix the PR #64 review findings (detail-page SEO)

**Mission:** fix the 15 verified findings from the xhigh code review of PR #64 on the existing branch `feature/detail-page-seo`, then re-verify with the protocol below. Do **not** merge the PR; push the fixes so the human can review and merge.

## State when you start

- **PR #64** (`feature/detail-page-seo`, base `main`) implements PRD **#58** (issues #59–#63): new `src/lib/detail-seo.ts` module (title/description/Article JSON-LD for pardon detail pages), schema hygiene in `src/lib/seo.ts` + `src/components/SeoHead.astro`, head reordering + Astro Fonts API in `src/layouts/Layout.astro` + `astro.config.mjs`, and a new `src/pages/404.astro`.
- The branch builds, `pnpm test` (127+ assertions) and `pnpm lint` pass — **but the review found real defects the tests don't cover.** The findings are also visible on the PR/issue thread; the authoritative fix spec is this document plus the ADRs.
- This is a GitButler workspace (`gitbutler/workspace`). Use the `but` CLI for all commits — read `.agents/skills/gitbutler/SKILL.md` first. Commit to the existing `feature/detail-page-seo` branch (`but status -fv` → `but commit feature/detail-page-seo -m "..." --changes <ids> --status-after`, then `but push feature/detail-page-seo`). Do not create a new branch; do not commit the unassigned `.agents/` files.

## Read before coding

1. `CONTEXT.md` — especially **Recipient** (not a first-class entity; group clemencies are single Pardon records with many humans in one name string) and **Pardon (full) vs Commutation**.
2. `docs/adr/0003-serp-presentation-policy-in-detail-seo.md` — the corrected SERP policy you are implementing.
3. `docs/adr/0004-structured-data-placement.md` — the corrected JSON-LD policy.
4. `docs/adr/0005-self-hosted-fonts-via-astro-fonts-api.md` — why fonts broke and the rule going forward.
5. `CLAUDE.md` — repo conventions. Notably: **format only files you touch** (`pnpm exec oxfmt <file>` — a repo-wide `pnpm format` reformats ~38 pre-existing files), tests use inline fixtures (no DB access), NBSP gotcha.

## Fixes required (grouped; ADR references are the spec)

### A. Fonts render as system fonts site-wide (BLOCKER) — ADR-0005

`global.css` references literal `'DM Sans'`/`'DM Serif Display'`, but the Fonts API registers hashed family names exposed only via `--font-dm-sans`/`--font-dm-serif-display`.

- Map the Tailwind `@theme` tokens (`--font-sans`, `--font-serif`, and the local `--sans`/`--serif` vars around line 1450) to `var(--font-dm-sans)`/`var(--font-dm-serif-display)`, and rewrite every hardcoded `font-family: 'DM Serif Display', …` / `'DM Sans', …` declaration in `src/styles/global.css` to use the variables. After the fix, `rg "'DM (Sans|Serif)" src/styles/` must return nothing.

### B. detail-seo data-quality and phrasing (BLOCKER) — ADR-0003

In `src/lib/detail-seo.ts`:

1. **Never claim conviction for preemptive pardons**: skip the "Convicted of…" sentence when offense matches `/^for any offenses/i`.
2. **Sentinel guards**: treat `district === "N/A"` and `offense === "Download PDF Clemency Warrant"` as missing (module-level sentinel list, easy to extend).
3. **Strip trailing periods** from offense and district the way original_sentence already does (so `E. D. La.` → single final period).
4. **Cap the title**: word-boundary-truncate the recipient name so the whole title stays ≤ ~110 chars (the `january-6th-committee` record has a 374-char name). Apply the same headline to JSON-LD.
5. **Reinstate restitution**: add `"$X in restitution abandoned."` (use the existing `formatCompactMoney`) when `restitution > 0`, placed right after the lead sentence so truncation can't drop it. Extend `DetailSeoInput` with `restitution`.

### C. Article JSON-LD corrections — ADR-0004

In `src/lib/detail-seo.ts` (and `src/lib/seo.ts` for the shared helper):

1. **`about` typing**: Person by default; Organization for corporate-suffix names (Inc, LLC, Limited, Corp, Co., Company…); omit `about` entirely for group clemencies (heuristic per ADR — when ambiguous, omit).
2. **Remove `datePublished`** (deliberate — see ADR-0004; do not substitute the build date).
3. **Add `image`** (`https://pardonned.com/og/{slug}.png`) **and `author`** (Organization "Pardonned").
4. **Escape `<`** in all JSON-LD serialization (`.replace(/</g, "\\u003c")`) via one shared helper used by detail-seo, `generateSiteJsonLd`, and `generateBreadcrumbJsonLd`.
5. **SearchAction target** in `generateSiteJsonLd`: `/search/?q={search_term_string}` (trailing slash).
6. **og:type**: thread an `ogType` prop through `Layout` → `SeoHead` → `generateMetaTags` (which already supports it); detail pages pass `"article"`.

### D. 404 page Tailwind tokens

In `src/pages/404.astro`: `text-muted` → `text-text-muted` (repo convention, see `Header.astro`); `border-line` → `border-border` (the theme has `--color-border`, no `--color-line`).

### E. Test fixture type error

`src/lib/__tests__/detail-seo.test.ts` corporate fixture (~line 141) is missing the required `slug` field — `tsc --noEmit` fails TS2345. Add the slug.

### F. New tests (TDD — red first, shaped like the real problem records)

Add fixtures modeled on: Fauci (preemptive legalese offense + `N/A` district → description is lead sentence only), Hunter-Biden-shaped junk (`offense: "Download PDF Clemency Warrant"`), `E. D. La.` trailing period, a 374-char group name (title ≤ 110 chars, no `about` in JSON-LD), corporate name → `about` @type Organization, restitution present → "$43.4M in restitution abandoned." early in the description, JSON-LD contains no `datePublished` and does contain `image`/`author`, serialized JSON-LD contains no literal `</script>`-capable `<`.

**Out of scope:** restoring JSON-LD on search/president/static pages (intentional per ADR-0004 — a CollectionPage follow-up may be filed separately); scraper-side data cleanup (the junk Hunter Biden offense/district should be fixed upstream eventually — file an issue if none exists).

## Verification protocol (run all of it; in order)

1. **Unit + static checks** — all must pass:
   ```bash
   pnpm test
   pnpm lint
   pnpm exec tsc --noEmit        # must exit 0 (finding E)
   ```
2. **Build**: `pnpm build` (needs `data/pardonned.db`; takes ~30s).
3. **Built-output assertions** (exact pages chosen because they trigger the bugs):
   - `dist/pardon/details/anthony-s-fauci/index.html` — meta description contains **no** "Convicted of" and no "N/A".
   - `dist/pardon/details/robert-hunter-biden/index.html` — description contains neither "Download PDF" nor "N/A".
   - `dist/pardon/details/stephen-james-jackson/index.html` — no `..` (double period) in the description.
   - `dist/pardon/details/january-6th-committee/index.html` — `<title>` ≤ ~120 chars; Article JSON-LD has no `about`.
   - `dist/pardon/details/hdr-global-trading-limited/index.html` — `about` has `"@type":"Organization"`.
   - `dist/pardon/details/devon-archer/index.html` — description contains "in restitution abandoned".
   - Any detail page — Article JSON-LD has `image` and `author`, and **no** `datePublished`; `og:type` is `article`.
   - `dist/index.html` — SearchAction target is `https://pardonned.com/search/?q={search_term_string}`.
   - `rg -l "fonts.googleapis|fonts.gstatic" dist/` — no matches.
   - `rg "'DM (Sans|Serif)" src/styles/` — no matches (finding A).
4. **Rendered-font check (do not skip — the original PR passed every grep and still shipped broken fonts).** Use the project's `verify` skill (builds, serves `dist/`, drives a browser) or serve manually (`pnpm preview`) and check in the browser that: computed `font-family` of the home-page `h1` resolves to a family whose name starts with `DM Serif Display` (hashed suffix is fine, e.g. via `getComputedStyle` + `document.fonts.check()`); body text resolves to DM Sans; the 404 page's "404" eyebrow is visibly dark gray (`#7a7870`), not invisible.
5. **Commit and push** with `but` (conventional commits, lower-case; **no Co-Authored-By trailer**), then confirm the PR updated: `gh pr view 64`.
6. **Leave a PR comment** summarizing what changed against each finding (fixed / deferred-with-reason), so the human can merge from the comment alone.

## Post-merge checks (human merges; whoever is around runs these)

- `curl -s -o /dev/null -w "%{http_code}" https://pardonned.com/no-such-page/` → `404` (and same for a bogus `/pardon/details/...-xyz/` slug).
- Live detail page in Google's Rich Results test → Article recognized, no Person-for-Organization errors. Expect (documented, intentional) "missing datePublished" warnings.
- Fonts render as DM Sans/DM Serif Display on the live site.
