import { useEffect, useState } from "react";
import "../styles/tasks.css";

type Props = {
  onRewardCoins: (amount: number, title: string, meta: string) => void;
};

type StoredTasks = {
  channelJoined: boolean;
  channelClaimed: boolean;
  adsWatched: number;
};

const STORAGE_KEY = "sly.tasks.simple.v2";
const CHANNEL_URL = "https://t.me/SLYMint_Channel";
const CHANNEL_REWARD = 500;
const AD_REWARD = 150;
const AD_LIMIT = 30;

function loadState(): StoredTasks {
  if (typeof window === "undefined") {
    return { channelJoined: false, channelClaimed: false, adsWatched: 0 };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { channelJoined: false, channelClaimed: false, adsWatched: 0 };

    const parsed = JSON.parse(raw) as Partial<StoredTasks>;
    return {
      channelJoined: Boolean(parsed.channelJoined),
      channelClaimed: Boolean(parsed.channelClaimed),
      adsWatched: typeof parsed.adsWatched === "number" ? parsed.adsWatched : 0,
    };
  } catch {
    return { channelJoined: false, channelClaimed: false, adsWatched: 0 };
  }
}

function ChannelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="task-svg" aria-hidden="true">
      <path
        d="M12 3l8.5 4.9v8.2L12 21l-8.5-4.9V7.9L12 3z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.2 12.2l2.7 2.7 5-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AdIcon() {
  return (
    <svg viewBox="0 0 24 24" className="task-svg" aria-hidden="true">
      <rect
        x="3.5"
        y="5"
        width="17"
        height="14"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M8 9l5 3-5 3V9z" fill="currentColor" />
      <path d="M3.5 8.5h17" stroke="currentColor" strokeWidth="1.2" opacity=".55" />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="hero-svg" aria-hidden="true">
      <circle cx="9" cy="9" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="15" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M9 6.6v4.8M6.6 9h4.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Tasks({ onRewardCoins }: Props) {
  const [state, setState] = useState<StoredTasks>(() => loadState());
  const [toast, setToast] = useState("");
  const [watchingAd, setWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const reportRewardToServer = async (rewardAmount: number, taskType: string) => {
    try {
      const tg = window.Telegram?.WebApp;
      const initData = tg?.initData || "";

      await fetch("/api/tasks/complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `tga ${initData}`,
        },
        body: JSON.stringify({ reward: rewardAmount, taskType }),
      });
    } catch (err) {
      console.error("Failed to sync task reward with server", err);
    }
  };

  useEffect(() => {
    if (!watchingAd) return;

    setAdProgress(0);
    let progress = 0;

    const interval = window.setInterval(() => {
      progress += 10;
      setAdProgress(progress);

      if (progress >= 100) {
        window.clearInterval(interval);

        window.setTimeout(() => {
          setWatchingAd(false);
          setAdProgress(0);

          if (state.adsWatched < AD_LIMIT) {
            const nextCount = state.adsWatched + 1;

            setState((prev) => ({ ...prev, adsWatched: nextCount }));
            onRewardCoins(
              AD_REWARD,
              "Ad watched",
              `Watch ad ${nextCount}/${AD_LIMIT} +${AD_REWARD} coins`
            );
            reportRewardToServer(AD_REWARD, "watch_ad");
            setToast(`+${AD_REWARD} coins`);

            if (nextCount === AD_LIMIT) {
              setToast("Ad limit completed.");
            }
          }
        }, 250);
      }
    }, 120);

    return () => window.clearInterval(interval);
  }, [watchingAd, state.adsWatched, onRewardCoins]);

  const handleJoinChannel = () => {
    if (state.channelJoined) return;

    window.open(CHANNEL_URL, "_blank", "noopener,noreferrer");
    setState((prev) => ({ ...prev, channelJoined: true }));
    setToast("Channel opened.");
  };

  const handleClaimChannel = () => {
    if (!state.channelJoined || state.channelClaimed) return;

    setState((prev) => ({ ...prev, channelClaimed: true }));
    onRewardCoins(CHANNEL_REWARD, "Channel reward", `Joined official channel +${CHANNEL_REWARD} coins`);
    reportRewardToServer(CHANNEL_REWARD, "join_channel");
    setToast(`+${CHANNEL_REWARD} coins`);
  };

  const handleWatchAd = () => {
    if (watchingAd) return;
    if (state.adsWatched >= AD_LIMIT) return;
    setWatchingAd(true);
    setToast("Watching ad...");
  };

  return (
    <section className="tasks-page">
      {toast ? <div className="tasks-toast">{toast}</div> : null}

      <section className="tasks-hero">
        <div className="tasks-hero-icon">
          <CoinsIcon />
        </div>
        <div className="tasks-hero-text">
          <h1>Earn Coins</h1>
          <p>Complete simple tasks to earn coins</p>
        </div>
      </section>

      <section className="task-strip">
        <article className={`task-row ${state.channelClaimed ? "done" : ""}`}>
          <div className="task-icon channel">
            <ChannelIcon />
          </div>

          <div className="task-main">
            <div className="task-topline">
              <div>
                <p className="task-type">One time</p>
                <h2>Join channel</h2>
              </div>
              <strong className="task-reward">+{CHANNEL_REWARD}</strong>
            </div>

            <div className="task-mini-status">
              <span className={state.channelClaimed ? "green" : state.channelJoined ? "blue" : "gray"}>
                {state.channelClaimed ? "Claimed" : state.channelJoined ? "Ready to claim" : "Not joined"}
              </span>
            </div>
          </div>

          <div className="task-actions">
            <button
              type="button"
              className="task-btn join"
              onClick={handleJoinChannel}
              disabled={state.channelJoined}
            >
              {state.channelJoined ? "Joined" : "Join"}
            </button>

            <button
              type="button"
              className="task-btn claim"
              onClick={handleClaimChannel}
              disabled={!state.channelJoined || state.channelClaimed}
            >
              {state.channelClaimed ? "Claimed" : "Claim"}
            </button>
          </div>
        </article>

        <article className={`task-row ${state.adsWatched >= AD_LIMIT ? "done" : ""}`}>
          <div className="task-icon ad">
            <AdIcon />
          </div>

          <div className="task-main">
            <div className="task-topline">
              <div>
                <p className="task-type">Repeatable</p>
                <h2>Watch ad</h2>
              </div>
              <strong className="task-reward">+{AD_REWARD}</strong>
            </div>

            <div className="task-progress">
              <div className="task-progress-bar">
                <span style={{ width: `${(state.adsWatched / AD_LIMIT) * 100}%` }} />
              </div>
              <small>{state.adsWatched} / {AD_LIMIT}</small>
            </div>
          </div>

          <div className="task-actions">
            <button
              type="button"
              className="task-btn watch"
              onClick={handleWatchAd}
              disabled={watchingAd || state.adsWatched >= AD_LIMIT}
            >
              {state.adsWatched >= AD_LIMIT ? "Done" : watchingAd ? "Watching..." : "Watch"}
            </button>
          </div>
        </article>
      </section>
    </section>
  );
}
