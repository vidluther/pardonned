import type { OffenseCategory } from "./types.js";

const CATEGORY_PATTERNS: Record<OffenseCategory, RegExp[]> = {
  "violent crime": [
    /\b(murder|homicide|manslaughter|assault|battery|kidnap(?:ping)?|robbery|rape|sexual\s+assault|domestic\s+violence|arson|carjacking|violence|violent|armed\s+robbery)\b/i,
    /\b(conspiracy\s+to\s+(commit\s+)?(murder|assault|kidnap|robbery))\b/i,
  ],
  fraud: [
    /\b(fraud|embezzlement|false\s+statements|perjury|mail\s+fraud|wire\s+fraud|tax\s+fraud|bank\s+fraud|health\s+care\s+fraud|medicare\s+fraud|identity\s+theft|forgery|racketeering)\b/i,
  ],
  "drug offense": [
    /\b(drug|narcotic|cocaine|heroin|marijuana|methamphetamine|fentanyl|opioid|controlled\s+substance|possession\s+with\s+intent|distribution\s+of|trafficking|conspiracy\s+to\s+distribute)\b/i,
  ],
  "FACE act": [
    /\b(face\s+act|freedom\s+of\s+access\s+to\s+clinic\s+entrances|clinic\s+entrance|reproductive\s+health\s+care\s+facility|obstruction\s+of\s+clinic)\b/i,
  ],
  immigration: [
    /\b(immigration|illegal\s+entry|illegal\s+reentry|alien\s+smuggling|human\s+smuggling|border\s+patrol|undocumented|deportation|removal|visa\s+fraud|illegal\s+presence)\b/i,
  ],
  firearms: [
    /\b(firearm|gun|weapon|possess(?:ion)?\s+(?:of\s+)?(?:a\s+)?(?:firearm|gun|weapon)|felon\s+in\s+possession|straw\s+purchas(?:e|ing)|illegal\s+transfer)\b/i,
  ],
  "financial crime": [
    /\b(money\s+laundering|tax\s+evasion|structuring|currency\s+transaction|financial\s+institution|bank\s+secrecy|racketeer|bribery|corruption|kickback)\b/i,
  ],
  other: [],
};

export function categorizeOffense(offense: string): OffenseCategory {
  const text = offense.toLowerCase();

  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS) as [
    OffenseCategory,
    RegExp[],
  ][]) {
    if (category === "other") continue;
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return category;
      }
    }
  }

  return "other";
}
