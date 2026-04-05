# Pardonned — Design System & Implementation Guide

> This document defines the visual language, component patterns, and implementation
> conventions for the Pardonned clemency tracker. Hand this file to your coding agent
> (Claude Code, OpenCode, etc.) alongside the codebase so it can apply styles consistently.

---

## 1. Project overview

Pardonned is a public-interest data site that tracks presidential clemency grants.
The editorial tone is investigative journalism — think ProPublica or The Marshall Project.
The design is restrained, typographically driven, and data-forward. It is **not** a
dashboard or a SaaS product; it reads like a well-designed long-form article with
interactive data exploration.

### Tech stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS — use the config below to define the palette and type scale.
  Avoid arbitrary values (`text-[#C23B22]`) when a Tailwind token exists.
- **Fonts**: Google Fonts — `DM Serif Display` (headlines) + `DM Sans` (everything else).
  Load via `next/font/google` for self-hosting and performance.
- **Database**: Supabase (PostgreSQL). Schema lives in the `pardonned` schema.
  Use the Supabase JS client for data fetching in server components.
- **Linting**: oxlint
- **Package manager**: pnpm

### Pages

| Route          | Purpose                                    |
| -------------- | ------------------------------------------ |
| `/`            | Home — hero stats, category grid, timeline |
| `/search`      | Filterable, sortable list of all grants    |
| `/pardon/[id]` | Individual grant detail with tabs          |

---

## 2. Color palette

The palette is deliberately narrow. Most of the page is neutral; color is reserved for
the red editorial accent and the offense-category system.

### Core neutrals (light theme)

| Token            | Hex       | Usage                                    |
| ---------------- | --------- | ---------------------------------------- |
| `bg-page`        | `#FAFAF7` | Page background                          |
| `bg-card`        | `#FFFFFF` | Card / panel backgrounds                 |
| `bg-muted`       | `#F6F5F0` | Input backgrounds, hover states, pills   |
| `bg-subtle`      | `#F2F1EC` | Name chips, secondary fills              |
| `border-default` | `#E8E6E0` | Card borders, dividers, input borders    |
| `border-soft`    | `#D0CEC8` | Timeline dots (inactive), button borders |
| `text-primary`   | `#1A1918` | Headlines, names, primary content        |
| `text-body`      | `#4A4840` | Body copy, descriptions                  |
| `text-secondary` | `#6A6860` | Offense text, supporting details         |
| `text-muted`     | `#7A7870` | Nav links, labels, breadcrumbs           |
| `text-faint`     | `#9A9890` | Metadata, timestamps, helper text        |
| `text-ghost`     | `#B0AEA8` | Footer text, disabled states             |

### Accent

| Token           | Hex                    | Usage                                             |
| --------------- | ---------------------- | ------------------------------------------------- |
| `accent`        | `#C23B22`              | Restitution figures, active nav underline, badges |
| `accent-bg`     | `rgba(194,59,34,0.08)` | Badge backgrounds, pill highlights                |
| `accent-border` | `rgba(194,59,34,0.12)` | Alert card borders, stat card borders             |

The red accent is the single most important design element. It appears on:

- The "e" in the Pardonn**e**d wordmark
- All restitution dollar amounts
- Pardon-type badges
- Active navigation underlines
- Grant-count badges in the timeline
- The "combined impact" callout card

**Rule: if a number represents money that victims will not recover, it is red.**

### Offense category colors

These appear only in category badges and the category grid on the home page.
They are muted and earthy — never saturated or neon.

| Category             | Hex       | Tailwind token suggestion |
| -------------------- | --------- | ------------------------- |
| January 6            | `#C23B22` | `category-j6`             |
| FACE Act             | `#B8652A` | `category-face`           |
| Financial fraud      | `#8A6B1E` | `category-fraud`          |
| Crypto & securities  | `#2A6A7A` | `category-crypto`         |
| Political corruption | `#6A4B7A` | `category-political`      |
| Drug offenses        | `#3A6A4A` | `category-drug`           |
| Other                | `#7A7870` | `category-other`          |

These map to the `offense_category` column in the `pardon` table.

---

## 3. Typography

### Font loading (Next.js)

```typescript
import { DM_Sans, DM_Serif_Display } from "next/font/google";

export const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const serif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});
```

Apply both variables to `<html>` via `className={`${sans.variable} ${serif.variable}`}`.
Set `font-sans` as the default body font in `tailwind.config.ts`.

### Type scale

| Element                   | Font     | Size | Weight | Color          | Leading |
| ------------------------- | -------- | ---- | ------ | -------------- | ------- |
| Hero headline             | DM Serif | 52px | 400    | text-primary   | 1.1     |
| Page title (h1)           | DM Serif | 36px | 400    | text-primary   | 1.2     |
| Section heading (h2)      | DM Serif | 28px | 400    | text-primary   | 1.3     |
| Stat card number          | DM Serif | 36px | 400    | varies         | 1.1     |
| Stat card number (small)  | DM Serif | 28px | 400    | varies         | 1.1     |
| Detail name (h1)          | DM Serif | 42px | 400    | text-primary   | 1.15    |
| Combined impact number    | DM Serif | 20px | 500    | varies         | 1.2     |
| Body / description        | DM Sans  | 15px | 400    | text-body      | 1.8     |
| Nav link                  | DM Sans  | 14px | 400    | text-muted     | —       |
| Card title (name)         | DM Sans  | 16px | 500    | text-primary   | —       |
| Card offense text         | DM Sans  | 13px | 400    | text-secondary | 1.5     |
| Metadata (district, date) | DM Sans  | 12px | 400    | text-faint     | —       |
| Badge / pill              | DM Sans  | 11px | 400    | varies         | —       |
| Overline label            | DM Sans  | 11px | 500    | text-faint     | —       |
| Tracking label            | DM Sans  | 12px | 400    | varies         | —       |

### Overline pattern

Used for stat card labels and section headers inside cards:

```
font-size: 11px
text-transform: uppercase
letter-spacing: 0.1em
color: text-faint (#9A9890)
margin-bottom: 6–8px
```

---

## 4. Layout & spacing

### Page widths

| Context        | Max width | Padding |
| -------------- | --------- | ------- |
| Home content   | 960px     | 40px    |
| Search content | 1040px    | 40px    |
| Detail content | 880px     | 40px    |
| Source banner  | 880px     | 32px    |

All centered with `margin: 0 auto`.

### Spacing conventions

- Section vertical padding: `60px` top and bottom
- Card internal padding: `18px 24px` (list items) or `24px 28px` (detail panels)
- Grid gap: `12px` between cards, `16px` between stat cards
- Between a heading and its subtitle: `8px`
- Between a subtitle and content: `32px`
- Timeline item spacing: `36px` margin-bottom
- Filter bar internal padding: `16px 20px`

### Border radius

- Cards and panels: `8px`
- Badges and pills: `4px`
- Category pills (rounded): `20px`
- Input fields: `6px`
- Left-bordered cards: `0 8px 8px 0` (square on left, rounded on right)

---

## 5. Component patterns

### 5.1 Wordmark

```
Pardonn<span class="text-accent">e</span>d
```

- Font: DM Serif Display, 26px in nav, 18px in footer
- The "e" is always `accent` (#C23B22)
- Footer version uses `opacity: 0.35` on the accent
- Adjacent "Clemency tracker" label: 11px, uppercase, letter-spacing 0.08em, text-faint

### 5.2 Navigation

- Horizontal flex row, `space-between`
- Links: 14px DM Sans, `text-muted`
- Active link: `text-primary` with a 1px `accent` bottom border, 2px padding-bottom
- Border-bottom on the nav container: `1px solid border-default`

### 5.3 Stat card

Used on the home hero and the detail page header.

```
background: bg-card
border: 1px solid border-default
border-radius: 8px
padding: 24px 16px (home) or 20px (detail)

  [overline label]  — 11px uppercase, text-faint
  [big number]      — DM Serif, 36px (home) or 28px (detail)
  [footnote]        — 12px, text-ghost
```

The restitution stat card uses a tinted background:

```
background: rgba(194,59,34,0.04)
border: 1px solid rgba(194,59,34,0.12)
```

Restitution numbers are always `accent` color. All other numbers are `text-primary`.

### 5.4 Category card (home page grid)

```
background: bg-card
border: 1px solid border-default
border-left: 3px solid [category-color]
border-radius: 0 6px 6px 0
padding: 16px 20px
display: flex, align-items center, gap 14px

  [count]  — DM Serif, 24px, category color, min-width 60px
  [name]   — 14px, text-body
```

### 5.5 Timeline

Vertical layout with a left-side line and dots.

```
Container: padding-left 32px, position relative
Vertical line: position absolute, left 6px, width 1px, bg border-soft (#E0DED8)
Dot (inactive): 13px circle, bg-card, border 2px solid border-soft
Dot (active/latest): 13px circle, bg accent, border 2px solid accent
```

Each entry:

```
  [date]         — 13px, text-muted, font-weight 500, min-width 110px
  [grants badge] — 11px uppercase, accent-bg background, accent text, 3px 10px padding, 4px radius
  [name chips]   — flex-wrap row of chips (see below)
  [highlight]    — 13px, text-faint, italic
```

### 5.6 Name chip

```
font-size: 13px
color: text-primary (#3A3830)
background: bg-subtle (#F2F1EC)
border: 1px solid border-default
padding: 4px 10px
border-radius: 4px
cursor: pointer
```

### 5.7 Badge / pill

Two variants:

**Type badge** (Pardon / Commutation):

```
Pardon:      bg rgba(194,59,34,0.08), color #C23B22
Commutation: bg rgba(42,106,122,0.08), color #2A6A7A
```

**Category badge**:

```
background: bg-muted (#F6F5F0)
border: 1px solid border-default
color: [category-color]
```

Both: `font-size 11px, padding 2px 8px, border-radius 4px`

### 5.8 Search result card

```
background: bg-card (hover: bg-muted)
border: 1px solid border-default
border-radius: 8px
padding: 18px 24px
display: grid, grid-template-columns: 1fr auto
transition: background 0.15s
cursor: pointer

Left column:
  Row 1: [name 16px/500] [type badge] [category badge]
  Row 2: [offense 13px text-secondary]
  Row 3: [district] [sentence] — 12px text-faint

Right column (right-aligned):
  [date] — 12px text-faint
  [restitution] — 15px/500 accent (if present)
  "restitution" label — 11px text-faint
```

### 5.9 Filter bar

```
background: bg-card
border: 1px solid border-default
border-radius: 8px
padding: 16px 20px
display: flex, flex-wrap, gap 12px

Search input:
  background: bg-muted
  border: 1px solid border-default
  border-radius: 6px
  padding: 10px 12px 10px 32px (left icon space)
  font-size: 14px

Category pills:
  Active:   bg accent-bg, color accent, border accent-border
  Inactive: bg bg-muted, color text-muted, border border-default
  border-radius: 20px, padding 6px 14px, font-size 12px

Select dropdowns:
  background: bg-muted
  border: 1px solid border-default
  border-radius: 6px
  padding: 8px 12px
  font-size: 13px
  color: text-body
```

### 5.10 Tab navigation

```
display: flex
border-bottom: 1px solid border-default
margin-bottom: 32px

Each tab:
  padding: 12px 24px
  font-size: 14px
  background: transparent
  border: none
  margin-bottom: -1px (overlap border)

  Active:   color text-primary, font-weight 500, border-bottom 2px solid accent
  Inactive: color text-faint, font-weight 400, border-bottom 2px solid transparent
```

### 5.11 Source document link

```
display: flex, align-items center, gap 12px
background: bg-muted
border: 1px solid border-default
border-radius: 6px
padding: 14px 18px

  [icon]  — 20px, opacity 0.5
  [title] — 14px, text-primary
  [subtitle] — 12px, text-faint
  [arrow ↗] — 13px, text-faint, margin-left auto
```

### 5.12 Combined impact callout

Used on the detail page's "related" tab.

```
background: rgba(194,59,34,0.03)
border: 1px solid rgba(194,59,34,0.1)
border-radius: 8px
padding: 24px 28px

Heading: 13px, font-weight 500, accent color, uppercase, letter-spacing 0.06em
Grid: 3 columns, gap 16px
  Each cell:
    [label] — 11px uppercase, text-faint (or #A07060 for restitution)
    [value] — DM Serif 20px/500, accent for money, text-primary for others
```

### 5.13 Offense list item (detail page)

```
display: flex, gap 16px
background: bg-card
border: 1px solid border-default
border-left: 3px solid rgba(194,59,34,0.35)
border-radius: 0 8px 8px 0
padding: 18px 24px

  [number] — 12px/500, text-faint, bg-muted background, 4px radius, 2px 8px pad
  [offense name] — 15px, text-primary
  [offense note] — 12px, text-faint
```

### 5.14 Breadcrumb

```
font-size: 13px
display: flex, gap 8px, align-items center

  [parent link]  — text-muted, no underline
  [separator /]  — border-soft color
  [current page] — text-body
```

---

## 6. Dividers

Two patterns:

**Gradient divider** (between hero and categories):

```
height: 1px
background: linear-gradient(90deg, transparent, rgba(194,59,34,0.2), transparent)
```

**Flat divider** (between other sections):

```
height: 1px
background: border-default (#E8E6E0)
```

Both are wrapped in a container matching the section `max-width` with `40px` horizontal padding.

---

## 7. Tailwind config sketch

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        page: "#FAFAF7",
        card: "#FFFFFF",
        muted: "#F6F5F0",
        subtle: "#F2F1EC",
        accent: {
          DEFAULT: "#C23B22",
          bg: "rgba(194,59,34,0.08)",
          border: "rgba(194,59,34,0.12)",
        },
        border: {
          DEFAULT: "#E8E6E0",
          soft: "#D0CEC8",
        },
        text: {
          primary: "#1A1918",
          body: "#4A4840",
          secondary: "#6A6860",
          muted: "#7A7870",
          faint: "#9A9890",
          ghost: "#B0AEA8",
        },
        category: {
          j6: "#C23B22",
          face: "#B8652A",
          fraud: "#8A6B1E",
          crypto: "#2A6A7A",
          political: "#6A4B7A",
          drug: "#3A6A4A",
          other: "#7A7870",
        },
      },
    },
  },
} satisfies Config;
```

---

## 8. Data display rules

These rules govern how data from the `pardonned` schema renders in the UI.

1. **Restitution is always red.** Any dollar amount from `sentence.restitution`
   renders in `accent` color with `font-weight: 500`. No exceptions.

2. **Fines are not highlighted.** Values from `sentence.fine` render in `text-primary`
   at normal weight. Fines are penalties to the defendant; restitution is money owed
   to victims. The editorial distinction matters.

3. **Offense text splitting.** The `pardon.offense` column contains semicolon-delimited
   charges from the DOJ source. On the detail offenses tab, split on `;` and trim
   whitespace to render each charge as a separate list item.

4. **Sentence display.** Show `sentence.original_sentence` (the raw DOJ text) in
   context panels. For stat cards, compute a human-friendly version from
   `sentence.sentence_in_months` (e.g., "12 years" for 144 months).

5. **Clemency type.** The `pardon.clemency_type` column is either `pardon` or
   `commutation`. Display with the appropriate badge color (red for pardon,
   teal for commutation).

6. **Offense category.** The `pardon.offense_category` column maps to the category
   color system defined above. Use it for badge colors and the home page grid.

7. **Grant date grouping.** The home page timeline groups grants by `grant_date`.
   The count label (e.g., "16 Pardons, 6 Commutations") is computed from the
   group, splitting by `clemency_type`.

8. **Warrant links.** Every grant links to its DOJ warrant PDF via `pardon.warrant_url`.
   Display as a source document link on the detail page. Open in a new tab.

9. **Empty states.** When filters return no results, show centered text at `text-faint`
   with a brief message and suggestion to adjust filters. No illustrations or icons.

10. **Number formatting.** Restitution values ≥ $1M display as `$XX.XM`. Values ≥ $1K
display as `$XXXK`. Below that, use `toLocaleString()`. Sentence months convert
    to years only when ≥ 12 (show "X years"); below 12, show "X months".

---

## 9. Animation

Keep animation minimal and purposeful. This is a journalism site, not a product demo.

- **Stat cards on load**: stagger fade-in with `translateY(12px)` → `translateY(0)`,
  `opacity 0 → 1`, 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94), 150ms stagger between cards.
- **Search result hover**: `background` transition, 150ms.
- **Tab switching**: no animation — instant swap.
- **Timeline**: no scroll-triggered animation. Content is static.
- **Page transitions**: none. Use Next.js default behavior.

---

## 10. Responsive behavior

The mockups are desktop-first at ~960px–1040px content width. For production:

- **≥ 1080px**: full layout as designed
- **768–1079px**: stat cards go 2×2 grid, category cards go 2-column,
  search results keep single-column but tighten padding
- **< 768px**: single-column everything, nav collapses to hamburger,
  stat cards stack vertically, filter pills scroll horizontally,
  detail page tabs become horizontally scrollable

Mobile breakpoints are secondary priority. Get desktop right first.

---

## 11. Source attribution

Every page must include:

1. A footer line: "Data source: DOJ Office of the Pardon Attorney · Not affiliated with the U.S. government"
2. The source banner (home page) or source document links (detail page) pointing to
   original DOJ URLs stored in `pardon.warrant_url` and `pardon.source_url`.
3. The site must never present itself as an official government resource.
