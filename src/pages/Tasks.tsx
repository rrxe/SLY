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

type ServerTask = {
  id: string | number;
  title: string;
  reward: number;
  url: string;
  is_active: boolean;
};

const STORAGE_KEY = "sly.tasks.simple.v2";
const CLAIMED_TASKS_KEY = "sly.tasks.claimed.v1";
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

function loadClaimedServerTasks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CLAIMED_TASKS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function getInitData() {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initData || "";
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

  const [serverTasks, setServerTasks] = useState<ServerTask[]>([]);
  const [claimedIds, setClaimedIds] = useState<string[]>(() => loadClaimedServerTasks());
  const [openedIds, setOpenedIds] = useState<string[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  useEffect(() => {
    try {
      window.localStorage.setItem(CLAIMED_TASKS_KEY, JSON.stringify(claimedIds));
    } catch {}
  }, [claimedIds]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    fetch("/api/tasks/list")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.tasks)) {
          setServerTasks(data.tasks);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingTasks(false));
  }, []);

  const reportRewardToServer = async (body: Record<string, unknown>) => {
    const initData = getInitData();
    const res = await fetch("/api/tasks/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `tga ${initData}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to claim reward");
    }
    return data as { success: true; coins: number; reward: number };
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

        window.setTimeout(async () => {
          setWatchingAd(false);
          setAdProgress(0);

          if (state.adsWatched < AD_LIMIT) {
            try {
              await reportRewardToServer({ taskType: "watch_ad" });

              const nextCount = state.adsWatched + 1;
              setState((prev) => ({ ...prev, adsWatched: nextCount }));
              onRewardCoins(
                AD_REWARD,
                "Ad watched",
                `Watch ad ${nextCount}/${AD_LIMIT} +${AD_REWARD} coins`
              );
              setToast(`+${AD_REWARD} coins`);

              if (nextCount === AD_LIMIT) {
                setToast("Ad limit completed.");
              }
            } catch (err: any) {
              setToast(err.message || "Failed to claim reward");
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

  const handleClaimChannel = async () => {
    if (!state.channelJoined || state.channelClaimed) return;

    try {
      await reportRewardToServer({ taskType: "join_channel" });
      setState((prev) => ({ ...prev, channelClaimed: true }));
      onRewardCoins(CHANNEL_REWARD, "Channel reward", `Joined official channel +${CHANNEL_REWARD} coins`);
      setToast(`+${CHANNEL_REWARD} coins`);
    } catch (err: any) {
      setToast(err.message || "Failed to claim reward");
    }
  };

  const handleWatchAd = () => {
    if (watchingAd) return;
    if (state.adsWatched >= AD_LIMIT) return;
    setWatchingAd(true);
    setToast("Watching ad...");
  };

  const handleOpenServerTask = (task: ServerTask) => {
    window.open(task.url, "_blank", "noopener,noreferrer");
    setOpenedIds((prev) => (prev.includes(String(task.id)) ? prev : [...prev, String(task.id)]));
  };

  const handleClaimServerTask = async (task: ServerTask) => {
    const id = String(task.id);
    if (claimedIds.includes(id)) return;

    try {
      const data = await reportRewardToServer({ taskId: task.id });
      setClaimedIds((prev) => [...prev, id]);
      onRewardCoins(data.reward ?? task.reward, task.title, `+${data.reward ?? task.reward} coins`);
      setToast(`+${data.reward ?? task.reward} coins`);
    } catch (err: any) {
      setToast(err.message || "Failed to claim reward");
    }
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

        {!loadingTasks &&
          serverTasks.map((task) => {
            const id = String(task.id);
            const claimed = claimedIds.includes(id);
            const opened = openedIds.includes(id);

            return (
              <article key={id} className={`task-row ${claimed ? "done" : ""}`}>
                <div className="task-icon channel">
                  <ChannelIcon />
                </div>

                <div className="task-main">
                  <div className="task-topline">
                    <div>
                      <p className="task-type">Special</p>
                      <h2>{task.title}</h2>
                    </div>
                    <strong className="task-reward">+{task.reward}</strong>
                  </div>

                  <div className="task-mini-status">
                    <span className={claimed ? "green" : opened ? "blue" : "gray"}>
                      {claimed ? "Claimed" : opened ? "Ready to claim" : "Not started"}
                    </span>
                  </div>
                </div>

                <div className="task-actions">
                  <button
                    type="button"
                    className="task-btn join"
                    onClick={() => handleOpenServerTask(task)}
                    disabled={opened}
                  >
                    {opened ? "Opened" : "Open"}
                  </button>

                  <button
                    type="button"
                    className="task-btn claim"
                    onClick={() => handleClaimServerTask(task)}
                    disabled={!opened || claimed}
                  >
                    {claimed ? "Claimed" : "Claim"}
                  </button>
                </div>
              </article>
            );
          })}
      </section>
    </section>
  );
}
