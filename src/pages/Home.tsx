import { useEffect, useMemo, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/home.css";

type Props = {
  onPlay: () => void;
  balanceCoins: number;
  energyCurrent: number;
  energyMax: number;
  streak: number;
  isStartingGame: boolean;
};

type ChestTier = "Common" | "Epic" | "Legendary" | "Mythic";

type Milestone = {
  days: number;
  chest: ChestTier;
};

type LeaderUser = {
  rank: number;
  name: string;
  coins: string;
  tier: string;
};

const DAILY_POINTS = 250;

const milestones: Milestone[] = [
  { days: 3, chest: "Common" },
  { days: 7, chest: "Epic" },
  { days: 14, chest: "Legendary" },
  { days: 50, chest: "Mythic" },
];

function getMsUntilNextUtcMidnight() {
  const now = new Date();
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  );
  return Math.max(0, nextMidnight - now.getTime());
}

function formatCountdown(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// مكون معزول بس للعداد الحي: التحديث كل ثانية يصير هنا بس،
// بدل ما يفرض إعادة رسم كامل صفحة Home (الليدربورد، milestones،
// الهيرو..) كل ثانية. نفس الشكل ونفس القيمة المعروضة تماماً.
function ResetCountdown() {
  const [countdown, setCountdown] = useState(() =>
    formatCountdown(getMsUntilNextUtcMidnight())
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCountdown(formatCountdown(getMsUntilNextUtcMidnight()));
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return <span className="checkin-countdown">Resets in {countdown}</span>;
}

export default function Home({
  onPlay,
  balanceCoins,
  energyCurrent,
  energyMax,
  streak,
  isStartingGame,
}: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderUser[]>([]);
  const [toast, setToast] = useState("");

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

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const currentChest = useMemo(() => {
    const unlocked = milestones.filter((item) => streak >= item.days);
    return unlocked[unlocked.length - 1] ?? null;
  }, [streak]);

  const nextMilestone = useMemo(() => {
    return milestones.find((item) => item.days > streak) ?? null;
  }, [streak]);

  const progressToNext = useMemo(() => {
    if (!nextMilestone) return 1;
    const prevDays =
      milestones.filter((item) => item.days < nextMilestone.days).at(-1)?.days ?? 0;
    const span = nextMilestone.days - prevDays;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, (streak - prevDays) / span));
  }, [streak, nextMilestone]);

  const handlePlayClick = () => {
    if (isStartingGame) return;
    if (energyCurrent <= 0) {
      setToast("Not enough energy. Wait for a refill ⚡");
      return;
    }
    onPlay();
  };

  return (
    <section className="home-page">
      {toast ? <div className="home-toast">{toast}</div> : null}

      <section className="home-hero">
        <div className="hero-decor" aria-hidden="true" />

        <span className="hero-badge">Premium Space Reward Game</span>
        <h1 className="hero-title">Laser Escape</h1>
        <p className="hero-desc">
          Dodge the grid, clear every wave, and cash in daily rewards — all in one seamless run.
        </p>

        <div className="hero-meta">
          <div className="hero-meta-item">
            <strong>5</strong>
            <span>Waves</span>
          </div>
          <div className="hero-meta-divider" />
          <div className="hero-meta-item">
            <strong>100</strong>
            <span>Per Wave</span>
          </div>
          <div className="hero-meta-divider" />
          <div className="hero-meta-item">
            <strong>{energyMax}</strong>
            <span>Energy</span>
          </div>
        </div>

        <button
          className="hero-play"
          onClick={handlePlayClick}
          disabled={energyCurrent <= 0 || isStartingGame}
        >
          {isStartingGame ? (
            <>
              <span className="hero-play-spinner" />
              <span className="hero-play-text">Loading...</span>
            </>
          ) : (
            <>
              <span className="hero-play-icon">
                <UiIcons name="play" className="hero-play-icon-svg" />
              </span>
              <span className="hero-play-text">Play Now</span>
            </>
          )}
        </button>
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
            <UiIcons name="energy" className="stats-bar-svg" />
          </span>
          <div className="stats-bar-text">
            <strong>{energyCurrent}/{energyMax}</strong>
            <small>Energy</small>
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
                className={`milestone ${achieved ? "achieved" : ""} ${active ? "active" : ""}`}
              >
                <strong>{item.days}</strong>
                <span>{item.chest}</span>
              </div>
            );
          })}
        </div>

        <div className="checkin-footer">
          <span className="checkin-next">
            Next: {nextMilestone ? `${nextMilestone.days} days` : "All rewards unlocked"}
          </span>
          <ResetCountdown />
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
              <div style={{ color: "#8fa19e", padding: "10px 0", textAlign: "center" }}>
                No leaderboard data from server
              </div>
            ) : (
              leaderboard.map((player) => (
                <div
                  key={player.rank}
                  className={`leader-row ${player.tier === "Legendary" ? "legendary" : ""} ${
                    player.tier === "Mythic" ? "mythic" : ""
                  }`}
                >
                  <span className="rank">#{player.rank}</span>
                  <div className="leader-copy">
                    <strong>{player.name}</strong>
                    <small>{player.coins} coins</small>
                  </div>
                  <span className={`tier ${player.tier.toLowerCase()}`}>{player.tier}</span>
                </div>
              ))
            )}
          </div>
        </article>
      </section>
    </section>
  );
}
