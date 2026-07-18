import { describe, expect, it } from "vitest";
import {
  cleanClause,
  displayClause,
  normalizeSpaces,
  OFFENSE_SENTINELS,
  proseClause,
  realClause,
  scopeClause,
} from "../pardon-clause";

// Real scope legalese from the data (abbreviated): the three phrasings DOJ
// warrants use — "For any offenses…", "For any nonviolent offenses…" (Biden
// family), "For those offenses…" (Hunter Biden's original_sentence).
const FAUCI_SCOPE =
  "For any offenses against the United States which he may have committed or taken part in during the period from January 1, 2014, through the date of this pardon arising from or in any manner related to his service as Director of the National Institute of Allergy and Infectious Diseases, as a member of the White House Coronavirus Task Force or the White House COVID-19 Response Team, or as Chief Medical Advisor to the President.";
const BIDEN_FAMILY_SCOPE =
  "For any nonviolent offenses against the United States which they may have committed or taken part in during the period from January 1, 2014, through the date of this pardon.";
const HUNTER_SCOPE =
  "For those offenses against the United States which he has committed or may have committed or taken part in during the period from January 1, 2014 through December 1, 2024.";
// Tina Peters: DOJ wraps the text in curly quotes and drops the "against the
// United States" clause entirely — the variant that motivated anchoring the
// regex on the shared skeleton instead of any one phrasing.
const TINA_SCOPE_QUOTED =
  "“For those offenses she has or may have committed or taken part in related to election integrity and security during the period from January 1, 2020 through December 31, 2021”";
const TINA_SCOPE_UNQUOTED =
  "For those offenses she has or may have committed or taken part in related to election integrity and security during the period from January 1, 2020 through December 31, 2021";
// Milley: a long parenthetical between "offenses" and "committed".
const MILLEY_SCOPE =
  "For any offenses against the United States, including but not limited to any offenses under the United States Code or the Uniform Code of Military Justice, which he may have committed or taken part in during the period from January 1, 2014, through the date of this pardon.";

const REAL_OFFENSE =
  "Conspiracy to manufacture and distribute 500 grams or more of methamphetamine mixture following a felony drug conviction";
const OFFENSE_GARBAGE = "Download PDF Clemency Warrant";

describe("normalizeSpaces", () => {
  it("replaces NBSPs with regular spaces", () => {
    expect(normalizeSpaces("Robin\u00A0Marie\u00A0Davis")).toBe("Robin Marie Davis");
  });
});

describe("displayClause", () => {
  it("returns null for empty and missing values", () => {
    expect(displayClause(null)).toBeNull();
    expect(displayClause(undefined)).toBeNull();
    expect(displayClause("")).toBeNull();
    expect(displayClause("   ")).toBeNull();
  });

  it('treats "N/A" as a sentinel in every field', () => {
    expect(displayClause("N/A")).toBeNull();
  });

  it("drops field-specific sentinels only when passed", () => {
    expect(displayClause(OFFENSE_GARBAGE, OFFENSE_SENTINELS)).toBeNull();
    expect(displayClause(OFFENSE_GARBAGE)).toBe(OFFENSE_GARBAGE);
  });

  it("normalizes NBSPs and trims, keeping punctuation", () => {
    expect(displayClause("  Northern District of Iowa. ")).toBe("Northern District of Iowa.");
  });

  it("keeps scope legalese — it is informative on listing surfaces", () => {
    expect(displayClause(FAUCI_SCOPE)).toBe(FAUCI_SCOPE);
  });

  it("strips wrapping curly quotes (Tina Peters)", () => {
    expect(displayClause(TINA_SCOPE_QUOTED)).toBe(TINA_SCOPE_UNQUOTED);
  });
});

describe("cleanClause", () => {
  it("strips one trailing period for sentence composition", () => {
    expect(cleanClause("Northern District of Iowa.")).toBe("Northern District of Iowa");
  });

  it("still nulls sentinels", () => {
    expect(cleanClause("N/A")).toBeNull();
  });
});

describe("realClause", () => {
  it("rejects every scope-legalese phrasing in the data", () => {
    expect(realClause(FAUCI_SCOPE)).toBeNull();
    expect(realClause(BIDEN_FAMILY_SCOPE)).toBeNull();
    expect(realClause(HUNTER_SCOPE)).toBeNull();
    expect(realClause(TINA_SCOPE_QUOTED)).toBeNull();
    expect(realClause(MILLEY_SCOPE)).toBeNull();
  });

  it("rejects sentinels", () => {
    expect(realClause("N/A")).toBeNull();
    expect(realClause(OFFENSE_GARBAGE, OFFENSE_SENTINELS)).toBeNull();
  });

  it("passes real conviction content through, period-stripped", () => {
    expect(realClause(REAL_OFFENSE)).toBe(REAL_OFFENSE);
    expect(realClause(`${REAL_OFFENSE}.`)).toBe(REAL_OFFENSE);
  });
});

describe("proseClause", () => {
  it("keeps punctuation on real content", () => {
    expect(proseClause(`${REAL_OFFENSE}.`)).toBe(`${REAL_OFFENSE}.`);
  });

  it("has identical nullity to realClause across all input shapes", () => {
    const inputs = [
      null,
      undefined,
      "",
      "N/A",
      OFFENSE_GARBAGE,
      FAUCI_SCOPE,
      BIDEN_FAMILY_SCOPE,
      HUNTER_SCOPE,
      TINA_SCOPE_QUOTED,
      MILLEY_SCOPE,
      REAL_OFFENSE,
      `${REAL_OFFENSE}.`,
    ];
    for (const input of inputs) {
      expect(proseClause(input, OFFENSE_SENTINELS) === null).toBe(
        realClause(input, OFFENSE_SENTINELS) === null,
      );
    }
  });
});

describe("scopeClause", () => {
  it("returns the legalese itself, display-quality", () => {
    expect(scopeClause(FAUCI_SCOPE)).toBe(FAUCI_SCOPE);
    expect(scopeClause(BIDEN_FAMILY_SCOPE)).toBe(BIDEN_FAMILY_SCOPE);
    expect(scopeClause(HUNTER_SCOPE)).toBe(HUNTER_SCOPE);
    expect(scopeClause(MILLEY_SCOPE)).toBe(MILLEY_SCOPE);
  });

  it("unwraps quoted legalese for display (Tina Peters)", () => {
    expect(scopeClause(TINA_SCOPE_QUOTED)).toBe(TINA_SCOPE_UNQUOTED);
  });

  it("returns null for real offenses and sentinels", () => {
    expect(scopeClause(REAL_OFFENSE)).toBeNull();
    expect(scopeClause("N/A")).toBeNull();
    expect(scopeClause(null)).toBeNull();
  });
});
