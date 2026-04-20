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
  panel: "#111827",
  row: "#182233",
  border: "#334155",
  text: "#f8fafc",
  muted: "#94a3b8",
  accent: "#22c55e",
  accentDark: "#14532d",
  red: "#7f1d1d",
  chip: "#1f2937",
};

function schoolCodeToShort(code) {
  return code.replace("11X", "").replace(/^0+/, "");
}

function normalizeCarLabel(label = "") {
  const [schoolPart = "", carPart = ""] = label.split("-");
  const normalizedSchool = schoolPart.replace(/^0+/, "");
  return carPart ? `${normalizedSchool}-${carPart}` : normalizedSchool;
}

function raceMatchesSchool(race, selectedSchool) {
  if (selectedSchool === "All Schools") return true;

  const shortCode = schoolCodeToShort(selectedSchool);
  const racerA = normalizeCarLabel(race.racer_a || "");
  const racerB = normalizeCarLabel(race.racer_b || "");

  return (
    racerA.startsWith(`${shortCode}-`) ||
    racerB.startsWith(`${shortCode}-`)
  );
}

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
  if (race.status === "Complete") return false;
  if (race.status === "DQ Conflict") return false;

  const isNext = race.id === nextRaceId;
  const isMid = isRaceMidRace(race);
  const isTie = race.status === "Tiebreaker Needed";

  return isNext || isMid || isTie;
}

function getStandings(bracketType, races) {
  const map = {};
  races.forEach((r) => {
    map[r.id] = r;
  });

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

function RaceRow({ race, current, currentRef }) {
  const racerA = race.racer_a || race.slot_a;
  const racerB = race.racer_b || race.slot_b;
  const winner = race.winner || "--";

  return (
    <div
      ref={current ? currentRef : null}
      style={{
        background: current ? "#12261a" : COLORS.row,
        border: current ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 10,
        boxShadow: current ? "0 0 14px rgba(34,197,94,0.28)" : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Race {race.id}</div>
          <div style={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.15 }}>
            {race.round}
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: current ? COLORS.accent : COLORS.muted,
            whiteSpace: "nowrap",
          }}
        >
          {current ? "● LIVE" : race.status || "Pending"}
        </div>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            background: winner === racerA ? COLORS.accentDark : COLORS.chip,
            border: `1px solid ${COLORS.border}`,
            fontWeight: 700,
            fontSize: 14,
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          {racerA}
        </div>

        <div
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            background: winner === racerB ? COLORS.accentDark : COLORS.chip,
            border: `1px solid ${COLORS.border}`,
            fontWeight: 700,
            fontSize: 14,
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          {racerB}
        </div>
      </div>

      {(race.dq_a || race.dq_b) && (
        <div
          style={{
            marginTop: 8,
            background: COLORS.red,
            padding: "6px 8px",
            borderRadius: 8,
            fontSize: 11,
            lineHeight: 1.25,
          }}
        >
          {race.dq_a && `A DQ${race.dq_reason_a ? `: ${race.dq_reason_a}` : ""}`}
          {race.dq_a && race.dq_b ? " | " : ""}
          {race.dq_b && `B DQ${race.dq_reason_b ? `: ${race.dq_reason_b}` : ""}`}
        </div>
      )}

      <div
        style={{
          marginTop: 8,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
          fontSize: 11,
          color: COLORS.muted,
        }}
      >
        <div
          style={{
            background: "#0f172a",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: 6,
          }}
        >
          R1: {race.run1_lane1 ?? "--"} | {race.run1_lane2 ?? "--"}
        </div>
        <div
          style={{
            background: "#0f172a",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            padding: 6,
          }}
        >
          R2: {race.run2_lane1 ?? "--"} | {race.run2_lane2 ?? "--"}
        </div>
      </div>

      <div
        style={{
          marginTop: 8,
          display: "flex",
          justifyContent: "space-between",
          gap: 8,
          fontSize: 12,
          color: COLORS.text,
        }}
      >
        <div style={{ color: COLORS.muted }}>Winner</div>
        <div style={{ fontWeight: 800 }}>{winner}</div>
      </div>
    </div>
  );
}

export default function SpectatorPage() {
  const [races, setRaces] = useState([]);
  const [bracketType, setBracketType] = useState("12");
  const [tab, setTab] = useState("Races");
  const [filter, setFilter] = useState("Current");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const currentRef = useRef(null);

  useEffect(() => {
    async function load() {
      const data = await fetchRaces(bracketType);
      setRaces(data);
    }

    load();
    const intervalId = setInterval(load, 5000);
    return () => clearInterval(intervalId);
  }, [bracketType]);

  const sorted = useMemo(
    () => [...races].sort((a, b) => a.id - b.id),
    [races]
  );

  const nextRaceId = useMemo(() => {
    const override = sorted.find((r) => r.is_current_override);
    if (override) return override.id;

    const next = sorted.find(
      (r) =>
        !hasAnyRunData(r) &&
        r.status !== "Complete" &&
        r.status !== "DQ Conflict"
    );

    return next?.id ?? null;
  }, [sorted]);

  const currentRace = useMemo(
    () => sorted.find((r) => r.id === nextRaceId),
    [sorted, nextRaceId]
  );

  useEffect(() => {
    if (currentRef.current && tab === "Races" && filter === "Current") {
      currentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentRace, tab, filter]);

  const visible = useMemo(() => {
    return sorted.filter((r) => {
      if (!raceMatchesSchool(r, schoolFilter)) return false;

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
  }, [sorted, filter, schoolFilter, nextRaceId]);

  const orderedVisible = useMemo(() => {
    if (!currentRace) return visible;

    const currentInVisible = visible.find((r) => r.id === currentRace.id);
    if (!currentInVisible) return visible;

    return [
      currentInVisible,
      ...visible.filter((r) => r.id !== currentRace.id),
    ];
  }, [visible, currentRace]);

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        padding: 12,
        color: COLORS.text,
      }}
    >
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 18,
          padding: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="District 11 logo" style={{ height: 42 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>
              District 11 Soap Box Derby
            </div>
            <div style={{ color: COLORS.muted, fontSize: 13 }}>
              Live Race Board
            </div>
          </div>
        </div>

        {currentRace && (
          <div
            style={{
              marginTop: 12,
              background: COLORS.accent,
              color: "#022c22",
              padding: 10,
              borderRadius: 12,
              fontWeight: 800,
              textAlign: "center",
              fontSize: 14,
              lineHeight: 1.25,
            }}
          >
            NOW RACING: {currentRace.racer_a || currentRace.slot_a} vs{" "}
            {currentRace.racer_b || currentRace.slot_b}
          </div>
        )}

        <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
          {["Races", "Standings"].map((t) => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                color: tab === t ? COLORS.accent : COLORS.muted,
                borderBottom:
                  tab === t ? `2px solid ${COLORS.accent}` : "none",
                paddingBottom: 4,
              }}
            >
              {t}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {["12", "64"].map((b) => (
            <button
              key={b}
              onClick={() => setBracketType(b)}
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                background: bracketType === b ? COLORS.accent : COLORS.chip,
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {b}-Car
            </button>
          ))}
        </div>

        {tab === "Races" && (
          <div
            style={{
              display: "flex",
              gap: 8,
              overflowX: "auto",
              marginTop: 12,
              flexWrap: "wrap",
            }}
          >
            {["Current", "Pending", "Completed", "All"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: filter === f ? COLORS.accent : COLORS.chip,
                  color: "#fff",
                  border: "none",
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {f}
              </button>
            ))}

            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                background: COLORS.chip,
                color: "#fff",
                border: "none",
                whiteSpace: "nowrap",
                fontWeight: 700,
                fontSize: 13,
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
        )}

        {tab === "Races" && (
          <div
            style={{
              display: "grid",
              gap: 10,
              marginTop: 14,
            }}
          >
            {orderedVisible.map((r) => {
              const current = currentRace ? r.id === currentRace.id : false;

              return (
                <RaceRow
                  key={r.id}
                  race={r}
                  current={current}
                  currentRef={currentRef}
                />
              );
            })}
          </div>
        )}

        {tab === "Standings" && (
          <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
            {getStandings(bracketType, sorted).map(([place, racer]) => (
              <div
                key={place}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  padding: 10,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 12,
                  background: COLORS.row,
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 14 }}>{place}</div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    textAlign: "right",
                    lineHeight: 1.2,
                  }}
                >
                  {racer || "--"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}