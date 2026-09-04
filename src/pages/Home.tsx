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

type RedeemResult = { success: boolean; message: string };

type Props = {
  balanceCoins: number;
  streak: number;
  mining: MiningState;
  miningReady: boolean;
  miningAdBusy: boolean;
  onMining: () => void;
  onRedeemGiftCode: (code: string) => Promise<RedeemResult>;
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
  onRedeemGiftCode,
}: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderUser[]>([]);
  const [now, setNow] = useState(() => Date.now());

  const [giftCode, setGiftCode] = useState("");
  const [giftBusy, setGiftBusy] = useState(false);
  const [giftStatus, setGiftStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [giftMessage, setGiftMessage] = useState("");

  const handleRedeemGiftCode = async () => {
    const trimmed = giftCode.trim();
    if (!trimmed || giftBusy) return;

    setGiftBusy(true);
    setGiftMessage("");

    const result = await onRedeemGiftCode(trimmed);

    setGiftBusy(false);
    setGiftStatus(result.success ? "success" : "error");
    setGiftMessage(result.message);

    if (result.success) {
      setGiftCode("");
    }
  };

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

      <article className="mini-card gift-code-card">
        <div className="section-head compact">
          <div>
            <p>Redeem</p>
            <h2>Gift Code</h2>
          </div>
          <svg
            viewBox="0 0 24 24"
            className="section-head-icon"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <rect x="3" y="9" width="18" height="11" rx="1.5" />
            <path d="M3 13h18" />
            <path d="M12 9v11" />
            <path d="M12 9C9.5 9 8 7.6 8 6a2 2 0 0 1 4 0v3Z" />
            <path d="M12 9c2.5 0 4-1.4 4-3a2 2 0 0 0-4 0v3Z" />
          </svg>
        </div>

        <p className="gift-code-hint">
          Have a promo or gift code? Enter it below for bonus coins.
        </p>

        <div className="gift-code-input-row">
          <input
            className="gift-code-input"
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value)}
            placeholder="Enter your gift code"
            autoCapitalize="characters"
            disabled={giftBusy}
          />

          <button
            className="gift-code-open-btn"
            onClick={handleRedeemGiftCode}
            type="button"
            disabled={!giftCode.trim() || giftBusy}
          >
            {giftBusy ? "Redeeming..." : "Enter Gift Code"}
          </button>
        </div>

        {giftMessage ? (
          <p
            className="gift-code-message"
            style={{ color: giftStatus === "success" ? "#81c784" : "#ff8a80" }}
          >
            {giftMessage}
          </p>
        ) : null}
      </article>

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
