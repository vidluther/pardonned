# 00 — Port design tokens

## Goal

Get the design system from `styles/tokens.css` into the live codebase as the single source of truth for colors, type, and layout primitives.

## Source

`styles/tokens.css` in this project. Read it end-to-end before starting; it's only ~230 lines.

## Token map

### Type
- **Serif:** DM Serif Display (display + headings only — never body)
- **Sans:** DM Sans (body, UI, data)
- Load from Google Fonts; the `@import` at the top of `tokens.css` is correct.
- Body is 15px / 1.6. Headings use `font-weight: 400` always — DM Serif Display only ships in regular.

### Color (semantic)
| Token | Hex | Use |
|---|---|---|
| `--bg-page` | `#FAFAF7` | Page background. Warm off-white. |
| `--bg-card` | `#FFFFFF` | Card / inset backgrounds when contrast against page is needed |
| `--bg-muted` | `#F6F5F0` | Subtle fills (table hover, badges) |
| `--bg-subtle` | `#F2F1EC` | Slightly stronger fill |
| `--border-default` | `#E8E6E0` | Standard 1px hairlines |
| `--border-soft` | `#D0CEC8` | Slightly heavier dividers |
| `--text-primary` | `#1A1918` | Headings, primary text |
| `--text-body` | `#4A4840` | Long-form body |
| `--text-secondary` | `#6A6860` | Supporting text |
| `--text-muted` | `#7A7870` | Metadata |
| `--text-faint` | `#9A9890` | Overlines, captions |
| `--text-ghost` | `#B0AEA8` | Disabled / placeholder |
| `--accent` | `#C23B22` | Restitution figures, active nav, accent strokes. **Used sparingly.** |

### Category colors
Used for offense category badges and per-category accents on charts. Defined in `:root`:

```
--cat-j6: #C23B22         /* January 6 */
--cat-face: #B8652A       /* FACE Act */
--cat-fraud: #8A6B1E      /* Fraud */
--cat-crypto: #2A6A7A     /* Crypto */
--cat-political: #6A4B7A  /* Political/Public corruption */
--cat-drug: #3A6A4A       /* Drug */
--cat-other: #7A7870
--cat-violent: #6A2A2A
--cat-firearms: #4A4030
--cat-immigration: #2A4A6A
```

### Layout
- Page containers: `--page-880` (920px), `--page-960` (1000px), `--page-1040` (1080px). Pick by content density.
- Border radius: `--radius-card: 8px`, `--radius-pill: 4px`.

## Scope

- **In:** Port every token in `tokens.css` into the project's CSS variable / theme system. Wire DM Sans + DM Serif Display via the project's font loader. Keep token names identical so future briefs reference them by name.
- **Also in:** port the shared component classes at the bottom of `tokens.css` — `.site-nav`, `.site-footer`, `.wordmark`, `.overline`, `.badge`, `table.data`, `.source-link`, `.money`, etc. They're used by every other page.
- **Out:** No page-level work. Just the system.

## Acceptance criteria

- Every token name in the table above is reachable as a CSS variable in the live codebase.
- DM Sans is the default body font; DM Serif Display is loaded but only applied where headings are.
- A blank page styled with `<body>`'s defaults matches the warm off-white background and dark-neutral primary text from the mockups.
- The shared `.site-nav` and `.site-footer` markup from any of the mockup HTML files renders identically when dropped into the live codebase (same wordmark, same hairlines).

## Notes

- The accent red (`#C23B22`) is intentionally restrained — it shows up only on restitution dollar figures and the active-nav underline. Resist the urge to use it on CTAs.
- DM Serif Display is heavy display-grade. It looks broken at sizes below ~22px. Keep it on h1/h2 and pull-quote-scale text only.
- `text-wrap: pretty` is set on prose blocks in some pages — port if your stack supports it.
