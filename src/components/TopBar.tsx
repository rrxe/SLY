import "../styles/topbar.css";
import UiIcons from "./UiIcons";
import type { Page } from "../App";
import { useLanguage } from "../i18n/LanguageContext";

type Props = {
  page: Page;
  coins: number;
  usdt: number;
};

export default function TopBar({
  page,
  coins,
  usdt,
}: Props) {
  const { t } = useLanguage();

  const titles: Record<Page, { label: string; sub: string }> = {
    home: { label: t("topbar.home.label"), sub: t("topbar.home.sub") },
    tasks: { label: t("topbar.tasks.label"), sub: t("topbar.tasks.sub") },
    games: { label: t("topbar.games.label"), sub: t("topbar.games.sub") },
    referrals: { label: t("topbar.referrals.label"), sub: t("topbar.referrals.sub") },
    stars: { label: t("topbar.stars.label"), sub: t("topbar.stars.sub") },
    profile: { label: t("topbar.profile.label"), sub: t("topbar.profile.sub") },
  };

  const current = titles[page];

  return (
    <header className="topbar">
      <div className="topbar-left">
        <p className="topbar-kicker">
          {t("topbar.kicker")}
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
              {t("topbar.coins")}
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
              {t("topbar.usdt")}
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

