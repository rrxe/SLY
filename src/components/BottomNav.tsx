import "../styles/bottomnav.css";
import UiIcons from "./UiIcons";
import type { Page } from "../App";

type Props = {
  page: Page;
  setPage: (page: Page) => void;
};

const items: {
  id: Page;
  label: string;
  icon: "home" | "tasks" | "referrals" | "star" | "games" | "profile";
}[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "tasks", label: "Tasks", icon: "tasks" },
  { id: "referrals", label: "Referrals", icon: "referrals" },
  { id: "games", label: "Games", icon: "games" },
  { id: "stars", label: "Stars", icon: "star" },
  { id: "profile", label: "Profile", icon: "profile" },
];

export default function BottomNav({ page, setPage }: Props) {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.id}
          className={page === item.id ? `nav-item active ${item.id}` : `nav-item ${item.id}`}
          onClick={() => setPage(item.id)}
        >
          <UiIcons name={item.icon} className="nav-icon" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
