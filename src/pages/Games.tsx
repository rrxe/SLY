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
        <h2>العب واكسب أكثر</h2>
        <span className="games-subtitle">
          محاولات محدودة يومياً — اكسب محاولات إضافية بمشاهدة إعلان
        </span>
      </header>

      <div className="games-attempts-card">
        <div className="games-attempts-top">
          <div className="games-attempts-count">
            <strong>{attemptsRemaining}</strong>
            <span>محاولة متبقية اليوم</span>
          </div>
          <AttemptDots remaining={attemptsRemaining} total={Math.max(totalToday, freeAttempts)} />
        </div>

        <div className="games-attempts-breakdown">
          <span>{freeAttempts} مجانية</span>
          <span className="dot-sep">•</span>
          <span>{bonusAttempts} من الإعلانات</span>
        </div>

        <button
          className="games-watch-ad-btn"
          onClick={onWatchAd}
          disabled={adBusy}
        >
          {adBusy ? "جاري تحميل الإعلان..." : "شاهد إعلان (+1 محاولة)"}
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
            <p>تفادى النيازك وأطلق الليزر عبر 5 موجات فضائية</p>

            <div className="game-card-meta">
              <span className="game-card-chip gold">+100 عملة / موجة</span>
              <span className="game-card-chip">5 أرواح</span>
            </div>
          </div>

          <button
            className="game-card-play"
            onClick={onPlay}
            disabled={outOfAttempts || playBusy}
          >
            {playBusy ? "..." : outOfAttempts ? "لا محاولات متبقية" : "العب الآن"}
          </button>
        </div>

        <div className="game-card game-card-soon">
          <div className="game-card-soon-badge">قريباً</div>
          <p>ألعاب فضائية جديدة تنضم للقسم قريباً</p>
        </div>
      </div>
    </section>
  );
}
