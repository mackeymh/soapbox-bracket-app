import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchEventSetting, fetchRaces } from "../lib/raceStore";

const DISTRICT_CONFIG = {
  d11: {
    title: "District 11 Soap Box Derby",
    logo: "/logo.png",
    divisions: ["stock", "superstock"],
    schoolCodes: [
      "11X016", "11X019", "11X041", "11X068", "11X076", "11X078", "11X083",
      "11X087", "11X089", "11X096", "11X097", "11X103", "11X105", "11X106",
      "11X108", "11X111", "11X121", "11X127", "11X144", "11X153", "11X160",
      "11X169", "11X175", "11X180", "11X181", "11X194", "11X370", "11X462",
      "11X483", "11X498", "11X529", "11X566", "11X567",
    ],
  },
  southBronx: {
    title: "South Bronx Soap Box Derby",
    logo: "/logo.png",
    divisions: ["superstock"],
    schoolCodes: [
      "07X018", "07X025", "07X029", "07X043", "07X065", "07X224", "07X277",
      "07X296", "07X298", "07X369", "08X036", "08X062", "08X071", "08X072",
      "08X075", "08X107", "08X130", "08X131", "08X140", "08X269", "08X302",
      "08X333", "08X367", "08X371", "08X392", "08X562", "09X035", "09X042",
      "09X055", "09X110", "09X219", "09X229", "09X285", "09X361", "10X094",
      "10X118", "75X176", "84X718",
    ],
  },
};

const DIVISION_LABELS = {
  stock: "Stock Division",
  superstock: "Super Stock Division",
};

const COLORS = {
  bg: "#07111f",
  bg2: "#0f172a",
  panel: "#0f1b2d",
  card: "#0b1628",
  border: "#334155",
  text: "#f8fafc",
  muted: "#94a3b8",
  muted2: "#cbd5e1",
  accent: "#16a34a",
  accentDark: "#14532d",
  accentSoft: "rgba(34,197,94,0.16)",
  yellow: "#facc15",
  yellowDark: "#713f12",
  red: "#ef4444",
  redDark: "#7f1d1d",
  chip: "#1f2937",
};

const BRACKET_LAYOUTS = {
  12: [
    { label: "Play-In Round", raceIds: [1, 2, 3, 4] },
    { label: "Quarterfinals", raceIds: [5, 6, 7, 8] },
    { label: "Semifinals", raceIds: [9, 10] },
    { label: "Final", raceIds: [11] },
    { label: "Placements", raceIds: [12, 13, 14, 15, 16] },
  ],
  32: [
    { label: "Opening Round", raceIds: Array.from({ length: 16 }, (_, i) => i + 1) },
    { label: "Round of 16", raceIds: Array.from({ length: 8 }, (_, i) => i + 17) },
    { label: "Quarterfinals", raceIds: [25, 26, 27, 28] },
    { label: "Semifinals", raceIds: [29, 30] },
    { label: "Final", raceIds: [31] },
    { label: "Placements", raceIds: [32, 33, 34, 35, 36] },
  ],
  48: [
    { label: "Play-In Round", raceIds: Array.from({ length: 16 }, (_, i) => i + 1) },
    { label: "Round of 32", raceIds: Array.from({ length: 16 }, (_, i) => i + 17) },
    { label: "Sweet 16", raceIds: Array.from({ length: 8 }, (_, i) => i + 33) },
    { label: "Quarterfinals", raceIds: [41, 42, 43, 44] },
    { label: "Semifinals", raceIds: [45, 46] },
    { label: "Final", raceIds: [47] },
    { label: "Placements", raceIds: [48, 49, 50, 51, 52] },
  ],
  64: [
    { label: "Opening Round", raceIds: Array.from({ length: 32 }, (_, i) => i + 1) },
    { label: "Round of 32", raceIds: Array.from({ length: 16 }, (_, i) => i + 33) },
    { label: "Sweet 16", raceIds: Array.from({ length: 8 }, (_, i) => i + 49) },
    { label: "Quarterfinals", raceIds: [57, 58, 59, 60] },
    { label: "Semifinals", raceIds: [61, 62] },
    { label: "Final", raceIds: [63] },
    { label: "Placements", raceIds: [64, 65, 66, 67, 68] },
  ],
};

function schoolCodeToShort(code) {
  return String(code || "").replace(/^\d{2}X/, "").replace(/^0+/, "");
}

function normalizeCarLabel(label = "") {
  const [schoolPart = "", carPart = ""] = String(label).split("-");
  const normalizedSchool = schoolPart.replace(/^0+/, "");
  return carPart ? `${normalizedSchool}-${carPart}` : normalizedSchool;
}

function selectedSchoolShort(selectedSchool) {
  if (!selectedSchool || selectedSchool === "All Schools") return null;
  return schoolCodeToShort(selectedSchool);
}

function racerMatchesSchool(racer, selectedSchool) {
  const shortCode = selectedSchoolShort(selectedSchool);
  if (!shortCode) return false;
  return normalizeCarLabel(racer || "").startsWith(`${shortCode}-`);
}

function getRacerA(race) {
  return race?.racer_a || race?.slot_a || "--";
}

function getRacerB(race) {
  return race?.racer_b || race?.slot_b || "--";
}

function raceMatchesSchool(race, selectedSchool) {
  if (!race) return false;
  if (selectedSchool === "All Schools") return true;
  return racerMatchesSchool(getRacerA(race), selectedSchool) || racerMatchesSchool(getRacerB(race), selectedSchool);
}

function sameRace(a, b) {
  return !!a && !!b && a.id === b.id && a.division === b.division && a.bracket_type === b.bracket_type;
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatTime(value) {
  const n = toNumber(value);
  return n === null ? "--.---" : n.toFixed(3);
}

function hasAnyRunData(race) {
  return race.run1_lane1 != null || race.run1_lane2 != null || race.run2_lane1 != null || race.run2_lane2 != null;
}


function isRaceMidRace(race) {
  const run1 = race.run1_lane1 != null || race.run1_lane2 != null;
  const run2 = race.run2_lane1 != null || race.run2_lane2 != null;
  return run1 && !run2;
}

function getRaceTimes(race) {
  const aRun1 = toNumber(race.run1_lane1);
  const bRun1 = toNumber(race.run1_lane2);
  const aRun2 = toNumber(race.run2_lane2);
  const bRun2 = toNumber(race.run2_lane1);

  const totalA =
    race.total_a != null ? toNumber(race.total_a) :
    aRun1 != null && aRun2 != null ? aRun1 + aRun2 : null;

  const totalB =
    race.total_b != null ? toNumber(race.total_b) :
    bRun1 != null && bRun2 != null ? bRun1 + bRun2 : null;

  return { aRun1, bRun1, aRun2, bRun2, totalA, totalB };
}

function getWinnerSide(race) {
  const racerA = getRacerA(race);
  const racerB = getRacerB(race);
  const { totalA, totalB } = getRaceTimes(race);

  if (race.winner === racerA) return "A";
  if (race.winner === racerB) return "B";

  if (totalA != null && totalB != null) {
    if (totalA < totalB) return "A";
    if (totalB < totalA) return "B";
  }

  return null;
}

function getStatusText(race, isOnTrack, isUpNext) {
  if (isOnTrack) return "ON THE TRACK";
  if (isUpNext) return "UP NEXT";
  if (race.status === "Complete") return "COMPLETE";
  if (race.status === "Tiebreaker Needed") return "TIEBREAKER";
  if (race.status === "DQ Conflict") return "DQ REVIEW";
  if (isRaceMidRace(race)) return "IN PROGRESS";
  return race.status || "PENDING";
}

function getStatusColor(race, isOnTrack, isUpNext) {
  if (isOnTrack) return COLORS.accent;
  if (isUpNext) return COLORS.yellow;
  if (race.status === "Complete") return COLORS.accent;
  if (race.status === "Tiebreaker Needed") return COLORS.yellow;
  if (race.status === "DQ Conflict") return COLORS.red;
  if (isRaceMidRace(race)) return COLORS.yellow;
  return COLORS.muted;
}

function getNextRaceId(bracketType, raceId) {
  const type = String(bracketType);

  if (type === "12") {
    if (raceId >= 1 && raceId <= 4) return raceId + 4;
    if (raceId === 5 || raceId === 6) return 9;
    if (raceId === 7 || raceId === 8) return 10;
    if (raceId === 9 || raceId === 10) return 11;
  }

  if (type === "32") {
    if (raceId >= 1 && raceId <= 16) return 17 + Math.floor((raceId - 1) / 2);
    if (raceId >= 17 && raceId <= 24) return 25 + Math.floor((raceId - 17) / 2);
    if (raceId >= 25 && raceId <= 28) return 29 + Math.floor((raceId - 25) / 2);
    if (raceId === 29 || raceId === 30) return 31;
  }

  if (type === "48") {
    if (raceId >= 1 && raceId <= 16) return raceId + 16;
    if (raceId >= 17 && raceId <= 32) return 33 + Math.floor((raceId - 17) / 2);
    if (raceId >= 33 && raceId <= 40) return 41 + Math.floor((raceId - 33) / 2);
    if (raceId >= 41 && raceId <= 44) return 45 + Math.floor((raceId - 41) / 2);
    if (raceId === 45 || raceId === 46) return 47;
  }

  if (type === "64") {
    if (raceId >= 1 && raceId <= 32) return 33 + Math.floor((raceId - 1) / 2);
    if (raceId >= 33 && raceId <= 48) return 49 + Math.floor((raceId - 33) / 2);
    if (raceId >= 49 && raceId <= 56) return 57 + Math.floor((raceId - 49) / 2);
    if (raceId >= 57 && raceId <= 60) return 61 + Math.floor((raceId - 57) / 2);
    if (raceId === 61 || raceId === 62) return 63;
  }

  return null;
}

function getPlacementLabel(bracketType, raceId) {
  const labels = {
    12: {
      12: "5th / 6th Qualifier",
      13: "7th / 8th Qualifier",
      14: "5th / 6th",
      15: "7th / 8th",
      16: "3rd / 4th",
    },
    32: {
      32: "5th / 6th Qualifier",
      33: "7th / 8th Qualifier",
      34: "5th / 6th",
      35: "7th / 8th",
      36: "3rd / 4th",
    },
    48: {
      48: "5th / 6th Qualifier",
      49: "7th / 8th Qualifier",
      50: "5th / 6th",
      51: "7th / 8th",
      52: "3rd / 4th",
    },
    64: {
      64: "5th / 6th Qualifier",
      65: "7th / 8th Qualifier",
      66: "5th / 6th",
      67: "7th / 8th",
      68: "3rd / 4th",
    },
  };

  return labels[String(bracketType)]?.[raceId] || "Placement Race";
}

function getStandings(bracketType, races) {
  const map = {};

  races.forEach((race) => {
    map[race.id] = race;
  });

  const type = String(bracketType);

  if (type === "12") {
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

  if (type === "32") {
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

  if (type === "48") {
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

function getSchoolPathRaceIds(races, selectedSchool) {
  const path = new Set();

  if (!selectedSchool || selectedSchool === "All Schools") {
    return path;
  }

  const raceMap = {};

  races.forEach((race) => {
    raceMap[race.id] = race;
  });

  races.forEach((race) => {
    if (!raceMatchesSchool(race, selectedSchool)) return;

    path.add(race.id);

    let current = race;
    let guard = 0;

    while (current && guard < 12) {
      guard += 1;

      const nextId = getNextRaceId(current.bracket_type, current.id);

      if (!nextId || !raceMap[nextId]) break;

      path.add(nextId);
      current = raceMap[nextId];
    }
  });

  return path;
}

function getRoundOffset(bracketType, roundIndex) {
  const type = String(bracketType);

  if (type === "12") {
    return [0, 0.5, 1.5, 3.5][roundIndex] || 0;
  }

  if (type === "48") {
    return [0, 0, 0.5, 1.5, 3.5, 7.5][roundIndex] || 0;
  }

  return (Math.pow(2, roundIndex) - 1) / 2;
}

function getBracketPosition(bracketType, roundIndex, matchIndex) {
  const cardHeight = 156;
  const baseGap = 36;
  const unit = cardHeight + baseGap;
  const x = roundIndex * (280 + 120);
  const type = String(bracketType);

  let y;

  if (type === "12") {
    const positions = {
      0: [0, 1, 2, 3],
      1: [0, 1, 2, 3],
      2: [0.5, 2.5],
      3: [1.5],
      4: [0, 1, 2, 3, 4],
    };

    y = (positions[roundIndex]?.[matchIndex] ?? matchIndex) * unit;
  } else if (type === "48") {
    const positions = {
      0: Array.from({ length: 16 }, (_, i) => i),
      1: Array.from({ length: 16 }, (_, i) => i),
      2: Array.from({ length: 8 }, (_, i) => i * 2 + 0.5),
      3: Array.from({ length: 4 }, (_, i) => i * 4 + 1.5),
      4: Array.from({ length: 2 }, (_, i) => i * 8 + 3.5),
      5: [7.5],
    };

    y = (positions[roundIndex]?.[matchIndex] ?? matchIndex) * unit;
  } else {
    const verticalSpacing = unit * Math.pow(2, roundIndex);
    const offset = getRoundOffset(type, roundIndex) * unit;
    y = matchIndex * verticalSpacing + offset;
  }

  return {
    x,
    y,
    width: 280,
    height: cardHeight,
  };
}

export default function SpectatorPage() {
  const { district = "d11" } = useParams();

  const config = DISTRICT_CONFIG[district] || DISTRICT_CONFIG.d11;
  const districtDivisions = config.divisions;

  const [races, setRaces] = useState([]);
  const [tab, setTab] = useState("Races");
  const [division, setDivision] = useState("All");
  const [raceFilter, setRaceFilter] = useState("All");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const [focusOnly, setFocusOnly] = useState(false);

  const currentRef = useRef(null);

  const loadRaces = useCallback(async () => {
    let all = [];

    for (const div of districtDivisions) {
      const setting = await fetchEventSetting(district, div);
      const bracket = setting?.active_bracket_type || (div === "stock" ? "12" : "32");
      const data = await fetchRaces(bracket, district, div);

      const tagged = (data || []).map((race) => ({
        ...race,
        division: div,
        bracket_type: bracket,
      }));

      all = [...all, ...tagged];
    }

    setRaces(all);
  }, [district, districtDivisions]);

  useEffect(() => {
    const load = async () => {
      await loadRaces();
    };
    load();
    
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [loadRaces]);

  const sorted = useMemo(() => {
    return [...races].sort((a, b) => {
      if (a.division !== b.division) return a.division.localeCompare(b.division);
      return a.id - b.id;
    });
  }, [races]);

  const scoped = useMemo(() => {
    if (division === "All") return sorted;
    return sorted.filter((race) => race.division === division);
  }, [sorted, division]);

  const currentRace = useMemo(() => {
    return scoped.find((race) => race.is_current_override) || null;
  }, [scoped]);

  const nextRace = useMemo(() => {
    return (
      scoped.find(
        (race) =>
          !sameRace(race, currentRace) &&
          race.status !== "Complete" &&
          race.status !== "DQ Conflict" &&
          !hasAnyRunData(race),
      ) || null
    );
  }, [scoped, currentRace]);

  const activeBracketDivision = useMemo(() => {
    if (division !== "All") return division;
    return currentRace?.division || districtDivisions[0];
  }, [division, currentRace, districtDivisions]);

  const bracketRaces = useMemo(() => {
    return sorted.filter((race) => race.division === activeBracketDivision);
  }, [sorted, activeBracketDivision]);

  const activeBracketType = bracketRaces[0]?.bracket_type || "12";

  const schoolIsActive = schoolFilter !== "All Schools";

  const schoolRaceCount = useMemo(() => {
    if (!schoolIsActive) return 0;
    return scoped.filter((race) => raceMatchesSchool(race, schoolFilter)).length;
  }, [scoped, schoolFilter, schoolIsActive]);

  const stats = useMemo(() => {
    return {
      total: scoped.length,
      completed: scoped.filter((race) => race.status === "Complete").length,
      live: scoped.filter((race) => race.is_current_override || isRaceMidRace(race)).length,
      pending: scoped.filter(
        (race) =>
          race.status !== "Complete" &&
          race.status !== "DQ Conflict" &&
          !race.is_current_override &&
          !isRaceMidRace(race),
      ).length,
    };
  }, [scoped]);

  const visible = useMemo(() => {
    return scoped.filter((race) => {
      const schoolMatch = raceMatchesSchool(race, schoolFilter);

      if (focusOnly && schoolIsActive && !schoolMatch) return false;

      if (raceFilter === "On Track") return sameRace(race, currentRace);
      if (raceFilter === "Up Next") return sameRace(race, nextRace);
      if (raceFilter === "In Progress") return race.is_current_override || isRaceMidRace(race);
      if (raceFilter === "Pending") return !hasAnyRunData(race);
      if (raceFilter === "Completed") return race.status === "Complete";

      return true;
    });
  }, [scoped, schoolFilter, focusOnly, schoolIsActive, raceFilter, currentRace, nextRace]);

  const ordered = useMemo(() => {
    return [...visible].sort((a, b) => {
      const aSchool = schoolIsActive && raceMatchesSchool(a, schoolFilter);
      const bSchool = schoolIsActive && raceMatchesSchool(b, schoolFilter);

      if (aSchool !== bSchool) return aSchool ? -1 : 1;
      if (sameRace(a, currentRace) !== sameRace(b, currentRace)) {
        return sameRace(a, currentRace) ? -1 : 1;
      }
      if (sameRace(a, nextRace) !== sameRace(b, nextRace)) {
        return sameRace(a, nextRace) ? -1 : 1;
      }
      if (a.division !== b.division) return a.division.localeCompare(b.division);
      return a.id - b.id;
    });
  }, [visible, schoolFilter, schoolIsActive, currentRace, nextRace]);

  useEffect(() => {
    if (currentRef.current && tab === "Races") {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [currentRace, tab]);

  return (
    <div style={styles.page}>
      <style>
        {`
          @media (max-width: 900px) {
            .spectator-main {
              grid-template-columns: 1fr !important;
            }

            .race-grid {
              grid-template-columns: 1fr !important;
            }

            .controls-grid {
              grid-template-columns: 1fr !important;
            }

            .right-rail {
              position: static !important;
            }
          }

          @media (max-width: 640px) {
            .banner-title {
              font-size: 24px !important;
            }

            .banner-match {
              font-size: 18px !important;
            }

            .card-header {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .times {
              justify-content: flex-start !important;
            }
          }
        `}
      </style>

      <div style={styles.container}>
        <header style={styles.header}>
          <img src={config.logo} alt={`${config.title} logo`} style={styles.logo} />
          <div>
            <div style={styles.kicker}>SOAP BOX DERBY LIVE</div>
            <h1 style={styles.title}>{config.title}</h1>
            <div style={styles.subtitle}>School-centered race tracker</div>
          </div>
        </header>

        <section style={styles.banner}>
          {currentRace ? (
            <>
              <div style={styles.bannerLabel}>ON THE TRACK</div>
              <div className="banner-title" style={styles.bannerTitle}>
                Race {currentRace.id} · {DIVISION_LABELS[currentRace.division]}
              </div>
              <div className="banner-match" style={styles.bannerMatch}>
                {getRacerA(currentRace)} vs {getRacerB(currentRace)}
              </div>
            </>
          ) : (
            <>
              <div style={styles.bannerLabel}>ON THE TRACK</div>
              <div className="banner-title" style={styles.bannerTitle}>
                Waiting for race control
              </div>
            </>
          )}
        </section>

        <section style={styles.controls}>
          <div style={styles.tabRow}>
            {["Races", "Bracket", "Standings"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                style={tab === item ? styles.activeTab : styles.tab}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="controls-grid" style={styles.controlsGrid}>
            <label style={styles.field}>
              <span style={styles.label}>School</span>
              <select
                value={schoolFilter}
                onChange={(event) => setSchoolFilter(event.target.value)}
                style={styles.primarySelect}
              >
                <option value="All Schools">All Schools</option>
                {config.schoolCodes.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Division</span>
              <select
                value={division}
                onChange={(event) => setDivision(event.target.value)}
                style={styles.select}
              >
                <option value="All">All Divisions</option>
                {districtDivisions.map((div) => (
                  <option key={div} value={div}>
                    {DIVISION_LABELS[div]}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.field}>
              <span style={styles.label}>Races</span>
              <select
                value={raceFilter}
                onChange={(event) => setRaceFilter(event.target.value)}
                style={styles.select}
              >
                <option value="All">All Races</option>
                <option value="On Track">On Track</option>
                <option value="Up Next">Up Next</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select>
            </label>

            <label
              style={{
                ...styles.focusToggle,
                opacity: schoolIsActive ? 1 : 0.55,
              }}
            >
              <input
                type="checkbox"
                checked={focusOnly}
                disabled={!schoolIsActive}
                onChange={(event) => setFocusOnly(event.target.checked)}
              />
              Focus only on this school
            </label>
          </div>

          {schoolIsActive && (
            <div style={styles.schoolSummary}>
              <strong>{schoolFilter}</strong> appears in {schoolRaceCount} race
              {schoolRaceCount === 1 ? "" : "s"}.
              {focusOnly
                ? " Focus Mode is showing only this school."
                : " Other races remain visible but your school appears first."}
            </div>
          )}
        </section>

        <main className="spectator-main" style={styles.main}>
          <section>
            {tab === "Races" && (
              <div className="race-grid" style={styles.grid}>
                {ordered.map((race) => {
                  const schoolMatch = schoolIsActive && raceMatchesSchool(race, schoolFilter);
                  const dimmed = schoolIsActive && !schoolMatch && !focusOnly;

                  return (
                    <RaceCard
                      key={`${race.division}-${race.bracket_type}-${race.id}`}
                      race={race}
                      isOnTrack={sameRace(race, currentRace)}
                      isUpNext={sameRace(race, nextRace)}
                      selectedSchool={schoolFilter}
                      isSchoolMatch={schoolMatch}
                      isDimmed={dimmed}
                      cardRef={sameRace(race, currentRace) ? currentRef : null}
                    />
                  );
                })}

                {ordered.length === 0 && (
                  <div style={styles.emptyPanel}>No races match the selected filters.</div>
                )}
              </div>
            )}

            {tab === "Bracket" && (
              <BracketView
                races={bracketRaces}
                selectedSchool={schoolFilter}
                focusOnly={focusOnly}
              />
            )}

            {tab === "Standings" && (
              <StandingsView
                bracketType={activeBracketType}
                races={bracketRaces}
                selectedSchool={schoolFilter}
                division={activeBracketDivision}
              />
            )}
          </section>

          <aside className="right-rail" style={styles.rail}>
            <div style={styles.sidePanel}>
              <div style={styles.sideTitle}>UP NEXT</div>
              {nextRace ? (
                <>
                  <div style={styles.nextTitle}>Race {nextRace.id}</div>
                  <div style={styles.nextMatch}>
                    {getRacerA(nextRace)} vs {getRacerB(nextRace)}
                  </div>
                  <div style={styles.nextMeta}>
                    {DIVISION_LABELS[nextRace.division]} · {nextRace.bracket_type}-Car
                  </div>
                </>
              ) : (
                <div style={styles.emptyText}>No upcoming race selected.</div>
              )}
            </div>

            <div style={styles.sidePanel}>
              <div style={styles.sideTitle}>EVENT STATS</div>
              <div style={styles.statsGrid}>
                <Stat label="Total" value={stats.total} />
                <Stat label="Done" value={stats.completed} />
                <Stat label="Live" value={stats.live} />
                <Stat label="Pending" value={stats.pending} />
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}

function RaceCard({
  race,
  isOnTrack,
  isUpNext,
  selectedSchool,
  isSchoolMatch,
  isDimmed,
  cardRef,
}) {
  const { aRun1, bRun1, aRun2, bRun2, totalA, totalB } = getRaceTimes(race);
  const winner = getWinnerSide(race);

  const racerA = getRacerA(race);
  const racerB = getRacerB(race);

  const aSchool = racerMatchesSchool(racerA, selectedSchool);
  const bSchool = racerMatchesSchool(racerB, selectedSchool);

  const statusText = getStatusText(race, isOnTrack, isUpNext);
  const statusColor = getStatusColor(race, isOnTrack, isUpNext);

  return (
    <article
      ref={cardRef}
      style={{
        ...styles.card,
        opacity: isDimmed ? 0.38 : 1,
        border: isOnTrack
          ? `2px solid ${COLORS.accent}`
          : isUpNext
            ? `2px solid ${COLORS.yellow}`
            : isSchoolMatch
              ? `2px solid ${COLORS.accent}`
              : `1px solid ${COLORS.border}`,
        boxShadow: isOnTrack
          ? "0 0 22px rgba(34,197,94,0.35)"
          : isUpNext
            ? "0 0 16px rgba(250,204,21,0.25)"
            : isSchoolMatch
              ? "0 0 18px rgba(34,197,94,0.18)"
              : "none",
      }}
    >
      {isSchoolMatch && selectedSchool !== "All Schools" && (
  <div style={styles.schoolBadge}>
    ⭐ Following {selectedSchool}
  </div>
)}

      <div className="card-header" style={styles.cardHeader}>
        <div>
          <div style={styles.raceTitle}>Race {race.id}</div>
          <div style={styles.meta}>
            {DIVISION_LABELS[race.division]} · {race.bracket_type}-Car · {race.round}
          </div>
        </div>

        <div
          style={{
            ...styles.status,
            color: statusColor,
            borderColor: statusColor,
          }}
        >
          {statusText}
        </div>
      </div>

      <CompetitorRow
        name={racerA}
        run1={aRun1}
        run2={aRun2}
        total={totalA}
        isWinner={winner === "A"}
        isSchool={aSchool}
      />

      <CompetitorRow
        name={racerB}
        run1={bRun1}
        run2={bRun2}
        total={totalB}
        isWinner={winner === "B"}
        isSchool={bSchool}
      />

      {winner && (
        <div style={styles.winner}>
          Winner: {winner === "A" ? racerA : racerB}
        </div>
      )}

      {(race.dq_a || race.dq_b || race.bye_for) && (
        <div style={styles.alert}>
          {race.bye_for && `BYE: Racer ${race.bye_for} advances`}
          {race.bye_for && (race.dq_a || race.dq_b) ? " · " : ""}
          {race.dq_a && `A DQ${race.dq_reason_a ? `: ${race.dq_reason_a}` : ""}`}
          {race.dq_a && race.dq_b ? " · " : ""}
          {race.dq_b && `B DQ${race.dq_reason_b ? `: ${race.dq_reason_b}` : ""}`}
        </div>
      )}
    </article>
  );
}

function CompetitorRow({ name, run1, run2, total, isWinner, isSchool }) {
  return (
    <div
      style={{
        ...styles.competitor,
        ...(isSchool ? styles.schoolCompetitor : {}),
        ...(isWinner ? styles.winnerCompetitor : {}),
      }}
    >
      <div style={styles.competitorName}>
        {isSchool ? "⭐ " : ""}
        {isWinner ? "🏁 " : ""}
        {name}
      </div>

      <div className="times" style={styles.times}>
        <span>R1: {formatTime(run1)}</span>
        <span>R2: {formatTime(run2)}</span>
        <strong>Total: {formatTime(total)}</strong>
      </div>
    </div>
  );
}

function BracketView({ races, selectedSchool, focusOnly }) {
  const bracketType = String(races[0]?.bracket_type || "12");
  const fullLayout = BRACKET_LAYOUTS[bracketType] || BRACKET_LAYOUTS[12];

  const mainLayout = fullLayout.filter((round) => round.label !== "Placements");
  const placementLayout = fullLayout.find((round) => round.label === "Placements");

  const raceMap = {};
  races.forEach((race) => {
    raceMap[race.id] = race;
  });

  const schoolIsActive = selectedSchool !== "All Schools";
  const schoolPathIds = getSchoolPathRaceIds(races, selectedSchool);

  const cardWidth = 280;
  const cardHeight = 156;
  const columnGap = 120;
  const baseGap = 36;

  const bracketHeight =
    bracketType === "12"
      ? 5 * (cardHeight + baseGap) + 120
      : bracketType === "48"
        ? 16 * (cardHeight + baseGap) + 80
        : (mainLayout[0]?.raceIds.length || 1) * (cardHeight + baseGap) + 80;

  const bracketWidth =
    mainLayout.length * cardWidth + (mainLayout.length - 1) * columnGap;

  const positioned = [];

  mainLayout.forEach((round, roundIndex) => {
    round.raceIds.forEach((raceId, matchIndex) => {
      const race = raceMap[raceId];
      if (!race) return;

      const raceHasSchool = schoolIsActive && raceMatchesSchool(race, selectedSchool);
      const inSchoolPath = schoolIsActive && schoolPathIds.has(race.id);

      if (focusOnly && schoolIsActive && !inSchoolPath && !raceHasSchool) return;

      positioned.push({
        race,
        round,
        raceHasSchool,
        inSchoolPath,
        ...getBracketPosition(bracketType, roundIndex, matchIndex),
      });
    });
  });

  const positionMap = {};
  positioned.forEach((item) => {
    positionMap[item.race.id] = item;
  });

  const connectorLines = positioned
    .map((item) => {
      const nextId = getNextRaceId(item.race.bracket_type, item.race.id);
      const to = nextId ? positionMap[nextId] : null;

      if (!to) return null;

      const startX = item.x + item.width;
      const startY = item.y + item.height / 2 + 48;
      const endX = to.x;
      const endY = to.y + to.height / 2 + 48;
      const midX = startX + (endX - startX) / 2;
      const highlighted = schoolIsActive && item.inSchoolPath && to.inSchoolPath;

      return {
        id: `${item.race.id}-${nextId}`,
        d: `M ${startX} ${startY} H ${midX} V ${endY} H ${endX}`,
        highlighted,
      };
    })
    .filter(Boolean);

  const schoolTimeline = schoolIsActive
    ? races.filter((race) => raceMatchesSchool(race, selectedSchool)).sort((a, b) => a.id - b.id)
    : [];

  return (
    <section>
      {schoolIsActive && (
        <div style={styles.pathPanel}>
          <h2 style={styles.pathTitle}>School Path · {selectedSchool}</h2>

          {schoolTimeline.length > 0 ? (
            <div style={styles.pathGrid}>
              {schoolTimeline.map((race) => {
                const winner = getWinnerSide(race);
                const winnerName =
                  winner === "A" ? getRacerA(race) :
                  winner === "B" ? getRacerB(race) :
                  null;

                return (
                  <div key={`${race.division}-${race.id}`} style={styles.pathItem}>
                    <div style={styles.pathRace}>Race {race.id}</div>
                    <div style={styles.pathMatch}>
                      {getRacerA(race)} vs {getRacerB(race)}
                    </div>
                    <div style={styles.pathStatus}>
                      {winnerName ? `Winner: ${winnerName}` : getStatusText(race, false, false)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={styles.emptyText}>No races currently show this school.</div>
          )}
        </div>
      )}

      <div style={styles.bracketOuter}>
        <div
          style={{
            ...styles.bracketCanvas,
            width: bracketWidth,
            minWidth: bracketWidth,
            height: bracketHeight,
          }}
        >
          <svg style={styles.bracketSvg} width={bracketWidth} height={bracketHeight}>
            {connectorLines.map((line) => (
              <path
                key={line.id}
                d={line.d}
                fill="none"
                stroke={line.highlighted ? COLORS.accent : "rgba(148,163,184,0.42)"}
                strokeWidth={line.highlighted ? 4 : 2}
              />
            ))}
          </svg>

          {mainLayout.map((round, roundIndex) => (
            <div
              key={round.label}
              style={{
                ...styles.roundTitle,
                left: roundIndex * (cardWidth + columnGap),
                width: cardWidth,
              }}
            >
              {round.label}
            </div>
          ))}

          {positioned.map(({ race, x, y, raceHasSchool, inSchoolPath }) => {
            const racerA = getRacerA(race);
            const racerB = getRacerB(race);
            const { totalA, totalB } = getRaceTimes(race);
            const winner = getWinnerSide(race);

            const dimmed = schoolIsActive && !raceHasSchool && !inSchoolPath;

            return (
              <div
                key={`${race.division}-${race.bracket_type}-${race.id}`}
                style={{
                  ...styles.bracketMatch,
                  opacity: dimmed ? 0.35 : 1,
                  border: raceHasSchool
                    ? `2px solid ${COLORS.accent}`
                    : `1px solid ${COLORS.border}`,
                  left: x,
                  top: y + 48,
                  width: cardWidth,
                  minHeight: cardHeight,
                }}
              >
                <div style={styles.bracketRace}>Race {race.id}</div>

                <BracketCompetitor
                  name={racerA}
                  time={totalA}
                  isWinner={winner === "A"}
                  isSchool={racerMatchesSchool(racerA, selectedSchool)}
                />

                <BracketCompetitor
                  name={racerB}
                  time={totalB}
                  isWinner={winner === "B"}
                  isSchool={racerMatchesSchool(racerB, selectedSchool)}
                />

                {winner && (
                  <div style={styles.bracketWinner}>
                    Winner: {winner === "A" ? racerA : racerB}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {placementLayout && (
          <div style={styles.placements}>
            <h2 style={styles.placementTitle}>Placements</h2>

            <div style={styles.placementGrid}>
              {placementLayout.raceIds.map((raceId) => {
                const race = raceMap[raceId];
                if (!race) return null;

                const schoolMatch = schoolIsActive && raceMatchesSchool(race, selectedSchool);

                if (focusOnly && schoolIsActive && !schoolMatch) return null;

                return (
                  <div
                    key={raceId}
                    style={{
                      ...styles.placementMatch,
                      opacity: schoolIsActive && !schoolMatch ? 0.38 : 1,
                      border: schoolMatch
                        ? `2px solid ${COLORS.accent}`
                        : `1px solid ${COLORS.border}`,
                    }}
                  >
                    <div style={styles.bracketRace}>
                      Race {race.id} · {getPlacementLabel(bracketType, race.id)}
                    </div>

                    <BracketCompetitor
                      name={getRacerA(race)}
                      time={getRaceTimes(race).totalA}
                      isWinner={race.winner === getRacerA(race)}
                      isSchool={racerMatchesSchool(getRacerA(race), selectedSchool)}
                    />

                    <BracketCompetitor
                      name={getRacerB(race)}
                      time={getRaceTimes(race).totalB}
                      isWinner={race.winner === getRacerB(race)}
                      isSchool={racerMatchesSchool(getRacerB(race), selectedSchool)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function BracketCompetitor({ name, time, isWinner, isSchool }) {
  return (
    <div
      style={{
        ...styles.bracketCompetitor,
        ...(isSchool ? styles.bracketSchool : {}),
        ...(isWinner ? styles.bracketWinnerRow : {}),
      }}
    >
      <span>
        {isSchool ? "⭐ " : ""}
        {isWinner ? "🏁 " : ""}
        {name}
      </span>
      <span style={styles.bracketTime}>{formatTime(time)}</span>
    </div>
  );
}

function StandingsView({ bracketType, races, selectedSchool, division }) {
  return (
    <section style={styles.standings}>
      <h2 style={styles.sectionTitle}>
        Final Standings · {DIVISION_LABELS[division]}
      </h2>

      <div style={styles.standingsGrid}>
        {getStandings(bracketType, races).map(([place, racer]) => {
          const schoolMatch = racerMatchesSchool(racer, selectedSchool);

          return (
            <div
              key={place}
              style={{
                ...styles.standingRow,
                border: schoolMatch
                  ? `2px solid ${COLORS.accent}`
                  : `1px solid ${COLORS.border}`,
                background: schoolMatch ? COLORS.accentSoft : COLORS.card,
              }}
            >
              <div style={styles.place}>{place}</div>
              <div style={styles.standingName}>
                {schoolMatch ? "⭐ " : ""}
                {racer || "--"}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.statBox}>
      <div style={styles.statValue}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: `linear-gradient(180deg, ${COLORS.bg}, ${COLORS.bg2})`,
    color: COLORS.text,
    padding: 16,
  },

  container: {
    maxWidth: 1440,
    margin: "0 auto",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },

  logo: {
    width: 64,
    height: 64,
    objectFit: "contain",
    background: "#fff",
    borderRadius: 14,
    padding: 6,
  },

  kicker: {
    color: COLORS.accent,
    fontWeight: 900,
    letterSpacing: 0.7,
    fontSize: 12,
  },

  title: {
    margin: "3px 0",
    fontSize: 30,
    lineHeight: 1.05,
    color: COLORS.text,
  },

  subtitle: {
    color: COLORS.muted2,
    fontSize: 14,
  },

  banner: {
    background: "linear-gradient(135deg, #14532d, #052e16)",
    border: `2px solid ${COLORS.accent}`,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    textAlign: "center",
    position: "sticky",
    top: 0,
    zIndex: 20,
  },

  bannerLabel: {
    color: "#bbf7d0",
    fontWeight: 950,
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 6,
  },

  bannerTitle: {
    fontSize: 32,
    fontWeight: 950,
  },

  bannerMatch: {
    fontSize: 22,
    fontWeight: 900,
    marginTop: 6,
  },

  controls: {
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 12,
    marginBottom: 16,
  },

  tabRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  tab: {
    background: COLORS.chip,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    padding: "9px 15px",
    fontWeight: 850,
    cursor: "pointer",
  },

  activeTab: {
    background: COLORS.accent,
    color: "#052e16",
    border: "none",
    borderRadius: 999,
    padding: "9px 15px",
    fontWeight: 950,
    cursor: "pointer",
  },

  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "1.35fr 1fr 1fr auto",
    gap: 10,
    alignItems: "end",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: 5,
  },

  label: {
    color: COLORS.muted2,
    fontSize: 12,
    fontWeight: 900,
  },

  primarySelect: {
    background: COLORS.accent,
    color: "#052e16",
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 950,
    minHeight: 42,
  },

  select: {
    background: COLORS.chip,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 850,
    minHeight: 42,
  },

  focusToggle: {
    minHeight: 42,
    display: "flex",
    alignItems: "center",
    gap: 8,
    background: COLORS.chip,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    padding: "0 14px",
    fontWeight: 850,
    whiteSpace: "nowrap",
  },

  schoolSummary: {
    marginTop: 10,
    background: COLORS.accentSoft,
    border: `1px solid ${COLORS.accent}`,
    color: "#dcfce7",
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
  },

  main: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 320px",
    gap: 14,
    alignItems: "start",
  },

  rail: {
    position: "sticky",
    top: 120,
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  sidePanel: {
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    padding: 16,
  },

  sideTitle: {
    color: COLORS.yellow,
    fontWeight: 950,
    letterSpacing: 0.6,
    fontSize: 13,
  },

  nextTitle: {
    fontSize: 24,
    fontWeight: 950,
    marginTop: 8,
  },

  nextMatch: {
    fontSize: 16,
    fontWeight: 900,
    marginTop: 4,
  },

  nextMeta: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 4,
  },

  emptyText: {
    color: COLORS.muted,
    marginTop: 10,
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
    marginTop: 14,
  },

  statBox: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 10,
    textAlign: "center",
  },

  statValue: {
    fontSize: 20,
    fontWeight: 950,
  },

  statLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 14,
  },

  emptyPanel: {
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 18,
    color: COLORS.muted2,
    fontWeight: 850,
  },

  card: {
    background: COLORS.card,
    borderRadius: 18,
    padding: 14,
    transition: "opacity 0.2s ease, box-shadow 0.2s ease",
  },

  schoolBadge: {
    display: "inline-block",
    background: COLORS.accent,
    color: "#052e16",
    borderRadius: 999,
    padding: "4px 9px",
    fontSize: 11,
    fontWeight: 950,
    marginBottom: 8,
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },

  raceTitle: {
    fontSize: 20,
    fontWeight: 950,
  },

  meta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },

  status: {
    border: "1px solid",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  competitor: {
    background: "#06101f",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    padding: 10,
    marginTop: 8,
  },

  schoolCompetitor: {
    background: COLORS.accentSoft,
    border: `1px solid ${COLORS.accent}`,
  },

  winnerCompetitor: {
    color: "#dcfce7",
    fontWeight: 950,
  },

  competitorName: {
    fontSize: 18,
    fontWeight: 950,
    marginBottom: 6,
  },

  times: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    color: COLORS.muted2,
    fontVariantNumeric: "tabular-nums",
    fontSize: 13,
  },

  winner: {
    marginTop: 10,
    background: COLORS.accentDark,
    color: "#dcfce7",
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 12,
    padding: 8,
    fontWeight: 950,
    textAlign: "center",
  },

  alert: {
    marginTop: 10,
    background: COLORS.redDark,
    color: "#fecaca",
    border: "1px solid #991b1b",
    borderRadius: 12,
    padding: 8,
    fontSize: 12,
    fontWeight: 850,
  },

  pathPanel: {
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },

  pathTitle: {
    margin: "0 0 10px 0",
    fontSize: 20,
    fontWeight: 950,
  },

  pathGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 10,
  },

  pathItem: {
    background: COLORS.accentSoft,
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 14,
    padding: 10,
  },

  pathRace: {
    color: "#bbf7d0",
    fontWeight: 950,
    fontSize: 12,
  },

  pathMatch: {
    fontWeight: 950,
    marginTop: 4,
  },

  pathStatus: {
    color: COLORS.muted2,
    fontSize: 12,
    marginTop: 4,
  },

  bracketOuter: {
    display: "flex",
    alignItems: "flex-start",
    gap: 40,
    overflowX: "auto",
    overflowY: "auto",
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 20,
    maxHeight: "75vh",
  },

  bracketCanvas: {
    position: "relative",
    flex: "0 0 auto",
  },

  bracketSvg: {
    position: "absolute",
    left: 0,
    top: 0,
    pointerEvents: "none",
    zIndex: 1,
  },

  roundTitle: {
    position: "absolute",
    top: 0,
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 950,
    textAlign: "center",
    whiteSpace: "nowrap",
  },

  bracketMatch: {
    position: "absolute",
    background: COLORS.card,
    borderRadius: 14,
    padding: 12,
    color: COLORS.text,
    zIndex: 2,
  },

  bracketRace: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 6,
    fontWeight: 900,
    textAlign: "center",
  },

  bracketCompetitor: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 8,
    background: "#06101f",
    marginTop: 6,
    fontWeight: 850,
  },

  bracketSchool: {
    background: COLORS.accentSoft,
    color: "#dcfce7",
    border: `1px solid ${COLORS.accent}`,
  },

  bracketWinnerRow: {
    background: "rgba(34,197,94,0.18)",
    color: "#dcfce7",
    border: `1px solid ${COLORS.accent}`,
  },

  bracketTime: {
    color: COLORS.muted2,
    fontVariantNumeric: "tabular-nums",
  },

  bracketWinner: {
    marginTop: 8,
    color: COLORS.accent,
    fontWeight: 900,
    fontSize: 12,
    textAlign: "center",
  },

  placements: {
    flex: "0 0 360px",
    marginLeft: 40,
  },

  placementTitle: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: 950,
    textAlign: "center",
    margin: "0 0 16px 0",
  },

  placementGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  placementMatch: {
    background: COLORS.card,
    borderRadius: 14,
    padding: 12,
  },

  standings: {
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 16,
  },

  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: 24,
    color: COLORS.text,
  },

  standingsGrid: {
    display: "grid",
    gap: 8,
  },

  standingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 12,
  },

  place: {
    fontWeight: 950,
    color: COLORS.accent,
  },

  standingName: {
    fontWeight: 900,
    textAlign: "right",
  },
};
