import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/tasks.css";
import "../styles/promo-task.css";

// بلوك AdsGram Task (task-46724): بطاقة ظاهرة وواضحة تطلع للمستخدم
// بعد ثلاث ضغطات بالتطبيق. المستخدم هو اللي يختار يضغط عليها (أو يسكّرها
// بزر X)، وإذا فتح المهمة وأنجزها ياخذ 10 كوين. ما نحوّل أي ضغطة
// عادية لضغطة إعلان.
const PROMO_NATIVE_TASK_BLOCK_ID = "task-46724";
const TAPS_BEFORE_SHOW = 3;

type Props = {
  // لا نعرض البطاقة وسط لعبة أو قبل ما يجهز التطبيق
  paused?: boolean;
  onRewardCoins: (amount: number, title: string, meta: string) => void;
};

function getInitData() {
  return (window as any).Telegram?.WebApp?.initData || "";
}

export default function PromoNativeTask({ paused = false, onRewardCoins }: Props) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const tapsRef = useRef(0);
  const dismissedRef = useRef(false);
  const taskElRef = useRef<HTMLElement | null>(null);
  const claimTimerRef = useRef<number | undefined>(undefined);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // نعدّ ضغطات المستخدم؛ بعد الثانية تطلع البطاقة مرة وحدة بالجلسة
  useEffect(() => {
    if (unavailable) return;
    const onTap = (event: Event) => {
      if (dismissedRef.current || pausedRef.current) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(".promo-task-card")) return;
      tapsRef.current += 1;
      if (tapsRef.current >= TAPS_BEFORE_SHOW) setVisible(true);
    };
    document.addEventListener("pointerdown", onTap, true);
    return () => document.removeEventListener("pointerdown", onTap, true);
  }, [unavailable]);

  const hide = () => {
    dismissedRef.current = true;
    setVisible(false);
  };

  const claim = (attempt = 0) => {
    fetch("/api/auth/me", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `tga ${getInitData()}`,
      },
      body: JSON.stringify({ action: "native_task2_claim" }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && !data.pending && typeof data.reward === "number") {
          onRewardCoins(
            data.reward,
            t("tasks.promoTitle"),
            t("tasks.coinsRewardToast", { amount: data.reward })
          );
          hide();
          return;
        }
        // المكافأة الحقيقية توصل بـ webhook من AdsGram، فنعيد المحاولة
        if (attempt < 15) {
          claimTimerRef.current = window.setTimeout(() => claim(attempt + 1), 2000);
        }
      })
      .catch(() => {
        if (attempt < 15) {
          claimTimerRef.current = window.setTimeout(() => claim(attempt + 1), 2000);
        }
      });
  };

  // نسلّح البطاقة عند السيرفر لما تظهر (ونجدد كل 10 دقايق وهي ظاهرة)
  useEffect(() => {
    if (!visible) return;
    const arm = () => {
      fetch("/api/auth/me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `tga ${getInitData()}`,
        },
        body: JSON.stringify({ action: "native_task2_arm" }),
      }).catch(() => {});
    };
    arm();
    const id = window.setInterval(arm, 10 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const el = taskElRef.current;
    if (!el) return;
    const onReward = () => claim();
    // ما في عرض متاح حالياً: نخفي البطاقة بدل ما تبقى فاضية
    const onNotFound = () => {
      setUnavailable(true);
      setVisible(false);
    };
    el.addEventListener("reward", onReward);
    el.addEventListener("onBannerNotFound", onNotFound);
    return () => {
      el.removeEventListener("reward", onReward);
      el.removeEventListener("onBannerNotFound", onNotFound);
      if (claimTimerRef.current) window.clearTimeout(claimTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible || paused || unavailable) return null;

  return (
    <div className="promo-task-card" role="dialog" aria-label={t("tasks.promoTitle")}>
      <button
        type="button"
        className="promo-task-close"
        onClick={hide}
        aria-label={t("tasks.promoClose")}
      >
        ✕
      </button>
      <p className="promo-task-title">{t("tasks.promoTitle")}</p>
      <p className="promo-task-sub">{t("tasks.promoSubtitle")}</p>
      <adsgram-task
        ref={taskElRef}
        data-block-id={PROMO_NATIVE_TASK_BLOCK_ID}
        data-debug="false"
        className="native-task-widget"
      >
        <span slot="reward" className="task-reward native-task-reward">+10</span>
        <div slot="button" className="task-btn join">
          {t("tasks.openAction")}
        </div>
        <div slot="claim" className="task-btn claim native-claim-btn" onClick={() => claim()}>
          {t("tasks.claimAction")}
        </div>
        <div slot="done" className="task-btn claim">{t("tasks.nativeTaskDone")}</div>
      </adsgram-task>
    </div>
  );
}
