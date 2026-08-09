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

type Props = {
  walletCoins: number;
  lifetimeCoins: number;
  lifetimeSpent: number;
  usdtBalance: number;
  activities: Activity[];
  serverWalletAddress?: string | null;
  onOpenExchange: () => void;
  onOpenWithdraw: () => void;
  onWalletConnected?: (address: string) => void;
  onWalletDisconnected?: () => void;
};

const WALLET_STORAGE_KEY = "sly.wallet.bep20.v1";
const BEP20_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function loadStoredAddress(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(WALLET_STORAGE_KEY);
    return raw && BEP20_ADDRESS_PATTERN.test(raw) ? raw : null;
  } catch {
    return null;
  }
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Profile({
  walletCoins,
  lifetimeCoins,
  lifetimeSpent,
  usdtBalance,
  serverWalletAddress,
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
      const tg = window.Telegram?.WebApp;
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
      setError("Enter your BEP20 wallet address.");
      return;
    }

    if (!BEP20_ADDRESS_PATTERN.test(trimmed)) {
      setError("That doesn't look like a valid BEP20 (0x...) address.");
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
            <p className="wallet-kicker">WALLET CENTER</p>
            <h1>{connectedAddress ? "Wallet connected" : "Connect your USDT wallet"}</h1>
            <p className="wallet-lead">
              Link a BEP20 address to enable withdrawals. Only USDT on BNB Smart Chain (BEP20) is supported.
            </p>
          </div>

          <span className="wallet-chip">
            <span className="wallet-chip-dot" />
            BEP20
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
                placeholder="0x... BEP20 address"
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

      <section className="profile-stats">
        <article className="profile-stat highlight">
          <div className="profile-stat-top">
            <span className="profile-stat-icon gold">
              <UiIcons name="coins" className="profile-stat-svg" />
            </span>
            <span className="profile-stat-name">Total Earned</span>
          </div>
          <strong className="profile-stat-value">{lifetimeCoins.toLocaleString()}</strong>
          <small className="profile-stat-caption">Total coins earned over time</small>
        </article>

        <article className="profile-stat">
          <div className="profile-stat-top">
            <span className="profile-stat-icon teal">
              <UiIcons name="coins" className="profile-stat-svg" />
            </span>
            <span className="profile-stat-name">Total Exchanged</span>
          </div>
          <strong className="profile-stat-value">{lifetimeSpent.toLocaleString()}</strong>
          <small className="profile-stat-caption">Coins already converted</small>
        </article>

        <article className="profile-stat full">
          <div className="profile-stat-top">
            <span className="profile-stat-icon teal">
              <UiIcons name="exchange" className="profile-stat-svg" />
            </span>
            <span className="profile-stat-name">Available USDT</span>
          </div>
          <strong className="profile-stat-value">{usdtBalance.toFixed(4)}</strong>
          <small className="profile-stat-caption">{usdApprox}</small>
        </article>
      </section>

      <section className="profile-actions">
        <button className="profile-action primary" onClick={onOpenExchange}>
          <UiIcons name="exchange" className="profile-action-icon" />
          <span>Exchange Coins</span>
        </button>

        <button
          className="profile-action ghost"
          disabled={!connectedAddress}
          onClick={onOpenWithdraw}
        >
          <UiIcons name="withdraw" className="profile-action-icon" />
          <span>{connectedAddress ? "Withdraw USDT" : "Connect Wallet First"}</span>
        </button>
      </section>
    </section>
  );
}
