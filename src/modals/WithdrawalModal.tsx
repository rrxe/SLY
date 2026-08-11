import { useEffect, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/modals.css";

type Props = {
  open: boolean;
  usdtBalance: number;
  onClose: () => void;
  onConfirm: (amount: number) => void;
};

const MIN_WITHDRAW = 0.1;

export default function WithdrawalModal({
  open,
  usdtBalance,
  onClose,
  onConfirm,
}: Props) {
  const [amountText, setAmountText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setAmountText("");
      setError("");
    }
  }, [open]);

  if (!open) return null;

  const handleMax = () => {
    setAmountText(String(usdtBalance.toFixed(4)));
    setError("");
  };

  const handleWithdraw = () => {
    const amount = Number(amountText);
    
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (amount > usdtBalance) {
      setError("Insufficient USDT balance.");
      return;
    }
    if (amount < MIN_WITHDRAW) {
      setError(`Minimum withdrawal is ${MIN_WITHDRAW} USDT.`);
      return;
    }

    onConfirm(amount);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card exchange-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <p>Withdraw</p>
            <h2>Withdraw USDT</h2>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <UiIcons name="back" className="modal-close-icon" />
          </button>
        </div>

        <label className="exchange-field">
          <span>Amount (USDT)</span>
          <div className="exchange-input-row">
            <input
              type="number"
              value={amountText}
              onChange={(e) => {
                setAmountText(e.target.value);
                setError("");
              }}
              placeholder={`Min ${MIN_WITHDRAW} USDT`}
            />
            <button className="exchange-max" onClick={handleMax} type="button">
              MAX
            </button>
          </div>
        </label>

        <div className="exchange-preview">
          <div>
            <span>Available Balance</span>
            <strong>{usdtBalance.toFixed(4)} USDT</strong>
          </div>
        </div>

        <div className="exchange-note">
          {error ? (
            <p style={{ color: "#ff6b6b" }}>{error}</p>
          ) : (
            <p>Funds will be sent to your connected BEP20 address.</p>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-button ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="modal-button primary" onClick={handleWithdraw} type="button">
            Confirm Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
