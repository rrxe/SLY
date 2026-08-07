import { useEffect, useMemo, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/home.css";

type Props = {
  onPlay: () => void;
  balanceCoins: number;
  onClaimCoins: (amount: number) => void;
};

type ChestTier = "Common" | "Epic" | "Legendary" | "Mythic";

type Milestone = {
  days: number;
  chest: ChestTier;
};

type StoredCheckin = {
  streak: number;
  lastClaimed: string | null;
};

const STORAGE_KEY = "sly.checkin.v5";
const DAILY_POINTS = 250;

const milestones: Milestone[] = [
  { days: 3, chest: "Common" },
  { days: 7, chest: "Epic" },
  { days: 14, chest: "Legendary" },
  { days: 50, chest: "Mythic" },
];

const leaderboard = [
  { rank: 1, name: "Nova", coins: "48,120", tier: "Mythic" },
  { rank: 2, name: "Helix", coins: "44,870", tier: "Legendary" },
  { rank: 3, name: "Orion", coins: "41,200", tier: "Normal" },
  { rank: 4, name: "Vanta", coins: "39,560", tier: "Normal" },
] as const;

function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

function loadCheckin(): StoredCheckin {
  if (typeof window === "undefined") {
    return { streak: 0, lastClaimed: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { streak: 0, lastClaimed: null };

    const parsed = JSON.parse(raw) as Partial<StoredCheckin>;
    return {
      streak: typeof parsed.streak === "number" ? parsed.streak : 0,
      lastClaimed:
        typeof parsed.lastClaimed === "string" ? parsed.lastClaimed : null,
    };
  } catch {
    return { streak: 0, lastClaimed: null };
  }
}

export default function Home({ onPlay, balanceCoins, onClaimCoins }: Props) {
  const [checkin, setCheckin] = useState<StoredCheckin>(() => loadCheckin());
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checkin));
    } catch {
      // ignore
    }
  }, [checkin]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const today = dateKey();
  const yesterday = shiftDays(-1);
  const claimedToday = checkin.lastClaimed === today;

  const currentChest = useMemo(() => {
    const unlocked = milestones.filter((item) => checkin.streak >= item.days);
    return unlocked[unlocked.length - 1] ?? null;
  }, [checkin.streak]);

  const nextMilestone = useMemo(() => {
    return milestones.find((item) => item.days > checkin.streak) ?? null;
  }, [checkin.streak]);

  const progressToNext = useMemo(() => {
    if (!nextMilestone) return 1;
    const prevDays =
      milestones.filter((item) => item.days < nextMilestone.days).at(-1)?.days ?? 0;
    const span = nextMilestone.days - prevDays;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, (checkin.streak - prevDays) / span));
  }, [checkin.streak, nextMilestone]);

  const handleClaim = () => {
    if (claimedToday) {
      setToast("Already claimed today.");
      return;
    }

    const nextStreak = checkin.lastClaimed === yesterday ? checkin.streak + 1 : 1;

    onClaimCoins(DAILY_POINTS);
    setCheckin({
      streak: nextStreak,
      lastClaimed: today,
    });

    setToast(
      nextStreak === 3
        ? "Common Chest unlocked."
        : nextStreak === 7
          ? "Epic Chest unlocked."
          : nextStreak === 14
            ? "Legendary Chest unlocked."
            : nextStreak === 50
              ? "Mythic Chest unlocked."
              : `+${DAILY_POINTS} points claimed.`
    );
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
            <span>5 Energy</span>
          </div>

          <button className="home-play" onClick={onPlay}>
            <UiIcons name="play" className="home-play-icon" />
            <span>PLAY</span>
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
          <strong>5 / 5</strong>
          <small>Run capacity</small>
        </article>

        <article className="stat-card">
          <div className="stat-label">
            <span className="dot" />
            <span>Streak</span>
          </div>
          <strong>{checkin.streak}d</strong>
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
              <strong>{checkin.streak}d</strong>
            </div>
            <div className="checkin-badge">{claimedToday ? "Claimed" : "Ready"}</div>
          </div>
        </div>

        <div className="progress-bar">
          <span style={{ width: `${progressToNext * 100}%` }} />
        </div>

        <div className="milestones">
          {milestones.map((item) => {
            const achieved = checkin.streak >= item.days;
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

          <button className="checkin-button" onClick={handleClaim} disabled={claimedToday}>
            {claimedToday ? "Claimed Today" : "Claim"}
          </button>
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
            {leaderboard.map((player) => (
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
            ))}
          </div>
        </article>

        <article className="mini-card">
          <div className="section-head compact">
            <div>
              <p>Quick Reward</p>
              <h2>Streak ladder</h2>
            </div>
            <div className="chest-orb" />
          </div>

          <div className="odds-list">
            {milestones.map((item) => {
              const achieved = checkin.streak >= item.days;
              return (
                <div key={item.days} className={`odds-row ${achieved ? "done" : ""}`}>
                  <span>{item.days} days</span>
                  <strong>{item.chest}</strong>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </section>
  );
}
