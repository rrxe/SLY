import { useLanguage } from "../i18n/LanguageContext";
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
  const { t } = useLanguage();
  const totalToday = freeAttempts + bonusAttempts;
  const outOfAttempts = attemptsRemaining <= 0;

  return (
    <section className="games-page">
      <header className="games-header">
        <p className="games-eyebrow">{t("games.eyebrow")}</p>
        <h2>{t("games.title")}</h2>
        <span className="games-subtitle">
          {t("games.subtitle")}
        </span>
      </header>

      <div className="games-attempts-card">
        <div className="games-attempts-top">
          <div className="games-attempts-count">
            <strong>{attemptsRemaining}</strong>
            <span>{t("games.attemptsLeft")}</span>
          </div>
          <AttemptDots remaining={attemptsRemaining} total={Math.max(totalToday, freeAttempts)} />
        </div>

        <div className="games-attempts-breakdown">
          <span>{t("games.freeCount", { count: freeAttempts })}</span>
          <span className="dot-sep">•</span>
          <span>{t("games.bonusCount", { count: bonusAttempts })}</span>
        </div>

        <button
          className="games-watch-ad-btn"
          onClick={onWatchAd}
          disabled={adBusy}
        >
          {adBusy ? t("games.loadingAd") : t("games.watchAdBonus")}
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
            <h3>{t("games.laserEscapeTitle")}</h3>
            <p>{t("games.laserEscapeDesc")}</p>

            <div className="game-card-meta">
              <span className="game-card-chip gold">{t("games.coinsPerWave")}</span>
              <span className="game-card-chip">{t("games.lives")}</span>
            </div>
          </div>

          <button
            className="game-card-play"
            onClick={onPlay}
            disabled={outOfAttempts || playBusy}
          >
            {playBusy ? "..." : outOfAttempts ? t("games.noAttemptsLeft") : t("games.playNow")}
          </button>
        </div>

        <div className="game-card game-card-soon">
          <div className="game-card-soon-badge">{t("games.comingSoon")}</div>
          <p>{t("games.comingSoonDesc")}</p>
        </div>
      </div>
    </section>
  );
}

