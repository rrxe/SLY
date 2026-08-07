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
  onOpenExchange: () => void;
};

export default function Profile({
  walletCoins,
  lifetimeCoins,
  lifetimeSpent,
  usdtBalance,
  activities,
  onOpenExchange,
}: Props) {
  return (
    <section className="profile-page">
      <section className="profile-hero">
        <div>
          <p className="profile-kicker">WALLET CENTER</p>
          <h1>Commander profile</h1>
          <span>
            Track lifetime coins, spent coins, USDT balance, and wallet activity.
          </span>
        </div>

        <div className="profile-badge">Premium wallet</div>
      </section>

      <section className="profile-grid">
        <article className="profile-stat highlight">
          <div className="profile-stat-top">
            <UiIcons name="coins" className="profile-stat-icon gold" />
            <span>Lifetime Coins</span>
          </div>
          <strong>{lifetimeCoins.toLocaleString()}</strong>
          <small>Total coins you earned over time</small>
        </article>

        <article className="profile-stat">
          <div className="profile-stat-top">
            <UiIcons name="coins" className="profile-stat-icon blue" />
            <span>Coins Spent</span>
          </div>
          <strong>{lifetimeSpent.toLocaleString()}</strong>
          <small>Coins already exchanged</small>
        </article>

        <article className="profile-stat">
          <div className="profile-stat-top">
            <UiIcons name="exchange" className="profile-stat-icon cyan" />
            <span>USDT</span>
          </div>
          <strong>{usdtBalance.toFixed(4)}</strong>
          <small>Withdrawable balance</small>
        </article>

        <article className="profile-stat full">
          <div className="profile-stat-top">
            <div className="profile-dot" />
            <span>Status</span>
          </div>
          <strong>Exchange ready</strong>
          <small>Withdrawal modal comes next.</small>
        </article>
      </section>

      <section className="profile-actions">
        <button className="profile-action primary" onClick={onOpenExchange}>
          Exchange
        </button>

        <button className="profile-action ghost" disabled>
          Withdrawal next
        </button>
      </section>

      <section className="profile-card">
        <div className="section-head compact">
          <div>
            <p>Recent activity</p>
            <h2>Wallet log</h2>
          </div>
          <UiIcons name="leaderboard" className="section-head-icon" />
        </div>

        <div className="activity-list">
          {activities.map((item) => (
            <div key={item.id} className={`activity-row ${item.tone}`}>
              <div className="activity-mark" />
              <div className="activity-copy">
                <strong>{item.title}</strong>
                <span>{item.meta}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="profile-note">
        <p>
          The profile stays lightweight now. Exchange and withdrawal stay in modals,
          so the page feels cleaner and faster.
        </p>
      </section>
    </section>
  );
}
