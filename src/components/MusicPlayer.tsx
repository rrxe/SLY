import { useLanguage } from "../i18n/LanguageContext";
import { switchTrack, toggleMusic, useMusic } from "../lib/music";
import "../styles/music.css";

// مشغّل صغير ظاهر دايماً في الشريط العلوي، بين العنوان وخانات COINS / USDT
export default function MusicPlayer() {
  const { t } = useLanguage();
  const { enabled, track } = useMusic();

  return (
    <div className="music-slot">
      <div className="music" role="group" aria-label={t("music.title")}>
        <span className={`music-eq ${enabled ? "on" : ""}`} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>

        <div className="music-meta">
          <strong>{track.toUpperCase()}</strong>
          <small>{t(`music.${track}`)}</small>
        </div>

        <button
          type="button"
          className="music-ctl"
          aria-label={enabled ? t("music.pause") : t("music.play")}
          onClick={toggleMusic}
        >
          {enabled ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5v14M16 5v14" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
            </svg>
          )}
        </button>

        <button
          type="button"
          className="music-ctl"
          aria-label={t("music.switch")}
          onClick={switchTrack}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4 8h13m0 0-3-3m3 3-3 3M20 16H7m0 0 3-3m-3 3 3 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
