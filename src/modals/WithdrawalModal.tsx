import { useEffect, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/modals.css";
import { useLanguage } from "../i18n/LanguageContext";

type WithdrawMethod = "bnb" | "sham_cash";

type Props = {
  open: boolean;
  usdtBalance: number;
  walletAddress: string | null;
  onClose: () => void;
  onConfirm: (
    amount: number,
    method: WithdrawMethod,
    target: string
  ) => void;
};

const MIN_WITHDRAW = 0.05;
const MAX_WITHDRAW = 0.5;

export default function WithdrawalModal({
  open,
  usdtBalance,
  walletAddress,
  onClose,
  onConfirm,
}: Props) {
  const { t } = useLanguage();
  const [amountText, setAmountText] = useState("");
  const [method, setMethod] = useState<WithdrawMethod>("bnb");
  const [recipient, setRecipient] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setAmountText("");
      setMethod("bnb");
      setRecipient("");
      setError("");
      return;
    }

    setMethod("bnb");
    setRecipient(walletAddress || "");
  }, [open, walletAddress]);

  if (!open) return null;

  const handleMethodChange = (nextMethod: WithdrawMethod) => {
    setMethod(nextMethod);
    setRecipient(nextMethod === "bnb" ? walletAddress || "" : "");
    setError("");
  };

  const handleMax = () => {
    const maxAllowed = Math.min(
      MAX_WITHDRAW,
      Math.max(0, Number(usdtBalance || 0))
    );

    setAmountText(maxAllowed.toFixed(4));
    setError("");
  };

  const handleAmountChange = (value: string) => {
    setAmountText(value);
    setError("");

    const amount = Number(value);
    if (Number.isFinite(amount) && amount > MAX_WITHDRAW) {
      setError(t("withdrawModal.errorMaxPerWithdrawal", { max: MAX_WITHDRAW }));
    }
  };

  const handleWithdraw = () => {
    const amount = Number(amountText);

    if (!Number.isFinite(amount) || amount <= 0) {
      setError(t("withdrawModal.errorEnterValidAmount"));
      return;
    }

    if (amount < MIN_WITHDRAW) {
      setError(t("withdrawModal.errorMinWithdrawal", { min: MIN_WITHDRAW }));
      return;
    }

    if (amount > MAX_WITHDRAW) {
      setError(t("withdrawModal.errorMaxPerWithdrawal", { max: MAX_WITHDRAW }));
      return;
    }

    if (amount > usdtBalance) {
      setError(t("withdrawModal.errorInsufficientBalance"));
      return;
    }

    const trimmedRecipient = recipient.trim();
    if (!trimmedRecipient) {
      setError(
        method === "sham_cash"
          ? t("withdrawModal.errorEnterShamCashLink")
          : t("withdrawModal.errorEnterGramAddress")
      );
      return;
    }

    onConfirm(Number(amount.toFixed(4)), method, trimmedRecipient);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card exchange-modal withdrawal-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <p>{t("withdrawModal.eyebrow")}</p>
            <h2>{t("withdrawModal.title")}</h2>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <UiIcons name="back" className="modal-close-icon" />
          </button>
        </div>

        <div className="withdraw-method-row" role="group" aria-label={t("withdrawModal.paymentMethod")}>
          <button
            type="button"
            className={`withdraw-method-btn ${method === "bnb" ? "active" : ""}`}
            onClick={() => handleMethodChange("bnb")}
            aria-pressed={method === "bnb"}
          >
            {t("withdrawModal.gramMethod")}
          </button>
          <button
            type="button"
            className={`withdraw-method-btn ${method === "sham_cash" ? "active" : ""}`}
            onClick={() => handleMethodChange("sham_cash")}
            aria-pressed={method === "sham_cash"}
          >
            {t("withdrawModal.shamCashMethod")}
          </button>
        </div>

        <label className="exchange-field">
          <span>
            {method === "sham_cash"
              ? t("withdrawModal.shamCashLinkLabel")
              : t("withdrawModal.gramAddressLabel")}
          </span>
          <div className="exchange-input-row">
            <input
              type="text"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
                setError("");
              }}
              placeholder={
                method === "sham_cash"
                  ? t("withdrawModal.shamCashLinkPlaceholder")
                  : t("withdrawModal.gramAddressPlaceholder")
              }
              inputMode={method === "sham_cash" ? "url" : "text"}
              autoComplete="off"
            />
          </div>
        </label>

        <label className="exchange-field">
          <span>{t("withdrawModal.amountLabel")}</span>
          <div className="exchange-input-row">
            <input
              type="number"
              min={MIN_WITHDRAW}
              max={MAX_WITHDRAW}
              step="0.01"
              value={amountText}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder={t("withdrawModal.amountPlaceholder", { min: MIN_WITHDRAW, max: MAX_WITHDRAW })}
            />
            <button className="exchange-max" onClick={handleMax} type="button">
              {t("withdrawModal.max")}
            </button>
          </div>
        </label>

        <div className="exchange-preview">
          <div>
            <span>{t("withdrawModal.availableBalance")}</span>
            <strong>{usdtBalance.toFixed(4)} USDT</strong>
          </div>
        </div>

        <div className="exchange-note">
          {error ? (
            <p style={{ color: "#ff6b6b" }}>{error}</p>
          ) : (
            <p>
              {method === "sham_cash"
                ? t("withdrawModal.noteShamCash")
                : t("withdrawModal.noteGram")}
            </p>
          )}
          {!error && (
            <p style={{ marginTop: 6 }}>
              {t("withdrawModal.minMax", { min: MIN_WITHDRAW, max: MAX_WITHDRAW })}
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-button ghost" onClick={onClose} type="button">
            {t("withdrawModal.cancel")}
          </button>
          <button className="modal-button primary" onClick={handleWithdraw} type="button">
            {t("withdrawModal.confirmWithdraw")}
          </button>
        </div>
      </div>
    </div>
  );
}
