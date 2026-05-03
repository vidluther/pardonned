# 04 — Pardon detail page

## Goal

Improve the single-pardon detail page to handle sparse data gracefully and surface the source warrant prominently.

## Mockups to mirror

Pick **one**:
- **`detail-safe.html`** — left rail metadata, right column for warrant text and notes. The default; handles sparse data well.
- **`detail-bold.html`** — full-width recipient name in display serif, money-strip near the top, warrant text as a pull-quote.

## Scope

### In
- Header: recipient name (display serif), grant type badge (pardon / commutation / remission), date granted, president (linked).
- Money strip: restitution forgiven, fines forgiven, sentence remaining (for commutations). Each is its own typographic block; if a value is null, hide the block — don't render `$0` or `—`.
- Offense block: category badge + offense summary.
- Warrant text: rendered as a pull-quote (bold) or in a bordered block (safe). Always show the link to the original DOJ warrant via `.source-link`.
- Editorial notes (if any), in a clearly de-emphasized block beneath the warrant.
- Co-defendants block (if any): list of names linking to their detail pages. Hide if the array is empty.
- Footer cross-links: prev/next grant within this president; link to the president's page.

### Out
- Comments. Reactions. Share buttons.
- AI-generated summaries. Voice is neutral — only present what's in the warrant.

## Acceptance criteria

- A grant with only `recipient_name`, `president`, `date_granted`, `type`, `offense_category`, `offense_summary` (i.e. no money, no warrant text, no notes) still renders a complete, dignified page. Test with a sparse fixture.
- Money strip shows 1, 2, or 3 figures depending on what's present — never empty placeholders.
- The DOJ warrant link is always reachable above the fold on desktop.
- `<title>` tag is `"<recipient_name> — Pardonned"`.
- Open Graph image is the recipient's name on a card with the president's name underneath. (Optional for v1; flag for design follow-up.)

## Notes

- The pull-quote treatment in the bold variant uses `font-family: var(--serif); font-size: 28px; line-height: 1.35;` and a 2px left border in `--accent`. Don't over-style it.
- Editorial notes should be visually subordinate. The mockup uses `--text-muted` and a smaller font size to make this obvious.
- If the warrant text is >800 words, truncate to the first paragraph and link "Read full warrant" out to DOJ. Don't show the whole thing.
