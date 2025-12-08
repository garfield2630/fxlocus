"use client";

import { useLang } from "./lang-context";

export function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <div className="lang-toggle" aria-label="Language switch">
      <button
        type="button"
        className={`lang-button ${lang === "zh" ? "lang-active" : ""}`}
        onClick={() => setLang("zh")}
      >
        中文
      </button>
      <span className="lang-divider">/</span>
      <button
        type="button"
        className={`lang-button ${lang === "en" ? "lang-active" : ""}`}
        onClick={() => setLang("en")}
      >
        EN
      </button>
    </div>
  );
}

