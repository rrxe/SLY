import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import Background from "./components/Background";
import BottomNav from "./components/BottomNav";
import GameCanvas from "./components/GameCanvas";
import TopBar from "./components/TopBar";

import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Referrals from "./pages/Referrals";
import Profile from "./pages/Profile";

import ExchangeModal from "./modals/ExchangeModal";
import WithdrawalModal from "./modals/WithdrawalModal";

type Page = "home" | "tasks" | "collection" | "referrals" | "profile";
type Mode = "lobby" | "game";
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
  energy: number;
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
};

declare global {
  interface Window {
    showAdsGalaxy?: () => Promise<any>;
    Adsgram?: {
      init: (opts: { blockId: string }) => AdsgramController;
    };
  }
}

export const ENERGY_MAX = 5;

const ADSGRAM_BLOCK_ID = "int-43434";
const ADSGRAM_SCRIPT_SRC = "https://sad.adsgram.ai/js/sad.min.js";

const ADSGALAXY_MINI_APP_ID = "32";
const ADSGALAXY_SCRIPT_SRC = `https://app.adsgalaxy.online/sdk.js?id=${ADSGALAXY_MINI_APP_ID}`;

const REPEAT_AD_DELAY_MS = 40000;

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getInitData() {
  const tg = (window as any).Telegram?.WebApp;
  return tg?.initData || "";
}

async function callApi(path: string, options: RequestInit = {}) {
  const initData = getInitData();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `tga ${initData}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }

  return data;
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [mode, setMode] = useState<Mode>("lobby");
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [startingGame, setStartingGame] = useState(false);

  const [wallet, setWallet] = useState<WalletState>({
    coins: 0,
    usdt: 0,
    spent: 0,
    energy: ENERGY_MAX,
    walletAddress: null,
  });

  const [streak, setStreak] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");
  const [adsgramReady, setAdsgramReady] = useState(false);
  const [adsGalaxyReady, setAdsGalaxyReady] = useState(false);
  const adsgramControllerRef = useRef<AdsgramController | null>(null);

  // حالة بوابة السحب: عدد الإعلانات المشاهدة + وقت رجوع إمكانية السحب
  const [withdrawalAdsWatched, setWithdrawalAdsWatched] = useState(0);
  const [withdrawalAdsRequired, setWithdrawalAdsRequired] = useState(10);
  const [nextWithdrawalAvailableAt, setNextWithdrawalAvailableAt] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const firstAdShownRef = useRef(false);

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
      }
      setAdsgramReady(true);
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
      return;
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

  // تحميل SDK الخاص بـ AdsGalaxy
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.showAdsGalaxy) {
      setAdsGalaxyReady(true);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${ADSGALAXY_SCRIPT_SRC}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => setAdsGalaxyReady(true), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = ADSGALAXY_SCRIPT_SRC;
    script.async = true;

    script.onload = () => setAdsGalaxyReady(true);
    script.onerror = () => {
      setAdsGalaxyReady(false);
      console.log("Failed to load AdsGalaxy SDK");
    };

    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  const showAdsgramAd = async () => {
    if (!adsgramControllerRef.current) return;
    try {
      await adsgramControllerRef.current.show();
    } catch (err) {
      console.log("AdsGram ad skipped or unavailable", err);
    }
  };

  useEffect(() => {
    if (booting || bootError || mode !== "lobby") return;
    if (!adsgramReady) return;

    let cancelled = false;
    let repeatTimer: number | null = null;

    const startRepeating = () => {
      if (repeatTimer) return;
      repeatTimer = window.setInterval(() => {
        if (cancelled) return;
        void showAdsgramAd();
      }, REPEAT_AD_DELAY_MS);
    };

    const handleFirstInteraction = () => {
      if (firstAdShownRef.current) return;
      firstAdShownRef.current = true;
      void showAdsgramAd();
      startRepeating();
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
    };

    if (firstAdShownRef.current) {
      startRepeating();
    } else {
      window.addEventListener("click", handleFirstInteraction);
      window.addEventListener("touchstart", handleFirstInteraction);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("touchstart", handleFirstInteraction);
      if (repeatTimer) window.clearInterval(repeatTimer);
    };
  }, [booting, bootError, mode, adsgramReady]);

  const loadPlayerData = async () => {
    const data = await callApi("/api/auth/me", { method: "GET" });

    setWallet((prev) => ({
      ...prev,
      coins: data.coins ?? 0,
      usdt: data.usdtBalance ?? 0,
      energy: data.energy ?? ENERGY_MAX,
      walletAddress: data.walletAddress ?? null,
    }));
    setStreak(data.streak ?? 0);
    setWithdrawalAdsWatched(data.withdrawalAdsWatched ?? 0);
    setWithdrawalAdsRequired(data.withdrawalAdsRequired ?? 10);
    setNextWithdrawalAvailableAt(data.nextWithdrawalAvailableAt ?? null);

    return data;
  };

  const pushActivity = (title: string, meta: string, tone: ActivityTone) => {
    setActivities((prev) => [{ id: makeId(), title, meta, tone }, ...prev].slice(0, 8));
  };

  useEffect(() => {
    let cancelled = false;

    loadPlayerData()
      .then(async (data) => {
        if (cancelled) return;

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
        setBootError(
          String(err.message || "").includes("authentication")
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

    const intervalId = window.setInterval(refreshPlayerData, 60 * 1000);

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
      setNextWithdrawalAvailableAt(
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      );

      pushActivity(
        "Withdrawal requested",
        method === "binance"
          ? `${amount.toFixed(4)} USDT to Binance ID ${target}`
          : `${amount.toFixed(4)} USDT ≈ ${data.bnbAmount ?? "?"} BNB to ${target.slice(0, 6)}...${target.slice(-4)}`,
        "exchange"
      );
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

  const handlePlay = async () => {
    if (startingGame) return;

    if (wallet.energy <= 0) {
      pushActivity("Not enough energy", "You need energy to start Laser Escape", "info");
      return;
    }

    setStartingGame(true);

    try {
      const data = await callApi("/api/auth/me", {
        method: "POST",
        body: JSON.stringify({ action: "consume_energy" }),
      });

      setWallet((prev) => ({
        ...prev,
        energy: data.energy ?? Math.max(0, prev.energy - 1),
      }));

      setMode("game");
    } catch (err: any) {
      pushActivity("Unable to start game", err.message || "Not enough energy", "info");
    } finally {
      setStartingGame(false);
    }
  };

  const handleGameExit = (coinsEarned = 0) => {
    if (coinsEarned > 0) {
      setWallet((prev) => ({ ...prev, coins: prev.coins + coinsEarned }));
      pushActivity(`Run reward +${coinsEarned}`, "Coins earned from Laser Escape", "reward");

      callApi("/api/tasks/complete", {
        method: "POST",
        body: JSON.stringify({ taskType: "game_run", reward: coinsEarned }),
      }).catch(() => {});
    }
    setMode("lobby");
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

  if (mode === "game") {
    return <GameCanvas onExit={handleGameExit} />;
  }

  return (
    <div className="app">
      <Background />
      <TopBar page={page} coins={wallet.coins} energy={wallet.energy} />

      <main className="page-container">
        <div className="page-scroll" ref={scrollRef}>
          {page === "home" && (
            <Home
              onPlay={handlePlay}
              balanceCoins={wallet.coins}
              energyCurrent={wallet.energy}
              energyMax={ENERGY_MAX}
              streak={streak}
              isStartingGame={startingGame}
            />
          )}

          {page === "tasks" && <Tasks onRewardCoins={handleTaskReward} />}
          {page === "referrals" && <Referrals />}

          {page === "profile" && (
            <Profile
              walletCoins={wallet.coins}
              lifetimeCoins={lifetimeCoins}
              lifetimeSpent={wallet.spent}
              usdtBalance={wallet.usdt}
              activities={activities}
              serverWalletAddress={wallet.walletAddress}
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
