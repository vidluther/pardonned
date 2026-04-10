/**
 * Format an administration's display name for UI use.
 *
 * Single-term presidents (isOnlyTerm=true) render as just the name.
 * Multi-term presidents render with an ordinal suffix, e.g.
 * "Donald Trump (First Term)".
 */
export function formatAdministrationDisplayName(
  presidentName: string,
  termNumber: number,
  isOnlyTerm: boolean,
): string {
  if (isOnlyTerm) {
    return presidentName;
  }
  return `${presidentName} (${ordinalTermLabel(termNumber)})`;
}

const ORDINAL_TERM_LABELS: Record<number, string> = {
  1: "First Term",
  2: "Second Term",
  3: "Third Term",
  4: "Fourth Term",
};

function ordinalTermLabel(termNumber: number): string {
  return ORDINAL_TERM_LABELS[termNumber] ?? `Term ${termNumber}`;
}
