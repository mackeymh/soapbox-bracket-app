import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchRaces,
  updateRace,
  upsertRace,
  upsertEventSetting,
} from "../lib/raceStore";

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
  stock: ["12"],
  superstock: ["32", "48", "64"],
};

const DQ_REASONS = [
  "Crash into opponent",
  "Hit barrier",
  "Lane violation",
  "Unsafe conduct",
  "Mechanical issue",
  "Other official ruling",
];

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

/**
 * 12-car Stock model:
 * Race 1-4: draw races, both racers entered.
 * Race 5-8: automatic qualifier in racer_a, winner of Race 1-4 fills racer_b.
 */
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

/**
 * 32-car Super Stock model:
 * Race 1-16: draw races, both racers entered.
 */
function buildDefault32Races(district, division) {
  const races = [];
  const b = "32";

  for (let i = 1; i <= 16; i++) {
    races.push(
      baseRace(i, b, division, district, "Opening Draw Race", "Draw Slot A", "Draw Slot B")
    );
  }

  for (let i = 17; i <= 24; i++) {
    const source = (i - 17) * 2 + 1;
    races.push(
      baseRace(i, b, division, district, "Round of 16", `Winner Race ${source}`, `Winner Race ${source + 1}`)
    );
  }

  for (let i = 25; i <= 28; i++) {
    const source = (i - 25) * 2 + 17;
    races.push(
      baseRace(i, b, division, district, "Quarterfinals", `Winner Race ${source}`, `Winner Race ${source + 1}`)
    );
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

/**
 * 48-car Super Stock model:
 * Race 1-16: preliminary draw races, both racers entered.
 * Race 17-32: automatic qualifier entered in racer_a;
 *             winner of Race 1-16 fills racer_b.
 * Race 33+ advance automatically.
 */
function buildDefault48Races(district, division) {
  const races = [];
  const b = "48";

  for (let i = 1; i <= 16; i++) {
    races.push(
      baseRace(i, b, division, district, "Preliminary Draw Race", "Draw Slot A", "Draw Slot B")
    );
  }

  for (let i = 17; i <= 32; i++) {
    const playInRace = i - 16;

    races.push(
      baseRace(
        i,
        b,
        division,
        district,
        "Round of 32",
        "Automatic Qualifier",
        `Winner Race ${playInRace}`
      )
    );
  }

  for (let i = 33; i <= 40; i++) {
    const source = (i - 33) * 2 + 17;

    races.push(
      baseRace(i, b, division, district, "Sweet 16", `Winner Race ${source}`, `Winner Race ${source + 1}`)
    );
  }

  for (let i = 41; i <= 44; i++) {
    const source = (i - 41) * 2 + 33;

    races.push(
      baseRace(i, b, division, district, "Quarterfinals", `Winner Race ${source}`, `Winner Race ${source + 1}`)
    );
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

/**
 * 64-car Super Stock model:
 * Race 1-32: draw races, both racers entered.
 */
function buildDefault64Races(district, division) {
  const races = [];
  const b = "64";

  for (let i = 1; i <= 32; i++) {
    races.push(
      baseRace(i, b, division, district, "Opening Draw Race", "Draw Slot A", "Draw Slot B")
    );
  }

  for (let i = 33; i <= 48; i++) {
    const source = (i - 33) * 2 + 1;
    races.push(
      baseRace(i, b, division, district, "Round of 32", `Winner Race ${source}`, `Winner Race ${source + 1}`)
    );
  }

  for (let i = 49; i <= 56; i++) {
    const source = (i - 49) * 2 + 33;
    races.push(
      baseRace(i, b, division, district, "Sweet 16", `Winner Race ${source}`, `Winner Race ${source + 1}`)
    );
  }

  for (let i = 57; i <= 60; i++) {
    const source = (i - 57) * 2 + 49;
    races.push(
      baseRace(i, b, division, district, "Quarterfinals", `Winner Race ${source}`, `Winner Race ${source + 1}`)
    );
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
  if (bracketType === "32") return buildDefault32Races(district, division);
  if (bracketType === "48") return buildDefault48Races(district, division);
  if (bracketType === "64") return buildDefault64Races(district, division);
  return [];
}

function getAssignmentFields(race, bracketType) {
  if (bracketType === "12") {
    if (race.id >= 1 && race.id <= 4) return ["racer_a", "racer_b"];
    if (race.id >= 5 && race.id <= 8) return ["racer_a"];
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

export default function AdminPage() {
  const navigate = useNavigate();

  const [authorized, setAuthorized] = useState(false);
  const [district, setDistrict] = useState("d11");
  const [division, setDivision] = useState("stock");
  const [bracketType, setBracketType] = useState("12");
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const allowedDivisions = DISTRICT_DIVISIONS[district] || ["superstock"];
  const allowedBrackets = DIVISION_BRACKETS[division] || ["32"];

  useEffect(() => {
    const access = sessionStorage.getItem("admin_access");

    if (access !== "granted") {
      navigate("/admin-login");
    } else {
      setAuthorized(true);
    }
  }, [navigate]);

  useEffect(() => {
    const districtDivisions = DISTRICT_DIVISIONS[district] || ["superstock"];

    const nextDivision = districtDivisions.includes(division)
      ? division
      : districtDivisions[0];

    if (nextDivision !== division) {
      setDivision(nextDivision);
      return;
    }

    const bracketOptions = DIVISION_BRACKETS[nextDivision] || ["32"];
    const nextBracket = bracketOptions.includes(bracketType)
      ? bracketType
      : bracketOptions[0];

    if (nextBracket !== bracketType) {
      setBracketType(nextBracket);
    }
  }, [district, division, bracketType]);

  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setMessage("");

      try {
        await upsertEventSetting({
          district,
          division,
          active_bracket_type: bracketType,
        });

        let raceRows = await fetchRaces(bracketType, district, division);

        if (cancelled) return;

        if (raceRows.length === 0) {
          const defaults = buildDefaults(bracketType, district, division);

          for (const race of defaults) {
            await upsertRace(race);
          }

          raceRows = await fetchRaces(bracketType, district, division);
        }

        await advanceBracket(raceRows);
        raceRows = await fetchRaces(bracketType, district, division);

        if (!cancelled) {
          setRaces(raceRows);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("ADMIN LOAD ERROR:", error);
          setMessage(`Failed to load admin data: ${error.message || "Unknown error"}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [authorized, district, division, bracketType]);

  async function handleBracketChange(newBracketType) {
    setBracketType(newBracketType);

    await upsertEventSetting({
      district,
      division,
      active_bracket_type: newBracketType,
    });

    setMessage(`${DIVISION_LABELS[division]} active bracket set to ${newBracketType}`);
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

      await updateRace(
        raceId,
        { is_current_override: true },
        bracketType,
        district,
        division
      );

      setRaces(await fetchRaces(bracketType, district, division));
      setMessage(`${DIVISION_LABELS[division]} Race ${raceId} set as NOW RACING`);
    } catch (error) {
      console.error("SET CURRENT ERROR:", error);
      setMessage(`Failed to set Race ${raceId} as current`);
    }
  }

  async function clearCurrentRace(raceId) {
    await updateRace(
      raceId,
      { is_current_override: false },
      bracketType,
      district,
      division
    );

    setRaces(await fetchRaces(bracketType, district, division));
    setMessage(`Cleared NOW RACING override for Race ${raceId}`);
  }

  async function handleAssignmentBlur(raceId, field, value) {
    try {
      const trimmed = value.trim();

      await updateRace(
        raceId,
        { [field]: trimmed },
        bracketType,
        district,
        division
      );

      let refreshedRaces = await fetchRaces(bracketType, district, division);
      const changedRace = refreshedRaces.find((race) => race.id === raceId);

      if (changedRace && changedRace.bye_for) {
        const outcome = getRaceAdminOutcome(changedRace);

        await updateRace(
          raceId,
          {
            winner: outcome.winner,
            loser: outcome.loser,
            status: outcome.status,
          },
          bracketType,
          district,
          division
        );

        refreshedRaces = await fetchRaces(bracketType, district, division);
      }

      await advanceBracket(refreshedRaces);
      refreshedRaces = await fetchRaces(bracketType, district, division);

      setRaces(refreshedRaces);
      setMessage(`Saved Race ${raceId} assignment`);
    } catch (error) {
      console.error("ASSIGNMENT SAVE ERROR:", error);
      setMessage(`Failed to save Race ${raceId} assignment`);
    }
  }

  function winnerOf(map, id) {
    return map[id]?.winner || "";
  }

  function loserOf(map, id) {
    return map[id]?.loser || "";
  }

  async function advanceBracket(raceRows) {
    const map = {};
    raceRows.forEach((race) => {
      map[race.id] = race;
    });

    const updates = [];

    function queue(id, fields) {
      updates.push({ id, fields });
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

    if (bracketType === "32") {
      for (let i = 17; i <= 24; i++) {
        const source = (i - 17) * 2 + 1;
        queue(i, {
          racer_a: winnerOf(map, source),
          racer_b: winnerOf(map, source + 1),
        });
      }

      for (let i = 25; i <= 28; i++) {
        const source = (i - 25) * 2 + 17;
        queue(i, {
          racer_a: winnerOf(map, source),
          racer_b: winnerOf(map, source + 1),
        });
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
      for (let i = 17; i <= 32; i++) {
        queue(i, { racer_b: winnerOf(map, i - 16) });
      }

      for (let i = 33; i <= 40; i++) {
        const source = (i - 33) * 2 + 17;
        queue(i, {
          racer_a: winnerOf(map, source),
          racer_b: winnerOf(map, source + 1),
        });
      }

      for (let i = 41; i <= 44; i++) {
        const source = (i - 41) * 2 + 33;
        queue(i, {
          racer_a: winnerOf(map, source),
          racer_b: winnerOf(map, source + 1),
        });
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
        queue(i, {
          racer_a: winnerOf(map, source),
          racer_b: winnerOf(map, source + 1),
        });
      }

      for (let i = 49; i <= 56; i++) {
        const source = (i - 49) * 2 + 33;
        queue(i, {
          racer_a: winnerOf(map, source),
          racer_b: winnerOf(map, source + 1),
        });
      }

      for (let i = 57; i <= 60; i++) {
        const source = (i - 57) * 2 + 49;
        queue(i, {
          racer_a: winnerOf(map, source),
          racer_b: winnerOf(map, source + 1),
        });
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
  }

  function getRaceAdminOutcome(race, changedField = null, changedValue = null) {
    const nextRace =
      changedField !== null ? { ...race, [changedField]: changedValue } : race;

    if (nextRace.bye_for === "A") {
      return {
        winner: nextRace.racer_a || "",
        loser: nextRace.racer_b || "",
        status: "Complete",
      };
    }

    if (nextRace.bye_for === "B") {
      return {
        winner: nextRace.racer_b || "",
        loser: nextRace.racer_a || "",
        status: "Complete",
      };
    }

    if (nextRace.dq_a && !nextRace.dq_b) {
      return {
        winner: nextRace.racer_b || "",
        loser: nextRace.racer_a || "",
        status: "Complete",
      };
    }

    if (nextRace.dq_b && !nextRace.dq_a) {
      return {
        winner: nextRace.racer_a || "",
        loser: nextRace.racer_b || "",
        status: "Complete",
      };
    }

    if (nextRace.dq_a && nextRace.dq_b) {
      return {
        winner: "",
        loser: "",
        status: "DQ Conflict",
      };
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
      return {
        winner: race.racer_a || "",
        loser: race.racer_b || "",
        status: "Complete",
        total_a: totalA,
        total_b: totalB,
      };
    }

    if (totalB < totalA) {
      return {
        winner: race.racer_b || "",
        loser: race.racer_a || "",
        status: "Complete",
        total_a: totalA,
        total_b: totalB,
      };
    }

    return {
      winner: "",
      loser: "",
      status: "Tiebreaker Needed",
      total_a: totalA,
      total_b: totalB,
    };
  }

  async function handleRaceBlur(raceId, field, value) {
    try {
      const parsedValue =
        field.includes("lane") && value !== "" ? Number(value) : value;

      await updateRace(
        raceId,
        { [field]: parsedValue },
        bracketType,
        district,
        division
      );

      let refreshedRaces = await fetchRaces(bracketType, district, division);
      const race = refreshedRaces.find((item) => item.id === raceId);

      if (race) {
        const adminOutcome = getRaceAdminOutcome({
          ...race,
          [field]: parsedValue,
        });

        if (race.bye_for || race.dq_a || race.dq_b) {
          await updateRace(
            raceId,
            {
              winner: adminOutcome.winner,
              loser: adminOutcome.loser,
              status: adminOutcome.status,
            },
            bracketType,
            district,
            division
          );
        } else {
          const outcome = getOutcomeFromTimes({
            ...race,
            [field]: parsedValue,
          });

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
      await updateRace(
        raceId,
        { [field]: checked },
        bracketType,
        district,
        division
      );

      let refreshedRaces = await fetchRaces(bracketType, district, division);
      const race = refreshedRaces.find((item) => item.id === raceId);

      if (race) {
        const outcome = getRaceAdminOutcome(race, field, checked);

        await updateRace(
          raceId,
          {
            winner: outcome.winner,
            loser: outcome.loser,
            status: outcome.status,
          },
          bracketType,
          district,
          division
        );

        refreshedRaces = await fetchRaces(bracketType, district, division);
        await advanceBracket(refreshedRaces);
        refreshedRaces = await fetchRaces(bracketType, district, division);
      }

      setRaces(refreshedRaces);
      setMessage(`Updated Race ${raceId}`);
    } catch (error) {
      console.error("RACE TOGGLE ERROR:", error);
      setMessage(`Failed to update Race ${raceId}`);
    }
  }

  async function handleRaceByeChange(raceId, byeValue) {
    try {
      await updateRace(
        raceId,
        { bye_for: byeValue },
        bracketType,
        district,
        division
      );

      let refreshedRaces = await fetchRaces(bracketType, district, division);
      const race = refreshedRaces.find((item) => item.id === raceId);

      if (race) {
        const outcome = getRaceAdminOutcome(race, "bye_for", byeValue);

        await updateRace(
          raceId,
          {
            winner: outcome.winner,
            loser: outcome.loser,
            status: outcome.status,
          },
          bracketType,
          district,
          division
        );

        refreshedRaces = await fetchRaces(bracketType, district, division);
        await advanceBracket(refreshedRaces);
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
    return <div style={{ padding: 24 }}>Checking access...</div>;
  }

  const assignmentRaces = races.filter((race) =>
    isAssignmentRace(race, bracketType)
  );

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Admin Panel</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>District</label>
        <select value={district} onChange={(event) => setDistrict(event.target.value)}>
          {DISTRICT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>Division</label>
        {allowedDivisions.map((item) => (
          <button
            key={item}
            onClick={() => setDivision(item)}
            style={{
              marginRight: 8,
              fontWeight: division === item ? "bold" : "normal",
            }}
          >
            {DIVISION_LABELS[item]}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>Bracket</label>
        {allowedBrackets.map((item) => (
          <button
            key={item}
            onClick={() => handleBracketChange(item)}
            style={{
              marginRight: 8,
              fontWeight: bracketType === item ? "bold" : "normal",
            }}
          >
            {division === "stock" ? "12-Car Stock" : `${item}-Car Super Stock`}
          </button>
        ))}
      </div>

      {message && (
        <div style={{ marginBottom: 16, color: "#2563eb", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      {loading && <div style={{ marginBottom: 16 }}>Loading bracket data...</div>}

      <h2>Draw / Race Assignments</h2>

      <div style={{ marginBottom: 24 }}>
        {assignmentRaces.map((race) => {
          const editableFields = getAssignmentFields(race, bracketType);

          return (
            <div
              key={`assignment-${race.id}`}
              style={{
                border: "1px solid #ddd",
                padding: 12,
                marginBottom: 10,
                borderRadius: 8,
                background: "#fafafa",
              }}
            >
              <div style={{ fontWeight: "bold", marginBottom: 8 }}>
                Race {race.id} — {race.round}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  value={race.racer_a || ""}
                  placeholder={race.slot_a || "Racer A"}
                  disabled={!editableFields.includes("racer_a")}
                  onChange={(event) =>
                    setRaces((previous) =>
                      previous.map((item) =>
                        item.id === race.id
                          ? { ...item, racer_a: event.target.value }
                          : item
                      )
                    )
                  }
                  onBlur={(event) =>
                    handleAssignmentBlur(race.id, "racer_a", event.target.value)
                  }
                />

                <span>vs</span>

                <input
                  value={race.racer_b || ""}
                  placeholder={race.slot_b || "Racer B"}
                  disabled={!editableFields.includes("racer_b")}
                  onChange={(event) =>
                    setRaces((previous) =>
                      previous.map((item) =>
                        item.id === race.id
                          ? { ...item, racer_b: event.target.value }
                          : item
                      )
                    )
                  }
                  onBlur={(event) =>
                    handleAssignmentBlur(race.id, "racer_b", event.target.value)
                  }
                />

                <select
                  value={race.bye_for ?? ""}
                  onChange={(event) =>
                    handleRaceByeChange(race.id, event.target.value)
                  }
                >
                  <option value="">No BYE</option>
                  <option value="A">Racer A advances by BYE</option>
                  <option value="B">Racer B advances by BYE</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>

      <h2 style={{ marginTop: 24 }}>Races</h2>

      {races.map((race) => (
        <div
          key={`${district}-${division}-${bracketType}-${race.id}`}
          style={{
            border: race.is_current_override
              ? "2px solid #22c55e"
              : "1px solid #ccc",
            padding: 12,
            marginBottom: 12,
            borderRadius: 8,
          }}
        >
          <div>
            <strong>Race {race.id}</strong> — {race.round}
          </div>

          <div style={{ marginBottom: 8 }}>
            {race.racer_a || race.slot_a} vs {race.racer_b || race.slot_b}
          </div>

          <div style={{ marginBottom: 8 }}>
            <button onClick={() => setCurrentRace(race.id)}>
              Set NOW RACING
            </button>

            {race.is_current_override && (
              <button
                onClick={() => clearCurrentRace(race.id)}
                style={{ marginLeft: 8 }}
              >
                Clear
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["run1_lane1", "run1_lane2", "run2_lane1", "run2_lane2"].map(
              (field) => (
                <input
                  key={field}
                  type="number"
                  step="0.001"
                  value={race[field] ?? ""}
                  placeholder={field}
                  onChange={(event) =>
                    setRaces((previous) =>
                      previous.map((item) =>
                        item.id === race.id
                          ? { ...item, [field]: event.target.value }
                          : item
                      )
                    )
                  }
                  onBlur={(event) =>
                    handleRaceBlur(race.id, field, event.target.value)
                  }
                />
              )
            )}
          </div>

          <div style={{ marginTop: 12 }}>
            <strong>BYE / Disqualification</strong>

            <div style={{ marginTop: 8 }}>
              <label style={{ marginRight: 8 }}>BYE</label>
              <select
                value={race.bye_for ?? ""}
                onChange={(event) =>
                  handleRaceByeChange(race.id, event.target.value)
                }
              >
                <option value="">No BYE</option>
                <option value="A">Racer A advances by BYE</option>
                <option value="B">Racer B advances by BYE</option>
              </select>
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 16 }}>
              <label>
                <input
                  type="checkbox"
                  checked={!!race.dq_a}
                  onChange={(event) =>
                    handleRaceToggle(race.id, "dq_a", event.target.checked)
                  }
                />{" "}
                DQ Racer A
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={!!race.dq_b}
                  onChange={(event) =>
                    handleRaceToggle(race.id, "dq_b", event.target.checked)
                  }
                />{" "}
                DQ Racer B
              </label>
            </div>

            <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                value={race.dq_reason_a ?? ""}
                onChange={(event) =>
                  handleRaceBlur(race.id, "dq_reason_a", event.target.value)
                }
              >
                <option value="">DQ reason for Racer A</option>
                {DQ_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>

              <select
                value={race.dq_reason_b ?? ""}
                onChange={(event) =>
                  handleRaceBlur(race.id, "dq_reason_b", event.target.value)
                }
              >
                <option value="">DQ reason for Racer B</option>
                {DQ_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: 8 }}>
            <label style={{ marginRight: 8 }}>Note</label>
            <input
              type="text"
              value={race.note ?? ""}
              onChange={(event) =>
                setRaces((previous) =>
                  previous.map((item) =>
                    item.id === race.id
                      ? { ...item, note: event.target.value }
                      : item
                  )
                )
              }
              onBlur={(event) =>
                handleRaceBlur(race.id, "note", event.target.value)
              }
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <div>
              <strong>Status:</strong> {race.status || "Pending"}
            </div>
            <div>
              <strong>Winner:</strong> {race.winner || "--"}
            </div>
            <div>
              <strong>Loser:</strong> {race.loser || "--"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}