/**
 * Compact money formatter for display-scale figures: $1.47B, $92.4M, $4.4K, $508.
 *
 * Used wherever a money value needs to fit in a tight typographic frame —
 * the number wall, comparison strip, restitution leaderboard. For the
 * detail page's row-level metadata grid we keep full-precision currency
 * via `Intl.NumberFormat` instead.
 */
export function formatCompactMoney(value: number | null | undefined): string {
  if (value == null || value === 0) return "$0";
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2).replace(/\.?0+$/, "")}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1_000) {
    return `$${Math.round(value / 1_000)}K`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Format an ISO date (YYYY-MM-DD) as e.g. "January 19, 2017" using local
 * date construction (avoids the off-by-one timezone trap of `new Date("YYYY-MM-DD")`).
 */
export function formatGrantDateLong(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format an ISO date as e.g. "Jan 19, 2017".
 */
export function formatGrantDateShort(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
