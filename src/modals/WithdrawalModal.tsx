import { useEffect, useRef, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/modals.css";

type WithdrawMethod = "binance" | "bnb";

type Props = {
  open: boolean;
  usdtBalance: number;
  walletAddress: string | null;
  withdrawalAdsWatched: number;
  withdrawalAdsRequired: number;
  nextWithdrawalAvailableAt: string | null;
  onWatchAd: () => Promise<void>;
  onClose: () => void;
  onConfirm: (amount: number, method: WithdrawMethod, target: string) => void;
};

type AdsgramShowResult = {
  done: boolean;
  description: string;
  state: "load" | "render" | "playing" | "destroy";
  error: boolean;
};

type AdsgramController = {
  show: () => Promise<AdsgramShowResult>;
};

declare global {
  interface Window {
    Adsgram?: {
      init: (opts: { blockId: string }) => AdsgramController;
    };
  }
}

// نفس البلوك المستخدم في بقية التطبيق
const ADSGRAM_BLOCK_ID = "int-43434";
// مدة عرض الإعلان قبل احتساب المشاهدة (إعلانات Adsgram لا يمكن تخطّيها)
const AD_WATCH_DURATION_MS = 10000;

const MIN_WITHDRAW = 0.1;

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export default function WithdrawalModal({
  open,
  usdtBalance,
  walletAddress,
  withdrawalAdsWatched,
  withdrawalAdsRequired,
  nextWithdrawalAvailableAt,
  onWatchAd,
  onClose,
  onConfirm,
}: Props) {
  const [method, setMethod] = useState<WithdrawMethod>("binance");
  const [amountText, setAmountText] = useState("");
  const [binanceId, setBinanceId] = useState("");
  const [error, setError] = useState("");
  const [watchingAd, setWatchingAd] = useState(false);
  const [cooldownText, setCooldownText] = useState("");
  const adsgramControllerRef = useRef<AdsgramController | null>(null);

  useEffect(() => {
    if (!open) {
      setAmountText("");
      setBinanceId("");
      setError("");
      setMethod("binance");
    }
  }, [open]);

  useEffect(() => {
    if (!open || !nextWithdrawalAvailableAt) {
      setCooldownText("");
      return;
    }

    const target = new Date(nextWithdrawalAvailableAt).getTime();

    const tick = () => {
      const remaining = target - Date.now();
      setCooldownText(remaining > 0 ? formatCountdown(remaining) : "");
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [open, nextWithdrawalAvailableAt]);

  if (!open) return null;

  const adsComplete = withdrawalAdsWatched >= withdrawalAdsRequired;
  const inCooldown = Boolean(cooldownText);

  const handleMax = () => {
    setAmountText(String(usdtBalance.toFixed(4)));
    setError("");
  };

  const handleWatchAd = async () => {
    if (watchingAd || adsComplete) return;
    setWatchingAd(true);

    try {
      if (!adsgramControllerRef.current && window.Adsgram) {
        adsgramControllerRef.current = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
      }

      if (adsgramControllerRef.current) {
        // نطلق عرض الإعلان، وبما أنه لا يمكن تخطيه ننتظر مدة العرض القياسية بالتوازي
        adsgramControllerRef.current.show().catch(() => {
          // نتجاهل الفشل (عدم توفر إعلان...) ونكمل بعد المهلة أدناه
        });
      }
    } catch {
      // نكمل حتى لو فشل تهيئة الإعلان
    }

    // إعلانات Adsgram لا تدعم التخطي، فننتظر مدة العرض قبل احتساب المشاهدة
    await new Promise((resolve) => setTimeout(resolve, AD_WATCH_DURATION_MS));

    await onWatchAd();
    setWatchingAd(false);
  };

  const handleWithdraw = () => {
    if (inCooldown) {
      setError(`You can withdraw again in ${cooldownText}`);
      return;
    }

    if (!adsComplete) {
      setError(`Watch ${withdrawalAdsRequired - withdrawalAdsWatched} more ad(s) to unlock withdrawal.`);
      return;
    }

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

        {inCooldown ? (
          <div className="withdraw-cooldown-note">
            <span>Next withdrawal available in</span>
            <strong>{cooldownText}</strong>
          </div>
        ) : (
          <div className="withdraw-ads-gate">
            <div className="withdraw-ads-gate-top">
              <span>Watch ads to unlock withdrawal</span>
              <strong>{withdrawalAdsWatched}/{withdrawalAdsRequired}</strong>
            </div>
            <div className="withdraw-ads-progress">
              <span
                style={{
                  width: `${Math.min(100, (withdrawalAdsWatched / withdrawalAdsRequired) * 100)}%`,
                }}
              />
            </div>
            <button
              type="button"
              className="withdraw-watch-ad-btn"
              onClick={handleWatchAd}
              disabled={watchingAd || adsComplete}
            >
              {adsComplete ? "Unlocked ✓" : watchingAd ? "Watching..." : "Watch Ad"}
            </button>
          </div>
        )}

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
          <button
            className="modal-button primary"
            onClick={handleWithdraw}
            type="button"
            disabled={inCooldown || !adsComplete}
          >
            Confirm Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
