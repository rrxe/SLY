import "../styles/topbar.css";
import UiIcons from "./UiIcons";

type Page =
  | "home"
  | "tasks"
  | "collection"
  | "referrals"
  | "stars"
  | "profile";

type Props = {
  page: Page;
  coins: number;
  usdt: number;
};

const titles: Record<
  Page,
  {
    label: string;
    sub: string;
  }
> = {
  home: {
    label: "SLY",
    sub: "Mine & earn",
  },

  tasks: {
    label: "Tasks",
    sub: "Daily missions",
  },

  collection: {
    label: "Collection",
    sub: "Stones & gems vault",
  },

  referrals: {
    label: "Referrals",
    sub: "Invite & earn",
  },

  stars: {
    label: "Stars",
    sub: "Weekly leaderboard",
  },

  profile: {
    label: "Profile",
    sub: "Exchange & withdraw",
  },
};

export default function TopBar({
  page,
  coins,
  usdt,
}: Props) {
  const current =
    titles[page];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <p className="topbar-kicker">
          SLY MINING
        </p>

        <div className="topbar-row">
          <span className="page-chip">
            {current.label.toUpperCase()}
          </span>

          <span className="topbar-sub">
            {current.sub}
          </span>
        </div>
      </div>

      <div className="topbar-stats">
        <div className="stat-pill coins">
          <UiIcons
            name="coins"
            className="stat-icon coins-icon"
          />

          <div>
            <small>
              Coins
            </small>

            <strong>
              {coins.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="stat-pill usdt">
          <UiIcons
            name="withdraw"
            className="stat-icon usdt-icon"
          />

          <div>
            <small>
              USDT
            </small>

            <strong>
              {usdt.toFixed(4)}
            </strong>
          </div>
        </div>
      </div>
    </header>
  );
}
