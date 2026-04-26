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
};

const DIVISION_LABELS = {
  stock: "Stock Division",
  superstock: "Super Stock Division",
};

const COLORS = {
  bg: "#07111f",
  bg2: "#0f172a",
  panel: "#0f1b2d",
  panel2: "#111827",
  card: "#0b1628",
  row: "#132238",
  border: "#334155",
  text: "#f8fafc",
  muted: "#94a3b8",
  muted2: "#cbd5e1",
  accent: "#22c55e",
  accentDark: "#14532d",
  yellow: "#facc15",
  yellowDark: "#713f12",
  red: "#ef4444",
  redDark: "#7f1d1d",
  chip: "#1f2937",
};

function schoolCodeToShort(code) {
  return code.replace(/^\d{2}X/, "").replace(/^0+/, "");
}

function normalizeCarLabel(label = "") {
  const [schoolPart = "", carPart = ""] = String(label).split("-");
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

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatTime(value) {
  const n = toNumber(value);
  return n === null ? "--.---" : n.toFixed(3);
}

function getRacerA(race) {
  return race.racer_a || race.slot_a || "--";
}

function getRacerB(race) {
  return race.racer_b || race.slot_b || "--";
}

function isComplete(race) {
  return race.status === "Complete" || !!race.winner;
}

function isRaceMidRace(race) {
  const run1 = race.run1_lane1 != null || race.run1_lane2 != null;
  const run2 = race.run2_lane1 != null || race.run2_lane2 != null;
  return run1 && !run2;
}

function getRaceTimes(race) {
  const aRun1 = toNumber(race.run1_lane1);
  const bRun1 = toNumber(race.run1_lane2);

  // Lane switch: Racer A's second run is lane2; Racer B's second run is lane1.
  const aRun2 = toNumber(race.run2_lane2);
  const bRun2 = toNumber(race.run2_lane1);

  const totalA =
    race.total_a != null
      ? toNumber(race.total_a)
      : aRun1 != null && aRun2 != null
      ? aRun1 + aRun2
      : null;

  const totalB =
    race.total_b != null
      ? toNumber(race.total_b)
      : bRun1 != null && bRun2 != null
      ? bRun1 + bRun2
      : null;

  return { aRun1, bRun1, aRun2, bRun2, totalA, totalB };
}

function getRunWinner(race, runNumber) {
  if (isComplete(race)) return null;

  const { aRun1, bRun1, aRun2, bRun2 } = getRaceTimes(race);

  if (runNumber === 1 && aRun1 != null && bRun1 != null) {
    if (aRun1 < bRun1) return "A";
    if (bRun1 < aRun1) return "B";
  }

  if (runNumber === 2 && aRun2 != null && bRun2 != null) {
    if (aRun2 < bRun2) return "A";
    if (bRun2 < aRun2) return "B";
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

export default function SpectatorPage() {
  const { district = "d11" } = useParams();

  const config = DISTRICT_CONFIG[district] || DISTRICT_CONFIG.d11;
  const districtDivisions = DISTRICT_CONFIG[district]?.divisions || ["stock"];

  const [division, setDivision] = useState(districtDivisions[0]);
  const [bracketType, setBracketType] = useState("12");
  const [races, setRaces] = useState([]);
  const [tab, setTab] = useState("Races");
  const [filter, setFilter] = useState("All");
  const [schoolFilter, setSchoolFilter] = useState("All Schools");
  const [districtCurrentRace, setDistrictCurrentRace] = useState(null);
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
    async function loadRaces() {
      const data = await fetchRaces(bracketType, district, activeDivision);
      setRaces(data || []);
    }

    if (!bracketType || !district || !activeDivision) return;

    loadRaces();
    const intervalId = setInterval(loadRaces, 5000);

    return () => clearInterval(intervalId);
  }, [bracketType, district, activeDivision]);

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

        const current = (divisionRaces || []).find(
          (race) => race.is_current_override
        );

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

  const sorted = useMemo(
    () => [...races].sort((a, b) => a.id - b.id),
    [races]
  );

  const currentRace = useMemo(
    () => sorted.find((race) => race.is_current_override) || null,
    [sorted]
  );

  const currentRaceIndex = useMemo(
    () => sorted.findIndex((race) => race.is_current_override),
    [sorted]
  );

  const nextRace = useMemo(() => {
    if (currentRaceIndex < 0) return null;

    return (
      sorted
        .slice(currentRaceIndex + 1)
        .find(
          (race) =>
            race.status !== "Complete" &&
            race.status !== "DQ Conflict"
        ) || null
    );
  }, [sorted, currentRaceIndex]);

  useEffect(() => {
    if (currentRef.current && tab === "Races") {
      currentRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [currentRace, tab]);

  const stats = useMemo(() => {
    const completed = sorted.filter((race) => race.status === "Complete").length;
    const inProgress = sorted.filter(
      (race) =>
        race.status !== "Complete" &&
        (isRaceMidRace(race) || race.is_current_override)
    ).length;
    const pending = sorted.filter(
      (race) => !hasAnyRunData(race) && race.status !== "Complete"
    ).length;

    return {
      total: sorted.length,
      completed,
      inProgress,
      pending,
    };
  }, [sorted]);

  const visible = useMemo(() => {
    return sorted.filter((race) => {
      if (
        config.schoolCodes.length > 0 &&
        !raceMatchesSchool(race, activeSchoolFilter)
      ) {
        return false;
      }

      if (filter === "All") return true;

      if (filter === "Completed") return race.status === "Complete";

      if (filter === "Pending") {
        return !hasAnyRunData(race) && race.status !== "Complete";
      }

      if (filter === "Current") {
        return race.is_current_override || isRaceMidRace(race);
      }

      return true;
    });
  }, [sorted, filter, activeSchoolFilter, config.schoolCodes.length]);

  const orderedVisible = useMemo(() => {
    if (!currentRace) return visible;

    const currentInVisible = visible.find((race) => race.id === currentRace.id);
    if (!currentInVisible) return visible;

    return [
      currentInVisible,
      ...visible.filter((race) => race.id !== currentRace.id),
    ];
  }, [visible, currentRace]);

    const currentBannerRace = districtCurrentRace || currentRace;

  return (
    <div style={styles.page}>
      <style>
        {`
          @keyframes onTrackFlash {
            0% {
              box-shadow: 0 0 10px rgba(34, 197, 94, 0.35);
              transform: scale(1);
            }
            100% {
              box-shadow: 0 0 28px rgba(34, 197, 94, 0.9);
              transform: scale(1.01);
            }
          }

          @media (max-width: 900px) {
            .hero-grid {
              grid-template-columns: 1fr !important;
            }

            .race-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          @media (max-width: 620px) {
            .spectator-shell {
              padding: 10px !important;
            }

            .header-wrap {
              flex-direction: column !important;
              text-align: center !important;
            }

            .control-row {
              flex-direction: column !important;
              align-items: stretch !important;
            }

            .control-row > * {
              width: 100% !important;
            }

            .race-grid {
              grid-template-columns: 1fr !important;
            }

            .score-header,
            .score-row {
              grid-template-columns: 1.8fr 0.9fr 0.9fr 0.9fr !important;
              font-size: 12px !important;
            }

            .on-track-title {
              font-size: 24px !important;
            }

            .on-track-matchup {
              font-size: 18px !important;
            }
          }
        `}
      </style>

      <div className="spectator-shell" style={styles.shell}>
        <header className="header-wrap" style={styles.header}>
          <img
            src={config.logo}
            alt={`${config.title} logo`}
            style={styles.logo}
          />

          <div>
            <div style={styles.kicker}>SOAP BOX DERBY LIVE</div>
            <h1 style={styles.title}>{config.title}</h1>
            <div style={styles.subtitle}>
              {DIVISION_LABELS[activeDivision]} · {bracketType}-Car Bracket
            </div>
          </div>
        </header>

        <section className="hero-grid" style={styles.heroGrid}>
          <div
            style={{
              ...styles.onTrackBanner,
              animation: currentBannerRace
                ? "onTrackFlash 0.85s infinite alternate"
                : "none",
            }}
          >
            <div style={styles.heroLabel}>🟢 ON THE TRACK</div>

            {currentBannerRace ? (
              <>
                <div className="on-track-title" style={styles.onTrackTitle}>
                  Race {currentBannerRace.id} —{" "}
                  {DIVISION_LABELS[currentBannerRace.division || activeDivision]}
                </div>
                <div className="on-track-matchup" style={styles.onTrackMatchup}>
                  {getRacerA(currentBannerRace)} vs {getRacerB(currentBannerRace)}
                </div>
                <div style={styles.heroSubText}>
                  Cars currently coming down the track
                </div>
              </>
            ) : (
              <>
                <div className="on-track-title" style={styles.onTrackTitle}>
                  Waiting for race control
                </div>
                <div style={styles.heroSubText}>
                  The admin will mark the next race as ON THE TRACK.
                </div>
              </>
            )}
          </div>

          <div style={styles.sidePanel}>
            <div style={styles.sidePanelTitle}>🟡 UP NEXT</div>

            {nextRace ? (
              <>
                <div style={styles.nextRaceTitle}>Race {nextRace.id}</div>
                <div style={styles.nextRaceMatchup}>
                  {getRacerA(nextRace)} vs {getRacerB(nextRace)}
                </div>
                <div style={styles.nextRaceRound}>{nextRace.round}</div>
              </>
            ) : (
              <div style={styles.emptyText}>No next race selected yet.</div>
            )}

            <div style={styles.statsGrid}>
              <Stat label="Total" value={stats.total} />
              <Stat label="Done" value={stats.completed} />
              <Stat label="Live" value={stats.inProgress} />
              <Stat label="Pending" value={stats.pending} />
            </div>
          </div>
        </section>

        <section style={styles.controlsPanel}>
          <div className="control-row" style={styles.controlRow}>
            <div style={styles.tabRow}>
              {["Races", "Standings"].map((item) => (
                <button
                  key={item}
                  onClick={() => setTab(item)}
                  style={tab === item ? styles.activeTab : styles.tab}
                >
                  {item}
                </button>
              ))}
            </div>

            <div style={styles.tabRow}>
              {districtDivisions.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setDivision(item);
                    setSchoolFilter("All Schools");
                  }}
                  style={
                    activeDivision === item
                      ? styles.activeChip
                      : styles.chip
                  }
                >
                  {DIVISION_LABELS[item]}
                </button>
              ))}
            </div>
          </div>

          {tab === "Races" && (
            <div className="control-row" style={styles.controlRow}>
              <div style={styles.tabRow}>
                {["All", "Current", "Pending", "Completed"].map((item) => (
                  <button
                    key={item}
                    onClick={() => setFilter(item)}
                    style={filter === item ? styles.activeChip : styles.chip}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {config.schoolCodes.length > 0 && (
                <select
                  value={activeSchoolFilter}
                  onChange={(event) => setSchoolFilter(event.target.value)}
                  style={styles.select}
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
        </section>

        {tab === "Races" && (
          <section className="race-grid" style={styles.raceGrid}>
            {orderedVisible.map((race) => {
              const isOnTrack = currentRace?.id === race.id;
              const isUpNext = nextRace?.id === race.id;

              return (
                <RaceCard
                  key={`${district}-${activeDivision}-${bracketType}-${race.id}`}
                  race={race}
                  isOnTrack={isOnTrack}
                  isUpNext={isUpNext}
                  currentRef={isOnTrack ? currentRef : null}
                  divisionLabel={DIVISION_LABELS[activeDivision]}
                />
              );
            })}
          </section>
        )}

        {tab === "Standings" && (
          <section style={styles.standingsPanel}>
            <h2 style={styles.sectionTitle}>
              Final Standings · {DIVISION_LABELS[activeDivision]}
            </h2>

            <div style={styles.standingsGrid}>
              {getStandings(bracketType, sorted).map(([place, racer]) => (
                <div key={place} style={styles.standingRow}>
                  <div style={styles.place}>{place}</div>
                  <div style={styles.standingName}>{racer || "--"}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
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

function RaceCard({ race, isOnTrack, isUpNext, currentRef, divisionLabel }) {
  const { aRun1, bRun1, aRun2, bRun2, totalA, totalB } = getRaceTimes(race);

  const run1Winner = getRunWinner(race, 1);
  const run2Winner = getRunWinner(race, 2);
  const complete = isComplete(race);

  const calculatedWinner =
    totalA != null && totalB != null
      ? totalA < totalB
        ? "A"
        : totalB < totalA
        ? "B"
        : null
      : null;

  const winner =
    race.winner === getRacerA(race)
      ? "A"
      : race.winner === getRacerB(race)
      ? "B"
      : calculatedWinner;

  const winnerA = winner === "A";
  const winnerB = winner === "B";
  const isTie = totalA != null && totalB != null && totalA === totalB;
  const margin =
    totalA != null && totalB != null ? Math.abs(totalA - totalB) : null;
  const isPhotoFinish = margin != null && margin > 0 && margin <= 0.01;

  const statusText = getStatusText(race, isOnTrack, isUpNext);
  const statusColor = getStatusColor(race, isOnTrack, isUpNext);

  return (
    <article
      ref={currentRef}
      style={{
        ...styles.raceCard,
        border: isOnTrack
          ? `2px solid ${COLORS.accent}`
          : isUpNext
          ? `2px solid ${COLORS.yellow}`
          : `1px solid ${COLORS.border}`,
        boxShadow: isOnTrack
          ? "0 0 22px rgba(34,197,94,0.35)"
          : isUpNext
          ? "0 0 16px rgba(250,204,21,0.25)"
          : "none",
      }}
    >
      <div style={styles.raceCardHeader}>
        <div>
          <div style={styles.raceNumber}>Race {race.id}</div>
          <div style={styles.raceMeta}>
            {divisionLabel} · {race.round}
          </div>
        </div>

        <div
          style={{
            ...styles.statusPill,
            color: statusColor,
            borderColor: statusColor,
          }}
        >
          {statusText}
        </div>
      </div>

      <div style={styles.scoreTable}>
        <div style={styles.scoreHeader}>
          <div>Competitor</div>
          <div>Run 1</div>
          <div>Run 2</div>
          <div>Total</div>
        </div>

        <ScoreRow
          name={getRacerA(race)}
          run1={aRun1}
          run2={aRun2}
          total={totalA}
          run1Winner={run1Winner === "A"}
          run2Winner={run2Winner === "A"}
          overallWinner={winnerA}
          complete={complete || !!winner}
        />

        <ScoreRow
          name={getRacerB(race)}
          run1={bRun1}
          run2={bRun2}
          total={totalB}
          run1Winner={run1Winner === "B"}
          run2Winner={run2Winner === "B"}
          overallWinner={winnerB}
          complete={complete || !!winner}
        />
      </div>

      {isTie && (
        <div style={styles.tieBanner}>
          ⚠️ Tiebreaker Needed — both racers are tied at {formatTime(totalA)}
        </div>
      )}

      {!isTie && winner && (
        <div style={styles.winnerBanner}>
          🏁 Winner: {winner === "A" ? getRacerA(race) : getRacerB(race)}
        </div>
      )}

      {isPhotoFinish && winner && (
        <div style={styles.photoFinishBanner}>
          📸 Photo Finish — margin: {margin.toFixed(3)} seconds
        </div>
      )}

      {(race.dq_a || race.dq_b || race.bye_for) && (
        <div style={styles.alertBox}>
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

function ScoreRow({
  name,
  run1,
  run2,
  total,
  run1Winner,
  run2Winner,
  overallWinner,
  complete,
}) {
  return (
    <div
      style={{
        ...styles.scoreRow,
        ...(overallWinner ? styles.overallWinnerRow : {}),
      }}
    >
      <div style={styles.competitorCell}>
        <span>
          {overallWinner ? "🏁 " : ""}
          {name}
          {overallWinner && <span style={styles.winnerTag}> WINNER</span>}
        </span>
      </div>

      <div style={styles.timeCell}>
        {!complete && run1Winner ? <span style={styles.check}>✓ </span> : null}
        {formatTime(run1)}
      </div>

      <div style={styles.timeCell}>
        {!complete && run2Winner ? <span style={styles.check}>✓ </span> : null}
        {formatTime(run2)}
      </div>

      <div style={styles.totalCell}>{formatTime(total)}</div>
    </div>
  );
}

const styles = {
  page: {
    background: `linear-gradient(180deg, ${COLORS.bg}, ${COLORS.bg2})`,
    minHeight: "100vh",
    color: COLORS.text,
  },

  shell: {
    maxWidth: 1320,
    margin: "0 auto",
    padding: 16,
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
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

  heroGrid: {
    display: "grid",
    gridTemplateColumns: "1.45fr 0.55fr",
    gap: 14,
    marginBottom: 14,
  },

  onTrackBanner: {
    background: "linear-gradient(135deg, #14532d, #052e16)",
    border: `2px solid ${COLORS.accent}`,
    borderRadius: 20,
    padding: 18,
    textAlign: "center",
  },

  heroLabel: {
    color: "#bbf7d0",
    fontWeight: 900,
    fontSize: 13,
    letterSpacing: 0.8,
    marginBottom: 6,
  },

  onTrackTitle: {
    fontSize: 30,
    fontWeight: 950,
    lineHeight: 1.1,
  },

  onTrackMatchup: {
    fontSize: 22,
    fontWeight: 900,
    marginTop: 6,
  },

  heroSubText: {
    color: "#bbf7d0",
    marginTop: 8,
    fontSize: 13,
  },

  sidePanel: {
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    padding: 16,
  },

  sidePanelTitle: {
    color: COLORS.yellow,
    fontWeight: 950,
    letterSpacing: 0.6,
    fontSize: 13,
  },

  nextRaceTitle: {
    fontSize: 24,
    fontWeight: 950,
    marginTop: 8,
  },

  nextRaceMatchup: {
    fontSize: 16,
    fontWeight: 900,
    marginTop: 4,
  },

  nextRaceRound: {
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
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 8,
    marginTop: 14,
  },

  statBox: {
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 8,
    textAlign: "center",
  },

  statValue: {
    fontSize: 18,
    fontWeight: 950,
  },

  statLabel: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },

  controlsPanel: {
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 12,
    marginBottom: 14,
  },

  controlRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
    marginBottom: 8,
  },

  tabRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  tab: {
    background: COLORS.chip,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    padding: "8px 13px",
    fontWeight: 850,
    cursor: "pointer",
  },

  activeTab: {
    background: COLORS.accent,
    color: "#052e16",
    border: "none",
    borderRadius: 999,
    padding: "8px 13px",
    fontWeight: 950,
    cursor: "pointer",
  },

  chip: {
    background: COLORS.chip,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    padding: "8px 13px",
    fontWeight: 850,
    cursor: "pointer",
  },

  activeChip: {
    background: COLORS.accent,
    color: "#052e16",
    border: "none",
    borderRadius: 999,
    padding: "8px 13px",
    fontWeight: 950,
    cursor: "pointer",
  },

  select: {
    background: COLORS.chip,
    color: COLORS.text,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    padding: "8px 13px",
    fontWeight: 800,
    minHeight: 38,
  },

  raceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
    gap: 14,
  },

  raceCard: {
    background: COLORS.card,
    borderRadius: 18,
    padding: 14,
  },

  raceCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 10,
  },

  raceNumber: {
    fontSize: 18,
    fontWeight: 950,
  },

  raceMeta: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: 2,
  },

  statusPill: {
    border: "1px solid",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 950,
    whiteSpace: "nowrap",
  },

  scoreTable: {
    background: "#06101f",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    overflow: "hidden",
  },

  scoreHeader: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    gap: 0,
    background: "#020617",
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: 900,
    padding: "8px 10px",
  },

  scoreRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr 1fr 1fr",
    alignItems: "center",
    borderTop: `1px solid ${COLORS.border}`,
    padding: "9px 10px",
    fontSize: 14,
  },

  overallWinnerRow: {
    background: "rgba(34,197,94,0.18)",
    color: "#dcfce7",
    fontWeight: 950,
  },

  competitorCell: {
    fontWeight: 900,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  timeCell: {
    textAlign: "center",
    fontVariantNumeric: "tabular-nums",
  },

  totalCell: {
    textAlign: "center",
    fontWeight: 950,
    fontVariantNumeric: "tabular-nums",
  },

  check: {
    color: COLORS.accent,
    fontWeight: 950,
  },

  alertBox: {
    marginTop: 10,
    background: COLORS.redDark,
    color: "#fecaca",
    border: "1px solid #991b1b",
    borderRadius: 12,
    padding: 8,
    fontSize: 12,
    fontWeight: 850,
  },

  winnerBanner: {
    marginTop: 10,
    background: COLORS.accentDark,
    color: "#dcfce7",
    border: `1px solid ${COLORS.accent}`,
    borderRadius: 12,
    padding: 8,
    fontWeight: 950,
    textAlign: "center",
  },

  standingsPanel: {
    background: COLORS.panel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 16,
  },

  sectionTitle: {
    margin: "0 0 12px 0",
    fontSize: 24,
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
    background: COLORS.card,
    border: `1px solid ${COLORS.border}`,
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

  winnerTag: {
  color: COLORS.accent,
  fontWeight: 950,
  marginLeft: 6,
  fontSize: 12,
},

tieBanner: {
  marginTop: 10,
  background: COLORS.yellowDark,
  color: "#fef3c7",
  border: `1px solid ${COLORS.yellow}`,
  borderRadius: 12,
  padding: 8,
  fontWeight: 950,
  textAlign: "center",
},

photoFinishBanner: {
  marginTop: 8,
  background: "#1e293b",
  color: "#fde68a",
  border: `1px solid ${COLORS.yellow}`,
  borderRadius: 12,
  padding: 8,
  fontWeight: 900,
  textAlign: "center",
},
};