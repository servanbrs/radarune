"use client";

import { useState } from "react";

type Platform = {
  platform: string;
  url: string;
  buttonText: string;
};

type SmartLinkFormProps = {
  artists: Array<{ id: string; name: string }>;
  initial?: {
    id: string;
    artistId: string;
    title: string;
    slug: string;
    description: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    coverImageUrl: string | null;
    active: boolean;
    platforms: Array<{ platform: string; url: string; buttonText: string | null }>;
  };
  redirectTo?: string;
};

const platformOptions = ["SPOTIFY", "APPLE_MUSIC", "YOUTUBE_MUSIC", "YOUTUBE", "DEEZER", "AMAZON_MUSIC", "TIDAL", "SOUNDCLOUD", "TIKTOK", "INSTAGRAM", "CUSTOM"];

export function SmartLinkForm({ artists, initial, redirectTo = "/smart-links" }: SmartLinkFormProps) {
  const [artistId, setArtistId] = useState(initial?.artistId ?? artists[0]?.id ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? "");
  const [active, setActive] = useState(initial?.active ?? false);
  const [platforms, setPlatforms] = useState<Platform[]>(initial?.platforms.map((item) => ({ platform: item.platform, url: item.url, buttonText: item.buttonText ?? "Dinle" })) ?? [{ platform: "SPOTIFY", url: "", buttonText: "Spotify’da dinle" }]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function updatePlatform(index: number, field: keyof Platform, value: string) {
    setPlatforms((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  async function suggestSeo() {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/growth/smart-links/seo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, description, artist: artists.find((artist) => artist.id === artistId)?.name, platforms: platforms.map((item) => item.platform).join(", ") }) });
      const data = await response.json() as { title?: string; description?: string; note?: string };
      if (!response.ok) throw new Error(data.note ?? "SEO önerisi alınamadı.");
      setSeoTitle(data.title ?? ""); setSeoDescription(data.description ?? ""); setMessage(data.note ?? "SEO alanları AI önerisiyle dolduruldu.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "SEO önerisi alınamadı."); }
    finally { setBusy(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/growth/smart-links${initial ? `?id=${encodeURIComponent(initial.id)}` : ""}`, { method: initial ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ artistId, title, slug, description: description || undefined, seoTitle: seoTitle || undefined, seoDescription: seoDescription || undefined, coverImageUrl: coverImageUrl || undefined, active, platforms: platforms.filter((item) => item.url.trim()).map((item, index) => ({ ...item, sortOrder: index, active: true })) }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Smart Link kaydedilemedi.");
      window.location.assign(redirectTo);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Smart Link kaydedilemedi."); setBusy(false); }
  }

  async function remove() {
    if (!initial || !window.confirm("Bu Smart Link silinsin mi? Bu işlem geri alınamaz.")) return;
    setBusy(true);
    const response = await fetch(`/api/growth/smart-links?id=${encodeURIComponent(initial.id)}`, { method: "DELETE" });
    if (response.ok) window.location.assign(redirectTo); else { setMessage("Smart Link silinemedi."); setBusy(false); }
  }

  return <form className="grid gap-5" onSubmit={submit}>
    <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2">
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Sanatçı<select className="h-11 rounded-xl border border-line bg-background px-3 font-normal" onChange={(event) => setArtistId(event.target.value)} required value={artistId}>{artists.map((artist) => <option key={artist.id} value={artist.id}>{artist.name}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-semibold">Başlık<input className="h-11 rounded-xl border border-line bg-background px-3 font-normal" maxLength={160} onChange={(event) => setTitle(event.target.value)} required value={title} /></label>
      <label className="grid gap-2 text-sm font-semibold">Slug<input className="h-11 rounded-xl border border-line bg-background px-3 font-normal" maxLength={80} onChange={(event) => setSlug(event.target.value)} placeholder="sanatci-yeni-sarki" required value={slug} /></label>
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Açıklama<textarea className="min-h-24 rounded-xl border border-line bg-background px-3 py-2 font-normal" maxLength={2000} onChange={(event) => setDescription(event.target.value)} value={description} /></label>
      <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Kapak görseli URL <span className="text-xs font-normal text-muted">HTTPS</span><input className="h-11 rounded-xl border border-line bg-background px-3 font-normal" onChange={(event) => setCoverImageUrl(event.target.value)} placeholder="https://..." type="url" value={coverImageUrl} /></label>
    </section>

    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">Müzik ve sosyal bağlantılar</h2><p className="mt-1 text-sm text-muted">Linktree mantığında sınırsız platform bloğu ekleyin.</p></div><button className="rounded-xl border border-line px-3 py-2 text-xs font-bold text-accent" onClick={() => setPlatforms((current) => [...current, { platform: "CUSTOM", url: "", buttonText: "Bağlantıyı aç" }])} type="button">+ Bağlantı ekle</button></div>
      <div className="mt-4 grid gap-3">{platforms.map((item, index) => <div className="grid gap-2 rounded-2xl border border-line bg-background p-3 md:grid-cols-[180px_1fr_180px_auto]" key={`${item.platform}-${index}`}><select className="h-10 rounded-xl border border-line bg-surface px-2 text-sm" onChange={(event) => updatePlatform(index, "platform", event.target.value)} value={item.platform}>{platformOptions.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select><input className="h-10 rounded-xl border border-line bg-surface px-3 text-sm" onChange={(event) => updatePlatform(index, "url", event.target.value)} placeholder="https://open.spotify.com/..." required value={item.url} /><input className="h-10 rounded-xl border border-line bg-surface px-3 text-sm" onChange={(event) => updatePlatform(index, "buttonText", event.target.value)} placeholder="Buton metni" value={item.buttonText} /><button aria-label="Bağlantıyı kaldır" className="rounded-xl px-3 text-sm text-danger hover:bg-danger/10" onClick={() => setPlatforms((current) => current.filter((_, itemIndex) => itemIndex !== index))} type="button">Kaldır</button></div>)}</div>
    </section>

    <section className="rounded-2xl border border-emerald-700/15 bg-emerald-700/[0.05] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">SEO ayarları</h2><p className="mt-1 text-sm text-muted">Aktif Smart Link otomatik sitemap’e girer ve metadata üretir.</p></div><button className="rounded-xl bg-foreground px-3 py-2 text-xs font-bold text-background disabled:opacity-50" disabled={busy || !title} onClick={() => void suggestSeo()} type="button">{busy ? "Hazırlanıyor…" : "AI ile SEO oluştur"}</button></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">SEO başlığı <span className="text-xs font-normal text-muted">{seoTitle.length}/60</span><input className="h-11 rounded-xl border border-line bg-background px-3 font-normal" maxLength={60} onChange={(event) => setSeoTitle(event.target.value)} value={seoTitle} /></label><label className="grid gap-2 text-sm font-semibold">SEO açıklaması <span className="text-xs font-normal text-muted">{seoDescription.length}/160</span><textarea className="min-h-11 rounded-xl border border-line bg-background px-3 py-2 font-normal" maxLength={160} onChange={(event) => setSeoDescription(event.target.value)} value={seoDescription} /></label></div></section>

    <div className="flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-3 text-sm font-semibold"><input checked={active} className="size-4 accent-[var(--accent)]" onChange={(event) => setActive(event.target.checked)} type="checkbox" /> Public sayfayı aktifleştir <span className="text-xs font-normal text-muted">/l/{slug || "slug"}</span></label><div className="flex gap-2"><button className="rounded-xl border border-danger/30 px-4 py-2.5 text-sm font-bold text-danger" disabled={busy || !initial} onClick={() => void remove()} type="button">Sil</button><button className="rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground disabled:opacity-50" disabled={busy} type="submit">{busy ? "Kaydediliyor…" : initial ? "Değişiklikleri kaydet" : "Smart Link oluştur"}</button></div></div>
    {message ? <p className="text-sm text-muted" role="status">{message}</p> : null}
  </form>;
}
