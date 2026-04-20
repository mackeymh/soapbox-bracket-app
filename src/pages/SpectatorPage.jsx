import { useEffect, useMemo, useState, useRef } from "react";
import { fetchRaces } from "../lib/raceStore";

const SCHOOL_CODES = [
  "11X016","11X019","11X041","11X068","11X076","11X078","11X083","11X087",
  "11X089","11X096","11X097","11X103","11X105","11X106","11X108","11X111",
  "11X121","11X127","11X144","11X153","11X160","11X169","11X175","11X180",
  "11X181","11X194","11X370","11X462","11X483","11X498","11X529","11X566",
  "11X567",
];

const COLORS = {
  bg: "#0f172a",
  card: "#111827",
  border: "#334155",
  text: "#f8fafc",
  muted: "#94a3b8",
  accent: "#22c55e",
  red: "#7f1d1d",
};

function hasAnyRunData(race) {
  return (
    race.run1_lane1 != null ||
    race.run1_lane2 != null ||
    race.run2_lane1 != null ||
    race.run2_lane2 != null
  );
}

function isRaceMidRace(race) {
  const run1 = race.run1_lane1 != null || race.run1_lane2 != null;
  const run2 = race.run2_lane1 != null || race.run2_lane2 != null;
  return run1 && !run2;
}

function isRaceCurrent(race, nextRaceId) {
  // 🚫 NEVER allow completed races
  if (race.status === "Complete") return false;

  // 🚫 NEVER allow DQ conflicts
  if (race.status === "DQ Conflict") return false;

  const isNext = race.id === nextRaceId;
  const isMid = isRaceMidRace(race);
  const isTie = race.status === "Tiebreaker Needed";

  return isNext || isMid || isTie;
}

function getStandings(bracketType, races) {
  const map = {};
  races.forEach(r => (map[r.id] = r));

  if (bracketType === "12") {
    return [
      ["1st", map[11]?.winner],
      ["2nd", map[11]?.loser],
      ["3rd", map[16]?.winner],
      ["4th", map[16]?.loser],
      ["5th", map[14]?.winner],
      ["6th", map[14]?.loser],
      ["7th", map[15]?.winner],
      ["8th", map[15]?.loser],
    ];
  }

  return [
    ["1st", map[63]?.winner],
    ["2nd", map[63]?.loser],
    ["3rd", map[68]?.winner],
    ["4th", map[68]?.loser],
    ["5th", map[66]?.winner],
    ["6th", map[66]?.loser],
    ["7th", map[67]?.winner],
    ["8th", map[67]?.loser],
  ];
}

export default function SpectatorPage() {
  const [races, setRaces] = useState([]);
  const [bracketType, setBracketType] = useState("12");
  const [tab, setTab] = useState("Races");
  const [filter, setFilter] = useState("Current");
  const currentRef = useRef(null);

  useEffect(() => {
    async function load() {
      const data = await fetchRaces(bracketType);
      setRaces(data);
    }

    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, [bracketType]);

  useEffect(() => {
  if (currentRef.current) {
    currentRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
}, [currentRace]);

  const sorted = useMemo(
    () => [...races].sort((a, b) => a.id - b.id),
    [races]
  );

  const nextRaceId = useMemo(() => {
  // 🔥 PRIORITY 1: manual override
  const override = sorted.find(r => r.is_current_override);
  if (override) return override.id;

  // fallback: auto logic
  const next = sorted.find(r =>
    !hasAnyRunData(r) &&
    r.status !== "Complete" &&
    r.status !== "DQ Conflict"
  );

  return next?.id ?? null;
}, [sorted]);

  const currentRace = sorted.find(r => r.id === nextRaceId);

  const visible = sorted.filter(r => {
    if (filter === "All") return true;

    if (filter === "Completed") {
      return r.status === "Complete";
    }

    if (filter === "Pending") {
      return !hasAnyRunData(r);
    }

    if (filter === "Current") {
      if (r.status === "Complete") return false;
      if (r.status === "DQ Conflict") return false;
      return isRaceCurrent(r, nextRaceId);
    }

    return true;
  });

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", padding: 16, color: COLORS.text }}>

      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/logo.png" style={{ height: 48 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>District 11 Soap Box Derby</div>
          <div style={{ color: COLORS.muted }}>Live Race Board</div>
        </div>
      </div>

      {/* NOW RACING */}
      {currentRace && (
        <div style={{
          marginTop: 12,
          background: COLORS.accent,
          color: "#022c22",
          padding: 10,
          borderRadius: 10,
          fontWeight: 800,
          textAlign: "center"
        }}>
          NOW RACING: {currentRace.racer_a || currentRace.slot_a} vs {currentRace.racer_b || currentRace.slot_b}
        </div>
      )}

      {/* TABS */}
      <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
        {["Races", "Standings"].map(t => (
          <div
            key={t}
            onClick={() => setTab(t)}
            style={{
              cursor: "pointer",
              fontWeight: 700,
              color: tab === t ? COLORS.accent : COLORS.muted,
              borderBottom: tab === t ? `2px solid ${COLORS.accent}` : "none"
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* BRACKET */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {["12", "64"].map(b => (
          <button
            key={b}
            onClick={() => setBracketType(b)}
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              background: bracketType === b ? COLORS.accent : "#1f2937",
              color: "#fff",
              border: "none"
            }}
          >
            {b}-Car
          </button>
        ))}
      </div>

      {/* FILTER */}
      {tab === "Races" && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 12 }}>
          {["Current", "Pending", "Completed", "All"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                background: filter === f ? COLORS.accent : "#1f2937",
                color: "#fff",
                border: "none"
              }}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* CONTENT */}
      {tab === "Races" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))",
          gap: 12,
          marginTop: 16
        }}>
          {visible.map(r => {
            const current = isRaceCurrent(r, nextRaceId);

            return (
              <div key={r.id} style={{
                background: COLORS.card,
                border: current ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
                borderRadius: 16,
                padding: 14
              }}
              ref={current ? currentRef : null}
            >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>Race {r.id}</div>
                    <div style={{ color: COLORS.muted }}>{r.round}</div>
                  </div>
                  {current && <div style={{ color: COLORS.accent }}>● CURRENT</div>}
                </div>

                {/* RACERS */}
                {[r.racer_a || r.slot_a, r.racer_b || r.slot_b].map((name, i) => (
                  <div key={i} style={{
                    marginTop: 8,
                    padding: 10,
                    borderRadius: 10,
                    background: r.winner === name ? "#14532d" : "#1f2937",
                    border: `1px solid ${COLORS.border}`,
                    textAlign: "center",
                    fontWeight: 700
                  }}>
                    {name}
                  </div>
                ))}

                {/* DQ */}
                {(r.dq_a || r.dq_b) && (
                  <div style={{
                    marginTop: 10,
                    background: COLORS.red,
                    padding: 8,
                    borderRadius: 8,
                    fontSize: 13
                  }}>
                    {r.dq_a && `A DQ: ${r.dq_reason_a || ""}`}
                    {r.dq_b && ` B DQ: ${r.dq_reason_b || ""}`}
                  </div>
                )}

                {/* TIMES */}
                <div style={{ marginTop: 10, fontSize: 14 }}>
                  Run 1: {r.run1_lane1 ?? "--"} | {r.run1_lane2 ?? "--"}
                  <br />
                  Run 2: {r.run2_lane1 ?? "--"} | {r.run2_lane2 ?? "--"}
                  <br />
                  Winner: {r.winner || "--"}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "Standings" && (
        <div style={{ marginTop: 20 }}>
          {getStandings(bracketType, sorted).map(([place, racer]) => (
            <div key={place} style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 10,
              borderBottom: `1px solid ${COLORS.border}`
            }}>
              <div style={{ fontWeight: 700 }}>{place}</div>
              <div>{racer || "--"}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}