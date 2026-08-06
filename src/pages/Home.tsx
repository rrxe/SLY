import { useEffect, useMemo, useState } from "react";
import Ship from "../components/Ship";
import UiIcons from "../components/UiIcons";
import "../styles/home.css";

type Props = {
  onPlay: () => void;
};

type ChestTier = "Common" | "Epic" | "Legendary" | "Mythic";

type Milestone = {
  days: number;
  chest: ChestTier;
  title: string;
  desc: string;
};

type StoredCheckin = {
  streak: number;
  points: number;
  lastClaimed: string | null;
  history: string[];
};

type LeaderboardRow = {
  rank: number;
  name: string;
  coins: string;
  tier: "Normal" | "Legendary" | "Mythic";
};

const STORAGE_KEY = "sly.checkin.v2";
const DAILY_POINTS = 250;

const milestones: Milestone[] = [
  {
    days: 3,
    chest: "Common",
    title: "Common Chest",
    desc: "Simple daily momentum reward.",
  },
  {
    days: 7,
    chest: "Epic",
    title: "Epic Chest",
    desc: "Stronger reward pool with better odds.",
  },
  {
    days: 14,
    chest: "Legendary",
    title: "Legendary Chest",
    desc: "Rare-tier reward bundle.",
  },
  {
    days: 50,
    chest: "Mythic",
    title: "Mythic Chest",
    desc: "Top-end streak reward.",
  },
];

const chestOdds: Record<
  ChestTier,
  { label: string; value: number }[]
> = {
  Common: [
    { label: "Common", value: 92 },
    { label: "Rare", value: 8 },
    { label: "Epic", value: 0 },
    { label: "Legendary", value: 0 },
    { label: "Mythic", value: 0 },
  ],
  Epic: [
    { label: "Common", value: 72 },
    { label: "Rare", value: 20 },
    { label: "Epic", value: 8 },
    { label: "Legendary", value: 0 },
    { label: "Mythic", value: 0 },
  ],
  Legendary: [
    { label: "Common", value: 52 },
    { label: "Rare", value: 25 },
    { label: "Epic", value: 15 },
    { label: "Legendary", value: 8 },
    { label: "Mythic", value: 0 },
  ],
  Mythic: [
    { label: "Common", value: 35 },
    { label: "Rare", value: 25 },
    { label: "Epic", value: 20 },
    { label: "Legendary", value: 12 },
    { label: "Mythic", value: 8 },
  ],
};

const leaderboard: LeaderboardRow[] = [
  { rank: 1, name: "Nova", coins: "48,120", tier: "Mythic" },
  { rank: 2, name: "Helix", coins: "44,870", tier: "Legendary" },
  { rank: 3, name: "Orion", coins: "41,200", tier: "Normal" },
  { rank: 4, name: "Vanta", coins: "39,560", tier: "Normal" },
  { rank: 5, name: "Drift", coins: "36,140", tier: "Legendary" },
];

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
    return { streak: 0, points: 12480, lastClaimed: null, history: [] };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { streak: 0, points: 12480, lastClaimed: null, history: [] };
    }

    const parsed = JSON.parse(raw) as Partial<StoredCheckin>;
    return {
      streak: typeof parsed.streak === "number" ? parsed.streak : 0,
      points: typeof parsed.points === "number" ? parsed.points : 12480,
      lastClaimed:
        typeof parsed.lastClaimed === "string" ? parsed.lastClaimed : null,
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch {
    return { streak: 0, points: 12480, lastClaimed: null, history: [] };
  }
}

export default function Home({ onPlay }: Props) {
  const [checkin, setCheckin] = useState<StoredCheckin>(() => loadCheckin());
  const [toast, setToast] = useState<string>("");

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(checkin));
    } catch {
      // ignore storage failures
    }
  }, [checkin]);

  useEffect(() => {
    if (!toast) return;

    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const today = dateKey();
  const yesterday = shiftDays(-1);
  const claimedToday = checkin.lastClaimed === today;

  const currentChest = useMemo(() => {
    const unlocked = milestones
      .filter((item) => checkin.streak >= item.days)
      .sort((a, b) => a.days - b.days);

    return unlocked[unlocked.length - 1] ?? null;
  }, [checkin.streak]);

  const nextMilestone = useMemo(() => {
    return milestones.find((item) => item.days > checkin.streak) ?? null;
  }, [checkin.streak]);

  const progressToNext = useMemo(() => {
    if (!nextMilestone) return 1;
    const prevDays =
      milestones
        .filter((item) => item.days < nextMilestone.days)
        .sort((a, b) => b.days - a.days)[0]?.days ?? 0;

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
    const unlockedMilestone = milestones.find((item) => item.days === nextStreak);

    const nextState: StoredCheckin = {
      streak: nextStreak,
      points: checkin.points + DAILY_POINTS,
      lastClaimed: today,
      history: [today, ...checkin.history].slice(0, 10),
    };

    setCheckin(nextState);

    if (unlockedMilestone) {
      setToast(`${unlockedMilestone.title} unlocked.`);
    } else {
      setToast(`+${DAILY_POINTS} points claimed.`);
    }
  };

  return (
    <section className="home-page">
      {toast ? <div className="home-toast">{toast}</div> : null}

      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="home-kicker">PREMIUM SPACE REWARD GAME</p>
          <h1>Laser Escape</h1>
          <p className="home-lead">
            A smooth space lobby with daily check-in streaks, elite rewards, and
            a full-screen run when you hit Play.
          </p>

          <div className="home-mini-row">
            <span className="mini-pill">5 Waves</span>
            <span className="mini-pill">150 / Wave</span>
            <span className="mini-pill">Full Screen Play</span>
          </div>
        </div>

        <div className="home-hero-visual">
          <div className="ship-stage">
            <Ship />
          </div>

          <button className="home-play" onClick={onPlay}>
            <UiIcons name="play" className="home-play-icon" />
            <span>PLAY</span>
          </button>
        </div>
      </section>

      <section className="home-metrics">
        <article className="metric-card coins">
          <div className="metric-top">
            <UiIcons name="coins" className="metric-icon" />
            <span>Coins</span>
          </div>
          <strong>{checkin.points.toLocaleString()}</strong>
          <small>Reward balance</small>
        </article>

        <article className="metric-card energy">
          <div className="metric-top">
            <UiIcons name="energy" className="metric-icon" />
            <span>Energy</span>
          </div>
          <strong>5 / 5</strong>
          <small>Run capacity</small>
        </article>

        <article className="metric-card streak">
          <div className="metric-top">
            <span className="metric-dot" />
            <span>Daily Streak</span>
          </div>
          <strong>{checkin.streak} days</strong>
          <small>
            {currentChest
              ? `${currentChest.title} unlocked`
              : "Build your streak for bigger chests"}
          </small>
        </article>
      </section>

      <section className="checkin-card">
        <div className="section-head">
          <div>
            <p>Daily Check-in</p>
            <h2>
              +{DAILY_POINTS} points today
            </h2>
          </div>

          <div className="checkin-badge">
            {claimedToday ? "Claimed" : "Ready"}
          </div>
        </div>

        <div className="checkin-progress">
          <div className="checkin-progress-bar">
            <span style={{ width: `${progressToNext * 100}%` }} />
          </div>

          <div className="checkin-track">
            {milestones.map((item) => {
              const achieved = checkin.streak >= item.days;
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
        </div>

        <div className="checkin-footer">
          <div className="checkin-copy">
            <span>
              Next chest:{" "}
              {nextMilestone ? `${nextMilestone.days} days` : "All rewards unlocked"}
            </span>
            <p>
              Claim daily, keep the streak alive, and unlock stronger chests at
              3, 7, 14, and 50 days.
            </p>
          </div>

          <button className="checkin-button" onClick={handleClaim} disabled={claimedToday}>
            {claimedToday ? "Claimed Today" : "Claim Reward"}
          </button>
        </div>
      </section>

      <section className="home-grid">
        <article className="leader-card">
          <div className="section-head compact">
            <div>
              <p>Top 50</p>
              <h2>Leaderboard Preview</h2>
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
                <div className="leader-rank">#{player.rank}</div>
                <div className="leader-info">
                  <strong>{player.name}</strong>
                  <span>{player.coins} coins</span>
                </div>
                <div className={`leader-tag ${player.tier.toLowerCase()}`}>
                  {player.tier}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="chest-card">
          <div className="section-head compact">
            <div>
              <p>Chest Ladder</p>
              <h2>Reward Pool Odds</h2>
            </div>
            <div className="chest-orb" />
          </div>

          <div className="odds-grid">
            {(
              (currentChest ? chestOdds[currentChest.chest] : chestOdds.Common) as {
                label: string;
                value: number;
              }[]
            ).map((item) => (
              <div key={item.label} className="odds-row">
                <span>{item.label}</span>
                <strong>{item.value}%</strong>
              </div>
            ))}
          </div>

          <div className="chest-note">
            <p>
              Common chests keep higher tiers extremely rare. Epic improves the
              pool slightly. Legendary and Mythic unlock the strongest chances.
            </p>
          </div>
        </article>
      </section>

      <section className="home-footer">
        <div className="footer-card">
          <span>Mission</span>
          <strong>5 waves · 750 coins max</strong>
          <small>Survive the run, keep your energy, and grow your streak.</small>
        </div>

        <div className="footer-card">
          <span>Profile</span>
          <strong>Exchange & withdraw</strong>
          <small>Coins convert later into USDT from the profile tab.</small>
        </div>
      </section>
    </section>
  );
}
