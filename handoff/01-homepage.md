# 01 — Homepage

## Goal

Replace the live homepage with the redesigned structure. The current homepage lacks comparison context and a clear data hierarchy; the redesign adds an administration comparison strip, a restitution leaderboard, and a category breakdown — all driven by typography, no chart library required.

## Mockups to mirror

Pick **one**:
- **`home-safe.html`** — bordered modules, stays close to the live site's current rhythm. Lower risk.
- **`home-bold.html`** — editorial-driven masthead, hairline-bordered section headers (title left, deck right), restitution leaderboard with display-scale dollar figures.

If undecided: ship safe, A/B against the bold version later.

## Scope

### In
- Hero block: site purpose in one sentence, headline totals (total grants, total restitution forgiven, total fines forgiven, last-updated date).
- **By-administration comparison strip:** ranked table of presidents by `total_grants`, with a horizontal proportional bar (no chart lib — just a `<div>` with `width: %`). Each row links to the per-president page (`/president/[id]`). The right edge of each row shows `total_restitution_forgiven` in accent red.
- **Restitution leaderboard:** top 5–10 grants by `restitution_forgiven`. Display-scale dollar figure on the left, recipient + offense summary, link to detail.
- **Category breakdown:** list of offense categories sorted by count desc, each with a percentage bar.
- **Recent grants ticker** (bold variant only): last 5 grants with date + recipient + president.

### Out
- Charts. The brief from the user was explicit: minimal data viz, typography and tables only.
- Iconography. The mockups use none; don't add any.
- Search input on the homepage. Search lives on `/search` only.

## Acceptance criteria

- Homepage renders all four (or five, on bold) modules in the order above.
- Every row in the administration strip is a link to `/president/[id]`.
- Every row in the leaderboard is a link to the detail page.
- Restitution figures use `--accent` and tabular-nums.
- Page uses the `--page-1040` container width.
- Section headers use the masthead pattern (border-top, title left, deck right) on the bold variant; bordered modules on the safe variant.
- All numbers are formatted with thousands separators and rounded to the nearest million for restitution/fines (e.g. `$92.4M`).

## Notes

- The bar widths in the comparison strip are calculated as `(this.total_grants / max.total_grants) * 100%`. Use the max in the visible set, not all-time.
- "Last updated" date is the max `date_granted` across all pardons in the dataset, not the deploy date.
- The bold variant's section masthead pattern is reused on every other bold page — extract it into a shared component (`<SectionHeader title="…" deck="…" />`) the first time you build it.
- See `home-bold.html` lines around `.section-header` for the exact CSS — it's a 1.2fr / 1fr grid with a 2px top border.
