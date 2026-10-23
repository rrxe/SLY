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

const PROGRESS_KEY = "sly.tasks.progress.v3";
const CLAIM_DELAY_MS = 5000;
const SMART_AD_CLAIM_DELAY_MS = 5000;

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

function getInitData() {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initData || "";
}

function isWatchAdTask(task: ServerTask) {
  return String(task.task_type || "").toLowerCase() === "watch_ad";
}

function isSmartAdTask(task: ServerTask) {
  return String(task.task_type || "").toLowerCase() === "smart_ad";
}

function getClaimDelayMs(task: ServerTask) {
  return isSmartAdTask(task) ? SMART_AD_CLAIM_DELAY_MS : CLAIM_DELAY_MS;
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

export default function Tasks({ onRewardCoins }: Props) {
  const [toast, setToast] = useState("");
  const [serverTasks, setServerTasks] = useState<ServerTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [progressById, setProgressById] = useState<ProgressMap>(() => loadProgress());
  
  // ✅ التعديل الأول: جعلنا القيمة الافتراضية كائن فارغ حتى لا يتم جلب أوقات قديمة من المتصفح
  const [openedAtById, setOpenedAtById] = useState<OpenedMap>({});
  
  const [openingIds, setOpeningIds] = useState<Record<string, boolean>>({});
  const [claimingIds, setClaimingIds] = useState<Record<string, boolean>>({});

  // Holds the single scheduled auto-claim timer per task id.
  // A task gets exactly ONE timer, fired once, when it is opened —
  // no repeating background polling / retry loop.
  const claimTimersRef = useRef<Record<string, number>>({});

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressById));
    } catch {}
  }, [progressById]);

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

  const clearClaimTimer = (id: string) => {
    const handle = claimTimersRef.current[id];
    if (handle) {
      window.clearTimeout(handle);
      delete claimTimersRef.current[id];
    }
  };

  const handleClaimServerTask = async (task: ServerTask) => {
    if (isWatchAdTask(task)) {
      return;
    }

    const id = String(task.id);

    if (claimingIds[id]) return;

    const openedAt = openedAtById[id];
    const claimDelayMs = getClaimDelayMs(task);

    if (!openedAt) {
      return;
    }

    if (Date.now() - openedAt < claimDelayMs) {
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
      setToast(err?.message || "Failed to verify task");
    } finally {
      clearClaimTimer(id);
      setClaimingIds((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  };

  // Schedules exactly ONE auto-claim attempt for this task, `claimDelayMs`
  // after it was opened. No repeating interval, no background retries.
  const scheduleAutoClaim = (task: ServerTask, openedAt: number) => {
    if (isWatchAdTask(task)) return;

    const id = String(task.id);
    clearClaimTimer(id);

    const delayMs = getClaimDelayMs(task);
    const remaining = Math.max(0, delayMs - (Date.now() - openedAt));

    claimTimersRef.current[id] = window.setTimeout(() => {
      delete claimTimersRef.current[id];
      handleClaimServerTask(task);
    }, remaining);
  };

  // Re-arm the one-shot timer for any task that was already opened
  // (e.g. page was reloaded mid-wait) but hasn't been claimed yet.
  // Still only ONE timer per task — not a repeating poll.
  useEffect(() => {
    Object.entries(openedAtById).forEach(([id, openedAt]) => {
      if (claimTimersRef.current[id]) return;

      const task = serverTasks.find((t) => String(t.id) === id);
      if (!task || isWatchAdTask(task)) return;

      const progress = progressById[id] || {
        completed: 0,
        max_completions: Math.max(1, Number(task.max_completions || 1)),
      };
      if (progress.completed >= progress.max_completions) return;

      scheduleAutoClaim(task, openedAt);
    });
  }, [serverTasks, openedAtById, progressById]);

  useEffect(() => {
    return () => {
      Object.values(claimTimersRef.current).forEach((handle) => window.clearTimeout(handle));
      claimTimersRef.current = {};
    };
  }, []);

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

      // Record the open server-side so the 5s wait can be verified
      // against a real opened_at when we claim (watch_ad tasks are
      // handled separately via the AdsGram callback).
      if (!isWatchAdTask(task)) {
        await postTaskAction({ taskId: task.id, action: "open" });
      }

      window.open(url, "_blank", "noopener,noreferrer");

      const openedAt = Date.now();

      setOpenedAtById((prev) => ({
        ...prev,
        [id]: openedAt,
      }));

      scheduleAutoClaim(task, openedAt);

      const waitSeconds = getClaimDelayMs(task) / 1000;
      setToast(`Opened. Sending coins in ${waitSeconds} seconds.`);
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
            const isSmartAd = isSmartAdTask(task);
            const claimDelayMs = getClaimDelayMs(task);

            const progress = progressById[id] || {
              completed: 0,
              max_completions: Math.max(1, Number(task.max_completions || 1)),
            };

            const openedAt = openedAtById[id];
            const opened = Boolean(openedAt);
            const waitedEnough = opened && Date.now() - openedAt >= claimDelayMs;
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
                      <p className="task-type">
                        {isSmartAd ? "smart ad" : task.task_type || "task"}
                      </p>
                      <h2>{task.title}</h2>
                    </div>
                    <strong className="task-reward">+{Number(task.reward || 0)}</strong>
                  </div>

                  <div className="task-mini-status">
                    {isWatchAd ? (
                      <span className="gray">Ad temporarily unavailable</span>
                    ) : claimedAll ? (
                      <span className="green">Completed</span>
                    ) : !opened ? (
                      <span className="gray">Open link first</span>
                    ) : !waitedEnough ? (
                      <span className="blue">
                        Sending coins in {Math.ceil((claimDelayMs - (Date.now() - openedAt)) / 1000)} seconds
                      </span>
                    ) : (
                      <span className="green">
                        {claiming ? "Verifying..." : `Ready ${progress.completed}/${progress.max_completions}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="task-actions">
                  {/* ✅ التعديل الثاني: إضافة العداد الأنيق أعلى الزر */}
                  {!isWatchAd && (
                    <div style={{
                      textAlign: "right",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#9ca3af",
                      marginBottom: "6px",
                      paddingRight: "6px",
                      letterSpacing: "0.5px"
                    }}>
                      <span style={{ color: "#fff" }}>{progress.completed}</span> 
                      <span style={{ opacity: 0.5 }}> / {progress.max_completions}</span>
                    </div>
                  )}

                  {isWatchAd ? (
                    <div className="task-btn join" style={{ opacity: 0.6 }}>
                      Unavailable
                    </div>
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
                </div>
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}
