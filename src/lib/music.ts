import { useSyncExternalStore } from "react";

// موسيقى الخلفية. خفيفة: ما ينحمّل أي ملف صوت إلا لما الموسيقى تشتغل فعلاً.
// الموسيقى دايماً متوقفة لما يفتح التطبيق، والمستخدم هو اللي يشغّلها.
// وكل فتحة تنختار أغنية عشوائية من الثنتين لما يضغط تشغيل.

export type TrackId = "re4" | "re7";

export const TRACKS: { id: TrackId; src: string }[] = [
  { id: "re4", src: "/music/re4-serenity.mp3" },
  { id: "re7", src: "/music/re7-saferoom.mp3" },
];

const VOLUME = 0.35;

type State = { enabled: boolean; track: TrackId };

// الأغنية عشوائية كل فتحة (ما تنحفظ)
let state: State = {
  enabled: false, // دايماً متوقفة عند الفتح
  track: Math.random() < 0.5 ? "re4" : "re7",
};
let audio: HTMLAudioElement | null = null;
let fadeTimer: number | null = null;
let unlocked = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function other(id: TrackId): TrackId {
  return id === "re4" ? "re7" : "re4";
}

function srcOf(id: TrackId) {
  return (TRACKS.find((t) => t.id === id) ?? TRACKS[0]).src;
}

function ensureAudio(): HTMLAudioElement {
  if (audio) return audio;
  const a = new Audio();
  a.preload = "none";
  a.volume = 0;
  a.src = srcOf(state.track);
  // لما تخلص الأغنية تنتقل للثانية وتكمل بالتناوب
  a.addEventListener("ended", () => {
    state = { ...state, track: other(state.track) };
    emit();
    a.src = srcOf(state.track);
    void a.play().catch(() => {});
  });
  audio = a;
  return a;
}

function fadeTo(target: number, ms: number) {
  if (!audio) return;
  const a = audio;
  if (fadeTimer !== null) window.clearInterval(fadeTimer);
  const from = a.volume;
  const steps = 10;
  let i = 0;
  fadeTimer = window.setInterval(() => {
    i += 1;
    a.volume = Math.min(1, Math.max(0, from + ((target - from) * i) / steps));
    if (i >= steps) {
      if (fadeTimer !== null) window.clearInterval(fadeTimer);
      fadeTimer = null;
      if (target === 0) a.pause();
    }
  }, ms / steps);
}

async function playNow() {
  if (!state.enabled || document.hidden) return;
  const a = ensureAudio();
  if (!a.paused && a.volume > 0 && fadeTimer === null) return;
  try {
    if (a.paused) a.volume = 0;
    await a.play();
    fadeTo(VOLUME, 600);
  } catch {
    /* ينتظر لمسة المستخدم */
  }
}

function pauseSoft() {
  if (audio && !audio.paused) fadeTo(0, 250);
}

// زر التشغيل / الإيقاف المؤقت
export function toggleMusic() {
  state = { ...state, enabled: !state.enabled };
  emit();
  unlocked = true; // الضغطة نفسها لمسة من المستخدم
  if (state.enabled) void playNow();
  else pauseSoft();
}

// زر التبديل بين الأغنيتين
export function switchTrack() {
  state = { enabled: true, track: other(state.track) };
  emit();
  unlocked = true;
  const a = ensureAudio();
  a.src = srcOf(state.track);
  a.volume = 0;
  void a
    .play()
    .then(() => fadeTo(VOLUME, 600))
    .catch(() => {});
}

// تُستدعى مرة وحدة بعد فتح التطبيق
export function initMusic() {
  // لا يوجد تشغيل تلقائي. بس لو المستخدم شغّلها ثم طلع من التطبيق تتوقف، ولما يرجع تكمل
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseSoft();
    else if (state.enabled && unlocked) void playNow();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return state;
}

export function useMusic(): State {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
