import { memo, useEffect, useState } from "react";
import type { LaserDifficulty } from "../lib/laserEscape";
import { LASER_DIFFICULTIES } from "../lib/laserEscape";
import { useLanguage } from "../i18n/LanguageContext";
import UiIcons from "../components/UiIcons";
import "../styles/games.css";

type Props = {
  attemptsRemaining: number;
  freeAttempts: number;
  bonusAttempts: number;
  adBusy: boolean;
  playBusy: boolean;
  adToast: string;
  onWatchAd: () => void;
  onPlay: (difficulty: LaserDifficulty) => void;
  onPlayRunner: () => void;
  onOpenRunnerLeaderboard: () => void;
  runnerBestScore: number;
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

const Games = memo(function Games({
  attemptsRemaining,
  freeAttempts,
  bonusAttempts,
  adBusy,
  playBusy,
  adToast,
  onWatchAd,
  onPlay,
  onPlayRunner,
  onOpenRunnerLeaderboard,
  runnerBestScore,
}: Props) {
  const { t } = useLanguage();
  const [selectedDifficulty, setSelectedDifficulty] = useState<LaserDifficulty>("normal");
  const [difficultyModalOpen, setDifficultyModalOpen] = useState(false);

  // Keep the picker fixed in the viewport; on small Telegram screens the page
  // behind it must not scroll or drag the modal out of the center.
  useEffect(() => {
    if (!difficultyModalOpen) return;
    const previousOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
    };
  }, [difficultyModalOpen]);

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
            onClick={() => setDifficultyModalOpen(true)}
            disabled={outOfAttempts || playBusy}
          >
            {playBusy ? "..." : outOfAttempts ? t("games.noAttemptsLeft") : t("games.playNow")}
          </button>
        </div>

        <div className="game-card">
          <div className="game-card-art game-card-art-runner" aria-hidden="true">
            <div className="game-card-star s1" />
            <div className="game-card-star s2" />
            <div className="game-card-star s3" />
            <div className="runner-card-ground" />
            <div className="runner-card-ball"><span /></div>
            <div className="runner-card-crystal c1" />
            <div className="runner-card-crystal c2" />
            <div className="runner-card-drone" />
          </div>

          <div className="game-card-info">
            <div className="game-card-title-row">
              <h3>{t("games.cometRunTitle")}</h3>
              <button
                className="game-card-leaderboard-btn"
                onClick={onOpenRunnerLeaderboard}
                aria-label={t("runnerLeaderboard.title")}
              >
                <UiIcons name="leaderboard" className="game-card-leaderboard-icon" />
              </button>
            </div>
            <p>{t("games.cometRunDesc")}</p>

            <div className="game-card-meta">
              <span className="game-card-chip gold">{t("games.cometRunReward")}</span>
              <span className="game-card-chip">
                {t("games.cometRunBest", { score: Math.max(0, Math.floor(runnerBestScore || 0)) })}
              </span>
            </div>
          </div>

          <button
            className="game-card-play"
            onClick={onPlayRunner}
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

      {difficultyModalOpen && (
        <div
          className="laser-difficulty-modal-backdrop"
          onClick={() => !playBusy && setDifficultyModalOpen(false)}
          onTouchMove={(event) => event.preventDefault()}
        >
          <section
            className="laser-difficulty-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="laser-difficulty-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="laser-difficulty-modal-head">
              <div className="laser-difficulty-modal-mark" aria-hidden="true">
                <UiIcons name="games" className="laser-difficulty-modal-icon" />
              </div>
              <button
                type="button"
                className="laser-difficulty-modal-close"
                onClick={() => setDifficultyModalOpen(false)}
                disabled={playBusy}
                aria-label={t("common.close")}
              >
                <span aria-hidden="true">×</span>
              </button>
              <p>{t("games.difficultyEyebrow")}</p>
              <h3 id="laser-difficulty-modal-title">{t("games.difficultyTitle")}</h3>
              <span>{t("games.rewardOnComplete")}</span>
            </div>

            <div className="laser-difficulty-modal-options">
              {(Object.keys(LASER_DIFFICULTIES) as LaserDifficulty[]).map((level) => {
                const config = LASER_DIFFICULTIES[level];
                return (
                  <button
                    key={level}
                    type="button"
                    className={`laser-difficulty-modal-option ${level}${selectedDifficulty === level ? " selected" : ""}`}
                    onClick={() => setSelectedDifficulty(level)}
                    aria-pressed={selectedDifficulty === level}
                  >
                    <span className="laser-difficulty-modal-option-name">{t(`games.${config.labelKey}`)}</span>
                    <span className="laser-difficulty-modal-option-rounds">{t("games.roundsCount", { count: config.waves })}</span>
                    <strong>+{config.reward.toLocaleString()}</strong>
                    <small>{t("common.coins")}</small>
                  </button>
                );
              })}
            </div>

            <p className="laser-difficulty-modal-note">
              {t(`games.${LASER_DIFFICULTIES[selectedDifficulty].descriptionKey}`)}
            </p>
            <div className="laser-difficulty-modal-actions">
              <button
                type="button"
                className="laser-difficulty-cancel"
                onClick={() => setDifficultyModalOpen(false)}
                disabled={playBusy}
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                className="laser-difficulty-start"
                onClick={() => {
                  setDifficultyModalOpen(false);
                  onPlay(selectedDifficulty);
                }}
                disabled={outOfAttempts || playBusy}
              >
                {playBusy ? "..." : t("games.playNow")}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
});

export default Games;

