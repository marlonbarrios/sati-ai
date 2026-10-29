"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/components/ThemeProvider";

export const SwitchTheme = ({ className }: { className?: string }) => {
  const { isDark, toggle } = useTheme();

  return (
    <div className={`flex space-x-2 text-sm ${className ?? ""}`}>
      <input
        id="theme-toggle"
        type="checkbox"
        className="toggle toggle-primary border-base-content bg-base-100"
        onChange={toggle}
        checked={isDark}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      />
      <label htmlFor="theme-toggle" className={`swap swap-rotate ${isDark ? "" : "swap-active"}`}>
        <SunIcon className="swap-on h-5 w-5" />
        <MoonIcon className="swap-off h-5 w-5" />
      </label>
    </div>
  );
};
