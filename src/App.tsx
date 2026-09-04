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
import MandatorySubscription from "./components/MandatorySubscription";
import { acquireGlobalAdLock, releaseGlobalAdLock } from "./lib/adLock";

import ExchangeModal from "./modals/ExchangeModal";
import WithdrawalModal from "./modals/WithdrawalModal";

type Page = "home" | "tasks" | "referrals" | "stars" | "profile";
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
const ADSGRAM_SCRIPT_SRC = "https://sad.adsgram.ai/js/sad.min.js";
const MINING_AD_SHOW_TIMEOUT_MS = 45000;
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

  useEffect(() => {
    miningAdBusyRef.current = miningAdBusy;
  }, [miningAdBusy]);
  const [miningReady, setMiningReady] = useState(false);
  const [miningToast, setMiningToast] = useState("");

  const [starsAdBusy, setStarsAdBusy] = useState(false);
  const [starsAdBatchCount, setStarsAdBatchCount] = useState(0);
  const [starsAdsRequired, setStarsAdsRequired] = useState(15);
  const [starsCycleUnlocksAt, setStarsCycleUnlocksAt] = useState<string | null>(null);
  const [starsAdToast, setStarsAdToast] = useState("");
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
  const adSequenceIndexRef = useRef(0);

  const getNextAdDelayMs = () => {
    const index = adSequenceIndexRef.current;
    adSequenceIndexRef.current += 1;

    void index;
    return 25000;
  };
  const adShowInFlightRef = useRef(false);



  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page]);

  // تحميل SDK الخاص بـ AdsGram
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initAdsgram = () => {
      if (!window.Adsgram) return;
      if (!adsgramControllerRef.current) {
        adsgramControllerRef.current = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });

        adsgramControllerRef.current.addEventListener?.("onTooLongSession", () => {
          window.location.reload();
        });
        adsgramControllerRef.current.addEventListener?.("onBannerNotFound", () => {});
        adsgramControllerRef.current.addEventListener?.("onNonStopShow", () => {});
      }
      if (!adsgramMiningControllerRef.current) {
        adsgramMiningControllerRef.current = window.Adsgram.init({
          blockId: ADSGRAM_MINING_BLOCK_ID,
        });

        adsgramMiningControllerRef.current.addEventListener?.("onTooLongSession", () => {
          window.location.reload();
        });
        adsgramMiningControllerRef.current.addEventListener?.("onBannerNotFound", () => {});
        adsgramMiningControllerRef.current.addEventListener?.("onNonStopShow", () => {});
      }
      if (!adsgramStarsControllerRef.current) {
        adsgramStarsControllerRef.current = window.Adsgram.init({
          blockId: ADSGRAM_STARS_BLOCK_ID,
        });

        adsgramStarsControllerRef.current.addEventListener?.("onTooLongSession", () => {
          window.location.reload();
        });
        adsgramStarsControllerRef.current.addEventListener?.("onBannerNotFound", () => {});
        adsgramStarsControllerRef.current.addEventListener?.("onNonStopShow", () => {});
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



  const showAdsgramAd = async () => {
    if (!adsgramControllerRef.current) return;

    if (adShowInFlightRef.current) return;

    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      return;
    }

    await acquireGlobalAdLock();

    if (typeof document !== "undefined" && document.visibilityState !== "visible") {
      releaseGlobalAdLock();
      return;
    }

    adShowInFlightRef.current = true;
    try {
      await adsgramControllerRef.current.show();
    } catch (err) {
      console.log("AdsGram ad skipped or unavailable", err);
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

    const scheduleNext = () => {
      if (cancelled) return;
      const delay = getNextAdDelayMs();
      repeatTimer = window.setTimeout(async () => {
        if (cancelled) return;
        await showAdsgramAd();
        scheduleNext();
      }, delay);
    };

    const FIRST_AD_DELAY_MS = 1000;

    repeatTimer = window.setTimeout(async () => {
      if (cancelled) return;
      await showAdsgramAd();
      scheduleNext();
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

  const cancelStarsAd = async () => {
    await callApi("/api/auth/me", {
      method: "POST",
      body: JSON.stringify({ action: "stars_ad_cancel" }),
    }).catch(() => {});
  };

  const waitForStarsAdVerification = async () => {
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        const data = await callApi("/api/auth/me", { method: "GET" });
        if (data?.starsAdVerified) return data;
      } catch {}

      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }

    return null;
  };

  const showStarsAd = async () => {
    const controller = adsgramStarsControllerRef.current;
    if (!controller) {
      throw new Error("Ad is not ready yet. Try again in a moment.");
    }

    const acquired = await acquireGlobalAdLock();
    if (!acquired) {
      throw new Error("Another ad is currently showing. Please try again.");
    }

    let timeoutId: number | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Ad did not report completion in time. Please try again."));
      }, MINING_AD_SHOW_TIMEOUT_MS);
    });

    try {
      await Promise.race([controller.show(), timeout]);
    } finally {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      releaseGlobalAdLock();
    }
  };

  const HANDLE_STARS_AD_HARD_TIMEOUT_MS = 45000;

  const handleWatchStarsAd = async () => {
    if (starsAdBusy) return;
    if (!adsgramStarsControllerRef.current) {
      setStarsAdToast("Ads are still loading, try again in a moment.");
      return;
    }

    setStarsAdBusy(true);
    setStarsAdToast("");

    let hardTimeoutId: number | undefined;
    const hardTimeout = new Promise<never>((_, reject) => {
      hardTimeoutId = window.setTimeout(() => {
        reject(new Error("Timed out. Please try again."));
      }, HANDLE_STARS_AD_HARD_TIMEOUT_MS);
    });

    const run = async () => {
      const prepare = await callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "stars_ad_prepare" }),
      });

      if (prepare.locked) {
        setStarsCycleUnlocksAt(prepare.cycleUnlocksAt ?? null);
        setStarsAdToast("Ads are locked while your 2-hour cycle is running.");
        return;
      }

      try {
        await showStarsAd();
      } catch (adErr) {
        await cancelStarsAd();
        throw adErr;
      }

      const verified = await waitForStarsAdVerification();
      if (!verified) {
        await cancelStarsAd();
        throw new Error("The ad reward was not confirmed yet. Please try again.");
      }

      await callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "stars_ad_ack" }),
      }).catch(() => {});

      setStarsAdBatchCount(verified.starsAdBatchCount ?? 0);
      setStarsCycleUnlocksAt(verified.starsCycleUnlocksAt ?? null);

      setStarsAdToast(
        verified.starsAdBatchCount === 0
          ? "Cycle started! Your time will climb for the next 2 hours."
          : `Ad watched — ${verified.starsAdBatchCount}/${starsAdsRequired}`
      );
    };

    try {
      await Promise.race([run(), hardTimeout]);
    } catch (err: any) {
      await cancelStarsAd();
      releaseGlobalAdLock();
      setStarsAdToast(err?.message || "Failed to watch ad.");
    } finally {
      if (hardTimeoutId !== undefined) window.clearTimeout(hardTimeoutId);
      setStarsAdBusy(false);
    }
  };

  const loadPlayerData = async () => {
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

    if (typeof data.starsAdBatchCount === "number") {
      setStarsAdBatchCount(data.starsAdBatchCount);
    }
    if (typeof data.starsAdsRequired === "number") {
      setStarsAdsRequired(data.starsAdsRequired);
    }
    if ("starsCycleUnlocksAt" in data) {
      setStarsCycleUnlocksAt(data.starsCycleUnlocksAt ?? null);
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
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        const state = await refreshMining();
        if (stage === "start" && state?.startAdVerified) return true;
        if (stage === "claim" && state?.claimAdVerified) return true;
      } catch {}

      await new Promise((resolve) => window.setTimeout(resolve, 1000));
    }

    return false;
  };

  const showMiningAd = async () => {
    const controller = adsgramMiningControllerRef.current;
    if (!controller) {
      throw new Error("Mining ad is not ready yet. Try again in a moment.");
    }

    const acquired = await acquireGlobalAdLock();
    if (!acquired) {
      throw new Error("Another ad is currently showing. Please try again.");
    }

    let timeoutId: number | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("Ad did not report completion in time. Please try again."));
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
        const prepare = await callApi("/api/auth/me", {
          method: "POST",
          body: JSON.stringify({ action: "mining_prepare_ad", stage: "start" }),
        });

        if (!prepare.alreadyVerified) {
          try {
            await showMiningAd();
          } catch (adErr) {
            await cancelMiningAd();
            throw adErr;
          }

          const verified = await waitForMiningAdVerification("start");
          if (!verified) {
            await cancelMiningAd();
            throw new Error("The mining ad reward was not confirmed yet. Please try again.");
          }
        }

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

      const prepare = await callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "mining_prepare_ad", stage: "claim" }),
      });

      if (!prepare.alreadyVerified) {
        try {
          await showMiningAd();
        } catch (adErr) {
          await cancelMiningAd();
          throw adErr;
        }

        const verified = await waitForMiningAdVerification("claim");
        if (!verified) {
          await cancelMiningAd();
          throw new Error("The claim ad reward was not confirmed yet. Please try again.");
        }
      }

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
            ? "افتح اللعبة من داخل تطبيق تيليجرام حتى يتم التعرف على حسابك."
            : "تعذر الاتصال بالخادم، حاول إغلاق التطبيق وفتحه مرة أخرى."
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

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        refreshPlayerData();
      }
    };

    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("focus", refreshPlayerData);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleFocus);
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

  const handleWatchWithdrawAd = async () => {
    // العداد ما عاد يزيد من هنا مباشرة - AdsGram يستدعي webhook آمن
    // (adsgram_reward) بعد ما يتأكد المستخدم شاهد الإعلان فعلاً،
    // وهذا يحدث القيمة الحقيقية بقاعدة البيانات. هنا بس نحدث الحالة
    // المحلية من السيرفر (مصدر الحقيقة الوحيد).
    try {
      const data = await loadPlayerData();
      setWithdrawalAdsWatched(data.withdrawalAdsWatched ?? 0);
      setWithdrawalAdsRequired(data.withdrawalAdsRequired ?? 10);
    } catch (err) {
      console.log("refresh after watch ad failed", err);
    }
  };

  const handleWalletConnected = (address: string) => {
    setWallet((prev) => ({ ...prev, walletAddress: address }));
  };

  const handleWalletDisconnected = () => {
    setWallet((prev) => ({ ...prev, walletAddress: null }));
  };

  const lifetimeCoins = useMemo(() => wallet.coins + wallet.spent, [wallet.coins, wallet.spent]);

  if (booting) {
    return (
      <div className="app">
        <Background />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 16,
          }}
        >
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes fade-pulse {
              0%, 100% { opacity: 0.4; }
              50% { opacity: 1; }
            }
          `}</style>


          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "3px solid rgba(234,244,242,0.12)",
              borderTopColor: "#40e0d0",
              animation: "spin 0.8s linear infinite",
            }}
          />

          <span
            style={{
              color: "#eaf4f2",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: 0.4,
              animation: "fade-pulse 1.6s ease-in-out infinite",
            }}
          >
            Loading
          </span>
        </div>
      </div>
    );
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
          <span>Your referral reward won't be counted — multiple accounts were detected on this device.</span>
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
              balanceCoins={wallet.coins}
              streak={streak}
              mining={mining}
              miningReady={miningReady}
              miningAdBusy={miningAdBusy}
              onMining={handleMining}
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
              adBatchCount={starsAdBatchCount}
              adsRequired={starsAdsRequired}
              cycleUnlocksAt={starsCycleUnlocksAt}
              adToast={starsAdToast}
              onWatchAd={handleWatchStarsAd}
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
        onWatchAd={handleWatchWithdrawAd}
        onClose={() => setWithdrawOpen(false)}
        onConfirm={handleWithdraw}
      />
    </div>
  );
}
