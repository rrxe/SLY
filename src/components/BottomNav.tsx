import "../styles/bottomnav.css";
import UiIcons from "./UiIcons";
import type { Page } from "../App";
import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  page: Page;
  setPage: (page: Page) => void;
};

export default function BottomNav({ page, setPage }: Props) {
  const { t } = useLanguage();

  const items: {
    id: Page;
    label: string;
    icon: "home" | "tasks" | "referrals" | "games" | "profile";
  }[] = [
    { id: "home", label: t("bottomnav.home"), icon: "home" },
    { id: "tasks", label: t("bottomnav.tasks"), icon: "tasks" },
    { id: "games", label: t("bottomnav.games"), icon: "games" },
    { id: "referrals", label: t("bottomnav.referrals"), icon: "referrals" },
    { id: "profile", label: t("bottomnav.profile"), icon: "profile" },
  ];

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

