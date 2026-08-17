"use client";

import { useEffect, useState } from "react";

type Comparison = { periodDays: number; spotify: number; youtube: number };

export function UtmPlatformComparison() {
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/admin/growth/utm-comparison", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json()) as Comparison | { error?: string };
        if (!response.ok) {
          throw new Error("error" in data && data.error ? data.error : "UTM verisi alınamadı.");
        }
        if (active) setComparison(data as Comparison);
      })
      .catch((requestError: unknown) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "UTM verisi alınamadı.");
      });

    return () => {
      active = false;
    };
  }, []);

  const total = (comparison?.spotify ?? 0) + (comparison?.youtube ?? 0);
  const percentage = (value: number) => (total > 0 ? Math.round((value / total) * 100) : 0);
  const cards: Array<[string, number, string]> = [
    ["Spotify", comparison?.spotify ?? 0, "spotify"],
    ["YouTube", comparison?.youtube ?? 0, "youtube"],
  ];

  return (
    <section className="panel grid gap-5 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Smart Link analizi</p>
        <h2 className="mt-2 text-2xl font-semibold">Spotify ve YouTube tıklama karşılaştırması</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Son {comparison?.periodDays ?? 30} günde platform butonlarına gelen tıklamalar UTM kaynaklarına göre karşılaştırılır.</p>
      </div>
      {error ? <p className="rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(([label, value, source]) => (
          <div className="rounded-2xl border border-border bg-surface p-4" key={source}>
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{label}</p>
              <span className="text-xs text-muted">utm_source={source}</span>
            </div>
            <p className="mt-5 text-3xl font-semibold">{value}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted/20">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${percentage(value)}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">Toplamın %{percentage(value)}’si</p>
          </div>
        ))}
      </div>
      <p className="text-xs leading-5 text-muted">Yeni Smart Link platform butonları bu karşılaştırmaya otomatik UTM ile dahil edilir.</p>
    </section>
  );
}
