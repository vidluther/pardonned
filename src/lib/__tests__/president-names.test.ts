import { describe, it, expect } from "vitest";
import {
  formatAdministrationDisplayName,
  getAdministrationIndex,
} from "../president-names";

describe("formatAdministrationDisplayName", () => {
  it("returns just the name for a single-term president", () => {
    expect(
      formatAdministrationDisplayName({
        presidentName: "Joe Biden",
        termNumber: 1,
        isOnlyTerm: true,
      }),
    ).toBe("Joe Biden");
  });

  it("adds First Term suffix for term 1 of a multi-term president", () => {
    expect(
      formatAdministrationDisplayName({
        presidentName: "Donald Trump",
        termNumber: 1,
        isOnlyTerm: false,
      }),
    ).toBe("Donald Trump (First Term)");
  });

  it("adds Second Term suffix for term 2", () => {
    expect(
      formatAdministrationDisplayName({
        presidentName: "Barack Obama",
        termNumber: 2,
        isOnlyTerm: false,
      }),
    ).toBe("Barack Obama (Second Term)");
  });

  it("handles Third and Fourth Term labels", () => {
    expect(
      formatAdministrationDisplayName({
        presidentName: "Example President",
        termNumber: 3,
        isOnlyTerm: false,
      }),
    ).toBe("Example President (Third Term)");
    expect(
      formatAdministrationDisplayName({
        presidentName: "Example President",
        termNumber: 4,
        isOnlyTerm: false,
      }),
    ).toBe("Example President (Fourth Term)");
  });

  it("falls back to numeric label for unexpected term numbers", () => {
    expect(
      formatAdministrationDisplayName({
        presidentName: "Example President",
        termNumber: 5,
        isOnlyTerm: false,
      }),
    ).toBe("Example President (Term 5)");
  });

  it("prefers single-term format even when the term number is not 1", () => {
    // Defensive: if a caller passes isOnlyTerm=true with termNumber > 1
    // (e.g., a president whose first term is missing from the dataset),
    // the "only term" signal wins and we render just the name.
    expect(
      formatAdministrationDisplayName({
        presidentName: "Example President",
        termNumber: 2,
        isOnlyTerm: true,
      }),
    ).toBe("Example President");
  });
});

describe("getAdministrationIndex", () => {
  const fixture = [
    {
      data: {
        administration_slug: "biden-1",
        president_name: "Joe Biden",
        term_number: 1,
        term_start_date: "2021-01-20",
      },
    },
    {
      data: {
        administration_slug: "biden-1",
        president_name: "Joe Biden",
        term_number: 1,
        term_start_date: "2021-01-20",
      },
    },
    {
      data: {
        administration_slug: "trump-1",
        president_name: "Donald Trump",
        term_number: 1,
        term_start_date: "2017-01-20",
      },
    },
    {
      data: {
        administration_slug: "trump-2",
        president_name: "Donald Trump",
        term_number: 2,
        term_start_date: "2025-01-20",
      },
    },
    {
      data: {
        administration_slug: "trump-2",
        president_name: "Donald Trump",
        term_number: 2,
        term_start_date: "2025-01-20",
      },
    },
    {
      data: {
        administration_slug: "trump-2",
        president_name: "Donald Trump",
        term_number: 2,
        term_start_date: "2025-01-20",
      },
    },
  ];

  it("builds one entry per unique administration slug", () => {
    const index = getAdministrationIndex(fixture);
    expect(index.size).toBe(3);
    expect(index.has("biden-1")).toBe(true);
    expect(index.has("trump-1")).toBe(true);
    expect(index.has("trump-2")).toBe(true);
  });

  it("counts pardons per slug", () => {
    const index = getAdministrationIndex(fixture);
    expect(index.get("biden-1")!.count).toBe(2);
    expect(index.get("trump-1")!.count).toBe(1);
    expect(index.get("trump-2")!.count).toBe(3);
  });

  it("renders a single-term president without a term suffix", () => {
    const index = getAdministrationIndex(fixture);
    expect(index.get("biden-1")!.displayName).toBe("Joe Biden");
  });

  it("renders multi-term presidents with an ordinal suffix", () => {
    const index = getAdministrationIndex(fixture);
    expect(index.get("trump-1")!.displayName).toBe("Donald Trump (First Term)");
    expect(index.get("trump-2")!.displayName).toBe(
      "Donald Trump (Second Term)",
    );
  });

  it("carries the raw president name and term number through unchanged", () => {
    const index = getAdministrationIndex(fixture);
    const trump2 = index.get("trump-2")!;
    expect(trump2.presidentName).toBe("Donald Trump");
    expect(trump2.termNumber).toBe(2);
    expect(trump2.slug).toBe("trump-2");
  });

  it("carries termStartDate from the first matching entry", () => {
    const index = getAdministrationIndex(fixture);
    expect(index.get("biden-1")!.termStartDate).toBe("2021-01-20");
    expect(index.get("trump-1")!.termStartDate).toBe("2017-01-20");
    expect(index.get("trump-2")!.termStartDate).toBe("2025-01-20");
  });

  it("returns an empty map for an empty collection", () => {
    const index = getAdministrationIndex([]);
    expect(index.size).toBe(0);
  });
});
