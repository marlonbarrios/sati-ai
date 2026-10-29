"use client";

import { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "sati-theme";

type ThemeContextValue = {
  isDark: boolean;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggle: () => undefined,
});

function applyTheme(isDark: boolean) {
  const theme = isDark ? "satiDark" : "sati";
  document.documentElement.setAttribute("data-theme", theme);
  document.body.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-theme") === "satiDark");
  }, []);

  const toggle = () => {
    const next = document.documentElement.getAttribute("data-theme") !== "satiDark";
    applyTheme(next);
    setIsDark(next);
  };

  return <ThemeContext.Provider value={{ isDark, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
