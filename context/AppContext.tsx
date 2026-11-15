"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { translations, Language } from "@/lib/translations";

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  theme: "light" | "dark";
  toggleTheme: () => void;
  avatar: string;
  setAvatar: (url: string) => void;
}

const DEFAULT_AVATAR = "/images/avatar-man.svg";

const AppContext = createContext<AppContextType>({
  language: "fr",
  setLanguage: () => {},
  t: (key: string) => key,
  theme: "light",
  toggleTheme: () => {},
  avatar: DEFAULT_AVATAR,
  setAvatar: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");
  const [theme, setThemeState] = useState<"light" | "dark">("light");
  const [avatar, setAvatarState] = useState<string>(DEFAULT_AVATAR);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initialiser la langue (par défaut : fr)
    try {
      const savedLang = localStorage.getItem("vita_lang") as Language;
      if (savedLang === "fr" || savedLang === "en") {
        setLanguageState(savedLang);
      }
    } catch {}

    // Initialiser le thème (par défaut : light)
    try {
      const savedTheme = localStorage.getItem("vita_theme") as "light" | "dark";
      if (savedTheme === "dark") {
        setThemeState("dark");
        document.documentElement.classList.add("dark");
      } else {
        setThemeState("light");
        document.documentElement.classList.remove("dark");
      }
    } catch {}

    // Initialiser l'avatar
    try {
      const savedAvatar = localStorage.getItem("vita_user_avatar");
      if (savedAvatar) {
        setAvatarState(savedAvatar);
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("vita_lang", lang);
      document.cookie = `vita_lang=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setThemeState(nextTheme);
    try {
      localStorage.setItem("vita_theme", nextTheme);
      document.cookie = `vita_theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {}
  };

  const setAvatar = (url: string) => {
    setAvatarState(url);
    try {
      localStorage.setItem("vita_user_avatar", url);
    } catch {}
  };

  const t = (key: string): string => {
    const langDict = translations[language] || translations.fr;
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Repli sur le français
    if (translations.fr[key]) {
      return translations.fr[key];
    }
    return key;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        theme,
        toggleTheme,
        avatar,
        setAvatar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
