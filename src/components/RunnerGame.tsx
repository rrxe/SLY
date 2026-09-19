import { useEffect, useRef, useState } from "react";
import "../styles/game.css";
import UiIcons from "./UiIcons";
import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  bestScore: number;
  onExit: (coinsEarned: number, score: number) => void;
};

type ObstacleKind = "crystal" | "drone" | "lowCrystal";

type Obstacle = {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ObstacleKind;
  passed: boolean;
  spin: number;
};

type Star = {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
};

type Dust = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
};

type Phase = "ready" | "active" | "over";

const GRAVITY = 2350;
const JUMP_VELOCITY = -780;
const BASE_SPEED = 250;
const MAX_SPEED = 760;
const SPEED_RAMP = 4.4;
const PLAYER_X_RATIO = 0.18;
const STAND_W = 34;
const STAND_H = 44;
const DUCK_W = 46;
const DUCK_H = 24;
const HOLD_TO_DUCK_MS = 170;
const AIR_UNLOCK_SCORE = 16;
const COMBO_UNLOCK_SCORE = 70;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function coinsForScore(score: number) {
  return Math.min(450, Math.floor(Math.max(0, score) / 4));
}

function rectHit(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function makeStars(width: number, height: number): Star[] {
  return Array.from({ length: 70 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height * 0.7,
    r: Math.random() * 1.6 + 0.4,
    vy: 6 + Math.random() * 14,
    alpha: 0.15 + Math.random() * 0.6,
  }));
}

export default function RunnerGame({ bestScore, onExit }: Props) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);

  const stateRef = useRef({
    width: 0,
    height: 0,
    dpr: 1,
    groundY: 0,
    phase: "ready" as Phase,
    elapsed: 0,
    speed: BASE_SPEED,
    score: 0,
    coins: 0,
    playerX: 0,
    playerY: 0,
    playerVy: 0,
    playerW: STAND_W,
    playerH: STAND_H,
    grounded: true,
    ducking: false,
    pointerDownAt: 0,
    pointerDown: false,
    duckHoldFired: false,
    spawnTimer: 0.9,
    obstacles: [] as Obstacle[],
    stars: [] as Star[],
    dust: [] as Dust[],
    shake: 0,
    milestoneFlash: 0,
    milestoneText: "",
    newBestShown: false,
  });

  const [hud, setHud] = useState({ score: 0, best: Math.max(0, Math.floor(bestScore || 0)) });
  const [result, setResult] = useState<null | {
    score: number;
    coins: number;
    isNewBest: boolean;
  }>(null);
  const [ready, setReady] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    const s = stateRef.current;

    const ensureAudio = async () => {
      if (!audioRef.current) {
        const AudioCtor =
          window.AudioContext ||
          (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtor) return;
        audioRef.current = new AudioCtor();
      }
      if (audioRef.current.state === "suspended") {
        await audioRef.current.resume();
      }
    };

    const tone = (
      freq: number,
      duration: number,
      type: OscillatorType = "sine",
      gainValue = 0.05
    ) => {
      const ac = audioRef.current;
      if (!ac) return;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0.0001;
      gain.gain.exponentialRampToValueAtTime(gainValue, ac.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration + 0.03);
    };

    const sfx = (kind: "jump" | "hit" | "milestone") => {
      if (!audioRef.current) return;
      if (kind === "jump") tone(520, 0.09, "triangle", 0.035);
      else if (kind === "hit") {
        tone(140, 0.16, "sawtooth", 0.05);
        tone(80, 0.22, "triangle", 0.035);
      } else if (kind === "milestone") {
        tone(660, 0.08, "sine", 0.03);
        tone(880, 0.11, "sine", 0.03);
      }
    };

    const vibrate = (pattern: number | number[]) => {
      if (navigator.vibrate) navigator.vibrate(pattern);
    };

    const spawnDust = (x: number, y: number) => {
      for (let i = 0; i < 5; i += 1) {
        s.dust.push({
          x,
          y,
          vx: -60 - Math.random() * 60,
          vy: (Math.random() - 0.5) * 40,
          life: 0.3 + Math.random() * 0.25,
          size: 2 + Math.random() * 3,
        });
      }
    };

    const resetRun = () => {
      s.phase = "ready";
      s.elapsed = 0;
      s.speed = BASE_SPEED;
      s.score = 0;
      s.coins = 0;
      s.grounded = true;
      s.ducking = false;
      s.playerVy = 0;
      s.playerW = STAND_W;
      s.playerH = STAND_H;
      s.playerY = s.groundY - s.playerH;
      s.spawnTimer = 0.9;
      s.obstacles = [];
      s.dust = [];
      s.shake = 0;
      s.milestoneFlash = 0;
      s.newBestShown = false;
      setHud({ score: 0, best: Math.max(0, Math.floor(bestScore || 0)) });
      setResult(null);
      setReady(true);
    };

    const startRun = async () => {
      if (s.phase === "active") return;
      s.phase = "active";
      setReady(false);
      await ensureAudio();
    };

    const doJump = () => {
      if (s.phase !== "active" || !s.grounded || s.ducking) return;
      s.playerVy = JUMP_VELOCITY;
      s.grounded = false;
      spawnDust(s.playerX + s.playerW * 0.3, s.groundY - 2);
      sfx("jump");
    };

    const setDuck = (value: boolean) => {
      if (s.phase !== "active") return;
      if (!s.grounded && value) return;
      if (s.ducking === value) return;
      s.ducking = value;
      s.playerW = value ? DUCK_W : STAND_W;
      s.playerH = value ? DUCK_H : STAND_H;
      s.playerY = s.groundY - s.playerH;
    };

    const finishRun = () => {
      if (s.phase !== "active") return;
      s.phase = "over";
      s.shake = 0.3;
      sfx("hit");
      vibrate([110, 40, 110]);

      const finalScore = Math.floor(s.score);
      const coinsEarned = coinsForScore(finalScore);
      const isNewBest = finalScore > Math.floor(bestScore || 0);

      s.coins = coinsEarned;

      setHud({ score: finalScore, best: Math.max(finalScore, Math.floor(bestScore || 0)) });
      setResult({ score: finalScore, coins: coinsEarned, isNewBest });
    };

    const spawnObstacle = () => {
      const width = s.width;
      const canAir = s.score >= AIR_UNLOCK_SCORE;
      const canCombo = s.score >= COMBO_UNLOCK_SCORE;

      const roll = Math.random();
      const kind: ObstacleKind =
        canAir && roll < 0.32 ? "drone" : roll < 0.14 ? "lowCrystal" : "crystal";

      if (kind === "drone") {
        const h = 22;
        const w = 34;
        s.obstacles.push({
          x: width + 20,
          y: s.groundY - s.playerH * 0.98 - h,
          w,
          h,
          kind,
          passed: false,
          spin: 0,
        });
      } else {
        const h = kind === "lowCrystal" ? 30 : 30 + Math.random() * 20;
        const w = 22 + Math.random() * 8;
        s.obstacles.push({
          x: width + 20,
          y: s.groundY - h,
          w,
          h,
          kind,
          passed: false,
          spin: 0,
        });
      }

      if (canCombo && Math.random() < 0.22) {
        const extraKind: ObstacleKind = canAir && Math.random() < 0.5 ? "drone" : "crystal";
        const gap = 70 + Math.random() * 30;
        if (extraKind === "drone") {
          const h = 22;
          const w = 34;
          s.obstacles.push({
            x: width + 20 + gap,
            y: s.groundY - s.playerH * 0.98 - h,
            w,
            h,
            kind: extraKind,
            passed: false,
            spin: 0,
          });
        } else {
          const h = 30 + Math.random() * 20;
          const w = 22 + Math.random() * 8;
          s.obstacles.push({
            x: width + 20 + gap,
            y: s.groundY - h,
            w,
            h,
            kind: extraKind,
            passed: false,
            spin: 0,
          });
        }
      }
    };

    const updateStars = (dt: number) => {
      for (const star of s.stars) {
        star.y += star.vy * dt;
        if (star.y > s.height * 0.75) {
          star.y = -4;
          star.x = Math.random() * s.width;
        }
      }
    };

    const updateDust = (dt: number) => {
      s.dust = s.dust.filter((d) => {
        d.life -= dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        return d.life > 0;
      });
    };

    const update = (dt: number) => {
      if (s.milestoneFlash > 0) s.milestoneFlash = Math.max(0, s.milestoneFlash - dt * 1.6);
      if (s.shake > 0) s.shake = Math.max(0, s.shake - dt);
      updateStars(dt);
      updateDust(dt);

      if (s.phase !== "active") return;

      s.elapsed += dt;
      s.speed = Math.min(MAX_SPEED, BASE_SPEED + s.elapsed * SPEED_RAMP);
      s.score += dt * (s.speed / 38);

      const prevMilestone = Math.floor((s.score - dt * (s.speed / 38)) / 100);
      const currMilestone = Math.floor(s.score / 100);
      if (currMilestone > prevMilestone && currMilestone > 0) {
        s.milestoneFlash = 1;
        s.milestoneText = t("runnerGame.milestone", { n: currMilestone * 100 });
        sfx("milestone");
      }

      if (!s.grounded) {
        s.playerVy += GRAVITY * dt;
        s.playerY += s.playerVy * dt;
        if (s.playerY >= s.groundY - s.playerH) {
          s.playerY = s.groundY - s.playerH;
          s.playerVy = 0;
          s.grounded = true;
          spawnDust(s.playerX + s.playerW * 0.3, s.groundY - 2);
        }
      }

      s.spawnTimer -= dt;
      if (s.spawnTimer <= 0) {
        spawnObstacle();
        const interval = clamp(1.5 - s.elapsed * 0.011, 0.6, 1.5);
        s.spawnTimer = interval * (0.82 + Math.random() * 0.36);
      }

      let hit = false;
      s.obstacles = s.obstacles.filter((ob) => {
        ob.x -= s.speed * dt;
        ob.spin += dt * 4;

        if (
          !hit &&
          rectHit(s.playerX, s.playerY, s.playerW, s.playerH, ob.x, ob.y, ob.w, ob.h)
        ) {
          hit = true;
        }

        return ob.x + ob.w > -20;
      });

      if (hit) {
        finishRun();
        return;
      }

      setHud((prev) => {
        const scoreInt = Math.floor(s.score);
        if (scoreInt === prev.score) return prev;
        return { score: scoreInt, best: Math.max(prev.best, scoreInt) };
      });
    };

    const drawBackground = () => {
      const gradient = ctx.createLinearGradient(0, 0, 0, s.height);
      gradient.addColorStop(0, "#120a26");
      gradient.addColorStop(0.55, "#0a0718");
      gradient.addColorStop(1, "#04030c");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, s.width, s.height);

      for (const star of s.stars) {
        ctx.save();
        ctx.globalAlpha = star.alpha;
        ctx.fillStyle = "#e7dcff";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // خط الأرض المضيء + شبكة متحركة تعطي إحساس بالسرعة
      ctx.save();
      ctx.strokeStyle = "rgba(154,110,255,.55)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "rgba(154,110,255,.7)";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, s.groundY + 2);
      ctx.lineTo(s.width, s.groundY + 2);
      ctx.stroke();
      ctx.restore();

      const dashOffset = ((s.elapsed * s.speed) % 46) - 46;
      ctx.save();
      ctx.strokeStyle = "rgba(154,110,255,.22)";
      ctx.lineWidth = 2;
      for (let x = dashOffset; x < s.width; x += 46) {
        ctx.beginPath();
        ctx.moveTo(x, s.groundY + 2);
        ctx.lineTo(x - 22, s.height);
        ctx.stroke();
      }
      ctx.restore();
    };

    const drawPlayer = () => {
      const x = s.playerX;
      const y = s.playerY;
      const w = s.playerW;
      const h = s.playerH;

      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "rgba(124,240,255,.5)";
      ctx.beginPath();
      ctx.ellipse(x + w / 2, s.groundY + 4, w * 0.42, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, "#bff2ff");
      grad.addColorStop(0.5, "#7cf0ff");
      grad.addColorStop(1, "#4a8cff");
      ctx.fillStyle = grad;
      ctx.shadowColor = "rgba(124,240,255,.65)";
      ctx.shadowBlur = 14;

      const radius = h > 30 ? 12 : 9;
      const rr = Math.min(radius, w / 2, h / 2);
      ctx.beginPath();
      ctx.moveTo(x + rr, y);
      ctx.arcTo(x + w, y, x + w, y + h, rr);
      ctx.arcTo(x + w, y + h, x, y + h, rr);
      ctx.arcTo(x, y + h, x, y, rr);
      ctx.arcTo(x, y, x + w, y, rr);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(10,20,40,.55)";
      ctx.beginPath();
      ctx.arc(x + w * 0.68, y + h * 0.32, Math.max(2, w * 0.07), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawObstacle = (ob: Obstacle) => {
      ctx.save();
      if (ob.kind === "drone") {
        const cx = ob.x + ob.w / 2;
        const cy = ob.y + ob.h / 2;
        ctx.translate(cx, cy);
        ctx.fillStyle = "#ff9fd6";
        ctx.shadowColor = "rgba(255,120,200,.7)";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.ellipse(0, 0, ob.w / 2, ob.h / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.rotate(ob.spin);
        ctx.strokeStyle = "rgba(255,255,255,.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-ob.w * 0.75, 0);
        ctx.lineTo(ob.w * 0.75, 0);
        ctx.stroke();
      } else {
        const grad = ctx.createLinearGradient(ob.x, ob.y, ob.x, ob.y + ob.h);
        grad.addColorStop(0, "#ffd0a0");
        grad.addColorStop(1, "#ff6b4a");
        ctx.fillStyle = grad;
        ctx.shadowColor = "rgba(255,120,80,.6)";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(ob.x + ob.w / 2, ob.y);
        ctx.lineTo(ob.x + ob.w, ob.y + ob.h);
        ctx.lineTo(ob.x, ob.y + ob.h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    const drawDust = () => {
      for (const d of s.dust) {
        ctx.save();
        ctx.globalAlpha = clamp(d.life * 2.4, 0, 0.6);
        ctx.fillStyle = "#cddcef";
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    const roundRect = (
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      const corner = Math.min(radius, width / 2, height / 2);
      context.beginPath();
      context.moveTo(x + corner, y);
      context.arcTo(x + width, y, x + width, y + height, corner);
      context.arcTo(x + width, y + height, x, y + height, corner);
      context.arcTo(x, y + height, x, y, corner);
      context.arcTo(x, y, x + width, y, corner);
      context.closePath();
    };

    const drawMilestone = () => {
      if (s.milestoneFlash <= 0) return;
      const alpha = clamp(s.milestoneFlash, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ffe27a";
      ctx.font = "800 20px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(s.milestoneText, s.width / 2, s.height * 0.22);
      ctx.restore();
    };

    const drawReadyPrompt = () => {
      if (s.phase !== "ready") return;
      const boxW = Math.min(s.width - 32, 340);
      const boxH = 96;
      const boxX = (s.width - boxW) / 2;
      const boxY = s.height * 0.28;

      ctx.save();
      ctx.fillStyle = "rgba(10,8,20,.72)";
      ctx.strokeStyle = "rgba(154,110,255,.35)";
      ctx.lineWidth = 1.5;
      roundRect(ctx, boxX, boxY, boxW, boxH, 22);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f1e9ff";
      ctx.font = "700 17px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(t("runnerGame.tapToStart"), s.width / 2, boxY + 34);

      ctx.fillStyle = "#b9a8e0";
      ctx.font = "600 12.5px Inter, system-ui, sans-serif";
      ctx.fillText(t("runnerGame.controlsHint"), s.width / 2, boxY + 62);
      ctx.restore();
    };

    const draw = () => {
      drawBackground();

      if (s.shake > 0) {
        const sx = (Math.random() - 0.5) * 7 * s.shake;
        const sy = (Math.random() - 0.5) * 7 * s.shake;
        ctx.save();
        ctx.translate(sx, sy);
      }

      drawDust();
      for (const ob of s.obstacles) drawObstacle(ob);
      drawPlayer();

      if (s.shake > 0) ctx.restore();

      drawMilestone();
      drawReadyPrompt();
    };

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      const dpr = window.devicePixelRatio || 1;

      s.width = width;
      s.height = height;
      s.dpr = dpr;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (s.stars.length === 0) s.stars = makeStars(width, height);

      s.groundY = height - 78;
      s.playerX = width * PLAYER_X_RATIO;
      if (s.phase === "ready" || s.playerY === 0) {
        s.playerY = s.groundY - s.playerH;
      }
    };

    let holdTimer: ReturnType<typeof setTimeout> | null = null;

    const onPointerDown = async (event: PointerEvent) => {
      event.preventDefault();
      if (s.phase === "ready") {
        await startRun();
        return;
      }
      if (s.phase === "over") return;

      s.pointerDown = true;
      s.duckHoldFired = false;
      s.pointerDownAt = performance.now();

      if (holdTimer) clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        if (s.pointerDown && s.grounded) {
          s.duckHoldFired = true;
          setDuck(true);
        }
      }, HOLD_TO_DUCK_MS);
    };

    const onPointerUp = () => {
      if (holdTimer) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      if (s.pointerDown && !s.duckHoldFired) {
        doJump();
      }
      s.pointerDown = false;
      setDuck(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        if (s.phase === "ready") {
          startRun();
        } else {
          doJump();
        }
      } else if (event.code === "ArrowDown") {
        event.preventDefault();
        setDuck(true);
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "ArrowDown") {
        setDuck(false);
      }
    };

    resize();
    resetRun();

    window.addEventListener("resize", resize);
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    rafRef.current = requestAnimationFrame(function loop(time: number) {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min(0.033, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      update(dt);
      draw();

      rafRef.current = requestAnimationFrame(loop);
    });

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      if (holdTimer) clearTimeout(holdTimer);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTimeRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="game-shell">
      <canvas ref={canvasRef} className="game-canvas" />

      <div className="game-hud">
        <button
          className="hud-back"
          onClick={() =>
            onExit(result ? result.coins : coinsForScore(hud.score), result?.score ?? hud.score)
          }
          aria-label={t("gameCanvas.backToLobby")}
        >
          <UiIcons name="back" className="hud-back-icon" />
        </button>

        <div className="hud-row">
          <div className="hud-chip gold">
            <small>{t("runnerGame.score")}</small>
            <strong>{hud.score}</strong>
          </div>

          <div className="hud-chip cyan">
            <small>{t("runnerGame.best")}</small>
            <strong>{hud.best}</strong>
          </div>
        </div>

        {ready ? <div className="hud-status">{t("runnerGame.controlsHint")}</div> : null}
      </div>

      {result && (
        <div className="game-overlay">
          <div className={`result-card ${result.isNewBest ? "win" : "lose"}`}>
            <p className="result-kicker">
              {result.isNewBest ? t("runnerGame.newBest") : t("gameCanvas.runEnded")}
            </p>
            <h2>{result.score}</h2>
            <span>{t("runnerGame.runSummary", { coins: result.coins })}</span>
            <button
              onClick={() => {
                onExit(result.coins, result.score);
              }}
            >
              {t("gameCanvas.backToLobby")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
