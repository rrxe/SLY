import { useLanguage } from "../i18n/LanguageContext";
import { setTheme, useTheme } from "../theme/theme";
import "../styles/language.css";

export default function ThemeSwitch() {
  const { t } = useLanguage();
  const theme = useTheme();

  return (
    <section className="language-switch-card">
      <div className="language-switch-head">
        <p>{t("theme.section")}</p>
        <span>{t("theme.hint")}</span>
      </div>

      <div className="language-switch-row" role="group" aria-label={t("theme.label")}>
        <button
          type="button"
          aria-pressed={theme === "color"}
          className={`language-switch-btn ${theme === "color" ? "active" : ""}`}
          onClick={() => void setTheme("color")}
        >
          <i className="theme-swatch theme-swatch--color" aria-hidden="true" />
          {t("theme.color")}
        </button>

        <button
          type="button"
          aria-pressed={theme === "mono"}
          className={`language-switch-btn ${theme === "mono" ? "active" : ""}`}
          onClick={() => void setTheme("mono")}
        >
          <i className="theme-swatch theme-swatch--mono" aria-hidden="true" />
          {t("theme.mono")}
        </button>
      </div>
    </section>
  );
}
