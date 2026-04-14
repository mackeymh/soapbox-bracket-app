import { useEffect, useMemo, useState } from "react";
import { fetchRaces } from "../lib/raceStore";

const SCHOOL_CODES = [
  "11X016","11X019","11X041","11X068","11X076","11X078","11X083","11X087",
  "11X089","11X096","11X097","11X103","11X105","11X106","11X108","11X111",
  "11X121","11X127","11X144","11X153","11X160","11X169","11X175","11X180",
  "11X181","11X194","11X370","11X462","11X483","11X498","11X529","11X566",
  "11X567",
];

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

export default function SpectatorPage() {
  const [bracketType, setBracketType] = useState("12");
  const [races, setRaces] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Completed");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");

  useEffect(() => {
    async function load() {
      const rows = await fetchRaces(bracketType);
      setRaces(rows);
    }
    load();
  }, [bracketType]);

  const visibleRaces = useMemo(() => {
    return races.filter((race) => {
      if (!raceMatchesSchool(race, schoolFilter)) return false;

      if (statusFilter === "All") return true;
      if (statusFilter === "Completed") return race.status === "Complete";
      if (statusFilter === "Current") {
        return (
          race.status === "In Progress" ||
          race.status === "Tiebreaker" ||
          race.status === "Flagged"
        );
      }
      if (statusFilter === "Pending") return race.status === "Pending";
      return true;
    });
  }, [races, statusFilter, schoolFilter]);

  return (
    <div style={{ padding: 24 }}>
      <h1>Spectator View</h1>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setBracketType("12")}>12-Car</button>
        <button onClick={() => setBracketType("64")} style={{ marginLeft: 8 }}>
          64-Car
        </button>
      </div>

      <div style={{ marginBottom: 16 }}>
        <button onClick={() => setStatusFilter("Completed")}>Completed</button>
        <button onClick={() => setStatusFilter("Current")} style={{ marginLeft: 8 }}>
          Current
        </button>
        <button onClick={() => setStatusFilter("Pending")} style={{ marginLeft: 8 }}>
          Pending
        </button>
        <button onClick={() => setStatusFilter("All")} style={{ marginLeft: 8 }}>
          All
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <select value={schoolFilter} onChange={(e) => setSchoolFilter(e.target.value)}>
          <option value="All Schools">All Schools</option>
          {SCHOOL_CODES.map((school) => (
            <option key={school} value={school}>
              {school}
            </option>
          ))}
        </select>
      </div>

      {visibleRaces.map((race) => (
        <div
          key={race.id}
          style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}
        >
          <div><strong>Race {race.id}</strong> — {race.round}</div>
          <div>{race.racer_a || race.slot_a} vs {race.racer_b || race.slot_b}</div>
          <div>Status: {race.status}</div>
          <div>Run 1 Winner: {race.run1_winner || "--"}</div>
          <div>Run 2 Winner: {race.run2_winner || "--"}</div>
          <div>Overall Winner: {race.winner || "--"}</div>
        </div>
      ))}
    </div>
  );
}