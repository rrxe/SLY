import { useEffect, useMemo, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/home.css";

type MiningState = {
  active: boolean;
  reward: number;
  cycleHours: number;
  startedAt: string | null;
  claimAvailableAt: string | null;
  claimReady: boolean;
  startAdVerified: boolean;
  claimAdVerified: boolean;
};

type Props = {
  balanceCoins: number;
  streak: number;
  mining: MiningState;
  miningReady: boolean;
  miningAdBusy: boolean;
  onMining: () => void;
};

type LeaderUser = {
  rank: number;
  name: string;
  coins: string;
  tier: string;
};

const DAILY_POINTS = 250;

const milestones = [
  { days: 3, chest: "Common" },
  { days: 7, chest: "Epic" },
  { days: 14, chest: "Legendary" },
  { days: 50, chest: "Mythic" },
];

function formatTime(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function formatMiningStartedAt(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Home({
  balanceCoins,
  streak,
  mining,
  miningReady,
  miningAdBusy,
  onMining,
}: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderUser[]>([]);
  const [now, setNow] = useState(() => Date.now());

  // العداد المرئي بس - يحدّث كل ثانية طالما المستخدم على هاي الصفحة.
  // هذا لا علاقة له بحالة التعدين الفعلية (تلك محفوظة بمستوى App
  // فتستمر حتى لو بدّلت صفحة).
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLeaderboard(data);
        }
      })
      .catch(() => {});
  }, []);

  const remainingMs =
    mining.active && mining.claimAvailableAt
      ? Math.max(0, new Date(mining.claimAvailableAt).getTime() - now)
      : 0;

  const claimReady = mining.active && (mining.claimReady || remainingMs <= 0);

  const currentChest =
    milestones.filter((item) => streak >= item.days).at(-1) ?? null;

  const nextMilestone =
    milestones.find((item) => item.days > streak) ?? null;

  const progressToNext = useMemo(() => {
    if (!nextMilestone) return 1;

    const previous =
      milestones.filter((item) => item.days < nextMilestone.days).at(-1)
        ?.days ?? 0;

    const span = nextMilestone.days - previous;
    if (span <= 0) return 0;

    return Math.min(1, Math.max(0, (streak - previous) / span));
  }, [streak, nextMilestone]);

  return (
    <section className="home-page">
      <section className="mining-hero">
        <div className="mining-orbit orbit-one" />
        <div className="mining-orbit orbit-two" />

        <span className="hero-badge">SLY MINING</span>

        <h1 className="hero-title">Mine Coins</h1>

        <p className="hero-desc">
          Start a 2-hour mining cycle, then watch one more ad to claim your
          reward.
        </p>

        <div className="mining-reward">
          <strong>+{mining.reward.toLocaleString()}</strong>
          <span>Coins every 2 hours</span>
        </div>

        <div className="mining-status-card">
          {!mining.active ? (
            <>
              <span className="mining-status-label">READY TO START</span>
              <strong>Watch an ad to activate mining</strong>
              <small>One rewarded ad starts your 2-hour cycle.</small>
            </>
          ) : claimReady ? (
            <>
              <span className="mining-status-label ready">CLAIM READY</span>
              <strong>{mining.reward.toLocaleString()} Coins waiting</strong>
              <small>Watch one rewarded ad to claim.</small>
            </>
          ) : (
            <>
              <span className="mining-status-label">MINING IN PROGRESS</span>
              <strong className="mining-timer">
                {formatTime(remainingMs)}
              </strong>
              <small>
                Started at {formatMiningStartedAt(mining.startedAt)}
              </small>
            </>
          )}
        </div>

        <button
          className="hero-play mining-button"
          onClick={onMining}
          disabled={
            !miningReady || miningAdBusy || (mining.active && !claimReady)
          }
        >
          {miningAdBusy ? (
            <>
              <span className="hero-play-spinner" />
              <span className="hero-play-text">Watching...</span>
            </>
          ) : !mining.active ? (
            <>
              <span className="hero-play-icon">
                <UiIcons name="play" className="hero-play-icon-svg" />
              </span>
              <span className="hero-play-text">Watch Ad & Start Mining</span>
            </>
          ) : claimReady ? (
            <>
              <span className="hero-play-icon">
                <UiIcons name="coins" className="hero-play-icon-svg" />
              </span>
              <span className="hero-play-text">
                Watch Ad & Claim {mining.reward.toLocaleString()}
              </span>
            </>
          ) : (
            <span className="hero-play-text">Mining in Progress</span>
          )}
        </button>

        {!miningReady ? (
          <small className="mining-sdk-note">
            Preparing rewarded mining ads...
          </small>
        ) : null}
      </section>

      <section className="stats-bar">
        <div className="stats-bar-item">
          <span className="stats-bar-icon gold">
            <UiIcons name="coins" className="stats-bar-svg" />
          </span>
          <div className="stats-bar-text">
            <strong>{balanceCoins.toLocaleString()}</strong>
            <small>Coins</small>
          </div>
        </div>

        <div className="stats-bar-divider" />

        <div className="stats-bar-item">
          <span className="stats-bar-icon teal">
            <span className="stats-bar-dot" />
          </span>
          <div className="stats-bar-text">
            <strong>{streak}d</strong>
            <small>Streak</small>
          </div>
        </div>

        <div className="stats-bar-divider" />

        <div className="stats-bar-item">
          <span className="stats-bar-icon gold">
            <UiIcons name="coins" className="stats-bar-svg" />
          </span>
          <div className="stats-bar-text">
            <strong>+2.5K</strong>
            <small>Per Cycle</small>
          </div>
        </div>
      </section>

      <section className="checkin-card">
        <div className="checkin-top">
          <div className="checkin-streak-badge">
            <strong>{streak}</strong>
            <span>days</span>
          </div>

          <div className="checkin-top-text">
            <p className="checkin-eyebrow">Daily Check-in</p>
            <h2>+{DAILY_POINTS} points today</h2>
            <span className="checkin-status">Checked in</span>
          </div>
        </div>

        <div className="progress-bar">
          <span style={{ width: `${progressToNext * 100}%` }} />
        </div>

        <div className="milestones">
          {milestones.map((item) => {
            const achieved = streak >= item.days;
            const active = nextMilestone?.days === item.days;

            return (
              <div
                key={item.days}
                className={`milestone ${achieved ? "achieved" : ""} ${
                  active ? "active" : ""
                }`}
              >
                <strong>{item.days}</strong>
                <span>{item.chest}</span>
              </div>
            );
          })}
        </div>

        <div className="checkin-footer">
          <span className="checkin-next">
            {nextMilestone
              ? `Next reward in ${nextMilestone.days - streak} days`
              : "All rewards unlocked"}
          </span>

          <span className="checkin-countdown">
            {currentChest ? `${currentChest.chest} unlocked` : "Keep your streak going"}
          </span>
        </div>
      </section>

      <section className="home-grid">
        <article className="mini-card">
          <div className="section-head compact">
            <div>
              <p>Top 10</p>
              <h2>Leaderboard</h2>
            </div>
            <UiIcons name="leaderboard" className="section-head-icon" />
          </div>

          <div className="leader-list">
            {leaderboard.length === 0 ? (
              <div
                style={{
                  color: "#8fa19e",
                  padding: "10px 0",
                  textAlign: "center",
                }}
              >
                No leaderboard data from server
              </div>
            ) : (
              leaderboard.map((player) => (
                <div
                  key={player.rank}
                  className={`leader-row ${
                    player.tier === "Legendary" ? "legendary" : ""
                  } ${player.tier === "Mythic" ? "mythic" : ""}`}
                >
                  <span className="rank">#{player.rank}</span>

                  <div className="leader-copy">
                    <strong>{player.name}</strong>
                    <small>{player.coins} coins</small>
                  </div>

                  <span className={`tier ${player.tier.toLowerCase()}`}>
                    {player.tier}
                  </span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </section>
  );
}
