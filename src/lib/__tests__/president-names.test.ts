import { describe, it, expect } from "vitest";
import { formatAdministrationDisplayName } from "../president-names";

describe("formatAdministrationDisplayName", () => {
  it("returns just the name for a single-term president", () => {
    expect(formatAdministrationDisplayName("Joe Biden", 1, true)).toBe(
      "Joe Biden",
    );
  });

  it("adds First Term suffix for term 1 of a multi-term president", () => {
    expect(formatAdministrationDisplayName("Donald Trump", 1, false)).toBe(
      "Donald Trump (First Term)",
    );
  });

  it("adds Second Term suffix for term 2", () => {
    expect(formatAdministrationDisplayName("Barack Obama", 2, false)).toBe(
      "Barack Obama (Second Term)",
    );
  });

  it("handles Third and Fourth Term labels", () => {
    expect(formatAdministrationDisplayName("Example President", 3, false)).toBe(
      "Example President (Third Term)",
    );
    expect(formatAdministrationDisplayName("Example President", 4, false)).toBe(
      "Example President (Fourth Term)",
    );
  });

  it("falls back to numeric label for unexpected term numbers", () => {
    expect(formatAdministrationDisplayName("Example President", 5, false)).toBe(
      "Example President (Term 5)",
    );
  });

  it("prefers single-term format even when the term number is not 1", () => {
    // Defensive: if a caller passes isOnlyTerm=true with term_number > 1
    // (e.g., a president whose first term is missing from the dataset),
    // the "only term" signal wins and we render just the name.
    expect(formatAdministrationDisplayName("Example President", 2, true)).toBe(
      "Example President",
    );
  });
});
