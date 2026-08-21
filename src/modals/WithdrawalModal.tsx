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
  onConfirm: (
    amount: number,
    method: WithdrawMethod,
    target: string
  ) => void;
};

type AdsgramShowResult = {
  done: boolean;
  description: string;
  state:
    | "load"
    | "render"
    | "playing"
    | "destroy";
  error: boolean;
};

type AdsgramController = {
  show: () => Promise<AdsgramShowResult>;
};

declare global {
  interface Window {
    Adsgram?: {
      init: (opts: {
        blockId: string;
      }) => AdsgramController;
    };
  }
}

// AdsGram Reward Block ID
const ADSGRAM_REWARD_BLOCK_ID = "43643";

// مهلة بسيطة بعد انتهاء الإعلان لإعطاء الـwebhook وقت يوصل
const WEBHOOK_GRACE_MS = 2500;

const MIN_WITHDRAW = 0.1;
const MAX_WITHDRAW = 0.2;

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
  const [method, setMethod] =
    useState<WithdrawMethod>("binance");

  const [amountText, setAmountText] =
    useState("");

  const [binanceId, setBinanceId] =
    useState("");

  const [error, setError] =
    useState("");

  const [watchingAd, setWatchingAd] =
    useState(false);

  const adsgramControllerRef =
    useRef<AdsgramController | null>(null);

  useEffect(() => {
    if (!open) {
      setAmountText("");
      setBinanceId("");
      setError("");
      setMethod("binance");
    }
  }, [open]);

  if (!open) return null;

  const requiredAds =
    Math.max(
      1,
      Number(
        withdrawalAdsRequired || 10
      )
    );

  const watchedAds =
    Math.max(
      0,
      Number(
        withdrawalAdsWatched || 0
      )
    );

  const adsComplete =
    watchedAds >= requiredAds;

  const handleMax = () => {
    const maxAllowed =
      Math.min(
        MAX_WITHDRAW,
        Math.max(
          0,
          Number(usdtBalance || 0)
        )
      );

    setAmountText(
      maxAllowed.toFixed(4)
    );

    setError("");
  };

  const handleAmountChange = (
    value: string
  ) => {
    setAmountText(value);
    setError("");

    const amount =
      Number(value);

    if (
      Number.isFinite(amount) &&
      amount > MAX_WITHDRAW
    ) {
      setError(
        `Maximum withdrawal is ${MAX_WITHDRAW} USDT per withdrawal.`
      );
    }
  };

  const handleWatchAd = async () => {
    if (
      watchingAd ||
      adsComplete
    ) {
      return;
    }

    setWatchingAd(true);
    setError("");

    try {
      if (
        !adsgramControllerRef.current &&
        window.Adsgram
      ) {
        adsgramControllerRef.current =
          window.Adsgram.init({
            blockId:
              ADSGRAM_REWARD_BLOCK_ID,
          });
      }

      if (
        !adsgramControllerRef.current
      ) {
        setError(
          "Ads are currently unavailable. Please try again."
        );

        setWatchingAd(false);
        return;
      }

      await adsgramControllerRef.current.show();

      // ننتظر قليلاً حتى يصل webhook من AdsGram
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          WEBHOOK_GRACE_MS
        )
      );

      await onWatchAd();
    } catch {
      setError(
        "The ad could not be completed. Please try again."
      );
    } finally {
      setWatchingAd(false);
    }
  };

  const handleWithdraw = () => {
    if (!adsComplete) {
      setError(
        `Watch ${
          requiredAds - watchedAds
        } more ad(s) to unlock withdrawal.`
      );

      return;
    }

    const amount =
      Number(amountText);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid amount."
      );

      return;
    }

    if (
      amount < MIN_WITHDRAW
    ) {
      setError(
        `Minimum withdrawal is ${MIN_WITHDRAW} USDT.`
      );

      return;
    }

    if (
      amount > MAX_WITHDRAW
    ) {
      setError(
        `Maximum withdrawal is ${MAX_WITHDRAW} USDT per withdrawal.`
      );

      return;
    }

    if (
      amount > usdtBalance
    ) {
      setError(
        "Insufficient USDT balance."
      );

      return;
    }

    if (
      method === "binance"
    ) {
      const trimmed =
        binanceId.trim();

      if (!trimmed) {
        setError(
          "Enter your Binance ID."
        );

        return;
      }

      onConfirm(
        Number(
          amount.toFixed(4)
        ),
        "binance",
        trimmed
      );

      onClose();
      return;
    }

    if (!walletAddress) {
      setError(
        "Connect a BNB wallet address from your Profile first."
      );

      return;
    }

    onConfirm(
      Number(
        amount.toFixed(4)
      ),
      "bnb",
      walletAddress
    );

    onClose();
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card exchange-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="modal-head">
          <div>
            <p>Withdraw</p>

            <h2>
              Withdraw USDT
            </h2>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <UiIcons
              name="back"
              className="modal-close-icon"
            />
          </button>
        </div>

        <div className="withdraw-ads-gate">
          <div className="withdraw-ads-gate-top">
            <span>
              Watch ads to unlock withdrawal
            </span>

            <strong>
              {watchedAds}/{requiredAds}
            </strong>
          </div>

          <div className="withdraw-ads-progress">
            <span
              style={{
                width: `${Math.min(
                  100,
                  (watchedAds /
                    requiredAds) *
                    100
                )}%`,
              }}
            />
          </div>

          <button
            type="button"
            className="withdraw-watch-ad-btn"
            onClick={
              handleWatchAd
            }
            disabled={
              watchingAd ||
              adsComplete
            }
          >
            {adsComplete
              ? "Unlocked ✓"
              : watchingAd
              ? "Watching..."
              : "Watch Ad"}
          </button>
        </div>

        <div className="withdraw-method-row">
          <button
            type="button"
            className={`withdraw-method-btn ${
              method === "binance"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setMethod("binance");
              setError("");
            }}
          >
            Binance ID (USDT)
          </button>

          <button
            type="button"
            className={`withdraw-method-btn ${
              method === "bnb"
                ? "active"
                : ""
            }`}
            onClick={() => {
              setMethod("bnb");
              setError("");
            }}
          >
            BNB Wallet
          </button>
        </div>

        {method ===
        "binance" ? (
          <label className="exchange-field">
            <span>
              Binance ID
            </span>

            <div className="exchange-input-row">
              <input
                type="text"
                value={binanceId}
                onChange={(e) => {
                  setBinanceId(
                    e.target.value
                  );
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
                <span>
                  Payout to connected wallet
                </span>

                <strong>
                  {walletAddress.slice(
                    0,
                    6
                  )}
                  ...
                  {walletAddress.slice(
                    -4
                  )}
                </strong>
              </>
            ) : (
              <span className="withdraw-bnb-warning">
                No wallet connected. Connect a BEP20 address from your Profile
                page first.
              </span>
            )}
          </div>
        )}

        <label className="exchange-field">
          <span>
            Amount (USDT)
          </span>

          <div className="exchange-input-row">
            <input
              type="number"
              min={MIN_WITHDRAW}
              max={MAX_WITHDRAW}
              step="0.01"
              value={amountText}
              onChange={(e) =>
                handleAmountChange(
                  e.target.value
                )
              }
              placeholder={`Min ${MIN_WITHDRAW} / Max ${MAX_WITHDRAW} USDT`}
            />

            <button
              className="exchange-max"
              onClick={handleMax}
              type="button"
            >
              MAX
            </button>
          </div>
        </label>

        <div className="exchange-preview">
          <div>
            <span>
              Available Balance
            </span>

            <strong>
              {usdtBalance.toFixed(4)}
              USDT
            </strong>
          </div>
        </div>

        <div className="exchange-note">
          {error ? (
            <p
              style={{
                color: "#ff6b6b",
              }}
            >
              {error}
            </p>
          ) : (
            <p>
              {method === "binance"
                ? "Funds will be sent as USDT directly to your Binance account ID."
                : "Funds will be sent as BNB (converted at live price) to your connected wallet — cheaper network fees outside Binance."}
            </p>
          )}

          {!error && (
            <p
              style={{
                marginTop: 6,
              }}
            >
              Minimum withdrawal:{" "}
              {MIN_WITHDRAW} USDT
              {" • "}
              Maximum per withdrawal:{" "}
              {MAX_WITHDRAW} USDT
            </p>
          )}
        </div>

        <div className="modal-actions">
          <button
            className="modal-button ghost"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>

          <button
            className="modal-button primary"
            onClick={handleWithdraw}
            type="button"
            disabled={!adsComplete}
          >
            Confirm Withdraw
          </button>
        </div>
      </div>
    </div>
  );
}
