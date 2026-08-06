import { useState } from "react";
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

type Page = "home" | "tasks" | "collection" | "referrals" | "profile";
type Mode = "lobby" | "game";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [mode, setMode] = useState<Mode>("lobby");

  if (mode === "game") {
    return <GameCanvas onExit={() => setMode("lobby")} />;
  }

  return (
    <div className="app">
      <Background />
      <TopBar page={page} />

      <main className="page-container">
        <div className="page-scroll">
          {page === "home" && <Home onPlay={() => setMode("game")} />}
          {page === "tasks" && <Tasks />}
          {page === "collection" && <Collection />}
          {page === "referrals" && <Referrals />}
          {page === "profile" && <Profile />}
        </div>
      </main>

      <BottomNav page={page} setPage={setPage} />
    </div>
  );
}
