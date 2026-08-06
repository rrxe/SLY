import "../styles/topbar.css";
import UiIcons from "./UiIcons";

type Page = "home" | "tasks" | "collection" | "referrals" | "profile";

type Props = {
  page: Page;
};

const titles: Record<Page, { label: string; sub: string }> = {
  home: { label: "SLY", sub: "Premium reward game" },
  tasks: { label: "Tasks", sub: "Daily missions" },
  collection: { label: "Collection", sub: "Stones & gems vault" },
  referrals: { label: "Referrals", sub: "Invite & earn" },
  profile: { label: "Profile", sub: "Exchange & withdraw" },
};

export default function TopBar({ page }: Props) {
  const current = titles[page];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <p className="topbar-kicker">CYBER VAULT</p>
        <div className="topbar-row">
          <span className="page-chip">{current.label.toUpperCase()}</span>
          <span className="topbar-sub">{current.sub}</span>
        </div>
      </div>

      <div className="topbar-stats">
        <div className="stat-pill coins">
          <UiIcons name="coins" className="stat-icon coins-icon" />
          <div>
            <small>Coins</small>
            <strong>12,480</strong>
          </div>
        </div>

        <div className="stat-pill energy">
          <UiIcons name="energy" className="stat-icon energy-icon" />
          <div>
            <small>Energy</small>
            <strong>5/5</strong>
          </div>
        </div>
      </div>
    </header>
  );
}
