import { describe, expect, it } from "vitest";
import {
  HEADLINE_ACTION_THRESHOLD,
  findHeadlineAction,
} from "../pardon-stats";
import type { PardonDetail } from "../../loaders/pardon-details";

function makeEntry(overrides: Partial<PardonDetail> = {}) {
  return {
    id: overrides.id ?? "1",
    data: {
      id: "1",
      slug: "x",
      administration_slug: "trump-2",
      grant_date: "2025-03-28",
      clemency_type: "pardon" as const,
      offense: "Test",
      offense_category: "fraud",
      district: null,
      warrant_url: null,
      source_url: null,
      recipient_name: "Test",
      sentence_in_months: null,
      fine: null,
      restitution: null,
      original_sentence: null,
      president_name: "Test President",
      term_number: 1,
      term_start_date: "2025-01-20",
      term_end_date: null,
      ...overrides,
    } as PardonDetail,
  };
}

describe("findHeadlineAction", () => {
  it("returns null when no single (date, category) cluster reaches the threshold", () => {
    const entries = Array.from({ length: 30 }, (_, i) =>
      makeEntry({
        slug: `r-${i}`,
        grant_date: "2024-01-01",
        offense_category: "fraud",
        clemency_type: "pardon",
      }),
    );
    expect(findHeadlineAction(entries)).toBeNull();
  });

  it("surfaces a cluster of exactly the threshold size", () => {
    const entries = Array.from({ length: HEADLINE_ACTION_THRESHOLD }, (_, i) =>
      makeEntry({
        slug: `r-${i}`,
        grant_date: "2017-01-19",
        offense_category: "drug offense",
        clemency_type: "commutation",
      }),
    );
    const result = findHeadlineAction(entries);
    expect(result).not.toBeNull();
    expect(result?.count).toBe(HEADLINE_ACTION_THRESHOLD);
    expect(result?.date).toBe("2017-01-19");
    expect(result?.category).toBe("drug offense");
    expect(result?.clemencyType).toBe("commutation");
  });

  it("picks the largest cluster when multiple exceed the threshold", () => {
    const entries = [
      ...Array.from({ length: 60 }, (_, i) =>
        makeEntry({
          slug: `a-${i}`,
          grant_date: "2024-12-01",
          offense_category: "fraud",
          clemency_type: "pardon",
        }),
      ),
      ...Array.from({ length: 100 }, (_, i) =>
        makeEntry({
          slug: `b-${i}`,
          grant_date: "2017-01-19",
          offense_category: "drug offense",
          clemency_type: "commutation",
        }),
      ),
    ];
    const result = findHeadlineAction(entries);
    expect(result?.count).toBe(100);
    expect(result?.category).toBe("drug offense");
    expect(result?.date).toBe("2017-01-19");
  });

  it("clusters are keyed on (date, category) — same date, different categories don't merge", () => {
    const entries = [
      ...Array.from({ length: 40 }, (_, i) =>
        makeEntry({
          slug: `a-${i}`,
          grant_date: "2024-12-01",
          offense_category: "fraud",
        }),
      ),
      ...Array.from({ length: 40 }, (_, i) =>
        makeEntry({
          slug: `b-${i}`,
          grant_date: "2024-12-01",
          offense_category: "drug offense",
        }),
      ),
    ];
    // Neither cluster individually hits the threshold; combined date count is 80
    // but findHeadlineAction does not merge across categories.
    expect(findHeadlineAction(entries)).toBeNull();
  });

  it("derives clemencyType from the majority within the cluster", () => {
    const entries = [
      ...Array.from({ length: 5 }, (_, i) =>
        makeEntry({
          slug: `p-${i}`,
          grant_date: "2024-12-01",
          offense_category: "fraud",
          clemency_type: "pardon",
        }),
      ),
      ...Array.from({ length: 60 }, (_, i) =>
        makeEntry({
          slug: `c-${i}`,
          grant_date: "2024-12-01",
          offense_category: "fraud",
          clemency_type: "commutation",
        }),
      ),
    ];
    const result = findHeadlineAction(entries);
    expect(result?.count).toBe(65);
    expect(result?.clemencyType).toBe("commutation");
  });

  it("handles empty input", () => {
    expect(findHeadlineAction([])).toBeNull();
  });

  it("works with future AI-derived categories (e.g. 'january 6')", () => {
    // Validates the data-driven design: when J6 records land later, this
    // function will surface them automatically with no code change.
    const entries = Array.from({ length: 1500 }, (_, i) =>
      makeEntry({
        slug: `j6-${i}`,
        grant_date: "2025-01-20",
        offense_category: "january 6",
        clemency_type: "pardon",
      }),
    );
    const result = findHeadlineAction(entries);
    expect(result?.count).toBe(1500);
    expect(result?.category).toBe("january 6");
    expect(result?.date).toBe("2025-01-20");
  });
});
