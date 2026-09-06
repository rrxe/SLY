import "../styles/splash.css";
import splashBg from "../assets/splash-bg.png";

type SplashScreenProps = {
  progress: number;
  fading?: boolean;
};

export default function SplashScreen({ progress, fading = false }: SplashScreenProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div className={`sly-splash${fading ? " sly-splash--fading" : ""}`}>
      <img src={splashBg} alt="" className="sly-splash__bg" draggable={false} />

      <div className="sly-splash__bar-track" role="progressbar" aria-valuenow={Math.round(clamped)} aria-valuemin={0} aria-valuemax={100}>
        <div className="sly-splash__bar-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
