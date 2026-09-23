import { useCallback, useEffect, useMemo, useState } from "react";
import UiIcons from "../components/UiIcons";
import { useLanguage } from "../i18n/LanguageContext";
import "../styles/withdrawal.css";

type LiveWithdrawal = {
  id: string;
  user: string;
  amount: number;
  method: "binance" | "bnb";
  status: "pending" | "completed";
  createdAt: string;
};

type Props = {
  coins: number;
  usdt: number;
  withdrawalAdsWatched: number;
  withdrawalAdsRequired: number;
  onOpenExchange: () => void;
  onOpenWithdraw: () => void;
};

function formatRelativeTime(value: string) {
  const stamp = new Date(value).getTime();
  if (!Number.isFinite(stamp)) return "—";

  const diff = Math.max(0, Date.now() - stamp);
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Withdrawal({
  coins,
  usdt,
  onOpenExchange,
  onOpenWithdraw,
}: Props) {
  const { t } = useLanguage();
  const [live, setLive] = useState<LiveWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLive = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch("/api/withdrawals/live", {
        method: "GET",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && Array.isArray(data.withdrawals)) {
        setLive(data.withdrawals);
      }
    } catch {
      // The rest of the withdrawal UI stays usable when the live feed is unavailable.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const interval = window.setInterval(() => fetchLive(true), 25000);
    return () => window.clearInterval(interval);
  }, [fetchLive]);

  const latestTen = useMemo(
    () => live.filter((item) => item.status === "pending" || item.status === "completed").slice(0, 10),
    [live]
  );

  return (
    <section className="withdrawal-page">
      <header className="withdrawal-page-head">
        <div>
          <span className="withdrawal-kicker">
            <i className="withdrawal-live-dot" />
            {t("withdrawal.livePayouts")}
          </span>
          <h1>{t("withdrawal.title")}</h1>
          <p>{t("withdrawal.subtitle")}</p>
        </div>
        <button
          className={`withdrawal-refresh ${refreshing ? "spinning" : ""}`}
          type="button"
          onClick={() => fetchLive(true)}
          aria-label={t("withdrawal.refresh")}
        >
          <span />
          <span />
        </button>
      </header>

      <section className="withdrawal-balance-card">
        <div className="withdrawal-balance-glow" />
        <div className="withdrawal-balance-main">
          <span>{t("withdrawal.availableBalance")}</span>
          <strong>
            {usdt.toFixed(4)} <em>USDT</em>
          </strong>
          <small>{t("withdrawal.readyToWithdraw")}</small>
        </div>

        <div className="withdrawal-coin-badge">
          <UiIcons name="coins" className="withdrawal-coin-icon" />
          <div>
            <span>{t("withdrawal.coinsBalance")}</span>
            <strong>{coins.toLocaleString()}</strong>
          </div>
        </div>

        <div className="withdrawal-balance-actions">
          <button type="button" className="withdrawal-action secondary" onClick={onOpenExchange}>
            <UiIcons name="exchange" />
            <span>{t("withdrawal.exchange")}</span>
          </button>
          <button type="button" className="withdrawal-action primary" onClick={onOpenWithdraw}>
            <UiIcons name="withdraw" />
            <span>{t("withdrawal.withdrawUsdt")}</span>
          </button>
        </div>
      </section>


      <section className="withdrawal-section-card">
        <div className="withdrawal-section-head">
          <div>
            <span>{t("withdrawal.communityFeed")}</span>
            <h2>{t("withdrawal.latestWithdrawals")}</h2>
            <p>{t("withdrawal.latestWithdrawalsSub")}</p>
          </div>
          <span className="withdrawal-auto-refresh">
            <i />
            {t("withdrawal.autoRefresh")}
          </span>
        </div>

        <div className="withdrawal-feed-meta">
          <span>{t("withdrawal.latestWithdrawalsSub")}</span>
          <strong>{latestTen.length}/10</strong>
        </div>

        <div className="withdrawal-live-list">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div className="withdrawal-live-row skeleton" key={index}>
                <span />
                <div><span /><small /></div>
                <div><span /><small /></div>
              </div>
            ))
          ) : latestTen.length === 0 ? (
            <div className="withdrawal-empty">
              <UiIcons name="withdraw" />
              <strong>{t("withdrawal.noLiveWithdrawals")}</strong>
              <span>{t("withdrawal.noLiveWithdrawalsSub")}</span>
            </div>
          ) : (
            latestTen.map((item) => (
              <article className="withdrawal-live-row" key={item.id}>
                <div className={`withdrawal-method-icon ${item.method}`}>
                  {item.method === "binance" ? "B" : "T"}
                </div>
                <div className="withdrawal-live-user">
                  <strong>{item.user}</strong>
                  <span>
                    {item.method === "binance" ? t("withdrawal.binance") : t("withdrawal.ton")} · {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
                <div className="withdrawal-live-amount">
                  <strong>{Number(item.amount).toFixed(4)} <small>USDT</small></strong>
                  <span className={`withdrawal-status ${item.status === "completed" ? "paid" : "pending"}`}>
                    {item.status === "completed" ? t("withdrawal.paid") : t("withdrawal.pending")}
                  </span>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

    </section>
  );
}
