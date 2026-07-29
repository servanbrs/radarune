"use client";

import { useState } from "react";

export function ImportSourceCreateForm() {
  const [type, setType] = useState("SPOTIFY_PLAYLIST");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function createAndRun() {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/import-sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, name: name.trim(), url: url.trim(), active: true, autoPublish: false, requiresReview: true, scheduleMode: "CRON", frequencyMinutes: 60 }),
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
      <p className="mt-2 text-sm text-muted">Spotify playlist/artist/album veya YouTube kanal/playlist URL’si ekleyin. İçerikler önce inceleme kuyruğuna alınır.</p>
      <div className="mt-5 grid gap-3 md:grid-cols-[220px_1fr_1fr_auto]">
        <select className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" onChange={(event) => setType(event.target.value)} value={type}>
          <option value="SPOTIFY_PLAYLIST">Spotify playlist</option>
          <option value="SPOTIFY_ARTIST">Spotify sanatçı</option>
          <option value="SPOTIFY_ALBUM">Spotify albüm</option>
          <option value="YOUTUBE_CHANNEL">YouTube kanal</option>
          <option value="YOUTUBE_PLAYLIST">YouTube playlist</option>
        </select>
        <input className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" onChange={(event) => setName(event.target.value)} placeholder="Kaynak adı" value={name} />
        <input className="rounded-xl border border-line bg-surface-strong px-3 py-2 text-sm" onChange={(event) => setUrl(event.target.value)} placeholder="https://open.spotify.com/..." type="url" value={url} />
        <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-50" disabled={pending || !name.trim() || !url.trim()} onClick={() => void createAndRun()} type="button">{pending ? "Alınıyor…" : "Çek ve incelemeye al"}</button>
      </div>
      {message ? <p className="mt-4 rounded-xl border border-line p-3 text-sm" role="status">{message}</p> : null}
    </section>
  );
}
