import { useEffect, useMemo, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/home.css";

type Props = {
  onPlay: () => void;
  balanceCoins: number;
  energyCurrent: number;
  energyMax: number;
  // الستريك يجي جاهز من App.tsx بعد ما يسوي check-in تلقائي عند فتح
  // التطبيق (ما عاد في زر Claim يدوي بهذي الصفحة)
  streak: number;
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

export default function Home({
  onPlay,
  balanceCoins,
  energyCurrent,
  energyMax,
  streak,
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
        <div className="hero-copy">
          <p className="home-kicker">PREMIUM SPACE REWARD GAME</p>
          <h1>Laser Escape</h1>
          <p className="home-lead">
            Dodge the grid, clear every 
wave, and cash in daily 
rewards-all in one 
seamless run.
          </p>

          <div className="hero-chips">
            <span>5 Waves</span>
            <span>150 / Wave</span>
            <span>{energyMax} Energy</span>
          </div>

          <button
            className="home-play"
            onClick={handlePlayClick}
            disabled={energyCurrent <= 0}
          >
            <span className="home-play-icon-wrap">
              <UiIcons name="play" className="home-play-icon" />
            </span>
            <span className="home-play-label">PLAY</span>
          </button>
        </div>

        <div className="hero-orb-wrap">
          <div className="hero-orb" />
        </div>
      </section>

      <section className="home-stats">
        <article className="stat-card">
          <div className="stat-label">
            <UiIcons name="coins" className="stat-icon gold" />
            <span>Coins</span>
          </div>
          <strong>{balanceCoins.toLocaleString()}</strong>
          <small>Reward balance</small>
        </article>

        <article className="stat-card">
          <div className="stat-label">
            <UiIcons name="energy" className="stat-icon blue" />
            <span>Energy</span>
          </div>
          <strong>{energyCurrent} / {energyMax}</strong>
          <small>Run capacity</small>
        </article>

        <article className="stat-card">
          <div className="stat-label">
            <span className="dot" />
            <span>Streak</span>
          </div>
          <strong>{streak}d</strong>
          <small>
            {currentChest ? `${currentChest.chest} chest unlocked` : "Build your streak"}
          </small>
        </article>
      </section>

      <section className="checkin-card">
        <div className="section-head">
          <div>
            <p>Daily Check-in</p>
            <h2>+{DAILY_POINTS} points today</h2>
          </div>

          <div className="checkin-right">
            <div className="checkin-streak">
              <span className="dot" />
              <strong>{streak}d</strong>
            </div>
            <div className="checkin-badge">Checked in</div>
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

        <div className="checkin-bottom">
          <div className="checkin-text">
            <span>
              Next: {nextMilestone ? `${nextMilestone.days} days` : "All rewards unlocked"}
            </span>
            <p>
              {currentChest
                ? `${currentChest.chest} chest unlocked. Keep the streak alive.`
                : "Keep the streak alive for stronger chests."}
            </p>
          </div>
        </div>
      </section>

      <section className="home-grid">
        <article className="mini-card">
          <div className="section-head compact">
            <div>
              <p>Top 50</p>
              <h2>Leaderboard</h2>
            </div>
            <UiIcons name="leaderboard" className="section-head-icon" />
          </div>

          <div className="leader-list">
            {leaderboard.length === 0 ? (
              <div style={{ color: "#8c98b5", padding: "10px 0", textAlign: "center" }}>
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
