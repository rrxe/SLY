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
};

const STORAGE_KEY = "sly.wallet.v2";
const DEFAULT_COINS = 12480;
const DEFAULT_USDT = 0.13;

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadWallet(): WalletState {
  if (typeof window === "undefined") {
    return { coins: DEFAULT_COINS, usdt: DEFAULT_USDT, spent: 0 };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { coins: DEFAULT_COINS, usdt: DEFAULT_USDT, spent: 0 };

    const parsed = JSON.parse(raw) as Partial<WalletState>;
    return {
      coins: typeof parsed.coins === "number" ? parsed.coins : DEFAULT_COINS,
      usdt: typeof parsed.usdt === "number" ? parsed.usdt : DEFAULT_USDT,
      spent: typeof parsed.spent === "number" ? parsed.spent : 0,
    };
  } catch {
    return { coins: DEFAULT_COINS, usdt: DEFAULT_USDT, spent: 0 };
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

  const lifetimeCoins = useMemo(() => wallet.coins + wallet.spent, [wallet.coins, wallet.spent]);

  if (mode === "game") {
    return <GameCanvas onExit={() => setMode("lobby")} />;
  }

  return (
    <div className="app">
      <Background />
      <TopBar page={page} coins={wallet.coins} energy={5} />

      <main className="page-container">
        <div className="page-scroll">
          {page === "home" && (
            <Home
              onPlay={() => setMode("game")}
              balanceCoins={wallet.coins}
              onClaimCoins={handleClaimDaily}
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
    </div>
  );
}
