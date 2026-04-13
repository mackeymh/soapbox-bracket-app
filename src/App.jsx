import { useEffect, useMemo, useState } from "react";

const STORAGE_KEYS = {
  bracketType: "soapbox_bracketType",
  viewMode: "soapbox_viewMode",
  seeds12: "soapbox_seeds12",
  seeds64: "soapbox_seeds64",
  races12: "soapbox_races12",
  races64: "soapbox_races64",
  selected12: "soapbox_selected12",
  selected64: "soapbox_selected64",
};

const BYE_SEEDS_64 = new Set([
  1, 17, 9, 25, 5, 21, 13, 29, 3, 19, 11, 27, 7, 23, 15,
]);

const ROUND_ORDER_12 = [
  "Play-In Round",
  "Quarterfinals",
  "Semifinals",
  "Final",
  "Placement",
  "5th / 6th",
  "7th / 8th",
  "3rd / 4th",
]

const ROUND_ORDER_64 = [
  "Opening Round",
  "Round of 32",
  "Sweet 16",
  "Elite 8",
  "Final 4",
  "Championship",
  "5th / 6th",
  "7th / 8th",
  "3rd / 4th",
];

function loadFromStorage(key, fallback) {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
}

function makeSeedMap(count) {
  const map = {};
  for (let i = 1; i <= count; i++) {
    map[i] = `Racer ${i}`;
  }
  return map;
}

function parseTime(value) {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function createRace({
  id,
  round,
  slotA = "",
  slotB = "",
  racerA = "",
  racerB = "",
  nextWinnerTo = null,
  nextWinnerSlot = null,
  allowBye = false,
}) {
  return {
    id,
    round,
    slotA,
    slotB,
    racerA,
    racerB,
    run1Lane1: "",
    run1Lane2: "",
    run2Lane1: "",
    run2Lane2: "",
    run1Winner: "",
    run2Winner: "",
    run1Status: "Pending",
    run2Status: "Pending",
    totalA: "",
    totalB: "",
    winner: "",
    loser: "",
    status: "Pending",
    note: "",
    media: "",
    allowBye,
    byeFor: "",
    dqA: false,
    dqB: false,
    tiebreaker: false,
    flagged: false,
    nextWinnerTo,
    nextWinnerSlot,
  };
}

function make12CarRaces(seeds) {
  return [
    createRace({
      id: 1,
      round: "Play-In Round",
      slotA: "Seed 1",
      slotB: "Seed 2",
      racerA: seeds[1] || "",
      racerB: seeds[2] || "",
      nextWinnerTo: 5,
      nextWinnerSlot: "B",
    }),
    createRace({
      id: 2,
      round: "Play-In Round",
      slotA: "Seed 3",
      slotB: "Seed 4",
      racerA: seeds[3] || "",
      racerB: seeds[4] || "",
      nextWinnerTo: 6,
      nextWinnerSlot: "B",
    }),
    createRace({
      id: 3,
      round: "Play-In Round",
      slotA: "Seed 5",
      slotB: "Seed 6",
      racerA: seeds[5] || "",
      racerB: seeds[6] || "",
      nextWinnerTo: 7,
      nextWinnerSlot: "B",
    }),
    createRace({
      id: 4,
      round: "Play-In Round",
      slotA: "Seed 7",
      slotB: "Seed 8",
      racerA: seeds[7] || "",
      racerB: seeds[8] || "",
      nextWinnerTo: 8,
      nextWinnerSlot: "B",
    }),
    createRace({
      id: 5,
      round: "Quarterfinals",
      slotA: "Seed 9",
      slotB: "Winner Race 1",
      racerA: seeds[9] || "",
      racerB: "",
      nextWinnerTo: 9,
      nextWinnerSlot: "A",
      allowBye: true,
    }),
    createRace({
      id: 6,
      round: "Quarterfinals",
      slotA: "Seed 10",
      slotB: "Winner Race 2",
      racerA: seeds[10] || "",
      racerB: "",
      nextWinnerTo: 9,
      nextWinnerSlot: "B",
      allowBye: true,
    }),
    createRace({
      id: 7,
      round: "Quarterfinals",
      slotA: "Seed 11",
      slotB: "Winner Race 3",
      racerA: seeds[11] || "",
      racerB: "",
      nextWinnerTo: 10,
      nextWinnerSlot: "A",
      allowBye: true,
    }),
    createRace({
      id: 8,
      round: "Quarterfinals",
      slotA: "Seed 12",
      slotB: "Winner Race 4",
      racerA: seeds[12] || "",
      racerB: "",
      nextWinnerTo: 10,
      nextWinnerSlot: "B",
      allowBye: true,
    }),
    createRace({
      id: 9,
      round: "Semifinals",
      slotA: "Winner Race 5",
      slotB: "Winner Race 6",
      nextWinnerTo: 11,
      nextWinnerSlot: "A",
      allowBye: true,
    }),
    createRace({
      id: 10,
      round: "Semifinals",
      slotA: "Winner Race 7",
      slotB: "Winner Race 8",
      nextWinnerTo: 11,
      nextWinnerSlot: "B",
      allowBye: true,
    }),
    createRace({
      id: 11,
      round: "Final",
      slotA: "Winner Race 9",
      slotB: "Winner Race 10",
      allowBye: true,
    }),
  createRace({
  id: 12,
  round: "Placement",
  slotA: "Loser Race 5",
  slotB: "Loser Race 6",
  allowBye: true,
}),
createRace({
  id: 13,
  round: "Placement",
  slotA: "Loser Race 7",
  slotB: "Loser Race 8",
  allowBye: true,
}),
createRace({
  id: 14,
  round: "5th / 6th",
  slotA: "Winner Race 12",
  slotB: "Winner Race 13",
  allowBye: true,
}),
createRace({
  id: 15,
  round: "7th / 8th",
  slotA: "Loser Race 12",
  slotB: "Loser Race 13",
  allowBye: true,
}),
createRace({
  id: 16,
  round: "3rd / 4th",
  slotA: "Loser Race 9",
  slotB: "Loser Race 10",
  allowBye: true,
}),
  ];
}

function make64CarRaces(seeds) {
  const races = [];

  for (let i = 1; i <= 32; i++) {
    const seedA = i * 2 - 1;
    const seedB = i * 2;
    races.push(
      createRace({
        id: i,
        round: "Opening Round",
        slotA: `Seed ${seedA}`,
        slotB: `Seed ${seedB}`,
        racerA: seeds[seedA] || "",
        racerB: seeds[seedB] || "",
        nextWinnerTo: 32 + Math.ceil(i / 2),
        nextWinnerSlot: i % 2 === 1 ? "A" : "B",
        allowBye:
          BYE_SEEDS_64.has(seedA) || !seeds[seedA]?.trim() || !seeds[seedB]?.trim(),
      })
    );
  }

  for (let i = 33; i <= 48; i++) {
    races.push(
      createRace({
        id: i,
        round: "Round of 32",
        slotA: `Winner Race ${(i - 33) * 2 + 1}`,
        slotB: `Winner Race ${(i - 33) * 2 + 2}`,
        nextWinnerTo: 48 + Math.ceil((i - 32) / 2),
        nextWinnerSlot: (i - 33) % 2 === 0 ? "A" : "B",
        allowBye: true,
      })
    );
  }

  for (let i = 49; i <= 56; i++) {
    races.push(
      createRace({
        id: i,
        round: "Sweet 16",
        slotA: `Winner Race ${33 + (i - 49) * 2}`,
        slotB: `Winner Race ${34 + (i - 49) * 2}`,
        nextWinnerTo: 56 + Math.ceil((i - 48) / 2),
        nextWinnerSlot: (i - 49) % 2 === 0 ? "A" : "B",
        allowBye: true,
      })
    );
  }

  for (let i = 57; i <= 60; i++) {
    races.push(
      createRace({
        id: i,
        round: "Elite 8",
        slotA: `Winner Race ${49 + (i - 57) * 2}`,
        slotB: `Winner Race ${50 + (i - 57) * 2}`,
        nextWinnerTo: 60 + Math.ceil((i - 56) / 2),
        nextWinnerSlot: (i - 57) % 2 === 0 ? "A" : "B",
        allowBye: true,
      })
    );
  }

  races.push(
    createRace({
      id: 61,
      round: "Final 4",
      slotA: "Winner Race 57",
      slotB: "Winner Race 58",
      nextWinnerTo: 63,
      nextWinnerSlot: "A",
      allowBye: true,
    }),
    createRace({
      id: 62,
      round: "Final 4",
      slotA: "Winner Race 59",
      slotB: "Winner Race 60",
      nextWinnerTo: 63,
      nextWinnerSlot: "B",
      allowBye: true,
    }),
    createRace({
      id: 63,
      round: "Championship",
      slotA: "Winner Race 61",
      slotB: "Winner Race 62",
      allowBye: true,
    }),
    createRace({
      id: 66,
      round: "5th / 6th",
      slotA: "Loser Race 57",
      slotB: "Loser Race 58",
      allowBye: true,
    }),
    createRace({
      id: 67,
      round: "7th / 8th",
      slotA: "Loser Race 59",
      slotB: "Loser Race 60",
      allowBye: true,
    }),
    createRace({
      id: 68,
      round: "3rd / 4th",
      slotA: "Loser Race 61",
      slotB: "Loser Race 62",
      allowBye: true,
    })
  );

  return races;
}

function computeRaceResult(race) {
  const racerA = (race.racerA || "").trim();
  const racerB = (race.racerB || "").trim();

  let run1Winner = "";
  let run2Winner = "";
  let run1Status = "Pending";
  let run2Status = "Pending";

  const r1l1 = parseTime(race.run1Lane1);
  const r1l2 = parseTime(race.run1Lane2);
  const r2l1 = parseTime(race.run2Lane1);
  const r2l2 = parseTime(race.run2Lane2);

  if (r1l1 !== null && r1l2 !== null) {
    run1Status = "Complete";
    if (r1l1 < r1l2) run1Winner = racerA;
    else if (r1l2 < r1l1) run1Winner = racerB;
    else run1Winner = "Tie";
  }

  if (r2l1 !== null && r2l2 !== null) {
    run2Status = "Complete";
    if (r2l2 < r2l1) run2Winner = racerA;
    else if (r2l1 < r2l2) run2Winner = racerB;
    else run2Winner = "Tie";
  }

  if (!racerA && !racerB) {
    return {
      ...race,
      run1Winner,
      run2Winner,
      run1Status,
      run2Status,
      totalA: "",
      totalB: "",
      winner: "",
      loser: "",
      tiebreaker: false,
      flagged: false,
      status: "Pending",
    };
  }

  if (race.byeFor === "A") {
    return {
      ...race,
      run1Winner: "BYE",
      run2Winner: "BYE",
      run1Status: "Complete",
      run2Status: "Complete",
      totalA: "",
      totalB: "",
      winner: racerA || "",
      loser: racerB || "",
      tiebreaker: false,
      flagged: !racerA,
      status: racerA ? "Complete" : "Flagged",
    };
  }

  if (race.byeFor === "B") {
    return {
      ...race,
      run1Winner: "BYE",
      run2Winner: "BYE",
      run1Status: "Complete",
      run2Status: "Complete",
      totalA: "",
      totalB: "",
      winner: racerB || "",
      loser: racerA || "",
      tiebreaker: false,
      flagged: !racerB,
      status: racerB ? "Complete" : "Flagged",
    };
  }

  if (race.dqA && race.dqB) {
    return {
      ...race,
      run1Winner: "DQ",
      run2Winner: "DQ",
      run1Status: "Complete",
      run2Status: "Complete",
      totalA: "",
      totalB: "",
      winner: "",
      loser: "",
      tiebreaker: false,
      flagged: true,
      status: "Flagged",
    };
  }

  if (race.dqA) {
    return {
      ...race,
      run1Winner: "DQ",
      run2Winner: "DQ",
      run1Status: "Complete",
      run2Status: "Complete",
      totalA: "",
      totalB: "",
      winner: racerB || "",
      loser: racerA || "",
      tiebreaker: false,
      flagged: !racerB,
      status: racerB ? "Complete" : "Flagged",
    };
  }

  if (race.dqB) {
    return {
      ...race,
      run1Winner: "DQ",
      run2Winner: "DQ",
      run1Status: "Complete",
      run2Status: "Complete",
      totalA: "",
      totalB: "",
      winner: racerA || "",
      loser: racerB || "",
      tiebreaker: false,
      flagged: !racerA,
      status: racerA ? "Complete" : "Flagged",
    };
  }

  if ([r1l1, r1l2, r2l1, r2l2].some((v) => v === null)) {
    return {
      ...race,
      run1Winner,
      run2Winner,
      run1Status,
      run2Status,
      totalA: "",
      totalB: "",
      winner: "",
      loser: "",
      tiebreaker: false,
      flagged: false,
      status:
        run1Status === "Complete" || run2Status === "Complete"
          ? "In Progress"
          : "Pending",
    };
  }

  const totalA = Number((r1l1 + r2l2).toFixed(3));
  const totalB = Number((r1l2 + r2l1).toFixed(3));

  if (totalA === totalB) {
    return {
      ...race,
      run1Winner,
      run2Winner,
      run1Status,
      run2Status,
      totalA,
      totalB,
      winner: "",
      loser: "",
      tiebreaker: true,
      flagged: true,
      status: "Tiebreaker",
    };
  }

  const winner = totalA < totalB ? racerA : racerB;
  const loser = totalA < totalB ? racerB : racerA;

  return {
    ...race,
    run1Winner,
    run2Winner,
    run1Status,
    run2Status,
    totalA,
    totalB,
    winner,
    loser,
    tiebreaker: false,
    flagged: false,
    status: "Complete",
  };
}

function applyAdvancement(races, bracketType) {
  const updated = races.map((race) => ({ ...race }));

  function setRaceSlot(raceId, slot, value) {
    const race = updated.find((r) => r.id === raceId);
    if (!race) return;
    if (slot === "A") race.racerA = value || "";
    if (slot === "B") race.racerB = value || "";
  }

  updated.forEach((race) => {
    if (race.nextWinnerTo && race.nextWinnerSlot) {
      setRaceSlot(race.nextWinnerTo, race.nextWinnerSlot, race.winner || "");
    }
  });

  if (bracketType === "12") {
  const r5 = updated.find((r) => r.id === 5);
  const r6 = updated.find((r) => r.id === 6);
  const r7 = updated.find((r) => r.id === 7);
  const r8 = updated.find((r) => r.id === 8);
  const r9 = updated.find((r) => r.id === 9);
  const r10 = updated.find((r) => r.id === 10);
  const r12 = updated.find((r) => r.id === 12);
  const r13 = updated.find((r) => r.id === 13);

  setRaceSlot(12, "A", r5?.loser || "");
  setRaceSlot(12, "B", r6?.loser || "");

  setRaceSlot(13, "A", r7?.loser || "");
  setRaceSlot(13, "B", r8?.loser || "");

  setRaceSlot(14, "A", r12?.winner || "");
  setRaceSlot(14, "B", r13?.winner || "");

  setRaceSlot(15, "A", r12?.loser || "");
  setRaceSlot(15, "B", r13?.loser || "");

  setRaceSlot(16, "A", r9?.loser || "");
  setRaceSlot(16, "B", r10?.loser || "");
}
if (bracketType === "64") {
    const r57 = updated.find((r) => r.id === 57);
    const r58 = updated.find((r) => r.id === 58);
    const r59 = updated.find((r) => r.id === 59);
    const r60 = updated.find((r) => r.id === 60);
    const r61 = updated.find((r) => r.id === 61);
    const r62 = updated.find((r) => r.id === 62);

    setRaceSlot(66, "A", r57?.loser || "");
    setRaceSlot(66, "B", r58?.loser || "");
    setRaceSlot(67, "A", r59?.loser || "");
    setRaceSlot(67, "B", r60?.loser || "");
    setRaceSlot(68, "A", r61?.loser || "");
    setRaceSlot(68, "B", r62?.loser || "");
  }

  return updated;
}

function recalculateAll(races, bracketType) {
  let working = races.map((race) => computeRaceResult(race));
  working = applyAdvancement(working, bracketType);
  working = working.map((race) => computeRaceResult(race));
  working = applyAdvancement(working, bracketType);
  return working;
}

function getStatusColor(status) {
  if (status === "Complete") return "#22c55e";
  if (status === "In Progress") return "#38bdf8";
  if (status === "Tiebreaker") return "#f59e0b";
  if (status === "Flagged") return "#ef4444";
  return "#94a3b8";
}

function buildPlacements(races, bracketType) {
  if (bracketType === "12") {
  const r11 = races.find((r) => r.id === 11);
  const r14 = races.find((r) => r.id === 14);
  const r15 = races.find((r) => r.id === 15);
  const r16 = races.find((r) => r.id === 16);

  return [
    { place: "1st", name: r11?.winner || "" },
    { place: "2nd", name: r11?.loser || "" },
    { place: "3rd", name: r16?.winner || "" },
    { place: "4th", name: r16?.loser || "" },
    { place: "5th", name: r14?.winner || "" },
    { place: "6th", name: r14?.loser || "" },
    { place: "7th", name: r15?.winner || "" },
    { place: "8th", name: r15?.loser || "" },
  ];
}

  const r63 = races.find((r) => r.id === 63);
  const r66 = races.find((r) => r.id === 66);
  const r67 = races.find((r) => r.id === 67);
  const r68 = races.find((r) => r.id === 68);

  return [
    { place: "1st", name: r63?.winner || "" },
    { place: "2nd", name: r63?.loser || "" },
    { place: "3rd", name: r68?.winner || "" },
    { place: "4th", name: r68?.loser || "" },
    { place: "5th", name: r66?.winner || "" },
    { place: "6th", name: r66?.loser || "" },
    { place: "7th", name: r67?.winner || "" },
    { place: "8th", name: r67?.loser || "" },
  ];
}

function mergeSeedNamesIntoRaces(baseRaces, existingRaces) {
  return baseRaces.map((baseRace) => {
    const existing = existingRaces.find((r) => r.id === baseRace.id);
    if (!existing) return baseRace;

    const isSeedSlotA = baseRace.slotA.startsWith("Seed ");
    const isSeedSlotB = baseRace.slotB.startsWith("Seed ");

    return {
      ...existing,
      slotA: baseRace.slotA,
      slotB: baseRace.slotB,
      racerA: isSeedSlotA ? baseRace.racerA : existing.racerA,
      racerB: isSeedSlotB ? baseRace.racerB : existing.racerB,
      allowBye: baseRace.allowBye || existing.allowBye,
    };
  });
}

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
  border: "1px solid #475569",
  background: "#0f172a",
  color: "white",
};

const panelStyle = {
  background: "#1e293b",
  border: "1px solid #334155",
  borderRadius: 12,
  padding: 18,
};

const SCHOOL_CODES = [
  "11X016",
  "11X019",
  "11X041",
  "11X068",
  "11X076",
  "11X078",
  "11X083",
  "11X087",
  "11X089",
  "11X096",
  "11X097",
  "11X103",
  "11X105",
  "11X106",
  "11X108",
  "11X111",
  "11X121",
  "11X127",
  "11X144",
  "11X153",
  "11X160",
  "11X169",
  "11X175",
  "11X180",
  "11X181",
  "11X194",
  "11X370",
  "11X462",
  "11X483",
  "11X498",
  "11X529",
  "11X566",
  "11X567",
];

function schoolCodeToShort(code) {
  return code.replace("11X", "");
}

function raceMatchesSchool(race, selectedSchool) {
  if (selectedSchool === "All Schools") return true;

  const shortCode = schoolCodeToShort(selectedSchool);
  const racerA = race.racerA || "";
  const racerB = race.racerB || "";

  return racerA.startsWith(`${shortCode}-`) || racerB.startsWith(`${shortCode}-`);
}

function getSchoolPerformance(races, schoolCode) {
  if (schoolCode === "All Schools") {
    return {
      cars: [],
      total: races.length,
      completed: races.filter((race) => race.status === "Complete").length,
      wins: 0,
      losses: 0,
      upcoming: races.filter((race) => race.status === "Pending").length,
      current: races.filter(
        (race) =>
          race.status === "In Progress" ||
          race.status === "Tiebreaker" ||
          race.status === "Flagged"
      ).length,
    };
  }

  const shortCode = schoolCodeToShort(schoolCode);

  const schoolRaces = races.filter((race) => {
    const a = race.racerA || "";
    const b = race.racerB || "";
    return a.startsWith(`${shortCode}-`) || b.startsWith(`${shortCode}-`);
  });

  const cars = Array.from(
    new Set(
      schoolRaces.flatMap((race) => {
        const list = [];
        if ((race.racerA || "").startsWith(`${shortCode}-`)) list.push(race.racerA);
        if ((race.racerB || "").startsWith(`${shortCode}-`)) list.push(race.racerB);
        return list;
      })
    )
  ).sort();

  const completed = schoolRaces.filter((race) => race.status === "Complete").length;
  const wins = schoolRaces.filter((race) => (race.winner || "").startsWith(`${shortCode}-`)).length;
  const upcoming = schoolRaces.filter((race) => race.status === "Pending").length;
  const current = schoolRaces.filter(
    (race) =>
      race.status === "In Progress" ||
      race.status === "Tiebreaker" ||
      race.status === "Flagged"
  ).length;

  return {
    cars,
    total: schoolRaces.length,
    completed,
    wins,
    losses: completed - wins,
    upcoming,
    current,
  };
}

export default function App() {
  const initialSeeds12 = loadFromStorage(STORAGE_KEYS.seeds12, makeSeedMap(12));
  const initialSeeds64 = loadFromStorage(STORAGE_KEYS.seeds64, makeSeedMap(64));

  const initialRaces12 = loadFromStorage(
    STORAGE_KEYS.races12,
    recalculateAll(make12CarRaces(initialSeeds12), "12")
  );
  const initialRaces64 = loadFromStorage(
    STORAGE_KEYS.races64,
    recalculateAll(make64CarRaces(initialSeeds64), "64")
  );

  const [bracketType, setBracketType] = useState(
    loadFromStorage(STORAGE_KEYS.bracketType, "12")
  );
  const [viewMode, setViewMode] = useState(
    loadFromStorage(STORAGE_KEYS.viewMode, "admin")
  );

  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState("All Schools");
  const [spectatorRaceFilter, setSpectatorRaceFilter] = useState("Completed");

  const [seedNames12, setSeedNames12] = useState(initialSeeds12);
  const [seedNames64, setSeedNames64] = useState(initialSeeds64);

  const [races12, setRaces12] = useState(initialRaces12);
  const [races64, setRaces64] = useState(initialRaces64);

  const [selectedRaceId12, setSelectedRaceId12] = useState(
    loadFromStorage(STORAGE_KEYS.selected12, 1)
  );
  const [selectedRaceId64, setSelectedRaceId64] = useState(
    loadFromStorage(STORAGE_KEYS.selected64, 1)
  );

  useEffect(() => saveToStorage(STORAGE_KEYS.bracketType, bracketType), [bracketType]);
  useEffect(() => saveToStorage(STORAGE_KEYS.viewMode, viewMode), [viewMode]);
  useEffect(() => saveToStorage(STORAGE_KEYS.seeds12, seedNames12), [seedNames12]);
  useEffect(() => saveToStorage(STORAGE_KEYS.seeds64, seedNames64), [seedNames64]);
  useEffect(() => saveToStorage(STORAGE_KEYS.races12, races12), [races12]);
  useEffect(() => saveToStorage(STORAGE_KEYS.races64, races64), [races64]);
  useEffect(() => saveToStorage(STORAGE_KEYS.selected12, selectedRaceId12), [selectedRaceId12]);
  useEffect(() => saveToStorage(STORAGE_KEYS.selected64, selectedRaceId64), [selectedRaceId64]);

  const seedNames = bracketType === "12" ? seedNames12 : seedNames64;
  const races = bracketType === "12" ? races12 : races64;
  const selectedRaceId = bracketType === "12" ? selectedRaceId12 : selectedRaceId64;
  const roundOrder = bracketType === "12" ? ROUND_ORDER_12 : ROUND_ORDER_64;
  const selectedRace = races.find((race) => race.id === selectedRaceId) || null;

  const groupedRaces = useMemo(
    () =>
      roundOrder.map((roundName) => ({
        roundName,
        races: races.filter((race) => race.round === roundName),
      })),
    [races, roundOrder]
  );

  const latestPublishedRace = [...races]
    .filter(
      (race) =>
        race.run1Status === "Complete" ||
        race.run2Status === "Complete" ||
        race.status === "Complete"
    )
    .sort((a, b) => b.id - a.id)[0];

  const nextPendingRace = races.find(
    (race) => race.status === "Pending" || race.status === "In Progress"
  );

  const placements = buildPlacements(races, bracketType);
  const schoolPerformance = getSchoolPerformance(races, selectedSchoolFilter);

  function changeBracket(type) {
    setBracketType(type);
  }

  function setSelectedRaceId(id) {
    if (bracketType === "12") setSelectedRaceId12(id);
    else setSelectedRaceId64(id);
  }

  function updateSeed(seed, value) {
    if (bracketType === "12") {
      const nextSeeds = { ...seedNames12, [seed]: value };
      setSeedNames12(nextSeeds);

      const rebuilt = make12CarRaces(nextSeeds);
      const merged = mergeSeedNamesIntoRaces(rebuilt, races12);
      setRaces12(recalculateAll(merged, "12"));
    } else {
      const nextSeeds = { ...seedNames64, [seed]: value };
      setSeedNames64(nextSeeds);

      const rebuilt = make64CarRaces(nextSeeds);
      const merged = mergeSeedNamesIntoRaces(rebuilt, races64);
      setRaces64(recalculateAll(merged, "64"));
    }
  }

  function updateRace(id, updates) {
    if (bracketType === "12") {
      setRaces12((prev) =>
        recalculateAll(
          prev.map((race) => (race.id === id ? { ...race, ...updates } : race)),
          "12"
        )
      );
    } else {
      setRaces64((prev) =>
        recalculateAll(
          prev.map((race) => (race.id === id ? { ...race, ...updates } : race)),
          "64"
        )
      );
    }
  }

  function renderHeader() {
    return (
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <img
          src="/logo.png"
          alt="Soap Box Derby Logo"
          style={{ maxWidth: 180, marginBottom: 10 }}
        />
        <h1
          style={{
            fontSize: 32,
            margin: 0,
            color: "white",
            fontWeight: "bold",
            textAlign: "center",
          }}
        >
          5th Annual District 11 Soap Box Derby Race
        </h1>
      </div>
    );
  }

  if (viewMode === "spectator") {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #020617 0%, #0f172a 100%)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        padding: 24,
      }}
    >
      {renderHeader()}

      <div
        style={{
          textAlign: "center",
          marginBottom: 18,
          color: "#e2e8f0",
          fontSize: 20,
          fontWeight: "bold",
        }}
      >
        {bracketType === "12" ? "12-Car Bracket Race" : "64-Car Bracket Race"}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => setViewMode("admin")}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#334155",
            color: "white",
            cursor: "pointer",
          }}
        >
          Back to Admin
        </button>
        <button
          onClick={() => changeBracket("12")}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: bracketType === "12" ? "#22c55e" : "#334155",
            color: "white",
            cursor: "pointer",
          }}
        >
          12-Car
        </button>
        <button
          onClick={() => changeBracket("64")}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: bracketType === "64" ? "#22c55e" : "#334155",
            color: "white",
            cursor: "pointer",
          }}
        >
          64-Car
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
          justifyContent: "center",
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        {["Completed", "Current", "Pending", "All"].map((filter) => (
          <button
            key={filter}
            onClick={() => setSpectatorRaceFilter(filter)}
            style={{
              padding: "8px 14px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              background:
                spectatorRaceFilter === filter ? "#38bdf8" : "#334155",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {filter} Races
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <select
          value={selectedSchoolFilter}
          onChange={(e) => setSelectedSchoolFilter(e.target.value)}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid #475569",
            background: "#0f172a",
            color: "white",
            minWidth: 220,
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div style={{ ...panelStyle, background: "#111827", padding: 28 }}>
          <div style={{ color: "#93c5fd", fontSize: 18, marginBottom: 12 }}>
            Latest Published Result
          </div>

          {latestPublishedRace && raceMatchesSchool(latestPublishedRace, selectedSchoolFilter) ? (
            <>
              <div style={{ fontSize: 22, color: "#cbd5e1", marginBottom: 8 }}>
                {latestPublishedRace.racerA || latestPublishedRace.slotA} vs{" "}
                {latestPublishedRace.racerB || latestPublishedRace.slotB}
              </div>
              <div style={{ color: "#94a3b8", marginBottom: 12 }}>
                Race {latestPublishedRace.id} • {latestPublishedRace.round}
              </div>

              {latestPublishedRace.run1Status === "Complete" && (
                <div
                  style={{
                    background: "#1e293b",
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: 8 }}>First Run</div>
                  <div>
                    Lane 1 ({latestPublishedRace.racerA || "Racer A"}):{" "}
                    {latestPublishedRace.run1Lane1 || "--"}
                  </div>
                  <div>
                    Lane 2 ({latestPublishedRace.racerB || "Racer B"}):{" "}
                    {latestPublishedRace.run1Lane2 || "--"}
                  </div>
                  <div style={{ marginTop: 4, color: "#22c55e", fontWeight: "bold" }}>
                    Winner: {latestPublishedRace.run1Winner || "--"}
                  </div>
                </div>
              )}

              {latestPublishedRace.run2Status === "Complete" && (
                <div
                  style={{
                    background: "#1e293b",
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                    Final Run (Lanes Switched)
                  </div>
                  <div>
                    Lane 1 ({latestPublishedRace.racerB || "Racer B"}):{" "}
                    {latestPublishedRace.run2Lane1 || "--"}
                  </div>
                  <div>
                    Lane 2 ({latestPublishedRace.racerA || "Racer A"}):{" "}
                    {latestPublishedRace.run2Lane2 || "--"}
                  </div>
                  <div style={{ marginTop: 4, color: "#22c55e", fontWeight: "bold" }}>
                    Winner: {latestPublishedRace.run2Winner || "--"}
                  </div>
                </div>
              )}

              {latestPublishedRace.status === "Complete" && (
                <div
                  style={{
                    background: "#1e293b",
                    padding: 14,
                    borderRadius: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: 8 }}>Overall</div>
                  <div>
                    {latestPublishedRace.racerA || "Racer A"} Total:{" "}
                    {latestPublishedRace.totalA === ""
                      ? "--"
                      : latestPublishedRace.totalA}
                  </div>
                  <div>
                    {latestPublishedRace.racerB || "Racer B"} Total:{" "}
                    {latestPublishedRace.totalB === ""
                      ? "--"
                      : latestPublishedRace.totalB}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      color: "#22c55e",
                      fontWeight: "bold",
                      fontSize: 20,
                    }}
                  >
                    Overall Winner: {latestPublishedRace.winner || "--"}
                  </div>
                </div>
              )}

              {latestPublishedRace.byeFor && (
                <div style={{ color: "#22c55e", fontWeight: "bold", marginBottom: 10 }}>
                  {latestPublishedRace.byeFor === "A"
                    ? `${latestPublishedRace.racerA} advanced by BYE`
                    : `${latestPublishedRace.racerB} advanced by BYE`}
                </div>
              )}

              {latestPublishedRace.dqA && !latestPublishedRace.dqB && (
                <div style={{ color: "#22c55e", fontWeight: "bold", marginBottom: 10 }}>
                  {latestPublishedRace.racerA} DQ — {latestPublishedRace.racerB} advanced
                </div>
              )}

              {latestPublishedRace.dqB && !latestPublishedRace.dqA && (
                <div style={{ color: "#22c55e", fontWeight: "bold", marginBottom: 10 }}>
                  {latestPublishedRace.racerB} DQ — {latestPublishedRace.racerA} advanced
                </div>
              )}

              {latestPublishedRace.dqA && latestPublishedRace.dqB && (
                <div style={{ color: "#ef4444", fontWeight: "bold", marginBottom: 10 }}>
                  Both racers DQ’d — no winner
                </div>
              )}

              {latestPublishedRace.media ? (
                <img
                  src={latestPublishedRace.media}
                  alt="Finish line result"
                  style={{
                    width: "100%",
                    borderRadius: 12,
                    border: "1px solid #334155",
                    marginTop: 8,
                  }}
                />
              ) : null}
            </>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: 18 }}>
              No published race results for this filter yet.
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ ...panelStyle, background: "#111827" }}>
            <div style={{ color: "#93c5fd", marginBottom: 10, fontSize: 18 }}>
              School Summary
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>School:</strong> {selectedSchoolFilter}
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>Total Races:</strong> {schoolPerformance.total}
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>Completed:</strong> {schoolPerformance.completed}
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>Current:</strong> {schoolPerformance.current}
            </div>
            <div style={{ marginBottom: 6 }}>
              <strong>Upcoming:</strong> {schoolPerformance.upcoming}
            </div>
            {selectedSchoolFilter !== "All Schools" && (
              <>
                <div style={{ marginBottom: 6 }}>
                  <strong>Wins:</strong> {schoolPerformance.wins}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong>Losses:</strong> {schoolPerformance.losses}
                </div>
                <div style={{ marginTop: 10 }}>
                  <strong>Cars:</strong>{" "}
                  {schoolPerformance.cars.length > 0
                    ? schoolPerformance.cars.join(", ")
                    : "--"}
                </div>
              </>
            )}
          </div>

          <div style={{ ...panelStyle, background: "#111827" }}>
            <div style={{ color: "#93c5fd", marginBottom: 10, fontSize: 18 }}>
              Up Next
            </div>
            {nextPendingRace && raceMatchesSchool(nextPendingRace, selectedSchoolFilter) ? (
              <>
                <div style={{ fontSize: 24, fontWeight: "bold" }}>
                  {nextPendingRace.racerA || nextPendingRace.slotA}
                </div>
                <div style={{ color: "#94a3b8", margin: "6px 0" }}>vs</div>
                <div style={{ fontSize: 24, fontWeight: "bold" }}>
                  {nextPendingRace.racerB || nextPendingRace.slotB}
                </div>
                <div style={{ marginTop: 10, color: "#cbd5e1" }}>
                  Race {nextPendingRace.id} • {nextPendingRace.round}
                </div>
              </>
            ) : (
              <div style={{ color: "#94a3b8" }}>
                No upcoming race for this filter.
              </div>
            )}
          </div>

          <div
            style={{
              ...panelStyle,
              background: "#111827",
              maxHeight: 430,
              overflowY: "auto",
            }}
          >
            <div style={{ color: "#93c5fd", marginBottom: 12, fontSize: 18 }}>
              {bracketType === "12" ? "12-Car Heat Results" : "64-Car Heat Results"} —{" "}
              {spectatorRaceFilter}
            </div>

            {groupedRaces.map((group) => {
              const visibleRaces = group.races.filter((race) => {
                const matchesSchool = raceMatchesSchool(race, selectedSchoolFilter);

                if (!matchesSchool) return false;

                if (spectatorRaceFilter === "All") return true;

                if (spectatorRaceFilter === "Completed") {
                  return race.status === "Complete";
                }

                if (spectatorRaceFilter === "Current") {
                  return (
                    race.status === "In Progress" ||
                    race.status === "Tiebreaker" ||
                    race.status === "Flagged" ||
                    ((race.run1Status === "Complete" || race.run2Status === "Complete") &&
                      race.status !== "Complete")
                  );
                }

                if (spectatorRaceFilter === "Pending") {
                  return race.status === "Pending";
                }

                return true;
              });

              if (visibleRaces.length === 0) return null;

              return (
                <div key={group.roundName} style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      marginBottom: 8,
                      color: "#e2e8f0",
                      fontSize: 16,
                    }}
                  >
                    {group.roundName}
                  </div>

                  {visibleRaces.map((race) => (
                    <div
                      key={race.id}
                      style={{
                        background: "#1e293b",
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 10,
                        border: "1px solid #334155",
                      }}
                    >
                      <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>
                        Race {race.id}
                      </div>

                      <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                        {race.racerA || race.slotA} vs {race.racerB || race.slotB}
                      </div>

                      <div
                        style={{
                          marginBottom: 8,
                          color: getStatusColor(race.status),
                          fontWeight: "bold",
                        }}
                      >
                        Status: {race.status}
                      </div>

                      {race.run1Status === "Complete" && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: 10,
                            borderRadius: 10,
                            background: "#0f172a",
                            color: "#e2e8f0",
                            fontSize: 14,
                          }}
                        >
                          <div style={{ fontWeight: "bold", marginBottom: 6 }}>First Run</div>
                          <div>
                            Lane 1 ({race.racerA || "Racer A"}): {race.run1Lane1 || "--"}
                          </div>
                          <div>
                            Lane 2 ({race.racerB || "Racer B"}): {race.run1Lane2 || "--"}
                          </div>
                          <div style={{ marginTop: 4, color: "#22c55e", fontWeight: "bold" }}>
                            Winner: {race.run1Winner || "--"}
                          </div>
                        </div>
                      )}

                      {race.run2Status === "Complete" && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: 10,
                            borderRadius: 10,
                            background: "#0f172a",
                            color: "#e2e8f0",
                            fontSize: 14,
                          }}
                        >
                          <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                            Final Run (Lanes Switched)
                          </div>
                          <div>
                            Lane 1 ({race.racerB || "Racer B"}): {race.run2Lane1 || "--"}
                          </div>
                          <div>
                            Lane 2 ({race.racerA || "Racer A"}): {race.run2Lane2 || "--"}
                          </div>
                          <div style={{ marginTop: 4, color: "#22c55e", fontWeight: "bold" }}>
                            Winner: {race.run2Winner || "--"}
                          </div>
                        </div>
                      )}

                      {race.status === "Complete" && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: 10,
                            borderRadius: 10,
                            background: "#0f172a",
                            color: "#e2e8f0",
                            fontSize: 14,
                          }}
                        >
                          <div style={{ fontWeight: "bold", marginBottom: 6 }}>Overall</div>
                          <div>
                            {race.racerA || "Racer A"} Total:{" "}
                            {race.totalA === "" ? "--" : race.totalA}
                          </div>
                          <div>
                            {race.racerB || "Racer B"} Total:{" "}
                            {race.totalB === "" ? "--" : race.totalB}
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              color: "#22c55e",
                              fontWeight: "bold",
                            }}
                          >
                            Overall Winner: {race.winner || "--"}
                          </div>
                        </div>
                      )}

                      {race.byeFor && (
                        <div style={{ marginTop: 8, color: "#22c55e", fontWeight: "bold" }}>
                          {race.byeFor === "A"
                            ? `${race.racerA} advanced by BYE`
                            : `${race.racerB} advanced by BYE`}
                        </div>
                      )}

                      {race.dqA && !race.dqB && (
                        <div style={{ marginTop: 8, color: "#22c55e", fontWeight: "bold" }}>
                          {race.racerA} DQ — {race.racerB} advanced
                        </div>
                      )}

                      {race.dqB && !race.dqA && (
                        <div style={{ marginTop: 8, color: "#22c55e", fontWeight: "bold" }}>
                          {race.racerB} DQ — {race.racerA} advanced
                        </div>
                      )}

                      {race.dqA && race.dqB && (
                        <div style={{ marginTop: 8, color: "#ef4444", fontWeight: "bold" }}>
                          Both racers DQ’d
                        </div>
                      )}

                      {race.tiebreaker && (
                        <div style={{ marginTop: 8, color: "#f59e0b", fontWeight: "bold" }}>
                          Tiebreaker required
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div style={{ ...panelStyle, background: "#111827" }}>
            <div style={{ color: "#93c5fd", marginBottom: 12, fontSize: 18 }}>
              Live Placements
            </div>
            {placements.map((p) => (
              <div
                key={p.place}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "6px 0",
                  borderBottom: "1px solid #1e293b",
                }}
              >
                <strong>{p.place}</strong>
                <span>{p.name || "--"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        fontFamily: "Arial, sans-serif",
        background: "#0f172a",
        color: "white",
      }}
    >
      {renderHeader()}

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => changeBracket("12")}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: bracketType === "12" ? "#22c55e" : "#334155",
            color: "white",
          }}
        >
          12-Car Bracket
        </button>
        <button
          onClick={() => changeBracket("64")}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: bracketType === "64" ? "#22c55e" : "#334155",
            color: "white",
          }}
        >
          64-Car Bracket
        </button>
        <button
          onClick={() => setViewMode("spectator")}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            background: "#2563eb",
            color: "white",
          }}
        >
          Open Spectator View
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 1.6fr 1fr",
          gap: 20,
          alignItems: "start",
        }}
      >
        <div
          style={{
            ...panelStyle,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <h2 style={{ marginTop: 0 }}>
            Seed Entry ({bracketType === "12" ? "12-Car" : "64-Car"})
          </h2>
          <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 12 }}>
            Seeds are saved automatically.
          </div>

          {Object.keys(seedNames).map((seed) => (
            <div key={seed} style={{ marginBottom: 10 }}>
              <label
                style={{
                  display: "block",
                  marginBottom: 4,
                  fontSize: 13,
                  color: "#cbd5e1",
                }}
              >
                Seed {seed}
              </label>
              <input
                type="text"
                value={seedNames[seed]}
                onChange={(e) => updateSeed(Number(seed), e.target.value)}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid #475569",
                  background: "#0f172a",
                  color: "white",
                }}
              />
            </div>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
            {groupedRaces.map((group) => (
              <div key={group.roundName} style={{ minWidth: 250 }}>
                <h2
                  style={{
                    fontSize: 20,
                    marginBottom: 12,
                    color: "#93c5fd",
                  }}
                >
                  {group.roundName}
                </h2>

                {group.races.map((race) => (
                  <div
                    key={race.id}
                    onClick={() => setSelectedRaceId(race.id)}
                    style={{
                      background: selectedRaceId === race.id ? "#334155" : "#1e293b",
                      border: "1px solid #475569",
                      borderRadius: 12,
                      padding: 14,
                      marginBottom: 12,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: 6 }}>Race {race.id}</div>
                    <div>{race.racerA || race.slotA}</div>
                    <div style={{ color: "#94a3b8", margin: "4px 0" }}>vs</div>
                    <div>{race.racerB || race.slotB}</div>
                    <div
                      style={{
                        marginTop: 10,
                        color: getStatusColor(race.status),
                        fontWeight: "bold",
                        fontSize: 14,
                      }}
                    >
                      {race.status}
                    </div>
                    {race.run1Status === "Complete" && (
                      <div style={{ marginTop: 4, color: "#38bdf8", fontSize: 13 }}>
                        First Run Winner: {race.run1Winner || "--"}
                      </div>
                    )}
                    {race.run2Status === "Complete" && (
                      <div style={{ marginTop: 4, color: "#38bdf8", fontSize: 13 }}>
                        Final Run Winner: {race.run2Winner || "--"}
                      </div>
                    )}
                    {race.winner && (
                      <div style={{ marginTop: 6, color: "#22c55e", fontWeight: "bold" }}>
                        Overall Winner: {race.winner}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            ...panelStyle,
            position: "sticky",
            top: 20,
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Heat Admin</h2>

          {!selectedRace ? (
            <p style={{ color: "#94a3b8" }}>Select a race card.</p>
          ) : (
            <>
              <div style={{ fontWeight: "bold", marginBottom: 12 }}>
                Race {selectedRace.id} • {selectedRace.round}
              </div>

              <div style={{ marginBottom: 8 }}>{selectedRace.racerA || selectedRace.slotA}</div>
              <div style={{ marginBottom: 12 }}>{selectedRace.racerB || selectedRace.slotB}</div>

              {selectedRace.allowBye && (
                <>
                  <label style={{ display: "block", marginBottom: 6 }}>BYE</label>
                  <select
                    value={selectedRace.byeFor}
                    onChange={(e) => updateRace(selectedRace.id, { byeFor: e.target.value })}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      marginBottom: 14,
                      border: "1px solid #475569",
                      background: "#0f172a",
                      color: "white",
                    }}
                  >
                    <option value="">No BYE</option>
                    <option value="A">BYE for Racer A</option>
                    <option value="B">BYE for Racer B</option>
                  </select>
                </>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 14,
                }}
              >
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedRace.dqA}
                    onChange={(e) => updateRace(selectedRace.id, { dqA: e.target.checked })}
                  />
                  DQ Racer A
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={selectedRace.dqB}
                    onChange={(e) => updateRace(selectedRace.id, { dqB: e.target.checked })}
                  />
                  DQ Racer B
                </label>
              </div>

              <div style={{ color: "#93c5fd", fontWeight: "bold", marginBottom: 8 }}>
                First Run
              </div>
              <input
                type="number"
                step="0.001"
                placeholder="Lane 1 time"
                value={selectedRace.run1Lane1}
                onChange={(e) => updateRace(selectedRace.id, { run1Lane1: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                step="0.001"
                placeholder="Lane 2 time"
                value={selectedRace.run1Lane2}
                onChange={(e) => updateRace(selectedRace.id, { run1Lane2: e.target.value })}
                style={inputStyle}
              />

              <div style={{ color: "#93c5fd", fontWeight: "bold", margin: "12px 0 8px" }}>
                Final Run (Lanes Switched)
              </div>
              <input
                type="number"
                step="0.001"
                placeholder="Lane 1 time"
                value={selectedRace.run2Lane1}
                onChange={(e) => updateRace(selectedRace.id, { run2Lane1: e.target.value })}
                style={inputStyle}
              />
              <input
                type="number"
                step="0.001"
                placeholder="Lane 2 time"
                value={selectedRace.run2Lane2}
                onChange={(e) => updateRace(selectedRace.id, { run2Lane2: e.target.value })}
                style={inputStyle}
              />

              <div
                style={{
                  marginTop: 14,
                  padding: 12,
                  borderRadius: 10,
                  background: "#0f172a",
                  border: "1px solid #334155",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: 8 }}>Published Results</div>

                <div>First Run Status: {selectedRace.run1Status}</div>
                <div>First Run Winner: {selectedRace.run1Winner || "--"}</div>

                <div style={{ marginTop: 8 }}>Final Run Status: {selectedRace.run2Status}</div>
                <div>Final Run Winner: {selectedRace.run2Winner || "--"}</div>

                <div style={{ marginTop: 8 }}>
                  {selectedRace.racerA || "Racer A"} Total:{" "}
                  {selectedRace.totalA === "" ? "--" : selectedRace.totalA}
                </div>
                <div>
                  {selectedRace.racerB || "Racer B"} Total:{" "}
                  {selectedRace.totalB === "" ? "--" : selectedRace.totalB}
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontWeight: "bold",
                    color: selectedRace.winner
                      ? "#22c55e"
                      : selectedRace.flagged
                      ? "#ef4444"
                      : "#cbd5e1",
                  }}
                >
                  Overall Winner: {selectedRace.winner || "--"}
                </div>

                {selectedRace.tiebreaker && (
                  <div style={{ color: "#f59e0b", marginTop: 6 }}>
                    Exact tie — tiebreaker required.
                  </div>
                )}

                {selectedRace.dqA && !selectedRace.dqB && (
                  <div style={{ marginTop: 6 }}>Racer A disqualified. Racer B advances.</div>
                )}
                {selectedRace.dqB && !selectedRace.dqA && (
                  <div style={{ marginTop: 6 }}>Racer B disqualified. Racer A advances.</div>
                )}
                {selectedRace.dqA && selectedRace.dqB && (
                  <div style={{ marginTop: 6, color: "#ef4444" }}>
                    Both racers disqualified. No winner.
                  </div>
                )}
                {selectedRace.byeFor === "A" && (
                  <div style={{ marginTop: 6 }}>Racer A advances by BYE.</div>
                )}
                {selectedRace.byeFor === "B" && (
                  <div style={{ marginTop: 6 }}>Racer B advances by BYE.</div>
                )}
              </div>

              <label style={{ display: "block", marginTop: 14, marginBottom: 6 }}>Notes</label>
              <input
                type="text"
                value={selectedRace.note}
                onChange={(e) => updateRace(selectedRace.id, { note: e.target.value })}
                style={inputStyle}
                placeholder="Notes"
              />

              <label style={{ display: "block", marginTop: 14, marginBottom: 6 }}>
                Media URL
              </label>
              <input
                type="text"
                value={selectedRace.media}
                onChange={(e) => updateRace(selectedRace.id, { media: e.target.value })}
                style={inputStyle}
                placeholder="Paste image URL"
              />

              {selectedRace.media && (
                <img
                  src={selectedRace.media}
                  alt="Race media"
                  style={{
                    width: "100%",
                    borderRadius: 10,
                    border: "1px solid #475569",
                    marginTop: 12,
                  }}
                />
              )}

              <div style={{ marginTop: 20 }}>
                <h3 style={{ marginBottom: 10 }}>Live Placements</h3>
                {placements.map((p) => (
                  <div
                    key={p.place}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "5px 0",
                      borderBottom: "1px solid #334155",
                    }}
                  >
                    <strong>{p.place}</strong>
                    <span>{p.name || "--"}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}