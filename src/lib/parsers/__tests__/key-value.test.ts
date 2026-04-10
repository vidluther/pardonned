import { describe, it, expect } from "vitest";
import { parseKeyValue } from "../key-value";

describe("parseKeyValue", () => {
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
