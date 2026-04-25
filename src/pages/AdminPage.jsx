import { useEffect, useState } from "react";
import {
  fetchRaces,
  updateRace,
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

export default function AdminPage() {
  const [district, setDistrict] = useState("d11");
  const [division, setDivision] = useState("stock");
  const [bracketType, setBracketType] = useState("12");
  const [races, setRaces] = useState([]);
  const [message, setMessage] = useState("");

  const allowedDivisions = DISTRICT_DIVISIONS[district];
  const allowedBrackets = DIVISION_BRACKETS[division];

  // Ensure valid division when district changes
  useEffect(() => {
    if (!allowedDivisions.includes(division)) {
      setDivision(allowedDivisions[0]);
    }
  }, [district]);

  // Ensure valid bracket when division changes
  useEffect(() => {
    if (!allowedBrackets.includes(bracketType)) {
      setBracketType(allowedBrackets[0]);
    }
  }, [division]);

  // Load races whenever config changes
  useEffect(() => {
    async function load() {
      const data = await fetchRaces(bracketType, district, division);
      setRaces(data);
    }

    load();
  }, [district, division, bracketType]);

  // 🔥 SAVE BRACKET SELECTION (KEY FIX)
  async function handleBracketChange(newBracket) {
    setBracketType(newBracket);

    await upsertEventSetting({
      district,
      division,
      active_bracket_type: newBracket,
    });

    setMessage(
      `${DIVISION_LABELS[division]} set to ${newBracket}-Car Bracket`
    );
  }

  // 🔥 SET NOW RACING (CROSS-DIVISION SAFE)
  async function setCurrentRace(raceId) {
    try {
      // clear ALL current flags in this district
      for (const div of DISTRICT_DIVISIONS[district]) {
        for (const bracket of DIVISION_BRACKETS[div]) {
          const divRaces = await fetchRaces(bracket, district, div);

          for (const race of divRaces) {
            if (race.is_current_override) {
              await updateRace(
                race.id,
                { is_current_override: false },
                bracket,
                district,
                div
              );
            }
          }
        }
      }

      // set selected race
      await updateRace(
        raceId,
        { is_current_override: true },
        bracketType,
        district,
        division
      );

      setMessage(`Race ${raceId} is NOW RACING`);

      const updated = await fetchRaces(bracketType, district, division);
      setRaces(updated);
    } catch (err) {
      console.error(err);
      setMessage("Error setting current race");
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial" }}>
      <h1>Admin Panel</h1>

      {/* DISTRICT */}
      <div style={{ marginBottom: 16 }}>
        <label>District: </label>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
        >
          {DISTRICT_OPTIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      {/* DIVISION */}
      <div style={{ marginBottom: 16 }}>
        <label>Division: </label>
        {allowedDivisions.map((d) => (
          <button
            key={d}
            onClick={() => setDivision(d)}
            style={{
              marginRight: 8,
              fontWeight: division === d ? "bold" : "normal",
            }}
          >
            {DIVISION_LABELS[d]}
          </button>
        ))}
      </div>

      {/* BRACKET */}
      <div style={{ marginBottom: 16 }}>
        <label>Bracket: </label>
        {allowedBrackets.map((b) => (
          <button
            key={b}
            onClick={() => handleBracketChange(b)}
            style={{
              marginRight: 8,
              fontWeight: bracketType === b ? "bold" : "normal",
            }}
          >
            {b}-Car
          </button>
        ))}
      </div>

      {message && (
        <div style={{ marginBottom: 16, color: "green" }}>
          {message}
        </div>
      )}

      {/* RACES */}
      <h2>Races</h2>

      {races.map((race) => (
        <div
          key={race.id}
          style={{
            border: race.is_current_override
              ? "2px solid green"
              : "1px solid #ccc",
            padding: 12,
            marginBottom: 10,
            borderRadius: 8,
          }}
        >
          <div>
            <strong>Race {race.id}</strong> — {race.round}
          </div>

          <div>
            {race.racer_a || race.slot_a} vs{" "}
            {race.racer_b || race.slot_b}
          </div>

          <button
            onClick={() => setCurrentRace(race.id)}
            style={{ marginTop: 8 }}
          >
            Set NOW RACING
          </button>
        </div>
      ))}
    </div>
  );
}