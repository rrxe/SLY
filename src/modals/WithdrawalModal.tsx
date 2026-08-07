import { useEffect, useMemo, useRef, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/modals.css";

type Props = {
  open: boolean;
  usdtBalance: number;
  onClose: () => void;
  onConfirm: (amountUsdt: number, address: string) => void;
};

const MIN_USDT = 0.1;
const NETWORK_LABEL = "BEP20 (BSC)";

export default function WithdrawalModal({
  open,
  usdtBalance,
  onClose,
  onConfirm,
}: Props) {
  const timerRef = useRef<number | null>(null);
  const [amountText, setAmountText] = useState("0.1");
  const [address, setAddress] = useState("");
  const [stage, setStage] = useState<"edit" | "watching">("edit");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setStage("edit");
      setMessage("");
      return;
    }

    setAmountText(String(Math.max(MIN_USDT, Math.min(usdtBalance, MIN_USDT))));
    setAddress("");
    setStage("edit");
    setMessage("");
  }, [open, usdtBalance]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const amount = useMemo(() => {
    const parsed = Number(amountText);
    if (Number.isNaN(parsed)) return 0;
    return Math.max(0, Math.min(parsed, usdtBalance));
  }, [amountText, usdtBalance]);

  const addressValid = address.trim().length >= 20;
  const canWithdraw =
    amount >= MIN_USDT &&
    amount <= usdtBalance &&
    addressValid &&
    stage === "edit";

  if (!open) return null;

  const handleMax = () => {
    setAmountText(String(usdtBalance));
    setMessage("");
  };

  const handleWatchAd = () => {
    if (!canWithdraw) {
      if (usdtBalance < MIN_USDT) {
        setMessage("Not enough USDT for withdrawal.");
      } else if (amount < MIN_USDT) {
        setMessage(`Minimum withdrawal is ${MIN_USDT} USDT.`);
      } else if (!addressValid) {
        setMessage("Enter a valid wallet address.");
      }
      return;
    }

    setStage("watching");
    setMessage("Watching ad...");

    timerRef.current = window.setTimeout(() => {
      onConfirm(amount, address.trim());
      onClose();
    }, 1400);
  };

  const handleBackdrop = () => {
    if (stage === "watching") return;
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-card exchange-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>Withdrawal</p>
            <h2>USDT → Wallet</h2>
          </div>

          <button className="modal-close" onClick={handleBackdrop} aria-label="Close modal">
            <UiIcons name="back" className="modal-close-icon" />
          </button>
        </div>

        <div className="exchange-hero">
          <div className="exchange-orb" />
          <div>
            <span>Network</span>
            <strong>{NETWORK_LABEL}</strong>
          </div>
        </div>

        <label className="exchange-field">
          <span>Amount (USDT)</span>
          <div className="exchange-input-row">
            <input
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder="Enter USDT amount"
            />
            <button className="exchange-max" onClick={handleMax} type="button">
              MAX
            </button>
          </div>
        </label>

        <label className="exchange-field">
          <span>Wallet address</span>
          <div className="exchange-input-row">
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Paste your BEP20 address"
            />
          </div>
        </label>

        <div className="exchange-preview">
          <div>
            <span>You send</span>
            <strong>{amount.toFixed(4)} USDT</strong>
          </div>

          <div>
            <span>Available</span>
            <strong>{usdtBalance.toFixed(4)} USDT</strong>
          </div>
        </div>

        <div className="exchange-note">
          {message ? (
            <p>{message}</p>
          ) : (
            <p>
              You will watch an ad before the withdrawal is confirmed. Make sure
              the address supports the {NETWORK_LABEL} network, wrong addresses
              cannot be recovered.
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-button ghost" onClick={handleBackdrop} type="button">
            Cancel
          </button>

          <button
            className="modal-button primary"
            onClick={handleWatchAd}
            type="button"
            disabled={!canWithdraw || stage === "watching"}
          >
            {stage === "watching" ? "Watching Ad..." : "Watch Ad & Withdraw"}
          </button>
        </div>
      </div>
    </div>
  );
}
