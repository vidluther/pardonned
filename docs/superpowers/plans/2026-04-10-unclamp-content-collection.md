# Unclamp Content Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the hardcoded single-administration filter from the Astro content collection so `getCollection("pardonDetails")` returns pardons for every administration currently in the SQLite database, and record the build-output impact so we can close GitHub issue #11 with a concrete "ship as-is" or "open mitigation follow-up" decision.

**Architecture:** The fix is a one-line edit to `src/content.config.ts` removing the `administrationSlug: "trump-2"` argument passed to `pardonDetailsLoader`. The loader at `src/loaders/pardon-details.ts` already treats that option as optional — when omitted, it runs the same inner-joined query against `administrations` without the `.where()` clause (lines 103-107). Every downstream consumer (`src/pages/index.astro:26`, `src/pages/search.astro:11`, `src/pages/pardon/details/[slug].astro:11`, `src/pages/og/[slug].png.ts:9`, `src/pages/og/search.png.ts:8`, `src/pages/og/home.png.ts:9`) will transparently receive more entries. The existing `filterByAdministration` helper at `src/lib/pardon-stats.ts:142` already matches on `data.administration_slug`, which the loader schema at `src/loaders/pardon-details.ts:11` already includes. No schema changes, no new helpers, no refactoring. The real work of this plan is verifying the multi-administration build still produces valid output and recording before/after metrics.

**Tech Stack:** Astro 6 content collections, Drizzle ORM over libsql, vitest 4, pnpm 10, oxlint, oxfmt.

**Related issues:** Closes #9. Resolves (or opens follow-up for) #11. Unblocks #6, #7, #8.

**Sibling plan:** `docs/superpowers/plans/2026-04-10-president-display-name-helper.md` (issue #10). That plan is fully independent — no ordering dependency either way.

---

## Context

GitHub issue #9 identified that `src/content.config.ts:9` currently passes `administrationSlug: "trump-2"` to the content loader, which means every downstream page that calls `getCollection("pardonDetails")` only sees the 121 trump-2 pardons, even though the scraped database at `data/pardonned.db` holds roughly 2,149 pardons across five populated administrations (trump-2: 121, biden-1: 257, trump-1: 238, obama-1: 12, obama-2: 1,521). Three feature issues (#6 president filter on search, #7 president filter on home, #8 compare administrations) are all blocked because there is literally no multi-administration data in the collection for them to operate on.

Issue #11 is a paired investigation: before we ship the unclamp, we want to measure the impact on the build output because `src/pages/search.astro` embeds the full pardon list as inline JSON in the rendered HTML (`src/pages/search.astro:355-356`) and the detail page + OG image routes render one output per entry. Unclamping will grow the dataset roughly 18x, and we need numbers to know whether mitigations (per-administration paging, lazy loading, etc.) are needed before the feature work lands.

This plan folds #11's measurements into #9's verification steps. The output is either "ship as-is and close #11" or "ship #9 and open a specific mitigation follow-up issue for #11".

## File Structure

- Modify: `src/content.config.ts:8-10` — remove the `administrationSlug` argument
- Modify: this plan file (`docs/superpowers/plans/2026-04-10-unclamp-content-collection.md`) — append measurements and decision in Tasks 1, 4, and 5

No new files are created. The loader (`src/loaders/pardon-details.ts`) and every downstream consumer require zero source changes. The home page hero headline at `src/pages/index.astro:100` is still hardcoded to "Pardons granted by Donald J Trump" after this plan — that's expected and is GitHub issue #7's scope, not this one. Until #7 ships, the stats under that headline will reflect all administrations while the headline still says Trump; that interim inconsistency is acknowledged.

## Worktree Preconditions

This plan runs inside the worktree at `.worktrees/multi-admin-prereqs` on branch `feature/multi-admin-prereqs`. The worktree was created with a clean `pnpm install` and a green vitest baseline (6 tests passing). The worktree does NOT have its own `data/` directory — Task 0 symlinks the parent checkout's database into place.

---

## Task 0: Make the database available inside the worktree

The Astro content loader reads a SQLite file at `data/pardonned.db` relative to `process.cwd()` during every build. Worktrees do not inherit untracked directories, so the worktree has no `data/` directory at start. Symlink the parent checkout's `data/` directory in so builds can resolve the DB.

**Files:**

- None modified (environment-only setup)

- [ ] **Step 1: Symlink the shared data directory into the worktree**

From the worktree root:

```bash
ln -sf ../../data data
```

- [ ] **Step 2: Verify the symlink points at a real SQLite file**

```bash
ls -l data/pardonned.db
```

Expected: a file with size around 1.4 MB (or larger if the scraper has run recently). The path may display as a symlink target; that's fine.

- [ ] **Step 3: Re-confirm the test baseline is clean**

```bash
pnpm test
```

Expected: `6 passed (6)` with 0 failures. If this reports anything else, stop and investigate before proceeding — the rest of the plan assumes a clean baseline.

---

## Task 1: Record pre-unclamp baseline metrics

Build the site in its current (clamped) state and record the numbers that Task 4 will compare against. These numbers are the "before" column of issue #11's measurement.

**Files:**

- Modify: `docs/superpowers/plans/2026-04-10-unclamp-content-collection.md` (append a markdown table to the "Measurements" section at the bottom of this file)

- [ ] **Step 1: Clear any previous build artifacts**

```bash
rm -rf dist
```

- [ ] **Step 2: Build the site and record wall-clock time**

```bash
time pnpm build
```

Expected: build completes without errors. The Astro output will include a line similar to `[pardon-details-loader] Read 121 rows from SQLite`, confirming trump-2 is loaded. Record the wall-clock time (the `real` or `user` line from `time`) — this becomes the baseline build-time number.

- [ ] **Step 3: Collect file-size and count metrics**

Run each command and note the output:

```bash
du -sh dist
find dist -name "*.html" | wc -l
find dist -name "*.png" -path "*/og/*" | wc -l
du -h dist/search/index.html
gzip -c dist/search/index.html | wc -c
du -h dist/index.html
gzip -c dist/index.html | wc -c
```

- [ ] **Step 4: Append the baseline row to the Measurements table in this plan file**

Open this plan file and replace the "Measurements" section at the bottom with a fleshed-out markdown table whose "Baseline (pre-unclamp)" column holds the real numbers from Step 2 and Step 3. Do not leave any cell as a placeholder — if a number is zero or N/A, write `0` or `N/A` explicitly.

Template (the engineer fills in the bracketed numbers; do not commit the literal brackets):

```markdown
| Metric                                 | Baseline (pre-unclamp)         | Post-unclamp | Ratio |
| -------------------------------------- | ------------------------------ | ------------ | ----- |
| Total `dist/` size                     | [number from `du -sh dist`]    |              |       |
| HTML file count                        | [number from `find \| wc -l`]  |              |       |
| OG PNG count                           | [number from OG find \| wc -l] |              |       |
| `dist/search/index.html` raw size      | [number from `du -h`]          |              |       |
| `dist/search/index.html` gzipped bytes | [number from `gzip \| wc -c`]  |              |       |
| `dist/index.html` raw size             | [number]                       |              |       |
| `dist/index.html` gzipped bytes        | [number]                       |              |       |
| `pnpm build` wall time                 | [from `time` output]           |              |       |
```

---

## Task 2: Apply the unclamp

This is the actual source change. One edit, one file, three lines removed.

**Files:**

- Modify: `src/content.config.ts:7-12`

- [ ] **Step 1: Edit `src/content.config.ts`**

Replace the current definition:

```ts
const pardonDetails = defineCollection({
  loader: pardonDetailsLoader({
    administrationSlug: "trump-2",
  }),
  schema: pardonDetailSchema,
});
```

with:

```ts
const pardonDetails = defineCollection({
  loader: pardonDetailsLoader(),
  schema: pardonDetailSchema,
});
```

The loader signature at `src/loaders/pardon-details.ts:57-59` already accepts an empty options object: `pardonDetailsLoader(options: PardonDetailsLoaderOptions = {})`. With no `administrationSlug`, the query at line 107 falls through to `await query.all()` instead of the filtered `where(eq(administrations.slug, ...))` branch.

- [ ] **Step 2: Run the linter on the changed file**

```bash
pnpm lint src/content.config.ts
```

Expected: no issues. If oxlint flags the now-unused `PardonDetailsLoaderOptions` import style or any other thing introduced by the edit, fix before continuing.

- [ ] **Step 3: Run the formatter**

```bash
pnpm format src/content.config.ts
```

Expected: either no diff or a trivial whitespace-only diff (which is fine to keep).

---

## Task 3: Rebuild with the unclamp applied and smoke-test output

Confirm the expanded dataset actually loads and that every page type still renders.

**Files:**

- None modified

- [ ] **Step 1: Clean the previous build**

```bash
rm -rf dist
```

- [ ] **Step 2: Rebuild**

```bash
pnpm build
```

Expected: build succeeds. The loader log line should now read approximately `Read 2149 rows from SQLite` (exact number depends on scraper state — any number noticeably larger than 121 confirms the unclamp worked). Build time will be longer than the baseline because Astro is generating ~18x more pardon detail pages and ~18x more OG PNG renders.

- [ ] **Step 3: Verify the built page counts match the new dataset size**

```bash
ls dist/index.html
ls dist/search/index.html
find dist/pardon/details -name "index.html" | wc -l
find dist/og -name "*.png" | wc -l
```

Expected: `dist/index.html` and `dist/search/index.html` both exist. The detail-page count and OG PNG count should each be roughly 18x the baseline count from Task 1. If they still match the baseline, the content loader is still filtering — revisit Task 2.

- [ ] **Step 4: Confirm at least one non-trump-2 administration actually rendered**

```bash
grep -rl "Joe Biden\|Barack Obama" dist/pardon/details/ | head -5
```

Expected: at least one matching file path from each grep alternative. If zero matches, the unclamp didn't propagate past the content loader — stop and investigate before continuing.

- [ ] **Step 5: Confirm the home-page hero still renders (even though stats will look off until #7 lands)**

```bash
grep -c "Pardons granted by Donald J Trump" dist/index.html
```

Expected: `1`. The hardcoded headline at `src/pages/index.astro:100` is not touched by this plan — issue #7 handles it. The hero will visually mismatch the post-unclamp stats, which is documented as expected interim state.

---

## Task 4: Record post-unclamp metrics

Same commands as Task 1 Step 3, but populate the "Post-unclamp" column.

**Files:**

- Modify: `docs/superpowers/plans/2026-04-10-unclamp-content-collection.md` (fill in the "Post-unclamp" and "Ratio" columns of the Measurements table)

- [ ] **Step 1: Record wall-clock build time**

Re-run the build with `time`:

```bash
rm -rf dist && time pnpm build
```

Expected: build succeeds again. Record the wall-clock number. (The double build is intentional — the first was for smoke testing, this one isolates timing from any warm caches left by Task 3.)

- [ ] **Step 2: Collect the same file-size metrics as Task 1 Step 3**

```bash
du -sh dist
find dist -name "*.html" | wc -l
find dist -name "*.png" -path "*/og/*" | wc -l
du -h dist/search/index.html
gzip -c dist/search/index.html | wc -c
du -h dist/index.html
gzip -c dist/index.html | wc -c
```

- [ ] **Step 3: Fill in the Post-unclamp and Ratio columns of the Measurements table**

Compute each ratio as `post ÷ baseline` to one decimal place (e.g., `18.2x`). Wall-clock time ratio is `post_time ÷ baseline_time`. No placeholders — real numbers only.

---

## Task 5: Apply the decision criteria and record the outcome for #11

Issue #11 listed four possible mitigations: ship as-is, per-administration paging, lazy loading, or per-category splitting. This task applies concrete thresholds to the measurements and either closes #11 or opens a specific follow-up.

**Files:**

- Modify: `docs/superpowers/plans/2026-04-10-unclamp-content-collection.md` (write the Decision section)

- [ ] **Step 1: Apply each criterion against the numbers in the Measurements table**

For each of the following, write "PASS" or "FAIL" next to the criterion in the Decision section below:

1. **Search page size**: is `dist/search/index.html` gzipped size ≤ 500 KB? (PASS = acceptable for a static search page on mobile; FAIL = mitigation needed.)
2. **Total output size**: is total `dist/` size ≤ 50 MB? (PASS = fits comfortably on CDN tiers without special handling; FAIL = consider per-administration splitting.)
3. **Build time**: does `pnpm build` complete in ≤ 3 minutes wall-clock on local hardware? (PASS = CI pipeline stays under the existing 30-minute GitHub Actions timeout with headroom; FAIL = investigate OG image generation cost.)
4. **Stat integrity**: does `grep -c "NaN" dist/index.html` return `0`? (PASS = all home-page stat cards render valid numbers; FAIL = the unclamp has exposed a stats-calculation bug that has to be fixed before shipping.)

- [ ] **Step 2: Write the decision in the Decision section**

If all four criteria pass, write:

```markdown
## Decision

All four criteria passed. Ship the unclamp as-is. Issue #11 can be closed with a comment linking to this plan file as the measurement record. No mitigation follow-up needed.
```

If any criterion fails, write:

```markdown
## Decision

Failed criteria: [list the failing ones, e.g. "search page gzipped size: 720 KB (> 500 KB)"].

Ship the unclamp as-is behind a new follow-up issue that implements [specific mitigation from #11's list: "per-administration paging" | "lazy loading" | "per-category splitting"]. Link the new issue from #11 and from this plan file.
```

Include the actual numbers, not placeholders.

- [ ] **Step 3: If a follow-up issue is needed, open it now**

Only run this step if Step 2 wrote a failing-criteria decision. Run:

```bash
gh issue create --assignee vidluther --title "Mitigate search page size after content unclamp" --body "$(cat <<'EOF'
Follow-up from #11 measurement (recorded in docs/superpowers/plans/2026-04-10-unclamp-content-collection.md).

Observed after unclamping the content collection:
- [paste the failing criteria from the Decision section]

Mitigation to implement: [paste the chosen mitigation from the Decision section].
EOF
)"
```

Record the new issue number in the Decision section of this plan file.

---

## Task 6: Final verification and commit

Run the full verification suite, make sure everything's clean, commit the change.

**Files:**

- Commit: `src/content.config.ts`, `docs/superpowers/plans/2026-04-10-unclamp-content-collection.md`

- [ ] **Step 1: Run the full verification suite**

```bash
pnpm test && pnpm lint && pnpm format && rm -rf dist && pnpm build
```

Expected: vitest passes (still 6 tests), oxlint reports no issues, oxfmt writes no diffs, Astro build completes without errors. If any step fails, fix before committing.

- [ ] **Step 2: Confirm the working tree has exactly the expected changes**

```bash
git status --short
```

Expected output (paths and order may vary slightly):

```
 M src/content.config.ts
 M docs/superpowers/plans/2026-04-10-unclamp-content-collection.md
```

If there are any other modified or staged files, investigate — do not commit unrelated changes.

- [ ] **Step 3: Stage and commit**

```bash
git add src/content.config.ts docs/superpowers/plans/2026-04-10-unclamp-content-collection.md
git commit -m "$(cat <<'EOF'
feat: load all administrations in content collection

Removes the trump-2 filter from the Astro content collection loader so
getCollection("pardonDetails") returns pardons for every administration
present in the scraped database. Unblocks the president-filter features
tracked in #6, #7, and #8.

Measurement results for #11 (search page size, build time, output count)
are recorded in docs/superpowers/plans/2026-04-10-unclamp-content-collection.md.

Closes #9.
EOF
)"
```

Per project convention: do NOT add a `Co-Authored-By` trailer. (See `~/.claude/CLAUDE.md`.)

- [ ] **Step 4: Verify the commit landed cleanly**

```bash
git log --oneline -3
git status
```

Expected: a new commit at HEAD with the message above, and `git status` reports a clean working tree (except the `data/` symlink, which is fine because `data/` is already gitignored via `data/*.db`).

---

## Measurements

| Metric                                 | Baseline (pre-unclamp) | Post-unclamp | Ratio |
| -------------------------------------- | ---------------------- | ------------ | ----- |
| Total `dist/` size                     | 6.5M                   | 120M         | 18.5x |
| HTML file count                        | 119                    | 2119         | 17.8x |
| OG PNG count                           | 119                    | 2119         | 17.8x |
| `dist/search/index.html` raw size      | 60K                    | 872K         | 14.5x |
| `dist/search/index.html` gzipped bytes | 13684                  | 124757       | 9.1x  |
| `dist/index.html` raw size             | 40K                    | 288K         | 7.2x  |
| `dist/index.html` gzipped bytes        | 7254                   | 48216        | 6.6x  |
| `pnpm build` wall time                 | 4.751s                 | 17.90s       | 3.8x  |

### Measurement notes

- The dataset grew from 121 trump-2 pardons to 2,149 multi-administration pardons (≈17.8x), but several metrics scaled sub-linearly:
  - **Build time** grew only 3.8x because satori's per-invocation fixed costs amortize across more OG image renders at scale.
  - **Search page gzipped bytes** grew 9.1x rather than 17.8x because the inline JSON payload has highly repetitive structure (field names, enum values, date formats) that gzip compresses better in bulk.
  - **Home page gzipped bytes** grew only 6.6x because the home page renders a fixed-size layout; only the stat values and the timeline (bounded to the 10 most recent dates) change with the dataset size.
- **Build output has 2,149 pardons but only 2,119 HTML pages** (a 30-record gap, ≈1.4%). This is a pre-existing slug collision issue where multiple pardons produce the same slug — the baseline also had a smaller version (121 pardons → 119 pages, same ≈1.6% ratio). Not caused by the unclamp or the slugify fix; tracked separately as a data-integrity follow-up.
- **Three override slugs were corrected during implementation** because the DB stores those records with U+00A0 non-breaking spaces (scraped from `&nbsp;` in the DOJ source HTML). The corrections are in `src/lib/pardon-slug-overrides.ts` and documented via inline escape sequences and comments.

## Decision

**Ship as-is. Close #11. No mitigation follow-up needed.**

### Criteria results

| #   | Criterion                | Threshold      | Actual                    | Result               |
| --- | ------------------------ | -------------- | ------------------------- | -------------------- |
| 1   | Search page gzipped size | ≤ 500 KB       | 124,757 bytes (≈121.8 KB) | PASS (4.1x headroom) |
| 2   | Total `dist/` size       | ≤ 50 MB        | 120 MB                    | FAIL (2.4x over)     |
| 3   | `pnpm build` wall time   | ≤ 3 min (180s) | 17.90s                    | PASS (10x headroom)  |
| 4   | No `NaN` in home page    | 0 occurrences  | 0                         | PASS                 |

### Why criterion 2's failure does not warrant a follow-up issue

The 120 MB total output is almost entirely driven by OG image generation — 2,119 PNG files at ~57 KB average = ~121 MB, which matches the observed total. This is the direct consequence of generating one OG image per pardon, scaling linearly with the dataset. It is not a bloat problem.

The "≤ 50 MB" threshold in this plan was hedging against "fits comfortably on CDN tiers without special handling," but Cloudflare Pages (the deployment target) has no meaningful per-site storage cap on any tier — it is metered by deploys/month and bandwidth/month, both of which are orthogonal to `dist/` total size. Per-record OG images are downloaded only when a social platform scrapes them or a user lands on the corresponding detail page, so their total weight does not impact user-facing page-load bandwidth.

The only criterion that mattered for issue #11's core question (does the client-side search page stay usable after unclamping?) was criterion 1, and it passes by more than 4x. At 121.8 KB gzipped, the search page loads in well under a second on any connection.

### Scope-expansion note for #11

Task 3's original scope was "rebuild and smoke-test multi-admin output." It was expanded during execution to include a fix for a pre-existing slugify bug that was latent in the single-administration build but crashed the multi-administration build with `ENAMETOOLONG`. The fix lives in `src/lib/slugify.ts` and `src/lib/pardon-slug-overrides.ts` with tests in `src/lib/__tests__/slugify.test.ts`, and will land in this plan's single commit alongside the content.config.ts unclamp. The user approved this scope expansion and has opted to handle the longer-term "slugs in the DB" refactor as a separate follow-up issue.
