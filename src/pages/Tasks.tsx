import { useEffect, useRef, useState } from "react";
import "../styles/tasks.css";

type Props = {
  onRewardCoins: (amount: number, title: string, meta: string) => void;
};

type ServerTask = {
  id: string | number;
  title: string;
  reward: number;
  url: string;
  is_active: boolean;
  task_type?: string;
  max_completions?: number;
};

type TaskProgress = {
  completed: number;
  max_completions: number;
};

type ProgressMap = Record<string, TaskProgress>;
type OpenedMap = Record<string, number>;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "adsgram-task": any;
    }
  }
}

const ADSGRAM_TASK_BLOCK_ID = "task-42083";
const ADSGRAM_SDK_SRC = "https://sad.adsgram.ai/js/sad.min.js";
const PROGRESS_KEY = "sly.tasks.progress.v3";
const OPENED_KEY = "sly.tasks.opened.v3";
const CLAIM_DELAY_MS = 3000;

function loadProgress(): ProgressMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, Partial<TaskProgress>>;
    const out: ProgressMap = {};

    for (const [key, value] of Object.entries(parsed)) {
      const completed = Number(value?.completed || 0);
      const max = Number(value?.max_completions || 1);

      out[key] = {
        completed: Number.isFinite(completed) && completed >= 0 ? completed : 0,
        max_completions: Number.isFinite(max) && max > 0 ? max : 1,
      };
    }

    return out;
  } catch {
    return {};
  }
}

function loadOpenedMap(): OpenedMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(OPENED_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, number>;
    const out: OpenedMap = {};

    for (const [key, value] of Object.entries(parsed)) {
      const ts = Number(value);
      if (Number.isFinite(ts) && ts > 0) {
        out[key] = ts;
      }
    }

    return out;
  } catch {
    return {};
  }
}

function getInitData() {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initData || "";
}

function isWatchAdTask(task: ServerTask) {
  return String(task.task_type || "").toLowerCase() === "watch_ad";
}

function TaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="task-svg" aria-hidden="true">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 12h8M8 8h4M8 16h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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

type AdsgramTaskWidgetProps = {
  ready: boolean;
  onOpenSession: () => void;
  onReward: (detail?: string) => void;
  onError: (message: string) => void;
};

function AdsgramTaskWidget({
  ready,
  onOpenSession,
  onReward,
  onError,
}: AdsgramTaskWidgetProps) {
  const elRef = useRef<HTMLElement | null>(null);
  const openedRef = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (openedRef.current) return;
    openedRef.current = true;
    onOpenSession();
  }, [ready, onOpenSession]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const handleReward = (event: any) => {
      onReward(event?.detail);
    };

    const handleError = (event: any) => {
      onError(event?.detail?.description || "Ad error");
    };

    const handleBannerNotFound = () => {
      onError("No ad available right now.");
    };

    el.addEventListener("reward", handleReward);
    el.addEventListener("onError", handleError);
    el.addEventListener("onBannerNotFound", handleBannerNotFound);

    return () => {
      el.removeEventListener("reward", handleReward);
      el.removeEventListener("onError", handleError);
      el.removeEventListener("onBannerNotFound", handleBannerNotFound);
    };
  }, [onReward, onError]);

  if (!ready) {
    return (
      <div className="task-btn join" style={{ opacity: 0.6 }}>
        Loading...
      </div>
    );
  }

  return (
    <adsgram-task
      ref={elRef}
      data-block-id={ADSGRAM_TASK_BLOCK_ID}
      data-debug="false"
      data-debug-console="false"
      className="task-btn join adsgram-task-widget"
    ></adsgram-task>
  );
}

export default function Tasks({ onRewardCoins }: Props) {
  const [toast, setToast] = useState("");
  const [serverTasks, setServerTasks] = useState<ServerTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [adsgramReady, setAdsgramReady] = useState(false);
  const [progressById, setProgressById] = useState<ProgressMap>(() => loadProgress());
  const [openedAtById, setOpenedAtById] = useState<OpenedMap>(() => loadOpenedMap());
  const [openingIds, setOpeningIds] = useState<Record<string, boolean>>({});
  const [claimingIds, setClaimingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;

    const existingScript = document.querySelector(
      `script[src="${ADSGRAM_SDK_SRC}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => setAdsgramReady(true), { once: true });
      if ((existingScript as any).dataset.loaded === "true") {
        setAdsgramReady(true);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = ADSGRAM_SDK_SRC;
    script.async = true;

    script.onload = () => {
      script.dataset.loaded = "true";
      setAdsgramReady(true);
    };

    script.onerror = () => {
      setAdsgramReady(false);
      setToast("Failed to load AdsGram.");
    };

    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressById));
    } catch {}
  }, [progressById]);

  useEffect(() => {
    try {
      window.localStorage.setItem(OPENED_KEY, JSON.stringify(openedAtById));
    } catch {}
  }, [openedAtById]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    fetch("/api/tasks/list")
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.tasks)) {
          setServerTasks(data.tasks);
        } else {
          setServerTasks([]);
        }
      })
      .catch(() => setServerTasks([]))
      .finally(() => setLoadingTasks(false));
  }, []);

  const postTaskAction = async (body: Record<string, unknown>) => {
    const initData = getInitData();

    const res = await fetch("/api/tasks/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `tga ${initData}`,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.error || "Failed to process task");
    }

    return data;
  };

  const openWatchAdSession = async (task: ServerTask) => {
    const id = String(task.id);

    try {
      await postTaskAction({
        taskId: task.id,
        action: "open",
      });

      setOpenedAtById((prev) => ({
        ...prev,
        [id]: Date.now(),
      }));
    } catch (err: any) {
      setToast(err?.message || "Failed to start ad session.");
    }
  };

  const handleAdsgramTaskReward = (task: ServerTask, rewardDetail?: string) => {
    const id = String(task.id);

    if (rewardDetail) {
      console.log("AdsGram reward detail:", rewardDetail);
    }

    const progress = progressById[id] || {
      completed: 0,
      max_completions: Math.max(1, Number(task.max_completions || 1)),
    };

    const nextCompleted = Math.min(progress.completed + 1, progress.max_completions);

    setProgressById((prev) => ({
      ...prev,
      [id]: {
        completed: nextCompleted,
        max_completions: progress.max_completions,
      },
    }));

    setToast("Reward sent. Coins will be added automatically.");
  };

  const handleOpenTask = async (task: ServerTask) => {
    const id = String(task.id);

    if (openingIds[id]) return;

    const progress = progressById[id] || {
      completed: 0,
      max_completions: Math.max(1, Number(task.max_completions || 1)),
    };

    if (progress.completed >= progress.max_completions) {
      setToast("Task limit reached.");
      return;
    }

    setOpeningIds((prev) => ({ ...prev, [id]: true }));

    try {
      const url = String(task.url || "").trim();

      if (!url) {
        setToast("Task has no URL.");
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");

      setOpenedAtById((prev) => ({
        ...prev,
        [id]: Date.now(),
      }));

      setToast("Opened. Wait 3 seconds.");
    } catch (err: any) {
      setToast(err?.message || "Failed to open task.");
    } finally {
      setOpeningIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  const handleClaimServerTask = async (task: ServerTask) => {
    if (isWatchAdTask(task)) {
      return;
    }

    const id = String(task.id);

    if (claimingIds[id]) return;

    const openedAt = openedAtById[id];

    if (!openedAt) {
      setToast("Open the task link first.");
      return;
    }

    if (Date.now() - openedAt < CLAIM_DELAY_MS) {
      setToast("Wait 3 seconds after opening.");
      return;
    }

    const current = progressById[id] || {
      completed: 0,
      max_completions: Math.max(1, Number(task.max_completions || 1)),
    };

    if (current.completed >= current.max_completions) {
      return;
    }

    setClaimingIds((prev) => ({ ...prev, [id]: true }));

    try {
      const data = await postTaskAction({ taskId: task.id });

      const nextCompleted = Number(data.progress?.completed ?? current.completed + 1);
      const nextMax = Number(data.progress?.max_completions ?? current.max_completions);
      const reward = Number(data.reward ?? task.reward ?? 0);

      setProgressById((prev) => ({
        ...prev,
        [id]: {
          completed: nextCompleted,
          max_completions: nextMax,
        },
      }));

      setOpenedAtById((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });

      onRewardCoins(reward, task.title, `Task ${nextCompleted}/${nextMax} +${reward} coins`);
      setToast(`+${reward} coins`);
    } catch (err: any) {
      setToast(err?.message || "Failed to claim reward");
    } finally {
      setClaimingIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
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
          <p>Complete tasks to earn coins</p>
        </div>
      </section>

      <section className="task-strip">
        {loadingTasks ? (
          <div className="task-empty">Loading tasks...</div>
        ) : serverTasks.length === 0 ? (
          <div className="task-empty">No tasks available right now.</div>
        ) : (
          serverTasks.map((task) => {
            const id = String(task.id);
            const isWatchAd = isWatchAdTask(task);

            const progress = progressById[id] || {
              completed: 0,
              max_completions: Math.max(1, Number(task.max_completions || 1)),
            };

            const openedAt = openedAtById[id];
            const opened = Boolean(openedAt);
            const waitedEnough = opened && Date.now() - openedAt >= CLAIM_DELAY_MS;
            const claimedAll = progress.completed >= progress.max_completions;
            const opening = Boolean(openingIds[id]);
            const claiming = Boolean(claimingIds[id]);

            return (
              <article key={id} className={`task-row ${claimedAll ? "done" : ""}`}>
                <div className="task-icon channel">
                  <TaskIcon />
                </div>

                <div className="task-main">
                  <div className="task-topline">
                    <div>
                      <p className="task-type">{task.task_type || "task"}</p>
                      <h2>{task.title}</h2>
                    </div>
                    <strong className="task-reward">+{Number(task.reward || 0)}</strong>
                  </div>

                  <div className="task-mini-status">
                    {isWatchAd ? (
                      claimedAll ? (
                        <span className="green">Completed</span>
                      ) : opened ? (
                        <span className="green">Reward automatic</span>
                      ) : (
                        <span className="gray">Watch ad to earn</span>
                      )
                    ) : claimedAll ? (
                      <span className="green">Completed</span>
                    ) : !opened ? (
                      <span className="gray">Open link first</span>
                    ) : !waitedEnough ? (
                      <span className="blue">Wait 3 seconds</span>
                    ) : (
                      <span className="green">
                        Ready {progress.completed}/{progress.max_completions}
                      </span>
                    )}
                  </div>
                </div>

                <div className="task-actions">
                  {isWatchAd ? (
                    claimedAll ? (
                      <div className="task-btn join" style={{ opacity: 0.6 }}>
                        Completed
                      </div>
                    ) : (
                      <AdsgramTaskWidget
                        ready={adsgramReady}
                        onOpenSession={() => openWatchAdSession(task)}
                        onReward={(detail) => handleAdsgramTaskReward(task, detail)}
                        onError={(message) => setToast(message)}
                      />
                    )
                  ) : (
                    <button
                      type="button"
                      className="task-btn join"
                      onClick={() => handleOpenTask(task)}
                      disabled={opening || claimedAll}
                    >
                      {opening ? "Opening..." : "Open"}
                    </button>
                  )}

                  {!isWatchAd ? (
                    <button
                      type="button"
                      className="task-btn claim"
                      onClick={() => handleClaimServerTask(task)}
                      disabled={claiming || claimedAll || !opened || !waitedEnough}
                    >
                      {claiming ? "Claiming..." : claimedAll ? "Claimed" : "Claim"}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}
