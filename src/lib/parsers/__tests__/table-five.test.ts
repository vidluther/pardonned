import { describe, it, expect } from "vitest";
import { parseTableFive } from "../table-five";

describe("parseTableFive", () => {
  it("parses a normal 5-column pardon row with warrant link", () => {
    const html = `
      <html><body>
        <h2>December 22, 2020</h2>
        <table>
          <tr><th>NAME</th><th>DISTRICT</th><th>SENTENCED</th><th>OFFENSE</th><th>PUBLIC DISCLOSURE</th></tr>
          <tr>
            <td>Jane Doe</td><td>E.D. Cal.</td><td>24 months</td><td>Fraud</td>
            <td><a href="/pardon/file/123/dl">Download PDF Clemency Warrant</a></td>
          </tr>
        </table>
      </body></html>
    `;
    const grants = parseTableFive(html, "pardon", "https://example/");
    expect(grants).toHaveLength(1);
    expect(grants[0].recipient_name).toBe("Jane Doe");
    expect(grants[0].warrant_url).toContain("/pardon/file/123/dl");
  });

  it("skips header rows that use <td> instead of <th>", () => {
    const html = `
      <html><body>
        <h2>December 22, 2020</h2>
        <table>
          <tr><td>NAME</td><td>DISTRICT</td><td>SENTENCED</td><td>OFFENSE</td><td>PUBLIC DISCLOSURE</td></tr>
          <tr><td>Jane Doe</td><td>E.D. Cal.</td><td>24 months</td><td>Fraud</td><td></td></tr>
        </table>
      </body></html>
    `;
    const grants = parseTableFive(html, "pardon", "https://example/");
    expect(grants).toHaveLength(1);
    expect(grants[0].recipient_name).toBe("Jane Doe");
  });
});
