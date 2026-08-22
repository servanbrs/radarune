"use client";

import { useTransition } from "react";
import { t } from "@/lib/i18n";

export function LanguageSwitcher({ locale, dark = false }: { locale: string; dark?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <select aria-label={t(locale, "language")} className={dark ? "rounded-xl border border-white/15 bg-white/10 px-2 py-2 text-xs font-medium text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/30" : "rounded-xl border border-line bg-surface px-2 py-2 text-xs font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"} disabled={pending} value={locale} onChange={(event) => {
      const next = event.target.value;
      startTransition(async () => {
        document.cookie = `radarune-locale=${encodeURIComponent(next)}; Path=/; Max-Age=31536000; SameSite=Lax`;
        await fetch("/api/organization/locale", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: next }) });
        window.location.reload();
      });
    }}>
      <option value="tr-TR">TR</option><option value="en-US">EN</option><option value="de-DE">DE</option>
    </select>
  );
}
