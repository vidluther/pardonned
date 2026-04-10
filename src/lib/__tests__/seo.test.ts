import { describe, it, expect } from "vitest";
import { truncateText } from "../seo";

describe("truncateText", () => {
  it("returns short text unchanged", () => {
    expect(truncateText("Hello world", 60)).toBe("Hello world");
  });

  it("returns text exactly at limit unchanged", () => {
    const text = "a".repeat(60);
    expect(truncateText(text, 60)).toBe(text);
  });

  it("truncates long text at last word boundary and adds ellipsis", () => {
    const text = "Pardon granted to Michelle Breazeale Horton on January 17 2017 with additional details here";
    const result = truncateText(text, 60);
    expect(result.length).toBeLessThanOrEqual(60);
    expect(result).toMatch(/…$/);
    expect(result).not.toMatch(/\s…$/);
  });

  it("handles text with no word boundary before limit", () => {
    const text = "Superlongwordwithnospacesatallinthisentirestring";
    const result = truncateText(text, 20);
    expect(result.length).toBeLessThanOrEqual(20);
    expect(result).toMatch(/…$/);
  });

  it("preserves trailing period when text fits", () => {
    const text = "Pardon granted to John Doe on January 19, 2025.";
    expect(truncateText(text, 160)).toBe(text);
  });

  it("does not double-punctuate when truncated near a period", () => {
    const result = truncateText("Some sentence. Another sentence that is long.", 20);
    expect(result).not.toMatch(/\.…$/);
  });
});
