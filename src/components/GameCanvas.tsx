import { useEffect, useRef, useState } from "react";
import "../styles/game.css";
import UiIcons from "./UiIcons";
import { useLanguage } from "../i18n/LanguageContext";
import { themedContext } from "../lib/gameTheme";
import { LASER_DIFFICULTIES, type LaserDifficulty } from "../lib/laserEscape";

type Props = {
  difficulty: LaserDifficulty;
  onExit: (coinsEarned?: number) => void;
};

type Phase = "active" | "win" | "lose";

type Hud = {
  wave: number;
  energy: number;
  coins: number;
  status: string;
  kills: number;
  upgrade: string;
};

type Star = {
  x: number;
  y: number;
  r: number;
  vy: number;
  alpha: number;
};

type TrailPoint = {
  x: number;
  y: number;
};

type Crater = {
  x: number;
  y: number;
  r: number;
};

type Meteor = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  spin: number;
  active: boolean;
  hue: number;
  elite: boolean;
  trail: TrailPoint[];
  // شكل الصخرة: نسب نصف قطر غير منتظمة لكل زاوية (تولد مرة وحدة
  // عند الإنشاء) عشان كل نيزك يطلع بشكل مختلف وواقعي، مو نجمة متماثلة.
  shape: number[];
  craters: Crater[];
};

type Laser = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
};

type FighterKind = "scout" | "striker" | "hunter" | "bomber" | "tank";
type Fighter = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  hp: number;
  maxHp: number;
  fireTimer: number;
  phase: number;
  kind: FighterKind;
  active: boolean;
};

type EnemyShot = { x: number; y: number; vx: number; vy: number; radius: number; active: boolean };
type PowerUpKind = "shield" | "spread" | "rapid";
type PowerUp = { x: number; y: number; vy: number; kind: PowerUpKind; spin: number };
type Boss = { x: number; y: number; vx: number; w: number; h: number; hp: number; maxHp: number; fireTimer: number; phase: number };

type Burst = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};

type Banner = {
  title: string;
  subtitle: string;
  timer: number;
  tone: "wave" | "win" | "lose";
};


function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
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
  return Array.from({ length: 78 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.7 + 0.4,
    vy: 12 + Math.random() * 40,
    alpha: 0.18 + Math.random() * 0.7,
  }));
}

function makeWave(wave: number, width: number, difficultyScale: number): Meteor[] {
  // Longer, deliberate waves: enough time for several enemy formations to arrive.
  const count = Math.max(13, Math.round((12 + wave * 4.2) * difficultyScale));
  const cols = wave >= 4 ? 6 : 5;
  const lane = width / (cols + 1);
  const baseSpeed = (84 + wave * 18) * difficultyScale;
  const baseSize = 15 + wave * 1.8;

  return Array.from({ length: count }, (_, index) => {
    const elite = wave >= 3 && index % 8 === 0;
    const col = index % cols;
    const x = lane * (col + 1) + (Math.random() * 26 - 13);

    // شكل صخري غير منتظم (10 نقاط بنصف قطر عشوائي) بدل النجمة
    // المتماثلة القديمة - كل نيزك يطلع بسلوت شكل فريد.
    const shapePoints = elite ? 7 : 10;
    const shape = Array.from(
      { length: shapePoints },
      () => (elite ? 0.72 : 0.6) + Math.random() * (elite ? 0.42 : 0.55)
    );

    const craters: Crater[] = elite
      ? []
      : Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () => ({
          x: (Math.random() - 0.5) * 0.9,
          y: (Math.random() - 0.5) * 0.9,
          r: 0.09 + Math.random() * 0.13,
        }));

    return {
      x: clamp(x, 22, width - 22),
      y: -90 - index * (32 + wave * 9) - Math.random() * 65,
      vx: (Math.random() - 0.5) * (24 + wave * 4),
      vy: baseSpeed + Math.random() * (26 + wave * 10) + (elite ? 22 : 0),
      size: baseSize + Math.random() * (elite ? 12 : 8),
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * (elite ? 4 : 6 + wave * 1.1),
      active: true,
      hue: elite ? 44 : 206 + Math.random() * 10,
      elite,
      trail: [],
      shape,
      craters,
    };
  });
}

export default function GameCanvas({ difficulty, onExit }: Props) {
  const { t } = useLanguage();
  const mission = LASER_DIFFICULTIES[difficulty];
  const TOTAL_WAVES = mission.waves;
  const payoutRef = useRef(0);
  const soundOnRef = useRef(true);
  const startMusicRef = useRef<() => void>(() => {});
  const [soundOn, setSoundOn] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const audioRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const stateRef = useRef({
    width: 0,
    height: 0,
    dpr: 1,
    phase: "active" as Phase,
    wave: 1,
    energy: 5,
    coins: 0,
    shipX: 0,
    shipY: 0,
    targetX: 0,
    targetY: 0,
    shipW: 48,
    shipH: 60,
    dragging: false,
    shootCd: 0,
    waveFlash: 0,
    shake: 0,
    spawnTimer: 0,
    fighterSpawnTimer: 1.4,
    powerupSpawnTimer: 11.5,
    bossSpawnTimer: 0,
    shieldTimer: 0,
    spreadShotTimer: 0,
    rapidFireTimer: 0,
    damageCooldown: 0,
    kills: 0,
    stars: [] as Star[],
    meteors: [] as Meteor[],
    spawnQueue: [] as Meteor[],
    lasers: [] as Laser[],
    fighters: [] as Fighter[],
    enemyShots: [] as EnemyShot[],
    powerups: [] as PowerUp[],
    boss: null as Boss | null,
    bursts: [] as Burst[],
    banner: {
      title: t("gameCanvas.waveLabel", { n: 1 }),
      subtitle: t("gameCanvas.braceForImpact"),
      timer: 1.1,
      tone: "wave" as Banner["tone"],
    },
  });

  const [hud, setHud] = useState<Hud>({
    wave: 1,
    energy: 5,
    coins: 0,
    status: t("gameCanvas.waveStatus", { n: 1, total: TOTAL_WAVES }),
    kills: 0,
    upgrade: "",
  });

  const [result, setResult] = useState<null | {
    title: string;
    text: string;
    tone: "win" | "lose";
  }>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Disable the alpha buffer where possible and use a moderate pixel ratio
    // so the moving canvas stays responsive on mid-range Android devices.
    const ctx = themedContext(canvas, { alpha: false, desynchronized: true });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;

    const s = stateRef.current;
    let canvasRect = canvas.getBoundingClientRect();
    let backgroundGradient: CanvasGradient | null = null;
    let bottomGlowGradient: CanvasGradient | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let musicTimer: ReturnType<typeof setInterval> | null = null;
    let musicSource: AudioBufferSourceNode | null = null;
    let musicBuffer: AudioBuffer | null = null;
    let gunfireBuffer: AudioBuffer | null = null;
    let audioAssetsPromise: Promise<void> | null = null;
    let disposed = false;
    let musicStep = 0;
    let hudUiTimer = 0;
    let lastUpgradeUi = "";
    let lastHudKills = 0;
    let shotSoundCounter = 0;
    let noiseBuffer: AudioBuffer | null = null;
    let masterCompressor: DynamicsCompressorNode | null = null;
    const melody = [220, 261.63, 329.63, 392, 329.63, 293.66, 246.94, 329.63, 196, 246.94, 293.66, 369.99, 440, 392, 329.63, 293.66];

    const ensureAudio = async () => {
      if (!audioRef.current) {
        const AudioCtor =
          window.AudioContext ||
          (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;

        if (!AudioCtor) return;
        audioRef.current = new AudioCtor();
      }

      if (!masterCompressor) {
        const context = audioRef.current;
        masterCompressor = context.createDynamicsCompressor();
        masterCompressor.threshold.value = -11;
        masterCompressor.knee.value = 12;
        masterCompressor.ratio.value = 3.5;
        masterCompressor.attack.value = 0.003;
        masterCompressor.release.value = 0.16;
        const masterGain = context.createGain();
        masterGain.gain.value = soundOnRef.current ? 0.88 : 0;
        masterGainRef.current = masterGain;
        masterCompressor.connect(masterGain);
        masterGain.connect(context.destination);
      }
      if (!noiseBuffer) {
        const context = audioRef.current;
        noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (0.8 + Math.random() * 0.2);
      }
      // Resume synchronously from the player's touch gesture, then decode the
      // bundled soundtrack and cannon sample. Synthesized fallbacks remain if
      // the browser cannot load either asset.
      const context = audioRef.current;
      const resumePromise = context.state === "suspended"
        ? context.resume().catch(() => {})
        : Promise.resolve();
      if (!audioAssetsPromise) {
        audioAssetsPromise = (async () => {
          try {
            const [musicResponse, shotResponse] = await Promise.all([
              fetch("/audio/laser-escape-music.wav", { cache: "force-cache" }),
              fetch("/audio/laser-cannon-fire.wav", { cache: "force-cache" }),
            ]);
            if (musicResponse.ok) musicBuffer = await context.decodeAudioData(await musicResponse.arrayBuffer());
            if (shotResponse.ok) gunfireBuffer = await context.decodeAudioData(await shotResponse.arrayBuffer());
          } catch {
            // Keep the built-in Web Audio composition and sound effects as fallback.
          }
        })();
      }
      await resumePromise;
      await audioAssetsPromise;
    };

    const tone = (
      freq: number,
      duration: number,
      type: OscillatorType = "sine",
      gainValue = 0.05,
      detune = 0
    ) => {
      const ac = audioRef.current;
      // Don't queue sounds while mobile browsers are still unlocking audio;
      // otherwise the first shots can bunch together on resume.
      if (!ac || !soundOnRef.current || ac.state !== "running") return;

      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = detune;

      gain.gain.value = 0.0001;
      gain.gain.exponentialRampToValueAtTime(gainValue, ac.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + duration);

      osc.connect(gain);
      gain.connect(masterCompressor ?? ac.destination);

      osc.start();
      osc.stop(ac.currentTime + duration + 0.03);
    };

    const noiseBurst = (
      filterType: BiquadFilterType,
      startFrequency: number,
      endFrequency: number,
      duration: number,
      volume: number
    ) => {
      const ac = audioRef.current;
      if (!ac || !noiseBuffer || !soundOnRef.current || ac.state !== "running") return;
      const now = ac.currentTime;
      const source = ac.createBufferSource();
      const filter = ac.createBiquadFilter();
      const gain = ac.createGain();
      source.buffer = noiseBuffer;
      filter.type = filterType;
      filter.frequency.setValueAtTime(Math.max(30, startFrequency), now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(30, endFrequency), now + duration);
      filter.Q.value = filterType === "bandpass" ? 0.8 : 0.55;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(masterCompressor ?? ac.destination);
      source.start(now);
      source.stop(now + duration + 0.02);
    };

    const sweepTone = (from: number, to: number, duration: number, type: OscillatorType, volume: number) => {
      const ac = audioRef.current;
      if (!ac || !soundOnRef.current || ac.state !== "running") return;
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const filter = ac.createBiquadFilter();
      osc.type = type;
      osc.frequency.setValueAtTime(Math.max(20, from), now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), now + duration);
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1500, now);
      filter.frequency.exponentialRampToValueAtTime(360, now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(masterCompressor ?? ac.destination);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    };

    const sfx = (kind: "wave" | "shoot" | "clear" | "hit" | "win" | "lose" | "powerup" | "boss" | "kill") => {
      if (!audioRef.current) return;

      if (kind === "wave") {
        tone(220, 0.08, "triangle", 0.03);
        tone(440, 0.11, "sine", 0.025);
      } else if (kind === "shoot") {
        // Sampled cannon report for a physical low-end thump and short muzzle crack.
        // Play as a fresh buffer source for overlapping volleys; synthesize only as fallback.
        if (gunfireBuffer && audioRef.current.state === "running" && soundOnRef.current) {
          const ac = audioRef.current;
          const source = ac.createBufferSource();
          const gain = ac.createGain();
          source.buffer = gunfireBuffer;
          gain.gain.value = 0.95;
          source.connect(gain);
          gain.connect(masterCompressor ?? ac.destination);
          source.start();
          return;
        }
        shotSoundCounter += 1;
        const variation = ((shotSoundCounter % 3) - 1) * 9;
        sweepTone(205 + variation, 52, 0.105, "sawtooth", 0.065);
        sweepTone(92 + variation * 0.25, 29, 0.17, "sine", 0.12);
        noiseBurst("lowpass", 3400, 260, 0.105, 0.105);
        noiseBurst("bandpass", 1900, 620, 0.052, 0.052);
      } else if (kind === "clear") {
        tone(330, 0.08, "triangle", 0.04);
        tone(660, 0.1, "sine", 0.04);
        tone(990, 0.13, "sine", 0.03);
      } else if (kind === "hit") {
        tone(120, 0.12, "sawtooth", 0.05);
        tone(80, 0.18, "triangle", 0.03);
      } else if (kind === "win") {
        tone(392, 0.12, "triangle", 0.04);
        tone(523.25, 0.14, "triangle", 0.04);
        tone(659.25, 0.18, "sine", 0.04);
      } else if (kind === "lose") {
        tone(196, 0.16, "sawtooth", 0.05);
        tone(98, 0.24, "triangle", 0.04);
      } else if (kind === "powerup") {
        tone(523.25, 0.08, "triangle", 0.035);
        tone(783.99, 0.12, "sine", 0.035);
      } else if (kind === "boss") {
        tone(110, 0.22, "sawtooth", 0.045);
        tone(82.4, 0.32, "triangle", 0.04);
      } else if (kind === "kill") {
        tone(620, 0.045, "square", 0.012);
      }
    };

    const startMusic = () => {
      if (disposed || !soundOnRef.current || !audioRef.current || audioRef.current.state !== "running") return;
      if (musicBuffer) {
        if (musicSource) return;
        // Loop the bundled original synthwave track seamlessly through the master bus.
        musicSource = audioRef.current.createBufferSource();
        musicSource.buffer = musicBuffer;
        musicSource.loop = true;
        const musicGain = audioRef.current.createGain();
        musicGain.gain.setValueAtTime(0.0001, audioRef.current.currentTime);
        musicGain.gain.linearRampToValueAtTime(0.78, audioRef.current.currentTime + 0.65);
        musicSource.connect(musicGain);
        musicGain.connect(masterCompressor ?? audioRef.current.destination);
        musicSource.start();
        return;
      }
      if (musicTimer) return;
      // Lightweight musical fallback when static audio files cannot be loaded.
      musicTimer = setInterval(() => {
        const ac = audioRef.current;
        if (!soundOnRef.current || !ac || ac.state !== "running") return;
        const step = musicStep % 16;
        const note = melody[step];
        const inBossFight = s.boss !== null;
        if (step % 2 === 0) {
          tone(note, 0.21, inBossFight ? "sawtooth" : "triangle", inBossFight ? 0.034 : 0.029);
          tone(note / 2, 0.31, "sawtooth", inBossFight ? 0.024 : 0.02);
        }
        // Four-on-the-floor kick pulse, with a low descending pitch for weight.
        if (step % 4 === 0) {
          sweepTone(inBossFight ? 138 : 118, 38, 0.14, "sine", inBossFight ? 0.085 : 0.072);
          noiseBurst("lowpass", 1000, 150, 0.06, 0.032);
        }
        if (step === 4 || step === 12) {
          noiseBurst("bandpass", inBossFight ? 2300 : 1850, 1050, 0.105, 0.034);
          tone(185, 0.075, "triangle", 0.015);
        }
        if (step % 2 === 1) noiseBurst("highpass", 8200, 5400, 0.025, 0.009);
        if (step === 7 || step === 15) tone(note * 1.5, 0.115, "sine", 0.012);
        musicStep += 1;
      }, 155);
    };
    startMusicRef.current = startMusic;

    const vibrate = (pattern: number | number[]) => {
      if (navigator.vibrate) navigator.vibrate(pattern);
    };

    const burst = (x: number, y: number, color: string) => {
      for (let i = 0; i < 8; i += 1) {
        s.bursts.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 360,
          vy: (Math.random() - 0.5) * 360,
          life: 0.38 + Math.random() * 0.35,
          size: 1.3 + Math.random() * 3.4,
          color,
        });
      }
      // Keep particle count bounded during dense boss effects.
      if (s.bursts.length > 120) s.bursts.splice(0, s.bursts.length - 120);
    };

    const activeUpgradeText = () => {
      const parts: string[] = [];
      if (s.shieldTimer > 0) parts.push(t("gameCanvas.shieldActive", { seconds: Math.ceil(s.shieldTimer) }));
      if (s.spreadShotTimer > 0) parts.push(t("gameCanvas.spreadActive", { seconds: Math.ceil(s.spreadShotTimer) }));
      if (s.rapidFireTimer > 0) parts.push(t("gameCanvas.rapidActive", { seconds: Math.ceil(s.rapidFireTimer) }));
      return parts.join(" · ");
    };

    const spawnPowerup = (x = Math.random() * Math.max(40, s.width - 40) + 20, kind?: PowerUpKind) => {
      if (s.powerups.length >= 1) return;
      const pick = kind ?? (["shield", "spread", "rapid"] as PowerUpKind[])[Math.floor(Math.random() * 3)];
      s.powerups.push({ x: clamp(x, 20, s.width - 20), y: -22, vy: 82 + s.wave * 4, kind: pick, spin: Math.random() * Math.PI * 2 });
    };

    const maybeDropPowerup = (x: number, y: number, chance = 0.075) => {
      if (s.powerups.length >= 1 || Math.random() > chance) return;
      const kind = (["shield", "spread", "rapid"] as PowerUpKind[])[Math.floor(Math.random() * 3)];
      s.powerups.push({ x, y, vy: 72, kind, spin: Math.random() * Math.PI * 2 });
    };

    const spawnFighter = () => {
      const maxFighters = difficulty === "hard" ? 5 : difficulty === "normal" ? 4 : 3;
      if (s.fighters.length >= maxFighters || s.phase !== "active") return;
      const waveWeight = Math.min(1.4, s.wave * 0.16);
      const roll = Math.random();
      const kind: FighterKind = roll < 0.25 ? "scout" : roll < 0.48 ? "striker" : roll < 0.70 ? "hunter" : roll < (s.wave >= 2 ? 0.88 : 0.99) ? "bomber" : "tank";
      const w = kind === "tank" ? 64 : kind === "bomber" ? 58 : kind === "hunter" ? 54 : kind === "striker" ? 46 : 38;
      const h = kind === "tank" ? 42 : kind === "bomber" ? 38 : kind === "hunter" ? 36 : kind === "striker" ? 32 : 28;
      const scale = mission.enemyScale;
      const hp = kind === "tank" ? Math.ceil(4 * scale + waveWeight) : kind === "hunter" || kind === "bomber" ? Math.ceil(2 * scale + waveWeight) : kind === "striker" ? Math.ceil(2 * scale) : 1;
      const dir = Math.random() < 0.5 ? -1 : 1;
      s.fighters.push({
        x: 30 + Math.random() * Math.max(1, s.width - 60),
        y: -50 - Math.random() * 50,
        vx: kind === "tank" ? dir * 18 * scale : dir * (28 + s.wave * 8) * scale,
        vy: (kind === "tank" ? 34 : kind === "bomber" ? 42 : 48 + s.wave * 7) * scale,
        w, h, hp, maxHp: hp,
        fireTimer: (kind === "tank" ? 1.9 : kind === "bomber" ? 1.15 : 0.8) + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
        kind,
        active: true,
      });
    };

    const spawnBoss = () => {
      const w = Math.min(190, s.width * 0.58);
      const hp = mission.bossHp;
      s.boss = {
        x: s.width / 2,
        y: Math.max(164, s.height * 0.17),
        vx: (difficulty === "hard" ? 132 : difficulty === "normal" ? 100 : 72) * (Math.random() < 0.5 ? -1 : 1),
        w,
        h: Math.min(82, w * 0.43),
        hp,
        maxHp: hp,
        fireTimer: 1.1,
        phase: 0,
      };
      sfx("boss");
      s.banner = { title: t("gameCanvas.boss"), subtitle: t("gameCanvas.bossIncoming"), timer: 1.7, tone: "lose" };
      s.waveFlash = 0.7;
    };

    const spawnWave = (wave: number, preserveAnnouncement = false) => {
      // A wave is a seamless continuation of the same run: never clear live
      // player shots, enemy projectiles, falling upgrades, or visual effects.
      s.phase = "active";
      s.wave = wave;
      s.shootCd = Math.min(s.shootCd, 0.08);
      s.spawnTimer = 0;
      const bossWave = wave === TOTAL_WAVES;
      s.spawnQueue = bossWave ? [] : makeWave(wave, s.width, mission.enemyScale);
      s.damageCooldown = Math.max(s.damageCooldown, 0.22);
      s.waveFlash = Math.max(s.waveFlash, 0.12);
      s.fighterSpawnTimer = bossWave ? 2.6 : 1.4;
      // Power-up clock persists across rounds so the player is not flooded with drops.
      s.bossSpawnTimer = bossWave ? 2.1 : 0;
      if (!preserveAnnouncement) {
        s.banner = {
          title: t("gameCanvas.waveLabel", { n: wave }),
          subtitle: bossWave ? t("gameCanvas.bossIncoming") : wave >= TOTAL_WAVES - 1 ? t("gameCanvas.meteorPressureRising") : t("gameCanvas.incomingRocks"),
          timer: bossWave ? 1.9 : 1.35,
          tone: "wave",
        };
      }
      sfx("wave");

      setHud({
        wave,
        energy: s.energy,
        coins: s.coins,
        status: bossWave ? t("gameCanvas.bossIncoming") : t("gameCanvas.waveStatus", { n: wave, total: TOTAL_WAVES }),
        kills: s.kills,
        upgrade: activeUpgradeText(),
      });
      setResult(null);
    };

    const finishWin = () => {
      if (s.phase === "win" || s.phase === "lose") return;
      s.phase = "win";
      s.coins = mission.reward;
      payoutRef.current = mission.reward;
      const winSubtitle = t("gameCanvas.missionCompleteSubtitle", { total: TOTAL_WAVES, coins: mission.reward });
      s.banner = {
        title: t("gameCanvas.missionComplete"),
        subtitle: winSubtitle,
        timer: 2.2,
        tone: "win",
      };
      s.waveFlash = 1;
      sfx("win");
      vibrate([50, 60, 80]);

      setHud({
        wave: TOTAL_WAVES,
        energy: s.energy,
        coins: s.coins,
        status: t("gameCanvas.missionReward", { coins: mission.reward }),
        kills: s.kills,
        upgrade: "",
      });

      setResult({
        title: t("gameCanvas.missionCompleteStatus"),
        text: winSubtitle,
        tone: "win",
      });
    };

    const finishLose = (reason = t("gameCanvas.meteorEscaped")) => {
      if (s.phase === "win" || s.phase === "lose") return;
      s.phase = "lose";
      payoutRef.current = 0;
      s.coins = 0;
      s.banner = {
        title: t("gameCanvas.runFailed"),
        subtitle: reason,
        timer: 2.2,
        tone: "lose",
      };
      s.waveFlash = 1;
      sfx("lose");
      vibrate([120, 40, 120]);

      setHud({
        wave: s.wave,
        energy: s.energy,
        coins: s.coins,
        status: t("gameCanvas.runFailedStatus"),
        kills: s.kills,
        upgrade: "",
      });

      setResult({
        title: t("gameCanvas.runFailedStatus"),
        text: t("gameCanvas.runFailedText", { reason, coins: s.coins }),
        tone: "lose",
      });
    };

    // نظام أرواح حقيقي: كل ضربة أو نيزك فايت تنقص وحدة طاقة بس ما
    // تخلص المحاولة إلا لما توصل الطاقة للصفر (بدل الموت من أول خطأ
    // اللي كان بالنسخة القديمة - هذا هو الخلل اللي كان يخلي اللعبة
    // قاسية بدون داعي).
    const damageShip = (reason: string) => {
      if (s.shieldTimer > 0) {
        s.shieldTimer = Math.max(0, s.shieldTimer - 1.6);
        burst(s.shipX + s.shipW / 2, s.shipY + s.shipH / 2, "rgba(88,226,255,.95)");
        tone(480, 0.07, "sine", 0.025);
        return;
      }
      if (s.damageCooldown > 0) return;
      s.damageCooldown = 0.78;
      s.energy = Math.max(0, s.energy - 1);
      s.shake = Math.max(s.shake, 0.32);
      sfx("hit");
      vibrate(60);

      if (s.energy <= 0) {
        finishLose(reason);
        return;
      }

      s.banner = {
        title: t("gameCanvas.minusOneLife"),
        subtitle: reason,
        timer: 0.7,
        tone: "lose",
      };
      s.waveFlash = 0.55;

      setHud({
        wave: s.wave,
        energy: s.energy,
        coins: s.coins,
        status: t("gameCanvas.livesLeft", {
          count: s.energy,
          unit: s.energy === 1 ? t("gameCanvas.life") : t("gameCanvas.lives"),
        }),
        kills: s.kills,
        upgrade: activeUpgradeText(),
      });
    };

    const addLaser = () => {
      const center = s.shipX + s.shipW / 2 - 2;
      const shots = s.spreadShotTimer > 0 ? [-185, 0, 185] : [0];
      for (const vx of shots) {
        s.lasers.push({ x: center, y: s.shipY - 10, vx, vy: -980, active: true });
      }
      if (s.lasers.length > 54) s.lasers.splice(0, s.lasers.length - 54);
      sfx("shoot");
    };

    const updateFightersAndBoss = (dt: number) => {
      const maySpawn = s.spawnQueue.length > 0 || s.meteors.length > 0 || s.bossSpawnTimer > 0 || s.boss !== null;
      if (maySpawn) {
        s.fighterSpawnTimer -= dt;
        if (s.fighterSpawnTimer <= 0) {
          spawnFighter();
          const base = difficulty === "hard" ? 1.7 : difficulty === "normal" ? 2.45 : 3.25;
          s.fighterSpawnTimer = base + Math.random() * 1.25;
        }
      }

      s.powerupSpawnTimer -= dt;
      if (s.powerupSpawnTimer <= 0 && s.powerups.length < 1 && s.phase === "active") {
        spawnPowerup();
        s.powerupSpawnTimer = (difficulty === "easy" ? 17 : difficulty === "normal" ? 20 : 23) + Math.random() * 5;
      }

      for (const fighter of s.fighters) {
        fighter.phase += dt * (1.1 + s.wave * 0.08);
        fighter.x += fighter.vx * dt + Math.sin(fighter.phase) * 28 * dt;
        fighter.y += fighter.vy * dt;
        if (fighter.x < fighter.w / 2 + 8 || fighter.x > s.width - fighter.w / 2 - 8) fighter.vx *= -1;
        fighter.fireTimer -= dt;
        if (fighter.fireTimer <= 0 && fighter.y > 25 && fighter.y < s.height * 0.72) {
          const dx = s.shipX + s.shipW / 2 - fighter.x;
          const dy = s.shipY + s.shipH / 2 - fighter.y;
          const angle = Math.atan2(dy, dx);
          const speed = (155 + s.wave * 17) * mission.enemyScale;
          if (fighter.kind === "bomber" || fighter.kind === "tank") {
            const spread = fighter.kind === "tank" ? [-0.36, 0, 0.36] : [-0.2, 0, 0.2];
            for (const offset of spread) {
              const a = Math.PI / 2 + offset + (fighter.kind === "tank" ? 0 : Math.sin(fighter.phase) * 0.06);
              s.enemyShots.push({ x: fighter.x, y: fighter.y + fighter.h / 2, vx: Math.cos(a) * speed * 0.7, vy: Math.sin(a) * speed * 0.7, radius: fighter.kind === "tank" ? 4.5 : 3.8, active: true });
            }
          } else {
            s.enemyShots.push({ x: fighter.x, y: fighter.y + fighter.h / 2, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: fighter.kind === "hunter" ? 5 : 3.5, active: true });
          }
          fighter.fireTimer = (fighter.kind === "hunter" ? 1.15 : fighter.kind === "tank" ? 2.1 : fighter.kind === "bomber" ? 1.25 : 1.65) / mission.enemyScale + Math.random() * 0.5;
        }
      }

      for (const laser of s.lasers) {
        if (!laser.active) continue;
        for (const fighter of s.fighters) {
          if (!fighter.active) continue;
          if (rectHit(laser.x - 2, laser.y, 5, 18, fighter.x - fighter.w / 2, fighter.y - fighter.h / 2, fighter.w, fighter.h)) {
            laser.active = false;
            fighter.hp -= 1;
            burst(laser.x, laser.y, fighter.kind === "hunter" ? "rgba(255,145,63,.92)" : "rgba(255,75,105,.92)");
            if (fighter.hp <= 0) {
              fighter.active = false;
              s.kills += 1;
              maybeDropPowerup(fighter.x, fighter.y, fighter.kind === "tank" ? 0.14 : difficulty === "hard" ? 0.065 : 0.085);
              burst(fighter.x, fighter.y, "rgba(255,80,105,.98)");
              sfx("kill");
            }
            break;
          }
        }
      }

      s.fighters = s.fighters.filter((fighter) => {
        if (!fighter.active) return false;
        if (fighter.y - fighter.h / 2 > s.height + 10) return false;
        if (rectHit(s.shipX, s.shipY, s.shipW, s.shipH, fighter.x - fighter.w / 2, fighter.y - fighter.h / 2, fighter.w, fighter.h)) {
          burst(fighter.x, fighter.y, "rgba(255,90,110,.95)");
          damageShip(t("gameCanvas.shipHit"));
          return false;
        }
        return true;
      });

      if (s.boss) {
        const boss = s.boss;
        boss.phase += dt;
        boss.x += boss.vx * dt;
        if (boss.x < boss.w / 2 + 12 || boss.x > s.width - boss.w / 2 - 12) boss.vx *= -1;
        boss.y = Math.max(164, s.height * 0.17) + Math.sin(boss.phase * 1.35) * 11;
        boss.fireTimer -= dt;
        if (boss.fireTimer <= 0) {
          const dx = s.shipX + s.shipW / 2 - boss.x;
          const dy = s.shipY + s.shipH / 2 - (boss.y + boss.h / 2);
          const baseAngle = Math.atan2(dy, dx);
          const spread = difficulty === "hard" ? [-0.42, -0.21, 0, 0.21, 0.42] : difficulty === "normal" ? [-0.28, 0, 0.28] : [-0.2, 0.2];
          const speed = (difficulty === "hard" ? 235 : difficulty === "normal" ? 195 : 158) + s.wave * 3;
          for (const offset of spread) {
            const angle = baseAngle + offset;
            s.enemyShots.push({ x: boss.x, y: boss.y + boss.h * 0.4, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: difficulty === "hard" ? 5 : 4, active: true });
          }
          boss.fireTimer = (difficulty === "hard" ? 0.74 : difficulty === "normal" ? 1.05 : 1.35) + Math.random() * 0.24;
        }

        for (const laser of s.lasers) {
          if (!laser.active || !s.boss) continue;
          if (rectHit(laser.x - 2, laser.y, 5, 18, boss.x - boss.w / 2, boss.y - boss.h / 2, boss.w, boss.h)) {
            laser.active = false;
            boss.hp -= 1;
            if (Math.random() < 0.45) burst(laser.x, laser.y, "rgba(255,180,72,.82)");
          }
        }
        if (boss.hp <= 0) {
          burst(boss.x, boss.y, "rgba(255,184,77,.98)");
          burst(boss.x - boss.w * 0.25, boss.y + 6, "rgba(255,72,93,.92)");
          burst(boss.x + boss.w * 0.25, boss.y - 4, "rgba(255,230,153,.96)");
          s.kills += 1;
          s.boss = null;
          // Existing projectiles continue travelling after the boss explodes;
          // do not erase them as an invisible round-reset side effect.
          sfx("clear");
          s.banner = { title: t("gameCanvas.bossDefeated"), subtitle: t("gameCanvas.waveClearedTitle", { n: s.wave }), timer: 1.7, tone: "win" };
          s.waveFlash = 0.9;
        }
      }

      for (const shot of s.enemyShots) {
        shot.x += shot.vx * dt;
        shot.y += shot.vy * dt;
        if (shot.y < -30 || shot.y > s.height + 30 || shot.x < -30 || shot.x > s.width + 30) shot.active = false;
        if (shot.active && rectHit(s.shipX + 6, s.shipY + 7, s.shipW - 12, s.shipH - 12, shot.x - shot.radius, shot.y - shot.radius, shot.radius * 2, shot.radius * 2)) {
          shot.active = false;
          burst(shot.x, shot.y, "rgba(255,81,112,.9)");
          damageShip(t("gameCanvas.shipHit"));
        }
      }
      s.enemyShots = s.enemyShots.filter((shot) => shot.active);
    };

    const updatePowerups = (dt: number) => {
      for (const item of s.powerups) {
        item.y += item.vy * dt;
        item.spin += dt * 2.2;
        if (rectHit(s.shipX, s.shipY, s.shipW, s.shipH, item.x - 13, item.y - 13, 26, 26)) {
          if (item.kind === "shield") s.shieldTimer = Math.max(s.shieldTimer, 8);
          else if (item.kind === "spread") s.spreadShotTimer = Math.max(s.spreadShotTimer, 7);
          else s.rapidFireTimer = Math.max(s.rapidFireTimer, 6);
          burst(item.x, item.y, item.kind === "shield" ? "rgba(82,228,255,.98)" : item.kind === "spread" ? "rgba(172,116,255,.98)" : "rgba(255,207,87,.98)");
          s.banner = {
            title: t("gameCanvas.upgradeCollected"),
            subtitle: t(item.kind === "shield" ? "gameCanvas.shieldUpgrade" : item.kind === "spread" ? "gameCanvas.spreadUpgrade" : "gameCanvas.rapidUpgrade"),
            timer: 0.9,
            tone: "win",
          };
          sfx("powerup");
          setHud({
            wave: s.wave,
            energy: s.energy,
            coins: s.coins,
            status: t("gameCanvas.upgradeCollected"),
            kills: s.kills,
            upgrade: activeUpgradeText(),
          });
          item.y = s.height + 200;
        }
      }
      s.powerups = s.powerups.filter((item) => item.y < s.height + 35);
    };

    const spawnFromQueue = (dt: number) => {
      if (s.phase !== "active") return;

      s.spawnTimer -= dt;
      const interval = Math.max(0.15, 0.27 - (s.wave - 1) * 0.018);

      if (s.spawnTimer <= 0 && s.spawnQueue.length > 0) {
        const burstCount = s.wave >= 4 ? 2 : 1;
        for (let i = 0; i < burstCount && s.spawnQueue.length > 0; i += 1) {
          const next = s.spawnQueue.shift();
          if (next) s.meteors.push(next);
        }
        s.spawnTimer = interval;
      }
    };

    const updateStars = (dt: number) => {
      for (const star of s.stars) {
        star.y += star.vy * dt;
        if (star.y > s.height + 4) {
          star.y = -4;
          star.x = Math.random() * s.width;
        }
      }
    };

    const updateBursts = (dt: number) => {
      s.bursts = s.bursts.filter((b) => {
        b.life -= dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vx *= 0.965;
        b.vy *= 0.965;
        return b.life > 0;
      });
    };

    const updateLasers = (dt: number) => {
      for (const laser of s.lasers) {
        laser.x += laser.vx * dt;
        laser.y += laser.vy * dt;
        if (laser.y < -30 || laser.x < -30 || laser.x > s.width + 30) laser.active = false;
      }
      s.lasers = s.lasers.filter((l) => l.active);
    };

    const updateMeteors = (dt: number) => {
      for (const meteor of s.meteors) {
        meteor.rot += meteor.spin * dt;
        meteor.x += meteor.vx * dt;
        meteor.y += meteor.vy * dt;
        meteor.trail.unshift({ x: meteor.x, y: meteor.y });

        if (meteor.trail.length > 10) {
          meteor.trail.pop();
        }

        if (meteor.x < 14 || meteor.x > s.width - 14) {
          meteor.vx *= -1;
        }
      }

      for (const laser of s.lasers) {
        for (const meteor of s.meteors) {
          if (
            meteor.active &&
            laser.active &&
            rectHit(
              laser.x,
              laser.y,
              4,
              18,
              meteor.x - meteor.size,
              meteor.y - meteor.size,
              meteor.size * 2,
              meteor.size * 2
            )
          ) {
            meteor.active = false;
            laser.active = false;
            s.kills += 1;
            maybeDropPowerup(meteor.x, meteor.y, meteor.elite ? 0.14 : 0.018);
            burst(
              meteor.x,
              meteor.y,
              meteor.elite ? "rgba(255,210,90,.98)" : "rgba(78,167,255,.92)"
            );
          }
        }
      }

      s.meteors = s.meteors.filter((meteor) => {
        if (!meteor.active) return false;

        if (meteor.y - meteor.size > s.height) {
          damageShip(t("gameCanvas.meteorEscaped"));
          return false;
        }

        if (
          rectHit(
            s.shipX,
            s.shipY,
            s.shipW,
            s.shipH,
            meteor.x - meteor.size,
            meteor.y - meteor.size,
            meteor.size * 2,
            meteor.size * 2
          )
        ) {
          burst(meteor.x, meteor.y, "rgba(255,120,120,.95)");
          damageShip(t("gameCanvas.shipHit"));
          return false;
        }

        return true;
      });

      return s.phase !== "active";
    };

    const drawBackground = () => {
      if (!backgroundGradient) {
        backgroundGradient = ctx.createLinearGradient(0, 0, 0, s.height);
        backgroundGradient.addColorStop(0, "#0a1730");
        backgroundGradient.addColorStop(0.55, "#050b18");
        backgroundGradient.addColorStop(1, "#02050c");
      }
      ctx.fillStyle = backgroundGradient;
      ctx.fillRect(0, 0, s.width, s.height);

      ctx.fillStyle = "#dff3ff";
      for (const star of s.stars) {
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const drawShip = () => {
      if (s.damageCooldown > 0 && s.shieldTimer <= 0 && Math.floor(performance.now() / 85) % 2 === 0) return;
      const x = s.shipX;
      const y = s.shipY;
      const w = s.shipW;
      const h = s.shipH;
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);

      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "rgba(78,167,255,.55)";
      ctx.beginPath();
      ctx.ellipse(0, h * 0.42, w * 0.36, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Layered fighter silhouette: twin swept wings, armored fuselage,
      // cockpit glass and paired engine exhausts. Avoid the old plain triangle.
      ctx.shadowColor = "rgba(54,151,255,.42)";
      ctx.shadowBlur = 7;
      const wing = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      wing.addColorStop(0, "#24549b");
      wing.addColorStop(0.5, "#c4e8ff");
      wing.addColorStop(1, "#24549b");
      ctx.fillStyle = wing;
      ctx.beginPath();
      ctx.moveTo(0, -h * .49);
      ctx.lineTo(w * .19, -h * .08);
      ctx.lineTo(w * .49, h * .19);
      ctx.lineTo(w * .39, h * .34);
      ctx.lineTo(w * .14, h * .22);
      ctx.lineTo(w * .12, h * .46);
      ctx.lineTo(-w * .12, h * .46);
      ctx.lineTo(-w * .14, h * .22);
      ctx.lineTo(-w * .39, h * .34);
      ctx.lineTo(-w * .49, h * .19);
      ctx.lineTo(-w * .19, -h * .08);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      const hull = ctx.createLinearGradient(-w * .16, 0, w * .16, 0);
      hull.addColorStop(0, "#4e82c6");
      hull.addColorStop(.45, "#f2fbff");
      hull.addColorStop(1, "#5b9fe8");
      ctx.fillStyle = hull;
      ctx.beginPath();
      ctx.moveTo(0, -h * .5);
      ctx.lineTo(w * .15, -h * .02);
      ctx.lineTo(w * .11, h * .36);
      ctx.lineTo(0, h * .48);
      ctx.lineTo(-w * .11, h * .36);
      ctx.lineTo(-w * .15, -h * .02);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#173657";
      ctx.beginPath();
      ctx.ellipse(0, -h * .12, w * .105, h * .155, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(122,224,255,.95)";
      ctx.beginPath();
      ctx.ellipse(-w * .025, -h * .16, w * .045, h * .085, -.18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffbf68";
      ctx.fillRect(-w * .29, h * .23, w * .075, h * .12);
      ctx.fillRect(w * .215, h * .23, w * .075, h * .12);
      ctx.fillStyle = "#62d7ff";
      ctx.fillRect(-w * .27, h * .35, w * .035, h * .1);
      ctx.fillRect(w * .235, h * .35, w * .035, h * .1);

      ctx.restore();
      if (s.shieldTimer > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(86,226,255,${0.42 + Math.sin(performance.now() / 120) * 0.12})`;
        ctx.fillStyle = "rgba(70,210,255,.055)";
        ctx.lineWidth = 2;
        ctx.shadowColor = "rgba(66,219,255,.9)";
        ctx.shadowBlur = 9;
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w * .78, h * .8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    };

    const drawMeteor = (meteor: Meteor) => {
      if (!meteor.active) return;

      // Draw the trail as one lightweight tapered stroke; radial gradients per
      // trail point caused unnecessary GPU work on phones.
      const trailLen = meteor.trail.length;
      if (trailLen > 1) {
        ctx.save();
        ctx.globalAlpha = meteor.elite ? 0.28 : 0.17;
        ctx.strokeStyle = meteor.elite ? "#ffc75d" : "#7ebcff";
        ctx.lineWidth = Math.max(1.5, meteor.size * 0.42);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(meteor.trail[trailLen - 1].x, meteor.trail[trailLen - 1].y);
        for (let i = trailLen - 2; i >= 0; i -= 1) {
          ctx.lineTo(meteor.trail[i].x, meteor.trail[i].y);
        }
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.translate(meteor.x, meteor.y);
      ctx.rotate(meteor.rot);

      // إضاءة من زاوية ثابتة (مو من المنتصف) عشان تحس بعمق/نتوءات
      // حقيقية على سطح الصخرة بدل تدرج كروي مسطح.
      const grad = ctx.createRadialGradient(
        -meteor.size * 0.28,
        -meteor.size * 0.28,
        meteor.size * 0.08,
        0,
        0,
        meteor.size * 1.05
      );

      if (meteor.elite) {
        grad.addColorStop(0, "#fff6da");
        grad.addColorStop(0.5, "#ffcf5c");
        grad.addColorStop(1, "#8a5a12");
      } else {
        grad.addColorStop(0, "#cddcef");
        grad.addColorStop(0.55, "#7c8ea8");
        grad.addColorStop(1, "#262e40");
      }

      ctx.fillStyle = grad;
      ctx.beginPath();

      // شكل صخري غير منتظم (مولّد مرة وحدة عند الإنشاء، مخزن
      // بـmeteor.shape) بدل النجمة المتماثلة القديمة.
      const points = meteor.shape.length;
      for (let i = 0; i < points; i += 1) {
        const angle = (i / points) * Math.PI * 2;
        const radius = meteor.size * meteor.shape[i];
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }

      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = meteor.elite
        ? "rgba(255,255,255,.55)"
        : "rgba(255,255,255,.14)";
      ctx.lineWidth = meteor.elite ? 1.5 : 1;
      ctx.stroke();

      if (meteor.elite) {
        // عروق ذهبية متوهجة على الصخور النادرة (مكافأة أعلى)
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,.85)";
        ctx.lineWidth = 1.4;
        ctx.shadowColor = "rgba(255,214,110,.9)";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.moveTo(-meteor.size * 0.32, -meteor.size * 0.12);
        ctx.lineTo(meteor.size * 0.12, meteor.size * 0.04);
        ctx.lineTo(-meteor.size * 0.02, meteor.size * 0.42);
        ctx.stroke();
        ctx.restore();
      } else {
        // فوهات/حفر سطحية للصخور العادية
        ctx.fillStyle = "rgba(10,14,24,.4)";
        for (const crater of meteor.craters) {
          ctx.beginPath();
          ctx.arc(
            crater.x * meteor.size,
            crater.y * meteor.size,
            crater.r * meteor.size,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }

      ctx.restore();
    };

    const drawFighter = (fighter: Fighter) => {
      ctx.save();
      ctx.translate(fighter.x, fighter.y);
      ctx.rotate(Math.PI);
      const bodyColor = fighter.kind === "tank" ? "#d6a34b" : fighter.kind === "bomber" ? "#54d6b2" : fighter.kind === "hunter" ? "#ff963f" : fighter.kind === "striker" ? "#b66bff" : "#ff4d70";
      ctx.shadowColor = bodyColor;
      ctx.shadowBlur = 2;
      const grad = ctx.createLinearGradient(0, -fighter.h / 2, 0, fighter.h / 2);
      grad.addColorStop(0, "#f5fbff");
      grad.addColorStop(0.35, bodyColor);
      grad.addColorStop(1, "#352038");
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (fighter.kind === "tank") {
        ctx.moveTo(-fighter.w * .28, -fighter.h * .45);
        ctx.lineTo(fighter.w * .28, -fighter.h * .45);
        ctx.lineTo(fighter.w * .5, -fighter.h * .12);
        ctx.lineTo(fighter.w * .44, fighter.h * .34);
        ctx.lineTo(fighter.w * .22, fighter.h * .48);
        ctx.lineTo(-fighter.w * .22, fighter.h * .48);
        ctx.lineTo(-fighter.w * .44, fighter.h * .34);
        ctx.lineTo(-fighter.w * .5, -fighter.h * .12);
      } else if (fighter.kind === "bomber") {
        ctx.moveTo(0, -fighter.h * .42);
        ctx.lineTo(fighter.w * .2, -fighter.h * .16);
        ctx.lineTo(fighter.w * .48, fighter.h * .05);
        ctx.lineTo(fighter.w * .34, fighter.h * .25);
        ctx.lineTo(fighter.w * .18, fighter.h * .18);
        ctx.lineTo(fighter.w * .12, fighter.h * .46);
        ctx.lineTo(-fighter.w * .12, fighter.h * .46);
        ctx.lineTo(-fighter.w * .18, fighter.h * .18);
        ctx.lineTo(-fighter.w * .34, fighter.h * .25);
        ctx.lineTo(-fighter.w * .48, fighter.h * .05);
        ctx.lineTo(-fighter.w * .2, -fighter.h * .16);
      } else {
        ctx.moveTo(0, -fighter.h * .48);
        ctx.lineTo(fighter.w * .18, -fighter.h * .06);
        ctx.lineTo(fighter.w * .5, fighter.h * .24);
        ctx.lineTo(fighter.w * .36, fighter.h * .32);
        ctx.lineTo(fighter.w * .14, fighter.h * .2);
        ctx.lineTo(fighter.w * .12, fighter.h * .48);
        ctx.lineTo(-fighter.w * .12, fighter.h * .48);
        ctx.lineTo(-fighter.w * .14, fighter.h * .2);
        ctx.lineTo(-fighter.w * .36, fighter.h * .32);
        ctx.lineTo(-fighter.w * .5, fighter.h * .24);
        ctx.lineTo(-fighter.w * .18, -fighter.h * .06);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#182b45";
      ctx.beginPath();
      ctx.ellipse(0, -fighter.h * .08, fighter.w * .105, fighter.h * .16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(180,235,255,.95)";
      ctx.fillRect(-fighter.w * .045, -fighter.h * .16, fighter.w * .045, fighter.h * .12);
      ctx.fillStyle = bodyColor;
      ctx.fillRect(-fighter.w * .35, fighter.h * .15, fighter.w * .18, fighter.h * .12);
      ctx.fillRect(fighter.w * .17, fighter.h * .15, fighter.w * .18, fighter.h * .12);
      ctx.restore();
      if (fighter.maxHp > 1) {
        const barW = fighter.w * .72;
        ctx.fillStyle = "rgba(0,0,0,.55)";
        ctx.fillRect(fighter.x - barW / 2, fighter.y - fighter.h / 2 - 8, barW, 3);
        ctx.fillStyle = bodyColor;
        ctx.fillRect(fighter.x - barW / 2, fighter.y - fighter.h / 2 - 8, barW * Math.max(0, fighter.hp / fighter.maxHp), 3);
      }
    };

    const drawEnemyShot = (shot: EnemyShot) => {
      ctx.save();
      ctx.fillStyle = "#ff526f";
      ctx.shadowColor = "rgba(255,62,97,.95)";
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.arc(shot.x, shot.y, shot.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawPowerup = (item: PowerUp) => {
      const color = item.kind === "shield" ? "#61e8ff" : item.kind === "spread" ? "#b984ff" : "#ffd46b";
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.spin);
      ctx.shadowColor = color;
      ctx.shadowBlur = 7;
      ctx.fillStyle = "rgba(8,18,34,.92)";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(12, -4);
      ctx.lineTo(8, 10);
      ctx.lineTo(-8, 10);
      ctx.lineTo(-12, -4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.rotate(-item.spin);
      ctx.fillStyle = color;
      ctx.font = "800 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.kind === "shield" ? "S" : item.kind === "spread" ? "W" : "R", 0, 1);
      ctx.restore();
    };

    const drawBoss = () => {
      const boss = s.boss;
      if (!boss) return;
      ctx.save();
      ctx.translate(boss.x, boss.y);
      const w = boss.w;
      const h = boss.h;
      ctx.shadowColor = "rgba(255,61,87,.85)";
      ctx.shadowBlur = 9;
      const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      grad.addColorStop(0, "#ebeff8");
      grad.addColorStop(.35, "#8f9bae");
      grad.addColorStop(1, "#282e3d");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-w * .28, -h * .42);
      ctx.lineTo(w * .28, -h * .42);
      ctx.lineTo(w * .39, -h * .15);
      ctx.lineTo(w * .5, h * .24);
      ctx.lineTo(w * .29, h * .18);
      ctx.lineTo(w * .17, h * .48);
      ctx.lineTo(-w * .17, h * .48);
      ctx.lineTo(-w * .29, h * .18);
      ctx.lineTo(-w * .5, h * .24);
      ctx.lineTo(-w * .39, -h * .15);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.48)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "#ff3e60";
      ctx.shadowColor = "#ff234e";
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.ellipse(0, h * .08, w * .11, h * .2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffbd64";
      ctx.fillRect(-w * .39, h * .12, w * .12, h * .09);
      ctx.fillRect(w * .27, h * .12, w * .12, h * .09);
      ctx.restore();

      const barW = Math.min(s.width - 44, 280);
      const barX = (s.width - barW) / 2;
      const barY = boss.y + boss.h / 2 + 14;
      ctx.fillStyle = "rgba(0,0,0,.65)";
      ctx.fillRect(barX, barY, barW, 7);
      const hpGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
      hpGrad.addColorStop(0, "#ff3d61");
      hpGrad.addColorStop(1, "#ffa24f");
      ctx.fillStyle = hpGrad;
      ctx.fillRect(barX, barY, barW * Math.max(0, boss.hp / boss.maxHp), 7);
      ctx.fillStyle = "#ffc2cc";
      ctx.font = "700 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${t("gameCanvas.boss")}  ${Math.max(0, boss.hp)}/${boss.maxHp}`, s.width / 2, barY - 5);
    };

    const drawLaser = (laser: Laser) => {
      ctx.save();
      ctx.fillStyle = "#7cf0ff";
      ctx.shadowColor = "rgba(124,240,255,.8)";
      ctx.shadowBlur = 4;
      ctx.fillRect(laser.x, laser.y, 4, 18);
      ctx.restore();
    };

    const drawBurst = (burstItem: Burst) => {
      ctx.save();
      ctx.globalAlpha = clamp(burstItem.life * 2, 0, 1);
      ctx.fillStyle = burstItem.color;
      ctx.beginPath();
      ctx.arc(burstItem.x, burstItem.y, burstItem.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawBanner = () => {
      if (s.banner.timer <= 0) return;

      const isWave = s.banner.tone === "wave";
      const alpha = clamp(s.banner.timer / (isWave ? 0.42 : 1.05), 0, 1);
      const intro = isWave
        ? 0.94 + 0.06 * (1 - clamp((1.65 - s.banner.timer) / 0.22, 0, 1))
        : 1;
      const fillColor =
        s.banner.tone === "win"
          ? "rgba(255,210,90,.08)"
          : s.banner.tone === "lose"
            ? "rgba(255,90,90,.08)"
            : "rgba(5,13,28,.76)";
      const strokeColor =
        s.banner.tone === "win"
          ? "rgba(255,210,90,.38)"
          : s.banner.tone === "lose"
            ? "rgba(255,100,100,.38)"
            : "rgba(78,167,255,.56)";

      ctx.save();
      ctx.globalAlpha = alpha;

      // Wave announcements are deliberately non-blocking: no fullscreen dim,
      // no backdrop blur, and the entire simulation keeps drawing behind them.
      if (!isWave) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, 0, s.width, s.height);
      }

      const boxW = Math.min(s.width - 36, isWave ? 330 : 360);
      const boxH = isWave ? 88 : 114;
      const boxX = (s.width - boxW) / 2;
      const boxY = isWave ? s.height * 0.22 : s.height * 0.23;

      ctx.translate(s.width / 2, boxY + boxH / 2);
      ctx.scale(intro, intro);
      ctx.translate(-s.width / 2, -(boxY + boxH / 2));

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isWave ? 1.2 : 1.5;
      roundRect(ctx, boxX, boxY, boxW, boxH, isWave ? 18 : 22);
      ctx.fill();
      ctx.stroke();

      if (isWave) {
        const ruleY = boxY + 21;
        const ruleW = Math.min(54, boxW * 0.18);
        const centerX = s.width / 2;
        ctx.strokeStyle = "rgba(117,204,255,.78)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerX - ruleW - 12, ruleY);
        ctx.lineTo(centerX - 7, ruleY);
        ctx.moveTo(centerX + 7, ruleY);
        ctx.lineTo(centerX + ruleW + 12, ruleY);
        ctx.stroke();
      }

      ctx.fillStyle = s.banner.tone === "win" ? "#ffe19a" : s.banner.tone === "lose" ? "#ffb0b8" : "#e5f5ff";
      ctx.font = isWave ? "800 24px Inter, system-ui, sans-serif" : "700 22px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.banner.title, s.width / 2, boxY + (isWave ? 42 : 42));

      ctx.fillStyle = isWave ? "#9bc9e8" : "#aab8ca";
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.fillText(s.banner.subtitle, s.width / 2, boxY + (isWave ? 66 : 78));
      ctx.restore();
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

    const update = (dt: number) => {
      if (s.banner.timer > 0) s.banner.timer -= dt;
      if (s.waveFlash > 0) s.waveFlash = Math.max(0, s.waveFlash - dt * 1.8);
      s.shieldTimer = Math.max(0, s.shieldTimer - dt);
      s.damageCooldown = Math.max(0, s.damageCooldown - dt);
      s.spreadShotTimer = Math.max(0, s.spreadShotTimer - dt);
      s.rapidFireTimer = Math.max(0, s.rapidFireTimer - dt);

      if (s.phase === "active") {
        // Smooth easing applies while dragging as well, avoiding the jittery
        // one-frame jumps from raw pointer coordinates.
        const follow = 1 - Math.exp(-dt * (s.dragging ? 20 : 11));
        s.shipX = lerp(s.shipX, s.targetX, follow);
        s.shipY = lerp(s.shipY, s.targetY, follow);

        s.shipX = clamp(s.shipX, 16, s.width - s.shipW - 16);
        s.shipY = clamp(s.shipY, s.height * 0.34, s.height - s.shipH - 18);

        s.shootCd += dt;
        const fireInterval = s.rapidFireTimer > 0 ? 0.072 : 0.15;
        if (s.shootCd >= fireInterval) {
          s.shootCd = 0;
          addLaser();
        }

        spawnFromQueue(dt);
        updateLasers(dt);
        if (s.bossSpawnTimer > 0) {
          s.bossSpawnTimer = Math.max(0, s.bossSpawnTimer - dt);
          if (s.bossSpawnTimer <= 0 && s.wave === TOTAL_WAVES && !s.boss) spawnBoss();
        }

        const ended = updateMeteors(dt);
        if (ended) return true;
        updateFightersAndBoss(dt);
        if (s.phase !== "active") return true;
        updatePowerups(dt);
        updateBursts(dt);
        updateStars(dt);

        hudUiTimer += dt;
        if (hudUiTimer >= 0.2) {
          hudUiTimer = 0;
          const upgrade = activeUpgradeText();
          if (upgrade !== lastUpgradeUi || s.kills !== lastHudKills) {
            lastUpgradeUi = upgrade;
            lastHudKills = s.kills;
            setHud((previous) => ({ ...previous, kills: s.kills, upgrade }));
          }
        }

        // Wave transitions are presentation-only. There is no paused phase;
        // the next wave is appended immediately after the announcement starts.
        const waveCleared =
          s.spawnQueue.length === 0 &&
          s.meteors.length === 0 &&
          s.fighters.length === 0 &&
          s.boss === null &&
          s.bossSpawnTimer <= 0;

        if (waveCleared) {
          if (s.wave >= TOTAL_WAVES) {
            finishWin();
            return true;
          }

          sfx("clear");
          const nextWave = s.wave + 1;
          const bossWave = nextWave === TOTAL_WAVES;
          s.banner = {
            title: t("gameCanvas.waveLabel", { n: nextWave }),
            subtitle: bossWave ? t("gameCanvas.bossIncoming") : t("gameCanvas.waveClearContinue"),
            timer: 1.65,
            tone: "wave",
          };
          s.waveFlash = Math.max(s.waveFlash, 0.12);
          // Advance immediately. The cinematic title is kept by preserveAnnouncement,
          // while live shots, powerups, bursts and the starfield survive the transition.
          spawnWave(nextWave, true);
        }
      } else {
        updateBursts(dt);
        updateStars(dt);
      }

      if (s.shake > 0) s.shake = Math.max(0, s.shake - dt);
      return false;
    };

    const draw = () => {
      drawBackground();

      if (s.waveFlash > 0) {
        ctx.save();
        ctx.globalAlpha = s.waveFlash * 0.18;
        ctx.fillStyle = "#4ea7ff";
        ctx.fillRect(0, 0, s.width, s.height);
        ctx.restore();
      }

      if (s.shake > 0) {
        const sx = (Math.random() - 0.5) * 8 * s.shake;
        const sy = (Math.random() - 0.5) * 8 * s.shake;
        ctx.save();
        ctx.translate(sx, sy);
      }

      for (const laser of s.lasers) drawLaser(laser);
      for (const meteor of s.meteors) drawMeteor(meteor);
      for (const fighter of s.fighters) drawFighter(fighter);
      for (const shot of s.enemyShots) drawEnemyShot(shot);
      for (const item of s.powerups) drawPowerup(item);
      drawBoss();
      for (const burstItem of s.bursts) drawBurst(burstItem);
      drawShip();

      if (s.shake > 0) ctx.restore();

      drawBanner();

      if (!bottomGlowGradient) {
        bottomGlowGradient = ctx.createLinearGradient(0, s.height - 160, 0, s.height);
        bottomGlowGradient.addColorStop(0, "rgba(78,167,255,0)");
        bottomGlowGradient.addColorStop(1, "rgba(78,167,255,.20)");
      }
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = bottomGlowGradient;
      ctx.fillRect(0, s.height - 160, s.width, 160);
      ctx.restore();
    };

    const setTargetFromEvent = (clientX: number, clientY: number) => {
      s.targetX = clamp(clientX - canvasRect.left - s.shipW / 2, 16, s.width - s.shipW - 16);
      s.targetY = clamp(clientY - canvasRect.top - s.shipH / 2, s.height * 0.34, s.height - s.shipH - 18);

    };

    const onPointerDown = async (event: PointerEvent) => {
      s.dragging = true;
      setTargetFromEvent(event.clientX, event.clientY);
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch {
        // ignore
      }
      // Start/resume the audio context directly from the first touch gesture.
      // Calling this before awaiting avoids browsers losing the user-gesture permission.
      void ensureAudio().then(() => startMusicRef.current()).catch(() => {});
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!s.dragging) return;
      setTargetFromEvent(event.clientX, event.clientY);
    };

    const onPointerUp = () => {
      s.dragging = false;
    };

    const onVisibilityChange = () => {
      lastTimeRef.current = 0;
      if (document.hidden && audioRef.current?.state === "running") {
        void audioRef.current.suspend().catch(() => {});
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      const width = parent?.clientWidth || window.innerWidth;
      const height = parent?.clientHeight || window.innerHeight;
      const dimensionsChanged = s.width !== width || s.height !== height;
      const deviceDpr = window.devicePixelRatio || 1;
      const dpr = Math.min(deviceDpr, width < 600 ? 1.35 : 1.5);

      canvasRect = canvas.getBoundingClientRect();
      if (!dimensionsChanged && s.dpr === dpr && canvas.width === Math.floor(width * dpr) && canvas.height === Math.floor(height * dpr)) {
        return;
      }
      s.width = width;
      s.height = height;
      s.dpr = dpr;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      backgroundGradient = ctx.createLinearGradient(0, 0, 0, height);
      backgroundGradient.addColorStop(0, "#0a1730");
      backgroundGradient.addColorStop(0.55, "#050b18");
      backgroundGradient.addColorStop(1, "#02050c");
      bottomGlowGradient = ctx.createLinearGradient(0, height - 160, 0, height);
      bottomGlowGradient.addColorStop(0, "rgba(78,167,255,0)");
      bottomGlowGradient.addColorStop(1, "rgba(78,167,255,.20)");

      if (s.stars.length === 0 || dimensionsChanged) {
        s.stars = makeStars(width, height);
      }

      s.shipX = width / 2 - s.shipW / 2;
      s.shipY = height - 120;
      s.targetX = s.shipX;
      s.targetY = s.shipY;
    };

    resize();
    spawnWave(1);

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas.parentElement);
    }
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);

    rafRef.current = requestAnimationFrame(function loop(time: number) {
      if (document.hidden) {
        lastTimeRef.current = 0;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = Math.min(0.033, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      update(dt);
      draw();

      rafRef.current = requestAnimationFrame(loop);
    });

    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      resizeObserver?.disconnect();
      resizeObserver = null;

      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerUp);

      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (musicTimer) clearInterval(musicTimer);
      musicTimer = null;
      if (musicSource) {
        try { musicSource.stop(); } catch { /* already stopped */ }
        musicSource.disconnect();
        musicSource = null;
      }
      masterGainRef.current = null;

      // Close the AudioContext when leaving the game.
      // Without this, every GameCanvas session could keep an audio
      // context alive and make later sessions progressively heavier.
      if (audioRef.current) {
        const context = audioRef.current;
        audioRef.current = null;
        void context.close().catch(() => {});
      }

      // Release references to large game arrays immediately.
      s.meteors.length = 0;
      s.spawnQueue.length = 0;
      s.lasers.length = 0;
      s.fighters.length = 0;
      s.enemyShots.length = 0;
      s.powerups.length = 0;
      s.boss = null;
      s.bursts.length = 0;
      s.stars.length = 0;

      lastTimeRef.current = 0;
    };
  }, []);

  return (
    <section className="game-shell">
      <canvas ref={canvasRef} className="game-canvas" />

      <div className="game-hud">
        <button
          className="hud-back"
          onClick={() => onExit(payoutRef.current)}
          aria-label={t("gameCanvas.backToLobby")}
        >
          <UiIcons name="back" className="hud-back-icon" />
        </button>

        <button
          className="hud-mute"
          type="button"
          onClick={() => {
            const next = !soundOn;
            soundOnRef.current = next;
            setSoundOn(next);
            const context = audioRef.current;
            if (masterGainRef.current && context) {
              masterGainRef.current.gain.setTargetAtTime(next ? 0.88 : 0, context.currentTime, 0.035);
            }
            if (next) {
              if (context?.state === "suspended") void context.resume();
              startMusicRef.current();
            }
          }}
          aria-label={soundOn ? t("gameCanvas.soundOff") : t("gameCanvas.soundOn")}
          title={soundOn ? t("gameCanvas.soundOff") : t("gameCanvas.soundOn")}
        >
          <svg viewBox="0 0 24 24" className="hud-mute-icon" aria-hidden="true">
            <path d="M4 10v4h4l5 4V6l-5 4H4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            {soundOn ? <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /> : <path d="m16 9 5 6m0-6-5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />}
          </svg>
        </button>

        <div className="hud-row">
          <div className="hud-chip">
            <small>{t("gameCanvas.wave")}</small>
            <strong>
              {hud.wave}/{TOTAL_WAVES}
            </strong>
          </div>

          <div className="hud-chip gold">
            <small>{t("gameCanvas.reward")}</small>
            <strong>{result?.tone === "lose" ? 0 : mission.reward}</strong>
          </div>

          <div className="hud-chip cyan">
            <small>{t("gameCanvas.energy")}</small>
            <strong>{hud.energy}/5</strong>
          </div>

          <div className="hud-chip">
            <small>{t("gameCanvas.kills")}</small>
            <strong>{hud.kills}</strong>
          </div>
        </div>

        <div className={`hud-status${hud.upgrade ? " upgraded" : ""}`}>{hud.upgrade || hud.status}</div>
      </div>

      {result && (
        <div className="game-overlay">
          <div className={`result-card ${result.tone}`}>
            <p className="result-kicker">
              {result.tone === "win" ? t("gameCanvas.victory") : t("gameCanvas.runEnded")}
            </p>
            <h2>{result.title}</h2>
            <span>{result.text}</span>
            <button onClick={() => onExit(payoutRef.current)}>{t("gameCanvas.backToLobby")}</button>
          </div>
        </div>
      )}
    </section>
  );
}

