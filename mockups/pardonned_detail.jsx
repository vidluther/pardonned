import { useState } from "react";

const GRANT = {
  name: "Todd Chrisley",
  type: "Pardon",
  date: "May 28, 2025",
  district: "Northern District of Georgia",
  districtShort: "N.D. Ga.",
  warrantUrl: "https://www.justice.gov/pardon/media/1401921/dl?inline",
  sourceUrl: "https://www.justice.gov/pardon/clemency-grants-president-donald-j-trump-2025-present",
  sentence: "144 months' imprisonment; three years' supervised release; $17,270,741.57 restitution",
  sentenceParsed: {
    imprisonment: "144 months (12 years)",
    supervisedRelease: "3 years",
    restitution: "$17,270,741.57",
    sentencingDate: "November 21, 2022",
  },
  offenses: [
    "Conspiracy to commit bank fraud",
    "Bank fraud (five counts)",
    "Conspiracy to defraud the U.S. to obstruct and impede the Internal Revenue Laws",
    "Tax evasion",
  ],
  category: "Financial fraud",
  summary:
    "Todd Chrisley, known for the reality television show 'Chrisley Knows Best,' was convicted in 2022 alongside his wife Julie Chrisley of defrauding community banks out of more than $30 million in fraudulent loans. The couple also evaded federal taxes and obstructed an IRS investigation. The restitution order of over $17 million was owed to the defrauded banks.",
};

const RELATED = [
  {
    name: "Julie Chrisley",
    type: "Pardon",
    date: "May 28, 2025",
    offense: "Bank fraud; wire fraud; tax evasion; obstruction of justice",
    restitution: "$4,740,645.04",
    sentence: "84 months' imprisonment",
    relation: "Co-defendant, spouse",
  },
];

const TIMELINE = [
  { date: "Jun 2019", event: "Indicted on federal charges in the Northern District of Georgia" },
  { date: "Jun 2022", event: "Found guilty by a federal jury on all counts" },
  { date: "Nov 2022", event: "Sentenced to 144 months' imprisonment and $17.2M restitution" },
  { date: "Jan 2024", event: "Reported to FPC Pensacola to begin sentence" },
  { date: "May 28, 2025", event: "Granted full presidential pardon", highlight: true },
];

export default function PardonedDetail() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div style={{ background: "#FAFAF7", color: "#1A1918", minHeight: "100vh", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet" />

      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", borderBottom: "1px solid #E8E6E0" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#1A1918", letterSpacing: "-0.02em" }}>
            Pardonn<span style={{ color: "#C23B22" }}>e</span>d
          </span>
        </div>
        <div style={{ display: "flex", gap: 32, fontSize: 14, color: "#7A7870" }}>
          <a href="#" style={{ color: "#7A7870", textDecoration: "none" }}>Home</a>
          <a href="#" style={{ color: "#7A7870", textDecoration: "none" }}>Search pardons</a>
          <a href="#" style={{ color: "#7A7870", textDecoration: "none" }}>About</a>
        </div>
      </nav>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "40px 40px 80px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: 13, color: "#9A9890", marginBottom: 24, display: "flex", gap: 8, alignItems: "center" }}>
          <a href="#" style={{ color: "#7A7870", textDecoration: "none" }}>Search</a>
          <span style={{ color: "#D0CEC8" }}>/</span>
          <span style={{ color: "#4A4840" }}>{GRANT.name}</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em",
              background: "rgba(194,59,34,0.08)", color: "#C23B22",
            }}>{GRANT.type}</span>
            <span style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 4,
              background: "rgba(138,107,30,0.08)", color: "#8A6B1E",
            }}>{GRANT.category}</span>
            <span style={{ fontSize: 12, color: "#9A9890" }}>Granted {GRANT.date}</span>
          </div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif", fontSize: 42, color: "#1A1918",
            margin: "0 0 12px", letterSpacing: "-0.02em", lineHeight: 1.15,
          }}>{GRANT.name}</h1>

          <p style={{ fontSize: 15, color: "#7A7870", margin: "0 0 24px" }}>
            {GRANT.districtShort} &middot; Sentenced {GRANT.sentenceParsed.sentencingDate}
          </p>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            <div style={{
              background: "rgba(194,59,34,0.04)", border: "1px solid rgba(194,59,34,0.12)",
              borderRadius: 8, padding: "20px 20px",
            }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#A07060", marginBottom: 6 }}>Restitution abandoned</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#C23B22" }}>{GRANT.sentenceParsed.restitution}</div>
              <div style={{ fontSize: 12, color: "#9A9890", marginTop: 4 }}>Owed to defrauded banks</div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E6E0", borderRadius: 8, padding: "20px 20px" }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9A9890", marginBottom: 6 }}>Prison sentence</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#1A1918" }}>12 years</div>
              <div style={{ fontSize: 12, color: "#9A9890", marginTop: 4 }}>144 months originally imposed</div>
            </div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E8E6E0", borderRadius: 8, padding: "20px 20px" }}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9A9890", marginBottom: 6 }}>Charges</div>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: "#1A1918" }}>{GRANT.offenses.length}</div>
              <div style={{ fontSize: 12, color: "#9A9890", marginTop: 4 }}>Including 5 counts of bank fraud</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid #E8E6E0", marginBottom: 32 }}>
          {["overview", "offenses", "timeline", "related"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "12px 24px", fontSize: 14, color: activeTab === tab ? "#1A1918" : "#9A9890",
              borderBottom: activeTab === tab ? "2px solid #C23B22" : "2px solid transparent",
              textTransform: "capitalize", marginBottom: -1, fontWeight: activeTab === tab ? 500 : 400,
            }}>{tab}</button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "#4A4840", marginBottom: 32, maxWidth: 680 }}>
              {GRANT.summary}
            </p>

            <div style={{ background: "#FFFFFF", border: "1px solid #E8E6E0", borderRadius: 8, padding: "24px 28px", marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: "#9A9890", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Sentence details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 40px" }}>
                {Object.entries(GRANT.sentenceParsed).map(([key, val]) => (
                  <div key={key}>
                    <div style={{ fontSize: 12, color: "#9A9890", marginBottom: 4, textTransform: "capitalize" }}>{key.replace(/([A-Z])/g, " $1").trim()}</div>
                    <div style={{ fontSize: 15, color: key === "restitution" ? "#C23B22" : "#1A1918", fontWeight: key === "restitution" ? 500 : 400 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E8E6E0", borderRadius: 8, padding: "24px 28px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: "#9A9890", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>Source documents</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <a href={GRANT.warrantUrl} target="_blank" rel="noopener" style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "#F6F5F0", border: "1px solid #E8E6E0",
                  borderRadius: 6, padding: "14px 18px", textDecoration: "none", color: "#4A4840",
                }}>
                  <span style={{ fontSize: 20, opacity: 0.5 }}>📄</span>
                  <div>
                    <div style={{ fontSize: 14, color: "#1A1918", marginBottom: 2 }}>Pardon warrant (PDF)</div>
                    <div style={{ fontSize: 12, color: "#9A9890" }}>DOJ Office of the Pardon Attorney</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 13, color: "#9A9890" }}>↗</span>
                </a>
                <a href={GRANT.sourceUrl} target="_blank" rel="noopener" style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: "#F6F5F0", border: "1px solid #E8E6E0",
                  borderRadius: 6, padding: "14px 18px", textDecoration: "none", color: "#4A4840",
                }}>
                  <span style={{ fontSize: 20, opacity: 0.5 }}>🏛</span>
                  <div>
                    <div style={{ fontSize: 14, color: "#1A1918", marginBottom: 2 }}>DOJ clemency listing page</div>
                    <div style={{ fontSize: 12, color: "#9A9890" }}>justice.gov/pardon</div>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 13, color: "#9A9890" }}>↗</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Offenses */}
        {activeTab === "offenses" && (
          <div>
            <p style={{ fontSize: 14, color: "#7A7870", marginBottom: 24 }}>
              Federal charges for which clemency was granted, as listed on the DOJ warrant document.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {GRANT.offenses.map((o, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 16,
                  background: "#FFFFFF", border: "1px solid #E8E6E0",
                  borderLeft: "3px solid rgba(194,59,34,0.35)", borderRadius: "0 8px 8px 0",
                  padding: "18px 24px",
                }}>
                  <span style={{
                    fontSize: 12, fontWeight: 500, color: "#9A9890",
                    background: "#F6F5F0", borderRadius: 4, padding: "2px 8px",
                    minWidth: 20, textAlign: "center",
                  }}>{i + 1}</span>
                  <div>
                    <div style={{ fontSize: 15, color: "#1A1918", marginBottom: 4 }}>{o}</div>
                    <div style={{ fontSize: 12, color: "#9A9890" }}>
                      {o.includes("bank fraud") && o.includes("five") ? "Five separate counts" :
                       o.includes("Conspiracy") ? "Federal conspiracy charge" :
                       o.includes("Tax") ? "Federal tax offense" :
                       "Federal offense"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 24, padding: "16px 20px",
              background: "rgba(138,107,30,0.05)", border: "1px solid rgba(138,107,30,0.15)",
              borderRadius: 8, fontSize: 13, color: "#7A6A30", lineHeight: 1.5,
            }}>
              Full original sentence: {GRANT.sentence}
            </div>
          </div>
        )}

        {/* Timeline */}
        {activeTab === "timeline" && (
          <div style={{ position: "relative", paddingLeft: 32 }}>
            <div style={{ position: "absolute", left: 6, top: 8, bottom: 8, width: 1, background: "#E0DED8" }} />
            {TIMELINE.map((t, i) => (
              <div key={i} style={{ position: "relative", marginBottom: 32, paddingLeft: 24 }}>
                <div style={{
                  position: "absolute", left: -32, top: 5,
                  width: 13, height: 13, borderRadius: "50%",
                  background: t.highlight ? "#C23B22" : "#FFFFFF",
                  border: `2px solid ${t.highlight ? "#C23B22" : "#D0CEC8"}`,
                }} />
                <div style={{ fontSize: 12, color: "#9A9890", marginBottom: 4, fontWeight: 500 }}>{t.date}</div>
                <div style={{ fontSize: 15, color: t.highlight ? "#1A1918" : "#5A5850", fontWeight: t.highlight ? 500 : 400 }}>
                  {t.event}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Related */}
        {activeTab === "related" && (
          <div>
            <p style={{ fontSize: 14, color: "#7A7870", marginBottom: 24 }}>
              Other clemency grants connected to this case or individual.
            </p>
            {RELATED.map((r, i) => (
              <div key={i} style={{
                background: "#FFFFFF", border: "1px solid #E8E6E0",
                borderRadius: 8, padding: "24px 28px", cursor: "pointer",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: "#1A1918" }}>{r.name}</span>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 4,
                    background: "rgba(194,59,34,0.08)", color: "#C23B22",
                  }}>{r.type}</span>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 4,
                    background: "rgba(42,106,122,0.08)", color: "#2A6A7A",
                  }}>{r.relation}</span>
                </div>
                <p style={{ fontSize: 13, color: "#6A6860", margin: "0 0 10px" }}>{r.offense}</p>
                <div style={{ display: "flex", gap: 24, fontSize: 12, color: "#9A9890" }}>
                  <span>Granted {r.date}</span>
                  <span>{r.sentence}</span>
                  <span style={{ color: "#C23B22" }}>{r.restitution} restitution</span>
                </div>
              </div>
            ))}

            <div style={{
              marginTop: 24, padding: "24px 28px",
              background: "rgba(194,59,34,0.03)", border: "1px solid rgba(194,59,34,0.1)",
              borderRadius: 8,
            }}>
              <h4 style={{ fontSize: 13, fontWeight: 500, color: "#C23B22", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Combined impact of related grants
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#A07060", marginBottom: 4, textTransform: "uppercase" }}>Total restitution</div>
                  <div style={{ fontSize: 20, fontWeight: 500, color: "#C23B22", fontFamily: "'DM Serif Display', serif" }}>$22,011,386</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#9A9890", marginBottom: 4, textTransform: "uppercase" }}>Combined sentences</div>
                  <div style={{ fontSize: 20, fontWeight: 500, color: "#1A1918", fontFamily: "'DM Serif Display', serif" }}>19 years</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#9A9890", marginBottom: 4, textTransform: "uppercase" }}>Individuals pardoned</div>
                  <div style={{ fontSize: 20, fontWeight: 500, color: "#1A1918", fontFamily: "'DM Serif Display', serif" }}>2</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer style={{
        borderTop: "1px solid #E8E6E0", padding: "32px 40px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        maxWidth: 880, margin: "0 auto",
      }}>
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