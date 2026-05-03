import { describe, expect, it } from "vitest";
import { buildAtomFeed, type AtomEntry } from "../atom-feed";

const baseOptions = {
  siteUrl: "https://pardonned.com",
  feedTitle: "Pardonned — Recent Clemency Grants",
  feedSubtitle: "A test feed",
  authorName: "Pardonned",
};

function makeEntry(overrides: Partial<AtomEntry["data"]> = {}): AtomEntry {
  return {
    id: overrides.id ?? "1",
    data: {
      id: "1",
      slug: "test-recipient",
      administration_slug: "trump-2",
      grant_date: "2025-03-28",
      clemency_type: "pardon",
      offense: "Securities fraud",
      offense_category: "fraud",
      district: "S.D.N.Y.",
      warrant_url: null,
      source_url: null,
      recipient_name: "Test Recipient",
      sentence_in_months: null,
      fine: null,
      restitution: null,
      original_sentence: null,
      president_name: "Donald J. Trump",
      term_number: 2,
      term_start_date: "2025-01-20",
      term_end_date: null,
      ...overrides,
    },
  };
}

describe("buildAtomFeed", () => {
  it("produces a well-formed Atom feed with root element and required headers", () => {
    const xml = buildAtomFeed([makeEntry()], baseOptions);
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="utf-8"\?>/);
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain("</feed>");
    expect(xml).toContain("<id>https://pardonned.com/recent.xml</id>");
    expect(xml).toContain("<title>Pardonned — Recent Clemency Grants</title>");
    expect(xml).toContain('<link rel="self" type="application/atom+xml" href="https://pardonned.com/recent.xml"/>');
    expect(xml).toContain('<link rel="alternate" type="text/html" href="https://pardonned.com/recent"/>');
  });

  it("sorts entries by grant_date desc and applies the default limit of 50", () => {
    const entries = Array.from({ length: 60 }, (_, i) => {
      const month = String((i % 12) + 1).padStart(2, "0");
      const day = String((i % 28) + 1).padStart(2, "0");
      return makeEntry({
        slug: `recipient-${i}`,
        recipient_name: `Recipient ${i}`,
        grant_date: `2024-${month}-${day}`,
      });
    });
    const xml = buildAtomFeed(entries, baseOptions);
    const matches = xml.match(/<entry>/g);
    expect(matches?.length).toBe(50);
  });

  it("respects a custom limit", () => {
    const entries = Array.from({ length: 10 }, (_, i) =>
      makeEntry({ slug: `r-${i}`, grant_date: `2024-01-${String(i + 1).padStart(2, "0")}` }),
    );
    const xml = buildAtomFeed(entries, { ...baseOptions, limit: 3 });
    expect((xml.match(/<entry>/g) ?? []).length).toBe(3);
  });

  it("orders entries newest-first", () => {
    const entries = [
      makeEntry({ slug: "older", grant_date: "2024-01-15", recipient_name: "Older" }),
      makeEntry({ slug: "newest", grant_date: "2025-12-31", recipient_name: "Newest" }),
      makeEntry({ slug: "middle", grant_date: "2025-06-01", recipient_name: "Middle" }),
    ];
    const xml = buildAtomFeed(entries, baseOptions);
    const newestPos = xml.indexOf("Newest");
    const middlePos = xml.indexOf("Middle");
    const olderPos = xml.indexOf("Older");
    expect(newestPos).toBeGreaterThan(0);
    expect(newestPos).toBeLessThan(middlePos);
    expect(middlePos).toBeLessThan(olderPos);
  });

  it("includes RFC 3339 timestamps for published and updated", () => {
    const xml = buildAtomFeed([makeEntry({ grant_date: "2025-03-28" })], baseOptions);
    expect(xml).toContain("<published>2025-03-28T12:00:00Z</published>");
    expect(xml).toContain("<updated>2025-03-28T12:00:00Z</updated>");
  });

  it("uses the most recent grant_date as the feed's <updated>", () => {
    const entries = [
      makeEntry({ slug: "a", grant_date: "2024-01-01" }),
      makeEntry({ slug: "b", grant_date: "2025-06-15" }),
      makeEntry({ slug: "c", grant_date: "2024-12-01" }),
    ];
    const xml = buildAtomFeed(entries, baseOptions);
    // The first <updated> in the feed (after the channel-level metadata) should be the feed-level one
    const feedUpdatedMatch = xml.match(/<updated>(.*?)<\/updated>/);
    expect(feedUpdatedMatch?.[1]).toBe("2025-06-15T12:00:00Z");
  });

  it("links each entry to its detail page using the slug", () => {
    const xml = buildAtomFeed([makeEntry({ slug: "paul-manafort" })], baseOptions);
    expect(xml).toContain('<link rel="alternate" type="text/html" href="https://pardonned.com/pardon/details/paul-manafort"/>');
  });

  it("uses a stable tag: URI for entry id", () => {
    const xml = buildAtomFeed([makeEntry({ slug: "paul-manafort", grant_date: "2020-12-23" })], baseOptions);
    expect(xml).toContain("<id>tag:pardonned.com,2020-12-23:pardon-paul-manafort</id>");
  });

  it("titles entries with recipient name + clemency-type label", () => {
    const xml = buildAtomFeed(
      [
        makeEntry({ recipient_name: "Paul J. Manafort", clemency_type: "pardon" }),
        makeEntry({ slug: "rita", recipient_name: "Rita Crundwell", clemency_type: "commutation" }),
      ],
      baseOptions,
    );
    expect(xml).toContain("<title>Paul J. Manafort — Pardon</title>");
    expect(xml).toContain("<title>Rita Crundwell — Commutation</title>");
  });

  it("escapes XML special characters in recipient_name, offense, and slug", () => {
    const xml = buildAtomFeed(
      [
        makeEntry({
          slug: "test-slug",
          recipient_name: 'Smith & Jones <"the partners">',
          offense: "Bank fraud & wire fraud",
        }),
      ],
      baseOptions,
    );
    expect(xml).toContain("Smith &amp; Jones &lt;&quot;the partners&quot;&gt;");
    expect(xml).toContain("Bank fraud &amp; wire fraud");
    // Ensure no unescaped & or < survived in the entry payload
    expect(xml).not.toMatch(/Smith & Jones/);
  });

  it("uses the (First Term) / (Second Term) suffix for multi-term presidents", () => {
    const entries = [
      makeEntry({
        slug: "trump-2-grant",
        president_name: "Donald J. Trump",
        term_number: 2,
        recipient_name: "Person A",
      }),
      makeEntry({
        slug: "trump-1-grant",
        president_name: "Donald J. Trump",
        term_number: 1,
        recipient_name: "Person B",
      }),
      makeEntry({
        slug: "biden-grant",
        president_name: "Joseph R. Biden",
        term_number: 1,
        recipient_name: "Person C",
      }),
    ];
    const xml = buildAtomFeed(entries, baseOptions);
    expect(xml).toContain("Donald J. Trump (Second Term)");
    expect(xml).toContain("Donald J. Trump (First Term)");
    // Single-term president has no suffix
    expect(xml).toContain("<author><name>Joseph R. Biden</name></author>");
  });

  it("renders an empty but well-formed feed when there are no entries", () => {
    const xml = buildAtomFeed([], baseOptions);
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect(xml).toContain("</feed>");
    expect((xml.match(/<entry>/g) ?? []).length).toBe(0);
    // Feed-level <updated> should still be present (falls back to "now" rather than blank)
    expect(xml).toMatch(/<updated>[\d\-T:.Z]+<\/updated>/);
  });

  it("includes a summary with clemency type, recipient, administration, and offense", () => {
    const xml = buildAtomFeed(
      [
        makeEntry({
          recipient_name: "Test Person",
          clemency_type: "commutation",
          offense: "Drug conspiracy",
          grant_date: "2024-12-01",
          president_name: "Joseph R. Biden",
          term_number: 1,
        }),
      ],
      baseOptions,
    );
    expect(xml).toContain(
      "Commutation granted to Test Person by Joseph R. Biden on 2024-12-01. Offense: Drug conspiracy.",
    );
  });

  it("uses the configured siteUrl for self-link, alternate-link, and feed id", () => {
    const xml = buildAtomFeed([makeEntry()], { ...baseOptions, siteUrl: "https://staging.pardonned.com" });
    expect(xml).toContain("<id>https://staging.pardonned.com/recent.xml</id>");
    expect(xml).toContain('href="https://staging.pardonned.com/recent.xml"');
    expect(xml).toContain('href="https://staging.pardonned.com/recent"');
  });

  it("accepts a separate termContextEntries set so display-name suffixes resolve correctly when rendering a scoped subset", () => {
    // Render only Trump-2 entries, but include both Trump terms in the
    // context so the helper still recognizes Trump as multi-term.
    const trump2Only = [
      makeEntry({
        slug: "person-a",
        recipient_name: "Person A",
        president_name: "Donald J. Trump",
        term_number: 2,
      }),
    ];
    const fullContext = [
      ...trump2Only,
      makeEntry({
        slug: "person-b",
        recipient_name: "Person B",
        president_name: "Donald J. Trump",
        term_number: 1,
      }),
    ];

    const xmlWithoutContext = buildAtomFeed(trump2Only, baseOptions);
    expect(xmlWithoutContext).toContain("<author><name>Donald J. Trump</name></author>");

    const xmlWithContext = buildAtomFeed(trump2Only, {
      ...baseOptions,
      termContextEntries: fullContext,
    });
    expect(xmlWithContext).toContain("<author><name>Donald J. Trump (Second Term)</name></author>");
    // Only Trump-2's entry actually appears in the feed despite the full context
    expect((xmlWithContext.match(/<entry>/g) ?? []).length).toBe(1);
    expect(xmlWithContext).toContain("Person A");
    expect(xmlWithContext).not.toContain("Person B");
  });
});
