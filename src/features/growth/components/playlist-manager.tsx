"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TrackOption = { id: string; title: string; releaseTitle: string; artists: string[] };
type PlaylistTrack = { id: string; trackId: string; track: { id: string; title: string }; release?: { title: string } | null };

export function PlaylistManager({ playlist, availableTracks }: { playlist: { id: string; name: string; slug: string | null; description: string | null; public: boolean; ownerUserId: string; tracks: PlaylistTrack[] }; availableTracks: TrackOption[] }) {
  const router = useRouter();
  const [name, setName] = useState(playlist.name);
  const [slug, setSlug] = useState(playlist.slug ?? "");
  const [description, setDescription] = useState(playlist.description ?? "");
  const [isPublic, setIsPublic] = useState(playlist.public);
  const [selectedTrack, setSelectedTrack] = useState(availableTracks[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sharePlaylist() {
    if (!playlist.slug) {
      setMessage("Paylaşım için önce playlisti herkese açık olarak kaydedin.");
      return;
    }
    const url = `${window.location.origin}/playlist/${playlist.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Playlist bağlantısı kopyalandı.");
    } catch {
      setMessage(url);
    }
  }

  async function save() {
    setBusy(true); setMessage(null);
    const response = await fetch(`/api/growth/playlists/${playlist.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, slug: slug || undefined, description: description || undefined, public: isPublic }) });
    const payload = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) { setMessage(payload?.error ?? "Playlist kaydedilemedi."); return; }
    setMessage("Playlist güncellendi."); router.refresh();
  }
  async function addTrack() {
    if (!selectedTrack) return;
    setBusy(true); setMessage(null);
    const response = await fetch(`/api/growth/playlists/${playlist.id}/tracks`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ trackId: selectedTrack }) });
    const payload = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) { setMessage(payload?.error ?? "Parça eklenemedi."); return; }
    setMessage("Parça playlist’e eklendi."); router.refresh();
  }
  async function removeTrack(trackId: string) {
    setBusy(true); setMessage(null);
    const response = await fetch(`/api/growth/playlists/${playlist.id}/tracks`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ trackId }) });
    setBusy(false);
    if (!response.ok) { setMessage("Parça kaldırılamadı."); return; }
    setMessage("Parça kaldırıldı."); router.refresh();
  }
  async function removePlaylist() {
    if (!window.confirm("Bu playlist silinsin mi?")) return;
    setBusy(true);
    const response = await fetch(`/api/growth/playlists/${playlist.id}`, { method: "DELETE" });
    if (response.ok) router.replace("/playlists"); else { setBusy(false); setMessage("Playlist silinemedi."); }
  }

  return <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
    <section className="panel p-5 md:p-7">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Playlist ayarları</p>
      <div className="mt-5 grid gap-4">
        <label className="grid gap-2 text-sm font-semibold">Playlist adı<input className="h-11 rounded-xl border border-line bg-background px-3 font-normal" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="grid gap-2 text-sm font-semibold">Kısa adres<input className="h-11 rounded-xl border border-line bg-background px-3 font-normal" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="gece-surusleri" /></label>
        <label className="grid gap-2 text-sm font-semibold">Açıklama<textarea className="min-h-24 rounded-xl border border-line bg-background p-3 font-normal" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <label className="flex items-center gap-3 rounded-xl border border-line bg-background/60 p-3 text-sm"><input checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} type="checkbox" /> Herkese açık playlist</label>
        <div className="flex flex-wrap gap-2"><button className="rounded-xl bg-accent px-4 py-3 text-sm font-bold text-accent-foreground disabled:opacity-50" disabled={busy || !name.trim()} onClick={() => void save()} type="button">{busy ? "Kaydediliyor…" : "Değişiklikleri kaydet"}</button><button className="rounded-xl border border-line px-4 py-3 text-sm font-bold" disabled={busy} onClick={() => void sharePlaylist()} type="button">Bağlantıyı paylaş</button><button className="rounded-xl border border-danger/30 px-4 py-3 text-sm font-bold text-danger" disabled={busy} onClick={() => void removePlaylist()} type="button">Playlisti sil</button></div>
        {message ? <p className="rounded-xl border border-line bg-background p-3 text-sm" role="status">{message}</p> : null}
      </div>
    </section>
    <section className="panel p-5 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Parça yönetimi</p><h2 className="mt-2 text-xl font-semibold">Yayınlanmış parçalardan ekle</h2></div><span className="rounded-full border border-line px-3 py-1 text-xs font-semibold">{playlist.tracks.length} parça</span></div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row"><select className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-background px-3 text-sm" value={selectedTrack} onChange={(e) => setSelectedTrack(e.target.value)}><option value="">Parça seçin</option>{availableTracks.map((track) => <option key={track.id} value={track.id}>{track.title} · {track.artists.join(", ")}</option>)}</select><button className="rounded-xl bg-foreground px-4 py-3 text-sm font-bold text-background disabled:opacity-50" disabled={busy || !selectedTrack} onClick={() => void addTrack()} type="button">Parça ekle</button></div>
      <div className="mt-5 grid gap-2">{playlist.tracks.map((item, index) => <div className="flex items-center gap-3 rounded-xl border border-line bg-background/50 p-3" key={item.id}><span className="grid size-8 place-items-center rounded-lg bg-accent/10 text-xs font-bold text-accent">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.track.title}</p><p className="truncate text-xs text-muted">{item.release?.title ?? "Yayın"}</p></div><button className="text-xs font-bold text-danger" disabled={busy} onClick={() => void removeTrack(item.trackId)} type="button">Kaldır</button></div>)}{playlist.tracks.length === 0 ? <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">Henüz parça eklenmedi.</p> : null}</div>
    </section>
  </div>;
}
