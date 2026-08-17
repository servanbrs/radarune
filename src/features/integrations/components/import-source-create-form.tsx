"use client";

import { useState } from "react";

export function ImportSourceCreateForm() {
  const [type, setType] = useState("SPOTIFY_PLAYLIST");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("müzik");
  const [limit, setLimit] = useState("100");
  const [autoPublish, setAutoPublish] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createAndRun() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/import-sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, name: name.trim() || `${type} import`, url: url.trim(), query: query.trim(), maxItems: Number(limit), active: true, autoPublish, requiresReview: !autoPublish, scheduleMode: "CRON", frequencyMinutes: 60 }),
      });
      const created = await response.json().catch(() => null);
      if (!response.ok || !created?.id) {
        setMessage(created?.error ?? "Import kaynağı oluşturulamadı.");
        return;
      }
      const runResponse = await fetch(`/api/admin/import-sources/${created.id}/run`, { method: "POST" });
      const result = await runResponse.json().catch(() => null);
      setMessage(runResponse.ok && result?.success
        ? `${result.importedCount ?? 0} yeni içerik alındı, ${result.duplicateCount ?? 0} tekrar kayıt atlandı.`
        : result?.error ?? result?.message ?? "Import çalıştırılamadı.");
    } catch {
      setMessage("Import sunucusuna ulaşılamadı.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel p-6">
      <h2 className="text-lg font-semibold">Toplu müzik importu</h2>
      <p className="mt-2 text-sm text-muted">YouTube kanalını, playlist/Mix listesini veya Spotify kataloğunu toplu çekin. Her içerik varsayılan olarak moderasyon kuyruğuna alınır; onaylanmadan Keşfet&apos;te yayınlanmaz.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-[220px_1fr_1fr_140px_auto]">
        <select className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" onChange={(event) => setType(event.target.value)} value={type}>
          <option value="SPOTIFY_PLAYLIST">Spotify playlist</option>
          <option value="SPOTIFY_ARTIST">Spotify sanatçı</option>
          <option value="SPOTIFY_ALBUM">Spotify albüm</option>
          <option value="YOUTUBE_CHANNEL">YouTube kanal</option>
          <option value="YOUTUBE_PLAYLIST">YouTube playlist / Mix</option>
          <option value="YOUTUBE_SEARCH">YouTube güncel müzik araması</option>
          <option value="SPOTIFY_SEARCH">Spotify müzik araması</option>
        </select>
        <input className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" onChange={(event) => setName(event.target.value)} placeholder="Kaynak adı" value={name} />
        {type.endsWith("SEARCH") ? <input className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" onChange={(event) => setQuery(event.target.value)} placeholder="Arama terimi: yeni türkçe müzik" value={query} /> : <input className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" onChange={(event) => setUrl(event.target.value)} placeholder={type === "YOUTUBE_CHANNEL" ? "https://youtube.com/@kanal veya /channel/UC…" : type.startsWith("YOUTUBE") ? "https://youtube.com/playlist?list=… (Mix dahil)" : "https://open.spotify.com/..."} type="url" value={url} />}
        <select aria-label="Import limiti" className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" defaultValue="100" onChange={(event) => setLimit(event.target.value)}><option value="100">100 içerik</option><option value="200">200 içerik</option></select>
        <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50" disabled={pending || (!name.trim() && !type.endsWith("SEARCH")) || (type.endsWith("SEARCH") ? !query.trim() : !url.trim())} onClick={() => void createAndRun()} type="button">{pending ? "Alınıyor…" : "Çek ve incelemeye al"}</button>
      </div>
      <label className="mt-4 flex items-center gap-2 text-sm text-muted"><input checked={autoPublish} onChange={(event) => setAutoPublish(event.target.checked)} type="checkbox" /> Güvenilir kaynaklarda otomatik kabul et (işaretlenmezse moderasyon kuyruğuna gider)</label>
      {message ? <p className="mt-4 rounded-xl border border-line p-3 text-sm" role="status">{message}</p> : null}
    </section>
  );
}
