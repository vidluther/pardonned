import { useState, useMemo } from "react";

const ALL_GRANTS = [
  { id: 1, name: "Ross William Ulbricht", date: "2025-01-21", type: "Pardon", category: "Drug offenses", offense: "Aiding and abetting distribution of drugs over internet; continuing criminal enterprise; computer hacking conspiracy", sentence: "Life imprisonment", district: "S.D.N.Y.", restitution: null },
  { id: 2, name: "Terence Dale Sutton, Jr.", date: "2025-01-22", type: "Pardon", category: "Other", offense: "Murder in second degree; conspiracy; obstruction of justice", sentence: "66 months' imprisonment", district: "D.D.C.", restitution: null },
  { id: 3, name: "Andrew Zabavsky", date: "2025-01-22", type: "Pardon", category: "Other", offense: "Conspiracy; obstruction of justice and aiding and abetting", sentence: "48 months' imprisonment", district: "D.D.C.", restitution: null },
  { id: 4, name: "Lauren Handy", date: "2025-01-23", type: "Pardon", category: "FACE Act", offense: "Conspiracy against rights; FACE Act", sentence: "57 months' imprisonment", district: "D.D.C.", restitution: null },
  { id: 5, name: "Bevelyn Beatty Williams", date: "2025-01-23", type: "Pardon", category: "FACE Act", offense: "Violating FACE Act", sentence: "41 months' imprisonment", district: "S.D.N.Y.", restitution: null },
  { id: 6, name: "Jonathan Darnel", date: "2025-01-23", type: "Pardon", category: "FACE Act", offense: "Conspiracy against rights; FACE Act", sentence: "34 months' imprisonment", district: "D.D.C.", restitution: null },
  { id: 7, name: "Joan Bell", date: "2025-01-23", type: "Pardon", category: "FACE Act", offense: "Conspiracy against rights; FACE Act", sentence: "27 months' imprisonment", district: "D.D.C.", restitution: null },
  { id: 8, name: "Herb Geraghty", date: "2025-01-23", type: "Pardon", category: "FACE Act", offense: "Conspiracy against rights; FACE Act", sentence: "27 months' imprisonment", district: "D.D.C.", restitution: null },
  { id: 9, name: "William Goodman", date: "2025-01-23", type: "Pardon", category: "FACE Act", offense: "Conspiracy against rights; FACE Act", sentence: "27 months' imprisonment", district: "D.D.C.", restitution: null },
  { id: 10, name: "Heather Idoni", date: "2025-01-23", type: "Pardon", category: "FACE Act", offense: "Conspiracy against rights; FACE Act", sentence: "24 months' imprisonment", district: "M.D. Tenn.", restitution: null },
  { id: 11, name: "Rod R. Blagojevich", date: "2025-02-10", type: "Pardon", category: "Political corruption", offense: "Wire fraud under color of official right; conspiracy; extortion; solicitation of bribe; false statements", sentence: "168 months' imprisonment", district: "N.D. Ill.", restitution: 20000 },
  { id: 12, name: "Jean Pinkard", date: "2025-03-04", type: "Commutation", category: "Drug offenses", offense: "Conspiracy to possess with intent to distribute controlled substances", sentence: "1 year and 1 day imprisonment", district: "E.D. Mich.", restitution: null },
  { id: 13, name: "Brian Kelsey", date: "2025-03-11", type: "Pardon", category: "Political corruption", offense: "Conspiracy to defraud the United States; aiding and abetting acceptance of excessive contributions", sentence: "21 months' imprisonment", district: "M.D. Tenn.", restitution: null },
  { id: 14, name: "Thomas Edward Caldwell", date: "2025-03-20", type: "Pardon", category: "January 6", offense: "Tampering with documents or proceedings", sentence: "Time served", district: "D.D.C.", restitution: null },
  { id: 15, name: "Devon Archer", date: "2025-03-25", type: "Pardon", category: "Financial fraud", offense: "Conspiracy to commit securities fraud; securities fraud", sentence: "1 year and 1 day imprisonment", district: "S.D.N.Y.", restitution: 43427436 },
  { id: 16, name: "Arthur Hayes", date: "2025-03-27", type: "Pardon", category: "Crypto & securities", offense: "Violation of the Bank Secrecy Act", sentence: "2 years' probation", district: "S.D.N.Y.", restitution: null },
  { id: 17, name: "Benjamin Delo", date: "2025-03-27", type: "Pardon", category: "Crypto & securities", offense: "Violation of the Bank Secrecy Act", sentence: "30 months' probation", district: "S.D.N.Y.", restitution: null },
  { id: 18, name: "Trevor Milton", date: "2025-03-27", type: "Pardon", category: "Financial fraud", offense: "Securities fraud; wire fraud", sentence: "48 months' imprisonment", district: "S.D.N.Y.", restitution: null },
  { id: 19, name: "HDR Global Trading Limited", date: "2025-03-27", type: "Pardon", category: "Crypto & securities", offense: "Violation of Bank Secrecy Act", sentence: "$100,000,000 fine", district: "S.D.N.Y.", restitution: null },
  { id: 20, name: "Jason Galanis", date: "2025-03-28", type: "Commutation", category: "Financial fraud", offense: "Conspiracy to commit securities fraud; investment adviser fraud", sentence: "135 + 60 consecutive months", district: "S.D.N.Y.", restitution: 84817513 },
  { id: 21, name: "Carlos Roy Watson", date: "2025-03-28", type: "Commutation", category: "Financial fraud", offense: "Conspiracy to commit securities fraud; wire fraud; aggravated identity theft", sentence: "116 months' imprisonment", district: "E.D.N.Y.", restitution: 36769154 },
  { id: 22, name: "Ozy Media, Inc.", date: "2025-03-28", type: "Commutation", category: "Financial fraud", offense: "Conspiracy to commit securities fraud; wire fraud", sentence: "1 year probation", district: "E.D.N.Y.", restitution: 36769154 },
  { id: 23, name: "Michele Fiore", date: "2025-04-23", type: "Pardon", category: "Financial fraud", offense: "Conspiracy to commit wire fraud; wire fraud", sentence: "Pre-sentencing", district: "D. Nev.", restitution: null },
  { id: 24, name: "Paul Walczak", date: "2025-04-23", type: "Pardon", category: "Financial fraud", offense: "Willful failure to pay trust fund taxes; failure to file return", sentence: "18 months' imprisonment", district: "S.D. Fla.", restitution: 4381266 },
  { id: 25, name: "Scott Howard Jenkins", date: "2025-05-27", type: "Pardon", category: "Political corruption", offense: "Conspiracy to commit bribery; honest services fraud; bribery", sentence: "120 months' imprisonment", district: "W.D. Va.", restitution: null },
  { id: 26, name: "Todd Chrisley", date: "2025-05-28", type: "Pardon", category: "Financial fraud", offense: "Conspiracy to commit bank fraud; bank fraud; tax evasion", sentence: "144 months' imprisonment", district: "N.D. Ga.", restitution: 17270742 },
  { id: 27, name: "Julie Chrisley", date: "2025-05-28", type: "Pardon", category: "Financial fraud", offense: "Conspiracy to commit bank fraud; bank fraud; wire fraud; tax evasion; obstruction", sentence: "84 months' imprisonment", district: "N.D. Ga.", restitution: 4740645 },
  { id: 28, name: "Lawrence S. Duran", date: "2025-05-28", type: "Commutation", category: "Financial fraud", offense: "Conspiracy to commit health care fraud; money laundering; structuring", sentence: "50 years' imprisonment", district: "S.D. Fla.", restitution: 87533863 },
  { id: 29, name: "Kentrell D. Gaulden", date: "2025-05-28", type: "Pardon", category: "Drug offenses", offense: "Felon in possession of a firearm", sentence: "23 months' imprisonment", district: "D. Utah", restitution: null },
  { id: 30, name: "Larry Hoover", date: "2025-05-28", type: "Commutation", category: "Drug offenses", offense: "Narcotics conspiracy; continuing criminal enterprise; drug trafficking", sentence: "Life imprisonment", district: "N.D. Ill.", restitution: null },
  { id: 31, name: "Michael Gerard Grimm", date: "2025-05-28", type: "Pardon", category: "Financial fraud", offense: "Aiding false and fraudulent tax returns", sentence: "8 months' imprisonment", district: "E.D.N.Y.", restitution: 148907 },
  { id: 32, name: "Marian I Morgan", date: "2025-05-28", type: "Commutation", category: "Financial fraud", offense: "Conspiracy to defraud the United States; wire fraud", sentence: "405 months' imprisonment", district: "M.D. Fla.", restitution: 19958995 },
];

const CATEGORIES = ["All", "Financial fraud", "FACE Act", "Crypto & securities", "Political corruption", "Drug offenses", "January 6", "Other"];
const TYPES = ["All", "Pardon", "Commutation"];

const CATEGORY_COLORS = {
  "Financial fraud": "#8A6B1E",
  "FACE Act": "#B8652A",
  "Crypto & securities": "#2A6A7A",
  "Political corruption": "#6A4B7A",
  "Drug offenses": "#3A6A4A",
  "January 6": "#C23B22",
  "Other": "#7A7870",
};

function formatCurrency(n) {
  if (!n) return null;
  if (n >= 1000000) return "$" + (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return "$" + (n / 1000).toFixed(0) + "K";
  return "$" + n.toLocaleString();
}

function formatDate(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PardonedSearch() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState("All");
  const [sortBy, setSortBy] = useState("date-desc");
  const [hoveredId, setHoveredId] = useState(null);

  const filtered = useMemo(() => {
    let results = ALL_GRANTS.filter((g) => {
      if (category !== "All" && g.category !== category) return false;
      if (type !== "All" && g.type !== type) return false;
      if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.offense.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    results.sort((a, b) => {
      if (sortBy === "date-desc") return b.date.localeCompare(a.date);
      if (sortBy === "date-asc") return a.date.localeCompare(b.date);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "restitution") return (b.restitution || 0) - (a.restitution || 0);
      return 0;
    });
    return results;
  }, [search, category, type, sortBy]);

  const totalRestitution = filtered.reduce((sum, g) => sum + (g.restitution || 0), 0);

  return (
    <div style={{ background: "#FAFAF7", color: "#1A1918", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #E8E6E0" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#1A1918", letterSpacing: "-0.02em" }}>
            Pardonn<span style={{ color: "#C23B22" }}>e</span>d
          </span>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 14, color: "#7A7870" }}>
          <a href="#" style={{ color: "#7A7870", textDecoration: "none" }}>Home</a>
          <a href="#" style={{ color: "#1A1918", textDecoration: "none", borderBottom: "1px solid #C23B22", paddingBottom: 2 }}>Search pardons</a>
          <a href="#" style={{ color: "#7A7870", textDecoration: "none" }}>About</a>
        </div>
      </nav>

      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 40px 80px" }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, marginBottom: 8, color: "#1A1918" }}>Search clemency grants</h1>
        <p style={{ fontSize: 15, color: "#7A7870", marginBottom: 32 }}>
          Individual pardons and commutations granted since January 20, 2025. Excludes blanket January 6 executive order.
        </p>

        {/* Filters */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap",
          background: "#FFFFFF", border: "1px solid #E8E6E0", borderRadius: 8, padding: "16px 20px",
        }}>
          <div style={{ position: "relative", flex: "1 1 240px" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#B0AEA8", fontSize: 14 }}>⌕</span>
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or offense..."
              style={{
                width: "100%", background: "#F6F5F0", border: "1px solid #E8E6E0",
                borderRadius: 6, padding: "10px 12px 10px 32px", color: "#1A1918", fontSize: 14,
                outline: "none", boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} style={{
                background: category === c ? "rgba(194,59,34,0.08)" : "#F6F5F0",
                color: category === c ? "#C23B22" : "#7A7870",
                border: `1px solid ${category === c ? "rgba(194,59,34,0.2)" : "#E8E6E0"}`,
                borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap",
              }}>{c}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{
              background: "#F6F5F0", border: "1px solid #E8E6E0", borderRadius: 6,
              padding: "8px 12px", color: "#4A4840", fontSize: 13, cursor: "pointer",
            }}>
              {TYPES.map((t) => <option key={t} value={t}>{t === "All" ? "All types" : t}</option>)}
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{
              background: "#F6F5F0", border: "1px solid #E8E6E0", borderRadius: 6,
              padding: "8px 12px", color: "#4A4840", fontSize: 13, cursor: "pointer",
            }}>
              <option value="date-desc">Newest first</option>
              <option value="date-asc">Oldest first</option>
              <option value="name">Name A-Z</option>
              <option value="restitution">Restitution (high-low)</option>
            </select>
          </div>
        </div>

        {/* Results summary */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, padding: "0 4px" }}>
          <span style={{ fontSize: 13, color: "#7A7870" }}>
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
            {category !== "All" && <> in <span style={{ color: CATEGORY_COLORS[category] || "#7A7870", fontWeight: 500 }}>{category}</span></>}
          </span>
          {totalRestitution > 0 && (
            <span style={{ fontSize: 13, color: "#7A7870" }}>
              Combined restitution: <span style={{ color: "#C23B22", fontWeight: 500 }}>{formatCurrency(totalRestitution)}</span>
            </span>
          )}
        </div>

        {/* Results list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((g) => (
            <div key={g.id} onMouseEnter={() => setHoveredId(g.id)} onMouseLeave={() => setHoveredId(null)} style={{
              background: hoveredId === g.id ? "#F6F5F0" : "#FFFFFF",
              border: "1px solid #E8E6E0", borderRadius: 8, padding: "18px 24px", cursor: "pointer",
              transition: "background 0.15s", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start",
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "#1A1918" }}>{g.name}</span>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 4,
                    background: g.type === "Pardon" ? "rgba(194,59,34,0.08)" : "rgba(42,106,122,0.08)",
                    color: g.type === "Pardon" ? "#C23B22" : "#2A6A7A",
                  }}>{g.type}</span>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 4,
                    background: "#F6F5F0", color: CATEGORY_COLORS[g.category] || "#7A7870",
                    border: "1px solid #E8E6E0",
                  }}>{g.category}</span>
                </div>
                <p style={{ fontSize: 13, color: "#6A6860", margin: "0 0 6px", lineHeight: 1.5 }}>{g.offense}</p>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#9A9890" }}>
                  <span>{g.district}</span>
                  <span>{g.sentence}</span>
                </div>
              </div>
              <div style={{ textAlign: "right", minWidth: 100 }}>
                <div style={{ fontSize: 12, color: "#9A9890", marginBottom: 4 }}>{formatDate(g.date)}</div>
                {g.restitution && (
                  <div style={{ fontSize: 15, fontWeight: 500, color: "#C23B22" }}>{formatCurrency(g.restitution)}</div>
                )}
                {g.restitution && <div style={{ fontSize: 11, color: "#9A9890" }}>restitution</div>}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#9A9890" }}>
            <p style={{ fontSize: 16, marginBottom: 8 }}>No results match your filters</p>
            <p style={{ fontSize: 13 }}>Try adjusting your search or category selection</p>
          </div>
        )}
      </div>
    </div>
  );
}