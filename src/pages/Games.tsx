import "../styles/games.css";

type Props = {
  attemptsRemaining: number;
  freeAttempts: number;
  bonusAttempts: number;
  adBusy: boolean;
  playBusy: boolean;
  adToast: string;
  onWatchAd: () => void;
  onPlay: () => void;
};

function AttemptDots({ remaining, total }: { remaining: number; total: number }) {
  const capped = Math.min(total, 10);
  return (
    <div className="games-attempt-dots" aria-hidden="true">
      {Array.from({ length: capped }).map((_, i) => (
        <span
          key={i}
          className={`games-attempt-dot${i < remaining ? " filled" : ""}`}
        />
      ))}
    </div>
  );
}

export default function Games({
  attemptsRemaining,
  freeAttempts,
  bonusAttempts,
  adBusy,
  playBusy,
  adToast,
  onWatchAd,
  onPlay,
}: Props) {
  const totalToday = freeAttempts + bonusAttempts;
  const outOfAttempts = attemptsRemaining <= 0;

  return (
    <section className="games-page">
      <header className="games-header">
        <p className="games-eyebrow">GAMES</p>
        <h2>Play &amp; Earn More</h2>
        <span className="games-subtitle">
          Limited daily attempts — earn extra attempts by watching an ad
        </span>
      </header>

      <div className="games-attempts-card">
        <div className="games-attempts-top">
          <div className="games-attempts-count">
            <strong>{attemptsRemaining}</strong>
            <span>attempts left today</span>
          </div>
          <AttemptDots remaining={attemptsRemaining} total={Math.max(totalToday, freeAttempts)} />
        </div>

        <div className="games-attempts-breakdown">
          <span>{freeAttempts} free</span>
          <span className="dot-sep">•</span>
          <span>{bonusAttempts} from ads</span>
        </div>

        <button
          className="games-watch-ad-btn"
          onClick={onWatchAd}
          disabled={adBusy}
        >
          {adBusy ? "Loading ad..." : "Watch Ad (+1 attempt)"}
        </button>

        {adToast ? <div className="games-ad-toast">{adToast}</div> : null}
      </div>

      <div className="games-list">
        <div className="game-card">
          <div className="game-card-art" aria-hidden="true">
            <div className="game-card-star s1" />
            <div className="game-card-star s2" />
            <div className="game-card-star s3" />
            <div className="game-card-planet" />
            <div className="game-card-ship">
              <div className="game-card-ship-body" />
              <div className="game-card-ship-flame" />
            </div>
            <div className="game-card-rock r1" />
            <div className="game-card-rock r2" />
          </div>

          <div className="game-card-info">
            <h3>Laser Escape</h3>
            <p>Dodge meteors and fire your laser through 5 waves of space</p>

            <div className="game-card-meta">
              <span className="game-card-chip gold">+100 coins / wave</span>
              <span className="game-card-chip">5 lives</span>
            </div>
          </div>

          <button
            className="game-card-play"
            onClick={onPlay}
            disabled={outOfAttempts || playBusy}
          >
            {playBusy ? "..." : outOfAttempts ? "No attempts left" : "Play Now"}
          </button>
        </div>

        <div className="game-card game-card-soon">
          <div className="game-card-soon-badge">Coming Soon</div>
          <p>New space games joining this section soon</p>
        </div>
      </div>
    </section>
  );
}
