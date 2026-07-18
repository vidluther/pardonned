/**
 * Shared predicates for scraped pardon clause fields (`offense`, `district`,
 * `original_sentence`).
 *
 * Pardon record fields cannot be trusted raw: preemptive pardons carry
 * "For any offenses…" scope legalese with no conviction; scraper sentinels
 * leak through (`district = "N/A"`, `offense = "Download PDF Clemency
 * Warrant"`); DOJ HTML plants NBSPs inside values. Every surface that renders
 * these fields — detail page, listings, search, atom feed, SERP strings —
 * must go through this module so the site never states a false conviction
 * and never disagrees with itself about whether one exists (CONTEXT.md,
 * "Preemptive pardon").
 *
 * The functions form a ladder; each rung filters more than the last:
 *
 * - `displayClause` — sentinel-free display text, punctuation kept.
 * - `cleanClause` — `displayClause` minus the trailing period, for composing
 *   sentences ("Convicted of X in the Y.") without doubled punctuation.
 * - `proseClause` / `realClause` — additionally reject scope legalese; null
 *   means "no real conviction content". The two differ only in trailing-period
 *   handling (`proseClause` keeps it for display, `realClause` strips it for
 *   sentence composition) — their nullity is always identical, so either one
 *   is a valid "is this record conviction-shaped?" test.
 * - `scopeClause` — the inverse: the text only when it IS scope legalese,
 *   for rendering a preemptive pardon's coverage as prose.
 */

// "N/A" is a scraper placeholder in every clause field (district, offense,
// original_sentence) — never a real value.
const NA_SENTINEL = "N/A";

/** Field-specific sentinels beyond "N/A" for the `offense` field. */
export const OFFENSE_SENTINELS = new Set(["Download PDF Clemency Warrant"]);

/**
 * Preemptive-pardon scope legalese describes what the pardon covers — not a
 * conviction or a sentence. It leaks into both the offense and
 * original_sentence fields, and DOJ's phrasing varies: "For any offenses
 * against the United States which he may have committed…" (Fauci, Milley,
 * J6 Committee), "For any nonviolent offenses…" (Biden family), "For those
 * offenses against the United States which he has committed or may have
 * committed…" (Hunter Biden), "For those offenses she has or may have
 * committed … related to election integrity…" (Tina Peters — no "against
 * the United States" clause at all). The shared skeleton is
 * `For any|those … offenses … committed`; anchoring on it instead of any
 * one phrasing keeps the next variant from slipping through as a fake
 * conviction. Test against quote-stripped text — DOJ wraps some values in
 * curly quotes (Tina Peters).
 */
export const PARDON_SCOPE_LEGALESE =
  /^for\s+(?:any|those)\b[\s\S]{0,120}?\boffenses\b[\s\S]{0,400}?\bcommitted\b/i;

// Wrapping double quotes (straight or curly) around a whole clause value —
// DOJ quotes some scope legalese verbatim. Stripped for display: the site
// adds its own quoting when it renders warrant prose.
const WRAPPING_QUOTES = /^["“”]\s*([\s\S]*?)\s*["“”]$/;

/**
 * DOJ HTML uses &nbsp; inside some recipient names and clause values (repo
 * gotcha). Display strings must show regular spaces; slug/override lookups
 * elsewhere must NOT use this (they are byte-exact).
 */
export function normalizeSpaces(s: string): string {
  return s.replace(/\u00A0/g, " ");
}

/**
 * Sentinel-free display text: NBSP→space, trim, null for empty/sentinel
 * values. Keeps punctuation, keeps scope legalese (which is informative and
 * self-describing on listing surfaces).
 */
export function displayClause(
  value: string | null | undefined,
  extraSentinels?: Set<string>,
): string | null {
  if (!value) return null;
  const trimmed = normalizeSpaces(value).trim().replace(WRAPPING_QUOTES, "$1");
  if (!trimmed || trimmed === NA_SENTINEL || extraSentinels?.has(trimmed)) return null;
  return trimmed;
}

/**
 * `displayClause` minus the trailing period, so callers can add their own
 * punctuation without doubling.
 */
export function cleanClause(
  value: string | null | undefined,
  extraSentinels?: Set<string>,
): string | null {
  return displayClause(value, extraSentinels)?.replace(/\.$/, "") ?? null;
}

/**
 * A clause value that is real conviction content — not a sentinel, not scope
 * legalese (which would falsely read as a conviction or a sentence). Trailing
 * period stripped, for sentence composition.
 */
export function realClause(
  value: string | null | undefined,
  extraSentinels?: Set<string>,
): string | null {
  const cleaned = cleanClause(value, extraSentinels);
  if (!cleaned || PARDON_SCOPE_LEGALESE.test(cleaned)) return null;
  return cleaned;
}

/**
 * Display-quality counterpart of `realClause`: real conviction content with
 * punctuation kept. Same nullity as `realClause`.
 */
export function proseClause(
  value: string | null | undefined,
  extraSentinels?: Set<string>,
): string | null {
  const display = displayClause(value, extraSentinels);
  if (!display || PARDON_SCOPE_LEGALESE.test(display)) return null;
  return display;
}

/**
 * The scope legalese itself, display-quality — or null when the value is a
 * real offense/sentence or a sentinel. Used to render what a preemptive
 * pardon covers, in the warrant's own words.
 */
export function scopeClause(value: string | null | undefined): string | null {
  const display = displayClause(value);
  if (!display || !PARDON_SCOPE_LEGALESE.test(display)) return null;
  return display;
}
