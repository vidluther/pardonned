# Dynamic OG Images & Per-Page Meta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate unique Open Graph images and per-page titles/descriptions for all 117+ detail pages, the homepage, and the search page — so every shared link on social media has a distinctive, branded preview card.

**Architecture:** Use Satori (JSX to SVG) + Sharp (SVG to PNG) in a static Astro endpoint (`src/pages/og/[slug].png.ts`) to generate 1200x630 OG images at build time. Each detail page image shows the recipient's name, clemency type, grant date, and headline stat (restitution or sentence). The homepage and search page get hand-crafted static OG images. All pages pass unique `description` and `ogImage` props to Layout.

**Tech Stack:** Astro 6.1, satori, sharp, TypeScript

---

## File Structure

| File                                    | Responsibility                                                                          |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/pages/og/[slug].png.ts`            | **New** — Astro endpoint that generates a unique OG image per detail page at build time |
| `src/lib/og-image.ts`                   | **New** — Satori markup function + Sharp render pipeline (shared logic)                 |
| `src/pages/og/home.png.ts`              | **New** — Static OG image for the homepage                                              |
| `src/pages/og/search.png.ts`            | **New** — Static OG image for the search page                                           |
| `src/pages/pardon/details/[slug].astro` | **Modify** — Pass `description` and `ogImage` props to Layout                           |
| `src/pages/index.astro`                 | **Modify** — Pass `ogImage` prop to Layout                                              |
| `src/pages/search.astro`                | **Modify** — Pass `ogImage` prop to Layout                                              |
| `src/config/site.ts`                    | **Modify** — Update `defaultOgImage` to point to the home OG image                      |

---

## Task 1: Install dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install satori and sharp**

```bash
pnpm add satori sharp
pnpm add -D @types/sharp
```

- [ ] **Step 2: Verify installation**

Run: `pnpm build`
Expected: Build succeeds (no breakage from new deps).

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add satori and sharp for OG image generation"
```

---

## Task 2: Create OG image rendering utilities

**Files:**

- Create: `src/lib/og-image.ts`

This file contains two functions: `renderOgMarkup()` which returns the Satori JSX tree, and `renderOgImage()` which takes that markup and produces a PNG buffer via Satori + Sharp.

- [ ] **Step 1: Create src/lib/og-image.ts**

```typescript
import satori from "satori";
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load font files at module level (cached across invocations during build)
const dmSansPath = resolve(
  process.cwd(),
  "src/assets/fonts/DMSans-Regular.ttf",
);
const dmSansmedPath = resolve(
  process.cwd(),
  "src/assets/fonts/DMSans-Medium.ttf",
);
const dmSerifPath = resolve(
  process.cwd(),
  "src/assets/fonts/DMSerifDisplay-Regular.ttf",
);

let dmSans: Buffer;
let dmSansMedium: Buffer;
let dmSerif: Buffer;

function loadFonts() {
  if (!dmSans) {
    dmSans = readFileSync(dmSansPath);
    dmSansMedium = readFileSync(dmSansmedPath);
    dmSerif = readFileSync(dmSerifPath);
  }
}

export interface OgImageData {
  title: string;
  subtitle?: string;
  stat?: string;
  statLabel?: string;
  accent?: boolean;
}

export async function renderOgImage(data: OgImageData): Promise<Buffer> {
  loadFonts();

  const markup = renderOgMarkup(data);

  const svg = await satori(markup, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "DM Sans", data: dmSans, weight: 400, style: "normal" },
      { name: "DM Sans", data: dmSansMedium, weight: 500, style: "normal" },
      { name: "DM Serif Display", data: dmSerif, weight: 400, style: "normal" },
    ],
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}

function renderOgMarkup(data: OgImageData) {
  const { title, subtitle, stat, statLabel, accent } = data;

  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 80px",
        backgroundColor: "#FAFAF7",
        fontFamily: "DM Sans",
      },
      children: [
        // Top: Wordmark
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "12px",
            },
            children: [
              {
                type: "span",
                props: {
                  style: {
                    fontFamily: "DM Serif Display",
                    fontSize: "28px",
                    color: "#1A1918",
                  },
                  children: "Pardonned",
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "13px",
                    color: "#807E76",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  },
                  children: "Tracking Pardons by President",
                },
              },
            ],
          },
        },
        // Middle: Title + subtitle
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    fontFamily: "DM Serif Display",
                    fontSize: "64px",
                    color: "#1A1918",
                    lineHeight: "1.1",
                    letterSpacing: "-0.02em",
                  },
                  children: title,
                },
              },
              subtitle
                ? {
                    type: "div",
                    props: {
                      style: {
                        fontSize: "22px",
                        color: "#6A6860",
                      },
                      children: subtitle,
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },
        // Bottom: Stat (optional) + accent bar
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            },
            children: [
              stat
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              fontFamily: "DM Serif Display",
                              fontSize: "42px",
                              color: accent ? "#C23B22" : "#1A1918",
                              lineHeight: "1.1",
                            },
                            children: stat,
                          },
                        },
                        statLabel
                          ? {
                              type: "div",
                              props: {
                                style: {
                                  fontSize: "16px",
                                  color: "#807E76",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                },
                                children: statLabel,
                              },
                            }
                          : null,
                      ].filter(Boolean),
                    },
                  }
                : null,
              // Accent bar
              {
                type: "div",
                props: {
                  style: {
                    width: "80px",
                    height: "4px",
                    backgroundColor: "#C23B22",
                    borderRadius: "2px",
                  },
                  children: [],
                },
              },
            ].filter(Boolean),
          },
        },
      ],
    },
  };
}
```

- [ ] **Step 2: Download font files**

Download DM Sans (Regular + Medium) and DM Serif Display (Regular) TTF files and save them to `src/assets/fonts/`. These are needed because Satori cannot fetch from Google Fonts at build time.

```bash
mkdir -p src/assets/fonts
curl -L "https://github.com/google/fonts/raw/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf" -o src/assets/fonts/DMSans-Regular.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/dmsans/DMSans-Italic%5Bopsz%2Cwght%5D.ttf" -o src/assets/fonts/DMSans-Medium.ttf
curl -L "https://github.com/google/fonts/raw/main/ofl/dmserifdisplay/DMSerifDisplay-Regular.ttf" -o src/assets/fonts/DMSerifDisplay-Regular.ttf
```

**Note:** DM Sans is a variable font, so the single "Regular" file contains all weights (400-500 included). Satori reads the weight from the font config, not the filename. Name the file `DMSans-Regular.ttf` for the 400-weight instance and use the same file for Medium — OR download the static font files from Google Fonts directly. If the variable font file doesn't work with Satori, fall back to downloading static weight files from the google/fonts GitHub repo under `ofl/dmsans/static/`.

- [ ] **Step 3: Verify fonts load**

Create a quick test by adding a temporary script or verifying the font files exist:

```bash
ls -la src/assets/fonts/
```

Expected: Three `.ttf` files present.

- [ ] **Step 4: Commit**

```bash
git add src/lib/og-image.ts src/assets/fonts/
git commit -m "feat: add OG image rendering utilities with satori and sharp"
```

---

## Task 3: Create detail page OG image endpoint

**Files:**

- Create: `src/pages/og/[slug].png.ts`

This Astro endpoint generates a unique OG image for each pardon detail page at build time.

- [ ] **Step 1: Create src/pages/og/[slug].png.ts**

```typescript
import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { slugify } from "../../lib/slugify";
import { renderOgImage } from "../../lib/og-image";

export const prerender = true;

export const getStaticPaths: GetStaticPaths = async () => {
  const allGrants = await getCollection("pardonDetails");

  return allGrants.map((grant) => {
    const d = grant.data;
    const hasRestitution = d.restitution != null && d.restitution > 0;

    let stat: string | undefined;
    let statLabel: string | undefined;
    let accent = false;

    if (hasRestitution) {
      stat = formatCurrency(d.restitution!);
      statLabel = "Restitution abandoned";
      accent = true;
    } else if (d.sentence_in_months && d.sentence_in_months > 0) {
      stat = formatSentence(d.sentence_in_months);
      statLabel =
        d.clemency_type === "commutation"
          ? "Sentence commuted"
          : "Prison sentence";
    }

    const clemencyLabel =
      d.clemency_type === "pardon" ? "Pardon" : "Commutation";
    const dateShort = formatDateShort(d.grant_date);

    return {
      params: { slug: slugify(d.recipient_name) },
      props: {
        title: d.recipient_name,
        subtitle: `${clemencyLabel} · ${dateShort}`,
        stat,
        statLabel,
        accent,
      },
    };
  });
};

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000)
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}

function formatSentence(months: number): string {
  if (months < 12) return `${months} months`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years > 1 ? "s" : ""}`;
  return `${years}y ${rem}m`;
}

function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    },
  );
}

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage(props);

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};
```

- [ ] **Step 2: Verify image generation**

Run: `pnpm build`
Expected: Build succeeds. Check that `dist/og/juan-mercado-iii.png` exists and is a valid PNG image (~50-100KB).

```bash
ls -la dist/og/ | head -5
file dist/og/juan-mercado-iii.png
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/og/\[slug\].png.ts
git commit -m "feat: add dynamic OG image endpoint for detail pages"
```

---

## Task 4: Create homepage and search page OG images

**Files:**

- Create: `src/pages/og/home.png.ts`
- Create: `src/pages/og/search.png.ts`

- [ ] **Step 1: Create src/pages/og/home.png.ts**

```typescript
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { computeStats } from "../../lib/pardon-stats";
import { renderOgImage } from "../../lib/og-image";

export const prerender = true;

export const GET: APIRoute = async () => {
  const allGrants = await getCollection("pardonDetails");
  const stats = computeStats(allGrants);

  const png = await renderOgImage({
    title: "Pardons granted by Donald J Trump",
    subtitle: "Not Including the January 6th Pardons",
    stat: `${stats.totalGrants}`,
    statLabel: "Clemency grants tracked",
  });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};
```

- [ ] **Step 2: Create src/pages/og/search.png.ts**

```typescript
import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { renderOgImage } from "../../lib/og-image";

export const prerender = true;

export const GET: APIRoute = async () => {
  const allGrants = await getCollection("pardonDetails");

  const png = await renderOgImage({
    title: "Search Clemency Grants",
    subtitle: `${allGrants.length} grants searchable by name, type, and category`,
  });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};
```

- [ ] **Step 3: Verify both images generate**

Run: `pnpm build`
Expected: `dist/og/home.png` and `dist/og/search.png` exist.

```bash
file dist/og/home.png dist/og/search.png
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/og/home.png.ts src/pages/og/search.png.ts
git commit -m "feat: add OG image endpoints for homepage and search page"
```

---

## Task 5: Wire OG images and descriptions into all pages

**Files:**

- Modify: `src/pages/pardon/details/[slug].astro`
- Modify: `src/pages/index.astro`
- Modify: `src/pages/search.astro`
- Modify: `src/config/site.ts`

- [ ] **Step 1: Add description and ogImage to detail pages**

In `src/pages/pardon/details/[slug].astro`, find the `<Layout>` call (line ~186) and add `description` and `ogImage` props.

First, add these variables in the frontmatter (before the closing `---`), after the `breadcrumbJsonLd` definition:

```typescript
const ogDescription =
  `${clemencyLabels[data.clemency_type] ?? data.clemency_type} granted to ${data.recipient_name} on ${grantDate}. ${hasRestitution ? `${formattedRestitution} in restitution abandoned.` : ""}`.trim();
const ogImagePath = `/og/${slugify(data.recipient_name)}.png`;
```

Then update the Layout call:

```astro
<Layout title={data.recipient_name} description={ogDescription} ogImage={ogImagePath} currentPath={currentPath}>
```

- [ ] **Step 2: Add ogImage to homepage**

In `src/pages/index.astro`, update the Layout call:

```astro
<Layout title="Home" description="Explore presidential clemency grants. Track pardons and commutations by category, date, and financial impact." ogImage="/og/home.png" currentPath={currentPath}>
```

- [ ] **Step 3: Add ogImage to search page**

In `src/pages/search.astro`, update the Layout call:

```astro
<Layout
  title="Search"
  description="Search and filter all presidential clemency grants by name, type, offense category, and more."
  ogImage="/og/search.png"
  currentPath={currentPath}
>
```

- [ ] **Step 4: Update default OG image in site config**

In `src/config/site.ts`, update `defaultOgImage`:

```typescript
defaultOgImage: "/og/home.png",
```

- [ ] **Step 5: Verify**

Run: `pnpm build`
Expected: Build succeeds. Check the HTML output for correct og:image tags:

```bash
grep -o 'og:image.*content="[^"]*"' dist/index.html
grep -o 'og:image.*content="[^"]*"' dist/pardon/details/juan-mercado-iii/index.html
grep -o 'og:image.*content="[^"]*"' dist/search/index.html
```

Expected output should show unique image URLs per page:

- Home: `https://pardonned.com/og/home.png`
- Detail: `https://pardonned.com/og/juan-mercado-iii.png`
- Search: `https://pardonned.com/og/search.png`

- [ ] **Step 6: Commit**

```bash
git add src/pages/pardon/details/\[slug\].astro src/pages/index.astro src/pages/search.astro src/config/site.ts
git commit -m "feat: wire unique OG images and descriptions into all pages"
```

---

## Verification

After all tasks are complete:

1. **Build:** `pnpm build` — should produce 119+ pages plus ~119 PNG files in `dist/og/`
2. **Lint:** `pnpm lint` — no new errors
3. **Image count:** `ls dist/og/*.png | wc -l` — should match grant count + 2 (home + search)
4. **Image quality:** Open `dist/og/juan-mercado-iii.png` in an image viewer — should be 1200x630, show name, clemency type, date, and stat
5. **Meta tags:** Check `dist/pardon/details/juan-mercado-iii/index.html` for:
   - `og:image` pointing to `/og/juan-mercado-iii.png`
   - `og:description` with a unique description mentioning the recipient
   - `twitter:image` matching `og:image`
6. **Social preview:** Use a social media debugger (Twitter Card Validator, Facebook Sharing Debugger) on the deployed URL to verify images render correctly
