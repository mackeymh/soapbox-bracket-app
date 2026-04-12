import { useMemo, useState } from "react";

const BYE_SEEDS_64 = new Set([1, 17, 9, 25, 5, 21, 13, 29, 3, 19, 11, 27, 7, 23, 15]);

const ROUND_ORDER_12 = [
  "Play-In Round",
  "Quarterfinals",
  "Semifinals",
  "Final",
];

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

function createRace({
  id,
  round,
  slotA = "",
  slotB = "",
  racerA = "",
  racerB = "",
  nextWinnerTo = null,
  nextWinnerSlot = null,
  placementKey = null,
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
    totalA: "",
    totalB: "",
    winner: "",
    loser: "",
    status: "Pending",
    note: "",
    media: "",
    allowBye,
    byeFor: "", // "A" | "B" | ""
    dqA: false,
    dqB: false,
    tiebreaker: false,
    flagged: false,
    nextWinnerTo,
    nextWinnerSlot,
    placementKey,
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
    }),
    createRace({
      id: 9,
      round: "Semifinals",
      slotA: "Winner Race 5",
      slotB: "Winner Race 6",
      nextWinnerTo: 11,
      nextWinnerSlot: "A",
    }),
    createRace({
      id: 10,
      round: "Semifinals",
      slotA: "Winner Race 7",
      slotB: "Winner Race 8",
      nextWinnerTo: 11,
      nextWinnerSlot: "B",
    }),
    createRace({
      id: 11,
      round: "Final",
      slotA: "Winner Race 9",
      slotB: "Winner Race 10",
      placementKey: "championship",
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
        allowBye: BYE_SEEDS_64.has(seedA) || !seeds[seedB] || !seeds[seedA],
      })
    );
  }

  for (let i = 33; i <= 48; i++) {
    const source1 = (i - 33) * 2 + 1;
    const source2 = source1 + 1;
    races.push(
      createRace({
        id: i,
        round: "Round of 32",
        slotA: `Winner Race ${source1}`,
        slotB: `Winner Race ${source2}`,
        nextWinnerTo: 48 + Math.ceil((i - 32) / 2),
        nextWinnerSlot: (i - 33) % 2 === 0 ? "A" : "B",
      })
    );
  }

  for (let i = 49; i <= 56; i++) {
    const source1 = 33 + (i - 49) * 2;
    const source2 = source1 + 1;
    races.push(
      createRace({
        id: i,
        round: "Sweet 16",
        slotA: `Winner Race ${source1}`,
        slotB: `Winner Race ${source2}`,
        nextWinnerTo: 56 + Math.ceil((i - 48) / 2),
        nextWinnerSlot: (i - 49) % 2 === 0 ? "A" : "B",
      })
    );
  }

  for (let i = 57; i <= 60; i++) {
    const source1 = 49 + (i - 57) * 2;
    const source2 = source1 + 1;
    races.push(
      createRace({
        id: i,
        round: "Elite 8",
        slotA: `Winner Race ${source1}`,
        slotB: `Winner Race ${source2}`,
        nextWinnerTo: 60 + Math.ceil((i - 56) / 2),
        nextWinnerSlot: (i - 57) % 2 === 0 ? "A" : "B",
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
      placementKey: "sfTop",
    }),
    createRace({
      id: 62,
      round: "Final 4",
      slotA: "Winner Race 59",
      slotB: "Winner Race 60",
      nextWinnerTo: 63,
      nextWinnerSlot: "B",
      placementKey: "sfBottom",
    }),
    createRace({
      id: 63,
      round: "Championship",
      slotA: "Winner Race 61",
      slotB: "Winner Race 62",
      placementKey: "championship",
    }),
    createRace({
      id: 66,
      round: "5th / 6th",
      slotA: "Loser Race 57",
      slotB: "Loser Race 58",
      placementKey: "fifthSixth",
    }),
    createRace({
      id: 67,
      round: "7th / 8th",
      slotA: "Loser Race 59",
      slotB: "Loser Race 60",
      placementKey: "seventhEighth",
    }),
    createRace({
      id: 68,
      round: "3rd / 4th",
      slotA: "Loser Race 61",
      slotB: "Loser Race 62",
      placementKey: "thirdFourth",
    })
  );

  return races;
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

function clearRaceResult(race) {
  return {
    ...race,
    totalA: "",
    totalB: "",
    winner: "",
    loser: "",
    tiebreaker: false,
    flagged: false,
    status: "Pending",
  };
}

function computeRaceResult(race) {
  const a = race.racerA?.trim();
  const b = race.racerB?.trim();

  if (!a && !b) {
    return {
      ...clearRaceResult(race),
      flagged: true,
      status: "Pending",
      note: race.note,
    };
  }

  if (race.byeFor === "A") {
    if (!a) {
      return {
        ...clearRaceResult(race),
        flagged: true,
        status: "Flagged",
      };
    }
    return {
      ...race,
      totalA: "",
      totalB: "",
      winner: a,
      loser: b || "",
      tiebreaker: false,
      flagged: false,
      status: "Complete",
    };
  }

  if (race.byeFor === "B") {
    if (!b) {
      return {
        ...clearRaceResult(race),
        flagged: true,
        status: "Flagged",
      };
    }
    return {
      ...race,
      totalA: "",
      totalB: "",
      winner: b,
      loser: a || "",
      tiebreaker: false,
      flagged: false,
      status: "Complete",
    };
  }

  if (race.dqA && race.dqB) {
    return {
      ...clearRaceResult(race),
      flagged: true,
      status: "Flagged",
    };
  }

  if (race.dqA) {
    return {
      ...race,
      totalA: "",
      totalB: "",
      winner: b || "",
      loser: a || "",
      tiebreaker: false,
      flagged: !b,
      status: b ? "Complete" : "Flagged",
    };
  }

  if (race.dqB) {
    return {
      ...race,
      totalA: "",
      totalB: "",
      winner: a || "",
      loser: b || "",
      tiebreaker: false,
      flagged: !a,
      status: a ? "Complete" : "Flagged",
    };
  }

  const r1l1 = parseTime(race.run1Lane1);
  const r1l2 = parseTime(race.run1Lane2);
  const r2l1 = parseTime(race.run2Lane1);
  const r2l2 = parseTime(race.run2Lane2);

  if ([r1l1, r1l2, r2l1, r2l2].some((v) => v === null)) {
    return {
      ...clearRaceResult(race),
      status: "Pending",
    };
  }

  const totalA = Number((r1l1 + r2l2).toFixed(3));
  const totalB = Number((r1l2 + r2l1).toFixed(3));

  if (totalA === totalB) {
    return {
      ...race,
      totalA,
      totalB,
      winner: "",
      loser: "",
      tiebreaker: true,
      flagged: true,
      status: "Tiebreaker",
    };
  }

  const winner = totalA < totalB ? a : b;
  const loser = totalA < totalB ? b : a;

  return {
    ...race,
    totalA,
    totalB,
    winner: winner || "",
    loser: loser || "",
    tiebreaker: false,
    flagged: false,
    status: winner ? "Complete" : "Flagged",
  };
}

function buildPlacements(races, bracketType) {
  if (bracketType === "12") {
    const finalRace = races.find((r) => r.id === 11);
    return [
      { place: "1st", name: finalRace?.winner || "" },
      { place: "2nd", name: finalRace?.loser || "" },
      { place: "3rd", name: "" },
      { place: "4th", name: "" },
      { place: "5th", name: "" },
      { place: "6th", name: "" },
      { place: "7th", name: "" },
      { place: "8th", name: "" },
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

function applyAdvancement(races, bracketType) {
  let updated = races.map((r) => ({ ...r }));

  const setSlot = (raceId, slot, value) => {
    const idx = updated.findIndex((r) => r.id === raceId);
    if (idx === -1) return;
    if (slot === "A") updated[idx].racerA = value || "";
    if (slot === "B") updated[idx].racerB = value || "";
  };

  updated.forEach((race) => {
    if (race.nextWinnerTo && race.nextWinnerSlot) {
      setSlot(race.nextWinnerTo, race.nextWinnerSlot, race.winner || "");
    }
  });

  if (bracketType === "64") {
    const r57 = updated.find((r) => r.id === 57);
    const r58 = updated.find((r) => r.id === 58);
    const r59 = updated.find((r) => r.id === 59);
    const r60 = updated.find((r) => r.id === 60);
    const r61 = updated.find((r) => r.id === 61);
    const r62 = updated.find((r) => r.id === 62);

    setSlot(66, "A", r57?.loser || "");
    setSlot(66, "B", r58?.loser || "");
    setSlot(67, "A", r59?.loser || "");
    setSlot(67, "B", r60?.loser || "");
    setSlot(68, "A", r61?.loser || "");
    setSlot(68, "B", r62?.loser || "");
  }

  return updated;
}

function recalculateAll(races, bracketType) {
  let working = races.map((r) => computeRaceResult(r));
  working = applyAdvancement(working, bracketType);

  // Recompute after advancement so dependent races can update cleanly.
  working = working.map((r) => computeRaceResult(r));
  working = applyAdvancement(working, bracketType);

  return working;
}

function statusColor(status) {
  if (status === "Complete") return "#22c55e";
  if (status === "Tiebreaker") return "#f59e0b";
  if (status === "Flagged") return "#ef4444";
  return "#94a3b8";
}

export default function App() {
  const [bracketType, setBracketType] = useState("12");
  const [viewMode, setViewMode] = useState("admin");
  const [seedNames, setSeedNames] = useState(makeSeedMap(12));
  const [races, setRaces] = useState(recalculateAll(make12CarRaces(makeSeedMap(12)), "12"));
  const [selectedRaceId, setSelectedRaceId] = useState(1);

  const roundOrder = bracketType === "12" ? ROUND_ORDER_12 : ROUND_ORDER_64;

  const groupedRaces = useMemo(
    () =>
      roundOrder.map((roundName) => ({
        roundName,
        races: races.filter((race) => race.round === roundName),
      })),
    [races, roundOrder]
  );

  const selectedRace = races.find((race) => race.id === selectedRaceId) || null;
  const latestCompletedRace = [...races]
    .filter((r) => r.status === "Complete" && r.winner)
    .sort((a, b) => b.id - a.id)[0];

  const nextPendingRace = races.find((r) => r.status === "Pending");
  const placements = buildPlacements(races, bracketType);

  function rebuild(type, seeds) {
    const freshRaces =
      type === "12" ? make12CarRaces(seeds) : make64CarRaces(seeds);
    const recalculated = recalculateAll(freshRaces, type);
    setBracketType(type);
    setRaces(recalculated);
    setSelectedRaceId(recalculated[0]?.id || null);
  }

  function changeBracket(type) {
    const count = type === "12" ? 12 : 64;
    const newSeeds = makeSeedMap(count);
    setSeedNames(newSeeds);
    rebuild(type, newSeeds);
  }

  function updateSeed(seed, value) {
    setSeedNames((prev) => {
      const next = { ...prev, [seed]: value };
      const rebuilt = bracketType === "12" ? make12CarRaces(next) : make64CarRaces(next);
      setRaces(recalculateAll(rebuilt, bracketType));
      return next;
    });
  }

  function updateRace(id, updates) {
    setRaces((prev) =>
      recalculateAll(
        prev.map((race) => (race.id === id ? { ...race, ...updates } : race)),
        bracketType
      )
    );
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
        <div style={{ color: "#cbd5e1", marginTop: 6 }}>
          Seed entry, two-run timing, BYE, DQ, auto-advance, live placements
        </div>
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

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20, flexWrap: "wrap" }}>
          <button
            onClick={() => setViewMode("admin")}
            style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: "#334155", color: "white", cursor: "pointer" }}
          >
            Back to Admin
          </button>
          <button
            onClick={() => changeBracket("12")}
            style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: bracketType === "12" ? "#22c55e" : "#334155", color: "white", cursor: "pointer" }}
          >
            12-Car
          </button>
          <button
            onClick={() => changeBracket("64")}
            style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: bracketType === "64" ? "#22c55e" : "#334155", color: "white", cursor: "pointer" }}
          >
            64-Car
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
          <div style={{ background: "#111827", border: "1px solid #334155", borderRadius: 18, padding: 28 }}>
            <div style={{ color: "#93c5fd", fontSize: 18, marginBottom: 12 }}>Latest Result</div>

            {latestCompletedRace ? (
              <>
                <div style={{ color: "#cbd5e1", fontSize: 20 }}>WINNER</div>
                <div style={{ fontSize: 58, fontWeight: "bold", lineHeight: 1.1 }}>{latestCompletedRace.winner}</div>
                <div style={{ fontSize: 36, color: "#22c55e", fontWeight: "bold", marginTop: 12 }}>
                  {latestCompletedRace.totalA !== "" || latestCompletedRace.totalB !== ""
                    ? `${latestCompletedRace.winner === latestCompletedRace.racerA ? latestCompletedRace.totalA : latestCompletedRace.totalB} total`
                    : latestCompletedRace.byeFor
                    ? "Advanced by BYE"
                    : latestCompletedRace.dqA || latestCompletedRace.dqB
                    ? "Advanced by DQ"
                    : "--"}
                </div>
               <div style={{ marginTop: 16, fontSize: 22, color: "#cbd5e1" }}>
  {latestCompletedRace.racerA} vs {latestCompletedRace.racerB}
</div>

{!latestCompletedRace.byeFor &&
  !latestCompletedRace.dqA &&
  !latestCompletedRace.dqB && (
    <div
      style={{
        marginTop: 14,
        background: "#1e293b",
        padding: 14,
        borderRadius: 12,
        fontSize: 16,
        color: "#e2e8f0",
      }}
    >
      <div style={{ fontWeight: "bold", marginBottom: 8 }}>Run Times</div>
      <div>Run 1 Lane 1: {latestCompletedRace.run1Lane1 || "--"}</div>
      <div>Run 1 Lane 2: {latestCompletedRace.run1Lane2 || "--"}</div>
      <div>Run 2 Lane 1: {latestCompletedRace.run2Lane1 || "--"}</div>
      <div>Run 2 Lane 2: {latestCompletedRace.run2Lane2 || "--"}</div>

      <div style={{ marginTop: 10 }}>
        {latestCompletedRace.racerA}: {latestCompletedRace.totalA === "" ? "--" : latestCompletedRace.totalA}
      </div>
      <div>
        {latestCompletedRace.racerB}: {latestCompletedRace.totalB === "" ? "--" : latestCompletedRace.totalB}
      </div>
    </div>
  )}
                <div style={{ marginTop: 6, color: "#94a3b8" }}>
                  Race {latestCompletedRace.id} • {latestCompletedRace.round}
                </div>

                <div
                  style={{
                    marginTop: 24,
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid #334155",
                    background: "#0f172a",
                    minHeight: 240,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {latestCompletedRace.media ? (
                    <img
                      src={latestCompletedRace.media}
                      alt="Finish line result"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ color: "#64748b", fontSize: 20 }}>
                      Finish-line image preview
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ color: "#94a3b8", fontSize: 20 }}>
                No completed race yet.
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ background: "#111827", border: "1px solid #334155", borderRadius: 18, padding: 20 }}>
              <div style={{ color: "#93c5fd", marginBottom: 10, fontSize: 18 }}>Up Next</div>
              {nextPendingRace ? (
                <>
                  <div style={{ fontSize: 24, fontWeight: "bold" }}>{nextPendingRace.racerA || nextPendingRace.slotA}</div>
                  <div style={{ color: "#94a3b8", margin: "6px 0" }}>vs</div>
                  <div style={{ fontSize: 24, fontWeight: "bold" }}>{nextPendingRace.racerB || nextPendingRace.slotB}</div>
                  <div style={{ marginTop: 10, color: "#cbd5e1" }}>Race {nextPendingRace.id} • {nextPendingRace.round}</div>
                </>
              ) : (
                <div style={{ color: "#94a3b8" }}>All races complete.</div>
              )}
            </div>

            <div style={{ background: "#111827", border: "1px solid #334155", borderRadius: 18, padding: 20 }}>
              <div style={{ color: "#93c5fd", marginBottom: 12, fontSize: 18 }}>Live Placements</div>
              {placements.map((p) => (
                <div key={p.place} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1e293b" }}>
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

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => changeBracket("12")}
          style={{ padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: bracketType === "12" ? "#22c55e" : "#334155", color: "white" }}
        >
          12-Car Bracket
        </button>
        <button
          onClick={() => changeBracket("64")}
          style={{ padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: bracketType === "64" ? "#22c55e" : "#334155", color: "white" }}
        >
          64-Car Bracket
        </button>
        <button
          onClick={() => setViewMode("spectator")}
          style={{ padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: "#2563eb", color: "white" }}
        >
          Open Spectator View
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.6fr 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 18, maxHeight: "80vh", overflowY: "auto" }}>
          <h2 style={{ marginTop: 0 }}>Seed Entry</h2>
          <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 12 }}>
            Enter racer names for all seeds.
          </div>

          {Object.keys(seedNames).map((seed) => (
            <div key={seed} style={{ marginBottom: 10 }}>
              <label style={{ display: "block", marginBottom: 4, fontSize: 13, color: "#cbd5e1" }}>
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
                <h2 style={{ fontSize: 20, marginBottom: 12, color: "#93c5fd" }}>{group.roundName}</h2>
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
                    <div style={{ marginTop: 10, color: statusColor(race.status), fontWeight: "bold", fontSize: 14 }}>
                      {race.status}
                    </div>
                    {race.winner && (
                      <div style={{ marginTop: 6, color: "#22c55e", fontWeight: "bold" }}>
                        Winner: {race.winner}
                      </div>
                    )}
                    {race.tiebreaker && (
                      <div style={{ marginTop: 6, color: "#f59e0b", fontWeight: "bold" }}>
                        Tiebreaker Required
                      </div>
                    )}
                    {race.flagged && !race.winner && (
                      <div style={{ marginTop: 6, color: "#ef4444", fontWeight: "bold" }}>
                        Heat flagged
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 12, padding: 20, position: "sticky", top: 20, maxHeight: "80vh", overflowY: "auto" }}>
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
                    onChange={(e) =>
                      updateRace(selectedRace.id, {
                        byeFor: e.target.value,
                      })
                    }
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
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

              <div style={{ color: "#93c5fd", fontWeight: "bold", marginBottom: 8 }}>Run 1</div>
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

              <div style={{ color: "#93c5fd", fontWeight: "bold", margin: "12px 0 8px" }}>Run 2 (lanes switch)</div>
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

              <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: "#0f172a", border: "1px solid #334155" }}>
                <div>Total Racer A: {selectedRace.totalA === "" ? "--" : selectedRace.totalA}</div>
                <div>Total Racer B: {selectedRace.totalB === "" ? "--" : selectedRace.totalB}</div>
                <div style={{ marginTop: 8, fontWeight: "bold", color: selectedRace.winner ? "#22c55e" : selectedRace.flagged ? "#ef4444" : "#cbd5e1" }}>
                  Winner: {selectedRace.winner || "--"}
                </div>
                {selectedRace.loser && <div>Loser: {selectedRace.loser}</div>}
                {selectedRace.tiebreaker && <div style={{ color: "#f59e0b" }}>Exact tie — tiebreaker required.</div>}
                {selectedRace.dqA && !selectedRace.dqB && <div>Racer A disqualified. Racer B advances.</div>}
                {selectedRace.dqB && !selectedRace.dqA && <div>Racer B disqualified. Racer A advances.</div>}
                {selectedRace.dqA && selectedRace.dqB && <div style={{ color: "#ef4444" }}>Both racers disqualified. No winner.</div>}
                {selectedRace.byeFor === "A" && <div>Racer A advances by BYE.</div>}
                {selectedRace.byeFor === "B" && <div>Racer B advances by BYE.</div>}
              </div>

              <label style={{ display: "block", marginTop: 14, marginBottom: 6 }}>Notes</label>
              <input
                type="text"
                value={selectedRace.note}
                onChange={(e) => updateRace(selectedRace.id, { note: e.target.value })}
                style={inputStyle}
                placeholder="Notes"
              />

              <label style={{ display: "block", marginTop: 14, marginBottom: 6 }}>Media URL</label>
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
                  style={{ width: "100%", borderRadius: 10, border: "1px solid #475569", marginTop: 12 }}
                />
              )}

              <div style={{ marginTop: 20 }}>
                <h3 style={{ marginBottom: 10 }}>Live Placements</h3>
                {placements.map((p) => (
                  <div key={p.place} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #334155" }}>
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

const inputStyle = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  marginBottom: 10,
  border: "1px solid #475569",
  background: "#0f172a",
  color: "white",
};