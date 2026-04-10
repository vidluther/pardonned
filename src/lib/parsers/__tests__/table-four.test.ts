import { describe, it, expect } from "vitest";
import { parseTableFour } from "../table-four";

describe("parseTableFour", () => {
  it("parses a normal 4-column pardon row", () => {
    const html = `
      <html><body>
        <h2>January 16, 2016</h2>
        <table>
          <tr><th>NAME</th><th>DISTRICT</th><th>SENTENCED</th><th>OFFENSE</th></tr>
          <tr><td>Jane Doe</td><td>E.D. Cal.</td><td>24 months</td><td>Fraud</td></tr>
        </table>
      </body></html>
    `;
    const grants = parseTableFour(html, "pardon", "https://example/");
    expect(grants).toHaveLength(1);
    expect(grants[0].recipient_name).toBe("Jane Doe");
  });

  it("skips header rows that use <td> instead of <th>", () => {
    // Obama-era DOJ HTML sometimes uses <td> for headers in later tables
    // on the same page. The :has(th) filter misses these; a content-based
    // check against the sentinel "NAME" value must catch them.
    const html = `
      <html><body>
        <h2>January 16, 2016</h2>
        <table>
          <tr><th>NAME</th><th>DISTRICT</th><th>SENTENCED</th><th>OFFENSE</th></tr>
          <tr><td>Jane Doe</td><td>E.D. Cal.</td><td>24 months</td><td>Fraud</td></tr>
        </table>
        <h2>March 1, 2013</h2>
        <table>
          <tr><td>NAME</td><td>DISTRICT</td><td>SENTENCED</td><td>OFFENSE</td></tr>
          <tr><td>John Smith</td><td>W.D. Tex.</td><td>12 months</td><td>Theft</td></tr>
        </table>
      </body></html>
    `;
    const grants = parseTableFour(html, "pardon", "https://example/");
    expect(grants).toHaveLength(2);
    expect(grants.map((g) => g.recipient_name)).toEqual(["Jane Doe", "John Smith"]);
    expect(grants.map((g) => g.recipient_name)).not.toContain("NAME");
  });

  it("skips header rows regardless of case", () => {
    const html = `
      <html><body>
        <h2>January 16, 2016</h2>
        <table>
          <tr><td>name</td><td>district</td><td>sentenced</td><td>offense</td></tr>
          <tr><td>Jane Doe</td><td>E.D. Cal.</td><td>24 months</td><td>Fraud</td></tr>
        </table>
      </body></html>
    `;
    const grants = parseTableFour(html, "pardon", "https://example/");
    expect(grants).toHaveLength(1);
    expect(grants[0].recipient_name).toBe("Jane Doe");
  });
});
