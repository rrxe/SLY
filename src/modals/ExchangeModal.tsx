import { useEffect, useMemo, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/modals.css";
import { showRewardAdWithPulse, notifyRewardAdError } from "../lib/adsgramReward";
import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  open: boolean;
  coins: number;
  coinsPerUsdt: number;
  minimumExchangeCoins: number;
  onClose: () => void;
  onPrepareAd: (amountCoins: number) => Promise<void>;
  onWaitForAdVerification: () => Promise<boolean>;
  onCancelAd: () => Promise<void>;
  onConfirm: (amountCoins: number) => Promise<void> | void;
};

export default function ExchangeModal({
  open,
  coins,
  coinsPerUsdt,
  minimumExchangeCoins,
  onClose,
  onPrepareAd,
  onWaitForAdVerification,
  onCancelAd,
  onConfirm,
}: Props) {
  const { t } = useLanguage();
  const [amountText, setAmountText] = useState("5000");
  const [stage, setStage] = useState<"edit" | "watching">("edit");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setStage("edit");
      setMessage("");
      return;
    }

    setAmountText(String(Math.max(minimumExchangeCoins, Math.min(coins, 5000))));
    setStage("edit");
    setMessage("");
  }, [open, coins, minimumExchangeCoins]);

  const amount = useMemo(() => {
    const parsed = Math.floor(Number(amountText));
    if (Number.isNaN(parsed)) return 0;
    return Math.max(0, Math.min(parsed, coins));
  }, [amountText, coins]);

  const usdt = amount / Math.max(1, coinsPerUsdt);
  const canExchange = amount >= minimumExchangeCoins && amount <= coins && stage === "edit";

  if (!open) return null;

  const handleMax = () => {
    setAmountText(String(coins));
    setMessage("");
  };

  const handleWatchAd = async () => {
    if (!canExchange) {
      setMessage(
        coins < minimumExchangeCoins
          ? t("exchangeModal.notEnoughCoins")
          : t("exchangeModal.minimumExchange", { amount: minimumExchangeCoins.toLocaleString() })
      );
      return;
    }

    setStage("watching");
    setMessage(t("exchangeModal.watchingAd"));

    try {
      await onPrepareAd(amount);
      await showRewardAdWithPulse("exchange");

      const verified = await onWaitForAdVerification();
      if (!verified) {
        throw new Error(t("exchangeModal.adFailed"));
      }

      await onConfirm(amount);
      onClose();
    } catch (err) {
      await onCancelAd();
      setMessage(notifyRewardAdError(err, t) ? "" : (err instanceof Error ? err.message : t("exchangeModal.adFailed")));
      setStage("edit");
    }
  };

  const handleBackdrop = () => {
    if (stage === "watching") return;
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-card exchange-modal exchange-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>{t("exchangeModal.eyebrow")}</p>
            <h2>{t("exchangeModal.title")}</h2>
          </div>

          <button className="modal-close" onClick={handleBackdrop} aria-label={t("common.close")}>
            <UiIcons name="back" className="modal-close-icon" />
          </button>
        </div>

        <div className="exchange-hero">
          <div className="exchange-orb" />
          <div>
            <span>{t("exchangeModal.rateLabel")}</span>
            <strong>{t("exchangeModal.rateValueDynamic", {
              coins: coinsPerUsdt.toLocaleString(),
            })}</strong>
          </div>
        </div>

        <label className="exchange-field">
          <span>{t("exchangeModal.amountLabel")}</span>
          <div className="exchange-input-row">
            <input
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder={t("exchangeModal.amountPlaceholder")}
            />
            <button className="exchange-max" onClick={handleMax} type="button">
              {t("exchangeModal.max")}
            </button>
          </div>
        </label>

        <div className="exchange-preview">
          <div>
            <span>{t("exchangeModal.youReceive")}</span>
            <strong>{usdt.toFixed(4)} USDT</strong>
          </div>

          <div>
            <span>{t("exchangeModal.available")}</span>
            <strong>{coins.toLocaleString()} {t("exchangeModal.coinsSuffix")}</strong>
          </div>
        </div>

        <div className="exchange-note">
          {message ? (
            <p>{message}</p>
          ) : (
            <p>
              {t("exchangeModal.noteDefault")}
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-button ghost" onClick={handleBackdrop} type="button">
            {t("exchangeModal.cancel")}
          </button>

          <button className="modal-button primary" onClick={handleWatchAd} type="button" disabled={!canExchange}>
            {stage === "watching" ? t("exchangeModal.confirmWatching") : t("exchangeModal.confirmWatch")}
          </button>
        </div>
      </div>
    </div>
  );
}

