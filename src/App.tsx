import { useEffect, useMemo, useState } from "react";
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [booting, setBooting] = useState(true);
  const [bootError, setBootError] = useState("");

  useEffect(() => {
    let cancelled = false;

    callApi("/api/auth/me", { method: "GET" })
      .then((data) => {
        if (cancelled) return;
        setWallet((prev) => ({
          ...prev,
          coins: data.coins ?? 0,
          usdt: data.usdtBalance ?? 0,
          energy: data.energy ?? ENERGY_MAX,
          walletAddress: data.walletAddress ?? null,
        }));
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

    return () => {
      cancelled = true;
    };
  }, []);

  const pushActivity = (title: string, meta: string, tone: ActivityTone) => {
    setActivities((prev) => [{ id: makeId(), title, meta, tone }, ...prev].slice(0, 8));
  };

  const handleClaimDaily = (amount: number) => {
    setWallet((prev) => ({ ...prev, coins: prev.coins + amount }));
    pushActivity(`Daily check-in +${amount}`, "Reward claimed successfully", "reward");
  };

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
        energy: data.energy ?? prev.energy - 1,
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
        <div className="page-scroll">
          {page === "home" && (
            <Home
              onPlay={handlePlay}
              balanceCoins={wallet.coins}
              onClaimCoins={handleClaimDaily}
              energyCurrent={wallet.energy}
              energyMax={ENERGY_MAX}
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
