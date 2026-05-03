import { describe, expect, it } from "vitest";
import {
  formatCompactMoney,
  formatCurrencyPrecise,
  formatGrantDateLong,
  formatGrantDateShort,
  formatSentenceCompact,
  formatSentenceMonths,
} from "../format";

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

describe("formatSentenceMonths", () => {
  it("renders sub-year sentences with the months unit, singular when needed", () => {
    expect(formatSentenceMonths(3)).toBe("3 months");
    expect(formatSentenceMonths(1)).toBe("1 month");
    expect(formatSentenceMonths(11)).toBe("11 months");
  });

  it("renders whole years without a remainder", () => {
    expect(formatSentenceMonths(12)).toBe("1 year");
    expect(formatSentenceMonths(24)).toBe("2 years");
    expect(formatSentenceMonths(120)).toBe("10 years");
  });

  it("renders mixed years + months", () => {
    expect(formatSentenceMonths(15)).toBe("1 year, 3 months");
    expect(formatSentenceMonths(30)).toBe("2 years, 6 months");
    expect(formatSentenceMonths(13)).toBe("1 year, 1 month");
  });

  it("returns em-dash for null and undefined", () => {
    expect(formatSentenceMonths(null)).toBe("—");
    expect(formatSentenceMonths(undefined)).toBe("—");
  });
});

describe("formatSentenceCompact", () => {
  it("uses compact mo/yr forms for tight display", () => {
    expect(formatSentenceCompact(3)).toBe("3mo");
    expect(formatSentenceCompact(48)).toBe("4yr");
    expect(formatSentenceCompact(126)).toBe("10yr 6mo");
  });

  it("returns em-dash for null", () => {
    expect(formatSentenceCompact(null)).toBe("—");
  });
});

describe("formatCurrencyPrecise", () => {
  it("formats integer-USD amounts with thousands separators", () => {
    expect(formatCurrencyPrecise(680_000_000)).toBe("$680,000,000");
    expect(formatCurrencyPrecise(1_000)).toBe("$1,000");
  });

  it("returns em-dash for null but preserves $0 for zero (absence vs. zero is meaningful at row level)", () => {
    expect(formatCurrencyPrecise(null)).toBe("—");
    expect(formatCurrencyPrecise(undefined)).toBe("—");
    expect(formatCurrencyPrecise(0)).toBe("$0");
  });
});
