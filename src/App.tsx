import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

import Background from "./components/Background";
import BottomNav from "./components/BottomNav";
import GameCanvas from "./components/GameCanvas";
import TopBar from "./components/TopBar";

import Home from "./pages/Home";
import Tasks from "./pages/Tasks";
import Collection from "./pages/Collection";
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

export const ENERGY_MAX = 5;

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
  // ستريك تسجيل الحضور اليومي - يجي من /api/auth/me ويتحدث بعد أي
  // check-in تلقائي ناجح (شوف useEffect تحت)
  const [streak, setStreak] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");

  // مرجع لحاوية محتوى الصفحة (page-scroll). هذي الحاوية ثابتة بين
  // الصفحات (بس المحتوى جواها يتبدل)، فيبقى موضع السكرول القديم عالق
  // عند الانتقال لصفحة جديدة. نصفره يدوياً كل مرة تتغير فيها page.
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [page]);

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

    return data;
  };

  const pushActivity = (title: string, meta: string, tone: ActivityTone) => {
    setActivities((prev) => [{ id: makeId(), title, meta, tone }, ...prev].slice(0, 8));
  };

  useEffect(() => {
    let cancelled = false;

    // check-in تلقائي: يصير مرة وحدة بس هنا عند فتح التطبيق (أول تحميل)،
    // وليس بالتحديث الدوري (interval/focus) تحت. نتحقق من claimedToday
    // القادمة من /api/auth/me (اليوم يتحدد بتوقيت UTC عند منتصف الليل،
    // نفس منطق daily-checkin.js بالسيرفر) وإذا لسه ما سجل اليوم نرسل
    // /api/daily-checkin تلقائياً بدون أي تدخل من المستخدم.
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
            // فشل صامت هنا؛ يعاد تلقائياً بالمرة الجاية يفتح فيها التطبيق
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

    // التحديث الدوري (كل 60 ثانية + عند الرجوع للتطبيق): يحدث الرصيد
    // والطاقة فقط، ولا يسوي أي check-in - عمداً حتى ما يتكرر الطلب
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

  const handleWithdraw = async (amount: number) => {
    if (amount <= 0 || amount > wallet.usdt) return;

    try {
      const data = await callApi("/api/withdraw", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });

      setWallet((prev) => ({ ...prev, usdt: data.usdtBalance }));

      pushActivity(
        "Withdrawal requested",
        `${amount.toFixed(4)} USDT sent for processing`,
        "exchange"
      );
    } catch (err: any) {
      pushActivity("Withdrawal failed", err.message, "info");
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
      pushActivity(
        "Not enough energy",
        "You need energy to start Laser Escape",
        "info"
      );
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
      pushActivity(
        "Unable to start game",
        err.message || "Not enough energy",
        "info"
      );
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
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            color: "#eaf3ff",
          }}
        >
          جارِ التحميل...
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
            color: "#eaf3ff",
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
            />
          )}

          {page === "tasks" && <Tasks onRewardCoins={handleTaskReward} />}
          {page === "collection" && <Collection />}
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
        onClose={() => setWithdrawOpen(false)}
        onConfirm={handleWithdraw}
      />
    </div>
  );
}
