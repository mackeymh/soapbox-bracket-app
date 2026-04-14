import { useEffect, useState } from "react";
import { fetchSeeds, fetchRaces, upsertSeed, updateRace } from "../lib/raceStore";

export default function AdminPage() {
  const [bracketType, setBracketType] = useState("12");
  const [seeds, setSeeds] = useState([]);
  const [races, setRaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [seedRows, raceRows] = await Promise.all([
        fetchSeeds(bracketType),
        fetchRaces(bracketType),
      ]);
      setSeeds(seedRows);
      setRaces(raceRows);
      setLoading(false);
    }

    load();
  }, [bracketType]);

  async function handleSeedChange(seedNumber, value) {
    const schoolShort = value.split("-")[0] || "";
    const schoolCode = schoolShort ? `11X${schoolShort}` : "";
    const carNumber = value.split("-")[1] || "";

    await upsertSeed({
      bracket_type: bracketType,
      seed_number: seedNumber,
      label: value,
      school_code: schoolCode,
      car_number: carNumber,
    });

    const refreshed = await fetchSeeds(bracketType);
    setSeeds(refreshed);
  }

  async function handleRaceUpdate(raceId, field, value) {
    await updateRace(raceId, { [field]: value });
    const refreshed = await fetchRaces(bracketType);
    setRaces(refreshed);
  }

  if (loading) return <div style={{ padding: 24 }}>Loading admin page...</div>;

  return (
    <div style={{ padding: 24 }}>
      <h1>Admin</h1>

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setBracketType("12")}>12-Car</button>
        <button onClick={() => setBracketType("64")} style={{ marginLeft: 8 }}>
          64-Car
        </button>
      </div>

      <h2>Seeds</h2>
      {Array.from({ length: bracketType === "12" ? 12 : 64 }).map((_, i) => {
        const seedNumber = i + 1;
        const existing = seeds.find((s) => s.seed_number === seedNumber);

        return (
          <div key={seedNumber} style={{ marginBottom: 8 }}>
            <label>Seed {seedNumber}: </label>
            <input
              defaultValue={existing?.label || ""}
              placeholder="Example: 370-1"
              onBlur={(e) => handleSeedChange(seedNumber, e.target.value)}
            />
          </div>
        );
      })}

      <h2 style={{ marginTop: 24 }}>Races</h2>
      {races.map((race) => (
        <div
          key={race.id}
          style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}
        >
          <div><strong>Race {race.id}</strong> — {race.round}</div>
          <div>{race.racer_a || race.slot_a} vs {race.racer_b || race.slot_b}</div>

          <div style={{ marginTop: 8 }}>
            <input
              type="number"
              step="0.001"
              placeholder="Run1 Lane1"
              defaultValue={race.run1_lane1 ?? ""}
              onBlur={(e) => handleRaceUpdate(race.id, "run1_lane1", e.target.value)}
            />
            <input
              type="number"
              step="0.001"
              placeholder="Run1 Lane2"
              defaultValue={race.run1_lane2 ?? ""}
              onBlur={(e) => handleRaceUpdate(race.id, "run1_lane2", e.target.value)}
              style={{ marginLeft: 8 }}
            />
          </div>

          <div style={{ marginTop: 8 }}>
            <input
              type="number"
              step="0.001"
              placeholder="Run2 Lane1"
              defaultValue={race.run2_lane1 ?? ""}
              onBlur={(e) => handleRaceUpdate(race.id, "run2_lane1", e.target.value)}
            />
            <input
              type="number"
              step="0.001"
              placeholder="Run2 Lane2"
              defaultValue={race.run2_lane2 ?? ""}
              onBlur={(e) => handleRaceUpdate(race.id, "run2_lane2", e.target.value)}
              style={{ marginLeft: 8 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}