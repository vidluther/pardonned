import { describe, expect, it } from "vitest";
import { formatCompactMoney, formatGrantDateLong, formatGrantDateShort } from "../format";

describe("formatCompactMoney", () => {
  it("formats billions with two-decimal precision and trims trailing zeros", () => {
    expect(formatCompactMoney(1_470_000_000)).toBe("$1.47B");
    expect(formatCompactMoney(2_000_000_000)).toBe("$2B");
    expect(formatCompactMoney(1_350_000_000)).toBe("$1.35B");
  });

  it("formats millions with one-decimal precision and trims trailing .0", () => {
    expect(formatCompactMoney(92_400_000)).toBe("$92.4M");
    expect(formatCompactMoney(4_400_000)).toBe("$4.4M");
    expect(formatCompactMoney(50_000_000)).toBe("$50M");
  });

  it("formats thousands rounded to integer K", () => {
    expect(formatCompactMoney(508_000)).toBe("$508K");
    expect(formatCompactMoney(20_000)).toBe("$20K");
  });

  it("falls through to locale-string for sub-thousand values", () => {
    expect(formatCompactMoney(742)).toBe("$742");
    expect(formatCompactMoney(1)).toBe("$1");
  });

  it("renders $0 for zero, null, and undefined", () => {
    expect(formatCompactMoney(0)).toBe("$0");
    expect(formatCompactMoney(null)).toBe("$0");
    expect(formatCompactMoney(undefined)).toBe("$0");
  });
});

describe("formatGrantDateLong", () => {
  it("formats ISO dates with full month and four-digit year", () => {
    expect(formatGrantDateLong("2017-01-19")).toBe("January 19, 2017");
    expect(formatGrantDateLong("2025-12-23")).toBe("December 23, 2025");
  });
});

describe("formatGrantDateShort", () => {
  it("formats ISO dates with abbreviated month", () => {
    expect(formatGrantDateShort("2017-01-19")).toBe("Jan 19, 2017");
    expect(formatGrantDateShort("2025-12-23")).toBe("Dec 23, 2025");
  });
});
