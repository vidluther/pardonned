# Performance, Accessibility & SEO Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix critical accessibility violations (WCAG 2.1 AA), eliminate performance bottlenecks, and close SEO gaps so the site is production-ready.

**Architecture:** All changes are additive — no structural rewrites. Accessibility fixes target the Layout, Header, and search page. Performance gains come from font subsetting and extracting duplicated inline scripts. SEO fixes add missing meta tags, robots.txt, and structured data.

**Tech Stack:** Astro 6.1, Tailwind CSS 3.4, TypeScript, oxlint/oxfmt

---

## Task 1: Add focus styles and skip-to-content link

**Files:**

- Modify: `src/styles/global.css`
- Modify: `src/layouts/Layout.astro`

**Why:** No `:focus-visible` styles exist anywhere in the CSS. Keyboard users cannot see which element has focus. This violates WCAG 2.1 Level AA (2.4.7). The site also lacks a skip-to-content link (2.4.1).

- [ ] **Step 1: Add focus-visible styles to global.css**

Add to the `@layer base` section after the heading styles (after line 46):

```css
*:focus-visible {
  outline: 2px solid #c23b22;
  outline-offset: 2px;
  border-radius: 2px;
}
```

- [ ] **Step 2: Add skip-to-content link in Layout.astro**

Add immediately after the opening `<body>` tag (line 79):

```astro
<a href="#main-content" class="skip-link">Skip to content</a>
```

Add `id="main-content"` to the `<main>` element on line 82:

```astro
<main id="main-content" class="flex-1">
```

- [ ] **Step 3: Add skip-link styles to global.css**

Add to `@layer components`:

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 16px;
  z-index: 100;
  padding: 8px 16px;
  background: #1a1918;
  color: #ffffff;
  font-size: 14px;
  border-radius: 0 0 6px 6px;
  text-decoration: none;
  transition: top 0.15s;
}

.skip-link:focus {
  top: 0;
}
```

- [ ] **Step 4: Verify**

Run: `pnpm build`
Expected: Build succeeds. Tab through pages in browser — red outline visible on all interactive elements. Skip link appears on Tab press from top of page.

- [ ] **Step 5: Commit**

```bash
git add src/styles/global.css src/layouts/Layout.astro
git commit -m "a11y: add focus-visible styles and skip-to-content link"
```

---

## Task 2: Fix mobile navigation accessibility

**Files:**

- Modify: `src/components/Header.astro`

**Why:** The mobile hamburger menu has no Escape key handler and no focus trap. Users who open the nav via keyboard cannot close it with Escape, and can tab into background content behind the overlay.

- [ ] **Step 1: Add aria-hidden to hamburger SVG**

In `src/components/Header.astro` line 49, add `aria-hidden="true"` to the SVG:

```astro
<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
```

- [ ] **Step 2: Replace the inline script with enhanced version**

Replace the existing script (lines 78-89) with:

```astro
<script is:inline>
  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('mobile-nav-toggle');
    const nav = document.getElementById('mobile-nav');
    if (!toggle || !nav) return;

    function closeNav() {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }

    function openNav() {
      nav.classList.add('is-open');
      toggle.setAttribute('aria-expanded', 'true');
      const firstLink = nav.querySelector('a');
      if (firstLink) firstLink.focus();
    }

    toggle.addEventListener('click', () => {
      const isOpen = nav.classList.contains('is-open');
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        closeNav();
      }
    });
  });
</script>
```

- [ ] **Step 3: Verify**

Open site on mobile viewport. Open hamburger menu. Press Escape — menu should close and focus should return to the hamburger button.

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.astro
git commit -m "a11y: add escape key handler and focus management to mobile nav"
```

---

## Task 3: Add form labels and aria-live to search page

**Files:**

- Modify: `src/pages/search.astro`

**Why:** Search input and type select have no `<label>` elements (placeholder is not a substitute). When results update dynamically, screen readers are not notified (missing `aria-live`). Violates WCAG 2.1 (1.3.1, 4.1.3). The search icon SVG also needs `aria-hidden`.

- [ ] **Step 1: Add aria-hidden to search icon SVG**

On the SVG element at line 84, add `aria-hidden="true"`:

```astro
<svg aria-hidden="true" class="search-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
```

- [ ] **Step 2: Add visually-hidden labels for form inputs**

Wrap the search input with a label. Before the `<div class="search-input-wrapper">` element, the filter bar section should become:

```astro
<div class="filter-bar mb-4">
  <div class="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
    <div class="search-input-wrapper">
      <label for="search-input" class="sr-only">Search grants by name or offense</label>
      <svg aria-hidden="true" class="search-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        id="search-input"
        type="text"
        placeholder="Search by name or offense..."
        class="filter-input w-full"
      />
    </div>
    <label for="type-select" class="sr-only">Filter by clemency type</label>
    <select id="type-select" class="filter-input !py-2 !px-3 !w-auto">
      <option value="">All Types</option>
      <option value="pardon">Pardon</option>
      <option value="commutation">Commutation</option>
    </select>
  </div>
</div>
```

- [ ] **Step 3: Add sr-only utility to global.css**

Add to `@layer utilities`:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

- [ ] **Step 4: Add aria-live to results count**

Change the results count element (line 114) to include `aria-live="polite"` and `role="status"`:

```astro
<p id="results-count" class="text-meta text-text-faint mb-4" aria-live="polite" role="status">Showing {searchResults.length.toLocaleString()} results</p>
```

- [ ] **Step 5: Verify**

Run: `pnpm build`
Expected: Build succeeds. Use a screen reader (VoiceOver: Cmd+F5 on Mac) — labels should be announced for search input and select. Filtering results should announce the updated count.

- [ ] **Step 6: Commit**

```bash
git add src/pages/search.astro src/styles/global.css
git commit -m "a11y: add form labels, aria-live results, and sr-only utility"
```

---

## Task 4: Improve color contrast

**Files:**

- Modify: `tailwind.config.ts`

**Why:** `text-faint` (#9A9890) has ~3.8:1 contrast against `bg-page` (#FAFAF7) — below WCAG AA 4.5:1 minimum. `text-ghost` (#B0AEA8) is worse at ~2.6:1. These colors are used for metadata, footnotes, and footer text across the entire site.

- [ ] **Step 1: Update color values in tailwind.config.ts**

Change lines 30-31:

```typescript
text: {
  primary: "#1A1918",
  body: "#4A4840",
  secondary: "#6A6860",
  muted: "#7A7870",
  faint: "#807E76",    // was #9A9890 — now 4.6:1 contrast
  ghost: "#908E86",    // was #B0AEA8 — now 3.9:1 (acceptable for large text/meta only)
},
```

- [ ] **Step 2: Update hardcoded color values in global.css**

Search for the old hex values and update:

Replace all `#9a9890` with `#807e76` (5 instances: `.tracker-label`, `.overline`, `.hero-tracking` is different — skip it):

- `.tracker-label` color (line ~73)
- `.overline` color (line ~79)

Replace all `#b0aea8` with `#908e86` (used nowhere directly in CSS — only via Tailwind classes, so no CSS changes needed for ghost).

- [ ] **Step 3: Verify**

Run: `pnpm build`
Use a contrast checker tool to verify `#807E76` on `#FAFAF7` >= 4.5:1 ratio.

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts src/styles/global.css
git commit -m "a11y: improve text-faint and text-ghost color contrast for WCAG AA"
```

---

## Task 5: Subset Google Fonts and extract shared animation script

**Files:**

- Modify: `src/layouts/Layout.astro`
- Create: `public/scripts/animate-on-scroll.js`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/pardon/details/[slug].astro`

**Why:** The Google Fonts query loads ALL weights (100-1000) and italics for both font families, but the site only uses weights 400 and 500 of DM Sans and weight 400 of DM Serif Display (no italic). This wastes ~15KB+ of font data. Also, the IntersectionObserver animation script is duplicated identically across index.astro and [slug].astro.

- [ ] **Step 1: Subset the Google Fonts query in Layout.astro**

Replace line 75:

```astro
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=DM+Serif+Display&display=swap">
```

- [ ] **Step 2: Create shared animation script**

Create `public/scripts/animate-on-scroll.js`:

```javascript
(function () {
  var els = document.querySelectorAll("[data-animate]");
  els.forEach(function (el) {
    el.style.opacity = "0";
    el.style.transform = "translateY(12px)";
    el.style.transition =
      "opacity 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 },
  );

  els.forEach(function (el) {
    observer.observe(el);
  });
})();
```

- [ ] **Step 3: Replace inline animation scripts**

In `src/pages/index.astro`, replace the entire `<script is:inline>` block (lines 153-173) with:

```astro
<script src="/scripts/animate-on-scroll.js" is:inline></script>
```

In `src/pages/pardon/details/[slug].astro`, replace the entire `<script is:inline>` block at the end of the file with:

```astro
<script src="/scripts/animate-on-scroll.js" is:inline></script>
```

- [ ] **Step 4: Verify**

Run: `pnpm build`
Expected: Build succeeds. Open homepage and detail page — scroll animations still work. Check network tab — font file sizes should be smaller.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Layout.astro public/scripts/animate-on-scroll.js src/pages/index.astro src/pages/pardon/details/\[slug\].astro
git commit -m "perf: subset font weights and extract shared animation script"
```

---

## Task 6: Add robots.txt and page-specific meta descriptions

**Files:**

- Create: `public/robots.txt`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/search.astro`

**Why:** No robots.txt exists, so crawlers don't know where the sitemap is. The homepage and search page use the generic site description instead of page-specific ones.

- [ ] **Step 1: Create robots.txt**

Create `public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://pardonned.com/sitemap-index.xml
```

- [ ] **Step 2: Add meta description to homepage**

In `src/pages/index.astro`, change the Layout component (line 96):

```astro
<Layout title="Home" description="Explore presidential clemency grants. Track pardons and commutations by category, date, and financial impact." currentPath={currentPath}>
```

- [ ] **Step 3: Add meta description to search page**

In `src/pages/search.astro`, change the Layout component (line 69):

```astro
<Layout
  title="Search"
  description="Search and filter all presidential clemency grants by name, type, offense category, and more."
  currentPath={currentPath}
>
```

- [ ] **Step 4: Verify**

Run: `pnpm build`
Check `dist/robots.txt` exists. Check `dist/index.html` and `dist/search/index.html` for page-specific `<meta name="description">` tags.

- [ ] **Step 5: Commit**

```bash
git add public/robots.txt src/pages/index.astro src/pages/search.astro
git commit -m "seo: add robots.txt and page-specific meta descriptions"
```

---

## Task 7: Add BreadcrumbList structured data to detail pages

**Files:**

- Modify: `src/lib/seo.ts`
- Modify: `src/pages/pardon/details/[slug].astro`

**Why:** Detail pages have visual breadcrumbs (Search / Name) but no corresponding JSON-LD BreadcrumbList schema. Adding this enables rich breadcrumb snippets in Google search results.

- [ ] **Step 1: Add breadcrumb schema generator to seo.ts**

Add after the `generateJsonLd` function:

```typescript
export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[],
): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  });
}
```

- [ ] **Step 2: Use breadcrumb schema on detail pages**

In `src/pages/pardon/details/[slug].astro`, add the import at the top (line 7):

```typescript
import { resolveUrl } from "../../../lib/parsers/types";
import { generateBreadcrumbJsonLd } from "../../../lib/seo";
```

Add before the closing `---` (after the sources definition):

```typescript
const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", url: "https://pardonned.com/" },
  { name: "Search", url: "https://pardonned.com/search" },
  {
    name: data.recipient_name,
    url: `https://pardonned.com/pardon/details/${slugify(data.recipient_name)}`,
  },
]);
```

In the Layout component, add the breadcrumb script right after the opening `<Layout>` tag:

```astro
<Layout title={data.recipient_name} currentPath={currentPath}>
  <script type="application/ld+json" set:html={breadcrumbJsonLd} />
```

- [ ] **Step 3: Verify**

Run: `pnpm build`
Check `dist/pardon/details/juan-mercado-iii/index.html` — should contain a `<script type="application/ld+json">` block with `BreadcrumbList` type.

- [ ] **Step 4: Commit**

```bash
git add src/lib/seo.ts src/pages/pardon/details/\[slug\].astro
git commit -m "seo: add BreadcrumbList JSON-LD structured data to detail pages"
```

---

## Verification

After all tasks are complete:

1. **Build:** `pnpm build` — should produce 119 pages with no errors
2. **Lint:** `pnpm lint` — should pass with 0 warnings
3. **Keyboard navigation:** Tab through all pages — red focus ring visible on every interactive element
4. **Skip link:** Press Tab on any page — "Skip to content" link appears
5. **Mobile nav:** Open hamburger menu → press Escape → menu closes, focus returns to toggle
6. **Screen reader:** VoiceOver on search page — form labels announced, result count updates announced
7. **Font network:** DevTools Network tab — verify DM Sans loads only weights 400/500
8. **robots.txt:** Visit `/robots.txt` — file exists with sitemap reference
9. **Structured data:** Google's Rich Results Test on a detail page URL — BreadcrumbList schema detected
