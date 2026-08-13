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
const ADS_GALAXY_CLAIM_DELAY_MS = 0;

// ثوابت GigaPub
const GIGAPUB_PROJECT_ID = "7665";
const GIGAPUB_SCRIPT_SRC = `https://ad.gigapub.tech/script?id=${GIGAPUB_PROJECT_ID}`;

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
  } catch { return {}; }
}

function getInitData() {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initData || "";
}

function isSmartAdTask(task: ServerTask) {
  return String(task.task_type || "").toLowerCase() === "smart_ad";
}

function isAdsGalaxyTask(task: ServerTask) {
  return String(task.task_type || "").toLowerCase() === "ads_galaxy";
}

function isGigaPubTask(task: ServerTask) {
  return String(task.task_type || "").toLowerCase() === "giga_pub";
}

function getClaimDelayMs(task: ServerTask) {
  if (isSmartAdTask(task) || isGigaPubTask(task)) return SMART_AD_CLAIM_DELAY_MS;
  if (isAdsGalaxyTask(task)) return ADS_GALAXY_CLAIM_DELAY_MS;
  return CLAIM_DELAY_MS;
}

function TaskIcon() {
  return (
    <svg viewBox="0 0 24 24" className="task-svg" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 12h8M8 8h4M8 16h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CoinsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="hero-svg" aria-hidden="true">
      <circle cx="9" cy="9" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15" cy="15" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 6.6v4.8M6.6 9h4.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function Tasks({ onRewardCoins }: Props) {
  const [toast, setToast] = useState("");
  const [serverTasks, setServerTasks] = useState<ServerTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [progressById, setProgressById] = useState<ProgressMap>(() => loadProgress());
  const [openedAtById, setOpenedAtById] = useState<OpenedMap>({});
  const [openingIds, setOpeningIds] = useState<Record<string, boolean>>({});
  const [claimingIds, setClaimingIds] = useState<Record<string, boolean>>({});
  const [gigapubReady, setGigapubReady] = useState(false);
  const claimTimersRef = useRef<Record<string, number>>({});

  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, []);

  // تحميل SDK الخاص بـ GigaPub
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.showGiga) {
      setGigapubReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = GIGAPUB_SCRIPT_SRC;
    script.async = true;
    script.onload = () => setGigapubReady(true);
    script.onerror = () => {
      setGigapubReady(false);
      console.log("Failed to load GigaPub SDK");
    };
    document.body.appendChild(script);
    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressById)); } catch {}
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
      headers: { "Content-Type": "application/json", Authorization: `tga ${initData}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || "Failed to process task");
    return data;
  };

  const clearClaimTimer = (id: string) => {
    const handle = claimTimersRef.current[id];
    if (handle) { window.clearTimeout(handle); delete claimTimersRef.current[id]; }
  };

  const handleClaimServerTask = async (task: ServerTask) => {
    const id = String(task.id);
    if (claimingIds[id]) return;
    const openedAt = openedAtById[id];
    const claimDelayMs = getClaimDelayMs(task);
    if (!openedAt) return;
    if (Date.now() - openedAt < claimDelayMs) return;
    const current = progressById[id] || { completed: 0, max_completions: Math.max(1, Number(task.max_completions || 1)) };
    if (current.completed >= current.max_completions) return;

    setClaimingIds((prev) => ({ ...prev, [id]: true }));
    try {
      const data = await postTaskAction({ taskId: task.id });
      const nextCompleted = Number(data.progress?.completed ?? current.completed + 1);
      const nextMax = Number(data.progress?.max_completions ?? current.max_completions);
      const reward = Number(data.reward ?? task.reward ?? 0);
      setProgressById((prev) => ({ ...prev, [id]: { completed: nextCompleted, max_completions: nextMax } }));
      setOpenedAtById((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
      onRewardCoins(reward, task.title, `Task ${nextCompleted}/${nextMax} +${reward} coins`);
      setToast(`+${reward} coins`);
    } catch (err: any) {
      setToast(err?.message || "Failed to verify task");
    } finally {
      clearClaimTimer(id);
      setClaimingIds((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
    }
  };

  const scheduleAutoClaim = (task: ServerTask, openedAt: number) => {
    const id = String(task.id);
    clearClaimTimer(id);
    const delayMs = getClaimDelayMs(task);
    const remaining = Math.max(0, delayMs - (Date.now() - openedAt));
    claimTimersRef.current[id] = window.setTimeout(() => {
      delete claimTimersRef.current[id];
      handleClaimServerTask(task);
    }, remaining);
  };

  useEffect(() => {
    Object.entries(openedAtById).forEach(([id, openedAt]) => {
      if (claimTimersRef.current[id]) return;
      const task = serverTasks.find((t) => String(t.id) === id);
      if (!task) return;
      const progress = progressById[id] || { completed: 0, max_completions: Math.max(1, Number(task.max_completions || 1)) };
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
    const progress = progressById[id] || { completed: 0, max_completions: Math.max(1, Number(task.max_completions || 1)) };
    if (progress.completed >= progress.max_completions) { setToast("Task limit reached."); return; }

    const taskType = String(task.task_type || "").toLowerCase();
    const allowedTypes = ["normal", "smart_ad", "ads_galaxy", "join_channel", "custom", "giga_pub"];
    if (!allowedTypes.includes(taskType)) {
      setToast("Invalid task type.");
      return;
    }

    setOpeningIds((prev) => ({ ...prev, [id]: true }));

    try {
      // معالجة AdsGalaxy
      if (isAdsGalaxyTask(task)) {
        const showAd = (window as any).showAdsGalaxy;
        if (typeof showAd !== "function") {
          setToast("Ad not ready yet. Try again in a moment.");
          return;
        }
        try {
          await showAd();
        } catch (adErr: any) {
          const code = adErr?.code || "";
          if (code === "NO_FILL") setToast("No ad available right now.");
          else if (code === "INVALID_INIT_DATA") setToast("Open this from inside Telegram.");
          else setToast(adErr?.message || "Ad failed to load.");
          return;
        }
        await postTaskAction({ taskId: task.id, action: "open" });
        const openedAt = Date.now();
        setOpenedAtById((prev) => ({ ...prev, [id]: openedAt }));
        scheduleAutoClaim(task, openedAt);
        setToast("Ad watched. Claiming coins...");
        return;
      }

      // معالجة GigaPub
      if (isGigaPubTask(task)) {
        if (!gigapubReady) {
          setToast("GigaPub ad not ready yet. Try again.");
          return;
        }
        const showGiga = (window as any).showGiga;
        if (typeof showGiga !== "function") {
          setToast("GigaPub SDK not loaded.");
          return;
        }
        try {
          await showGiga();
        } catch (err: any) {
          setToast(err?.message || "Ad failed to load.");
          return;
        }
        await postTaskAction({ taskId: task.id, action: "open" });
        const openedAt = Date.now();
        setOpenedAtById((prev) => ({ ...prev, [id]: openedAt }));
        scheduleAutoClaim(task, openedAt);
        setToast("Ad watched. Claiming coins...");
        return;
      }

      // المهام العادية (مع رابط)
      const url = String(task.url || "").trim();
      if (!url) { setToast("Task has no URL."); return; }

      await postTaskAction({ taskId: task.id, action: "open" });
      window.open(url, "_blank", "noopener,noreferrer");
      const openedAt = Date.now();
      setOpenedAtById((prev) => ({ ...prev, [id]: openedAt }));
      scheduleAutoClaim(task, openedAt);
      const waitSeconds = getClaimDelayMs(task) / 1000;
      setToast(`Opened. Sending coins in ${waitSeconds} seconds.`);
    } catch (err: any) {
      setToast(err?.message || "Failed to open task.");
    } finally {
      setOpeningIds((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
    }
  };

  return (
    <section className="tasks-page">
      {toast ? <div className="tasks-toast">{toast}</div> : null}
      <section className="tasks-hero">
        <div className="tasks-hero-icon"><CoinsIcon /></div>
        <div className="tasks-hero-text"><h1>Earn Coins</h1><p>Complete tasks to earn coins</p></div>
      </section>
      <section className="task-strip">
        {loadingTasks ? (
          <div className="task-empty">Loading tasks...</div>
        ) : serverTasks.length === 0 ? (
          <div className="task-empty">No tasks available right now.</div>
        ) : (
          serverTasks.map((task) => {
            const id = String(task.id);
            const isSmartAd = isSmartAdTask(task);
            const isAdsGalaxy = isAdsGalaxyTask(task);
            const isGigaPub = isGigaPubTask(task);
            const claimDelayMs = getClaimDelayMs(task);
            const progress = progressById[id] || { completed: 0, max_completions: Math.max(1, Number(task.max_completions || 1)) };
            const openedAt = openedAtById[id];
            const opened = Boolean(openedAt);
            const waitedEnough = opened && Date.now() - openedAt >= claimDelayMs;
            const claimedAll = progress.completed >= progress.max_completions;
            const opening = Boolean(openingIds[id]);
            const claiming = Boolean(claimingIds[id]);

            let taskTypeLabel = task.task_type || "task";
            if (isSmartAd) taskTypeLabel = "smart ad";
            else if (isAdsGalaxy) taskTypeLabel = "ads galaxy";
            else if (isGigaPub) taskTypeLabel = "giga pub";

            return (
              <article key={id} className={`task-row ${claimedAll ? "done" : ""}`}>
                <div className="task-icon channel"><TaskIcon /></div>
                <div className="task-main">
                  <div className="task-topline">
                    <div>
                      <p className="task-type">{taskTypeLabel}</p>
                      <h2>{task.title}</h2>
                    </div>
                    <strong className="task-reward">+{Number(task.reward || 0)}</strong>
                  </div>
                  <div className="task-mini-status">
                    {claimedAll ? (
                      <span className="green">Completed</span>
                    ) : !opened ? (
                      <span className="gray">{isAdsGalaxy || isGigaPub ? "Watch the ad to earn coins" : "Open link first"}</span>
                    ) : !waitedEnough ? (
                      <span className="blue">Sending coins in {Math.ceil((claimDelayMs - (Date.now() - openedAt)) / 1000)} seconds</span>
                    ) : (
                      <span className="green">{claiming ? "Verifying..." : `Ready ${progress.completed}/${progress.max_completions}`}</span>
                    )}
                  </div>
                </div>
                <div className="task-actions">
                  <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px", paddingRight: "6px", letterSpacing: "0.5px" }}>
                    <span style={{ color: "#fff" }}>{progress.completed}</span> <span style={{ opacity: 0.5 }}> / {progress.max_completions}</span>
                  </div>
                  <button type="button" className="task-btn join" onClick={() => handleOpenTask(task)} disabled={opening || claimedAll}>
                    {opening ? (isAdsGalaxy || isGigaPub ? "Loading ad..." : "Opening...") : (isAdsGalaxy || isGigaPub ? "Watch Ad" : "Open")}
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
