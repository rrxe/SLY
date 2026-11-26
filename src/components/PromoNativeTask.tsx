import { useEffect, useRef, useState } from "react";
import { showRewardAdWithPulse, notifyRewardAdError } from "../lib/adsgramReward";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/tasks.css";
import "../styles/promo-task.css";

const TAPS_BEFORE_SHOW = 3;

type Props = {
  paused?: boolean;
  onRewardCoins: (amount: number, title: string, meta: string) => void;
};

function getInitData() {
  return (window as any).Telegram?.WebApp?.initData || "";
}

async function postAuthAction(body: Record<string, unknown>) {
  const response = await fetch("/api/auth/me", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `tga ${getInitData()}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || "Reward request failed");
  }
  return data;
}

export default function PromoNativeTask({ paused = false, onRewardCoins }: Props) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const tapsRef = useRef(0);
  const dismissedRef = useRef(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    const onTap = (event: Event) => {
      if (dismissedRef.current || pausedRef.current || visible) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(".promo-task-card")) return;
      tapsRef.current += 1;
      if (tapsRef.current >= TAPS_BEFORE_SHOW) setVisible(true);
    };
    document.addEventListener("pointerdown", onTap, true);
    return () => document.removeEventListener("pointerdown", onTap, true);
  }, [visible]);

  const hide = () => {
    dismissedRef.current = true;
    setVisible(false);
  };

  const handleReward = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await postAuthAction({ action: "native_task2_arm" });
      await showRewardAdWithPulse("tasks");

      let rewardData: any = null;
      for (let attempt = 0; attempt < 30; attempt += 1) {
        rewardData = await postAuthAction({ action: "native_task2_claim" });
        if (rewardData?.success && !rewardData.pending && typeof rewardData.reward === "number") break;
        await new Promise((resolve) => window.setTimeout(resolve, 1000));
      }

      if (!rewardData?.success || rewardData.pending || typeof rewardData.reward !== "number") {
        throw new Error(t("tasks.adFailedToLoad"));
      }

      onRewardCoins(
        rewardData.reward,
        t("tasks.promoTitle"),
        t("tasks.coinsRewardToast", { amount: rewardData.reward })
      );
      hide();
    } catch (err: any) {
      await postAuthAction({ action: "native_task2_cancel" }).catch(() => {});
      if (!notifyRewardAdError(err, t)) console.warn("[SLY reward promo]", err);
    } finally {
      setBusy(false);
    }
  };

  if (!visible || paused) return null;

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
      <div className="native-task-reward">+10</div>
      <button type="button" className="task-btn join" onClick={handleReward} disabled={busy}>
        {busy ? t("tasks.loadingTasks") : t("tasks.openAction")}
      </button>
    </div>
  );
}
