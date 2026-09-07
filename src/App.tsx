import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import Background from "./components/Background";
import BottomNav from "./components/BottomNav";
import TopBar from "./components/TopBar";

import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Referrals from "./pages/Referrals";
import Profile from "./pages/Profile";
import Stars from "./pages/Stars";
import Games from "./pages/Games";
import GameCanvas from "./components/GameCanvas";
import MandatorySubscription from "./components/MandatorySubscription";
import SplashScreen from "./components/SplashScreen";
import { tryAcquireGlobalAdLock, releaseGlobalAdLock, getAdLockWaitSeconds } from "./lib/adLock";

import ExchangeModal from "./modals/ExchangeModal";
import WithdrawalModal from "./modals/WithdrawalModal";

export type Page = "home" | "tasks" | "referrals" | "stars" | "games" | "profile";
type ActivityTone = "info" | "reward" | "exchange";

type Activity = {
  id: string;
  title: string;
  meta: string;
  tone: ActivityTone;
};

type WalletState = {
  coins: number;
  usdt: number;
  spent: number;
  walletAddress: string | null;
};

type AdsgramShowResult = {
  done: boolean;
  description: string;
  state: "load" | "render" | "playing" | "destroy";
  error: boolean;
};

type AdsgramController = {
  show: () => Promise<AdsgramShowResult>;
  addEventListener?: (event: string, callback: () => void) => void;
};

declare global {
  interface Window {
    showAdsGalaxy?: () => Promise<any>;
    Adsgram?: {
      init: (opts: { blockId: string }) => AdsgramController;
    };
  }
}


type MiningState = {
  active: boolean;
  reward: number;
  cycleHours: number;
  startedAt: string | null;
  claimAvailableAt: string | null;
  claimReady: boolean;
  startAdVerified: boolean;
  claimAdVerified: boolean;
};

type WithdrawalHistoryEntry = {
  id: number;
  amount: number;
  method: "binance" | "bnb";
  target: string | null;
  bnbAmount: number | null;
  status: "pending" | "completed" | "rejected";
  createdAt: string;
};

const ADSGRAM_BLOCK_ID = "int-46084";
const ADSGRAM_MINING_BLOCK_ID = "46086";
const ADSGRAM_STARS_BLOCK_ID = "46086";
// عدّل هذا لاحقاً برقم Block ID حقيقي من لوحة Adsgram (سوّي وحدة
// إعلانية جديدة بالاسم اللي تحب، مثلاً "SLY Games"). مؤقتاً يستخدم
// نفس وحدة Stars لحد ما تسوي وحدة مخصصة.
const ADSGRAM_GAMES_BLOCK_ID = "46086";
// Stars uses server-side AdsGram reward verification like Mining/Games.
const ADSGRAM_SCRIPT_SRC = "https://sad.adsgram.ai/js/sad.min.js";
// كانت 45 ثانية بس هذا قصير: لو المتصفح/تيليگرام WebView حط تبويبنا
// بالخلفية وقت عرض الإعلان (شي عادي على موبايل)، المؤقتات تتجمّد
// وترجع تشتغل دفعة وحدة بعدين، فـ.show() يتأخر يرجع والمهلة تكون
// خلصت أصلاً - فنعتبرها "فشلت" رغم إن المستخدم اتفرّج على الإعلان
// فعلاً. رفعناها لـ90 ثانية لهامش أكبر.
const MINING_AD_SHOW_TIMEOUT_MS = 90000;
// نص ثابت نستخدمه بمهلة .show() نفسها، نقارن عليه بالـcatch عشان
// نميّز "فشل المهلة" (ممكن الإعلان يكون انعرض فعلاً) عن فشل حقيقي
// آخر (مثلاً الإعلان مو جاهز أو القفل مشغول). بالحالة الأولى ما
// نلغي الـintent، لأن webhook AdsGram الحقيقي ممكن يوصل متأخر
// ويأكد إنو فعلاً اتفرّج عليه.
const AD_SHOW_TIMEOUT_MESSAGE =
  "Ad did not report completion in time. Please try again.";
// AdsGram's server-side reward postback can arrive well after the ad
// finishes playing, especially on slower mobile networks. We poll for
// up to 3 minutes before giving up, and even then we do NOT
// clear the pending intent — a late postback should still be credited.
const AD_VERIFY_MAX_ATTEMPTS = 900;
const AD_VERIFY_POLL_MS = 200;
const MINING_CACHE_KEY = "sly.mining.cache.v1";


function loadCachedMining(): MiningState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MINING_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveCachedMining(mining: MiningState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MINING_CACHE_KEY, JSON.stringify(mining));
  } catch {}
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInitData() {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initData || "";
}

const DEVICE_ID_KEY = "sly.device_id.v1";

// معرّف جهاز ثابت يتولّد مرة وحدة ويبقى محفوظ بـ localStorage تبع
// الـ WebView. يبقى نفسه حتى لو المستخدم بدّل شبكة الإنترنت أو بدّل
// حساب تيليجرام بنفس تثبيت التطبيق - يستخدم مع IP لمنع تعدد الحسابات.
function getOrCreateDeviceId() {
  if (typeof window === "undefined") return "";

  try {
    let id = window.localStorage.getItem(DEVICE_ID_KEY);

    if (!id) {
      id =
        (window.crypto?.randomUUID?.() as string | undefined) ??
        `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random()
          .toString(16)
          .slice(2)}`;

      window.localStorage.setItem(DEVICE_ID_KEY, id);
    }

    return id;
  } catch {
    return "";
  }
}


function getClientSignals() {
  if (typeof window === "undefined") return ""

  try {
    const nav = window.navigator
    const screenInfo = window.screen

    const timezone =
      Intl.DateTimeFormat().resolvedOptions().timeZone || ""

    return JSON.stringify({
      userAgent: nav.userAgent || "",
      platform: (nav as any).platform || "",
      language: nav.language || "",
      timezone,
      screen:
        `${screenInfo?.width || 0}x${screenInfo?.height || 0}x${window.devicePixelRatio || 1}`,
      colorDepth:
        Number(screenInfo?.colorDepth || 0),
      hardwareConcurrency:
        Number(nav.hardwareConcurrency || 0),
      deviceMemory:
        Number((nav as any).deviceMemory || 0),
    })
  } catch {
    return ""
  }

}

async function callApi(path: string, options: RequestInit = {}) {
  const initData = getInitData();
  const res = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `tga ${initData}`,
      "X-Device-Id": getOrCreateDeviceId(),
      "X-Client-Signals": getClientSignals(),
      "Cache-Control": "no-cache",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}


type RequiredChannel = {
  id: string;
  title: string;
  url: string;
  joined: boolean;
};

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const [wallet, setWallet] = useState<WalletState>({
    coins: 0,
    usdt: 0,
    spent: 0,
    walletAddress: null,
  });

  const [streak, setStreak] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");

  const [splashVisible, setSplashVisible] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [splashProgress, setSplashProgress] = useState(6);

  useEffect(() => {
    if (!splashVisible || !booting || bootError) return;
    const id = setInterval(() => {
      setSplashProgress((prev) => (prev >= 90 ? prev : prev + (90 - prev) * 0.08 + 0.4));
    }, 120);
    return () => clearInterval(id);
  }, [splashVisible, booting, bootError]);

  useEffect(() => {
    if (bootError) {
      setSplashVisible(false);
      return;
    }
    if (!booting && splashVisible) {
      setSplashProgress(100);
      const fadeTimer = setTimeout(() => setSplashFading(true), 250);
      const hideTimer = setTimeout(() => setSplashVisible(false), 700);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [booting, bootError, splashVisible]);

  const [membershipVerified, setMembershipVerified] =
    useState(true);

  const [requiredChannels, setRequiredChannels] =
    useState<RequiredChannel[]>([]);

  const [membershipChecking, setMembershipChecking] =
    useState(false);
  const [adsgramReady, setAdsgramReady] = useState(false);
  const adsgramControllerRef = useRef<AdsgramController | null>(null);
  const adsgramMiningControllerRef = useRef<AdsgramController | null>(null);
  const adsgramStarsControllerRef = useRef<AdsgramController | null>(null);
  const adsgramGamesControllerRef = useRef<AdsgramController | null>(null);
  // true طول ما جولة Laser Escape شغالة. يمنع الإعلان التلقائي
  // (showAdsgramAd، يشتغل بمؤقت دوري طول عمر التطبيق) من الظهور
  // فجأة وسط اللعب - نستخدم ref مو state حتى القيمة توصل فورية
  // لأي setTimeout شغال وقتها بدون ما تنتظر إعادة رندر.
  const playingLaserEscapeRef = useRef(false);

  // حالة MINING تعيش هنا (بمستوى App) مو داخل صفحة Home، حتى ما تنقطع
  // عملية start/claim إذا المستخدم بدّل صفحة قبل ما توصل تأكيدة الإعلان
  const [mining, setMining] = useState<MiningState>(
    loadCachedMining() ?? {
      active: false,
      reward: 0,
      cycleHours: 2,
      startedAt: null,
      claimAvailableAt: null,
      claimReady: false,
      startAdVerified: false,
      claimAdVerified: false,
    }
  );
  const [miningAdBusy, setMiningAdBusy] = useState(false);
  const miningAdBusyRef = useRef(false);
  // يتذكر إذا انعرض إعلان المايننق فعلاً لنية start/claim الحالية،
  // حتى لو المستخدم ضضط تاني (retry) بعد ما التأكيد تأخر، ما نعرض
  // إعلان ثاني بلا داعي.
  const miningAdShownForStageRef = useRef<{ start: boolean; claim: boolean }>({
    start: false,
    claim: false,
  });

  useEffect(() => {
    miningAdBusyRef.current = miningAdBusy;
  }, [miningAdBusy]);
  const [miningReady, setMiningReady] = useState(false);
  const [miningToast, setMiningToast] = useState("");

  const [starsAdBusy, setStarsAdBusy] = useState(false);
  const [starsUseBusy, setStarsUseBusy] = useState(false);
  const [starsAdBatchCount, setStarsAdBatchCount] = useState(0);
  // آخر تحديث مؤكد لعداد Stars من السيرفر.
  // يمنع رد GET قديم من الكتابة فوق قيمة أحدث أثناء انتظار webhook.
  const starsAdBatchCountUpdatedAtRef = useRef(0);

  // إذا تم تشغيل الإعلان فعلاً ثم تأخر AdsGram webhook،
  // لا نعرض إعلاناً ثانياً عند إعادة المحاولة.
const [starsAdsRequired, setStarsAdsRequired] = useState(50);
  const [starsCycleUnlocksAt, setStarsCycleUnlocksAt] = useState<string | null>(null);
  const [starsAdToast, setStarsAdToast] = useState("");

  // ---- حالة قسم Games (Laser Escape) ----
  const [gamesAdBusy, setGamesAdBusy] = useState(false);
  const [gamesAdToast, setGamesAdToast] = useState("");
  const [gamesAttemptsRemaining, setGamesAttemptsRemaining] = useState(0);
  const [gamesFreeAttempts, setGamesFreeAttempts] = useState(0);
  const [gamesBonusAttempts, setGamesBonusAttempts] = useState(0);
  const [gamesPlayBusy, setGamesPlayBusy] = useState(false);
  const [playingLaserEscape, setPlayingLaserEscape] = useState(false);
  const [duplicateNotice, setDuplicateNotice] = useState(false);
  const duplicateNoticeDismissedRef = useRef(false);
  const [channelLeftNotice, setChannelLeftNotice] = useState("");

  // بيانات الإحالة: تتحمل مرة وحدة مع بيانات اللاعب الرئيسية
  // (أثناء شاشة الـ loading الرئيسية) بدل ما تعمل fetch خاص بها كل مرة تفتح صفحة Referrals
  const [telegramId, setTelegramId] = useState("");
  const [referralsCount, setReferralsCount] = useState(0);
  const [referralRewardUsdt, setReferralRewardUsdt] = useState(0.01);
  const [referralRequiredTasks, setReferralRequiredTasks] = useState(5);

  // حالة بوابة السحب: عدد الإعلانات المشاهدة + وقت رجوع إمكانية السحب
  const [withdrawalAdsWatched, setWithdrawalAdsWatched] = useState(0);
  const [withdrawalAdsRequired, setWithdrawalAdsRequired] = useState(10);
  const [nextWithdrawalAvailableAt, setNextWithdrawalAvailableAt] = useState<string | null>(null);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistoryEntry[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  // إذا AdsGram رفع onNonStopShow (يعني لاحظ أكتر من إعلان ورا بعض)
  // نوقف الإعلان التلقائي شوي أطول - هاي أهم خطوة لتحسين "جودة"
  // الإعلانات بدون ما نقلل عددها بشكل كبير: نوقف بس وقت الشبكة نفسها
  // تحذرنا إنه في سبام.
  const adAutoBackoffUntilRef = useRef(0);

  // الإعلان التلقائي: لو نجح (طلع فعلاً وخلص)، الإعلان الجاي بعد 40 ثانية.
  // لو انلغى/فشل (ما طلع - مثلاً القفل مشغول، أو التطبيق مو ظاهر، أو
  // AdsGram رفض/ماكو fill)، نحاول أسرع - بعد 20 ثانية بس - لين ينجح
  // إعلان، وبعدها يرجع الفاصل لـ40 ثانية.
  const AD_REPEAT_SUCCESS_MS = 40000;
  const AD_REPEAT_RETRY_MS = 20000;
  const adShowInFlightRef = useRef(false);




  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page]);

  // تحميل SDK الخاص بـ AdsGram
  useEffect(() => {
    if (typeof window === "undefined") return;

    // نسجل onBannerNotFound / onError فعلياً بدل ما نتركهم فاضيين -
    // هذا اللي يفرّق لنا لاحقاً (بفتح الـconsole) بين "ما اكو طلب يوصل
    // للسيرفر أصلاً" و"الطلب يوصل بس AdsGram ما عنده إعلان يعرضه (no
    // fill)" و"في مشكلة رندر/تشغيل فعلية". onNonStopShow تحديداً معناه
    // AdsGram لاحظ إعلانات ورا بعض بسرعة (سبام) - أول ما يصير هذا نوقف
    // الإعلان التلقائي بالخلفية دقيقة كاملة، عشان الجلسة "تهدى" وما
    // يستمر AdsGram يعتبرها سبام وما يحسب الظهورات (Impressions) بشكل
    // صحيح.
    const attachDiagnostics = (
      controller: AdsgramController,
      label: string
    ) => {
      controller.addEventListener?.("onTooLongSession", () => {
        window.location.reload();
      });
      controller.addEventListener?.("onBannerNotFound", () => {
        console.warn(`[AdsGram:${label}] onBannerNotFound (no fill)`);
      });
      controller.addEventListener?.("onError", () => {
        console.warn(`[AdsGram:${label}] onError (render/playback failure)`);
      });
      controller.addEventListener?.("onNonStopShow", () => {
        console.warn(`[AdsGram:${label}] onNonStopShow - backing off auto ads`);
        adAutoBackoffUntilRef.current = Date.now() + 60000;
      });
    };

    const initAdsgram = () => {
      if (!window.Adsgram) return;
      if (!adsgramControllerRef.current) {
        adsgramControllerRef.current = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
        attachDiagnostics(adsgramControllerRef.current, "auto");
      }
      if (!adsgramMiningControllerRef.current) {
        adsgramMiningControllerRef.current = window.Adsgram.init({
          blockId: ADSGRAM_MINING_BLOCK_ID,
        });
        attachDiagnostics(adsgramMiningControllerRef.current, "mining");
      }
      if (!adsgramStarsControllerRef.current) {
        adsgramStarsControllerRef.current = window.Adsgram.init({
          blockId: ADSGRAM_STARS_BLOCK_ID,
        });
        attachDiagnostics(adsgramStarsControllerRef.current, "stars");
      }
      if (!adsgramGamesControllerRef.current) {
        adsgramGamesControllerRef.current = window.Adsgram.init({
          blockId: ADSGRAM_GAMES_BLOCK_ID,
        });
        attachDiagnostics(adsgramGamesControllerRef.current, "games");
      }
      setAdsgramReady(true);
      setMiningReady(true);
    };

    if (window.Adsgram) {
      initAdsgram();
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${ADSGRAM_SCRIPT_SRC}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", initAdsgram, { once: true });
      // Safety net: the script tag lives in index.html's <head> now, so it may
      // have already finished loading (or failed) before this effect ran and
      // before the "load" listener above was attached. Poll briefly so we
      // don't get stuck waiting for an event that already fired.
      const pollId = window.setInterval(() => {
        if (window.Adsgram) {
          window.clearInterval(pollId);
          initAdsgram();
        }
      }, 200);
      window.setTimeout(() => window.clearInterval(pollId), 15000);
      return () => window.clearInterval(pollId);
    }

    const script = document.createElement("script");
    script.src = ADSGRAM_SCRIPT_SRC;
    script.async = true;

    script.onload = initAdsgram;
    script.onerror = () => {
      setAdsgramReady(false);
      console.log("Failed to load AdsGram SDK");
    };

    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);



  const showAdsgramAd = async (): Promise<boolean> => {
    if (!adsgramControllerRef.current) return false;
    // ما نعرض إعلان تلقائي وسط جولة لعب شغالة - نستناها تخلص.
    if (playingLaserEscapeRef.current) return false;

    if (adShowInFlightRef.current) return false;

    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return false;
    }

    if (Date.now() < adAutoBackoffUntilRef.current) return false;

    // بدون انتظار: إذا في إعلان ثاني (تلقائي أو ضغطة مستخدم) شغال هلق،
    // نتخطى هذي الدورة بالكامل بدل ما ننتظر الدور. الانتظار هو اللي كان
    // يخلي إعلانين يطلعون ورا بعض بلحظات - وهذا بالضبط اللي يخلي AdsGram
    // يشوفها سبام (onNonStopShow) وما يحسبها Impressions صحيحة.
    if (!tryAcquireGlobalAdLock()) return false;

    adShowInFlightRef.current = true;
    try {
      await adsgramControllerRef.current.show();
      return true;
    } catch (err) {
      console.log("AdsGram ad skipped or unavailable", err);
      return false;
    } finally {
      adShowInFlightRef.current = false;
      releaseGlobalAdLock();
    }
  };

  useEffect(() => {
    if (booting || bootError) return;
    if (!adsgramReady) return;
    if (!membershipVerified) return;

    let cancelled = false;
    let repeatTimer: number | null = null;

    const scheduleNext = (succeeded: boolean) => {
      if (cancelled) return;
      const delay = succeeded ? AD_REPEAT_SUCCESS_MS : AD_REPEAT_RETRY_MS;
      repeatTimer = window.setTimeout(async () => {
        if (cancelled) return;
        const ok = await showAdsgramAd();
        scheduleNext(ok);
      }, delay);
    };

    const FIRST_AD_DELAY_MS = 1000;

    repeatTimer = window.setTimeout(async () => {
      if (cancelled) return;
      const ok = await showAdsgramAd();
      scheduleNext(ok);
    }, FIRST_AD_DELAY_MS);

    return () => {
      cancelled = true;
      if (repeatTimer) window.clearTimeout(repeatTimer);
    };
  }, [booting, bootError, adsgramReady, membershipVerified]);

  useEffect(() => {
    if (!starsAdToast) return;
    const timer = window.setTimeout(() => setStarsAdToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [starsAdToast]);
// نفس Mining/Games:
  // الكلاينت لا يقرر أن الإعلان اكتمل.
  // ننتظر زيادة starsAdBatchCount بعد وصول AdsGram reward webhook.
  const waitForStarsAdVerification = async (
    batchBefore: number
  ) => {
    for (
      let attempt = 0;
      attempt < AD_VERIFY_MAX_ATTEMPTS;
      attempt += 1
    ) {
      try {
        const data = await loadPlayerData();

        if (
          typeof data?.starsAdBatchCount === "number" &&
          data.starsAdBatchCount > batchBefore
        ) {
          return true;
        }
      } catch {}

      await new Promise((resolve) =>
        window.setTimeout(
          resolve,
          AD_VERIFY_POLL_MS
        )
      );
    }

    return false;
  };

  const handleWatchStarsAd = async () => {
    if (starsAdBusy) return

    if (!adsgramStarsControllerRef.current) {
      setStarsAdToast(
        "Ads are still loading, try again in a moment."
      )
      return
    }

    const batchBefore =
      starsAdBatchCount

    setStarsAdBusy(true)
    setStarsAdToast("")

    if (!tryAcquireGlobalAdLock()) {
      setStarsAdBusy(false)
      setStarsAdToast(
        `Please wait ${getAdLockWaitSeconds()}s to watch another ad.`
      )
      return
    }

    try {
      /*
       * Same pattern as Mining/Games:
       *
       * show() starts immediately from the user click.
       * prepare runs in parallel.
       */
      const preparePromise =
        callApi("/api/auth/me", {
          method: "POST",
          body: JSON.stringify({
            action: "stars_ad_prepare",
          }),
        })

      let showResult

      try {
        showResult =
          await adsgramStarsControllerRef
            .current!
            .show()
      } finally {
        releaseGlobalAdLock()
      }

      const prepare =
        await preparePromise

      if (prepare.locked) {
        setStarsCycleUnlocksAt(
          prepare.cycleUnlocksAt ??
            null
        )

        throw new Error(
          "Ads are locked while your 2-hour cycle is running."
        )
      }

      if (
        showResult?.error
      ) {
        throw new Error(
          "Ad failed to load or complete."
        )
      }

      /*
       * مهم جداً:
       * لا نسوي ACK من الكلاينت.
       *
       * ننتظر AdsGram Reward webhook
       * حتى يزيد stars_ad_batch_count.
       */
      const verified =
        await waitForStarsAdVerification(
          batchBefore
        )

      if (!verified) {
        /*
         * لا نلغي stars_ad_intent هنا.
         *
         * إذا AdsGram تأخر بالـwebhook،
         * سيبقى الإعلان معلق حتى يصل التأكيد.
         */
        throw new Error(
          "Still confirming your ad with AdsGram — this can take a minute on mobile networks. Try again shortly; no need to rewatch."
        )
      }

      /*
       * جلب آخر قيمة بعد التأكيد.
       */
      const latest =
        await callApi(
          "/api/auth/me",
          {
            method: "GET",
          }
        )

      setStarsAdBatchCount(
        latest?.starsAdBatchCount ??
          batchBefore + 1
      )

      setStarsCycleUnlocksAt(
        latest?.starsCycleUnlocksAt ??
          null
      )

      setStarsAdToast(
        `Ad verified by AdsGram — ${
          latest?.starsAdBatchCount ??
          batchBefore + 1
        }/${starsAdsRequired}`
      )

    } catch (err: any) {
      setStarsAdToast(
        err?.message ||
        "Something went wrong. Please try again."
      )
    } finally {
      setStarsAdBusy(false)
    }
  }

  // يفعّل رصيد الإعلانات المتجمّع (كل إعلان = 5 دقائق) ويشغّل دورة
  // احتساب الوقت لمدتها، بنفس نظام الاحتساب الموجود أصلاً (فرق وقت
  // مستمر يُحتسب مع كل ping، مو تايمر بالواجهة).
  const handleUseStarsBalance = async () => {
    if (starsUseBusy || starsAdBusy) return;

    if (starsAdBatchCount <= 0) {
      setStarsAdToast("شاهد إعلان واحد على الأقل قبل استخدام الرصيد.");
      return;
    }

    setStarsUseBusy(true);
    setStarsAdToast("");

    try {
      const result = await callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "stars_ad_use_balance" }),
      });

      starsAdBatchCountUpdatedAtRef.current = Date.now();
      setStarsAdBatchCount(result.starsAdBatchCount ?? 0);
      setStarsCycleUnlocksAt(result.starsCycleUnlocksAt ?? null);
      setStarsAdToast("تم تفعيل الرصيد — وقتك يرتفع تلقائياً الآن.");
    } catch (err: any) {
      setStarsAdToast(err?.message || "تعذر استخدام الرصيد، حاول مرة أخرى.");
    } finally {
      setStarsUseBusy(false);
    }
  };

  const cancelGamesAd = async () => {
    await callApi("/api/auth/me", {
      method: "POST",
      body: JSON.stringify({ action: "games_ad_cancel" }),
    }).catch(() => {});
  };

  const showGamesAd = async () => {
    const controller = adsgramGamesControllerRef.current;
    if (!controller) {
      throw new Error("Ad is not ready yet. Try again in a moment.");
    }

    const acquired = tryAcquireGlobalAdLock();
    if (!acquired) {
      throw new Error(`Please wait ${getAdLockWaitSeconds()}s to watch another ad.`);
    }

    let timeoutId: number | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(AD_SHOW_TIMEOUT_MESSAGE));
      }, MINING_AD_SHOW_TIMEOUT_MS);
    });

    try {
      await Promise.race([controller.show(), timeout]);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      releaseGlobalAdLock();
    }
  };

  // نفس أسلوب waitForMiningAdVerification بالضبط: الكلاينت ما يقرر
  // شي بنفسه، بس ينطر لين الـwebhook الحقيقي من AdsGram يرفع العداد
  // فعلاً بقاعدة البيانات (أو تنتهي المهلة).
  const waitForGamesAdVerification = async (bonusBefore: number) => {
    for (let attempt = 0; attempt < AD_VERIFY_MAX_ATTEMPTS; attempt += 1) {
      try {
        const data = await loadPlayerData();
        if (
          typeof data?.gamesBonusAttempts === "number" &&
          data.gamesBonusAttempts > bonusBefore
        ) {
          return true;
        }
      } catch {}

      await new Promise((resolve) =>
        window.setTimeout(resolve, AD_VERIFY_POLL_MS)
      );
    }

    return false;
  };

  const handleWatchGamesAd = async () => {
    if (gamesAdBusy) return;
    if (!adsgramGamesControllerRef.current) {
      setGamesAdToast("Ads are still loading, try again in a moment.");
      return;
    }

    setGamesAdBusy(true);
    setGamesAdToast("");

    try {
      const bonusBefore = gamesBonusAttempts;

      // .show() لازم ينطلق بنفس لحظة الكلك بلا await قبله (نفس مشكلة
      // Stars) — طلب الـprepare (نتيجته غير مستخدمة أصلاً هون) يصير
      // بالتوازي معه مو قبله.
      const preparePromise = callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "games_ad_prepare" }),
      });

      try {
        await Promise.all([showGamesAd(), preparePromise]);
      } catch (adErr: any) {
        // مهلة .show() بس - نسيب الـintent حي عشان webhook AdsGram
        // المتأخر يقدر يأكدها بدون إعادة مشاهدة.
        if (adErr?.message !== AD_SHOW_TIMEOUT_MESSAGE) {
          await cancelGamesAd();
        }
        throw adErr;
      }

      const verified = await waitForGamesAdVerification(bonusBefore);
      if (!verified) {
        // ما نلغي الـintent هنا - الإعلان انعرض فعلاً، وAdsGram ممكن
        // بس يتأخر بإرسال الـwebhook على شبكات الموبايل. محاولة تانية
        // لاحقاً تلتقط التأكيد المتأخر بدون إعادة مشاهدة الإعلان.
        throw new Error(
          "Still confirming your ad with AdsGram — this can take a minute on mobile networks. Try again shortly; no need to rewatch."
        );
      }

      setGamesAdToast("Nice! You got +1 attempt 🎮");
    } catch (err: any) {
      setGamesAdToast(err?.message || "Something went wrong. Please try again.");
    } finally {
      setGamesAdBusy(false);
    }
  };

  const handlePlayLaserEscape = async () => {
    if (gamesPlayBusy || gamesAttemptsRemaining <= 0) return;

    setGamesPlayBusy(true);
    setGamesAdToast("");

    try {
      const data = await callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "games_start_attempt" }),
      });

      setGamesAttemptsRemaining(
        data.gamesAttemptsRemaining ?? Math.max(0, gamesAttemptsRemaining - 1)
      );
      setPlayingLaserEscape(true);
      playingLaserEscapeRef.current = true;
    } catch (err: any) {
      setGamesAdToast(err?.message || "ما قدرنا نبدأ الجولة، جرب مرة ثانية.");
    } finally {
      setGamesPlayBusy(false);
    }
  };

  const handleLaserEscapeExit = (coinsEarned = 0) => {
    setPlayingLaserEscape(false);
    playingLaserEscapeRef.current = false;

    // فور ما الجولة تخلص، نجرب نعرض إعلان تلقائي على طول بدل ما
    // ننتظر دورة المؤقت العشوائية الجاية.
    showAdsgramAd().catch(() => {});

    if (coinsEarned > 0) {
      callApi("/api/tasks/complete", {
        method: "POST",
        body: JSON.stringify({ taskType: "game_run", reward: coinsEarned }),
      })
        .then(() => {
          handleTaskReward(coinsEarned, `Laser Escape +${coinsEarned}`, "Game reward");
        })
        .catch(() => {
          pushActivity("Couldn't record the reward", "Try reopening the app", "info");
        });
    }
  };

  const loadPlayerData = async () => {
    const requestStartedAt = Date.now();
    const data = await callApi("/api/auth/me", { method: "GET" });

    setWallet((prev) => ({
      ...prev,
      coins: data.coins ?? 0,
      usdt: data.usdtBalance ?? 0,
      walletAddress: data.walletAddress ?? null,
    }));
    setStreak(data.streak ?? 0);
    setWithdrawalAdsWatched(data.withdrawalAdsWatched ?? 0);
    setWithdrawalAdsRequired(data.withdrawalAdsRequired ?? 10);
    setNextWithdrawalAvailableAt(data.nextWithdrawalAvailableAt ?? null);
    setWithdrawalHistory(Array.isArray(data.withdrawalHistory) ? data.withdrawalHistory : []);
    setTelegramId(String(data.telegramId ?? ""));
    setReferralsCount(Number(data.referralsCount ?? 0));
    setReferralRewardUsdt(Number(data.referralRewardUsdt ?? 0.01));
    setReferralRequiredTasks(Number(data.referralRequiredTasks ?? 5));

    const channels =
      Array.isArray(data.requiredChannels)
        ? data.requiredChannels
        : [];

    setRequiredChannels(channels);

    if (data.membershipVerified === false) {
      setMembershipVerified(false);
    } else {
      setMembershipVerified(true);
    }

    if (data.isDuplicateDevice && !duplicateNoticeDismissedRef.current) {
      setDuplicateNotice(true);
    }

    if (data.mining) {
      setMining(data.mining);
      saveCachedMining(data.mining);
    }

    if (
      typeof data.starsAdBatchCount === "number" &&
      requestStartedAt >= starsAdBatchCountUpdatedAtRef.current
    ) {
      setStarsAdBatchCount(data.starsAdBatchCount);
    }
    if (typeof data.starsAdsRequired === "number") {
      setStarsAdsRequired(data.starsAdsRequired);
    }
    if ("starsCycleUnlocksAt" in data) {
      setStarsCycleUnlocksAt(data.starsCycleUnlocksAt ?? null);
    }

    if (typeof data.gamesAttemptsRemaining === "number") {
      setGamesAttemptsRemaining(data.gamesAttemptsRemaining);
    }
    if (typeof data.gamesFreeAttempts === "number") {
      setGamesFreeAttempts(data.gamesFreeAttempts);
    }
    if (typeof data.gamesBonusAttempts === "number") {
      setGamesBonusAttempts(data.gamesBonusAttempts);
    }

    if (Array.isArray(data.channelTasksReset) && data.channelTasksReset.length > 0) {
      try {
        const raw = window.localStorage.getItem("sly.tasks.progress.v3");
        const parsed = raw ? JSON.parse(raw) : {};
        for (const taskId of data.channelTasksReset) {
          delete parsed[String(taskId)];
        }
        window.localStorage.setItem("sly.tasks.progress.v3", JSON.stringify(parsed));
      } catch {}

      window.dispatchEvent(
        new CustomEvent("sly:channel-tasks-reset", { detail: data.channelTasksReset })
      );

      setChannelLeftNotice(
        data.channelTasksReset.length === 1
          ? "You left a channel — that task was reset and 1000 coins were deducted. Rejoin and complete it again."
          : `You left ${data.channelTasksReset.length} channels — those tasks were reset and coins were deducted. Rejoin and complete them again.`
      );
    }

    return data;
  };

  useEffect(() => {
    if (!miningToast) return;
    const timer = window.setTimeout(() => setMiningToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [miningToast]);

  const refreshMining = async () => {
    const data = await callApi("/api/auth/me", { method: "GET" });
    if (data.mining) {
      setMining(data.mining);
      saveCachedMining(data.mining);
    }
    return data.mining as MiningState | undefined;
  };

  // يفحص فوراً (بدون انتظار ثانية أولاً) وبعدها كل ثانية - أسرع بالاستجابة
  // من فحص كل ثانية بعد انتظار أول ثانية
  const waitForMiningAdVerification = async (stage: "start" | "claim") => {
    for (let attempt = 0; attempt < AD_VERIFY_MAX_ATTEMPTS; attempt += 1) {
      try {
        const state = await refreshMining();

        // Only backend confirmation unlocks the next action.
        if (stage === "start" && state?.startAdVerified) {
          return true;
        }

        if (stage === "claim" && state?.claimAdVerified) {
          return true;
        }
      } catch {}

      await new Promise((resolve) =>
        window.setTimeout(resolve, AD_VERIFY_POLL_MS)
      );
    }

    return false;
  };

  const showMiningAd = async () => {
    const controller = adsgramMiningControllerRef.current;
    if (!controller) {
      throw new Error("Mining ad is not ready yet. Try again in a moment.");
    }

    const acquired = tryAcquireGlobalAdLock();
    if (!acquired) {
      throw new Error(`Please wait ${getAdLockWaitSeconds()}s to watch another ad.`);
    }

    let timeoutId: number | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(AD_SHOW_TIMEOUT_MESSAGE));
      }, MINING_AD_SHOW_TIMEOUT_MS);
    });

    try {
      await Promise.race([controller.show(), timeout]);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      releaseGlobalAdLock();
    }
  };

  const cancelMiningAd = async () => {
    await callApi("/api/auth/me", {
      method: "POST",
      body: JSON.stringify({ action: "mining_cancel_ad" }),
    }).catch(() => {});
  };

  // كامل عملية start/claim موجودة هنا بمستوى App، فما تنقطع لو المستخدم
  // بدّل الصفحة أثناء انتظار تأكيد الإعلان
  const handleMining = async () => {
    if (miningAdBusy) return;

    setMiningAdBusy(true);
    setMiningToast("");

    try {
      if (!mining.active) {
        // .show() لازم ينطلق بنفس لحظة الكلك بلا await قبله. أول مرة
        // (مو retry) نشغله بالتوازي مع mining_prepare_ad مو بعده. لو
        // هذي محاولة إعادة بعد تأكيد متأخر، الإعلان انعرض أصلاً فما
        // نكرره.
        const alreadyShownStart = miningAdShownForStageRef.current.start;
        const preparePromise = callApi("/api/auth/me", {
          method: "POST",
          body: JSON.stringify({ action: "mining_prepare_ad", stage: "start" }),
        });
        const showPromise = alreadyShownStart
          ? Promise.resolve(null)
          : (async () => {
              miningAdShownForStageRef.current.start = true;
              try {
                return await showMiningAd();
              } catch (adErr: any) {
                // مهلة .show() بس لا تعني فشل حقيقي - ممكن الإعلان يكون
                // انعرض فعلاً والمتصفح تجمّد بالخلفية. نخلي العلم true
                // عشان ما نعرضه مرة ثانية بلا داعي.
                if (adErr?.message !== AD_SHOW_TIMEOUT_MESSAGE) {
                  miningAdShownForStageRef.current.start = false;
                }
                throw adErr;
              }
            })();

        let prepare;
        try {
          [prepare] = await Promise.all([preparePromise, showPromise]);
        } catch (adErr: any) {
          // نفس المبدأ: لو السبب مهلة .show()، ما نلغي الـintent لأن
          // webhook AdsGram الحقيقي ممكن يوصل متأخر ويأكدها.
          if (adErr?.message !== AD_SHOW_TIMEOUT_MESSAGE) {
            await cancelMiningAd();
          }
          throw adErr;
        }

        if (!prepare.alreadyVerified) {
          const verified = await waitForMiningAdVerification("start");
          if (!verified) {
            // Don't cancel — the ad played, AdsGram's postback may just be
            // slow. Leave the intent so a late postback still verifies it.
            throw new Error(
              "Still confirming your ad with AdsGram — this can take a minute on mobile networks. Try Start again shortly; no need to rewatch if it was already confirmed."
            );
          }
        }

        miningAdShownForStageRef.current.start = false;

        const started = await callApi("/api/auth/me", {
          method: "POST",
          body: JSON.stringify({ action: "mining_start" }),
        });

        if (started.mining) {
          setMining(started.mining);
          saveCachedMining(started.mining);
        }

        setMiningToast("Mining started. Come back in 2 hours.");
        loadPlayerData().catch(() => {});
        return;
      }

      if (!mining.claimReady) {
        throw new Error("Mining cycle is not ready yet.");
      }

      const alreadyShownClaim = miningAdShownForStageRef.current.claim;
      const preparePromiseClaim = callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "mining_prepare_ad", stage: "claim" }),
      });
      const showPromiseClaim = alreadyShownClaim
        ? Promise.resolve(null)
        : (async () => {
            miningAdShownForStageRef.current.claim = true;
            try {
              return await showMiningAd();
            } catch (adErr: any) {
              if (adErr?.message !== AD_SHOW_TIMEOUT_MESSAGE) {
                miningAdShownForStageRef.current.claim = false;
              }
              throw adErr;
            }
          })();

      let prepare;
      try {
        [prepare] = await Promise.all([preparePromiseClaim, showPromiseClaim]);
      } catch (adErr: any) {
        if (adErr?.message !== AD_SHOW_TIMEOUT_MESSAGE) {
          await cancelMiningAd();
        }
        throw adErr;
      }

      if (!prepare.alreadyVerified) {
        const verified = await waitForMiningAdVerification("claim");
        if (!verified) {
          // Don't cancel — the ad played, AdsGram's postback may just be
          // slow. Leave the intent so a late postback still verifies it,
          // and a later Claim tap (mining_prepare_ad returns
          // alreadyVerified) picks it up without rewatching an ad.
          throw new Error(
            "Still confirming your ad with AdsGram — this can take a minute on mobile networks. Try Claim again shortly; no need to rewatch if it was already confirmed."
          );
        }
      }

      miningAdShownForStageRef.current.claim = false;

      const claimed = await callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "mining_claim" }),
      });

      if (claimed.success) {
        const reward = Number(claimed.reward || mining.reward);

        setWallet((prev) => ({ ...prev, coins: prev.coins + reward }));
        pushActivity(
          `Mining reward +${reward.toLocaleString()}`,
          "Coins earned from SLY Mining",
          "reward"
        );

        setMining(claimed.mining);
        saveCachedMining(claimed.mining);
        setMiningToast(`+${reward.toLocaleString()} coins`);
        loadPlayerData().catch(() => {});
      }
    } catch (err: any) {
      setMiningToast(err?.message || "Mining action failed.");

      // الفرونت كان يفترض حالة غلط (مثلاً "Ready to Start" بينما
      // الباك اند يقول التعدين شغال أصلاً) — نعيد مزامنة الحالة
      // الحقيقية حتى الواجهة تنعكس صح فوراً بدل ما تضل عالقة.
      try {
        await refreshMining();
      } catch {}
    } finally {
      setMiningAdBusy(false);
    }
  };

  const verifyMandatoryMembership =
    async () => {
      if (membershipChecking) {
        return;
      }

      setMembershipChecking(true);

      try {
        const data =
          await loadPlayerData();

        if (
          data.membershipVerified === true
        ) {
          setMembershipVerified(true);
          setRequiredChannels(
            Array.isArray(
              data.requiredChannels
            )
              ? data.requiredChannels
              : []
          );

          return;
        }

        setMembershipVerified(false);

        setRequiredChannels(
          Array.isArray(
            data.requiredChannels
          )
            ? data.requiredChannels
            : []
        );
      } catch (err) {
        console.error(
          "Membership verification failed:",
          err
        );
      } finally {
        setMembershipChecking(false);
      }
    };

  const dismissDuplicateNotice = () => {
    duplicateNoticeDismissedRef.current = true;
    setDuplicateNotice(false);
  };

  const dismissChannelLeftNotice = () => {
    setChannelLeftNotice("");
  };

  const pushActivity = (title: string, meta: string, tone: ActivityTone) => {
    setActivities((prev) => [{ id: makeId(), title, meta, tone }, ...prev].slice(0, 8));
  };

  useEffect(() => {
    let cancelled = false;

    loadPlayerData()
      .then(async (data) => {
        if (cancelled) return;

        if (
          data.membershipVerified === false
        ) {
          return;
        }

        if (!data.claimedToday) {
          try {
            const checkin = await callApi("/api/daily-checkin", { method: "POST" });
            if (cancelled) return;

            if (checkin.success) {
              setWallet((prev) => ({ ...prev, coins: checkin.coins }));
              setStreak(checkin.streak ?? data.streak ?? 0);
              pushActivity(
                `Daily check-in +${checkin.reward}`,
                "Reward claimed automatically",
                "reward"
              );
            }
          } catch {
            // فشل صامت هنا؛ يعاد تلقائياً بالمرة الجاية
          }
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = String(err.message || "");
        setBootError(
          msg.includes("authentication")
            ? "Open the game inside the Telegram app so your account can be recognized."
            : "Couldn't reach the server. Try closing and reopening the app."
        );
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });

    const refreshPlayerData = async () => {
      try {
        await loadPlayerData();
      } catch {
        // تجاهل فشل التحديث الخلفي
      }
    };

    const intervalId = window.setInterval(refreshPlayerData, 15 * 1000);
window.addEventListener("focus", refreshPlayerData);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
window.removeEventListener("focus", refreshPlayerData);
    };
  }, []);

  const handleTaskReward = (amount: number, title: string, meta: string) => {
    setWallet((prev) => ({ ...prev, coins: prev.coins + amount }));
    pushActivity(title, meta, "reward");
    loadPlayerData().catch(() => {});
  };

  const handleExchange = async (amountCoins: number) => {
    if (amountCoins <= 0 || amountCoins > wallet.coins) return;

    try {
      const data = await callApi("/api/exchange", {
        method: "POST",
        body: JSON.stringify({ amountCoins }),
      });

      setWallet((prev) => ({
        ...prev,
        coins: data.coins,
        usdt: data.usdtBalance,
        spent: prev.spent + amountCoins,
      }));

      pushActivity(
        "Exchange completed",
        `${amountCoins.toLocaleString()} Coins → ${data.usdtGained} USDT`,
        "exchange"
      );

      loadPlayerData().catch(() => {});
    } catch (err: any) {
      pushActivity("Exchange failed", err.message, "info");
    }
  };

  const handleRedeemGiftCode = async (code: string) => {
    try {
      const data = await callApi("/api/gift-codes/redeem", {
        method: "POST",
        body: JSON.stringify({ code }),
      });

      setWallet((prev) => ({ ...prev, coins: data.coins }));

      pushActivity(
        "Gift code redeemed",
        `+${Number(data.rewardCoins || 0).toLocaleString()} Coins`,
        "reward"
      );

      loadPlayerData().catch(() => {});

      return {
        success: true,
        message: `You received ${Number(data.rewardCoins || 0).toLocaleString()} coins!`,
      };
    } catch (err: any) {
      return { success: false, message: err.message || "Failed to redeem code" };
    }
  };

  const handleWithdraw = async (
    amount: number,
    method: "binance" | "bnb",
    target: string
  ) => {
    if (amount <= 0 || amount > wallet.usdt) return;

    try {
      const data = await callApi("/api/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount, method, target }),
      });

      setWallet((prev) => ({ ...prev, usdt: data.usdtBalance }));
      setWithdrawalAdsWatched(0);
      setWithdrawalAdsRequired(
        data.withdrawalAdsRequired ?? 10
      );
      setNextWithdrawalAvailableAt(null);

      pushActivity(
        "Withdrawal requested",
        method === "binance"
          ? `${amount.toFixed(4)} USDT to Binance ID ${target}`
          : `${amount.toFixed(4)} USDT to GRAM (TON) address ${target.slice(0, 6)}...${target.slice(-4)}`,
        "exchange"
      );

      loadPlayerData().catch(() => {});
    } catch (err: any) {
      pushActivity("Withdrawal failed", err.message, "info");
    }
  };

  const handleWithdrawAdPrepare = async () => {
    await callApi("/api/auth/me", {
      method: "POST",
      body: JSON.stringify({ action: "withdrawal_prepare_ad" }),
    }).catch(() => {});
  };

  const handleWatchWithdrawAd = async () => {
    // العداد ما عاد يزيد من هنا مباشرة - AdsGram يستدعي webhook آمن
    // (adsgram_reward) بعد ما يتأكد المستخدم شاهد الإعلان فعلاً،
    // وهذا يحدث القيمة الحقيقية بقاعدة البيانات. هنا بس نحدث الحالة
    // المحلية من السيرفر (مصدر الحقيقة الوحيد).
    //
    // نفس مشكلة mining/stars: الـwebhook ممكن يتأخر عن الشبكات
    // الخلوية، فبدل قراءة وحدة فورية، ننطر (poll) لين العداد يزيد
    // فعلاً أو تنتهي المهلة - بدون ما نلغي أي شي بالسيرفر.
    // Keep Watch Ad locked until the backend counter changes.
    // A frontend click/open alone is NOT considered a completed reward.
    const baseline = withdrawalAdsWatched;

    // يبقى الزر Loading/Confirming إلى أن يؤكد الـBackend المكافأة.
    // العداد الحقيقي يأتي من السيرفر فقط.
    while (true) {
      try {
        const data = await loadPlayerData();
        const watched = data.withdrawalAdsWatched ?? 0;
        const required = data.withdrawalAdsRequired ?? 10;

        setWithdrawalAdsWatched(watched);
        setWithdrawalAdsRequired(required);

        if (watched > baseline || watched >= required) {
          return;
        }
      } catch (err) {
        console.log("refresh after watch ad failed", err);
      }

      await new Promise((resolve) =>
        window.setTimeout(resolve, AD_VERIFY_POLL_MS)
      );
    }
  };

  const handleWalletConnected = (address: string) => {
    setWallet((prev) => ({ ...prev, walletAddress: address }));
  };

  const handleWalletDisconnected = () => {
    setWallet((prev) => ({ ...prev, walletAddress: null }));
  };

  const lifetimeCoins = useMemo(() => wallet.coins + wallet.spent, [wallet.coins, wallet.spent]);

  if (splashVisible) {
    return <SplashScreen progress={splashProgress} fading={splashFading} />;
  }

  if (bootError) {
    return (
      <div className="app">
        <Background />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#eaf4f2",
            padding: 24,
            textAlign: "center",
          }}
        >
          {bootError}
        </div>
      </div>
    );
  }

  if (!membershipVerified) {
    return (
      <div className="app">
        <Background />

        <MandatorySubscription
          channels={requiredChannels}
          loading={membershipChecking}
          onVerify={verifyMandatoryMembership}
        />
      </div>
    );
  }

  if (playingLaserEscape) {
    return <GameCanvas onExit={handleLaserEscapeExit} />;
  }

  return (
    <div className="app">
      <Background />
      <TopBar page={page} coins={wallet.coins} usdt={wallet.usdt} />

      {duplicateNotice ? (
        <div
          style={{
            position: "fixed",
            top: 76,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(120,20,20,0.94)",
            color: "#fff0f0",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 12.5,
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,120,120,0.35)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: "88%",
            textAlign: "center",
          }}
        >
          <span>Heads up: this device/network already has an account. New accounts from here won't earn referral rewards — your own account and gameplay aren't affected.</span>
          <button
            onClick={dismissDuplicateNotice}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff0f0",
              fontSize: 16,
              lineHeight: 1,
              cursor: "pointer",
              padding: 0,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ) : null}

      {channelLeftNotice ? (
        <div
          style={{
            position: "fixed",
            top: 76,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(120,20,20,0.94)",
            color: "#fff0f0",
            padding: "10px 16px",
            borderRadius: 12,
            fontSize: 12.5,
            fontWeight: 500,
            zIndex: 1000,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,120,120,0.35)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            maxWidth: "88%",
            textAlign: "center",
          }}
        >
          <span>{channelLeftNotice}</span>
          <button
            onClick={dismissChannelLeftNotice}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff0f0",
              fontSize: 16,
              lineHeight: 1,
              cursor: "pointer",
              padding: 0,
            }}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ) : null}

      {miningToast ? (
        <div
          style={{
            position: "fixed",
            top: 76,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(18,28,26,0.94)",
            color: "#eaf4f2",
            padding: "10px 18px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 500,
            zIndex: 999,
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            border: "1px solid rgba(64,224,208,0.25)",
            whiteSpace: "nowrap",
          }}
        >
          {miningToast}
        </div>
      ) : null}

      <main className="page-container">
        <div className="page-scroll" ref={scrollRef}>
          {page === "home" && (
            <Home
              streak={streak}
              mining={mining}
              miningReady={miningReady}
              miningAdBusy={miningAdBusy}
              onMining={handleMining}
              onRedeemGiftCode={handleRedeemGiftCode}
            />
          )}

          {page === "tasks" && <Tasks onRewardCoins={handleTaskReward} />}
          {page === "referrals" && (
            <Referrals
              telegramId={telegramId}
              referralsCount={referralsCount}
              referralRewardUsdt={referralRewardUsdt}
              referralRequiredTasks={referralRequiredTasks}
            />
          )}

          {page === "stars" && (
            <Stars
              telegramId={telegramId}
              adBusy={starsAdBusy}
              useBusy={starsUseBusy}
              adBatchCount={starsAdBatchCount}
              adsRequired={starsAdsRequired}
              cycleUnlocksAt={starsCycleUnlocksAt}
              adToast={starsAdToast}
              onWatchAd={handleWatchStarsAd}
              onUseBalance={handleUseStarsBalance}
            />
          )}

          {page === "games" && (
            <Games
              attemptsRemaining={gamesAttemptsRemaining}
              freeAttempts={gamesFreeAttempts}
              bonusAttempts={gamesBonusAttempts}
              adBusy={gamesAdBusy}
              playBusy={gamesPlayBusy}
              adToast={gamesAdToast}
              onWatchAd={handleWatchGamesAd}
              onPlay={handlePlayLaserEscape}
            />
          )}

          {page === "profile" && (
            <Profile
              lifetimeCoins={lifetimeCoins}
              lifetimeSpent={wallet.spent}
              usdtBalance={wallet.usdt}
              activities={activities}
              serverWalletAddress={wallet.walletAddress}
              withdrawalHistory={withdrawalHistory}
              onOpenExchange={() => setExchangeOpen(true)}
              onOpenWithdraw={() => setWithdrawOpen(true)}
              onWalletConnected={handleWalletConnected}
              onWalletDisconnected={handleWalletDisconnected}
            />
          )}
        </div>
      </main>

      <BottomNav page={page} setPage={setPage} />

      <ExchangeModal
        open={exchangeOpen}
        coins={wallet.coins}
        onClose={() => setExchangeOpen(false)}
        onConfirm={handleExchange}
      />

      <WithdrawalModal
        open={withdrawOpen}
        usdtBalance={wallet.usdt}
        walletAddress={wallet.walletAddress}
        withdrawalAdsWatched={withdrawalAdsWatched}
        withdrawalAdsRequired={withdrawalAdsRequired}
        nextWithdrawalAvailableAt={nextWithdrawalAvailableAt}
        onPrepareAd={handleWithdrawAdPrepare}
        onWatchAd={handleWatchWithdrawAd}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={handleWithdraw}
      />
    </div>
  );
}
