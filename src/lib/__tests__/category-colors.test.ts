import { describe, expect, it } from "vitest";
import {
  FALLBACK_CATEGORY_COLOR,
  getCategoryColor,
  hasExplicitCategoryColor,
} from "../category-colors";

describe("getCategoryColor", () => {
  it("returns the expected hex for each DB enum category", () => {
    expect(getCategoryColor("fraud")).toBe("#8A6B1E");
    expect(getCategoryColor("drug offense")).toBe("#3A6A4A");
    expect(getCategoryColor("firearms")).toBe("#C23B22");
    expect(getCategoryColor("FACE act")).toBe("#B8652A");
    expect(getCategoryColor("financial crime")).toBe("#2A6A7A");
    expect(getCategoryColor("violent crime")).toBe("#6A4B7A");
    expect(getCategoryColor("immigration")).toBe("#7A6A3A");
    expect(getCategoryColor("other")).toBe("#7A7870");
  });

  it("returns the fallback for unknown keys (e.g. future AI-derived categories)", () => {
    expect(getCategoryColor("january 6")).toBe(FALLBACK_CATEGORY_COLOR);
    expect(getCategoryColor("political corruption")).toBe(FALLBACK_CATEGORY_COLOR);
    expect(getCategoryColor("cryptocurrency")).toBe(FALLBACK_CATEGORY_COLOR);
    expect(getCategoryColor("")).toBe(FALLBACK_CATEGORY_COLOR);
    expect(getCategoryColor("not-a-real-category")).toBe(FALLBACK_CATEGORY_COLOR);
  });
});

describe("hasExplicitCategoryColor", () => {
  it("is true for DB enum values, false for unknowns", () => {
    expect(hasExplicitCategoryColor("fraud")).toBe(true);
    expect(hasExplicitCategoryColor("other")).toBe(true);
    expect(hasExplicitCategoryColor("january 6")).toBe(false);
    expect(hasExplicitCategoryColor("")).toBe(false);
  });
});
