import "../styles/bottomnav.css";
import type { Page } from "../App";
import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  page: Page;
  setPage: (page: Page) => void;
};

type NavIconName =
  | "home"
  | "tasks"
  | "games"
  | "withdraw"
  | "referrals"
  | "profile";

function NavGlyph({
  name,
  className = "",
}: {
  name: NavIconName;
  className?: string;
}) {
  const common = {
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };

  switch (name) {
    case "home":
      return (
        <svg {...common}>
          <path d="m4.1 10.5 7.9-6.7 7.9 6.7" />
          <path d="M6.2 9.6v9.1c0 1 .7 1.7 1.7 1.7h8.2c1 0 1.7-.7 1.7-1.7V9.6" />
          <path d="M9.3 20.4v-5.3h5.4v5.3" />
          <path d="M16.6 5.8h2.6" opacity=".45" />
        </svg>
      );

    case "tasks":
      return (
        <svg {...common}>
          <rect x="5.2" y="3.8" width="13.6" height="16.4" rx="2.6" />
          <path d="m8.1 9.1 1.5 1.5 2.8-3" />
          <path d="M14.4 9.2h2" />
          <path d="m8.1 14.7 1.5 1.5 2.8-3" />
          <path d="M14.4 14.8h2" />
        </svg>
      );

    case "games":
      return (
        <svg {...common}>
          <path d="m5.4 9.3 1.3-3a2 2 0 0 1 1.8-1.2h7a2 2 0 0 1 1.8 1.2l1.3 3 1 5.9a2.7 2.7 0 0 1-4.9 1.7l-1-1.7H9.2l-1 1.7a2.7 2.7 0 0 1-4.9-1.7l1-5.9Z" />
          <path d="M7.8 10.3v4M5.8 12.3h4" />
          <path d="M15.3 11.3h.01M17.7 13.8h.01" strokeWidth="2.2" />
          <path d="m9.5 5.1 1-2M14.5 5.1l-1-2" opacity=".45" />
        </svg>
      );

    case "withdraw":
      return (
        <svg {...common}>
          <rect x="5.1" y="4.6" width="13.8" height="14.7" rx="1.5" />
          <path d="M8.3 8.4h7.4" opacity=".45" />
          <path d="M12 8.9v6.3" />
          <path d="m9.5 12.9 2.5 2.5 2.5-2.5" />
          <path d="M8.1 19.4v1.1h7.8v-1.1" opacity=".45" />
        </svg>
      );

    case "referrals":
      return (
        <svg {...common}>
          <circle cx="8" cy="7.6" r="2.8" />
          <circle cx="17" cy="16.5" r="2.8" />
          <path d="m10.2 9.5 4.6 5" />
          <path d="M4.3 19c.6-2.6 2-4 4.1-4 1.2 0 2.1.3 2.9 1" />
          <path d="M13.5 19.3c.6-1.6 1.7-2.5 3.5-2.5 1.2 0 2.1.4 2.7 1.2" />
          <path d="M4.7 6.4h.01M19.3 14.9h.01" strokeWidth="2" />
        </svg>
      );

    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="7.5" r="3.1" />
          <path d="M5.3 19.4c.8-3.2 3-4.8 6.7-4.8s5.9 1.6 6.7 4.8" />
          <path d="M17.2 5.2h3M18.7 3.7v3" opacity=".45" />
        </svg>
      );
  }
}

export default function BottomNav({ page, setPage }: Props) {
  const { t } = useLanguage();

  const items: {
    id: Page;
    label: string;
    icon: NavIconName;
  }[] = [
    { id: "home", label: t("bottomnav.home"), icon: "home" },
    { id: "tasks", label: t("bottomnav.tasks"), icon: "tasks" },
    { id: "games", label: t("bottomnav.games"), icon: "games" },
    { id: "withdrawal", label: t("bottomnav.withdrawal"), icon: "withdraw" },
    { id: "referrals", label: t("bottomnav.referrals"), icon: "referrals" },
    { id: "profile", label: t("bottomnav.profile"), icon: "profile" },
  ];

  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      <div className="bottom-nav-line" aria-hidden="true" />

      {items.map((item) => {
        const active = page === item.id;

        return (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${item.id} ${active ? "active" : ""}`}
            onClick={() => setPage(item.id)}
            aria-current={active ? "page" : undefined}
            data-nav={item.id}
          >
            <span className="nav-icon-wrap">
              <span className="nav-icon-orbit" aria-hidden="true" />
              <NavGlyph name={item.icon} className="nav-icon" />
            </span>

            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
