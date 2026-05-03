/**
 * Color resolution for offense categories.
 *
 * Single source of truth for category → hex color mapping. Replaces the
 * triplicated `categoryColors` map that previously lived inline in
 * `src/pages/search.astro`, `src/pages/president/[slug].astro`, and
 * `src/components/CategoryBadge.astro`.
 *
 * The DB enum currently has 8 values. A separate AI-reclassification
 * effort will surface additional categories (`january 6`, `political
 * corruption`, `cryptocurrency`). Unknown keys — including those future
 * ones until they're explicitly assigned a color here — fall back to a
 * neutral grey rather than throwing, so the UI degrades gracefully when
 * new categories appear in the data ahead of a UI deploy.
 */

export const FALLBACK_CATEGORY_COLOR = "#7A7870";

const CATEGORY_COLORS: Record<string, string> = {
  fraud: "#8A6B1E",
  "drug offense": "#3A6A4A",
  firearms: "#C23B22",
  "FACE act": "#B8652A",
  "financial crime": "#2A6A7A",
  "violent crime": "#6A4B7A",
  immigration: "#7A6A3A",
  other: "#7A7870",
};

export function getCategoryColor(key: string): string {
  return CATEGORY_COLORS[key] ?? FALLBACK_CATEGORY_COLOR;
}

export function hasExplicitCategoryColor(key: string): boolean {
  return key in CATEGORY_COLORS;
}
