import { useEffect, useMemo, useRef, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/modals.css";

type Props = {
  open: boolean;
  coins: number;
  onClose: () => void;
  onConfirm: (amountCoins: number) => void;
};

type AdsgramShowResult = {
  done: boolean;
  description: string;
  state: "load" | "render" | "playing" | "destroy";
  error: boolean;
};

type AdsgramController = {
  show: () => Promise<AdsgramShowResult>;
  addEventListener?: (event: string, callback: () => void) => void;
};

declare global {
  interface Window {
    Adsgram?: {
      init: (opts: { blockId: string }) => AdsgramController;
    };
  }
}

// نفس بلوك المكافأة (reward) المستخدم في بوابة السحب — يتحقق من اكتمال مشاهدة الإعلان فعلياً
const ADSGRAM_BLOCK_ID = "46086";

const MIN_COINS = 1000;
const RATE = 0.0000025;

export default function ExchangeModal({
  open,
  coins,
  onClose,
  onConfirm,
}: Props) {
  const adsgramControllerRef = useRef<AdsgramController | null>(null);
  const [amountText, setAmountText] = useState("5000");
  const [stage, setStage] = useState<"edit" | "watching">("edit");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setStage("edit");
      setMessage("");
      return;
    }

    setAmountText(String(Math.max(MIN_COINS, Math.min(coins, 5000))));
    setStage("edit");
    setMessage("");
  }, [open, coins]);

  const amount = useMemo(() => {
    const parsed = Math.floor(Number(amountText));
    if (Number.isNaN(parsed)) return 0;
    return Math.max(0, Math.min(parsed, coins));
  }, [amountText, coins]);

  const usdt = amount * RATE;
  const canExchange = amount >= MIN_COINS && amount <= coins && stage === "edit";

  if (!open) return null;

  const handleMax = () => {
    setAmountText(String(coins));
    setMessage("");
  };

  const handleWatchAd = async () => {
    if (!canExchange) {
      setMessage(
        coins < MIN_COINS
          ? "Not enough coins for exchange."
          : `Minimum exchange is ${MIN_COINS.toLocaleString()} coins.`
      );
      return;
    }

    setStage("watching");
    setMessage("Watching ad...");

    try {
      if (!adsgramControllerRef.current && window.Adsgram) {
        adsgramControllerRef.current = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
      }

      if (!adsgramControllerRef.current) {
        setMessage("Ads are currently unavailable. Please try again.");
        setStage("edit");
        return;
      }

      await adsgramControllerRef.current.show();
    } catch {
      setMessage("The ad could not be completed. Please try again.");
      setStage("edit");
      return;
    }

    onConfirm(amount);
    onClose();
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
            <p>Exchange</p>
            <h2>Coins → USDT</h2>
          </div>

          <button className="modal-close" onClick={handleBackdrop} aria-label="Close modal">
            <UiIcons name="back" className="modal-close-icon" />
          </button>
        </div>

        <div className="exchange-hero">
          <div className="exchange-orb" />
          <div>
            <span>Rate</span>
            <strong>1000 Coins = 0.0025 USDT</strong>
          </div>
        </div>

        <label className="exchange-field">
          <span>Amount</span>
          <div className="exchange-input-row">
            <input
              value={amountText}
              onChange={(e) => setAmountText(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="Enter coins"
            />
            <button className="exchange-max" onClick={handleMax} type="button">
              MAX
            </button>
          </div>
        </label>

        <div className="exchange-preview">
          <div>
            <span>You receive</span>
            <strong>{usdt.toFixed(4)} USDT</strong>
          </div>

          <div>
            <span>Available</span>
            <strong>{coins.toLocaleString()} Coins</strong>
          </div>
        </div>

        <div className="exchange-note">
          {message ? (
            <p>{message}</p>
          ) : (
            <p>
              You will watch an ad before the exchange is confirmed. After that,
              the coins are deducted and USDT is added instantly.
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button className="modal-button ghost" onClick={handleBackdrop} type="button">
            Cancel
          </button>

          <button className="modal-button primary" onClick={handleWatchAd} type="button" disabled={!canExchange}>
            {stage === "watching" ? "Watching Ad..." : "Watch Ad & Exchange"}
          </button>
        </div>
      </div>
    </div>
  );
}
