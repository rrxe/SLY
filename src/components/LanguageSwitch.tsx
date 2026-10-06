import { useLanguage } from "../i18n/LanguageContext";
import "../styles/language.css";

export default function LanguageSwitch() {
  const { lang, setLang, t } = useLanguage();

  return (
    <section className="language-switch-card">
      <div className="language-switch-head">
        <p>{t("profile.languageSection")}</p>
        <span>{t("profile.languageHint")}</span>
      </div>

      <div className="language-switch-row" role="group" aria-label={t("language.label")}>
        <button
          type="button"
          className={`language-switch-btn ${lang === "en" ? "active" : ""}`}
          onClick={() => setLang("en")}
        >
          🇬🇧 {t("language.english")}
        </button>

        <button
          type="button"
          className={`language-switch-btn ${lang === "ar" ? "active" : ""}`}
          onClick={() => setLang("ar")}
        >
          🇸🇦 {t("language.arabic")}
        </button>
      </div>
    </section>
  );
}

