import { useEffect, useRef, useState } from "react";
import { showRewardAdWithPulse, notifyRewardAdError } from "../lib/adsgramReward";
import { useLanguage } from "../i18n/LanguageContext";
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
  completed?: number;
};

type TaskProgress = {
  completed: number;
  max_completions: number;
};

type ProgressMap = Record<string, TaskProgress>;
type OpenedMap = Record<string, number>;

const CLAIM_DELAY_MS = 5000;
const ADSGRAM_CLAIM_DELAY_MS = 0;   // صفر لـ AdsGram أيضاً (إعلان لا يمكن تخطيه)


// مهام الإعلانات (task_type = "adsgram") صارت تعرض إعلان AdsGram بنظام
// النبضة: لازم المستخدم يضغط الإعلان (يفتح رابطه ولو جزء من الثانية) حتى ينحسب.
// (الاسم "adsgram" بقي كما هو بقاعدة البيانات لتوافق المهام الموجودة.)

// بلوك AdsGram من نوع "Task" (إعلان أصلي/native يظهر كعنصر بقائمة
// المهام). شغّال كما كان بالنسخة الأصلية (task-46724).
const NATIVE_ADSGRAM_TASK_ENABLED = true;
const ADSGRAM_NATIVE_TASK_BLOCK_ID = "task-46724";

// عنصر <adsgram-task> ويب كومبوننت جاهز من سكربت AdsGram نفسه - ما
// يحتاج init() ولا show()، AdsGram ترندره وتطلق حدث "reward" لما
// المستخدم يكمل المهمة.
// ملاحظة: بـ React 19 نيمسبيس JSX العام (declare global { namespace
// JSX }) ما يندمج صح مع أنواع @types/react الجديدة - لازم نوسّع
// JSX جوا موديول "react" نفسه (declare module "react"), مو global.
declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "adsgram-task": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          "data-block-id"?: string;
          "data-debug"?: string;
          classname?: string;
        },
        HTMLElement
      >;
    }
  }
}


function getInitData() {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initData || "";
}

function isAdsGramTask(task: ServerTask) {
  return ["adsgram", "watch_ad"].includes(String(task.task_type || "").toLowerCase());
}

function isJoinBotTask(task: ServerTask) {
  return String(task.task_type || "").toLowerCase() === "join_bot";
}

type TaskCategory = "ads" | "join_channel" | "bots" | "other";

function getTaskCategory(task: ServerTask): TaskCategory {
  const type = String(task.task_type || "").toLowerCase();
  if (type === "join_channel") return "join_channel";
  if (type === "join_bot") return "bots";
  if (type === "adsgram" || type === "watch_ad") return "ads";
  return "other";
}

function getClaimDelayMs(task: ServerTask) {
  if (isAdsGramTask(task)) return ADSGRAM_CLAIM_DELAY_MS;
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
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<"all" | "ads" | "join_channel" | "bots">("all");
  const [toast, setToast] = useState("");
  const [serverTasks, setServerTasks] = useState<ServerTask[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  // مصدر الحقيقة الوحيد لتقدّم المهام هو السيرفر - يتعبى من رد
  // /api/tasks/list (تحقّق تحت) وبعد كل claim ناجح، مو من أي كاش
  // محلي. لو الصفحة تفتح من جديد أو من جهاز ثاني، الرقم يطلع صح
  // من أول لحظة بدل ما يضل يعرض قيمة قديمة لين يصير خطأ.
  const [progressById, setProgressById] = useState<ProgressMap>({});
  const [openedAtById, setOpenedAtById] = useState<OpenedMap>({});
  const [openingIds, setOpeningIds] = useState<Record<string, boolean>>({});
  const [claimingIds, setClaimingIds] = useState<Record<string, boolean>>({});
  const claimTimersRef = useRef<Record<string, number>>({});
  const nativeTaskElRef = useRef<HTMLElement | null>(null);
  const nativeTaskClaimTimerRef = useRef<number | undefined>(undefined);
  // متفائل افتراضياً (true) - نخفيه بس إذا AdsGram قالت صراحة "ما
  // عندي عرض حالياً" (onBannerNotFound)، عشان ما تضل مساحة فاضية.
  const [nativeTaskAvailable, setNativeTaskAvailable] = useState(NATIVE_ADSGRAM_TASK_ENABLED);
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, []);

  // حدث "reward" من عنصر <adsgram-task> بس تنبيه من جهة الكلاينت -
  // ما نثق فيه لحاله. المكافأة الحقيقية توصل سيرفرنا عبر webhook
  // AdsGram (Reward URL منفصل لهذا البلوك)، فنستنى شوي ونحاول نسحبها
  // بـ native_task_claim - إذا لسا ما وصلت نعيد المحاولة لين توصل.
  const claimNativeTaskAd = (attempt = 0) => {
    const initData = getInitData();
    fetch("/api/auth/me", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `tga ${initData}` },
      body: JSON.stringify({ action: "native_task_claim" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && !data.pending && typeof data.reward === "number") {
          onRewardCoins(data.reward, t("tasks.typeAdsGram"), t("tasks.coinsRewardToast", { amount: data.reward }));
          setToast(t("tasks.coinsRewardToast", { amount: data.reward }));
          return;
        }
        if (attempt < 15) {
          nativeTaskClaimTimerRef.current = window.setTimeout(() => claimNativeTaskAd(attempt + 1), 2000);
        }
      })
      .catch(() => {
        if (attempt < 15) {
          nativeTaskClaimTimerRef.current = window.setTimeout(() => claimNativeTaskAd(attempt + 1), 2000);
        }
      });
  };

  useEffect(() => {
    const el = nativeTaskElRef.current;
    if (!el) return;
    const onReward = () => {
      claimNativeTaskAd();
    };
    // AdsGram ترسل هذا الحدث لما ما يكون عندها عرض/مهمة حالياً
    // لهذا البلوك (مو خطأ بالكود - عادي، خصوصاً بالبداية لين
    // يصير عندها fill). نخفي الصندوق بدل ما يضل فاضي.
    const onNotFound = () => setNativeTaskAvailable(false);
    el.addEventListener("reward", onReward);
    el.addEventListener("onBannerNotFound", onNotFound);
    return () => {
      el.removeEventListener("reward", onReward);
      el.removeEventListener("onBannerNotFound", onNotFound);
      if (nativeTaskClaimTimerRef.current) window.clearTimeout(nativeTaskClaimTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const ids: (string | number)[] = Array.isArray(detail) ? detail : [];
      if (ids.length === 0) return;

      setProgressById((prev) => {
        const next = { ...prev };
        for (const id of ids) {
          delete next[String(id)];
        }
        return next;
      });
    };

    window.addEventListener("sly:channel-tasks-reset", handler);
    return () => window.removeEventListener("sly:channel-tasks-reset", handler);
  }, []);

  useEffect(() => {
    const initData = getInitData();
    fetch("/api/tasks/list", {
      headers: { Authorization: `tga ${initData}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && Array.isArray(data.tasks)) {
          setServerTasks(data.tasks);

          // نبني تقدّم كل مهمة من رد السيرفر مباشرة - هذا يصير مصدر
          // الحقيقة الوحيد من أول تحميل للصفحة، مو بس بعد أول رفض.
          setProgressById((prev) => {
            const next: ProgressMap = { ...prev };
            for (const task of data.tasks as ServerTask[]) {
              const id = String(task.id);
              next[id] = {
                completed: Number(task.completed ?? 0),
                max_completions: Math.max(1, Number(task.max_completions || 1)),
              };
            }
            return next;
          });
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
    if (!res.ok || !data.success) throw new Error(data.error || t("tasks.failedToProcessTask"));
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
      onRewardCoins(
        reward,
        task.title,
        t("tasks.taskProgressMeta", { completed: nextCompleted, max: nextMax, reward })
      );
      setToast(t("tasks.coinsRewardToast", { amount: reward }));
    } catch (err: any) {
      setToast(err?.message || t("tasks.failedToVerifyTask"));
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
    if (progress.completed >= progress.max_completions) { setToast(t("tasks.taskLimitReached")); return; }

    const taskType = String(task.task_type || "").toLowerCase();
    const allowedTypes = ["normal", "join_channel", "join_bot", "custom", "adsgram", "watch_ad", ""];
    if (!allowedTypes.includes(taskType)) {
      setToast(t("tasks.invalidTaskType"));
      return;
    }

    setOpeningIds((prev) => ({ ...prev, [id]: true }));

    try {
      // معالجة إعلانات AdsGram (نبضتين: نافذة 15 ثانية لكشف الضغط ثم تأكيد البقاء)
      if (isAdsGramTask(task)) {
        try {
          await showRewardAdWithPulse("tasks");
        } catch (err: any) {
          if (!notifyRewardAdError(err, t)) {
            setToast(err?.message || t("tasks.adFailedToLoad"));
          }
          return;
        }

        await postTaskAction({ taskId: task.id, action: "open" });
        const openedAt = Date.now();
        setOpenedAtById((prev) => ({ ...prev, [id]: openedAt }));
        scheduleAutoClaim(task, openedAt);
        setToast(t("tasks.adWatchedClaiming"));
        return;
      }

      // المهام العادية (مع رابط)
      const url = String(task.url || "").trim();
      if (!url) { setToast(t("tasks.taskNoUrl")); return; }

      await postTaskAction({ taskId: task.id, action: "open" });
      window.open(url, "_blank", "noopener,noreferrer");
      const openedAt = Date.now();
      setOpenedAtById((prev) => ({ ...prev, [id]: openedAt }));
      scheduleAutoClaim(task, openedAt);
      const waitSeconds = getClaimDelayMs(task) / 1000;
      setToast(t("tasks.openedSendingIn", { seconds: waitSeconds }));
    } catch (err: any) {
      setToast(err?.message || t("tasks.failedToOpenTask"));
    } finally {
      setOpeningIds((prev) => { const copy = { ...prev }; delete copy[id]; return copy; });
    }
  };

  return (
    <section className="tasks-page">
      {toast ? <div className="tasks-toast">{toast}</div> : null}
      <section className="tasks-hero">
        <div className="tasks-hero-icon"><CoinsIcon /></div>
        <div className="tasks-hero-text"><h1>{t("tasks.heroTitle")}</h1><p>{t("tasks.heroSubtitle")}</p></div>
      </section>

      <div className="task-category-tabs">
        {([
          { key: "all", label: t("tasks.tabAll"), count: serverTasks.length },
          { key: "ads", label: t("tasks.tabAds"), count: serverTasks.filter((t) => getTaskCategory(t) === "ads").length },
          { key: "join_channel", label: t("tasks.tabJoinChannel"), count: serverTasks.filter((t) => getTaskCategory(t) === "join_channel").length },
          { key: "bots", label: t("tasks.tabBots"), count: serverTasks.filter((t) => getTaskCategory(t) === "bots").length },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`task-category-tab ${activeCategory === tab.key ? "active" : ""}`}
            onClick={() => setActiveCategory(tab.key)}
          >
            {tab.label}
            <span className="task-category-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <section className="task-strip">
        {(activeCategory === "all" || activeCategory === "ads") && nativeTaskAvailable ? (
          <article className="native-task-row">
            <adsgram-task
              ref={nativeTaskElRef}
              data-block-id={ADSGRAM_NATIVE_TASK_BLOCK_ID}
              data-debug="false"
              className="native-task-widget"
            >
              <span slot="reward" className="task-reward native-task-reward">+10</span>
              <div slot="button" className="task-btn join">
                {t("tasks.openAction")}
              </div>
              <div
                slot="claim"
                className="task-btn claim native-claim-btn"
                onClick={() => claimNativeTaskAd()}
              >
                {t("tasks.claimAction")}
              </div>
              <div slot="done" className="task-btn claim">{t("tasks.nativeTaskDone")}</div>
            </adsgram-task>
          </article>
        ) : null}
        {loadingTasks ? (
          <div className="task-empty">{t("tasks.loadingTasks")}</div>
        ) : serverTasks.length === 0 ? (
          <div className="task-empty">{t("tasks.noTasks")}</div>
        ) : (
          serverTasks
            .filter((task) => activeCategory === "all" || getTaskCategory(task) === activeCategory)
            .map((task) => {
            const id = String(task.id);
            const isAdsGram = isAdsGramTask(task);
            const claimDelayMs = getClaimDelayMs(task);
            const progress = progressById[id] || { completed: 0, max_completions: Math.max(1, Number(task.max_completions || 1)) };
            const openedAt = openedAtById[id];
            const opened = Boolean(openedAt);
            const waitedEnough = opened && Date.now() - openedAt >= claimDelayMs;
            const claimedAll = progress.completed >= progress.max_completions;
            const opening = Boolean(openingIds[id]);
            const claiming = Boolean(claimingIds[id]);


            const isJoinBot = isJoinBotTask(task);

            const taskTypeLabel = isAdsGram ? t("tasks.typeAdsGram") : task.task_type || t("tasks.typeTask");

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
                      <span className="green">{t("tasks.completed")}</span>
                    ) : !opened ? (
                      <span className="gray">{isAdsGram ? t("tasks.watchAdToEarn") : t("tasks.openLinkFirst")}</span>
                    ) : !waitedEnough ? (
                      <span className="blue">{t("tasks.sendingCoinsIn", { seconds: Math.ceil((claimDelayMs - (Date.now() - openedAt)) / 1000) })}</span>
                    ) : (
                      <span className="green">{claiming ? t("tasks.verifying") : t("tasks.readyProgress", { completed: progress.completed, max: progress.max_completions })}</span>
                    )}
                  </div>
                  {isJoinBot ? (
                    <div className="task-note">
                      {t("tasks.botJoinNote")}
                    </div>
                  ) : null}
                </div>
                <div className="task-actions">
                  <div style={{ textAlign: "right", fontSize: "12px", fontWeight: 600, color: "#9ca3af", marginBottom: "6px", paddingRight: "6px", letterSpacing: "0.5px" }}>
                    <span style={{ color: "#fff" }}>{progress.completed}</span> <span style={{ opacity: 0.5 }}> / {progress.max_completions}</span>
                  </div>
                  <button type="button" className="task-btn join" onClick={() => handleOpenTask(task)} disabled={opening || claimedAll}>
                    {opening
                      ? (isAdsGram ? t("tasks.loadingAdAction") : t("tasks.openingAction"))
                      : (isAdsGram ? t("tasks.watchAdAction") : t("tasks.openAction"))}
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

