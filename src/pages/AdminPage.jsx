import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchSeeds,
  fetchRaces,
  upsertSeed,
  updateRace,
  upsertRace,
} from "../lib/raceStore";

function buildDefault12Races() {
  return [
    { id: 1, bracket_type: "12", round: "Play-In Round", slot_a: "Seed 1", slot_b: "Seed 2", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 2, bracket_type: "12", round: "Play-In Round", slot_a: "Seed 3", slot_b: "Seed 4", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 3, bracket_type: "12", round: "Play-In Round", slot_a: "Seed 5", slot_b: "Seed 6", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 4, bracket_type: "12", round: "Play-In Round", slot_a: "Seed 7", slot_b: "Seed 8", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 5, bracket_type: "12", round: "Quarterfinals", slot_a: "Seed 9", slot_b: "Winner Race 1", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 6, bracket_type: "12", round: "Quarterfinals", slot_a: "Seed 10", slot_b: "Winner Race 2", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 7, bracket_type: "12", round: "Quarterfinals", slot_a: "Seed 11", slot_b: "Winner Race 3", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 8, bracket_type: "12", round: "Quarterfinals", slot_a: "Seed 12", slot_b: "Winner Race 4", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 9, bracket_type: "12", round: "Semifinals", slot_a: "Winner Race 5", slot_b: "Winner Race 6", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 10, bracket_type: "12", round: "Semifinals", slot_a: "Winner Race 7", slot_b: "Winner Race 8", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 11, bracket_type: "12", round: "Final", slot_a: "Winner Race 9", slot_b: "Winner Race 10", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 12, bracket_type: "12", round: "Placement", slot_a: "Loser Race 5", slot_b: "Loser Race 6", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 13, bracket_type: "12", round: "Placement", slot_a: "Loser Race 7", slot_b: "Loser Race 8", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 14, bracket_type: "12", round: "5th / 6th", slot_a: "Winner Race 12", slot_b: "Winner Race 13", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 15, bracket_type: "12", round: "7th / 8th", slot_a: "Loser Race 12", slot_b: "Loser Race 13", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
    { id: 16, bracket_type: "12", round: "3rd / 4th", slot_a: "Loser Race 9", slot_b: "Loser Race 10", racer_a: "", racer_b: "", status: "Pending", dq_a: false, dq_b: false, dq_reason_a: "", dq_reason_b: "", bye_for: "", winner: "", loser: "" },
  ];
}

function buildDefault64Races() {
  // keep your exact existing 64-race builder here
  return [];
}

const DQ_REASONS = [
  "Crash into opponent",
  "Hit barrier",
  "Lane violation",
  "Unsafe conduct",
  "Mechanical issue",
  "Other official ruling",
];

const DISTRICT_OPTIONS = [
  { value: "d11", label: "District 11" },
  { value: "southBronx", label: "South Bronx" },
];

export default function AdminPage() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [district, setDistrict] = useState("d11");
  const [bracketType, setBracketType] = useState("12");
  const [seeds, setSeeds] = useState([]);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const access = sessionStorage.getItem("admin_access");

    if (access !== "granted") {
      navigate("/admin-login");
    } else {
      setAuthorized(true);
    }
  }, [navigate]);

  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setMessage("");

      try {
        const [seedRows, raceRows] = await Promise.all([
          fetchSeeds(bracketType, district),
          fetchRaces(bracketType, district),
        ]);

        if (cancelled) return;

        setSeeds(seedRows);

        let workingRaces = raceRows;

        if (raceRows.length === 0) {
          const defaults =
            bracketType === "12" ? buildDefault12Races() : buildDefault64Races();

          for (const race of defaults) {
            await upsertRace({ ...race, district });
          }

          workingRaces = await fetchRaces(bracketType, district);
        }

        if (seedRows.length > 0) {
          await syncSeedsToRaces(bracketType, district, seedRows);
          workingRaces = await fetchRaces(bracketType, district);
          await advanceBracket(bracketType, district, workingRaces);
          workingRaces = await fetchRaces(bracketType, district);
        }

        if (!cancelled) {
          setRaces(workingRaces);
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
  }, [authorized, bracketType, district]);

  async function setCurrentRace(raceId) {
    try {
      for (const r of races) {
        if (r.is_current_override) {
          await updateRace(r.id, { is_current_override: false }, bracketType, district);
        }
      }

      await updateRace(raceId, { is_current_override: true }, bracketType, district);

      const updated = await fetchRaces(bracketType, district);
      setRaces(updated);
      setMessage(`Race ${raceId} set as current`);
    } catch (error) {
      console.error("SET CURRENT ERROR:", error);
      setMessage(`Failed to set Race ${raceId} as current`);
    }
  }

  async function clearCurrentRace(raceId) {
    try {
      await updateRace(raceId, { is_current_override: false }, bracketType, district);
      const updated = await fetchRaces(bracketType, district);
      setRaces(updated);
      setMessage(`Cleared current race override for Race ${raceId}`);
    } catch (error) {
      console.error("CLEAR CURRENT ERROR:", error);
      setMessage(`Failed to clear Race ${raceId} override`);
    }
  }

  async function handleSeedBlur(seedNumber, label) {
    try {
      const trimmed = label.trim();
      const schoolShort = trimmed.split("-")[0] || "";
      const carNumber = trimmed.split("-")[1] || "";
      const schoolCode = schoolShort ? `11X${schoolShort}` : "";

      await upsertSeed({
        district,
        bracket_type: bracketType,
        seed_number: seedNumber,
        label: trimmed,
        school_code: schoolCode,
        car_number: carNumber,
      });

      const refreshedSeeds = await fetchSeeds(bracketType, district);
      await syncSeedsToRaces(bracketType, district, refreshedSeeds);
      let refreshedRaces = await fetchRaces(bracketType, district);
      await advanceBracket(bracketType, district, refreshedRaces);
      refreshedRaces = await fetchRaces(bracketType, district);

      setSeeds(refreshedSeeds);
      setRaces(refreshedRaces);

      setMessage(`Saved Seed ${seedNumber}`);
    } catch (error) {
      console.error("SEED SAVE ERROR:", error);
      setMessage(`Failed to save Seed ${seedNumber}`);
    }
  }

  async function syncSeedsToRaces(type, districtValue, seedRows) {
    const seedMap = {};
    seedRows.forEach((seed) => {
      seedMap[seed.seed_number] = seed.label || "";
    });

    if (type === "12") {
      const updates = [
        { id: 1, racer_a: seedMap[1] || "", racer_b: seedMap[2] || "" },
        { id: 2, racer_a: seedMap[3] || "", racer_b: seedMap[4] || "" },
        { id: 3, racer_a: seedMap[5] || "", racer_b: seedMap[6] || "" },
        { id: 4, racer_a: seedMap[7] || "", racer_b: seedMap[8] || "" },
        { id: 5, racer_a: seedMap[9] || "" },
        { id: 6, racer_a: seedMap[10] || "" },
        { id: 7, racer_a: seedMap[11] || "" },
        { id: 8, racer_a: seedMap[12] || "" },
      ];

      for (const update of updates) {
        const { id, ...fields } = update;
        await updateRace(id, fields, type, districtValue);
      }
    }

    if (type === "64") {
      for (let i = 1; i <= 32; i++) {
        const seedA = i * 2 - 1;
        const seedB = i * 2;

        await updateRace(
          i,
          {
            racer_a: seedMap[seedA] || "",
            racer_b: seedMap[seedB] || "",
          },
          type,
          districtValue
        );
      }
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

  async function advanceBracket(type, districtValue, raceRows) {
    const raceMap = {};
    raceRows.forEach((race) => {
      raceMap[race.id] = race;
    });

    const updates = [];

    function winnerOf(id) {
      return raceMap[id]?.winner || "";
    }

    function loserOf(id) {
      return raceMap[id]?.loser || "";
    }

    function queueRaceUpdate(id, fields) {
      updates.push({ id, fields });
    }

    if (type === "12") {
      queueRaceUpdate(5, { racer_b: winnerOf(1) });
      queueRaceUpdate(6, { racer_b: winnerOf(2) });
      queueRaceUpdate(7, { racer_b: winnerOf(3) });
      queueRaceUpdate(8, { racer_b: winnerOf(4) });

      queueRaceUpdate(9, { racer_a: winnerOf(5), racer_b: winnerOf(6) });
      queueRaceUpdate(10, { racer_a: winnerOf(7), racer_b: winnerOf(8) });

      queueRaceUpdate(11, { racer_a: winnerOf(9), racer_b: winnerOf(10) });

      queueRaceUpdate(12, { racer_a: loserOf(5), racer_b: loserOf(6) });
      queueRaceUpdate(13, { racer_a: loserOf(7), racer_b: loserOf(8) });
      queueRaceUpdate(14, { racer_a: winnerOf(12), racer_b: winnerOf(13) });
      queueRaceUpdate(15, { racer_a: loserOf(12), racer_b: loserOf(13) });
      queueRaceUpdate(16, { racer_a: loserOf(9), racer_b: loserOf(10) });
    }

    if (type === "64") {
      queueRaceUpdate(33, { racer_a: winnerOf(1), racer_b: winnerOf(2) });
      queueRaceUpdate(34, { racer_a: winnerOf(3), racer_b: winnerOf(4) });
      queueRaceUpdate(35, { racer_a: winnerOf(5), racer_b: winnerOf(6) });
      queueRaceUpdate(36, { racer_a: winnerOf(7), racer_b: winnerOf(8) });
      queueRaceUpdate(37, { racer_a: winnerOf(9), racer_b: winnerOf(10) });
      queueRaceUpdate(38, { racer_a: winnerOf(11), racer_b: winnerOf(12) });
      queueRaceUpdate(39, { racer_a: winnerOf(13), racer_b: winnerOf(14) });
      queueRaceUpdate(40, { racer_a: winnerOf(15), racer_b: winnerOf(16) });
      queueRaceUpdate(41, { racer_a: winnerOf(17), racer_b: winnerOf(18) });
      queueRaceUpdate(42, { racer_a: winnerOf(19), racer_b: winnerOf(20) });
      queueRaceUpdate(43, { racer_a: winnerOf(21), racer_b: winnerOf(22) });
      queueRaceUpdate(44, { racer_a: winnerOf(23), racer_b: winnerOf(24) });
      queueRaceUpdate(45, { racer_a: winnerOf(25), racer_b: winnerOf(26) });
      queueRaceUpdate(46, { racer_a: winnerOf(27), racer_b: winnerOf(28) });
      queueRaceUpdate(47, { racer_a: winnerOf(29), racer_b: winnerOf(30) });
      queueRaceUpdate(48, { racer_a: winnerOf(31), racer_b: winnerOf(32) });

      queueRaceUpdate(49, { racer_a: winnerOf(33), racer_b: winnerOf(34) });
      queueRaceUpdate(50, { racer_a: winnerOf(35), racer_b: winnerOf(36) });
      queueRaceUpdate(51, { racer_a: winnerOf(37), racer_b: winnerOf(38) });
      queueRaceUpdate(52, { racer_a: winnerOf(39), racer_b: winnerOf(40) });
      queueRaceUpdate(53, { racer_a: winnerOf(41), racer_b: winnerOf(42) });
      queueRaceUpdate(54, { racer_a: winnerOf(43), racer_b: winnerOf(44) });
      queueRaceUpdate(55, { racer_a: winnerOf(45), racer_b: winnerOf(46) });
      queueRaceUpdate(56, { racer_a: winnerOf(47), racer_b: winnerOf(48) });

      queueRaceUpdate(57, { racer_a: winnerOf(49), racer_b: winnerOf(50) });
      queueRaceUpdate(58, { racer_a: winnerOf(51), racer_b: winnerOf(52) });
      queueRaceUpdate(59, { racer_a: winnerOf(53), racer_b: winnerOf(54) });
      queueRaceUpdate(60, { racer_a: winnerOf(55), racer_b: winnerOf(56) });

      queueRaceUpdate(61, { racer_a: winnerOf(57), racer_b: winnerOf(58) });
      queueRaceUpdate(62, { racer_a: winnerOf(59), racer_b: winnerOf(60) });

      queueRaceUpdate(63, { racer_a: winnerOf(61), racer_b: winnerOf(62) });

      queueRaceUpdate(64, { racer_a: loserOf(57), racer_b: loserOf(59) });
      queueRaceUpdate(65, { racer_a: loserOf(58), racer_b: loserOf(60) });
      queueRaceUpdate(66, { racer_a: winnerOf(64), racer_b: winnerOf(65) });
      queueRaceUpdate(67, { racer_a: loserOf(64), racer_b: loserOf(65) });
      queueRaceUpdate(68, { racer_a: loserOf(61), racer_b: loserOf(62) });
    }

    for (const update of updates) {
      await updateRace(update.id, update.fields, type, districtValue);
    }
  }

  function getOutcomeFromTimes(race) {
    if (
      race.run1_lane1 === null || race.run1_lane1 === "" ||
      race.run1_lane2 === null || race.run1_lane2 === "" ||
      race.run2_lane1 === null || race.run2_lane1 === "" ||
      race.run2_lane2 === null || race.run2_lane2 === ""
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

      await updateRace(raceId, { [field]: parsedValue }, bracketType, district);

      let refreshedRaces = await fetchRaces(bracketType, district);
      const race = refreshedRaces.find((r) => r.id === raceId);

      if (race) {
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
            district
          );

          refreshedRaces = await fetchRaces(bracketType, district);
          await advanceBracket(bracketType, district, refreshedRaces);
          refreshedRaces = await fetchRaces(bracketType, district);
        }
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
      await updateRace(raceId, { [field]: checked }, bracketType, district);

      let refreshedRaces = await fetchRaces(bracketType, district);
      const race = refreshedRaces.find((r) => r.id === raceId);

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
          district
        );

        refreshedRaces = await fetchRaces(bracketType, district);
        await advanceBracket(bracketType, district, refreshedRaces);
        refreshedRaces = await fetchRaces(bracketType, district);
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
      await updateRace(raceId, { bye_for: byeValue }, bracketType, district);

      let refreshedRaces = await fetchRaces(bracketType, district);
      const race = refreshedRaces.find((r) => r.id === raceId);

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
          district
        );

        refreshedRaces = await fetchRaces(bracketType, district);
        await advanceBracket(bracketType, district, refreshedRaces);
        refreshedRaces = await fetchRaces(bracketType, district);
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

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <h1>Admin</h1>

      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>District</label>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          style={{ padding: 6, borderRadius: 6 }}
        >
          {DISTRICT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setBracketType("12")}>12-Car</button>
        <button onClick={() => setBracketType("64")} style={{ marginLeft: 8 }}>
          64-Car
        </button>
      </div>

      {message && (
        <div style={{ marginBottom: 16, color: "#2563eb", fontWeight: "bold" }}>
          {message}
        </div>
      )}

      {loading && <div style={{ marginBottom: 16 }}>Loading bracket data...</div>}

      <h2>Seeds</h2>
      {Array.from({ length: bracketType === "12" ? 12 : 64 }).map((_, i) => {
        const seedNumber = i + 1;
        const existing = seeds.find((s) => s.seed_number === seedNumber);

        return (
          <div key={seedNumber} style={{ marginBottom: 8 }}>
            <label style={{ display: "inline-block", width: 80 }}>
              Seed {seedNumber}
            </label>

            <input
              value={existing?.label || ""}
              placeholder="Example: 370-1"
              onChange={(e) => {
                const value = e.target.value;
                setSeeds((prev) =>
                  prev.some((s) => s.seed_number === seedNumber)
                    ? prev.map((s) =>
                        s.seed_number === seedNumber ? { ...s, label: value } : s
                      )
                    : [
                        ...prev,
                        {
                          district,
                          seed_number: seedNumber,
                          bracket_type: bracketType,
                          label: value,
                          school_code: "",
                          car_number: "",
                        },
                      ]
                );
              }}
              onBlur={(e) => handleSeedBlur(seedNumber, e.target.value)}
            />
          </div>
        );
      })}

      <h2 style={{ marginTop: 24 }}>Races</h2>
      {races.map((race) => (
        <div
          key={`${district}-${race.bracket_type}-${race.id}`}
          style={{
            border: race.is_current_override ? "2px solid #22c55e" : "1px solid #ccc",
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
              Set Current
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

          {(race.bye_for || race.dq_a || race.dq_b) && (
            <div style={{ marginBottom: 8, color: "#ef4444", fontWeight: "bold" }}>
              {race.bye_for === "A" && "Racer A advances by BYE"}
              {race.bye_for === "B" && "Racer B advances by BYE"}
              {(race.bye_for && (race.dq_a || race.dq_b)) && " | "}
              {race.dq_a && `Racer A DQ${race.dq_reason_a ? ` — ${race.dq_reason_a}` : ""}`}
              {race.dq_a && race.dq_b && " | "}
              {race.dq_b && `Racer B DQ${race.dq_reason_b ? ` — ${race.dq_reason_b}` : ""}`}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              type="number"
              step="0.001"
              value={race.run1_lane1 ?? ""}
              placeholder="Run1 Lane1"
              onChange={(e) =>
                setRaces((prev) =>
                  prev.map((r) =>
                    r.id === race.id ? { ...r, run1_lane1: e.target.value } : r
                  )
                )
              }
              onBlur={(e) => handleRaceBlur(race.id, "run1_lane1", e.target.value)}
            />
            <input
              type="number"
              step="0.001"
              value={race.run1_lane2 ?? ""}
              placeholder="Run1 Lane2"
              onChange={(e) =>
                setRaces((prev) =>
                  prev.map((r) =>
                    r.id === race.id ? { ...r, run1_lane2: e.target.value } : r
                  )
                )
              }
              onBlur={(e) => handleRaceBlur(race.id, "run1_lane2", e.target.value)}
            />
            <input
              type="number"
              step="0.001"
              value={race.run2_lane1 ?? ""}
              placeholder="Run2 Lane1"
              onChange={(e) =>
                setRaces((prev) =>
                  prev.map((r) =>
                    r.id === race.id ? { ...r, run2_lane1: e.target.value } : r
                  )
                )
              }
              onBlur={(e) => handleRaceBlur(race.id, "run2_lane1", e.target.value)}
            />
            <input
              type="number"
              step="0.001"
              value={race.run2_lane2 ?? ""}
              placeholder="Run2 Lane2"
              onChange={(e) =>
                setRaces((prev) =>
                  prev.map((r) =>
                    r.id === race.id ? { ...r, run2_lane2: e.target.value } : r
                  )
                )
              }
              onBlur={(e) => handleRaceBlur(race.id, "run2_lane2", e.target.value)}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: "bold", marginBottom: 8 }}>BYE / Disqualification</div>

            <div style={{ marginBottom: 10 }}>
              <label style={{ marginRight: 8 }}>BYE</label>
              <select
                value={race.bye_for ?? ""}
                onChange={(e) => handleRaceByeChange(race.id, e.target.value)}
                style={{ width: 220 }}
              >
                <option value="">No BYE</option>
                <option value="A">Racer A advances by BYE</option>
                <option value="B">Racer B advances by BYE</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
              <label>
                <input
                  type="checkbox"
                  checked={!!race.dq_a}
                  onChange={(e) => handleRaceToggle(race.id, "dq_a", e.target.checked)}
                />
                {" "}DQ Racer A
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={!!race.dq_b}
                  onChange={(e) => handleRaceToggle(race.id, "dq_b", e.target.checked)}
                />
                {" "}DQ Racer B
              </label>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                value={race.dq_reason_a ?? ""}
                onChange={(e) => handleRaceBlur(race.id, "dq_reason_a", e.target.value)}
                style={{ width: 240 }}
              >
                <option value="">Select DQ reason for Racer A</option>
                {DQ_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>

              <select
                value={race.dq_reason_b ?? ""}
                onChange={(e) => handleRaceBlur(race.id, "dq_reason_b", e.target.value)}
                style={{ width: 240 }}
              >
                <option value="">Select DQ reason for Racer B</option>
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
              onChange={(e) =>
                setRaces((prev) =>
                  prev.map((r) =>
                    r.id === race.id ? { ...r, note: e.target.value } : r
                  )
                )
              }
              onBlur={(e) => handleRaceBlur(race.id, "note", e.target.value)}
              style={{ width: 220 }}
            />
          </div>

          {(race.winner || race.loser) && (
            <div style={{ marginTop: 10 }}>
              <div><strong>Winner:</strong> {race.winner || "--"}</div>
              <div><strong>Loser:</strong> {race.loser || "--"}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}