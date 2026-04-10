import { describe, it, expect } from "vitest";
import { assignSlugs, type AssignerRow } from "../slug-assigner";

function row(
  id: number,
  name: string,
  grant_date = "2020-01-01",
  clemency_type: "pardon" | "commutation" = "pardon",
): AssignerRow {
  return { id, recipient_name: name, grant_date, clemency_type };
}

describe("assignSlugs", () => {
  describe("no collisions", () => {
    it("assigns the base slug to a single row", () => {
      const result = assignSlugs([row(1, "Jane Smith")]);
      expect(result.get(1)).toBe("jane-smith");
    });

    it("assigns distinct base slugs to rows with distinct names", () => {
      const result = assignSlugs([row(1, "Jane Smith"), row(2, "John Doe")]);
      expect(result.get(1)).toBe("jane-smith");
      expect(result.get(2)).toBe("john-doe");
    });
  });

  describe("first-wins collision: two rows, same name, different dates", () => {
    it("first id keeps the base slug; second gets -date suffix", () => {
      const rows = [
        row(1, "Alice Marie Johnson", "2018-06-06", "commutation"),
        row(2, "Alice Marie Johnson", "2020-08-28", "pardon"),
      ];
      const result = assignSlugs(rows);
      expect(result.get(1)).toBe("alice-marie-johnson");
      expect(result.get(2)).toBe("alice-marie-johnson-2020-08-28");
    });

    it("first-wins is determined by id, not input order", () => {
      // Deliberately reverse-order the input
      const rows = [
        row(2, "Alice Marie Johnson", "2020-08-28", "pardon"),
        row(1, "Alice Marie Johnson", "2018-06-06", "commutation"),
      ];
      const result = assignSlugs(rows);
      expect(result.get(1)).toBe("alice-marie-johnson");
      expect(result.get(2)).toBe("alice-marie-johnson-2020-08-28");
    });
  });

  describe("escalation: same name AND same date", () => {
    it("escalates to -date-type when -date collides (Hammonds case)", () => {
      // Same person, same day, pardon + commutation
      const rows = [
        row(1, "Dwight Lincoln Hammond", "2018-07-10", "pardon"),
        row(2, "Dwight Lincoln Hammond", "2018-07-10", "commutation"),
      ];
      const result = assignSlugs(rows);
      expect(result.get(1)).toBe("dwight-lincoln-hammond");
      expect(result.get(2)).toBe("dwight-lincoln-hammond-2018-07-10-commutation");
    });
  });

  describe("fallback: everything collides", () => {
    it("uses -id suffix as the final fallback", () => {
      // Three rows with identical name + date + type: unreachable IRL
      // but the algorithm must still produce unique slugs.
      const rows = [
        row(1, "Jane Doe", "2020-01-01", "pardon"),
        row(2, "Jane Doe", "2020-01-01", "pardon"),
        row(3, "Jane Doe", "2020-01-01", "pardon"),
      ];
      const result = assignSlugs(rows);
      expect(result.get(1)).toBe("jane-doe");
      // Row 2's base collides, -date collides (2020-01-01), -date-type
      // collides (jane-doe-2020-01-01-pardon), so it falls through to -id.
      expect(result.get(2)).toBe("jane-doe-2");
      expect(result.get(3)).toBe("jane-doe-3");
    });
  });

  describe("respects slugify() overrides for the base slug", () => {
    it("applies the Jan 6 Committee override as the base for a unique row", () => {
      const jan6Name =
        "The Members of Congress who served on the Select Committee to Investigate the January 6th Attack on the United States Capitol (\u201CSelect Committee\u201D); the staff of the Select Committee, as provided by House Resolution 503 (117th Congress); and the police officers from the D.C. Metropolitan Police Department or the U.S. Capitol Police who testified before the Select Committee";
      const result = assignSlugs([row(1, jan6Name, "2025-01-19", "pardon")]);
      expect(result.get(1)).toBe("january-6th-committee");
    });
  });

  describe("determinism", () => {
    it("produces identical output for identical input", () => {
      const rows = [
        row(1, "Alice", "2020-01-01", "pardon"),
        row(2, "Alice", "2021-01-01", "pardon"),
        row(3, "Bob", "2020-01-01", "pardon"),
      ];
      const byId = (m: Map<number, string>) =>
        [...m.entries()].sort(([x], [y]) => x - y);
      expect(byId(assignSlugs(rows))).toEqual(byId(assignSlugs(rows)));
    });
  });

  describe("every row gets a unique slug", () => {
    it("post-condition: result size equals input size, all values distinct", () => {
      const rows = [
        row(1, "Alice", "2020-01-01", "pardon"),
        row(2, "Alice", "2020-01-01", "commutation"),
        row(3, "Alice", "2021-01-01", "pardon"),
        row(4, "Bob"),
        row(5, "Carol"),
      ];
      const result = assignSlugs(rows);
      expect(result.size).toBe(rows.length);
      const slugs = [...result.values()];
      expect(new Set(slugs).size).toBe(slugs.length);
    });
  });
});
