import { useEffect, useMemo, useState } from "react";
import { fetchRaces } from "../lib/raceStore";

const SCHOOL_CODES = [
  "11X016","11X019","11X041","11X068","11X076","11X078","11X083","11X087",
  "11X089","11X096","11X097","11X103","11X105","11X106","11X108","11X111",
  "11X121","11X127","11X144","11X153","11X160","11X169","11X175","11X180",
  "11X181","11X194","11X370","11X462","11X483","11X498","11X529","11X566",
  "11X567",
];

const D11_BG = "#0f172a";
const CARD_BG = "#111827";
const BORDER = "#334155";
const MUTED = "#94a3b8";
const TEXT = "#f8fafc";

function schoolCodeToShort(code) {
  return code.replace("11X", "");
}

function raceMatchesSchool(race, selectedSchool) {
  if (selectedSchool === "All Schools") return true;
  const shortCode = schoolCodeToShort(selectedSchool);

  return (
    (race.racer_a || "").startsWith(`${shortCode}-`) ||
    (race.racer_b || "").startsWith(`${shortCode}-`)
  );
}

function getStatusTone(status) {
  if (status === "Complete") return { bg: "#14532d", color: "#dcfce7", label: "Completed" };
  if (status === "Pending" || !status) return { bg: "#1e293b", color: "#e2e8f0", label: "Pending" };
  if (status === "Tiebreaker Needed") return { bg: "#7c2d12", color: "#ffedd5", label: "Tiebreaker Needed" };
  if (status === "DQ Conflict") return { bg: "#7f1d1d", color: "#fee2e2", label: "DQ Conflict" };
  return { bg: "#1e293b", color: "#e2e8f0", label: status || "Unknown" };
}

export default function SpectatorPage() {
  const [bracketType, setBracketType] = useState("12");
  const [races, setRaces] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");

  useEffect(() => {
    let mounted = true;

    async function load() {
      const rows = await fetchRaces(bracketType);
      if (mounted) setRaces(rows);
    }

    load();
    const interval = setInterval(load, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [bracketType]);

  const visibleRaces = useMemo(() => {
    return races.filter((race) => {
      if (!raceMatchesSchool(race, schoolFilter)) return false;

      if (statusFilter === "All") return true;
      if (statusFilter === "Completed") return race.status === "Complete";
      if (statusFilter === "Current") {
        return race.status === "Tiebreaker Needed" || race.status === "DQ Conflict";
      }
      if (statusFilter === "Pending") {
        return !race.status || race.status === "Pending";
      }
      return true;
    });
  }, [races, statusFilter, schoolFilter]);

  const pillButtonStyle = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid #475569",
    background: "#ffffff",
    color: "#111827",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: D11_BG,
        color: TEXT,
        padding: 16,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Phone-friendly header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <img
            src="/logo.png"
            alt="District 11 Logo"
            style={{
              height: 52,
              width: "auto",
              flexShrink: 0,
            }}
          />

          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(24px, 6vw, 36px)",
                fontWeight: 800,
                color: "#f8fafc",
                lineHeight: 1.05,
              }}
            >
              District 11 Soap Box Derby
            </h1>

            <div
              style={{
                color: "#cbd5e1",
                fontSize: "clamp(14px, 3.5vw, 20px)",
                marginTop: 2,
              }}
            >
              Live Race Board
            </div>
          </div>
        </div>

        {/* Bracket buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <button onClick={() => setBracketType("12")} style={pillButtonStyle}>
            12-Car
          </button>
          <button onClick={() => setBracketType("64")} style={pillButtonStyle}>
            64-Car
          </button>
        </div>

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <button onClick={() => setStatusFilter("Completed")} style={pillButtonStyle}>
            Completed
          </button>
          <button onClick={() => setStatusFilter("Current")} style={pillButtonStyle}>
            Current
          </button>
          <button onClick={() => setStatusFilter("Pending")} style={pillButtonStyle}>
            Pending
          </button>
          <button onClick={() => setStatusFilter("All")} style={pillButtonStyle}>
            All
          </button>

          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            style={{
              ...pillButtonStyle,
              minWidth: 150,
              background: "#ffffff",
            }}
          >
            <option value="All Schools">All Schools</option>
            {SCHOOL_CODES.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </div>

        {visibleRaces.length === 0 && (
          <div style={{ color: "#cbd5e1", marginTop: 24, fontSize: 18 }}>
            No races match the current filters.
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {visibleRaces.map((race) => {
            const tone = getStatusTone(race.status);
            const racerA = race.racer_a || race.slot_a || "--";
            const racerB = race.racer_b || race.slot_b || "--";

            return (
              <div
                key={`${race.bracket_type}-${race.id}`}
                style={{
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 18,
                  padding: 16,
                  boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800 }}>Race {race.id}</div>
                    <div style={{ color: MUTED, fontSize: 15 }}>{race.round}</div>
                  </div>

                  <div
                    style={{
                      background: tone.bg,
                      color: tone.color,
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tone.label}
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: race.winner === racerA ? "#14532d" : "#1f2937",
                      border: `1px solid ${race.winner === racerA ? "#22c55e" : BORDER}`,
                      fontWeight: 700,
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  >
                    {racerA}
                  </div>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: race.winner === racerB ? "#14532d" : "#1f2937",
                      border: `1px solid ${race.winner === racerB ? "#22c55e" : BORDER}`,
                      fontWeight: 700,
                      fontSize: 16,
                      textAlign: "center",
                    }}
                  >
                    {racerB}
                  </div>
                </div>

                {(race.bye_for || race.dq_a || race.dq_b) && (
                  <div
                    style={{
                      marginBottom: 12,
                      color: "#fecaca",
                      background: "#7f1d1d",
                      padding: 10,
                      borderRadius: 10,
                      fontSize: 14,
                    }}
                  >
                    {race.bye_for === "A" && "Racer A advanced by BYE"}
                    {race.bye_for === "B" && "Racer B advanced by BYE"}
                    {race.bye_for && (race.dq_a || race.dq_b) ? " | " : ""}
                    {race.dq_a && `Racer A DQ${race.dq_reason_a ? ` — ${race.dq_reason_a}` : ""}`}
                    {race.dq_a && race.dq_b ? " | " : ""}
                    {race.dq_b && `Racer B DQ${race.dq_reason_b ? ` — ${race.dq_reason_b}` : ""}`}
                  </div>
                )}

                <div style={{ display: "grid", gap: 6, color: "#e2e8f0", fontSize: 15 }}>
                  <div>Run 1: {race.run1_lane1 ?? "--"} | {race.run1_lane2 ?? "--"}</div>
                  <div>Run 2: {race.run2_lane1 ?? "--"} | {race.run2_lane2 ?? "--"}</div>
                  <div>Total A: {race.total_a ?? "--"}</div>
                  <div>Total B: {race.total_b ?? "--"}</div>
                  <div><strong>Winner:</strong> {race.winner || "--"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}