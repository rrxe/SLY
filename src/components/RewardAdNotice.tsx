import { useEffect, useState } from "react";
import { REWARD_AD_NOTICE_EVENT } from "../lib/adsgramReward";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/reward-notice.css";

type Notice = {
  code: string;
  title: string;
  message: string;
};

// رسالة أخطاء إعلانات المكافآت: تبقى ظاهرة لين المستخدم يضغط
// "حسناً" (أو يضغط خارج البطاقة)، ما تختفي لحالها.
export default function RewardAdNotice() {
  const { t } = useLanguage();
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const onNotice = (event: Event) => {
      const detail = (event as CustomEvent<Notice>).detail;
      if (detail && detail.message) setNotice(detail);
    };
    window.addEventListener(REWARD_AD_NOTICE_EVENT, onNotice);
    return () => window.removeEventListener(REWARD_AD_NOTICE_EVENT, onNotice);
  }, []);

  if (!notice) return null;

  const close = () => setNotice(null);
  const tone = notice.code === "no_click" || notice.code === "too_short" ? "click" : notice.code === "busy" ? "wait" : "error";

  return (
    <div className="reward-notice-backdrop" onClick={close} role="presentation">
      <div
        className={`reward-notice-card reward-notice-${tone}`}
        role="alertdialog"
        aria-live="assertive"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="reward-notice-icon" aria-hidden="true">
          {tone === "click" ? "👆" : tone === "wait" ? "⏳" : "⚠️"}
        </div>
        <h3 className="reward-notice-title">{notice.title}</h3>
        <p className="reward-notice-text">{notice.message}</p>
        <button type="button" className="reward-notice-btn" onClick={close}>
          {t("rewardAd.ok")}
        </button>
      </div>
    </div>
  );
}
