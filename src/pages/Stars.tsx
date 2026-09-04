import { useEffect, useState } from "react";
import "../styles/stars.css";

type StarPlayer = {
  rank: number;
  telegramId: string;
  name: string;
  photoUrl: string | null;
  minutes: number;
  seconds: number;
};

function StarIcon({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} aria-hidden="true">
      <defs>
        <linearGradient id="starsGoldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="45%" stopColor="#ffcf4d" />
          <stop offset="100%" stopColor="#b8860b" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.8 14.6 9l6.6.5-5 4.4 1.6 6.4L12 16.9 6.2 20.3l1.6-6.4-5-4.4L9.4 9 12 2.8Z"
        fill="url(#starsGoldGrad)"
        stroke="#7a5c00"
        strokeWidth="0.6"
      />
    </svg>
  );
}

function StarRain({ count = 22 }: { count?: number }) {
  return (
    <div className="stars-rain" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => {
        const size = 5 + (i % 4) * 2;
        const left = (i * 9.3 + (i % 6) * 7) % 100;
        const drift = ((i * 13) % 26) - 13;
        const duration = 16 + (i % 7) * 2.6;
        const delay = -((i * 3.1) % duration);
        const opacity = 0.12 + (i % 5) * 0.05;

        return (
          <StarIcon
            key={i}
            className="stars-rain-star"
            style={
              {
                left: `${left}%`,
                width: size,
                height: size,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                "--rain-drift": `${drift}px`,
                "--rain-opacity": opacity,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}

function formatCountdown(msRemaining: number) {
  if (msRemaining <= 0) return "0m";
  const totalMinutes = Math.ceil(msRemaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function initialOf(name: string) {
  const clean = name.replace("@", "").trim();
  return clean.length ? clean[0].toUpperCase() : "?";
}

function Avatar({ player, size }: { player: StarPlayer; size: number }) {
  return (
    <div
      className="stars-avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {player.photoUrl ? (
        <img src={player.photoUrl} alt={player.name} />
      ) : (
        <span>{initialOf(player.name)}</span>
      )}
    </div>
  );
}

function PodiumSpot({ player, place }: { player: StarPlayer; place: 1 | 2 | 3 }) {
  const size = place === 1 ? 76 : 60;

  return (
    <div className={`podium-spot podium-spot-${place}`}>
      {place === 1 && <div className="podium-crown">👑</div>}

      <div className="podium-avatar-wrap">
        <Avatar player={player} size={size} />
        <div className="podium-rank-badge">
          <StarIcon className="podium-rank-star" />
          <span>{place}</span>
        </div>
      </div>

      <div className="podium-name">{player.name}</div>
      <div className="podium-time">{formatTime(player.seconds)}</div>

      <div className="podium-pillar">
        <span>{place}</span>
      </div>
    </div>
  );
}

export default function Stars({
  telegramId = "",
  adBusy = false,
  adBatchCount = 0,
  adsRequired = 12,
  cycleUnlocksAt = null,
  adToast = "",
  onWatchAd,
}: {
  telegramId?: string;
  adBusy?: boolean;
  adBatchCount?: number;
  adsRequired?: number;
  cycleUnlocksAt?: string | null;
  adToast?: string;
  onWatchAd?: () => void;
}) {
  const [nowTick, setNowTick] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const unlocksAtMs = cycleUnlocksAt ? new Date(cycleUnlocksAt).getTime() : null;
  const isLocked = unlocksAtMs !== null && !Number.isNaN(unlocksAtMs) && unlocksAtMs > nowTick;
  const [players, setPlayers] = useState<StarPlayer[]>([]);
  const [myRank, setMyRank] = useState<StarPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const query = telegramId
          ? `/api/leaderboard?type=stars&telegramId=${encodeURIComponent(telegramId)}`
          : "/api/leaderboard?type=stars";

        const res = await fetch(query);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || "Failed to load leaderboard");
        }

        if (!cancelled) {
          setPlayers(Array.isArray(data?.list) ? data.list : []);
          setMyRank(data?.me || null);
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load leaderboard");
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [telegramId]);

  const first = players.find((p) => p.rank === 1);
  const second = players.find((p) => p.rank === 2);
  const third = players.find((p) => p.rank === 3);
  const rest = players.filter((p) => p.rank > 3);

  return (
    <section className="stars-page">
      <StarRain count={22} />
      <div className="stars-page-content">
      <div className="stars-hero">
        <h2>Stars Leaderboard</h2>
        <p>
          The longer you keep the bot open this week, the higher you climb.
          Top 3 win real Telegram Stars every week — from{" "}
          <strong>50</strong> up to <strong>500</strong> <StarIcon className="stars-inline-icon" />
        </p>
        <p className="stars-hero-sub">
          Ranks <strong>#4</strong> and <strong>#5</strong> also win a prize — from{" "}
          <strong>15</strong> up to <strong>50</strong> <StarIcon className="stars-inline-icon" />
        </p>

        {myRank && myRank.rank > 10 && (
          <div className="stars-hero-myrank">
            <StarIcon className="stars-hero-myrank-icon" />
            <span>Your rank: #{myRank.rank}</span>
          </div>
        )}

        <div className="stars-ad-card">
          <h3 className="stars-ad-card-title">Watch Ads for Time</h3>

          {isLocked ? (
            <div className="stars-ad-locked">
              <div className="stars-ad-locked-dot" />
              <p className="stars-ad-card-sub">
                Cycle running — your time is climbing automatically.
              </p>
              <div className="stars-ad-timer-badge">
                Unlocks in {formatCountdown((unlocksAtMs as number) - nowTick)}
              </div>
            </div>
          ) : (
            <>
              <p className="stars-ad-card-sub">
                Watch {adsRequired} ads to unlock {formatCountdown(2 * 60 * 60 * 1000)} of
                climbing time.
              </p>
              <div className="stars-ad-progress">
                <div
                  className="stars-ad-progress-fill"
                  style={{
                    width: `${Math.min(100, (adBatchCount / adsRequired) * 100)}%`,
                  }}
                />
              </div>
              <div className="stars-ad-progress-label">
                {adBatchCount}/{adsRequired} watched
              </div>
              <button className="stars-ad-btn" onClick={onWatchAd} disabled={adBusy}>
                {adBusy ? "Loading…" : "Watch Ad"}
              </button>
              {adBusy && (
                <div className="stars-ad-hint">
                  Taking a while? This will auto-reset in a few seconds.
                </div>
              )}
            </>
          )}

          {adToast && <div className="stars-ad-toast">{adToast}</div>}
        </div>
      </div>

      {loading && <div className="stars-status">Loading leaderboard…</div>}

      {!loading && error && <div className="stars-status stars-error">{error}</div>}

      {!loading && !error && players.length === 0 && (
        <div className="stars-status">No activity recorded yet this week.</div>
      )}

      {!loading && !error && players.length > 0 && (
        <>
          {(first || second || third) && (
            <div className="podium">
              {third ? (
                <PodiumSpot player={third} place={3} />
              ) : (
                <div className="podium-spot podium-spot-3 podium-empty" />
              )}

              {first ? (
                <PodiumSpot player={first} place={1} />
              ) : (
                <div className="podium-spot podium-spot-1 podium-empty" />
              )}

              {second ? (
                <PodiumSpot player={second} place={2} />
              ) : (
                <div className="podium-spot podium-spot-2 podium-empty" />
              )}
            </div>
          )}

          {rest.length > 0 && (
            <div className="stars-list">
              {rest.map((player) => {
                const isPrizeRank = player.rank === 4 || player.rank === 5;
                return (
                  <div
                    className={`stars-row${isPrizeRank ? " stars-row-prize" : ""}`}
                    key={player.telegramId}
                  >
                    <span className="stars-row-rank">
                      {player.rank}
                      {isPrizeRank && (
                        <StarIcon className="stars-row-prize-star" />
                      )}
                    </span>
                    <Avatar player={player} size={38} />
                    <span className="stars-row-name">{player.name}</span>
                    <span className="stars-row-time">{formatTime(player.seconds)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <div className="stars-footer">
        <StarIcon className="stars-footer-icon" />
        <span>Rankings reset weekly by the team once prizes are sent out.</span>
      </div>
      </div>
    </section>
  );
}
