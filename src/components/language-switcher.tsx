"use client";

import { useTransition } from "react";

export function LanguageSwitcher({ locale }: { locale: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <select aria-label="Site dili" className="rounded-xl border border-line bg-surface px-2 py-2 text-xs font-medium" disabled={pending} value={locale} onChange={(event) => {
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
