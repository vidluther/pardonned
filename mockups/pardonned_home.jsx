import { useState, useEffect } from "react";

const STATS = [
  { label: "Clemency grants", value: "1,583+", note: "Including ~1,500 Jan 6 blanket pardons" },
  { label: "Restitution abandoned", value: "$251M+", note: "Owed to victims, now uncollectable" },
  { label: "Prison years erased", value: "187+", note: "Across individual grants" },
  { label: "Fraud-related pardons", value: "18", note: "Securities, wire, bank, tax fraud" },
];

const CATEGORIES = [
  { name: "January 6 defendants", count: "~1,500+", color: "#C23B22" },
  { name: "FACE Act violations", count: 24, color: "#B8652A" },
  { name: "Financial fraud", count: 18, color: "#8A6B1E" },
  { name: "Crypto & securities", count: 7, color: "#2A6A7A" },
  { name: "Political corruption", count: 4, color: "#6A4B7A" },
  { name: "Drug offenses", count: 4, color: "#3A6A4A" },
];

const RECENT = [
  { date: "May 28, 2025", grants: "16 Pardons, 6 Commutations", names: ["Todd Chrisley", "Julie Chrisley", "Kentrell Gaulden (NBA YoungBoy)", "Larry Hoover", "Lawrence Duran", "Michael Grimm"], highlight: "Chrisley fraud convictions carried $22M+ in restitution" },
  { date: "May 27, 2025", grants: "2 Pardons", names: ["Scott Howard Jenkins", "James Callahan"], highlight: "Jenkins pardoned for bribery; sentenced to 10 years" },
  { date: "Apr 23, 2025", grants: "2 Pardons", names: ["Michele Fiore", "Paul Walczak"], highlight: "Fiore pardoned pre-sentencing for wire fraud conspiracy" },
  { date: "Mar 28, 2025", grants: "3 Commutations", names: ["Jason Galanis", "Ozy Media Inc.", "Carlos Watson"], highlight: "Galanis owed $84M+ in restitution across two cases" },
  { date: "Mar 27, 2025", grants: "6 Pardons", names: ["Arthur Hayes", "Benjamin Delo", "Trevor Milton", "HDR Global Trading", "Samuel Reed", "Gregory Dwyer"], highlight: "HDR Global fined $100M for Bank Secrecy Act violations" },
  { date: "Mar 25, 2025", grants: "1 Pardon", names: ["Devon Archer"], highlight: "Archer owed $43.4M restitution for securities fraud" },
  { date: "Jan 23, 2025", grants: "24 Pardons", names: ["Lauren Handy", "Bevelyn Beatty Williams", "Eva Edl", "+ 21 others"], highlight: "All convicted under the FACE Act for clinic blockades" },
  { date: "Jan 21, 2025", grants: "1 Pardon", names: ["Ross William Ulbricht"], highlight: "Silk Road founder; served ~11 years of life sentence" },
  { date: "Jan 20, 2025", grants: "Blanket pardon & commutations", names: ["~1,500+ January 6 defendants"], highlight: "Executive order on Inauguration Day" },
];

export default function PardonedHome() {
  const [visibleStats, setVisibleStats] = useState([false, false, false, false]);

  useEffect(() => {
    STATS.forEach((_, i) => {
      setTimeout(() => setVisibleStats((p) => { const n = [...p]; n[i] = true; return n; }), 200 + i * 150);
    });
  }, []);

  return (
    <div style={{ background: "#FAFAF7", color: "#1A1918", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,700;1,400&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #E8E6E0" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#1A1918", letterSpacing: "-0.02em" }}>
            Pardonn<span style={{ color: "#C23B22" }}>e</span>d
          </span>
          <span style={{ fontSize: 11, color: "#9A9890", letterSpacing: "0.08em", textTransform: "uppercase" }}>Clemency tracker</span>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 14, color: "#7A7870" }}>
          <a href="#" style={{ color: "#1A1918", textDecoration: "none", borderBottom: "1px solid #C23B22", paddingBottom: 2 }}>Home</a>
          <a href="#" style={{ color: "#7A7870", textDecoration: "none" }}>Search pardons</a>
          <a href="#" style={{ color: "#7A7870", textDecoration: "none" }}>About</a>
          <a href="#" style={{ color: "#7A7870", textDecoration: "none" }}>Methodology</a>
        </div>
      </nav>

      <header style={{ padding: "80px 40px 60px", maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase", color: "#C23B22", marginBottom: 24, fontWeight: 500 }}>
          Tracking presidential clemency &middot; Updated May 2025
        </p>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 52, lineHeight: 1.1, color: "#1A1918", margin: "0 0 24px", letterSpacing: "-0.02em", maxWidth: 740, marginLeft: "auto", marginRight: "auto" }}>
          Who gets a second chance—<br />and what it costs the rest of us
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.6, color: "#6A6860", maxWidth: 600, margin: "0 auto 48px" }}>
          Every pardon and commutation granted by President Trump since January 2025, sourced directly from DOJ warrant documents. Follow the patterns.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, maxWidth: 860, margin: "0 auto" }}>
          {STATS.map((s, i) => (
            <div key={i} style={{
              background: "#FFFFFF", border: "1px solid #E8E6E0", borderRadius: 8, padding: "24px 16px",
              opacity: visibleStats[i] ? 1 : 0, transform: visibleStats[i] ? "translateY(0)" : "translateY(12px)",
              transition: "all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9A9890", marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: i === 1 ? "#C23B22" : "#1A1918", lineHeight: 1.1, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: "#A0A098", lineHeight: 1.4 }}>{s.note}</div>
            </div>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(194,59,34,0.2), transparent)" }} />
      </div>

      <section style={{ padding: "60px 40px", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 8, color: "#1A1918" }}>By category</h2>
        <p style={{ fontSize: 14, color: "#9A9890", marginBottom: 32 }}>Clemency grants grouped by primary offense type</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {CATEGORIES.map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14,
              background: "#FFFFFF", border: "1px solid #E8E6E0",
              borderLeft: `3px solid ${c.color}`, borderRadius: "0 6px 6px 0", padding: "16px 20px",
            }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: c.color, minWidth: 60 }}>{c.count}</span>
              <span style={{ fontSize: 14, color: "#4A4840" }}>{c.name}</span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 40px" }}>
        <div style={{ height: 1, background: "#E8E6E0" }} />
      </div>

      <section style={{ padding: "60px 40px", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, marginBottom: 8, color: "#1A1918" }}>Timeline</h2>
        <p style={{ fontSize: 14, color: "#9A9890", marginBottom: 40 }}>Every clemency action in reverse chronological order</p>

        <div style={{ position: "relative", paddingLeft: 32 }}>
          <div style={{ position: "absolute", left: 6, top: 8, bottom: 8, width: 1, background: "#E0DED8" }} />

          {RECENT.map((entry, i) => (
            <div key={i} style={{ position: "relative", marginBottom: 36, paddingLeft: 20 }}>
              <div style={{
                position: "absolute", left: -32, top: 6, width: 13, height: 13, borderRadius: "50%",
                background: i === 0 ? "#C23B22" : "#FFFFFF",
                border: `2px solid ${i === 0 ? "#C23B22" : "#D0CEC8"}`,
              }} />

              <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#7A7870", fontWeight: 500, minWidth: 110 }}>{entry.date}</span>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", background: "rgba(194,59,34,0.08)", color: "#C23B22", padding: "3px 10px", borderRadius: 4 }}>{entry.grants}</span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {entry.names.map((name, j) => (
                  <span key={j} style={{ fontSize: 13, color: "#3A3830", background: "#F2F1EC", border: "1px solid #E8E6E0", padding: "4px 10px", borderRadius: 4, cursor: "pointer" }}>{name}</span>
                ))}
              </div>

              <p style={{ fontSize: 13, color: "#8A8880", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>{entry.highlight}</p>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <button style={{ background: "transparent", border: "1px solid #D0CEC8", color: "#5A5850", padding: "12px 32px", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>
            Search all pardons →
          </button>
        </div>
      </section>

      <section style={{
        margin: "20px 40px 40px", maxWidth: 880, marginLeft: "auto", marginRight: "auto",
        background: "rgba(194,59,34,0.04)", border: "1px solid rgba(194,59,34,0.12)",
        borderRadius: 8, padding: "24px 32px", display: "flex", alignItems: "flex-start", gap: 16,
      }}>
        <span style={{ fontSize: 20, marginTop: 2 }}>⚖</span>
        <div>
          <p style={{ fontSize: 14, color: "#3A3830", margin: "0 0 6px", fontWeight: 500 }}>Every claim sourced to DOJ warrant documents</p>
          <p style={{ fontSize: 13, color: "#8A8880", margin: 0, lineHeight: 1.5 }}>
            All data on this site is scraped directly from the U.S. Department of Justice Office of the Pardon Attorney. Each pardon links to its original warrant PDF.
          </p>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid #E8E6E0", padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 960, margin: "0 auto" }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "#C0BEB8" }}>
          Pardonn<span style={{ color: "rgba(194,59,34,0.35)" }}>e</span>d
        </span>
        <span style={{ fontSize: 12, color: "#B0AEA8" }}>
          Data source: DOJ Office of the Pardon Attorney &middot; Not affiliated with the U.S. government
        </span>
      </footer>
    </div>
  );
}