"use client";

import { useState } from "react";

type ReviewItem = {
  id: string;
  provider: string;
  title: string | null;
  artistName: string | null;
  status: string;
  matchConfidence: string;
  source: { name: string };
  externalMediaSource: { externalUrl: string; embedUrl: string | null; playable: boolean; embeddable: boolean } | null;
};

export function ImportReviewTable({ initialItems }: { initialItems: ReviewItem[] }) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState<string | null>(null);
  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    const response = await fetch(`/api/admin/import-review/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision, reason: decision === "APPROVED" ? "Moderasyon onayı" : "İçerik moderasyon kriterlerini karşılamıyor." }) });
    if (!response.ok) { setMessage("Moderasyon işlemi tamamlanamadı."); return; }
    setItems((current) => current.filter((item) => item.id !== id));
    setMessage(decision === "APPROVED" ? "İçerik onaylandı ve Keşfet'e açıldı." : "İçerik reddedildi.");
  }
  return <div className="grid gap-4">{message ? <p className="rounded-xl border border-line bg-surface-strong p-3 text-sm" role="status">{message}</p> : null}{items.length === 0 ? <div className="panel p-10 text-center text-sm text-muted">İnceleme kuyruğu boş.</div> : items.map((item) => <article className="panel grid gap-5 p-5 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-center" key={item.id}>{item.externalMediaSource?.embedUrl && item.externalMediaSource.embeddable ? <iframe className={item.provider === "SPOTIFY" ? "h-[152px] w-full rounded-xl" : "aspect-video w-full rounded-xl"} src={item.externalMediaSource.embedUrl} title={item.title ?? "Import önizleme"} allow="autoplay; encrypted-media" /> : <div className="flex aspect-video items-center justify-center rounded-xl bg-surface-strong text-xs text-muted">Önizleme kullanılamıyor</div>}<div><h3 className="font-semibold text-foreground">{item.title ?? "Başlık yok"}</h3><p className="mt-1 text-sm text-muted">{item.artistName ?? "Sanatçı bilinmiyor"} · {item.provider}</p><p className="mt-2 text-xs text-muted">Kaynak: {item.source.name} · Eşleşme: {item.matchConfidence}</p><a className="mt-3 inline-block text-xs font-semibold text-accent" href={item.externalMediaSource?.externalUrl} rel="noreferrer" target="_blank">Kaynağı aç →</a></div><div className="flex gap-2 md:flex-col"><button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground" onClick={() => void decide(item.id, "APPROVED")} type="button">Onayla / Keşfet'e al</button><button className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-foreground" onClick={() => void decide(item.id, "REJECTED")} type="button">Reddet</button></div></article>)}</div>;
}
