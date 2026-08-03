"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ dark: darkVariant = false }: { dark?: boolean } = {}) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;

    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      type="button"
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      onClick={() => setDark((current) => !current)}
      className={darkVariant ? "inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/15" : "inline-flex size-10 items-center justify-center rounded-full border border-line bg-surface text-foreground transition hover:bg-surface-strong"}
    >
      {dark ? (
        <Sun className="size-4" aria-hidden="true" />
      ) : (
        <Moon className="size-4" aria-hidden="true" />
      )}
    </button>
  );
}
