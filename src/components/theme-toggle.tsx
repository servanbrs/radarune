"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("radarune-theme");
    const enabled = saved === "dark";
    document.documentElement.dataset.theme = enabled ? "dark" : "light";
    setDark(enabled);
  }, []);

  return (
    <button
      aria-label={dark ? "Gündüz moduna geç" : "Gece moduna geç"}
      className="theme-toggle grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted hover:bg-surface-strong hover:text-foreground"
      onClick={() => {
        const enabled = !dark;
        document.documentElement.classList.add("theme-transitioning");
        document.documentElement.dataset.theme = enabled ? "dark" : "light";
        window.localStorage.setItem("radarune-theme", enabled ? "dark" : "light");
        setDark(enabled);
        window.setTimeout(() => document.documentElement.classList.remove("theme-transitioning"), 420);
      }}
      type="button"
    >
      <span className="theme-toggle-icon">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</span>
    </button>
  );
}
