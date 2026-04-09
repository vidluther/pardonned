import type { PresidentSource } from "../lib/parsers/types.js";

export const PRESIDENT_SOURCES: PresidentSource[] = [
  {
    slugs: ["trump-2"],
    combined:
      "https://www.justice.gov/pardon/clemency-grants-president-donald-j-trump-2025-present",
  },
  {
    slugs: ["biden-1"],
    pardons:
      "https://www.justice.gov/pardon/pardons-granted-president-joseph-biden-2021-2025",
    commutations:
      "https://www.justice.gov/pardon/commutations-granted-president-joseph-biden-2021-2025",
  },
  {
    slugs: ["trump-1"],
    pardons:
      "https://www.justice.gov/pardon/pardons-granted-president-donald-j-trump-2017-2021",
    commutations:
      "https://www.justice.gov/pardon/commutations-granted-president-donald-j-trump-2017-2021",
  },
  {
    slugs: ["obama-1", "obama-2"],
    pardons:
      "https://www.justice.gov/pardon/pardons-granted-president-barack-h-obama-2009-2017",
    commutations:
      "https://www.justice.gov/pardon/commutations-granted-president-barack-h-obama-2009-2017",
  },
  {
    slugs: ["bush-jr-1", "bush-jr-2"],
    pardons:
      "https://www.justice.gov/pardon/pardons-granted-president-george-w-bush-2001-2009",
    commutations:
      "https://www.justice.gov/pardon/commutations-granted-president-george-w-bush-2001-2009",
  },
];

/**
 * Term boundary dates for multi-term presidents.
 * Used to assign grants to the correct term when a single source page
 * covers both terms. The date is the second inauguration.
 */
export const TERM_BOUNDARIES: Record<string, string> = {
  "Richard M. Nixon": "1973-01-20",
  "Ronald W. Reagan": "1985-01-20",
  "William J. Clinton": "1997-01-20",
  "George W. Bush": "2005-01-20",
  "Barack H. Obama": "2013-01-20",
};
