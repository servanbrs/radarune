"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("radarune-theme");
    const enabled = saved === "dark";
    document.documentElement.dataset.theme = enabled ? "dark" : "light";
  }, []);

  return (
    <button
      aria-label={dark ? "Gündüz moduna geç" : "Gece moduna geç"}
      className="grid h-10 w-10 place-items-center rounded-full border border-line bg-surface text-muted hover:bg-surface-strong hover:text-foreground"
      onClick={() => {
        const enabled = !dark;
        document.documentElement.dataset.theme = enabled ? "dark" : "light";
        window.localStorage.setItem("radarune-theme", enabled ? "dark" : "light");
        setDark(enabled);
      }}
      type="button"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
