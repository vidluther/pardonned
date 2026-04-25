import { describe, it, expect } from "vitest";
import { parseDate } from "../parse-date";

describe("parseDate", () => {
  it("parses title-case month names", () => {
    expect(parseDate("January 17, 2017")).toBe("2017-01-17");
    expect(parseDate("December 25, 2020")).toBe("2020-12-25");
  });

  it("parses uppercase month names (Obama commutations format)", () => {
    expect(parseDate("JUNE 3, 2016")).toBe("2016-06-03");
    expect(parseDate("MAY 5, 2016")).toBe("2016-05-05");
    expect(parseDate("MARCH 30, 2016")).toBe("2016-03-30");
    expect(parseDate("DECEMBER 18, 2015")).toBe("2015-12-18");
  });

  it("parses mixed-case month names", () => {
    expect(parseDate("June 3, 2016")).toBe("2016-06-03");
    expect(parseDate("july 4, 1776")).toBe("1776-07-04");
  });

  it("handles leading whitespace (e.g. &nbsp; in DOJ HTML)", () => {
    expect(parseDate("  NOVEMBER 21, 2011")).toBe("2011-11-21");
  });

  it("pads single-digit days with zero", () => {
    expect(parseDate("March 5, 2013")).toBe("2013-03-05");
    expect(parseDate("March 15, 2013")).toBe("2013-03-15");
  });

  it("returns null for non-date text", () => {
    expect(parseDate("")).toBeNull();
    expect(parseDate("some random text")).toBeNull();
    expect(parseDate("12345")).toBeNull();
  });

  it("returns null for invalid month names", () => {
    expect(parseDate("Monday 3, 2016")).toBeNull();
    expect(parseDate("Jantuary 17, 2017")).toBeNull();
  });
});
