import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import UiIcons from "../components/UiIcons";
import "../styles/referrals.css";

interface ReferralsProps {
  telegramId: string;
  referralsCount: number;
  referralRewardUsdt: number;
  referralRequiredTasks: number;
}

export default function Referrals({
  telegramId,
  referralsCount,
  referralRewardUsdt,
  referralRequiredTasks,
}: ReferralsProps) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

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
      </section>

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
