import { describe, it, expect } from "vitest";
import { slugify, MAX_SLUG_LENGTH } from "../slugify";

describe("slugify", () => {
  describe("normal names (computed path)", () => {
    it("lowercases and hyphenates a simple name", () => {
      expect(slugify("John Doe")).toBe("john-doe");
    });

    it("handles multi-word names", () => {
      expect(slugify("Jane Mary Smith")).toBe("jane-mary-smith");
    });

    it("strips punctuation except underscores and hyphens", () => {
      expect(slugify("O'Brien, Jr.")).toBe("obrien-jr");
    });

    it("collapses runs of hyphens", () => {
      expect(slugify("A -- B")).toBe("a-b");
    });

    it("leaves an already-short slug exactly at the length limit unchanged", () => {
      const atLimit = "a".repeat(MAX_SLUG_LENGTH);
      expect(slugify(atLimit)).toBe(atLimit);
    });
  });

  describe("manual overrides", () => {
    it("resolves the January 6 Select Committee to january-6th-committee", () => {
      const jan6Name =
        "The Members of Congress who served on the Select Committee to Investigate the January 6th Attack on the United States Capitol (\u201CSelect Committee\u201D); the staff of the Select Committee, as provided by House Resolution 503 (117th Congress); and the police officers from the D.C. Metropolitan Police Department or the U.S. Capitol Police who testified before the Select Committee";
      expect(slugify(jan6Name)).toBe("january-6th-committee");
    });

    it("resolves the Biden family group pardon to biden-family", () => {
      expect(
        slugify(
          "Francis W. Biden\u00A0\u00A0James B. Biden\u00A0Sara Jones Biden\u00A0John T. Owens\u00A0Valerie Biden Owens",
        ),
      ).toBe("biden-family");
    });

    it("resolves I. Lewis Libby (with smart quotes) to scooter-libby", () => {
      expect(
        slugify(
          "I. Lewis Libby, aka Scooter Libby, aka Irve Lewis \u201CScooter\u201D Libby",
        ),
      ).toBe("scooter-libby");
    });

    it("resolves Alejandro Enrique Ramirez Umaña (with ñ) to alejandro-ramirez-umana", () => {
      expect(
        slugify(
          "Alejandro Enrique Ramirez Uma\u00F1a, aka Alejandro Enrique Umana",
        ),
      ).toBe("alejandro-ramirez-umana");
    });
  });

  describe("fallback length cap", () => {
    it("truncates unknown long names and appends a sha1 hash suffix", () => {
      const longName = "a".repeat(MAX_SLUG_LENGTH + 40);
      const result = slugify(longName);
      expect(result.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
      expect(result).toMatch(/-[0-9a-f]{8}$/);
    });

    it("produces different slugs for two long names that share a prefix", () => {
      const name1 = "a".repeat(MAX_SLUG_LENGTH + 20) + "x";
      const name2 = "a".repeat(MAX_SLUG_LENGTH + 20) + "y";
      const slug1 = slugify(name1);
      const slug2 = slugify(name2);
      expect(slug1).not.toBe(slug2);
      expect(slug1.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
      expect(slug2.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
      expect(slug1).toMatch(/-[0-9a-f]{8}$/);
      expect(slug2).toMatch(/-[0-9a-f]{8}$/);
    });

    it("the fallback slug for the same input is deterministic", () => {
      const longName =
        "some very very very very very very very very very very long name";
      expect(slugify(longName)).toBe(slugify(longName));
    });
  });

  describe("empty or fully-stripped input", () => {
    it("throws when the input is empty", () => {
      expect(() => slugify("")).toThrow(/empty slug/);
    });

    it("throws when the input is only whitespace", () => {
      expect(() => slugify("   ")).toThrow(/empty slug/);
    });

    it("throws when every character would be stripped by normalization", () => {
      expect(() => slugify("???")).toThrow(/empty slug/);
    });
  });
});
