import { useEffect, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/modals.css";

type WithdrawMethod = "binance" | "bnb";

type Props = {
  open: boolean;
  usdtBalance: number;
  walletAddress: string | null;
  onClose: () => void;
  onConfirm: (amount: number, method: WithdrawMethod, target: string) => void;
};

const MIN_WITHDRAW = 0.1;

export default function WithdrawalModal({
  open,
  usdtBalance,
  walletAddress,
  onClose,
  onConfirm,
}: Props) {
  const [method, setMethod] = useState<WithdrawMethod>("binance");
  const [amountText, setAmountText] = useState("");
  const [binanceId, setBinanceId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setAmountText("");
      setBinanceId("");
      setError("");
      setMethod("binance");
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

    if (method === "binance") {
      const trimmed = binanceId.trim();
      if (!trimmed) {
        setError("Enter your Binance ID.");
        return;
      }
      onConfirm(amount, "binance", trimmed);
      onClose();
      return;
    }

    // method === "bnb"
    if (!walletAddress) {
      setError("Connect a BNB wallet address from your Profile first.");
      return;
    }
    onConfirm(amount, "bnb", walletAddress);
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

        <div className="withdraw-method-row">
          <button
            type="button"
            className={`withdraw-method-btn ${method === "binance" ? "active" : ""}`}
            onClick={() => {
              setMethod("binance");
              setError("");
            }}
          >
            Binance ID (USDT)
          </button>
          <button
            type="button"
            className={`withdraw-method-btn ${method === "bnb" ? "active" : ""}`}
            onClick={() => {
              setMethod("bnb");
              setError("");
            }}
          >
            BNB Wallet
          </button>
        </div>

        {method === "binance" ? (
          <label className="exchange-field">
            <span>Binance ID</span>
            <div className="exchange-input-row">
              <input
                type="text"
                value={binanceId}
                onChange={(e) => {
                  setBinanceId(e.target.value);
                  setError("");
                }}
                placeholder="Your Binance User ID"
              />
            </div>
          </label>
        ) : (
          <div className="withdraw-bnb-note">
            {walletAddress ? (
              <>
                <span>Payout to connected wallet</span>
                <strong>
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </strong>
              </>
            ) : (
              <span className="withdraw-bnb-warning">
                No wallet connected. Connect a BEP20 address from your Profile page first.
              </span>
            )}
          </div>
        )}

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
          ) : method === "binance" ? (
            <p>Funds will be sent as USDT directly to your Binance account ID.</p>
          ) : (
            <p>Funds will be sent as BNB (converted at live price) to your connected wallet — cheaper network fees outside Binance.</p>
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
