import { useSyncExternalStore } from "react";
import { setCanvasMono } from "../lib/gameTheme";

export type Theme = "color" | "mono";

// نسخة محلية بس عشان الفتح يكون فوري بدون وميض.
// المرجع الحقيقي هو حساب اللاعب على السيرفر (players.theme)، ويتزامن بعد ما التطبيق يفتح.
const CACHE_KEY = "sly.theme.v1";

const listeners = new Set<() => void>();
let current: Theme = readCache();
let monoAssets: Promise<void> | null = null;

function readCache(): Theme {
  try {
    return window.localStorage.getItem(CACHE_KEY) === "mono" ? "mono" : "color";
  } catch {
    return "color";
  }
}

function writeCache(value: Theme) {
  try {
    window.localStorage.setItem(CACHE_KEY, value);
  } catch {
    /* ignore */
  }
}

function getInitData(): string {
  try {
    const tg = (window as unknown as { Telegram?: { WebApp?: { initData?: string } } })
      .Telegram?.WebApp;
    return tg?.initData || "";
  } catch {
    return "";
  }
}

// undefined = ما قدرنا نعرف (بدون تيليجرام / فشل الشبكة) → نبقى على النسخة المحلية
// null      = اللاعب ما اختار قبل → ألوان
async function fetchServerTheme(): Promise<Theme | null | undefined> {
  const initData = getInitData();
  if (!initData) return undefined;
  try {
    const res = await fetch("/api/profile/theme", {
      cache: "no-store",
      headers: { Authorization: `tga ${initData}` },
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    if (data?.theme === "mono") return "mono";
    if (data?.theme === "color") return "color";
    return null;
  } catch {
    return undefined;
  }
}

function saveServerTheme(value: Theme) {
  const initData = getInitData();
  if (!initData) return;
  fetch("/api/profile/theme", {
    method: "POST",
    keepalive: true,
    headers: {
      "Content-Type": "application/json",
      Authorization: `tga ${initData}`,
    },
    body: JSON.stringify({ theme: value }),
  }).catch(() => {
    /* ما يأثر على المستخدم */
  });
}

function addMonoFonts() {
  if (document.getElementById("sly-mono-fonts")) return;
  const link = document.createElement("link");
  link.id = "sly-mono-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap";
  document.head.appendChild(link);
}

// ملف الأبيض والأسود ما ينحمّل إلا لما أحد يحتاجه، فنسخة الألوان تبقى خفيفة.
function loadMonoAssets(): Promise<void> {
  if (!monoAssets) {
    monoAssets = import("../styles/theme-mono.css").then(() => {
      addMonoFonts();
    });
    monoAssets.catch(() => {
      monoAssets = null;
    });
  }
  return monoAssets;
}

function apply(next: Theme) {
  const root = document.documentElement;
  // نوقف الـtransitions لحظة التبديل عشان التغيير يطلع فوري بدون تقطيع
  root.classList.add("theme-switching");
  root.setAttribute("data-theme", next);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", next === "mono" ? "#050505" : "#05090b");
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.remove("theme-switching")),
  );
}

async function commit(next: Theme, fromUser: boolean): Promise<void> {
  if (next === current) return;

  if (next === "mono") {
    try {
      await loadMonoAssets();
    } catch {
      return; // فشل التحميل (مثلاً النت) → نبقى على الألوان
    }
  }

  current = next;
  writeCache(next);
  setCanvasMono(next === "mono");
  apply(next);
  listeners.forEach((l) => l());

  if (fromUser) saveServerTheme(next);
}

export function getTheme(): Theme {
  return current;
}

// المستخدم ضغط على زر المظهر
export function setTheme(next: Theme): Promise<void> {
  return commit(next, true);
}

// تُستدعى مرة وحدة قبل ما React يبدأ.
export function initTheme(): Promise<void> {
  setCanvasMono(current === "mono");

  if (current !== "mono") {
    apply("color");
    return Promise.resolve();
  }

  return loadMonoAssets()
    .then(() => apply("mono"))
    .catch(() => {
      current = "color";
      setCanvasMono(false);
      apply("color");
    });
}

// بعد فتح التطبيق: نطابق مع اللي محفوظ على حساب اللاعب.
// لاعب جديد (ما اختار قبل) = ألوان دايماً.
export async function syncThemeFromServer(): Promise<void> {
  const server = await fetchServerTheme();
  if (server === undefined) return;
  await commit(server ?? "color", false);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, getTheme);
}
