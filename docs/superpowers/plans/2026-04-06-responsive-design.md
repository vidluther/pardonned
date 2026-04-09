# Responsive Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the entire Pardonned site fully responsive so it looks great on mobile, tablet, and desktop.

**Architecture:** The site already uses Tailwind CSS 3.4. We'll use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) to make grids, padding, and typography adapt to screen size. Font sizes defined in `global.css` will get `@media` queries. The header will get a mobile hamburger menu with a simple inline `<script>` (matching the existing pattern used on the search page).

**Tech Stack:** Astro 6, Tailwind CSS 3.4, vanilla JS (inline scripts for mobile nav toggle)

**Breakpoint strategy (Tailwind defaults):**
- Base (0-639px): Mobile phones
- `sm:` (640px+): Large phones / small tablets
- `md:` (768px+): Tablets
- `lg:` (1024px+): Desktops

---

### Task 1: Fix Viewport Meta Tag

**Files:**
- Modify: `src/layouts/Layout.astro:45`

- [ ] **Step 1: Update viewport meta tag**

Change line 45 in `src/layouts/Layout.astro` from:

```html
<meta name="viewport" content="width=device-width" />
```

to:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

- [ ] **Step 2: Verify in browser**

Run: `pnpm dev`
Open the site on a mobile device or Chrome DevTools mobile emulation. Confirm the page no longer zooms out to fit the desktop layout — it should render at device width. Content will still overflow at this point (that's expected — we fix it in subsequent tasks).

- [ ] **Step 3: Commit**

```bash
but commit -m "fix: add initial-scale=1 to viewport meta tag"
```

---

### Task 2: Responsive Typography in Global CSS

**Files:**
- Modify: `src/styles/global.css:29-37` (base h1/h2 sizes)
- Modify: `src/styles/global.css:74-96` (stat-number sizes)
- Modify: `src/styles/global.css:325-331` (hero-headline)
- Modify: `src/styles/global.css:333-337` (hero-subtitle)
- Modify: `src/styles/global.css:307-315` (source-banner padding)

- [ ] **Step 1: Add responsive base heading sizes**

In `src/styles/global.css`, replace the `h1` and `h2` rules inside `@layer base` (lines 29-37):

```css
  h1 {
    font-size: 24px;
    line-height: 1.2;
  }

  h2 {
    font-size: 22px;
    line-height: 1.3;
  }

  @media (min-width: 768px) {
    h1 {
      font-size: 36px;
    }
    h2 {
      font-size: 28px;
    }
  }
```

- [ ] **Step 2: Add responsive hero-headline**

In `src/styles/global.css`, replace the `.hero-headline` rule (lines 325-331):

```css
  .hero-headline {
    font-family: "DM Serif Display", Georgia, serif;
    font-size: 32px;
    line-height: 1.15;
    color: #1a1918;
    letter-spacing: -0.02em;
  }

  @media (min-width: 768px) {
    .hero-headline {
      font-size: 52px;
      line-height: 1.1;
    }
  }
```

- [ ] **Step 3: Add responsive hero-subtitle**

Replace `.hero-subtitle` (lines 333-337):

```css
  .hero-subtitle {
    font-size: 16px;
    line-height: 1.6;
    color: #6a6860;
  }

  @media (min-width: 768px) {
    .hero-subtitle {
      font-size: 18px;
    }
  }
```

- [ ] **Step 4: Add responsive stat-number**

Replace `.stat-number` (lines 86-90):

```css
  .stat-number {
    font-family: "DM Serif Display", Georgia, serif;
    font-size: 24px;
    line-height: 1.1;
  }

  @media (min-width: 768px) {
    .stat-number {
      font-size: 36px;
    }
  }
```

- [ ] **Step 5: Add responsive stat-card padding**

Replace `.stat-card` (lines 74-79):

```css
  .stat-card {
    background: #ffffff;
    border: 1px solid #e8e6e0;
    border-radius: 8px;
    padding: 16px 12px;
  }

  @media (min-width: 768px) {
    .stat-card {
      padding: 24px 16px;
    }
  }
```

- [ ] **Step 6: Add responsive source-banner padding**

Replace `.source-banner` (lines 307-315):

```css
  .source-banner {
    background: rgba(194, 59, 34, 0.04);
    border: 1px solid rgba(194, 59, 34, 0.12);
    border-radius: 8px;
    padding: 16px 20px;
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  @media (min-width: 768px) {
    .source-banner {
      padding: 24px 32px;
      gap: 16px;
    }
  }
```

- [ ] **Step 7: Verify typography in browser**

Run: `pnpm dev`
Check at mobile (375px) and desktop (1280px) widths. Confirm:
- Hero headline is ~32px on mobile, 52px on desktop
- h1/h2 scale appropriately
- Stat numbers don't overflow their cards on mobile

- [ ] **Step 8: Commit**

```bash
but commit -m "feat: add responsive typography and component sizing"
```

---

### Task 3: Responsive Header with Mobile Navigation

**Files:**
- Modify: `src/components/Header.astro` (entire file)
- Modify: `src/styles/global.css` (add mobile nav styles at end of components layer)

- [ ] **Step 1: Add mobile nav styles to global.css**

Add the following at the end of the `@layer components` block (before the closing `}` on line 377):

```css
  .mobile-nav-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: transparent;
    border: none;
    cursor: pointer;
    color: #4a4840;
  }

  .mobile-nav {
    display: none;
    border-bottom: 1px solid #e8e6e0;
    padding: 0 20px 16px;
  }

  .mobile-nav.is-open {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  @media (min-width: 768px) {
    .mobile-nav-toggle {
      display: none;
    }
    .mobile-nav {
      display: none !important;
    }
  }
```

- [ ] **Step 2: Update Header.astro with hamburger menu**

Replace the entire content of `src/components/Header.astro` with:

```astro
---
import { siteConfig } from '../config/site';
import { mainNavigation, isActiveNavItem } from '../config/navigation';

interface Props {
  currentPath?: string;
}

const { currentPath = "/" } = Astro.props;
---

<header class="border-b border-border-DEFAULT">
  <div class="max-w-home mx-auto px-5 md:px-10 py-4 flex justify-between items-center">
    <!-- Logo / Wordmark -->
    <a href="/" class="flex items-baseline gap-3 no-underline hover:opacity-80 transition-opacity">
      <span class="wordmark">
        Pardonn<span class="wordmark-accent">e</span>d
      </span>
      <span class="tracker-label hidden sm:inline">{siteConfig.tagline}</span>
    </a>

    <!-- Desktop Navigation -->
    <nav class="hidden md:flex gap-8">
      {mainNavigation.map((item) => {
        const isActive = isActiveNavItem(item.href, currentPath);
        return (
          <a
            href={item.href}
            class:list={[
              "text-nav transition-colors pb-0.5",
              isActive
                ? "text-text-primary font-medium border-b border-accent"
                : "text-text-muted hover:text-text-primary"
            ]}
          >
            {item.label}
          </a>
        );
      })}
    </nav>

    <!-- Mobile Hamburger Button -->
    <button
      class="mobile-nav-toggle md:hidden"
      aria-label="Toggle navigation"
      aria-expanded="false"
      id="mobile-nav-toggle"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  </div>

  <!-- Mobile Navigation Drawer -->
  <nav class="mobile-nav md:hidden" id="mobile-nav">
    {mainNavigation.map((item) => {
      const isActive = isActiveNavItem(item.href, currentPath);
      return (
        <a
          href={item.href}
          class:list={[
            "text-nav transition-colors py-2",
            isActive
              ? "text-text-primary font-medium"
              : "text-text-muted hover:text-text-primary"
          ]}
        >
          {item.label}
        </a>
      );
    })}
  </nav>
</header>

<script is:inline>
  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('mobile-nav-toggle');
    const nav = document.getElementById('mobile-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  });
</script>
```

- [ ] **Step 3: Verify mobile header**

Run: `pnpm dev`
At mobile width (<768px):
- Hamburger icon is visible, desktop nav links are hidden
- Tapping hamburger opens the mobile nav drawer with links
- Tagline is hidden on very small screens (<640px)
At desktop width (>=768px):
- Desktop nav links visible, hamburger hidden

- [ ] **Step 4: Commit**

```bash
but commit -m "feat: add responsive header with mobile hamburger nav"
```

---

### Task 4: Responsive StatGrid

**Files:**
- Modify: `src/components/StatGrid.astro:39`

- [ ] **Step 1: Make stat grid responsive**

In `src/components/StatGrid.astro`, change line 39 from:

```html
<div class="grid grid-cols-4 gap-stat-grid">
```

to:

```html
<div class="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-stat-grid">
```

- [ ] **Step 2: Verify stat grid**

Run: `pnpm dev`
At mobile: 2x2 grid of stat cards. At desktop: 4-column row.

- [ ] **Step 3: Commit**

```bash
but commit -m "feat: make stat grid 2-col on mobile, 4-col on desktop"
```

---

### Task 5: Responsive CategoryGrid

**Files:**
- Modify: `src/components/CategoryGrid.astro:21-24`

- [ ] **Step 1: Make category grid responsive**

In `src/components/CategoryGrid.astro`, replace lines 21-24:

```astro
const gridClasses = columns === 2 ? 'grid-cols-2' : 'grid-cols-3';
---

<div class:list={['grid gap-grid', gridClasses]}>
```

with:

```astro
const gridClasses = columns === 2
  ? 'grid-cols-1 sm:grid-cols-2'
  : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3';
---

<div class:list={['grid gap-3 sm:gap-grid', gridClasses]}>
```

- [ ] **Step 2: Verify category grid**

Run: `pnpm dev`
At mobile: single column stack. At sm (640px+): 2 columns. At md (768px+): 3 columns (if `columns=3`).

- [ ] **Step 3: Commit**

```bash
but commit -m "feat: make category grid responsive across breakpoints"
```

---

### Task 6: Responsive Home Page Layout

**Files:**
- Modify: `src/pages/index.astro:98-148`

- [ ] **Step 1: Update home page padding and spacing**

In `src/pages/index.astro`, make the following replacements:

**Line 98** — Hero section:
```html
<section class="py-20 px-10 max-w-home mx-auto text-center">
```
becomes:
```html
<section class="py-10 md:py-20 px-5 md:px-10 max-w-home mx-auto text-center">
```

**Line 108** — Gradient divider wrapper:
```html
<div class="max-w-home mx-auto px-10">
```
becomes:
```html
<div class="max-w-home mx-auto px-5 md:px-10">
```

**Line 113** — Categories section:
```html
<section class="py-section px-10 max-w-home mx-auto">
```
becomes:
```html
<section class="py-10 md:py-section px-5 md:px-10 max-w-home mx-auto">
```

**Line 125** — Flat divider wrapper:
```html
<div class="max-w-home mx-auto px-10">
```
becomes:
```html
<div class="max-w-home mx-auto px-5 md:px-10">
```

**Line 130** — Timeline section:
```html
<section class="py-section px-10 max-w-home mx-auto">
```
becomes:
```html
<section class="py-10 md:py-section px-5 md:px-10 max-w-home mx-auto">
```

**Line 145** — Source banner section:
```html
<section class="max-w-source mx-auto px-8 mb-10">
```
becomes:
```html
<section class="max-w-source mx-auto px-5 md:px-8 mb-10">
```

- [ ] **Step 2: Verify home page on mobile**

Run: `pnpm dev`
At 375px width: comfortable padding (20px sides), no horizontal overflow.
At desktop: original 40px padding preserved.

- [ ] **Step 3: Commit**

```bash
but commit -m "feat: responsive padding and spacing on home page"
```

---

### Task 7: Responsive Search Page Layout

**Files:**
- Modify: `src/pages/search.astro:73-117`

- [ ] **Step 1: Update search page container padding**

In `src/pages/search.astro`, change line 73:

```html
<div class="max-w-search mx-auto px-10 py-section">
```

to:

```html
<div class="max-w-search mx-auto px-5 md:px-10 py-10 md:py-section">
```

- [ ] **Step 2: Make search filter input full-width on mobile**

In `src/pages/search.astro`, change line 81:

```html
<div class="flex flex-wrap gap-3 items-center">
```

to:

```html
<div class="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
```

And change line 87 — the search input:

```html
class="filter-input flex-1 min-w-[200px]"
```

to:

```html
class="filter-input flex-1 w-full sm:w-auto sm:min-w-[200px]"
```

- [ ] **Step 3: Adjust search card layout for mobile**

In the client-side `renderResults` function (around line 174), the search card already uses `flex justify-between items-start`. On mobile, the right-aligned date/restitution gets squished. Update the card template inside the `renderResults` function.

Replace the card template (lines 172-189) in the `<script is:inline>` block:

```javascript
          return `
            <a href="/pardon/details/${grant.slug}" class="search-card block no-underline mb-3">
              <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <span class="text-card-title font-medium text-text-primary truncate">${grant.name}</span>
                    <span class="badge ${typeBadgeClass}">${typeLabel}</span>
                    <span class="badge badge-category" style="color: ${catColor}">${catLabel}</span>
                  </div>
                  <p class="text-card-offense text-text-secondary mb-2 line-clamp-2">${grant.offense}</p>
                  ${metaHtml}
                </div>
                <div class="flex sm:flex-col sm:text-right gap-3 sm:gap-0 sm:ml-4 flex-shrink-0 items-center sm:items-end">
                  <div class="text-meta text-text-faint sm:mb-1">${grant.date}</div>
                  ${restitutionHtml}
                </div>
              </div>
            </a>
          `;
```

- [ ] **Step 4: Verify search page on mobile**

Run: `pnpm dev`, navigate to `/search`
At 375px: search input is full-width, filter pills wrap, search cards stack vertically, date and restitution appear inline below the card content.
At desktop: original side-by-side layout.

- [ ] **Step 5: Commit**

```bash
but commit -m "feat: responsive search page layout and cards"
```

---

### Task 8: Responsive Detail Page Layout

**Files:**
- Modify: `src/pages/pardon/details/[slug].astro:175-316`

- [ ] **Step 1: Update detail page container padding**

In `src/pages/pardon/details/[slug].astro`, change line 175:

```html
<div class="max-w-detail mx-auto px-10 py-10">
```

to:

```html
<div class="max-w-detail mx-auto px-5 md:px-10 py-6 md:py-10">
```

- [ ] **Step 2: Add responsive detail-name font size**

In `src/styles/global.css`, the `text-detail-name` size is set in `tailwind.config.ts` at 42px. We cannot use responsive prefixes on custom font sizes easily, so we'll use a class override. In `src/pages/pardon/details/[slug].astro`, change line 193-196:

```html
            <h1
                class="font-serif text-text-primary text-detail-name m-0 mb-3"
                style="letter-spacing: -0.02em;"
            >
```

to:

```html
            <h1
                class="font-serif text-text-primary m-0 mb-3 text-[28px] md:text-detail-name"
                style="letter-spacing: -0.02em;"
            >
```

- [ ] **Step 3: Make metadata grid responsive**

Change line 260:

```html
<div class="grid grid-cols-2 gap-x-10 gap-y-5 mb-12">
```

to:

```html
<div class="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 mb-12">
```

- [ ] **Step 4: Reduce breadcrumb top margin on mobile**

Change line 177:

```html
<div class="breadcrumb mb-10">
```

to:

```html
<div class="breadcrumb mb-6 md:mb-10">
```

- [ ] **Step 5: Reduce section margins on mobile**

Change the hero stat wrapper (line 208):

```html
<div class="mb-10">
```

to:

```html
<div class="mb-6 md:mb-10">
```

Change the offenses wrapper (line 220):

```html
<div class="mb-10">
```

to:

```html
<div class="mb-6 md:mb-10">
```

Change the original sentence wrapper (line 247):

```html
<div class="mb-12">
```

to:

```html
<div class="mb-8 md:mb-12">
```

- [ ] **Step 6: Verify detail page on mobile**

Run: `pnpm dev`, navigate to any pardon detail page
At 375px: name is legible (~28px), metadata stacks single-column, spacing is tighter.
At desktop: original layout preserved.

- [ ] **Step 7: Commit**

```bash
but commit -m "feat: responsive detail page layout and typography"
```

---

### Task 9: Responsive Footer

**Files:**
- Modify: `src/components/Footer.astro:13`

- [ ] **Step 1: Update footer padding**

In `src/components/Footer.astro`, change line 13:

```html
<div class="max-w-home mx-auto px-10 py-8">
```

to:

```html
<div class="max-w-home mx-auto px-5 md:px-10 py-8">
```

- [ ] **Step 2: Verify footer on mobile**

Run: `pnpm dev`
At 375px: footer text has comfortable 20px padding.

- [ ] **Step 3: Commit**

```bash
but commit -m "feat: responsive footer padding"
```

---

### Task 10: Responsive Timeline

**Files:**
- Modify: `src/styles/global.css` (timeline-container, timeline-date)
- Modify: `src/components/Timeline.astro:32`

- [ ] **Step 1: Make timeline date and badge stack on mobile**

In `src/components/Timeline.astro`, change line 32:

```html
<div class="flex items-baseline gap-4 mb-1.5">
```

to:

```html
<div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 mb-1.5">
```

- [ ] **Step 2: Reduce timeline left padding on mobile**

In `src/styles/global.css`, replace `.timeline-container` (lines 280-283):

```css
  .timeline-container {
    padding-left: 24px;
    position: relative;
  }

  @media (min-width: 768px) {
    .timeline-container {
      padding-left: 32px;
    }
  }
```

- [ ] **Step 3: Adjust timeline-dot position for reduced padding**

In `src/components/Timeline.astro`, change line 27:

```html
'timeline-dot absolute -left-8 top-1.5',
```

to:

```html
'timeline-dot absolute -left-6 sm:-left-8 top-1.5',
```

- [ ] **Step 4: Reduce timeline-date min-width on mobile**

In `src/styles/global.css`, replace `.timeline-date` (lines 339-344):

```css
  .timeline-date {
    font-size: 13px;
    color: #7a7870;
    font-weight: 500;
    min-width: 0;
  }

  @media (min-width: 640px) {
    .timeline-date {
      min-width: 110px;
    }
  }
```

- [ ] **Step 5: Verify timeline on mobile**

Run: `pnpm dev`
At 375px: timeline entries stack date above badge, dots align with reduced padding.
At desktop: original horizontal layout.

- [ ] **Step 6: Commit**

```bash
but commit -m "feat: responsive timeline layout"
```

---

### Task 11: Final Visual QA Pass

**Files:** None — this is verification only.

- [ ] **Step 1: Test all pages at mobile (375px)**

Open Chrome DevTools, set to iPhone SE (375px). Navigate through:
1. Home page — hero, stats, categories, timeline, source banner
2. Search page — filters, results
3. Detail page — breadcrumb, name, stats, offenses, metadata, sources

Confirm no horizontal overflow on any page.

- [ ] **Step 2: Test at tablet (768px)**

Set to iPad Mini (768px). All grids should show intermediate column counts.

- [ ] **Step 3: Test at desktop (1280px)**

Confirm nothing regressed from the original desktop layout.

- [ ] **Step 4: Final commit if any touch-ups needed**

```bash
but commit -m "fix: responsive design touch-ups from QA pass"
```
