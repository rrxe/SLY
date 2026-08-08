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
};

const STORAGE_KEY = "sly.wallet.v2";
const DEFAULT_COINS = 12480;
const DEFAULT_USDT = 0.13;
export const ENERGY_MAX = 5;

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadWallet(): WalletState {
  if (typeof window === "undefined") {
    return { coins: DEFAULT_COINS, usdt: DEFAULT_USDT, spent: 0, energy: ENERGY_MAX };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { coins: DEFAULT_COINS, usdt: DEFAULT_USDT, spent: 0, energy: ENERGY_MAX };

    const parsed = JSON.parse(raw) as Partial<WalletState>;
    return {
      coins: typeof parsed.coins === "number" ? parsed.coins : DEFAULT_COINS,
      usdt: typeof parsed.usdt === "number" ? parsed.usdt : DEFAULT_USDT,
      spent: typeof parsed.spent === "number" ? parsed.spent : 0,
      energy: typeof parsed.energy === "number" ? parsed.energy : ENERGY_MAX,
    };
  } catch {
    return { coins: DEFAULT_COINS, usdt: DEFAULT_USDT, spent: 0, energy: ENERGY_MAX };
  }
}

function loadActivities(): Activity[] {
  return [
    {
      id: makeId(),
      title: "Wallet ready",
      meta: "Premium reward wallet online",
      tone: "info",
    },
  ];
}

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [mode, setMode] = useState<Mode>("lobby");
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const [wallet, setWallet] = useState<WalletState>(() => loadWallet());
  const [activities, setActivities] = useState<Activity[]>(() => loadActivities());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));
    } catch {
      // ignore storage failures
    }
  }, [wallet]);

  const pushActivity = (title: string, meta: string, tone: ActivityTone) => {
    setActivities((prev) => [
      { id: makeId(), title, meta, tone },
      ...prev,
    ].slice(0, 8));
  };

  const handleClaimDaily = (amount: number) => {
    setWallet((prev) => ({ ...prev, coins: prev.coins + amount }));
    pushActivity(`Daily check-in +${amount}`, "Reward claimed successfully", "reward");
  };

  const handleTaskReward = (amount: number, title: string, meta: string) => {
    setWallet((prev) => ({ ...prev, coins: prev.coins + amount }));
    pushActivity(title, meta, "reward");
  };

  const handleExchange = (amountCoins: number) => {
    if (amountCoins <= 0 || amountCoins > wallet.coins) return;

    const usdt = Number((amountCoins * 0.0000025).toFixed(4));

    setWallet((prev) => ({
      ...prev,
      coins: prev.coins - amountCoins,
      usdt: Number((prev.usdt + usdt).toFixed(4)),
      spent: prev.spent + amountCoins,
    }));

    pushActivity(
      "Exchange completed",
      `${amountCoins.toLocaleString()} Coins → ${usdt.toFixed(4)} USDT`,
      "exchange"
    );
  };

  const handleWithdraw = async (amount: number) => {
    if (amount <= 0 || amount > wallet.usdt) return;

    try {
      const tg = (window as any).Telegram?.WebApp;
      const initData = tg?.initData || "";

      const response = await fetch("/api/profile/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `tga ${initData}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error("فشل إرسال طلب السحب");
      }

      setWallet((prev) => ({
        ...prev,
        usdt: Number((prev.usdt - amount).toFixed(4)),
      }));

      pushActivity(
        "Withdrawal requested",
        `${amount.toFixed(4)} USDT sent for processing`,
        "exchange"
      );
    } catch (error) {
      console.error("Error withdrawing:", error);
      pushActivity(
        "Withdrawal failed",
        "Could not connect to server",
        "info"
      );
    }
  };

  const handlePlay = () => {
    if (wallet.energy <= 0) return;
    setWallet((prev) => ({ ...prev, energy: prev.energy - 1 }));
    setMode("game");
  };

  const handleGameExit = (coinsEarned = 0) => {
    if (coinsEarned > 0) {
      setWallet((prev) => ({ ...prev, coins: prev.coins + coinsEarned }));
      pushActivity(`Run reward +${coinsEarned}`, "Coins earned from Laser Escape", "reward");
    }
    setMode("lobby");
  };

  const lifetimeCoins = useMemo(() => wallet.coins + wallet.spent, [wallet.coins, wallet.spent]);

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
              onOpenExchange={() => setExchangeOpen(true)}
              onOpenWithdraw={() => setWithdrawOpen(true)}
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
