import { describe, it, expect } from "vitest";
import { parseKeyValue } from "../key-value";

describe("parseKeyValue", () => {
  it("handles a mixed-format page with both key-value and four-column tables", () => {
    // Regression test for Obama pardons page: the first tables are key-value
    // format but later tables (2010–2015 sections) use the 4-column layout.
    // Without the fix, the 4-column tables were silently dropped.
    const html = `
      <html><body>
        <h2>January 17, 2017</h2>
        <table>
          <tr><td></td><td>Jane Doe</td></tr>
          <tr><td>Offense:</td><td>Mail fraud</td></tr>
          <tr><td>Sentence:</td><td>24 months</td></tr>
        </table>
        <h2>December 20, 2010</h2>
        <table>
          <tr><th>NAME</th><th>DISTRICT</th><th>SENTENCED</th><th>OFFENSE</th></tr>
          <tr><td>John Smith</td><td>S.D. Ohio</td><td>12 months</td><td>Tax evasion</td></tr>
          <tr><td>Alice Jones</td><td>N.D. Cal.</td><td>36 months</td><td>Bank fraud</td></tr>
        </table>
      </body></html>
    `;
    const grants = parseKeyValue(html, "pardon", "https://example/");
    // Should get 3 grants: 1 from key-value + 2 from four-column table
    expect(grants).toHaveLength(3);

    const kv = grants.find((g) => g.recipient_name === "Jane Doe");
    expect(kv).toBeDefined();
    expect(kv!.grant_date).toBe("2017-01-17");
    expect(kv!.offense).toBe("Mail fraud");

    const four1 = grants.find((g) => g.recipient_name === "John Smith");
    expect(four1).toBeDefined();
    expect(four1!.grant_date).toBe("2010-12-20");
    expect(four1!.district).toBe("S.D. Ohio");
    expect(four1!.sentence).toBe("12 months");
    expect(four1!.offense).toBe("Tax evasion");

    const four2 = grants.find((g) => g.recipient_name === "Alice Jones");
    expect(four2).toBeDefined();
    expect(four2!.grant_date).toBe("2010-12-20");
    expect(four2!.district).toBe("N.D. Cal.");
  });
  it("skips column-header TH rows (NAME/DISTRICT/SENTENCED/OFFENSE)", () => {
    // Regression test for the Obama DOJ pages where some sub-tables use
    // <th> cells for column headers, not person names. Without the
    // defensive skip, these produce garbage pardon records with
    // recipient_name values of "NAME", "DISTRICT", "SENTENCED", "OFFENSE".
    const html = `
      <html><body>
        <h2>January 16, 2016</h2>
        <table>
          <tr><th>NAME</th><th>DISTRICT</th><th>SENTENCED</th><th>OFFENSE</th></tr>
          <tr><th>Jane Doe</th></tr>
          <tr><td></td><td>Jane Doe</td></tr>
          <tr><td>Offense:</td><td>Mail fraud</td></tr>
          <tr><td>Sentence:</td><td>24 months</td></tr>
        </table>
      </body></html>
    `;
    const grants = parseKeyValue(html, "pardon", "https://example/");
    const names = grants.map((g) => g.recipient_name);
    expect(names).not.toContain("NAME");
    expect(names).not.toContain("DISTRICT");
    expect(names).not.toContain("SENTENCED");
    expect(names).not.toContain("OFFENSE");
  });

  it("still treats a <th> cell with a real person name as a person row", () => {
    // The Obama older format legitimately uses <th> for person names. The
    // fix must not break this path — only the sentinel column-header names
    // should be skipped.
    const html = `
      <html><body>
        <h2>November 21, 2011</h2>
        <table>
          <tr><th>John Smith</th></tr>
          <tr><td>Offense:</td><td>Drug possession</td></tr>
          <tr><td>Sentence:</td><td>12 months</td></tr>
        </table>
      </body></html>
    `;
    const grants = parseKeyValue(html, "pardon", "https://example/");
    expect(grants.map((g) => g.recipient_name)).toContain("John Smith");
  });
});
