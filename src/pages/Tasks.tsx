import { useEffect, useState } from "react";
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

const PROGRESS_KEY = "sly.tasks.progress.v2";

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
  const [claimingIds, setClaimingIds] = useState<Record<string, boolean>>({});

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
    const timer = window.setTimeout(() => setToast(""), 1600);
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

  const reportRewardToServer = async (body: Record<string, unknown>) => {
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
      throw new Error(data.error || "Failed to claim reward");
    }

    return data as {
      success: true;
      coins: number;
      reward: number;
      progress?: {
        completed: number;
        max_completions: number;
      };
    };
  };

  const handleOpenTask = (task: ServerTask) => {
    const url = String(task.url || "").trim();
    if (!url) {
      setToast("Task has no URL.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleClaimServerTask = async (task: ServerTask) => {
    const id = String(task.id);

    if (claimingIds[id]) return;

    const current = progressById[id] || {
      completed: 0,
      max_completions: Math.max(1, Number(task.max_completions || 1)),
    };

    if (current.completed >= current.max_completions) return;

    setClaimingIds((prev) => ({ ...prev, [id]: true }));

    try {
      const data = await reportRewardToServer({ taskId: task.id });

      const nextCompleted = Number(data.progress?.completed ?? current.completed + 1);
      const nextMax = Number(data.progress?.max_completions ?? current.max_completions);

      setProgressById((prev) => ({
        ...prev,
        [id]: {
          completed: nextCompleted,
          max_completions: nextMax,
        },
      }));

      const reward = Number(data.reward ?? task.reward ?? 0);

      onRewardCoins(
        reward,
        task.title,
        `Task ${nextCompleted}/${nextMax} +${reward} coins`
      );

      setToast(`+${reward} coins`);
    } catch (err: any) {
      setToast(err.message || "Failed to claim reward");
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
            const progress = progressById[id] || {
              completed: 0,
              max_completions: Math.max(1, Number(task.max_completions || 1)),
            };

            const claimedAll = progress.completed >= progress.max_completions;
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
                        {task.task_type || "task"}
                      </p>
                      <h2>{task.title}</h2>
                    </div>
                    <strong className="task-reward">+{Number(task.reward || 0)}</strong>
                  </div>

                  <div className="task-mini-status">
                    <span className={claimedAll ? "green" : "gray"}>
                      {claimedAll
                        ? "Completed"
                        : `${progress.completed}/${progress.max_completions}`}
                    </span>
                  </div>
                </div>

                <div className="task-actions">
                  <button
                    type="button"
                    className="task-btn join"
                    onClick={() => handleOpenTask(task)}
                    disabled={claiming}
                  >
                    Open
                  </button>

                  <button
                    type="button"
                    className="task-btn claim"
                    onClick={() => handleClaimServerTask(task)}
                    disabled={claiming || claimedAll}
                  >
                    {claiming ? "Claiming..." : claimedAll ? "Claimed" : "Claim"}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </section>
  );
}
