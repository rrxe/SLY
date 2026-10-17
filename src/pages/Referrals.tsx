import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import UiIcons from "../components/UiIcons";
import "../styles/referrals.css";

interface ReferralBonus {
  progress: number;
  tier1Referrals: number;
  tier1Percent: number;
  tier2Referrals: number;
  tier2Percent: number;
  durationDays: number;
  activePercent: number;
  expiresAt: string | null;
}

interface WithdrawalProof {
  totalUsdt: number;
  count: number;
}

interface ReferralsProps {
  telegramId: string;
  referralsCount: number;
  referralRewardUsdt: number;
  referralRequiredTasks: number;
  referralBonus: ReferralBonus | null;
  withdrawalProof: WithdrawalProof;
}

export default function Referrals({
  telegramId,
  referralsCount,
  referralRewardUsdt,
  referralRequiredTasks,
  referralBonus,
  withdrawalProof,
}: ReferralsProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // نحدّث العدّاد التنازلي لوقت البونص كل 30 ثانية
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const botUsername = "SLYMintX_bot";
  const appShortName = "start";
  const referralLink = telegramId
    ? `https://t.me/${botUsername}/${appShortName}?startapp=ref_${telegramId}`
    : "";

  const handleCopy = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const formatTimeLeft = (ms: number) => {
    const totalMinutes = Math.max(0, Math.floor(ms / 60000));
    const d = Math.floor(totalMinutes / 1440);
    const h = Math.floor((totalMinutes % 1440) / 60);
    const m = totalMinutes % 60;

    if (d > 0) return t("referrals.timeDaysHours", { d, h });
    if (h > 0) return t("referrals.timeHoursMinutes", { h, m });
    return t("referrals.timeMinutes", { m });
  };

  const bonusExpiresMs = referralBonus?.expiresAt
    ? new Date(referralBonus.expiresAt).getTime()
    : 0;
  const bonusActive =
    !!referralBonus && referralBonus.activePercent > 0 && bonusExpiresMs > now;

  const bonusTiers = referralBonus
    ? [
        { required: referralBonus.tier1Referrals, percent: referralBonus.tier1Percent },
        { required: referralBonus.tier2Referrals, percent: referralBonus.tier2Percent },
      ]
    : [];

  const proofTotal = Number(withdrawalProof.totalUsdt || 0);
  const canShareProof = proofTotal > 0 && !!referralLink;
  const proofAmount = String(Number(proofTotal.toFixed(4)));

  const handleShareProof = () => {
    if (!canShareProof) return;

    const text = t("referrals.shareProofText", { amount: proofAmount });
    const shareUrl =
      `https://t.me/share/url?url=${encodeURIComponent(referralLink)}` +
      `&text=${encodeURIComponent(text)}`;

    const tg = (window as any).Telegram?.WebApp;

    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else {
      window.open(shareUrl, "_blank");
    }
  };

  return (
    <section className="referrals-page">
      <header className="referrals-head">
        <div>
          <span className="referrals-kicker">NETWORK LINK</span>
          <h1>{t("referrals.title")}</h1>
          <p>{t("referrals.description", { tasks: referralRequiredTasks, reward: referralRewardUsdt })}</p>
        </div>
        <div className="referrals-orbit" aria-hidden="true" />
      </header>

      <section className="referrals-stats">
        <div className="referral-stat-card accent">
          <div className="referral-stat-icon"><UiIcons name="referrals" /></div>
          <span>{t("referrals.qualifiedReferrals")}</span>
          <strong>{referralsCount}</strong>
        </div>
        <div className="referral-stat-card">
          <div className="referral-stat-icon gold"><UiIcons name="coins" /></div>
          <span>{t("referrals.rewardPerReferral")}</span>
          <strong>{Number(referralRewardUsdt).toFixed(2)} <small>USDT</small></strong>
        </div>
      </section>

      <section className="referral-link-card">
        <div className="referral-card-head">
          <div>
            <span>{t("referrals.linkLabel")}</span>
            <h2>{t("referrals.inviteNetwork")}</h2>
          </div>
          <UiIcons name="referrals" />
        </div>

        <div className="referral-link-row">
          <input
            readOnly
            value={referralLink}
            placeholder={telegramId ? "" : t("referrals.linkUnavailable")}
            aria-label={t("referrals.linkLabel")}
          />
          <button type="button" onClick={handleCopy} disabled={!referralLink}>
            {copied ? t("referrals.copied") : t("referrals.copy")}
          </button>
        </div>

        <button
          type="button"
          className="referral-proof-button"
          onClick={handleShareProof}
          disabled={!canShareProof}
        >
          {t("referrals.shareProof")}
        </button>
        <p className={`referral-proof-note ${canShareProof ? "" : "locked"}`}>
          {canShareProof
            ? t("referrals.shareProofTotal", { amount: proofAmount })
            : t("referrals.shareProofLocked")}
        </p>
      </section>

      {referralBonus ? (
        <section className="referral-bonus-card">
          <div className="referral-card-head">
            <div>
              <span>{t("referrals.bonusKicker")}</span>
              <h2>{t("referrals.bonusTitle")}</h2>
            </div>
            <UiIcons name="coins" />
          </div>

          <p className="referral-bonus-intro">{t("referrals.bonusIntro")}</p>

          <div className={`referral-bonus-status ${bonusActive ? "active" : ""}`}>
            {bonusActive ? (
              <>
                <strong>
                  {t("referrals.bonusActive", { percent: referralBonus.activePercent })}
                </strong>
                <span>
                  {t("referrals.bonusTimeLeft", {
                    time: formatTimeLeft(bonusExpiresMs - now),
                  })}
                </span>
              </>
            ) : (
              <strong>{t("referrals.bonusNone")}</strong>
            )}
          </div>

          <div className="referral-bonus-tiers">
            {bonusTiers.map((tier) => {
              const done = Math.min(referralBonus.progress, tier.required);
              const pct = Math.min(100, (done / tier.required) * 100);
              const reached = referralBonus.progress >= tier.required;

              return (
                <div
                  key={tier.required}
                  className={`referral-bonus-tier ${reached ? "reached" : ""}`}
                >
                  <div className="referral-bonus-tier-head">
                    <strong>{t("referrals.bonusTierLabel", { count: tier.required })}</strong>
                    <b>{t("referrals.bonusTierBoost", { percent: tier.percent })}</b>
                  </div>
                  <div className="referral-bonus-bar">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <span>
                    {done}/{tier.required}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="referral-flow-card">
        <div className="referral-flow-head">
          <span>{t("referrals.howItWorks")}</span>
          <b>{referralRequiredTasks} {t("referrals.tasksShort")}</b>
        </div>
        <div className="referral-flow">
          <div><i>01</i><strong>{t("referrals.inviteStep")}</strong><span>{t("referrals.inviteStepSub")}</span></div>
          <em />
          <div><i>02</i><strong>{t("referrals.qualifyStep")}</strong><span>{t("referrals.qualifyStepSub")}</span></div>
          <em />
          <div><i>03</i><strong>{t("referrals.rewardStep")}</strong><span>{Number(referralRewardUsdt).toFixed(2)} USDT</span></div>
        </div>
        <p>{t("referrals.requirementExample", { tasks: referralRequiredTasks })}</p>
      </section>
    </section>
  );
}
