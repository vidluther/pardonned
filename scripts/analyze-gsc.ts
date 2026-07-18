/**
 * Analyze a Google Search Console "Performance on Search" CSV export against
 * the site's page inventory in data/pardonned.db.
 *
 * Usage:
 *   pnpm tsx scripts/analyze-gsc.ts [path-to-export-dir]
 *
 * Without an argument, picks the newest directory under gsc/. Writes the
 * report to gsc/analysis-<export-date>.md.
 *
 * Export the data from GSC: Performance → Export → Download CSV (produces a
 * folder with Pages.csv, Queries.csv, Chart.csv, Devices.csv, Countries.csv).
 * Pages.csv is capped at 1,000 rows and only lists pages with ≥1 impression.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import { administrations, pardons } from "../src/db/schema";

// ---------- Locate export ----------

const gscRoot = resolve(process.cwd(), "gsc");
const gscDirs = readdirSync(gscRoot)
  .map((name) => join(gscRoot, name))
  .filter((p) => statSync(p).isDirectory())
  .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);

const exportDir = process.argv[2]
  ? resolve(process.argv[2])
  : gscDirs.find((p) => /performance/i.test(p));

if (!exportDir) {
  console.error("No Performance export directory found under gsc/ — pass one as an argument.");
  process.exit(1);
}

// Optional: a GSC "Indexing → Pages" (Coverage) export gives true index counts.
const coverageDir = gscDirs.find((p) => /coverage/i.test(p));

const exportDate = exportDir.match(/(\d{4}-\d{2}-\d{2})\/?$/)?.[1] ?? "latest";
const reportPath = join(gscRoot, `analysis-${exportDate}.md`);

// ---------- CSV parsing ----------

function parseCsv(path: string): string[][] {
  const text = readFileSync(path, "utf8");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const pct = (s: string) => parseFloat(s.replace("%", "")) / 100;

interface Perf {
  key: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function loadPerf(file: string): Perf[] {
  const [, ...rows] = parseCsv(join(exportDir, file));
  return rows.map((r) => ({
    key: r[0],
    clicks: Number(r[1]),
    impressions: Number(r[2]),
    ctr: pct(r[3]),
    position: parseFloat(r[4]),
  }));
}

const pages = loadPerf("Pages.csv");
const queries = loadPerf("Queries.csv");
const chart = loadPerf("Chart.csv"); // key = date
const devices = loadPerf("Devices.csv");

// ---------- Page inventory from the DB ----------

const dbPath = resolve(process.cwd(), "data/pardonned.db");
const client = createClient({ url: "file:" + dbPath });
const db = drizzle(client);

const rows = await db
  .select({
    slug: pardons.slug,
    recipient_name: pardons.recipient_name,
    admin_slug: administrations.slug,
    president_name: administrations.president_name,
  })
  .from(pardons)
  .innerJoin(administrations, eq(pardons.administration, administrations.id))
  .all();
client.close();

interface PardonRow {
  slug: string | null;
  recipient_name: string;
  admin_slug: string;
  president_name: string;
}
const records = rows.filter((r): r is PardonRow & { slug: string } => r.slug !== null);
const bySlug = new Map(records.map((p) => [p.slug, p]));
const adminCount = new Set(records.map((p) => p.admin_slug)).size;

// ---------- Route classification ----------

type Route =
  | { type: "detail"; slug: string; record?: PardonRow }
  | { type: "president"; slug: string }
  | { type: "home" | "search" | "static" | "unknown"; path: string };

function classify(url: string): Route {
  const u = new URL(url);
  const path = u.pathname.replace(/\/+$/, "/") || "/";
  let m: RegExpMatchArray | null;
  if ((m = path.match(/^\/pardon\/details\/([^/]+)\/?$/))) {
    const slug = decodeURIComponent(m[1]);
    return { type: "detail", slug, record: bySlug.get(slug) };
  }
  if ((m = path.match(/^\/president\/([^/]+)\/?$/))) return { type: "president", slug: m[1] };
  if (path === "/") return { type: "home", path };
  if (path.startsWith("/search")) return { type: "search", path: path + u.search };
  if (/^\/(about|recent|all-presidents)(\.xml)?\/?$/.test(path)) return { type: "static", path };
  return { type: "unknown", path: u.pathname + u.search };
}

const classified = pages.map((p) => ({ ...p, route: classify(p.key) }));

// ---------- Name matching ----------

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOP = new Set([
  "pardon",
  "pardons",
  "pardoned",
  "pardonned",
  "commutation",
  "commutations",
  "commuted",
  "clemency",
  "who",
  "is",
  "was",
  "did",
  "does",
  "why",
  "what",
  "when",
  "where",
  "how",
  "the",
  "of",
  "a",
  "an",
  "by",
  "for",
  "to",
  "get",
  "got",
  "list",
  "granted",
  "grant",
  "president",
  "presidential",
  "trump",
  "biden",
  "obama",
  "bush",
  "clinton",
  "case",
  "sentence",
  "sentenced",
  "sentencing",
  "crime",
  "release",
  "released",
  "com",
  "court",
  "jail",
  "prison",
  "arrested",
  "arrest",
  "conviction",
  "convicted",
  "felony",
  "federal",
  "district",
  "western",
  "eastern",
  "northern",
  "southern",
  "restitution",
  "news",
  "recent",
  "amount",
  "or",
  "and",
  "aka",
  "vs",
  "versus",
  "doj",
  "warrant",
  "second",
  "term",
  "first",
  "latest",
  "full",
  "today",
  "update",
  "updated",
  "issued",
  "january",
  "february",
  "march",
  "april",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
]);

const nameTokens = records.map((p) => ({ p, tokens: new Set(norm(p.recipient_name).split(" ")) }));

const queryTokens = (query: string) =>
  norm(query)
    .split(" ")
    .filter((t) => t && !STOP.has(t) && !/\d/.test(t));

function matchRecords(query: string): PardonRow[] {
  const qTokens = queryTokens(query);
  if (qTokens.length < 2) return [];
  const out: PardonRow[] = [];
  for (const { p, tokens } of nameTokens) {
    let ok = true;
    for (const qt of qTokens) {
      let hit = tokens.has(qt);
      if (!hit && qt.length >= 3) {
        for (const nt of tokens) {
          if (nt.startsWith(qt)) {
            hit = true;
            break;
          }
        }
      }
      if (!hit) {
        ok = false;
        break;
      }
    }
    if (ok) out.push(p);
  }
  return out;
}

// Best near-miss candidate for unmatched queries: record matching ≥2 query tokens.
function nearMiss(query: string): PardonRow | undefined {
  const qTokens = queryTokens(query);
  let best: PardonRow | undefined;
  let bestHits = 1;
  for (const { p, tokens } of nameTokens) {
    let hits = 0;
    for (const qt of qTokens) if (tokens.has(qt)) hits++;
    if (hits > bestHits) {
      bestHits = hits;
      best = p;
    }
  }
  return best;
}

const isBrand = (q: string) => /pardonned/.test(q.toLowerCase());

interface QueryMatch extends Perf {
  records: PardonRow[];
  brand: boolean;
  personShaped: boolean;
}
const qMatched: QueryMatch[] = queries.map((q) => {
  const matched = matchRecords(q.key);
  const qTokens = queryTokens(q.key);
  const personShaped = qTokens.length >= 2 && qTokens.every((t) => /^[a-z]+$/.test(t));
  return { ...q, records: matched, brand: isBrand(q.key), personShaped };
});

// ---------- Aggregations ----------

function agg(perfRows: Perf[]) {
  const clicks = perfRows.reduce((s, r) => s + r.clicks, 0);
  const imps = perfRows.reduce((s, r) => s + r.impressions, 0);
  const wpos = imps ? perfRows.reduce((s, r) => s + r.position * r.impressions, 0) / imps : 0;
  return { clicks, imps, ctr: imps ? clicks / imps : 0, pos: wpos };
}

const routeTypes = ["detail", "president", "home", "search", "static", "unknown"] as const;
const byRoute = routeTypes.map((t) => {
  const routeRows = classified.filter((c) => c.route.type === t);
  return { t, ...agg(routeRows), n: routeRows.length };
});

// By administration (detail pages only)
const adminAgg = new Map<string, Perf[]>();
for (const c of classified) {
  if (c.route.type === "detail" && c.route.record) {
    const k = `${c.route.record.president_name} (${c.route.record.admin_slug})`;
    if (!adminAgg.has(k)) adminAgg.set(k, []);
    adminAgg.get(k)!.push(c);
  }
}
const byAdmin = [...adminAgg.entries()]
  .map(([k, perfRows]) => ({ k, n: perfRows.length, ...agg(perfRows) }))
  .sort((a, b) => b.clicks - a.clicks);

// Coverage
const detailSlugsSeen = new Set(
  classified
    .filter((c) => c.route.type === "detail")
    .map((c) => (c.route as { slug: string }).slug),
);
const seenValid = [...detailSlugsSeen].filter((s) => bySlug.has(s));
const detailUrlsUnknown = classified.filter(
  (c) => c.route.type === "detail" && !("record" in c.route && c.route.record),
);
const unknownUrls = classified.filter((c) => c.route.type === "unknown");

const covByAdmin = new Map<string, { total: number; seen: number }>();
for (const p of records) {
  const k = `${p.president_name} (${p.admin_slug})`;
  if (!covByAdmin.has(k)) covByAdmin.set(k, { total: 0, seen: 0 });
  const e = covByAdmin.get(k)!;
  e.total++;
  if (detailSlugsSeen.has(p.slug)) e.seen++;
}

// CTR benchmark by position bin (aggregate clicks/impressions per bin)
const bins = [
  { label: "1–3", lo: 1, hi: 3 },
  { label: "3–5", lo: 3, hi: 5 },
  { label: "5–10", lo: 5, hi: 10 },
  { label: "10–20", lo: 10, hi: 20 },
  { label: "20+", lo: 20, hi: 999 },
];
const binStats = bins.map((b) => {
  const binRows = classified.filter((c) => c.position >= b.lo && c.position < b.hi);
  return { ...b, n: binRows.length, ...agg(binRows) };
});
const ctrProblems = classified
  .filter((c) => c.impressions >= 30)
  .map((c) => ({
    ...c,
    benchmark: binStats.find((b) => c.position >= b.lo && c.position < b.hi)!.ctr,
  }))
  .filter((c) => c.benchmark > 0 && c.ctr < 0.5 * c.benchmark)
  .sort((a, b) => b.impressions - a.impressions);

// Content gaps
const gapNoPage = qMatched
  .filter((q) => !q.brand && q.personShaped && q.records.length === 0)
  .sort((a, b) => b.impressions - a.impressions);
const gapPoorRank = qMatched
  .filter((q) => !q.brand && q.impressions >= 10 && q.position > 10)
  .sort((a, b) => b.impressions - a.impressions);
const gapPageNotSurfacing = qMatched
  .filter(
    (q) =>
      !q.brand && q.records.length > 0 && q.records.every((r) => !detailSlugsSeen.has(r.slug!)),
  )
  .sort((a, b) => b.impressions - a.impressions);

// Site-level/category queries ("trump pardons" etc.): no person match, not brand
const genericQueries = qMatched.filter(
  (q) =>
    !q.brand &&
    !q.personShaped &&
    q.records.length === 0 &&
    /pardon|commutation|clemency/.test(q.key),
);
const genericAgg = agg(genericQueries);

// True index coverage from the optional Coverage export.
// "Page with redirect" and "Alternate page with proper canonical tag" are
// benign (slash variants / duplicates); the "currently not indexed" buckets
// are real gaps.
interface Coverage {
  date: string;
  indexed: number;
  notIndexed: number;
  first: { date: string; indexed: number; notIndexed: number };
  peakIndexed: number;
  issues: { reason: string; pages: number; benign: boolean }[];
  realGap: number;
}
let coverage: Coverage | undefined;
if (coverageDir) {
  const chartRows = parseCsv(join(coverageDir, "Chart.csv"))
    .slice(1)
    .filter((r) => r[1] && r[2]);
  const first = chartRows[0];
  const last = chartRows[chartRows.length - 1];
  const peakIndexed = Math.max(...chartRows.map((r) => Number(r[2])));
  const issues = ["Critical issues.csv", "Non-critical issues.csv"]
    .flatMap((file) => parseCsv(join(coverageDir, file)).slice(1))
    .filter((r) => r.length >= 4)
    .map((r) => ({
      reason: r[0],
      pages: Number(r[3]),
      benign: /redirect|proper canonical/i.test(r[0]),
    }));
  coverage = {
    date: last[0],
    indexed: Number(last[2]),
    notIndexed: Number(last[1]),
    first: { date: first[0], indexed: Number(first[2]), notIndexed: Number(first[1]) },
    peakIndexed,
    issues,
    realGap: issues.filter((i) => !i.benign).reduce((s, i) => s + i.pages, 0),
  };
}

// Trailing-slash duplicates
const urlSet = new Set(pages.map((p) => p.key));
const noSlash = pages.filter((p) => !p.key.endsWith("/"));
const bothForms = noSlash.filter((p) => urlSet.has(p.key + "/"));

// Biggest zero-click page
const zeroClick = classified
  .filter((c) => c.clicks === 0)
  .sort((a, b) => b.impressions - a.impressions)[0];

// Trend by month
const byMonth = new Map<string, { clicks: number; imps: number }>();
for (const d of chart) {
  const m = d.key.slice(0, 7);
  if (!byMonth.has(m)) byMonth.set(m, { clicks: 0, imps: 0 });
  const e = byMonth.get(m)!;
  e.clicks += d.clicks;
  e.imps += d.impressions;
}

const totals = agg(chart);

// ---------- Sanity ----------
console.log(`export: ${exportDir}`);
console.log(
  `sanity: ${records.length} DB rows, ${pages.length} GSC pages, ${queries.length} queries`,
);
console.log(
  `sanity: detail URLs seen=${detailSlugsSeen.size}, valid=${seenValid.length}, stale-detail=${detailUrlsUnknown.length}, unknown-route=${unknownUrls.length}`,
);

// ---------- Report ----------

const f = (n: number) => n.toLocaleString("en-US");
const pc = (n: number, d = 1) => (n * 100).toFixed(d) + "%";
const po = (n: number) => n.toFixed(1);

function perfTable(
  perfRows: (Perf & { extra?: string })[],
  keyHeader: string,
  extraHeader?: string,
) {
  const head = extraHeader
    ? `| ${keyHeader} | Clicks | Impr. | CTR | Pos. | ${extraHeader} |\n|---|---|---|---|---|---|`
    : `| ${keyHeader} | Clicks | Impr. | CTR | Pos. |\n|---|---|---|---|---|`;
  const body = perfRows
    .map((r) => {
      const base = `| ${r.key} | ${f(r.clicks)} | ${f(r.impressions)} | ${pc(r.ctr)} | ${po(r.position)} |`;
      return extraHeader ? `${base} ${r.extra ?? ""} |` : base;
    })
    .join("\n");
  return head + "\n" + body;
}

const detailUrl = (slug: string) => `/pardon/details/${slug}/`;
const matchLinks = (q: QueryMatch) =>
  q.records.length
    ? q.records
        .map((r) => `[${r.slug}](${detailUrl(r.slug!)})`)
        .slice(0, 2)
        .join(", ")
    : "—";

const topByClicks = qMatched
  .filter((q) => !q.brand)
  .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions)
  .slice(0, 15)
  .map((q) => ({ ...q, extra: matchLinks(q) }));
const topByImps = qMatched
  .filter((q) => !q.brand)
  .sort((a, b) => b.impressions - a.impressions)
  .slice(0, 15)
  .map((q) => ({ ...q, extra: matchLinks(q) }));

const brandRows = qMatched.filter((q) => q.brand);
const brandAgg = agg(brandRows);
const visibleQueryClicks = qMatched.reduce((s, q) => s + q.clicks, 0);
const presidentRoute = byRoute.find((r) => r.t === "president")!;
const months = [...byMonth.entries()].sort();

const report = `# GSC Performance analysis — pardonned.com

**Export:** ${exportDir.replace(process.cwd() + "/", "")} (${chart[0].key} → ${chart[chart.length - 1].key}).
**Site inventory:** ${f(records.length)} pardon records in \`data/pardonned.db\` → ${f(bySlug.size)} unique detail URLs, plus ${adminCount} president pages and 5 static routes.

## TLDR

- **${f(totals.clicks)} clicks / ${f(totals.imps)} impressions** (avg CTR ${pc(totals.ctr)}, avg position ${po(totals.pos)}).
- Monthly trend: ${months.map(([m, e], i) => `${m}${i === 0 || i === months.length - 1 ? " (partial)" : ""}: ${f(e.clicks)} clicks / ${f(e.imps)} impr.`).join(" · ")}
- The ${f(queries.length)} visible queries account for only ${f(visibleQueryClicks)} clicks (${pc(visibleQueryClicks / totals.clicks)}) — Google hides most query strings for privacy, so query-level analysis sees a thin slice of actual traffic.
- Detail pages take ${pc(byRoute[0].clicks / totals.clicks)} of all clicks — the long-tail person pages are the product.
- Only **${f(seenValid.length)} of ${f(bySlug.size)} detail pages (${pc(seenValid.length / bySlug.size)})** got any impressions (see coverage caveats).
${coverage ? `- True index status (Coverage export, ${coverage.date}): **${f(coverage.indexed)} indexed**, only **${f(coverage.realGap)} genuinely un-indexed** — the impressions gap above is a demand/ranking gap, not an indexing gap.` : ""}
${zeroClick ? `- Biggest zero-click page: \`${zeroClick.key.replace("https://pardonned.com", "")}\` — ${f(zeroClick.impressions)} impressions at position ${po(zeroClick.position)}, no clicks.` : ""}
- President pages: ${f(presidentRoute.imps)} impressions → ${f(presidentRoute.clicks)} clicks (${pc(presidentRoute.ctr)}).
- Site-level/category queries (${f(genericQueries.length)} visible, e.g. "trump pardons"): ${f(genericAgg.imps)} impressions at avg position ${po(genericAgg.pos)} — ${genericAgg.pos > 20 ? "effectively invisible" : "in range"}.
- ${f(bothForms.length)} slugs indexed in both slash/non-slash URL forms (see Duplicate URL variants).
- Mobile CTR ${pc(devices.find((d) => d.key === "Mobile")?.ctr ?? 0)} vs desktop ${pc(devices.find((d) => d.key === "Desktop")?.ctr ?? 0)}.

## Traffic by route type

| Route | Pages in export | Clicks | Impr. | CTR | Avg pos. |
|---|---|---|---|---|---|
${byRoute.map((r) => `| ${r.t} | ${f(r.n)} | ${f(r.clicks)} | ${f(r.imps)} | ${pc(r.ctr)} | ${po(r.pos)} |`).join("\n")}

${unknownUrls.length ? `Unknown-route URLs Google still serves (stale or unexpected):\n${unknownUrls.map((u) => `- \`${(u.route as { path: string }).path}\` — ${u.clicks} clicks / ${u.impressions} impr.`).join("\n")}` : "No unknown-route URLs — every URL Google serves maps to a current route."}
${detailUrlsUnknown.length ? `\nDetail URLs with **no matching DB record** (stale slugs — likely renamed or removed):\n${detailUrlsUnknown.map((u) => `- \`${u.key}\` — ${u.clicks} clicks / ${u.impressions} impr.`).join("\n")}` : ""}

## Search interest by administration (detail pages)

| Administration | Pages w/ impr. | Clicks | Impr. | CTR | Avg pos. |
|---|---|---|---|---|---|
${byAdmin.map((a) => `| ${a.k} | ${f(a.n)} | ${f(a.clicks)} | ${f(a.imps)} | ${pc(a.ctr)} | ${po(a.pos)} |`).join("\n")}

## Top queries vs pages

Brand queries (containing “pardonned”): ${f(brandRows.length)} queries, ${f(brandAgg.clicks)} clicks / ${f(brandAgg.imps)} impressions. Excluded below.

### By clicks

${perfTable(topByClicks, "Query", "Matched page(s)")}

### By impressions

${perfTable(topByImps, "Query", "Matched page(s)")}

## Content gaps

### Person-shaped queries with no matching pardon record (${gapNoPage.length})

People searched *"<name> pardon"*-style queries but the name matcher found no DB record. Where a near-miss exists (record sharing ≥2 name tokens), it's shown — those are usually spelling/nickname variants (e.g. "shalom weiss" → \`sholam-weiss\`, "larry duran" → \`lawrence-s-duran\`), i.e. **findability gaps**, not missing content. Rows with no candidate are scraper misses or people never actually pardoned.

${
  gapNoPage.length
    ? perfTable(
        gapNoPage.slice(0, 20).map((q) => ({
          ...q,
          extra: (() => {
            const nm = nearMiss(q.key);
            return nm ? `[${nm.slug}](${detailUrl(nm.slug!)})?` : "—";
          })(),
        })),
        "Query",
        "Closest record",
      )
    : "None."
}

### Queries ranking poorly (impressions ≥ 10, position > 10) — title/content opportunities (${gapPoorRank.length})

${
  gapPoorRank.length
    ? perfTable(
        gapPoorRank.slice(0, 20).map((q) => ({ ...q, extra: matchLinks(q) })),
        "Query",
        "Matched page(s)",
      )
    : "None."
}

### Queries whose matching detail page never surfaces (${gapPageNotSurfacing.length})

The DB has a page for these names, but that URL shows zero impressions in the export — the query is being answered by other pages (or other sites) while ours isn't indexed/ranked.

${
  gapPageNotSurfacing.length
    ? perfTable(
        gapPageNotSurfacing.slice(0, 20).map((q) => ({
          ...q,
          extra: q.records
            .map((r) => `[${r.slug}](${detailUrl(r.slug!)})`)
            .slice(0, 2)
            .join(", "),
        })),
        "Query",
        "Existing page",
      )
    : "None."
}

## Indexing coverage (proxy)

- ${f(seenValid.length)} / ${f(bySlug.size)} detail pages (${pc(seenValid.length / bySlug.size)}) appear in the export with ≥1 impression.
- Coverage by administration:

| Administration | Detail pages | With impressions | Coverage |
|---|---|---|---|
${[...covByAdmin.entries()]
  .sort((a, b) => b[1].total - a[1].total)
  .map(([k, e]) => `| ${k} | ${f(e.total)} | ${f(e.seen)} | ${pc(e.seen / e.total)} |`)
  .join("\n")}

**Caveats:** \`Pages.csv\` is capped at 1,000 rows by the GSC exporter and only lists pages with ≥1 impression, so this is a **lower bound** on indexed pages, not true index coverage.${coverage ? "" : " For ground truth, export **Indexing → Pages** from GSC (indexed vs crawled-not-indexed vs discovered-not-crawled) into a gsc/ folder named …-Coverage-…"}

${
  coverage
    ? `### True index coverage (Coverage export, as of ${coverage.date})

**${f(coverage.indexed)} indexed / ${f(coverage.notIndexed)} not indexed.** Not-indexed breakdown:

| Reason | Pages | Assessment |
|---|---|---|
${coverage.issues.map((i) => `| ${i.reason} | ${f(i.pages)} | ${i.benign ? "benign (redirect/duplicate)" : "**real gap**"} |`).join("\n")}

Only ${f(coverage.realGap)} pages are genuinely un-indexed. With ${f(bySlug.size)} detail pages in the inventory and ~${f(coverage.indexed)} URLs indexed, essentially the whole site is in Google's index — pages that get no impressions are indexed but not ranking (or nobody searches those names). Content/authority work moves that needle, not technical indexing fixes.

**Consolidation trajectory:** indexed count went ${f(coverage.first.indexed)} (${coverage.first.date}) → peak ${f(coverage.peakIndexed)} → ${f(coverage.indexed)} (${coverage.date}), while "not indexed" grew in step — Google reclassifying duplicate slash-variant URLs into the "Page with redirect" bucket. The ~${f(Math.max(0, coverage.indexed - (bySlug.size + adminCount + 6)))} indexed URLs above the buildable-page count (${f(bySlug.size + adminCount + 6)}) are the duplicates still awaiting consolidation.`
    : ""
}

### Duplicate URL variants

${f(noSlash.length)} of the ${f(pages.length)} URLs in the export have no trailing slash, and ${f(bothForms.length)} slugs appear in **both** forms, splitting ranking signals across two URLs. Live check on 2026-07-17: the non-slash form returns a **308 → trailing-slash** redirect and the served HTML has a correct canonical (\`Layout.astro\`), so the plumbing is right — these are historical index entries that should consolidate. If they persist in future exports, use GSC URL Inspection on the worst offenders.

## CTR problems

Site's own position→CTR curve (aggregate clicks/impressions per position bin):

| Position bin | Pages | Clicks | Impr. | Aggregate CTR |
|---|---|---|---|---|
${binStats.map((b) => `| ${b.label} | ${f(b.n)} | ${f(b.clicks)} | ${f(b.imps)} | ${pc(b.ctr)} |`).join("\n")}

Pages with ≥30 impressions and CTR below **half** the aggregate for their position bin — title/meta-description rewrite candidates:

${
  ctrProblems.length
    ? perfTable(
        ctrProblems.slice(0, 25).map((c) => ({
          ...c,
          key: c.key.replace("https://pardonned.com", ""),
          extra: pc(c.benchmark),
        })),
        "Page",
        "Bin CTR",
      )
    : "None."
}

## Device split

${perfTable(devices, "Device")}

---
*Generated by \`scripts/analyze-gsc.ts\`. Re-export from GSC and re-run to refresh.*
`;

writeFileSync(reportPath, report);
console.log(`report written: ${reportPath}`);
