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

  it("emits Article JSON-LD with headline, image, author, and about-Person", () => {
    const { jsonLd } = buildDetailSeo({
      ...leblanc,
      recipient_name: "Robin Marie Davis",
      slug: "robin-marie-davis",
    });
    const parsed = JSON.parse(jsonLd);
    expect(parsed["@context"]).toBe("https://schema.org");
    expect(parsed["@type"]).toBe("Article");
    expect(parsed.headline).toBe("Robin Marie Davis — Pardon by Donald Trump (2017)");
    expect(parsed.about).toEqual({ "@type": "Person", name: "Robin Marie Davis" });
    expect(parsed.image).toBe("https://pardonned.com/og/robin-marie-davis.png");
    expect(parsed.author).toEqual({
      "@type": "Organization",
      name: "Pardonned",
      url: "https://pardonned.com",
    });
    expect(parsed.publisher).toEqual({
      "@type": "Organization",
      name: "Pardonned",
      url: "https://pardonned.com",
    });
    expect(parsed.mainEntityOfPage).toBe("https://pardonned.com/pardon/details/robin-marie-davis/");
  });

  it("omits datePublished — grant date is not the page publication date (ADR-0004)", () => {
    const { jsonLd } = buildDetailSeo(leblanc);
    expect(JSON.parse(jsonLd)).not.toHaveProperty("datePublished");
  });
});

describe("buildDetailSeo — dirty data guards", () => {
  // Preemptive pardon: the recipient was never convicted (Fauci, Milley, etc.).
  const fauci = {
    slug: "anthony-s-fauci",
    recipient_name: "Anthony S. Fauci",
    clemency_type: "pardon",
    grant_date: "2025-01-19",
    president_name: "Joseph R. Biden",
    offense:
      "For any offenses against the United States which he may have committed or " +
      "may have taken part in during the period from January 1, 2014 through the date of this pardon",
    district: "N/A",
    original_sentence: null,
  };

  it("never claims conviction for a preemptive pardon (and drops N/A original sentence)", () => {
    // The real Fauci record also has original_sentence "N/A".
    const { metaDescription } = buildDetailSeo({ ...fauci, original_sentence: "N/A" });
    expect(metaDescription).toBe(
      "Pardon granted to Anthony S. Fauci by Joe Biden on January 19, 2025.",
    );
    expect(metaDescription).not.toContain("Convicted of");
    expect(metaDescription).not.toContain("N/A");
  });

  it("treats an 'N/A' original sentence as missing", () => {
    const { metaDescription } = buildDetailSeo({ ...leblanc, original_sentence: "N/A" });
    expect(metaDescription).not.toContain("Original sentence");
    expect(metaDescription).not.toContain("N/A");
  });

  it("treats scraper sentinel offense/district/sentence as missing (Hunter Biden record)", () => {
    // The real record: junk offense, N/A district, and pardon-scope legalese
    // in original_sentence — none is a real conviction/sentence.
    const { metaDescription } = buildDetailSeo({
      slug: "robert-hunter-biden",
      recipient_name: "Robert Hunter Biden",
      clemency_type: "pardon",
      grant_date: "2024-12-01",
      president_name: "Joseph R. Biden",
      offense: "Download PDF Clemency Warrant",
      district: "N/A",
      original_sentence:
        "For those offenses against the United States which he has committed or " +
        "may have committed or taken part in during the period from January 1, 2014",
    });
    expect(metaDescription).toBe(
      "Pardon granted to Robert Hunter Biden by Joe Biden on December 1, 2024.",
    );
    expect(metaDescription).not.toContain("Download PDF");
    expect(metaDescription).not.toContain("N/A");
    expect(metaDescription).not.toContain("Original sentence");
    expect(metaDescription).not.toContain("offenses against");
  });

  it("drops the 'For any nonviolent offenses' pardon-scope variant", () => {
    const { metaDescription } = buildDetailSeo({
      ...leblanc,
      offense: "For any nonviolent offenses against the United States committed before this date",
      district: null,
      original_sentence: null,
    });
    expect(metaDescription).not.toContain("Convicted of");
    expect(metaDescription).not.toContain("offenses against");
  });

  it("strips trailing periods from abbreviated districts (no double period)", () => {
    const { metaDescription } = buildDetailSeo({
      ...leblanc,
      recipient_name: "Stephen James Jackson",
      offense: "altering the odometer of a motor vehicle",
      district: "E. D. La.",
      original_sentence: null,
    });
    expect(metaDescription).toBe(
      "Pardon granted to Stephen James Jackson by Donald Trump on May 19, 2017. " +
        "Convicted of altering the odometer of a motor vehicle in the E. D. La.",
    );
    expect(metaDescription).not.toContain("..");
  });

  it("strips a trailing period from the offense too", () => {
    const { metaDescription } = buildDetailSeo({
      ...leblanc,
      offense: "Distribution of cocaine base.",
      district: null,
      original_sentence: null,
    });
    expect(metaDescription).toContain("Convicted of Distribution of cocaine base.");
    expect(metaDescription).not.toContain("base..");
  });
});

describe("buildDetailSeo — restitution clause", () => {
  it("surfaces abandoned restitution early, before the conviction clause", () => {
    const { metaDescription } = buildDetailSeo({
      ...leblanc,
      recipient_name: "Devon Archer",
      offense: "conspiracy to commit securities fraud",
      district: null,
      original_sentence: null,
      restitution: 43427436,
    });
    expect(metaDescription).toBe(
      "Pardon granted to Devon Archer by Donald Trump on May 19, 2017. " +
        "$43.4M in restitution abandoned. Convicted of conspiracy to commit securities fraud.",
    );
    expect(metaDescription.indexOf("restitution")).toBeLessThan(
      metaDescription.indexOf("Convicted"),
    );
  });

  it("omits the restitution clause when restitution is zero or null", () => {
    expect(buildDetailSeo({ ...leblanc, restitution: 0 }).metaDescription).not.toContain(
      "restitution",
    );
    expect(buildDetailSeo({ ...leblanc, restitution: null }).metaDescription).not.toContain(
      "restitution",
    );
  });
});

describe("buildDetailSeo — recipient entity typing", () => {
  it("types corporate recipients as Organization in about", () => {
    const { jsonLd } = buildDetailSeo({
      slug: "hdr-global-trading-limited",
      recipient_name: "HDR Global Trading Limited",
      clemency_type: "pardon",
      grant_date: "2025-03-27",
      president_name: "Donald J. Trump",
      offense: "violating the Bank Secrecy Act",
      district: null,
      original_sentence: null,
    });
    expect(JSON.parse(jsonLd).about).toEqual({
      "@type": "Organization",
      name: "HDR Global Trading Limited",
    });
  });

  it("also types comma-suffixed corporations (Ozy Media, Inc.) as Organization", () => {
    const { jsonLd } = buildDetailSeo({
      ...leblanc,
      slug: "ozy-media-inc",
      recipient_name: "Ozy Media, Inc.",
    });
    expect(JSON.parse(jsonLd).about?.["@type"]).toBe("Organization");
  });

  it("omits about for a group clemency described in prose (Jan 6 Committee)", () => {
    const groupName =
      "The Members of Congress who served on the Select Committee to Investigate the " +
      "January 6th Attack on the United States Capitol; the staff of the Select Committee, " +
      "as provided by House Resolution 503 (117th Congress); and the police officers from " +
      "the D.C. Metropolitan Police Department or the U.S. Capitol Police";
    const { title, jsonLd } = buildDetailSeo({
      ...leblanc,
      slug: "january-6th-committee",
      recipient_name: groupName,
    });
    expect(title.length).toBeLessThanOrEqual(110);
    expect(JSON.parse(jsonLd)).not.toHaveProperty("about");
  });

  it("omits about for a multi-person group with no markers (biden-family)", () => {
    const { jsonLd } = buildDetailSeo({
      ...leblanc,
      slug: "biden-family",
      recipient_name:
        "Francis W. Biden  James B. Biden Sara Jones Biden John T. Owens Valerie Biden Owens",
    });
    expect(JSON.parse(jsonLd)).not.toHaveProperty("about");
  });

  it("keeps a single person with aka/fka aliases as a Person", () => {
    const { jsonLd } = buildDetailSeo({
      ...leblanc,
      recipient_name: "Theresa Renee Gardley, fka Theresa Renee Naper, fka Theresa Renee Thornton",
    });
    expect(JSON.parse(jsonLd).about?.["@type"]).toBe("Person");
  });
});

describe("buildDetailSeo — long names and injection safety", () => {
  it("caps the title at ~110 chars for very long recipient names", () => {
    const longName = "Individuals who did not commit crimes of violence and ".repeat(8);
    const { title } = buildDetailSeo({ ...leblanc, recipient_name: longName });
    expect(title.length).toBeLessThanOrEqual(110);
    expect(title).toContain("Pardon by Donald Trump (2017)");
  });

  it("escapes < so scraped text cannot break out of the JSON-LD script", () => {
    const { jsonLd } = buildDetailSeo({
      ...leblanc,
      offense: "fraud </script><script>alert(1)</script>",
    });
    expect(jsonLd).not.toContain("</script>");
    expect(jsonLd).toContain("\\u003c");
    expect(() => JSON.parse(jsonLd)).not.toThrow();
  });
});
