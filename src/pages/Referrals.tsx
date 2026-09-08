import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";

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

  const handleCopy = () => {
    if (!referralLink) return;

    navigator.clipboard.writeText(referralLink);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      style={{
        padding: "6px 0",
        color: "#eaf4f2",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <div
        style={{
          padding: 18,
          borderRadius: 22,
          background: "#141b1c",
          border: "1px solid rgba(255,255,255,.06)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 28 }}>{t("referrals.title")}</h2>

        <p
          style={{
            marginTop: 8,
            color: "#8fa19e",
            lineHeight: 1.6,
          }}
        >
          {t("referrals.description", {
            tasks: referralRequiredTasks,
            reward: referralRewardUsdt,
          })}
        </p>

        <div style={{ marginTop: 20 }}>
          <div
            style={{
              background: "#1b2324",
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: 14, color: "#8fa19e" }}>
              {t("referrals.qualifiedReferrals")}
            </span>

            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                marginTop: 4,
                color: "#54e6d4",
              }}
            >
              {referralsCount}
            </div>
          </div>

          <div
            style={{
              background: "rgba(84,230,212,.06)",
              border: "1px solid rgba(84,230,212,.12)",
              padding: 14,
              borderRadius: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "#eaf4f2" }}>
              {t("referrals.requirementTitle")}
            </div>

            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "#8fa19e",
                lineHeight: 1.6,
              }}
            >
              {t("referrals.requirementBody", { tasks: referralRequiredTasks })}
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: "#72817e",
                lineHeight: 1.5,
              }}
            >
              {t("referrals.requirementExample", { tasks: referralRequiredTasks })}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                fontSize: 13,
                color: "#8fa19e",
                display: "block",
                marginBottom: 6,
              }}
            >
              {t("referrals.linkLabel")}
            </label>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                readOnly
                value={referralLink}
                placeholder={telegramId ? "" : t("referrals.linkUnavailable")}
                style={{
                  flex: 1,
                  background: "#101516",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  color: "#eaf4f2",
                  fontSize: 13,
                  outline: "none",
                }}
              />

              <button
                onClick={handleCopy}
                disabled={!referralLink}
                style={{
                  background: !referralLink
                    ? "rgba(84,230,212,0.30)"
                    : "#54e6d4",
                  color: "#06201c",
                  border: "none",
                  borderRadius: 12,
                  padding: "0 18px",
                  fontWeight: "bold",
                  cursor: !referralLink ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {copied ? t("referrals.copied") : t("referrals.copy")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

