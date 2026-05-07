import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchEventSetting,
  fetchRaces,
  updateRace,
  upsertRace,
  upsertEventSetting,
} from "../lib/raceStore";

/* =========================================================
   CONFIG
========================================================= */

const DISTRICT_OPTIONS = [
  { value: "d11", label: "District 11" },
  { value: "southBronx", label: "South Bronx" },
];

const DISTRICT_DIVISIONS = {
  d11: ["stock", "superstock"],
  southBronx: ["superstock"],
};

const DIVISION_LABELS = {
  stock: "Stock Division",
  superstock: "Super Stock Division",
};

const DIVISION_BRACKETS = {
  stock: ["12", "16"],
  superstock: ["32", "48", "64"],
};

function normalizeDistrict(value) {
  const input = String(value || "").toLowerCase().replace(/[-_\s]/g, "");
  if (input === "southbronx") return "southBronx";
  if (input === "d11" || input === "district11") return "d11";
  return value || "d11";
}

const DQ_REASONS = [
  "Crash into opponent",
  "Hit barrier",
  "Lane violation",
  "Unsafe conduct",
  "Mechanical issue",
  "Other official ruling",
];

const COLORS = {
  bg: "#0f172a",
  panel: "#111827",
  panel2: "#1e293b",
  card: "#111827",
  border: "#334155",
  text: "#f8fafc",
  muted: "#cbd5e1",
  muted2: "#94a3b8",
  accent: "#22c55e",
  accentDark: "#14532d",
  redDark: "#7f1d1d",
  yellow: "#facc15",
  input: "#020617",
};

/* =========================================================
   BASE RACE
========================================================= */

function baseRace(id, bracketType, division, district, round, slot_a, slot_b) {
  return {
    id,
    district,
    division,
    bracket_type: bracketType,
    round,
    slot_a,
    slot_b,
    racer_a: "",
    racer_b: "",
    run1_lane1: null,
    run1_lane2: null,
    run2_lane1: null,
    run2_lane2: null,
    total_a: null,
    total_b: null,
    note: "",
    status: "Pending",
    dq_a: false,
    dq_b: false,
    dq_reason_a: "",
    dq_reason_b: "",
    bye_for: "",
    winner: "",
    loser: "",
    is_current_override: false,
  };
}

/* =========================================================
   BRACKET BUILDERS
========================================================= */

function buildDefault12Races(district, division) {
  const b = "12";

  return [
    baseRace(1, b, division, district, "Opening Draw Race", "Draw Slot A", "Draw Slot B"),
    baseRace(2, b, division, district, "Opening Draw Race", "Draw Slot A", "Draw Slot B"),
    baseRace(3, b, division, district, "Opening Draw Race", "Draw Slot A", "Draw Slot B"),
    baseRace(4, b, division, district, "Opening Draw Race", "Draw Slot A", "Draw Slot B"),

    baseRace(5, b, division, district, "Quarterfinals", "Automatic Qualifier", "Winner Race 1"),
    baseRace(6, b, division, district, "Quarterfinals", "Automatic Qualifier", "Winner Race 2"),
    baseRace(7, b, division, district, "Quarterfinals", "Automatic Qualifier", "Winner Race 3"),
    baseRace(8, b, division, district, "Quarterfinals", "Automatic Qualifier", "Winner Race 4"),

    baseRace(9, b, division, district, "Semifinals", "Winner Race 5", "Winner Race 6"),
    baseRace(10, b, division, district, "Semifinals", "Winner Race 7", "Winner Race 8"),
    baseRace(11, b, division, district, "Final", "Winner Race 9", "Winner Race 10"),

    baseRace(12, b, division, district, "Placement", "Loser Race 5", "Loser Race 6"),
    baseRace(13, b, division, district, "Placement", "Loser Race 7", "Loser Race 8"),
    baseRace(14, b, division, district, "5th / 6th", "Winner Race 12", "Winner Race 13"),
    baseRace(15, b, division, district, "7th / 8th", "Loser Race 12", "Loser Race 13"),
    baseRace(16, b, division, district, "3rd / 4th", "Loser Race 9", "Loser Race 10"),
  ];
}

function buildDefault16Races(district, division) {
  const b = "16";

  return [
    baseRace(1, b, division, district, "Round of 16", "Seed 1", "Seed 9"),
    baseRace(2, b, division, district, "Round of 16", "Seed 2", "Seed 13"),
    baseRace(3, b, division, district, "Round of 16", "Seed 3", "Seed 10"),
    baseRace(4, b, division, district, "Round of 16", "Seed 4", "Seed 8"),
    baseRace(5, b, division, district, "Round of 16", "Seed 5", "Seed 11"),
    baseRace(6, b, division, district, "Round of 16", "Seed 6", "Seed 14"),
    baseRace(7, b, division, district, "Round of 16", "Seed 7", "Seed 12"),
    baseRace(8, b, division, district, "Round of 16", "Seed 15", "Seed 16"),

    baseRace(9, b, division, district, "Quarterfinals", "Winner Race 1", "Winner Race 2"),
    baseRace(10, b, division, district, "Quarterfinals", "Winner Race 3", "Winner Race 4"),
    baseRace(11, b, division, district, "Quarterfinals", "Winner Race 5", "Winner Race 6"),
    baseRace(12, b, division, district, "Quarterfinals", "Winner Race 7", "Winner Race 8"),

    baseRace(13, b, division, district, "Semifinals", "Winner Race 9", "Winner Race 10"),
    baseRace(14, b, division, district, "Semifinals", "Winner Race 11", "Winner Race 12"),

    baseRace(15, b, division, district, "5th / 6th Qualifier", "Loser Race 9", "Loser Race 10"),
    baseRace(16, b, division, district, "7th / 8th Qualifier", "Loser Race 11", "Loser Race 12"),
    baseRace(17, b, division, district, "5th / 6th", "Winner Race 15", "Winner Race 16"),
    baseRace(18, b, division, district, "Final", "Winner Race 13", "Winner Race 14"),
    baseRace(19, b, division, district, "3rd / 4th", "Loser Race 13", "Loser Race 14"),
    baseRace(20, b, division, district, "7th / 8th", "Loser Race 15", "Loser Race 16"),
  ];
}

function buildDefault32Races(district, division) {
  const races = [];
  const b = "32";

  for (let i = 1; i <= 16; i++) {
    races.push(baseRace(i, b, division, district, "Opening Draw Race", "Draw Slot A", "Draw Slot B"));
  }

  for (let i = 17; i <= 24; i++) {
    const source = (i - 17) * 2 + 1;
    races.push(baseRace(i, b, division, district, "Round of 16", `Winner Race ${source}`, `Winner Race ${source + 1}`));
  }

  for (let i = 25; i <= 28; i++) {
    const source = (i - 25) * 2 + 17;
    races.push(baseRace(i, b, division, district, "Quarterfinals", `Winner Race ${source}`, `Winner Race ${source + 1}`));
  }

  races.push(baseRace(29, b, division, district, "Semifinals", "Winner Race 25", "Winner Race 26"));
  races.push(baseRace(30, b, division, district, "Semifinals", "Winner Race 27", "Winner Race 28"));
  races.push(baseRace(31, b, division, district, "Final", "Winner Race 29", "Winner Race 30"));

  races.push(baseRace(32, b, division, district, "Placement", "Loser Race 25", "Loser Race 26"));
  races.push(baseRace(33, b, division, district, "Placement", "Loser Race 27", "Loser Race 28"));
  races.push(baseRace(34, b, division, district, "5th / 6th", "Winner Race 32", "Winner Race 33"));
  races.push(baseRace(35, b, division, district, "7th / 8th", "Loser Race 32", "Loser Race 33"));
  races.push(baseRace(36, b, division, district, "3rd / 4th", "Loser Race 29", "Loser Race 30"));

  return races;
}

function buildDefault48Races(district, division) {
  const races = [];
  const b = "48";

  for (let i = 1; i <= 16; i++) {
    races.push(baseRace(i, b, division, district, "Preliminary Draw Race", "Draw Slot A", "Draw Slot B"));
  }

  for (let i = 17; i <= 32; i++) {
    races.push(baseRace(i, b, division, district, "Round of 32", "Automatic Qualifier", `Winner Race ${i - 16}`));
  }

  for (let i = 33; i <= 40; i++) {
    const source = (i - 33) * 2 + 17;
    races.push(baseRace(i, b, division, district, "Sweet 16", `Winner Race ${source}`, `Winner Race ${source + 1}`));
  }

  for (let i = 41; i <= 44; i++) {
    const source = (i - 41) * 2 + 33;
    races.push(baseRace(i, b, division, district, "Quarterfinals", `Winner Race ${source}`, `Winner Race ${source + 1}`));
  }

  races.push(baseRace(45, b, division, district, "Semifinals", "Winner Race 41", "Winner Race 42"));
  races.push(baseRace(46, b, division, district, "Semifinals", "Winner Race 43", "Winner Race 44"));
  races.push(baseRace(47, b, division, district, "Final", "Winner Race 45", "Winner Race 46"));

  races.push(baseRace(48, b, division, district, "Placement", "Loser Race 41", "Loser Race 42"));
  races.push(baseRace(49, b, division, district, "Placement", "Loser Race 43", "Loser Race 44"));
  races.push(baseRace(50, b, division, district, "5th / 6th", "Winner Race 48", "Winner Race 49"));
  races.push(baseRace(51, b, division, district, "7th / 8th", "Loser Race 48", "Loser Race 49"));
  races.push(baseRace(52, b, division, district, "3rd / 4th", "Loser Race 45", "Loser Race 46"));

  return races;
}

function buildDefault64Races(district, division) {
  const races = [];
  const b = "64";

  for (let i = 1; i <= 32; i++) {
    races.push(baseRace(i, b, division, district, "Opening Draw Race", "Draw Slot A", "Draw Slot B"));
  }

  for (let i = 33; i <= 48; i++) {
    const source = (i - 33) * 2 + 1;
    races.push(baseRace(i, b, division, district, "Round of 32", `Winner Race ${source}`, `Winner Race ${source + 1}`));
  }

  for (let i = 49; i <= 56; i++) {
    const source = (i - 49) * 2 + 33;
    races.push(baseRace(i, b, division, district, "Sweet 16", `Winner Race ${source}`, `Winner Race ${source + 1}`));
  }

  for (let i = 57; i <= 60; i++) {
    const source = (i - 57) * 2 + 49;
    races.push(baseRace(i, b, division, district, "Quarterfinals", `Winner Race ${source}`, `Winner Race ${source + 1}`));
  }

  races.push(baseRace(61, b, division, district, "Semifinals", "Winner Race 57", "Winner Race 58"));
  races.push(baseRace(62, b, division, district, "Semifinals", "Winner Race 59", "Winner Race 60"));
  races.push(baseRace(63, b, division, district, "Final", "Winner Race 61", "Winner Race 62"));

  races.push(baseRace(64, b, division, district, "Placement", "Loser Race 57", "Loser Race 59"));
  races.push(baseRace(65, b, division, district, "Placement", "Loser Race 58", "Loser Race 60"));
  races.push(baseRace(66, b, division, district, "5th / 6th", "Winner Race 64", "Winner Race 65"));
  races.push(baseRace(67, b, division, district, "7th / 8th", "Loser Race 64", "Loser Race 65"));
  races.push(baseRace(68, b, division, district, "3rd / 4th", "Loser Race 61", "Loser Race 62"));

  return races;
}

function buildDefaults(bracketType, district, division) {
  if (bracketType === "12") return buildDefault12Races(district, division);
  if (bracketType === "16") return buildDefault16Races(district, division);
  if (bracketType === "32") return buildDefault32Races(district, division);
  if (bracketType === "48") return buildDefault48Races(district, division);
  if (bracketType === "64") return buildDefault64Races(district, division);
  return [];
}

/* =========================================================
   HELPERS
========================================================= */

function getAssignmentFields(race, bracketType) {
  if (bracketType === "12") {
    if (race.id >= 1 && race.id <= 4) return ["racer_a", "racer_b"];
    if (race.id >= 5 && race.id <= 8) return ["racer_a"];
    return [];
  }

  if (bracketType === "16") {
    if (race.id >= 1 && race.id <= 8) return ["racer_a", "racer_b"];
    return [];
  }

  if (bracketType === "32") {
    if (race.id >= 1 && race.id <= 16) return ["racer_a", "racer_b"];
    return [];
  }

  if (bracketType === "48") {
    if (race.id >= 1 && race.id <= 16) return ["racer_a", "racer_b"];
    if (race.id >= 17 && race.id <= 32) return ["racer_a"];
    return [];
  }

  if (bracketType === "64") {
    if (race.id >= 1 && race.id <= 32) return ["racer_a", "racer_b"];
    return [];
  }

  return [];
}

function isAssignmentRace(race, bracketType) {
  return getAssignmentFields(race, bracketType).length > 0;
}

function formatDivisionLabel(division) {
  return DIVISION_LABELS[division] || division;
}

function getRaceDisplayName(race) {
  return `${race.racer_a || race.slot_a || "--"} vs ${race.racer_b || race.slot_b || "--"}`;
}

function hasAnyRunData(race) {
  return (
    race.run1_lane1 != null ||
    race.run1_lane2 != null ||
    race.run2_lane1 != null ||
    race.run2_lane2 != null
  );
}

function extractSeedNumber(label) {
  const value = String(label || "").trim();
  if (!value) return null;

  const explicitSeed = value.match(/seed\s*(\d+)/i);
  if (explicitSeed) return Number(explicitSeed[1]);

  const firstNumber = value.match(/\d+/);
  return firstNumber ? Number(firstNumber[0]) : null;
}

function orderRacersBySeed(racerA, racerB) {
  const aSeed = extractSeedNumber(racerA);
  const bSeed = extractSeedNumber(racerB);

  if (aSeed === null || bSeed === null || aSeed <= bSeed) {
    return { racer_a: racerA, racer_b: racerB };
  }

  return { racer_a: racerB, racer_b: racerA };
}

/* =========================================================
   ADMIN PAGE
========================================================= */

export default function AdminPage() {
  const navigate = useNavigate();
  const { district: districtParam } = useParams();
  const normalizedDistrictParam = districtParam ? normalizeDistrict(districtParam) : null;

  const [authorized, setAuthorized] = useState(false);
  const [district, setDistrict] = useState(normalizedDistrictParam || "d11");
  const [division, setDivision] = useState("stock");
  const [bracketType, setBracketType] = useState("12");
  const [bracketByDivision, setBracketByDivision] = useState({});
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const allowedDivisions = DISTRICT_DIVISIONS[district] || ["superstock"];
  const allowedBrackets = DIVISION_BRACKETS[division] || ["32"];

  const winnerOf = (map, id) => map[id]?.winner || "";
  const loserOf = (map, id) => map[id]?.loser || "";

  const advanceBracket = useCallback(async (raceRows) => {
    const map = {};
    raceRows.forEach((race) => {
      map[race.id] = race;
    });

    const updates = [];
    function queue(id, fields) {
      const nextFields = { ...fields };

      if (
        typeof nextFields.racer_a === "string" &&
        typeof nextFields.racer_b === "string" &&
        nextFields.racer_a &&
        nextFields.racer_b
      ) {
        const ordered = orderRacersBySeed(nextFields.racer_a, nextFields.racer_b);
        nextFields.racer_a = ordered.racer_a;
        nextFields.racer_b = ordered.racer_b;
      }

      updates.push({ id, fields: nextFields });
    }

    if (bracketType === "12") {
      queue(5, { racer_b: winnerOf(map, 1) });
      queue(6, { racer_b: winnerOf(map, 2) });
      queue(7, { racer_b: winnerOf(map, 3) });
      queue(8, { racer_b: winnerOf(map, 4) });

      queue(9, { racer_a: winnerOf(map, 5), racer_b: winnerOf(map, 6) });
      queue(10, { racer_a: winnerOf(map, 7), racer_b: winnerOf(map, 8) });
      queue(11, { racer_a: winnerOf(map, 9), racer_b: winnerOf(map, 10) });

      queue(12, { racer_a: loserOf(map, 5), racer_b: loserOf(map, 6) });
      queue(13, { racer_a: loserOf(map, 7), racer_b: loserOf(map, 8) });
      queue(14, { racer_a: winnerOf(map, 12), racer_b: winnerOf(map, 13) });
      queue(15, { racer_a: loserOf(map, 12), racer_b: loserOf(map, 13) });
      queue(16, { racer_a: loserOf(map, 9), racer_b: loserOf(map, 10) });
    }

    if (bracketType === "16") {
      queue(9, { racer_a: winnerOf(map, 1), racer_b: winnerOf(map, 2) });
      queue(10, { racer_a: winnerOf(map, 3), racer_b: winnerOf(map, 4) });
      queue(11, { racer_a: winnerOf(map, 5), racer_b: winnerOf(map, 6) });
      queue(12, { racer_a: winnerOf(map, 7), racer_b: winnerOf(map, 8) });

      queue(13, { racer_a: winnerOf(map, 9), racer_b: winnerOf(map, 10) });
      queue(14, { racer_a: winnerOf(map, 11), racer_b: winnerOf(map, 12) });

      queue(15, { racer_a: loserOf(map, 9), racer_b: loserOf(map, 10) });
      queue(16, { racer_a: loserOf(map, 11), racer_b: loserOf(map, 12) });
      queue(17, { racer_a: winnerOf(map, 15), racer_b: winnerOf(map, 16) });

      queue(18, { racer_a: winnerOf(map, 13), racer_b: winnerOf(map, 14) });
      queue(19, { racer_a: loserOf(map, 13), racer_b: loserOf(map, 14) });
      queue(20, { racer_a: loserOf(map, 15), racer_b: loserOf(map, 16) });
    }

    if (bracketType === "32") {
      for (let i = 17; i <= 24; i++) {
        const source = (i - 17) * 2 + 1;
        queue(i, { racer_a: winnerOf(map, source), racer_b: winnerOf(map, source + 1) });
      }

      for (let i = 25; i <= 28; i++) {
        const source = (i - 25) * 2 + 17;
        queue(i, { racer_a: winnerOf(map, source), racer_b: winnerOf(map, source + 1) });
      }

      queue(29, { racer_a: winnerOf(map, 25), racer_b: winnerOf(map, 26) });
      queue(30, { racer_a: winnerOf(map, 27), racer_b: winnerOf(map, 28) });
      queue(31, { racer_a: winnerOf(map, 29), racer_b: winnerOf(map, 30) });

      queue(32, { racer_a: loserOf(map, 25), racer_b: loserOf(map, 26) });
      queue(33, { racer_a: loserOf(map, 27), racer_b: loserOf(map, 28) });
      queue(34, { racer_a: winnerOf(map, 32), racer_b: winnerOf(map, 33) });
      queue(35, { racer_a: loserOf(map, 32), racer_b: loserOf(map, 33) });
      queue(36, { racer_a: loserOf(map, 29), racer_b: loserOf(map, 30) });
    }

    if (bracketType === "48") {
      for (let i = 17; i <= 32; i++) queue(i, { racer_b: winnerOf(map, i - 16) });

      for (let i = 33; i <= 40; i++) {
        const source = (i - 33) * 2 + 17;
        queue(i, { racer_a: winnerOf(map, source), racer_b: winnerOf(map, source + 1) });
      }

      for (let i = 41; i <= 44; i++) {
        const source = (i - 41) * 2 + 33;
        queue(i, { racer_a: winnerOf(map, source), racer_b: winnerOf(map, source + 1) });
      }

      queue(45, { racer_a: winnerOf(map, 41), racer_b: winnerOf(map, 42) });
      queue(46, { racer_a: winnerOf(map, 43), racer_b: winnerOf(map, 44) });
      queue(47, { racer_a: winnerOf(map, 45), racer_b: winnerOf(map, 46) });

      queue(48, { racer_a: loserOf(map, 41), racer_b: loserOf(map, 42) });
      queue(49, { racer_a: loserOf(map, 43), racer_b: loserOf(map, 44) });
      queue(50, { racer_a: winnerOf(map, 48), racer_b: winnerOf(map, 49) });
      queue(51, { racer_a: loserOf(map, 48), racer_b: loserOf(map, 49) });
      queue(52, { racer_a: loserOf(map, 45), racer_b: loserOf(map, 46) });
    }

    if (bracketType === "64") {
      for (let i = 33; i <= 48; i++) {
        const source = (i - 33) * 2 + 1;
        queue(i, { racer_a: winnerOf(map, source), racer_b: winnerOf(map, source + 1) });
      }

      for (let i = 49; i <= 56; i++) {
        const source = (i - 49) * 2 + 33;
        queue(i, { racer_a: winnerOf(map, source), racer_b: winnerOf(map, source + 1) });
      }

      for (let i = 57; i <= 60; i++) {
        const source = (i - 57) * 2 + 49;
        queue(i, { racer_a: winnerOf(map, source), racer_b: winnerOf(map, source + 1) });
      }

      queue(61, { racer_a: winnerOf(map, 57), racer_b: winnerOf(map, 58) });
      queue(62, { racer_a: winnerOf(map, 59), racer_b: winnerOf(map, 60) });
      queue(63, { racer_a: winnerOf(map, 61), racer_b: winnerOf(map, 62) });

      queue(64, { racer_a: loserOf(map, 57), racer_b: loserOf(map, 59) });
      queue(65, { racer_a: loserOf(map, 58), racer_b: loserOf(map, 60) });
      queue(66, { racer_a: winnerOf(map, 64), racer_b: winnerOf(map, 65) });
      queue(67, { racer_a: loserOf(map, 64), racer_b: loserOf(map, 65) });
      queue(68, { racer_a: loserOf(map, 61), racer_b: loserOf(map, 62) });
    }

    for (const update of updates) {
      await updateRace(update.id, update.fields, bracketType, district, division);
    }
  }, [bracketType, district, division]);

  const assignmentRaces = useMemo(
    () => races.filter((race) => isAssignmentRace(race, bracketType)),
    [races, bracketType]
  );

  useEffect(() => {
    const access = sessionStorage.getItem("admin_access");
    if (access !== "granted") navigate(districtParam ? `/admin-login/${districtParam}` : "/admin-login");
    else setAuthorized(true);
  }, [navigate, districtParam]);

  useEffect(() => {
    if (!districtParam) return;
    const normalized = normalizeDistrict(districtParam);
    if (normalized !== district) setDistrict(normalized);
  }, [districtParam, district]);

  useEffect(() => {
    const districtDivisions = DISTRICT_DIVISIONS[district] || ["superstock"];
    const nextDivision = districtDivisions.includes(division) ? division : districtDivisions[0];

    if (nextDivision !== division) {
      setDivision(nextDivision);
      return;
    }

    const bracketOptions = DIVISION_BRACKETS[nextDivision] || ["32"];
    const savedLocalBracket = bracketByDivision[`${district}:${nextDivision}`];
    const nextBracket =
      savedLocalBracket && bracketOptions.includes(savedLocalBracket)
        ? savedLocalBracket
        : bracketOptions.includes(bracketType)
          ? bracketType
          : bracketOptions[0];

    if (nextBracket !== bracketType) setBracketType(nextBracket);
  }, [district, division, bracketType, bracketByDivision]);

  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setMessage("");

      try {
        const bracketOptions = DIVISION_BRACKETS[division] || ["32"];
        const setting = await fetchEventSetting(district, division);
        const savedBracketType = setting?.active_bracket_type != null
          ? String(setting.active_bracket_type)
          : null;

        if (savedBracketType && bracketOptions.includes(savedBracketType)) {
          if (!cancelled) {
            setBracketByDivision((previous) => ({
              ...previous,
              [`${district}:${division}`]: savedBracketType,
            }));
          }
        }

        if (
          savedBracketType &&
          bracketOptions.includes(savedBracketType) &&
          savedBracketType !== bracketType
        ) {
          if (!cancelled) setBracketType(savedBracketType);
          return;
        }

        let raceRows = await fetchRaces(bracketType, district, division);
        if (cancelled) return;

        if (raceRows.length === 0) {
          const defaults = buildDefaults(bracketType, district, division);
          for (const race of defaults) await upsertRace(race);
          raceRows = await fetchRaces(bracketType, district, division);
        }

        await advanceBracket(raceRows);
        raceRows = await fetchRaces(bracketType, district, division);

        if (!cancelled) setRaces(raceRows);
      } catch (error) {
        if (!cancelled) {
          console.error("ADMIN LOAD ERROR:", error);
          setMessage(`Failed to load admin data: ${error.message || "Unknown error"}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [authorized, district, division, bracketType, advanceBracket]);

  async function reloadRaces() {
    const refreshed = await fetchRaces(bracketType, district, division);
    setRaces(refreshed);
    return refreshed;
  }

  async function handleBracketChange(newBracketType) {
    setBracketType(newBracketType);
    setBracketByDivision((previous) => ({
      ...previous,
      [`${district}:${division}`]: newBracketType,
    }));
    await upsertEventSetting({ district, division, active_bracket_type: newBracketType });
    setMessage(`${formatDivisionLabel(division)} active bracket set to ${newBracketType}-Car`);
  }

  async function setCurrentRace(raceId) {
    try {
      for (const divisionOption of DISTRICT_DIVISIONS[district]) {
        for (const bracketOption of DIVISION_BRACKETS[divisionOption]) {
          const divisionRaces = await fetchRaces(bracketOption, district, divisionOption);
          for (const race of divisionRaces) {
            if (race.is_current_override) {
              await updateRace(
                race.id,
                { is_current_override: false },
                bracketOption,
                district,
                divisionOption
              );
            }
          }
        }
      }

      await updateRace(raceId, { is_current_override: true }, bracketType, district, division);
      await reloadRaces();
      setMessage(`${formatDivisionLabel(division)} Race ${raceId} set as NOW RACING`);
    } catch (error) {
      console.error("SET CURRENT ERROR:", error);
      setMessage(`Failed to set Race ${raceId} as current`);
    }
  }

  async function clearCurrentRace(raceId) {
    try {
      await updateRace(raceId, { is_current_override: false }, bracketType, district, division);
      await reloadRaces();
      setMessage(`Cleared NOW RACING override for Race ${raceId}`);
    } catch (error) {
      console.error("CLEAR CURRENT ERROR:", error);
      setMessage(`Failed to clear NOW RACING for Race ${raceId}`);
    }
  }

  async function clearRaceSeeds(raceId) {
    const confirmed = window.confirm(`Clear racer assignments for Race ${raceId}?`);
    if (!confirmed) return;

    try {
      await updateRace(
        raceId,
        { racer_a: "", racer_b: "" },
        bracketType,
        district,
        division
      );

      let refreshedRaces = await fetchRaces(bracketType, district, division);
      await advanceBracket(refreshedRaces);
      refreshedRaces = await fetchRaces(bracketType, district, division);

      setRaces(refreshedRaces);
      setMessage(`Cleared seeds for Race ${raceId}`);
    } catch (error) {
      console.error("CLEAR SEEDS ERROR:", error);
      setMessage(`Failed to clear seeds for Race ${raceId}`);
    }
  }

  async function clearRaceEntries(raceId) {
    const confirmed = window.confirm(`Clear times, DQ, BYE, winner, and status for Race ${raceId}? Racer assignments will be kept.`);
    if (!confirmed) return;

    try {
      await updateRace(
        raceId,
        {
          run1_lane1: null,
          run1_lane2: null,
          run2_lane1: null,
          run2_lane2: null,
          total_a: null,
          total_b: null,
          dq_a: false,
          dq_b: false,
          dq_reason_a: "",
          dq_reason_b: "",
          bye_for: "",
          winner: "",
          loser: "",
          status: "Pending",
          note: "",
          is_current_override: false,
        },
        bracketType,
        district,
        division
      );

      let refreshedRaces = await fetchRaces(bracketType, district, division);
      await advanceBracket(refreshedRaces);
      refreshedRaces = await fetchRaces(bracketType, district, division);

      await autoAdvanceCurrentRaceIfComplete(raceId, refreshedRaces);
      refreshedRaces = await fetchRaces(bracketType, district, division);

      setRaces(refreshedRaces);
      setMessage(`Cleared Race ${raceId}`);
    } catch (error) {
      console.error("CLEAR RACE ERROR:", error);
      setMessage(`Failed to clear Race ${raceId}`);
    }
  }

  async function handleAssignmentBlur(raceId, field, value) {
    try {
      const trimmed = value.trim();
      await updateRace(raceId, { [field]: trimmed }, bracketType, district, division);

      let refreshedRaces = await fetchRaces(bracketType, district, division);
      let changedRace = refreshedRaces.find((race) => race.id === raceId);

      if (
        changedRace &&
        changedRace.racer_a &&
        changedRace.racer_b &&
        !hasAnyRunData(changedRace) &&
        changedRace.status !== "Complete"
      ) {
        const ordered = orderRacersBySeed(changedRace.racer_a, changedRace.racer_b);

        if (ordered.racer_a !== changedRace.racer_a || ordered.racer_b !== changedRace.racer_b) {
          await updateRace(
            raceId,
            { racer_a: ordered.racer_a, racer_b: ordered.racer_b },
            bracketType,
            district,
            division
          );

          refreshedRaces = await fetchRaces(bracketType, district, division);
          changedRace = refreshedRaces.find((race) => race.id === raceId);
        }
      }

      if (changedRace && changedRace.bye_for) {
        const outcome = getRaceAdminOutcome(changedRace);
        await updateRace(
          raceId,
          { winner: outcome.winner, loser: outcome.loser, status: outcome.status },
          bracketType,
          district,
          division
        );
        refreshedRaces = await fetchRaces(bracketType, district, division);
      }

      await advanceBracket(refreshedRaces);
      refreshedRaces = await fetchRaces(bracketType, district, division);

      await autoAdvanceCurrentRaceIfComplete(raceId, refreshedRaces);
      refreshedRaces = await fetchRaces(bracketType, district, division);

      setRaces(refreshedRaces);
      setMessage(`Saved Race ${raceId} assignment`);
    } catch (error) {
      console.error("ASSIGNMENT SAVE ERROR:", error);
      setMessage(`Failed to save Race ${raceId} assignment`);
    }
  }

  function getRaceAdminOutcome(race, changedField = null, changedValue = null) {
    const nextRace = changedField !== null ? { ...race, [changedField]: changedValue } : race;

    if (nextRace.bye_for === "A") {
      return { winner: nextRace.racer_a || "", loser: nextRace.racer_b || "", status: "Complete" };
    }

    if (nextRace.bye_for === "B") {
      return { winner: nextRace.racer_b || "", loser: nextRace.racer_a || "", status: "Complete" };
    }

    if (nextRace.dq_a && !nextRace.dq_b) {
      return { winner: nextRace.racer_b || "", loser: nextRace.racer_a || "", status: "Complete" };
    }

    if (nextRace.dq_b && !nextRace.dq_a) {
      return { winner: nextRace.racer_a || "", loser: nextRace.racer_b || "", status: "Complete" };
    }

    if (nextRace.dq_a && nextRace.dq_b) {
      return { winner: "", loser: "", status: "DQ Conflict" };
    }

    return {
      winner: nextRace.winner || "",
      loser: nextRace.loser || "",
      status: nextRace.status || "Pending",
    };
  }

  function getOutcomeFromTimes(race) {
    if (
      race.bye_for ||
      race.dq_a ||
      race.dq_b ||
      race.run1_lane1 === null ||
      race.run1_lane1 === "" ||
      race.run1_lane2 === null ||
      race.run1_lane2 === "" ||
      race.run2_lane1 === null ||
      race.run2_lane1 === "" ||
      race.run2_lane2 === null ||
      race.run2_lane2 === ""
    ) {
      return null;
    }

    const totalA = Number(race.run1_lane1) + Number(race.run2_lane2);
    const totalB = Number(race.run1_lane2) + Number(race.run2_lane1);

    if (totalA < totalB) {
      return { winner: race.racer_a || "", loser: race.racer_b || "", status: "Complete", total_a: totalA, total_b: totalB };
    }

    if (totalB < totalA) {
      return { winner: race.racer_b || "", loser: race.racer_a || "", status: "Complete", total_a: totalA, total_b: totalB };
    }

    return { winner: "", loser: "", status: "Tiebreaker Needed", total_a: totalA, total_b: totalB };
  }

  // South Bronx: 2 legs, only the winner's time is entered per leg.
  // run1_lane1 = leg1 time if A won, run1_lane2 = leg1 time if B won
  // run2_lane1 = leg2 time if A won, run2_lane2 = leg2 time if B won
  function getOutcomeFromDifferential(race) {
    const leg1A = race.run1_lane1;
    const leg1B = race.run1_lane2;
    const leg2A = race.run2_lane1;
    const leg2B = race.run2_lane2;

    const leg1Done = (leg1A != null && leg1A !== "") || (leg1B != null && leg1B !== "");
    const leg2Done = (leg2A != null && leg2A !== "") || (leg2B != null && leg2B !== "");
    if (!leg1Done || !leg2Done) return null;

    const winsA = (leg1A != null && leg1A !== "" ? 1 : 0) + (leg2A != null && leg2A !== "" ? 1 : 0);
    const winsB = (leg1B != null && leg1B !== "" ? 1 : 0) + (leg2B != null && leg2B !== "" ? 1 : 0);

    if (winsA === 2) return { winner: race.racer_a || "", loser: race.racer_b || "", status: "Complete" };
    if (winsB === 2) return { winner: race.racer_b || "", loser: race.racer_a || "", status: "Complete" };

    // 1-1 split: greater (higher) winning time = biggest differential = wins overall
    const timeA = leg1A != null && leg1A !== "" ? Number(leg1A) : Number(leg2A);
    const timeB = leg1B != null && leg1B !== "" ? Number(leg1B) : Number(leg2B);
    if (timeA > timeB) return { winner: race.racer_a || "", loser: race.racer_b || "", status: "Complete" };
    if (timeB > timeA) return { winner: race.racer_b || "", loser: race.racer_a || "", status: "Complete" };
    return { winner: "", loser: "", status: "Tiebreaker Needed" };
  }

  async function handleSouthBronxLeg(raceId, leg, winner, time) {
    try {
      const parsedTime = time !== "" && time != null ? Number(time) : null;
      const update =
        leg === 1
          ? { run1_lane1: winner === "A" ? parsedTime : null, run1_lane2: winner === "B" ? parsedTime : null }
          : { run2_lane1: winner === "A" ? parsedTime : null, run2_lane2: winner === "B" ? parsedTime : null };

      if (parsedTime != null) {
        update.bye_for = "";
      }

      await updateRace(raceId, update, bracketType, district, division);

      let refreshedRaces = await fetchRaces(bracketType, district, division);
      const race = refreshedRaces.find((r) => r.id === raceId);

      if (race) {
        const outcome = getOutcomeFromDifferential({ ...race, ...update });
        if (outcome) {
          await updateRace(raceId, { winner: outcome.winner, loser: outcome.loser, status: outcome.status }, bracketType, district, division);
          refreshedRaces = await fetchRaces(bracketType, district, division);
          await advanceBracket(refreshedRaces);
          refreshedRaces = await fetchRaces(bracketType, district, division);
          await autoAdvanceCurrentRaceIfComplete(raceId, refreshedRaces);
          refreshedRaces = await fetchRaces(bracketType, district, division);
        }
      }

      setRaces(refreshedRaces);
      setMessage(`Saved Race ${raceId} Leg ${leg}`);
    } catch (error) {
      console.error("SOUTH BRONX LEG SAVE ERROR:", error);
      setMessage(`Failed to save Race ${raceId}`);
    }
  }

  async function handleRaceBlur(raceId, field, value) {
    try {
      if (field === "total_a" || field === "total_b") {
        const parsedValue = value !== "" ? Number(value) : null;
        await updateRace(raceId, { [field]: parsedValue }, bracketType, district, division);

        let refreshedRaces = await fetchRaces(bracketType, district, division);
        const race = refreshedRaces.find((item) => item.id === raceId);

        if (race) {
          const tA = field === "total_a" ? parsedValue : race.total_a;
          const tB = field === "total_b" ? parsedValue : race.total_b;

          if (tA != null && tB != null) {
            let winner, loser, status;
            if (tA < tB) { winner = race.racer_a || ""; loser = race.racer_b || ""; status = "Complete"; }
            else if (tB < tA) { winner = race.racer_b || ""; loser = race.racer_a || ""; status = "Complete"; }
            else { winner = ""; loser = ""; status = "Tiebreaker Needed"; }
            await updateRace(raceId, { winner, loser, status }, bracketType, district, division);
          }

          refreshedRaces = await fetchRaces(bracketType, district, division);
          await advanceBracket(refreshedRaces);
          refreshedRaces = await fetchRaces(bracketType, district, division);
          await autoAdvanceCurrentRaceIfComplete(raceId, refreshedRaces);
          refreshedRaces = await fetchRaces(bracketType, district, division);
        }

        setRaces(refreshedRaces);
        setMessage(`Saved Race ${raceId} total override`);
        return;
      }

      const parsedValue = field.includes("lane") && value !== "" ? Number(value) : value;

      await updateRace(raceId, { [field]: parsedValue }, bracketType, district, division);

      let refreshedRaces = await fetchRaces(bracketType, district, division);
      const race = refreshedRaces.find((item) => item.id === raceId);

      if (race) {
        const adminOutcome = getRaceAdminOutcome({ ...race, [field]: parsedValue });

        if (race.bye_for || race.dq_a || race.dq_b) {
          await updateRace(
            raceId,
            { winner: adminOutcome.winner, loser: adminOutcome.loser, status: adminOutcome.status },
            bracketType,
            district,
            division
          );
        } else {
          const outcome = getOutcomeFromTimes({ ...race, [field]: parsedValue });

          if (outcome) {
            await updateRace(
              raceId,
              {
                winner: outcome.winner,
                loser: outcome.loser,
                status: outcome.status,
                total_a: outcome.total_a,
                total_b: outcome.total_b,
              },
              bracketType,
              district,
              division
            );
          }
        }

        refreshedRaces = await fetchRaces(bracketType, district, division);
        await advanceBracket(refreshedRaces);
        refreshedRaces = await fetchRaces(bracketType, district, division);

        await autoAdvanceCurrentRaceIfComplete(raceId, refreshedRaces);
        refreshedRaces = await fetchRaces(bracketType, district, division);
      }

      setRaces(refreshedRaces);
      setMessage(`Saved Race ${raceId}`);
    } catch (error) {
      console.error("RACE SAVE ERROR:", error);
      setMessage(`Failed to save Race ${raceId}`);
    }
  }

  async function handleRaceToggle(raceId, field, checked) {
    try {
      await updateRace(raceId, { [field]: checked }, bracketType, district, division);

      let refreshedRaces = await fetchRaces(bracketType, district, division);
      const race = refreshedRaces.find((item) => item.id === raceId);

      if (race) {
        const outcome = getRaceAdminOutcome(race, field, checked);

        await updateRace(
          raceId,
          { winner: outcome.winner, loser: outcome.loser, status: outcome.status },
          bracketType,
          district,
          division
        );

        refreshedRaces = await fetchRaces(bracketType, district, division);
        await advanceBracket(refreshedRaces);
        refreshedRaces = await fetchRaces(bracketType, district, division);

        await autoAdvanceCurrentRaceIfComplete(raceId, refreshedRaces);
        refreshedRaces = await fetchRaces(bracketType, district, division);
      }

      setRaces(refreshedRaces);
      setMessage(`Updated Race ${raceId}`);
    } catch (error) {
      console.error("RACE TOGGLE ERROR:", error);
      setMessage(`Failed to update Race ${raceId}`);
    }
  }

  async function autoAdvanceCurrentRaceIfComplete(completedRaceId, raceRows) {
    const completedRace = raceRows.find((r) => r.id === completedRaceId);

    if (!completedRace?.is_current_override) return;
    if (completedRace.status !== "Complete") return;

    const nextRace = [...raceRows]
      .filter(
        (r) =>
          r.id !== completedRaceId &&
          !r.is_current_override &&
          r.status !== "Complete" &&
          r.status !== "DQ Conflict" &&
          !hasAnyRunData(r)
      )
      .sort((a, b) => a.id - b.id)[0];

    if (!nextRace) return;

    await updateRace(completedRaceId, { is_current_override: false }, bracketType, district, division);
    await updateRace(nextRace.id, { is_current_override: true }, bracketType, district, division);
  }

  async function handleRaceByeChange(raceId, byeValue) {
    try {
      await updateRace(raceId, { bye_for: byeValue }, bracketType, district, division);

      let refreshedRaces = await fetchRaces(bracketType, district, division);
      const race = refreshedRaces.find((item) => item.id === raceId);

      if (race) {
        const outcome = getRaceAdminOutcome(race, "bye_for", byeValue);

        await updateRace(
          raceId,
          { winner: outcome.winner, loser: outcome.loser, status: outcome.status },
          bracketType,
          district,
          division
        );

        refreshedRaces = await fetchRaces(bracketType, district, division);
        await advanceBracket(refreshedRaces);
        refreshedRaces = await fetchRaces(bracketType, district, division);

        await autoAdvanceCurrentRaceIfComplete(raceId, refreshedRaces);
        refreshedRaces = await fetchRaces(bracketType, district, division);
      }

      setRaces(refreshedRaces);
      setMessage(`Updated Race ${raceId}`);
    } catch (error) {
      console.error("RACE BYE ERROR:", error);
      setMessage(`Failed to update Race ${raceId}`);
    }
  }

  if (!authorized) {
    return (
      <div style={pageStyle}>
        <div style={panelStyle}>Checking access...</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <style>
        {`
          @media (max-width: 900px) {
            .admin-top-grid { grid-template-columns: 1fr !important; }
            .race-grid { grid-template-columns: 1fr !important; }
          }

          @media (max-width: 560px) {
            .admin-page { padding: 12px !important; }
            .race-card { padding: 12px !important; }
            .row-wrap { flex-direction: column !important; align-items: stretch !important; }
            .row-wrap > * { width: 100% !important; }
            .score-grid { grid-template-columns: 1fr !important; }
            .button-row { flex-direction: column !important; }
            .button-row button { width: 100% !important; }
          }
        `}
      </style>

      <div className="admin-page" style={{ maxWidth: 1320, margin: "0 auto", padding: 20 }}>
        <header style={{ marginBottom: 18, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 10 }}>
          <img src="/logo.png" alt="Soap Box Derby logo" style={{ width: 64, height: 64, objectFit: "contain", background: "#fff", borderRadius: 12, padding: 6 }} />

          <div>
            <div style={{ color: COLORS.accent, fontWeight: 900, letterSpacing: 0.6 }}>SOAP BOX DERBY</div>
            <h1 style={{ margin: "4px 0", fontSize: 34, lineHeight: 1.05, color: COLORS.text }}>Race Control Dashboard</h1>
            <div style={{ color: COLORS.muted }}>Manage divisions, brackets, draws, race timing, BYEs, DQs, and live race status.</div>
          </div>
        </header>

        {message && <div style={messageStyle}>{message}</div>}

        <section className="admin-top-grid" style={topGridStyle}>
          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Event Setup</div>

            {!districtParam && (
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>District</label>
              <select value={district} onChange={(event) => setDistrict(event.target.value)} style={selectStyle}>
                {DISTRICT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            )}

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Division</label>
              <div style={buttonWrapStyle}>
                {allowedDivisions.map((item) => (
                  <button key={item} onClick={() => setDivision(item)} style={division === item ? activeButtonStyle : secondaryButtonStyle}>
                    {DIVISION_LABELS[item]}
                  </button>
                ))}
              </div>
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Bracket</label>
              <div style={buttonWrapStyle}>
                {allowedBrackets.map((item) => (
                  <button key={item} onClick={() => handleBracketChange(item)} style={bracketType === item ? activeButtonStyle : secondaryButtonStyle}>
                    {division === "stock" ? `${item}-Car Stock` : `${item}-Car Super Stock`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionTitleStyle}>Current Context</div>
            <div style={contextLineStyle}><span>District</span><strong>{DISTRICT_OPTIONS.find((d) => d.value === district)?.label}</strong></div>
            <div style={contextLineStyle}><span>Division</span><strong>{formatDivisionLabel(division)}</strong></div>
            <div style={contextLineStyle}><span>Bracket</span><strong>{bracketType}-Car</strong></div>
            <div style={contextLineStyle}><span>Total Races</span><strong>{races.length}</strong></div>
            <div style={contextLineStyle}><span>Assignment Races</span><strong>{assignmentRaces.length}</strong></div>
          </div>
        </section>

        {loading && <div style={{ ...panelStyle, marginTop: 18 }}>Loading bracket data...</div>}

        <section style={{ marginTop: 18 }}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={h2Style}>Draw / Race Assignments</h2>
              <div style={subTextStyle}>Enter cars in the order they are drawn. Use BYE when one side advances automatically.</div>
            </div>
          </div>

          <div className="race-grid" style={cardGridStyle}>
            {assignmentRaces.map((race) => {
              const editableFields = getAssignmentFields(race, bracketType);

              return (
                <div className="race-card" key={`assignment-${race.id}`} style={raceCardStyle}>
                  <RaceHeader race={race} compact />

                  <div className="row-wrap" style={rowWrapStyle}>
                    <input
                      value={race.racer_a || ""}
                      placeholder={race.slot_a || "Racer A"}
                      disabled={!editableFields.includes("racer_a")}
                      onChange={(event) => setRaces((previous) => previous.map((item) => item.id === race.id ? { ...item, racer_a: event.target.value } : item))}
                      onBlur={(event) => handleAssignmentBlur(race.id, "racer_a", event.target.value)}
                      style={inputStyle}
                    />

                    <div style={vsStyle}>VS</div>

                    <input
                      value={race.racer_b || ""}
                      placeholder={race.slot_b || "Racer B"}
                      disabled={!editableFields.includes("racer_b")}
                      onChange={(event) => setRaces((previous) => previous.map((item) => item.id === race.id ? { ...item, racer_b: event.target.value } : item))}
                      onBlur={(event) => handleAssignmentBlur(race.id, "racer_b", event.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div className="button-row" style={buttonRowStyle}>
                    <select value={race.bye_for ?? ""} onChange={(event) => handleRaceByeChange(race.id, event.target.value)} style={selectStyle}>
                      <option value="">No BYE</option>
                      <option value="A">Racer A advances by BYE</option>
                      <option value="B">Racer B advances by BYE</option>
                    </select>

                    <button onClick={() => clearRaceSeeds(race.id)} style={dangerButtonStyle}>Clear Seeds</button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section style={{ marginTop: 26 }}>
          <div style={sectionHeaderStyle}>
            <div>
              <h2 style={h2Style}>Race Control</h2>
              <div style={subTextStyle}>Enter run times, set NOW RACING, manage BYEs/DQs, and monitor advancement.</div>
            </div>
          </div>

          <div className="race-grid" style={cardGridStyle}>
            {races.map((race) => (
              <div
                className="race-card"
                key={`${district}-${division}-${bracketType}-${race.id}`}
                style={{
                  ...raceCardStyle,
                  border: race.is_current_override ? `2px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
                  boxShadow: race.is_current_override ? "0 0 18px rgba(34,197,94,0.22)" : "none",
                }}
              >
                <RaceHeader race={race} />

                <div style={matchupStyle}>{getRaceDisplayName(race)}</div>

                <div className="button-row" style={buttonRowStyle}>
                  <button onClick={() => setCurrentRace(race.id)} style={primaryButtonStyle}>Set NOW RACING</button>
                  {race.is_current_override && <button onClick={() => clearCurrentRace(race.id)} style={secondaryButtonStyle}>Clear LIVE</button>}
                  <button onClick={() => clearRaceEntries(race.id)} style={dangerButtonStyle}>Clear Race</button>
                </div>

                {districtParam === "southbronx"
                  ? <SouthBronxScoreboardInputs race={race} setRaces={setRaces} handleSouthBronxLeg={handleSouthBronxLeg} />
                  : <ScoreboardInputs race={race} setRaces={setRaces} handleRaceBlur={handleRaceBlur} />}

                <div style={statusBoxStyle}>
                  <div><span style={mutedLabelStyle}>Status:</span> {race.status || "Pending"}</div>
                  <div><span style={mutedLabelStyle}>Winner:</span> {race.winner || "--"}</div>
                  <div><span style={mutedLabelStyle}>Loser:</span> {race.loser || "--"}</div>
                  <div><span style={mutedLabelStyle}>Total A:</span> {race.total_a ?? "--"}</div>
                  <div><span style={mutedLabelStyle}>Total B:</span> {race.total_b ?? "--"}</div>
                </div>

                <div style={dividerStyle} />

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>BYE</label>
                  <select value={race.bye_for ?? ""} onChange={(event) => handleRaceByeChange(race.id, event.target.value)} style={selectStyle}>
                    <option value="">No BYE</option>
                    <option value="A">Racer A advances by BYE</option>
                    <option value="B">Racer B advances by BYE</option>
                  </select>
                </div>

                <div className="row-wrap" style={rowWrapStyle}>
                  <label style={checkboxLabelStyle}>
                    <input type="checkbox" checked={!!race.dq_a} onChange={(event) => handleRaceToggle(race.id, "dq_a", event.target.checked)} />
                    DQ Racer A
                  </label>

                  <label style={checkboxLabelStyle}>
                    <input type="checkbox" checked={!!race.dq_b} onChange={(event) => handleRaceToggle(race.id, "dq_b", event.target.checked)} />
                    DQ Racer B
                  </label>
                </div>

                <div className="row-wrap" style={rowWrapStyle}>
                  <select value={race.dq_reason_a ?? ""} onChange={(event) => handleRaceBlur(race.id, "dq_reason_a", event.target.value)} style={selectStyle}>
                    <option value="">DQ reason for Racer A</option>
                    {DQ_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                  </select>

                  <select value={race.dq_reason_b ?? ""} onChange={(event) => handleRaceBlur(race.id, "dq_reason_b", event.target.value)} style={selectStyle}>
                    <option value="">DQ reason for Racer B</option>
                    {DQ_REASONS.map((reason) => <option key={reason} value={reason}>{reason}</option>)}
                  </select>
                </div>

                <div style={fieldGroupStyle}>
                  <label style={labelStyle}>Note</label>
                  <input
                    type="text"
                    value={race.note ?? ""}
                    onChange={(event) => setRaces((previous) => previous.map((item) => item.id === race.id ? { ...item, note: event.target.value } : item))}
                    onBlur={(event) => handleRaceBlur(race.id, "note", event.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   CHILD COMPONENTS
========================================================= */

function RaceHeader({ race, compact = false }) {
  return (
    <div style={raceHeaderStyle}>
      <div>
        <div style={{ fontWeight: 900, fontSize: compact ? 15 : 17 }}>Race {race.id}</div>
        <div style={{ color: COLORS.muted2, fontSize: 12 }}>{race.round}</div>
      </div>

      <div
        style={{
          ...pillStyle,
          background: race.is_current_override ? COLORS.accentDark : COLORS.panel2,
          color: race.is_current_override ? "#bbf7d0" : COLORS.muted,
          border: race.is_current_override ? `1px solid ${COLORS.accent}` : `1px solid ${COLORS.border}`,
        }}
      >
        {race.is_current_override ? "● LIVE" : race.status || "Pending"}
      </div>
    </div>
  );
}

function SouthBronxScoreboardInputs({ race, setRaces, handleSouthBronxLeg }) {
  const legs = [
    { leg: 1, fieldA: "run1_lane1", fieldB: "run1_lane2" },
    { leg: 2, fieldA: "run2_lane1", fieldB: "run2_lane2" },
  ];

  return (
    <div style={scorePanelStyle}>
      <div style={scoreHeaderStyle}>
        <span>Run Times</span>
        <span style={{ color: COLORS.muted2 }}>Enter winner's time only</span>
      </div>

      {legs.map(({ leg, fieldA, fieldB }) => {
        const racerA = race.racer_a || "Racer A";
        const racerB = race.racer_b || "Racer B";

        return (
          <div key={leg} style={{ marginBottom: 10, padding: "10px 12px", background: COLORS.panel2, borderRadius: 10, border: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.muted, marginBottom: 8, letterSpacing: 0.4 }}>LEG {leg}</div>
            <div className="score-grid" style={scoreGridStyle}>
              {[["A", racerA, fieldA], ["B", racerB, fieldB]].map(([side, name, field]) => (
                <label key={side} style={scoreInputWrapStyle}>
                  <span style={smallLabelStyle}>{name}</span>
                  <input
                    type="number"
                    step="0.001"
                    value={race[field] ?? ""}
                    placeholder="--"
                    onChange={(event) =>
                      setRaces((prev) => prev.map((r) => r.id === race.id ? { ...r, [field]: event.target.value } : r))
                    }
                    onBlur={(event) => handleSouthBronxLeg(race.id, leg, side, event.target.value)}
                    style={inputStyle}
                  />
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScoreboardInputs({ race, setRaces, handleRaceBlur }) {
  const fields = [
    ["run1_lane1", "Run 1 Lane 1"],
    ["run1_lane2", "Run 1 Lane 2"],
    ["run2_lane1", "Run 2 Lane 1"],
    ["run2_lane2", "Run 2 Lane 2"],
  ];

  const totalFields = [
    ["total_a", "Override Total A"],
    ["total_b", "Override Total B"],
  ];

  return (
    <div style={scorePanelStyle}>
      <div style={scoreHeaderStyle}>
        <span>Run Times</span>
        <span style={{ color: COLORS.muted2 }}>Lane swap format</span>
      </div>

      <div className="score-grid" style={scoreGridStyle}>
        {fields.map(([field, label]) => (
          <label key={field} style={scoreInputWrapStyle}>
            <span style={smallLabelStyle}>{label}</span>
            <input
              type="number"
              step="0.001"
              value={race[field] ?? ""}
              placeholder="--"
              onChange={(event) => setRaces((previous) => previous.map((item) => item.id === race.id ? { ...item, [field]: event.target.value } : item))}
              onBlur={(event) => handleRaceBlur(race.id, field, event.target.value)}
              style={inputStyle}
            />
          </label>
        ))}
      </div>

      <div style={{ marginTop: 10, borderTop: `1px dashed ${COLORS.border}`, paddingTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#f59e0b", marginBottom: 6, letterSpacing: 0.4 }}>TOTAL OVERRIDE</div>
        <div className="score-grid" style={scoreGridStyle}>
          {totalFields.map(([field, label]) => (
            <label key={field} style={scoreInputWrapStyle}>
              <span style={{ ...smallLabelStyle, color: "#f59e0b" }}>{label}</span>
              <input
                type="number"
                step="0.001"
                value={race[field] ?? ""}
                placeholder="--"
                onChange={(event) => setRaces((previous) => previous.map((item) => item.id === race.id ? { ...item, [field]: event.target.value } : item))}
                onBlur={(event) => handleRaceBlur(race.id, field, event.target.value)}
                style={{ ...inputStyle, borderColor: "#92400e", background: "#1c1007" }}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const pageStyle = {
  background: COLORS.bg,
  minHeight: "100vh",
  color: COLORS.text,
};

const topGridStyle = {
  display: "grid",
  gridTemplateColumns: "1.25fr 0.75fr",
  gap: 16,
};

const panelStyle = {
  background: COLORS.panel,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 18,
  padding: 16,
};

const messageStyle = {
  background: COLORS.accent,
  color: "#022c22",
  padding: 12,
  borderRadius: 12,
  marginBottom: 16,
  fontWeight: 900,
};

const sectionTitleStyle = {
  fontSize: 17,
  fontWeight: 900,
  marginBottom: 12,
};

const fieldGroupStyle = {
  display: "grid",
  gap: 6,
  marginBottom: 12,
};

const labelStyle = {
  color: COLORS.muted,
  fontSize: 13,
  fontWeight: 800,
};

const selectStyle = {
  background: COLORS.input,
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: "9px 10px",
  minHeight: 38,
};

const inputStyle = {
  background: COLORS.input,
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: "9px 10px",
  minHeight: 38,
  flex: 1,
  fontSize: 15,
  fontWeight: 600,
};

const buttonWrapStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const activeButtonStyle = {
  background: COLORS.accent,
  color: "#022c22",
  border: "none",
  borderRadius: 999,
  padding: "9px 13px",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  background: COLORS.panel2,
  color: COLORS.text,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 999,
  padding: "9px 13px",
  fontWeight: 800,
  cursor: "pointer",
};

const primaryButtonStyle = {
  background: COLORS.accent,
  color: "#022c22",
  border: "none",
  borderRadius: 10,
  padding: "9px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const dangerButtonStyle = {
  background: COLORS.redDark,
  color: "#fecaca",
  border: "1px solid #991b1b",
  borderRadius: 10,
  padding: "9px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const contextLineStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  padding: "8px 0",
  borderBottom: `1px solid ${COLORS.border}`,
  color: COLORS.muted,
};

const sectionHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "end",
  marginBottom: 12,
};

const h2Style = {
  fontSize: 23,
  margin: 0,
  color: COLORS.text,
};

const subTextStyle = {
  color: COLORS.muted2,
  fontSize: 13,
  marginTop: 4,
};

const cardGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
  gap: 14,
};

const raceCardStyle = {
  background: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 18,
  padding: 16,
};

const raceHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "start",
  gap: 10,
  marginBottom: 12,
};

const pillStyle = {
  borderRadius: 999,
  padding: "5px 9px",
  fontSize: 11,
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const rowWrapStyle = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  flexWrap: "wrap",
};

const vsStyle = {
  color: COLORS.muted2,
  fontSize: 12,
  fontWeight: 900,
};

const buttonRowStyle = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 10,
};

const matchupStyle = {
  background: COLORS.panel2,
  border: `1px solid ${COLORS.border}`,
  padding: 10,
  borderRadius: 12,
  fontWeight: 900,
  marginBottom: 10,
};

const scorePanelStyle = {
  background: "#020617",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  padding: 10,
  marginTop: 10,
};

const scoreHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  fontSize: 12,
  fontWeight: 900,
  marginBottom: 8,
};

const scoreGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 8,
};

const scoreInputWrapStyle = {
  display: "grid",
  gap: 4,
};

const smallLabelStyle = {
  fontSize: 11,
  color: COLORS.muted2,
  fontWeight: 800,
};

const statusBoxStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 6,
  background: COLORS.panel2,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 14,
  padding: 10,
  marginTop: 10,
  fontSize: 13,
};

const mutedLabelStyle = {
  color: COLORS.muted2,
  fontWeight: 800,
};

const dividerStyle = {
  height: 1,
  background: COLORS.border,
  margin: "12px 0",
};

const checkboxLabelStyle = {
  color: COLORS.muted,
  fontWeight: 800,
  display: "flex",
  gap: 6,
  alignItems: "center",
};
