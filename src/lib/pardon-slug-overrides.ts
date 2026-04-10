/**
 * Manual slug overrides for pardons whose recipient_name would otherwise
 * produce an unwieldy or filesystem-unsafe URL slug.
 *
 * Keyed by the exact recipient_name string as stored in the pardons table.
 * The slug resolver in src/lib/slugify.ts checks this map first and falls
 * back to the computed slug path only if there's no override.
 *
 * Rationale: about 21 pardon records have recipient_name values longer
 * than 50 characters — mostly because they include multiple "aka"/"fka"
 * aliases, or describe group clemency actions (e.g. the January 6 Select
 * Committee). A few exceed the OS filename length limit when slugified,
 * crashing the OG image build. Handling them as explicit manual overrides
 * keeps their URLs short, memorable, and typeable.
 *
 * IMPORTANT: Keys in this map are matched byte-for-byte against the raw
 * `recipient_name` values from the pardons table. Three entries contain
 * U+00A0 non-breaking spaces (scraped from `&nbsp;` in the DOJ source
 * HTML) and two contain U+201C/U+201D smart quotes. These are written as
 * explicit Unicode escape sequences (`\u00A0`, `\u201C`, `\u201D`,
 * `\u00F1`) rather than literal characters so they remain visible in
 * code review and survive copy/paste.
 *
 * If a future caller pre-normalizes `recipient_name` before calling
 * slugify() (for example via String.prototype.normalize or a whitespace
 * collapse), the byte-exact match will silently miss and the record will
 * fall through to the hash-suffixed fallback path. Do not add implicit
 * normalization inside slugify() — either update the caller to pass raw
 * values, or add the normalized form as an additional key alongside the
 * raw form. The longer-term fix is the planned DB-backed slug column.
 */
export const PARDON_SLUG_OVERRIDES: Record<string, string> = {
  // Group clemency (biden-1): the 374-char full description of the Jan 6
  // Select Committee, its staff, and the testifying police officers. The
  // slug is editorial — no primary name exists to derive one from.
  "The Members of Congress who served on the Select Committee to Investigate the January 6th Attack on the United States Capitol (\u201CSelect Committee\u201D); the staff of the Select Committee, as provided by House Resolution 503 (117th Congress); and the police officers from the D.C. Metropolitan Police Department or the U.S. Capitol Police who testified before the Select Committee":
    "january-6th-committee",

  // Group clemency (biden-1): five Biden family members, separated in the
  // DB by non-breaking spaces (two NBSPs after "Francis W. Biden", one
  // between each subsequent name). Slug is editorial.
  "Francis W. Biden\u00A0\u00A0James B. Biden\u00A0Sara Jones Biden\u00A0John T. Owens\u00A0Valerie Biden Owens":
    "biden-family",

  "Michelle Breazeale Horton, fka Michelle Diane Mulkey and Michelle Diane Breazeale":
    "michelle-breazeale-horton",

  "Theresa Renee Gardley, fka Theresa Renee Naper, fka Theresa Renee Thornton":
    "theresa-renee-gardley",

  // Editorial: strips the parenthetical "*(condition declined, commutation
  // not effectuated)" note, which is meaningful metadata but belongs on
  // the detail page body, not the URL.
  "Arnold Ray Jones *(condition declined, commutation not effectuated)":
    "arnold-ray-jones",

  "Octavio Joaquin Armenteros, aka Octavio Joaquin Armenteros-Iglesias":
    "octavio-armenteros",

  "Bashir Noorzai,\u00A0also known as Basheer Ahmad and Haji Bashir Noorzai":
    "bashir-noorzai",

  "Erica Renee Ramos, fka Erica Renee DeVore, fka Erica Renee Ramirez":
    "erica-renee-ramos",

  // Editorial: uses the non-primary alias "Scooter" (trump-1, Plame leak
  // case) because it's how this pardon is historically known. The smart
  // quotes in "\u201CScooter\u201D" are U+201C/U+201D and must match the
  // DB bytes exactly.
  "I. Lewis Libby, aka Scooter Libby, aka Irve Lewis \u201CScooter\u201D Libby":
    "scooter-libby",

  "Claude Nathalie Eyamba Fenno, fka Claude-Nathalie Ebehedi Eyamba":
    "claude-eyamba-fenno",

  "Kristi Lynn Coe, aka Kristi Lynn Coe-Hagan, fka Kristi Hinshaw":
    "kristi-lynn-coe",

  "Lehi Victoria Dickey, aka Lahi Dickey, fka Lehi Dickey Bryant":
    "lehi-victoria-dickey",

  "Richard D. Reid, aka Abdul H. Shabazz, aka Hakeem A. Shabazz":
    "richard-d-reid",

  "Alejandro Enrique Ramirez Uma\u00F1a, aka Alejandro Enrique Umana":
    "alejandro-ramirez-umana",

  "Cynthia Ann Raffensparger, fka Cynthia Ann Grange Hansen":
    "cynthia-raffensparger",

  // Editorial: drops the middle name "Charles" and suffix "II" for a
  // shorter, more memorable slug. Biden-1 first-degree murder commutation.
  "Marvin Charles Gabrion, II, aka Marvin Charles Gabrion": "marvin-gabrion",

  "Euphemia Lavonte Duncan, aka Euphemia Duncan-Stringer": "euphemia-duncan",

  "Arthur Martin Gilreath, aka Arthur Martin Gilbreath": "arthur-gilreath",

  "Cedric DeWayne Stephens,\u00A0aka Cedric Dwayne Stephens": "cedric-stephens",

  "Tietti Onette Chandler, aka Tietti Chandler-Shelton": "tietti-chandler",

  "William C. Robertson, Sr., aka William C. Robertson":
    "william-c-robertson-sr",
};
