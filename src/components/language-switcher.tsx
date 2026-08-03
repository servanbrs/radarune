"use client";

import { useTransition } from "react";

export function LanguageSwitcher({ locale, dark = false }: { locale: string; dark?: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <select aria-label="Site dili" className={dark ? "rounded-xl border border-white/15 bg-white/10 px-2 py-2 text-xs font-medium text-white outline-none" : "rounded-xl border border-line bg-surface px-2 py-2 text-xs font-medium"} disabled={pending} value={locale} onChange={(event) => {
      const next = event.target.value;
      startTransition(async () => {
        await fetch("/api/organization/locale", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ locale: next }) });
        window.location.reload();
      });
    }}>
      <option value="tr-TR">TR</option><option value="en-US">EN</option><option value="de-DE">DE</option>
    </select>
  );
}
