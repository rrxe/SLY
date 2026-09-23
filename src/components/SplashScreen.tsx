import "../styles/splash.css";

type SplashScreenProps = {
  progress: number;
  fading?: boolean;
};

function CrystalX() {
  return (
    <svg
      className="sly-loader__mark"
      viewBox="0 0 120 120"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="slyXFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ecfffd" />
          <stop offset="42%" stopColor="#54e6d4" />
          <stop offset="100%" stopColor="#2fbfae" />
        </linearGradient>
        <linearGradient id="slyXEdge" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#0f6f67" />
          <stop offset="55%" stopColor="#9dfff5" />
          <stop offset="100%" stopColor="#f5fffe" />
        </linearGradient>
        <filter id="slyXGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter="url(#slyXGlow)">
        <path
          d="M25 24 46 15l18 23 18-23 21 9-27 36 27 36-21 9-18-23-18 23-21-9 27-36-27-36Z"
          fill="url(#slyXFill)"
        />
        <path
          d="M46 15 64 38 82 15l10 4-28 39-28-39 10-4Z"
          fill="url(#slyXEdge)"
          opacity=".95"
        />
        <path
          d="m25 24 27 36-27 36 12 5 27-36L91 101l12-5-27-36 27-36-12-5-27 36-27-36-12 5Z"
          fill="none"
          stroke="#effffd"
          strokeOpacity=".4"
          strokeWidth="1.8"
        />
      </g>
    </svg>
  );
}

export default function SplashScreen({ progress, fading = false }: SplashScreenProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const stage = clamped < 35 ? "01" : clamped < 70 ? "02" : clamped < 96 ? "03" : "04";

  return (
    <div className={`sly-loader${fading ? " sly-loader--fading" : ""}`}>
      <div className="sly-loader__aurora sly-loader__aurora--one" />
      <div className="sly-loader__aurora sly-loader__aurora--two" />
      <div className="sly-loader__aurora sly-loader__aurora--three" />
      <div className="sly-loader__noise" />
      <div className="sly-loader__grid" />

      <div className="sly-loader__scan sly-loader__scan--a" />
      <div className="sly-loader__scan sly-loader__scan--b" />
      <div className="sly-loader__orbit sly-loader__orbit--a">
        <span />
      </div>
      <div className="sly-loader__orbit sly-loader__orbit--b">
        <span />
      </div>
      <div className="sly-loader__orbit sly-loader__orbit--c">
        <span />
      </div>

      <div className="sly-loader__corner sly-loader__corner--tl">SLYMINTX SYSTEMS</div>
      <div className="sly-loader__corner sly-loader__corner--tr">SECURE SESSION</div>
      <div className="sly-loader__corner sly-loader__corner--bl">MINE / EARN / GROW</div>
      <div className="sly-loader__corner sly-loader__corner--br">CORE 1.0</div>

      <div className="sly-loader__center">
        <div className="sly-loader__emblem" aria-hidden="true">
          <div className="sly-loader__halo sly-loader__halo--outer" />
          <div className="sly-loader__halo sly-loader__halo--inner" />
          <div className="sly-loader__core">
            <CrystalX />
          </div>
        </div>

        <div className="sly-loader__brand">
          <span className="sly-loader__brand-sly">SLY</span>
          <span className="sly-loader__brand-mint">Mint</span>
          <span className="sly-loader__brand-x">X</span>
        </div>
        <div className="sly-loader__subtitle">THE NEXT GENERATION MINING EXPERIENCE</div>

        <div className="sly-loader__status">
          <span className="sly-loader__status-dot" />
          <span>CONNECTING TO SLYMINTX</span>
          <b>{stage}</b>
        </div>

        <div
          className="sly-loader__progress"
          role="progressbar"
          aria-valuenow={Math.round(clamped)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="SLYMintX loading progress"
        >
          <div className="sly-loader__progress-fill" style={{ width: `${clamped}%` }} />
        </div>
        <div className="sly-loader__progress-meta">
          <span>INITIALIZING CORE</span>
          <b>{Math.round(clamped)}%</b>
        </div>
      </div>

      <div className="sly-loader__light sly-loader__light--left" />
      <div className="sly-loader__light sly-loader__light--right" />
    </div>
  );
}
