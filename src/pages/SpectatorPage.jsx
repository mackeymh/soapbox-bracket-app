import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchEventSetting, fetchRaces } from "../lib/raceStore";

const DISTRICT_CONFIG = {
  d11: {
    title: "District 11 Soap Box Derby",
    logo: "/logo.png",
    divisions: ["stock", "superstock"],
    schoolCodes: [
      "11X016","11X019","11X041","11X068","11X076","11X078","11X083","11X087",
      "11X089","11X096","11X097","11X103","11X105","11X106","11X108","11X111",
      "11X121","11X127","11X144","11X153","11X160","11X169","11X175","11X180",
      "11X181","11X194","11X370","11X462","11X483","11X498","11X529","11X566",
      "11X567",
    ],
  },
  
  southBronx: {
  title: "South Bronx Soap Box Derby",
  logo: "/logo.png",
  divisions: ["superstock"],
  schoolCodes: [
    "07X018","07X025","07X029","07X043","07X065","07X224","07X277","07X296",
    "07X298","07X369","08X036","08X062","08X071","08X072","08X075","08X107",
    "08X130","08X131","08X140","08X269","08X302","08X333","08X367","08X371",
    "08X392","08X562","09X035","09X042","09X055","09X110","09X219","09X229",
    "09X285","09X361","10X094","10X118","75X176","84X718",
  ],
},

const DIVISION_LABELS = {
  stock: "Stock Division",
  superstock: "Super Stock Division",
};

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

function isRaceCurrent(race, currentRaceId) {
  if (!currentRaceId) return false;
  if (race.status === "Complete") return false;
  if (race.status === "DQ Conflict") return false;

  const isSelectedCurrent = race.id === currentRaceId;
  const isMid = isRaceMidRace(race);
  const isTie = race.status === "Tiebreaker Needed";

  return isSelectedCurrent || isMid || isTie;
}

function getStandings(bracketType, races) {
  const map = {};
  races.forEach((race) => {
    map[race.id] = race;
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

  if (bracketType === "32") {
    return [
      ["1st", map[31]?.winner],
      ["2nd", map[31]?.loser],
      ["3rd", map[36]?.winner],
      ["4th", map[36]?.loser],
      ["5th", map[34]?.winner],
      ["6th", map[34]?.loser],
      ["7th", map[35]?.winner],
      ["8th", map[35]?.loser],
    ];
  }

  if (bracketType === "48") {
    return [
      ["1st", map[47]?.winner],
      ["2nd", map[47]?.loser],
      ["3rd", map[52]?.winner],
      ["4th", map[52]?.loser],
      ["5th", map[50]?.winner],
      ["6th", map[50]?.loser],
      ["7th", map[51]?.winner],
      ["8th", map[51]?.loser],
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
        border: current
          ? `2px solid ${COLORS.accent}`
          : `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 10,
        boxShadow: current ? "0 0 14px rgba(34,197,94,0.28)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
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
        <div style={{ marginTop: 8, background: COLORS.red, padding: "6px 8px", borderRadius: 8, fontSize: 11, lineHeight: 1.25 }}>
          {race.dq_a && `A DQ${race.dq_reason_a ? `: ${race.dq_reason_a}` : ""}`}
          {race.dq_a && race.dq_b ? " | " : ""}
          {race.dq_b && `B DQ${race.dq_reason_b ? `: ${race.dq_reason_b}` : ""}`}
        </div>
      )}

      <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, color: COLORS.muted }}>
        <div style={{ background: "#0f172a", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 6 }}>
          R1: {race.run1_lane1 ?? "--"} | {race.run1_lane2 ?? "--"}
        </div>

        <div style={{ background: "#0f172a", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 6 }}>
          R2: {race.run2_lane1 ?? "--"} | {race.run2_lane2 ?? "--"}
        </div>
      </div>

      <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: COLORS.text }}>
        <div style={{ color: COLORS.muted }}>Winner</div>
        <div style={{ fontWeight: 800 }}>{winner}</div>
      </div>
    </div>
  );
}

export default function SpectatorPage() {
  const { district = "d11" } = useParams();

  const config = DISTRICT_CONFIG[district] || DISTRICT_CONFIG.d11;
  const districtDivisions = DISTRICT_CONFIG[district]?.divisions || ["stock"];

  const [division, setDivision] = useState(districtDivisions[0]);
  const [bracketType, setBracketType] = useState("12");
  const [races, setRaces] = useState([]);
  const [tab, setTab] = useState("Races");
  const [districtCurrentRace, setDistrictCurrentRace] = useState(null);
  const [filter, setFilter] = useState("Current");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const currentRef = useRef(null);

  const activeDivision = districtDivisions.includes(division)
    ? division
    : districtDivisions[0];

  const activeSchoolFilter =
    schoolFilter === "All Schools" || config.schoolCodes.includes(schoolFilter)
      ? schoolFilter
      : "All Schools";

  useEffect(() => {
    const nextDivision = DISTRICT_CONFIG[district]?.divisions?.[0] || "stock";
    setDivision(nextDivision);
    setSchoolFilter("All Schools");
  }, [district]);

  useEffect(() => {
    async function loadSetting() {
      const setting = await fetchEventSetting(district, activeDivision);

      if (setting?.active_bracket_type) {
        setBracketType(setting.active_bracket_type);
      } else {
        setBracketType(activeDivision === "stock" ? "12" : "32");
      }
    }

    loadSetting();
    const intervalId = setInterval(loadSetting, 5000);

    return () => clearInterval(intervalId);
  }, [district, activeDivision]);

  useEffect(() => {
    async function loadDistrictCurrentRace() {
      const divisionOptions = DISTRICT_CONFIG[district]?.divisions || ["stock"];

      for (const divisionOption of divisionOptions) {
        const setting = await fetchEventSetting(district, divisionOption);
        const activeBracket =
          setting?.active_bracket_type || (divisionOption === "stock" ? "12" : "32");

        const divisionRaces = await fetchRaces(
          activeBracket,
          district,
          divisionOption
        );

        const current = divisionRaces.find((race) => race.is_current_override);

        if (current) {
          setDistrictCurrentRace({
            ...current,
            division: divisionOption,
            bracket_type: activeBracket,
          });
          return;
        }
      }

      setDistrictCurrentRace(null);
    }

    loadDistrictCurrentRace();
    const intervalId = setInterval(loadDistrictCurrentRace, 5000);

    return () => clearInterval(intervalId);
  }, [district]);

  useEffect(() => {
    async function loadRaces() {
      const data = await fetchRaces(bracketType, district, activeDivision);
      setRaces(data);
    }

    if (!bracketType || !district || !activeDivision) return;

    loadRaces();
    const intervalId = setInterval(loadRaces, 5000);

    return () => clearInterval(intervalId);
  }, [bracketType, district, activeDivision]);

  const sorted = useMemo(
    () => [...races].sort((a, b) => a.id - b.id),
    [races]
  );

  const currentRaceId = useMemo(() => {
    const override = sorted.find((race) => race.is_current_override);
    if (override) return override.id;

    const next = sorted.find(
      (race) =>
        !hasAnyRunData(race) &&
        race.status !== "Complete" &&
        race.status !== "DQ Conflict"
    );

    return next?.id ?? null;
  }, [sorted]);

  const currentRace = useMemo(
    () => sorted.find((race) => race.id === currentRaceId),
    [sorted, currentRaceId]
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
    return sorted.filter((race) => {
      if (
        config.schoolCodes.length > 0 &&
        !raceMatchesSchool(race, activeSchoolFilter)
      ) {
        return false;
      }

      if (filter === "All") return true;

      if (filter === "Completed") {
        return race.status === "Complete";
      }

      if (filter === "Pending") {
        return !hasAnyRunData(race);
      }

      if (filter === "Current") {
        if (race.status === "Complete") return false;
        if (race.status === "DQ Conflict") return false;
        return isRaceCurrent(race, currentRaceId);
      }

      return true;
    });
  }, [sorted, filter, activeSchoolFilter, currentRaceId, config.schoolCodes.length]);

  const orderedVisible = useMemo(() => {
    if (!currentRace) return visible;

    const currentInVisible = visible.find((race) => race.id === currentRace.id);
    if (!currentInVisible) return visible;

    return [
      currentInVisible,
      ...visible.filter((race) => race.id !== currentRace.id),
    ];
  }, [visible, currentRace]);

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", padding: 12, color: COLORS.text }}>
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
          <img src={config.logo} alt={`${config.title} logo`} style={{ height: 42 }} />

          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>
              {config.title}
            </div>
            <div style={{ color: COLORS.muted, fontSize: 13 }}>
              Live Race Board
            </div>
          </div>
        </div>

        {districtCurrentRace && (
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
            NOW RACING: {DIVISION_LABELS[districtCurrentRace.division]} — Race{" "}
            {districtCurrentRace.id}
            <br />
            {districtCurrentRace.racer_a || districtCurrentRace.slot_a} vs{" "}
            {districtCurrentRace.racer_b || districtCurrentRace.slot_b}
          </div>
        )}

        <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
          {["Races", "Standings"].map((item) => (
            <div
              key={item}
              onClick={() => setTab(item)}
              style={{
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                color: tab === item ? COLORS.accent : COLORS.muted,
                borderBottom: tab === item ? `2px solid ${COLORS.accent}` : "none",
                paddingBottom: 4,
              }}
            >
              {item}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 12, flexWrap: "wrap" }}>
          {districtDivisions.map((item) => (
            <button
              key={item}
              onClick={() => {
                setDivision(item);
                setSchoolFilter("All Schools");
              }}
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                background: activeDivision === item ? COLORS.accent : COLORS.chip,
                color: "#fff",
                border: "none",
                whiteSpace: "nowrap",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {DIVISION_LABELS[item]}
            </button>
          ))}

          {activeDivision === "superstock" && (
            <div
              style={{
                padding: "7px 12px",
                borderRadius: 999,
                background: "#0f172a",
                color: COLORS.muted,
                border: `1px solid ${COLORS.border}`,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {bracketType}-Car Bracket
            </div>
          )}
        </div>

        {tab === "Races" && (
          <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 12, flexWrap: "wrap" }}>
            {["Current", "Pending", "Completed", "All"].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: filter === item ? COLORS.accent : COLORS.chip,
                  color: "#fff",
                  border: "none",
                  whiteSpace: "nowrap",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {item}
              </button>
            ))}

            {config.schoolCodes.length > 0 && (
              <select
                value={activeSchoolFilter}
                onChange={(event) => setSchoolFilter(event.target.value)}
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
                {config.schoolCodes.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {tab === "Races" && (
          <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
            {orderedVisible.map((race) => {
              const current = currentRace ? race.id === currentRace.id : false;

              return (
                <RaceRow
                  key={`${district}-${activeDivision}-${bracketType}-${race.id}`}
                  race={race}
                  current={current}
                  currentRef={currentRef}
                />
              );
            })}
          </div>
        )}

        {tab === "Standings" && (
          <div style={{ marginTop: 18, display: "grid", gap: 8 }}>
            <div style={{ color: COLORS.muted, fontSize: 13, fontWeight: 700, marginBottom: 2 }}>
              {DIVISION_LABELS[activeDivision]}{" "}
              {activeDivision === "superstock" ? `— ${bracketType}-Car Bracket` : ""}
            </div>

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
                <div style={{ fontWeight: 700, fontSize: 14, textAlign: "right", lineHeight: 1.2 }}>
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