import { describe, it, expect } from "vitest";
import { buildDetailSeo } from "../detail-seo";

// Inline fixtures shaped like collection entry `data` objects — no DB/loader
// access, per the convention in president-names.test.ts / slugify.test.ts.
const leblanc = {
  slug: "james-marcus-leblanc",
  recipient_name: "James Marcus LeBlanc",
  clemency_type: "pardon",
  grant_date: "2017-05-19",
  president_name: "Donald J. Trump",
  offense: "Possession of an unregistered firearm",
  district: "Western District of Louisiana",
  original_sentence: "24 months' imprisonment",
};

describe("buildDetailSeo — title", () => {
  it("states clemency type, short president name, and year for a pardon", () => {
    const { title } = buildDetailSeo(leblanc);
    expect(title).toBe("James Marcus LeBlanc — Pardon by Donald Trump (2017)");
  });

  it("labels commutations and uses nickname short forms (Joe Biden)", () => {
    const { title } = buildDetailSeo({
      ...leblanc,
      recipient_name: "Shannon Wayne Agofsky",
      clemency_type: "commutation",
      grant_date: "2025-01-17",
      president_name: "Joseph R. Biden",
    });
    expect(title).toBe("Shannon Wayne Agofsky — Commutation by Joe Biden (2025)");
  });

  it("shortens Bill Clinton but keeps George W. Bush's initial", () => {
    expect(
      buildDetailSeo({ ...leblanc, president_name: "William J. Clinton", grant_date: "2001-01-20" })
        .title,
    ).toBe("James Marcus LeBlanc — Pardon by Bill Clinton (2001)");
    expect(
      buildDetailSeo({ ...leblanc, president_name: "George W. Bush", grant_date: "2008-12-23" })
        .title,
    ).toBe("James Marcus LeBlanc — Pardon by George W. Bush (2008)");
  });

  it("normalizes non-breaking spaces in scraped names to regular spaces", () => {
    const { title } = buildDetailSeo({
      ...leblanc,
      recipient_name: "Robin\u00A0Marie\u00A0Davis",
    });
    expect(title).toBe("Robin Marie Davis — Pardon by Donald Trump (2017)");
  });
});

describe("buildDetailSeo — metaDescription", () => {
  it("assembles grant facts, offense, and district in sentence form", () => {
    const { metaDescription } = buildDetailSeo({
      ...leblanc,
      offense: "bank fraud",
      district: "Northern District of Texas",
      original_sentence: null,
    });
    expect(metaDescription).toBe(
      "Pardon granted to James Marcus LeBlanc by Donald Trump on May 19, 2017. " +
        "Convicted of bank fraud in the Northern District of Texas.",
    );
  });

  it("appends the original sentence when present", () => {
    const { metaDescription } = buildDetailSeo({
      ...leblanc,
      offense: "theft",
      district: "District of Idaho",
      original_sentence: "12 months",
    });
    expect(metaDescription).toBe(
      "Pardon granted to James Marcus LeBlanc by Donald Trump on May 19, 2017. " +
        "Convicted of theft in the District of Idaho. Original sentence: 12 months.",
    );
  });

  it("skips missing offense, district, and sentence without artifacts", () => {
    const { metaDescription } = buildDetailSeo({
      ...leblanc,
      offense: null,
      district: null,
      original_sentence: null,
    });
    expect(metaDescription).toBe(
      "Pardon granted to James Marcus LeBlanc by Donald Trump on May 19, 2017.",
    );
  });

  it("does not double the period when the original sentence already ends with one", () => {
    const { metaDescription } = buildDetailSeo({
      ...leblanc,
      offense: null,
      district: null,
      original_sentence: "12 months.",
    });
    expect(metaDescription).toBe(
      "Pardon granted to James Marcus LeBlanc by Donald Trump on May 19, 2017. " +
        "Original sentence: 12 months.",
    );
  });

  it("truncates long descriptions at a word boundary with an ellipsis", () => {
    const { metaDescription } = buildDetailSeo({
      ...leblanc,
      offense:
        "conspiracy to possess with intent to distribute methamphetamine, possession of a firearm " +
        "in furtherance of a drug trafficking crime, and money laundering conspiracy",
    });
    expect(metaDescription.length).toBeLessThanOrEqual(155);
    expect(metaDescription.endsWith("…")).toBe(true);
    // Word boundary: no trailing space or cut-off punctuation before the ellipsis
    expect(metaDescription).toMatch(/\S…$/);
    expect(metaDescription.startsWith("Pardon granted to James Marcus LeBlanc")).toBe(true);
  });

  it("emits Article JSON-LD with headline, publish date, and about-Person", () => {
    const { jsonLd } = buildDetailSeo({
      ...leblanc,
      recipient_name: "Robin Marie Davis",
      slug: "robin-marie-davis",
    });
    const parsed = JSON.parse(jsonLd);
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("Article");
    expect(parsed.headline).toBe("Robin Marie Davis — Pardon by Donald Trump (2017)");
    expect(parsed.datePublished).toBe("2017-05-19");
    expect(parsed.about).toEqual({ "@type": "Person", name: "Robin Marie Davis" });
    expect(parsed.publisher).toEqual({
      "@type": "Organization",
      name: "Pardonned",
      url: "https://pardonned.com",
    });
    expect(parsed.mainEntityOfPage).toBe("https://pardonned.com/pardon/details/robin-marie-davis/");
  });

  it("handles corporate recipients without person-specific phrasing", () => {
    const { title, metaDescription } = buildDetailSeo({
      recipient_name: "HDR Global Trading Limited",
      clemency_type: "pardon",
      grant_date: "2025-03-27",
      president_name: "Donald J. Trump",
      offense: "violating the Bank Secrecy Act",
      district: null,
      original_sentence: null,
    });
    expect(title).toBe("HDR Global Trading Limited — Pardon by Donald Trump (2025)");
    expect(metaDescription).toBe(
      "Pardon granted to HDR Global Trading Limited by Donald Trump on March 27, 2025. " +
        "Convicted of violating the Bank Secrecy Act.",
    );
  });
});
