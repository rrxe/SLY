import { useEffect, useMemo, useState } from "react";
import UiIcons from "../components/UiIcons";
import "../styles/profile.css";

type ActivityTone = "info" | "reward" | "exchange";

type Activity = {
  id: string;
  title: string;
  meta: string;
  tone: ActivityTone;
};

type WithdrawalHistoryEntry = {
  id: number;
  amount: number;
  method: "binance" | "bnb";
  target: string | null;
  bnbAmount: number | null;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
};

type Props = {
  lifetimeCoins: number;
  lifetimeSpent: number;
  usdtBalance: number;
  activities: Activity[];
  serverWalletAddress?: string | null;
  withdrawalHistory?: WithdrawalHistoryEntry[];
  onOpenExchange: () => void;
  onOpenWithdraw: () => void;
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
};

const WALLET_STORAGE_KEY = "sly.wallet.bep20.v1";
const TON_ADDRESS_PATTERN = /^(-?[0-9]:[a-fA-F0-9]{64}|[A-Za-z0-9_-]{48})$/;

function loadStoredAddress(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    return raw && TON_ADDRESS_PATTERN.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatHistoryDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatHistoryTarget(entry: {
  method: "binance" | "bnb";
  target: string | null;
}) {
  if (!entry.target) return "—";

  return entry.method === "bnb" && entry.target.length > 16
    ? truncateAddress(entry.target)
    : entry.target;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  completed: "Approved",
  rejected: "Rejected",
};

export default function Profile({
  lifetimeCoins,
  lifetimeSpent,
  usdtBalance,
  serverWalletAddress,
  withdrawalHistory,
  onOpenExchange,
  onOpenWithdraw,
  onWalletConnected,
  onWalletDisconnected,
}: Props) {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(() =>
    serverWalletAddress ?? loadStoredAddress()
  );
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const usdApprox = useMemo(() => `≈ $${usdtBalance.toFixed(2)}`, [usdtBalance]);

  const syncWalletToServer = async (address: string | null) => {
    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || "";

      await fetch("/api/profile/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `tga ${initData}`,
        },
        body: JSON.stringify({ walletAddress: address }),
      });
    } catch (err) {
      console.error("Failed to sync wallet with server", err);
    }
  };

  const handleConnect = () => {
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setError("Enter your TON wallet address.");
      return;
    }

    if (!TON_ADDRESS_PATTERN.test(trimmed)) {
      setError("That doesn't look like a valid TON address.");
      return;
    }

    try {
      window.localStorage.setItem(WALLET_STORAGE_KEY, trimmed);
    } catch {}

    setConnectedAddress(trimmed);
    setInputValue("");
    setError("");
    syncWalletToServer(trimmed);
    onWalletConnected?.(trimmed);
  };

  const handleDisconnect = () => {
    try {
      window.localStorage.removeItem(WALLET_STORAGE_KEY);
    } catch {}

    setConnectedAddress(null);
    setConfirmingDisconnect(false);
    syncWalletToServer(null);
    onWalletDisconnected?.();
  };

  const handleCopy = async () => {
    if (!connectedAddress) return;
    try {
      await navigator.clipboard.writeText(connectedAddress);
      setCopied(true);
    } catch {}
  };

  return (
    <section className="profile-page">
      <section className="wallet-hero">
        <div className="wallet-hero-top">
          <div>
            <p className="wallet-kicker">Wallet Center</p>
            <h1>{connectedAddress ? "Wallet connected" : "Connect your GRAM (TON) wallet"}</h1>
            <p className="wallet-lead">
              Link a TON address to withdraw as GRAM. Prefer Binance? You can also withdraw
              USDT directly to your Binance ID — no wallet needed for that option.
            </p>
          </div>

          <span className="wallet-chip">
            <span className="wallet-chip-dot" />
            TON
          </span>
        </div>

        {connectedAddress ? (
          <div className="wallet-connected">
            <div className="wallet-address-row">
              <div className="wallet-address-info">
                <span className="wallet-address-label">Connected address</span>
                <strong className="wallet-address-value">
                  {truncateAddress(connectedAddress)}
                </strong>
              </div>

              <div className="wallet-address-actions">
                <button className="wallet-icon-btn" onClick={handleCopy} type="button">
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  className="wallet-icon-btn danger"
                  onClick={() => setConfirmingDisconnect(true)}
                  type="button"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {confirmingDisconnect && (
              <div className="wallet-confirm">
                <span>Disconnect this wallet?</span>
                <div className="wallet-confirm-actions">
                  <button
                    className="wallet-confirm-btn ghost"
                    onClick={() => setConfirmingDisconnect(false)}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="wallet-confirm-btn danger"
                    onClick={handleDisconnect}
                    type="button"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="wallet-connect-form">
            <div className="wallet-input-row">
              <input
                className="wallet-input"
                placeholder="TON wallet address"
                value={inputValue}
                onChange={(event) => {
                  setInputValue(event.target.value);
                  if (error) setError("");
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
              />
              <button className="wallet-connect-btn" onClick={handleConnect} type="button">
                Connect
              </button>
            </div>

            {error ? <span className="wallet-error">{error}</span> : null}
          </div>
        )}
      </section>

      <section className="stats-bar">
        <div className="stats-bar-item">
          <span className="stats-bar-icon gold">
            <UiIcons name="coins" className="stats-bar-svg" />
          </span>
          <div className="stats-bar-text">
            <strong>{lifetimeCoins.toLocaleString()}</strong>
            <small>Earned</small>
          </div>
        </div>

        <div className="stats-bar-divider" />

        <div className="stats-bar-item">
          <span className="stats-bar-icon teal">
            <UiIcons name="coins" className="stats-bar-svg" />
          </span>
          <div className="stats-bar-text">
            <strong>{lifetimeSpent.toLocaleString()}</strong>
            <small>Exchanged</small>
          </div>
        </div>

        <div className="stats-bar-divider" />

        <div className="stats-bar-item">
          <span className="stats-bar-icon teal">
            <UiIcons name="exchange" className="stats-bar-svg" />
          </span>
          <div className="stats-bar-text">
            <strong>{usdtBalance.toFixed(4)}</strong>
            <small>USDT</small>
          </div>
        </div>
      </section>

      <p className="usdt-approx">{usdApprox}</p>

      <section className="profile-actions">
        <button className="profile-action primary" onClick={onOpenExchange}>
          <UiIcons name="exchange" className="profile-action-icon" />
          <span>Exchange Coins</span>
        </button>

        <button className="profile-action ghost" onClick={onOpenWithdraw}>
          <UiIcons name="withdraw" className="profile-action-icon" />
          <span>Withdraw USDT</span>
        </button>
      </section>

      <section className="withdraw-history-card">
        <div className="withdraw-history-head">
          <div>
            <p>Your requests</p>
            <h2>Withdrawal History</h2>
          </div>
          <UiIcons name="withdraw" className="withdraw-history-head-icon" />
        </div>

        <div className="withdraw-history-list">
          {!withdrawalHistory || withdrawalHistory.length === 0 ? (
            <div className="withdraw-history-empty">
              No withdrawal requests yet
            </div>
          ) : (
            withdrawalHistory.map((entry) => (
              <div key={entry.id} className="withdraw-history-item">
                <div className="withdraw-history-item-icon">
                  <UiIcons name="exchange" className="withdraw-history-item-svg" />
                </div>

                <div className="withdraw-history-item-body">
                  <strong>{Number(entry.amount).toFixed(4)} USDT</strong>
                  <small>
                    {entry.method === "binance" ? "Binance ID" : "GRAM Wallet (TON)"}
                    {" · "}
                    {formatHistoryTarget(entry)}
                  </small>
                  <small className="withdraw-history-date">
                    {formatHistoryDate(entry.createdAt)}
                  </small>
                </div>

                <span className={`withdraw-status-badge ${entry.status}`}>
                  {STATUS_LABELS[entry.status] || entry.status}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
