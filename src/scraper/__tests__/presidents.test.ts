import { describe, it, expect } from "vitest";
import { PRESIDENT_SOURCES, TERM_BOUNDARIES } from "../presidents.js";

describe("PRESIDENT_SOURCES", () => {
  it("includes Clinton with both terms", () => {
    const clinton = PRESIDENT_SOURCES.find((s) =>
      s.slugs.includes("clinton-1"),
    );
    expect(clinton).toBeDefined();
    expect(clinton!.slugs).toEqual(["clinton-1", "clinton-2"]);
    expect(clinton!.pardons).toMatch(/clinton/i);
    expect(clinton!.commutations).toMatch(/clinton/i);
  });

  it("has a Clinton term-boundary entry", () => {
    expect(TERM_BOUNDARIES["William J. Clinton"]).toBe("1997-01-20");
  });
});
