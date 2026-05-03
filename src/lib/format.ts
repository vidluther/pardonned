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

/**
 * Format a `sentence_in_months` value as a human-readable phrase.
 * Returns an em-dash for null/undefined.
 *
 *   3   → "3 months"
 *   12  → "1 year"
 *   30  → "2 years, 6 months"
 *   240 → "20 years"
 */
export function formatSentenceMonths(months: number | null | undefined): string {
  if (months == null) return "—";
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"}`;
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  const yearsLabel = `${years} ${years === 1 ? "year" : "years"}`;
  if (remainder === 0) return yearsLabel;
  return `${yearsLabel}, ${remainder} ${remainder === 1 ? "month" : "months"}`;
}

/**
 * Compact sentence formatter for tight display (e.g. detail-page money
 * strip). Returns a short form like "48mo", "4yr", "10yr 6mo".
 */
export function formatSentenceCompact(months: number | null | undefined): string {
  if (months == null) return "—";
  if (months < 12) return `${months}mo`;
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (remainder === 0) return `${years}yr`;
  return `${years}yr ${remainder}mo`;
}

/**
 * Precise USD currency. Used on the row-level metadata grid where
 * absence is meaningful — returns "—" for null and "$0" for zero.
 */
export function formatCurrencyPrecise(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
