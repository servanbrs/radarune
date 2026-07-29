"use client";

import { useState } from "react";

const defaults = { discoverable: true, updates: true, analytics: false };
type Preferences = typeof defaults;

export function PrivacySettingsForm() {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    if (typeof window === "undefined") return defaults;
    try { const value = window.localStorage.getItem("radarune:privacy-preferences"); return value ? { ...defaults, ...JSON.parse(value) } : defaults; } catch { return defaults; }
  });
  const [saved, setSaved] = useState(false);

  function update(key: keyof Preferences, value: boolean) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    window.localStorage.setItem("radarune:privacy-preferences", JSON.stringify(next));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  const items: Array<[keyof Preferences, string, string]> = [
    ["discoverable", "Profilimi keşfette göster", "Profiliniz ve kullanıcı adınız arama sonuçlarında görünsün."],
    ["updates", "Yayın ve kampanya bildirimleri", "Yeni yayın, inceleme ve pre-save güncellemelerini alın."],
    ["analytics", "Analiz e-postaları", "Haftalık dinlenme ve performans özetini e-posta ile alın."],
  ];

  return <div className="mt-4 grid gap-3">
    {items.map(([key, title, description]) => <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-line bg-background/60 p-4" key={key}>
      <span><span className="block text-sm font-semibold">{title}</span><span className="mt-1 block text-xs text-muted">{description}</span></span>
      <input aria-label={title} checked={preferences[key]} className="h-5 w-5 accent-[var(--accent)]" onChange={(event) => update(key, event.target.checked)} type="checkbox" />
    </label>)}
    <p aria-live="polite" className="min-h-5 text-xs text-accent">{saved ? "Tercihler kaydedildi." : ""}</p>
  </div>;
}
