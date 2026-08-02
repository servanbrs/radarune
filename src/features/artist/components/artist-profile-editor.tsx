"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

type ArtistProfile = {
  id: string; name: string; slug: string; profileImageUrl: string | null; coverImageUrl: string | null;
  shortBiography: string | null; biography: string | null; country: string | null; city: string | null;
  genre: string | null; subgenre: string | null; language: string | null; foundedYear: number | null;
  spotifyProfileUrl: string | null; appleMusicProfileUrl: string | null; youtubeProfileUrl: string | null;
  instagramProfileUrl: string | null; tiktokProfileUrl: string | null; xProfileUrl: string | null;
  facebookProfileUrl: string | null; soundcloudProfileUrl: string | null; deezerProfileUrl: string | null;
  websiteUrl: string | null; seoTitle: string | null; seoDescription: string | null; ogImageUrl: string | null;
};

type Props = { artist: ArtistProfile };
type TextKey = Exclude<keyof ArtistProfile, "id" | "foundedYear">;

const socialFields: Array<[TextKey, string, string]> = [
  ["spotifyProfileUrl", "Spotify", "https://open.spotify.com/artist/..."], ["appleMusicProfileUrl", "Apple Music", "https://music.apple.com/..."],
  ["youtubeProfileUrl", "YouTube kanalı", "https://youtube.com/@..."], ["instagramProfileUrl", "Instagram", "https://instagram.com/..."],
  ["tiktokProfileUrl", "TikTok", "https://tiktok.com/@..."], ["xProfileUrl", "X", "https://x.com/..."],
  ["facebookProfileUrl", "Facebook", "https://facebook.com/..."], ["soundcloudProfileUrl", "SoundCloud", "https://soundcloud.com/..."],
];

export function ArtistProfileEditor({ artist }: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const entries = Object.keys(artist).map((key) => [key, String(artist[key as keyof ArtistProfile] ?? "")]);
    return Object.fromEntries(entries);
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(null); setError(null);
    const payload: Record<string, string | number | null> = {};
    for (const [key, value] of Object.entries(values)) {
      if (["id"].includes(key)) continue;
      if (key === "foundedYear") { payload[key] = value ? Number(value) : null; continue; }
      payload[key] = value.trim() || null;
    }
    try {
      const response = await fetch(`/api/artists/${artist.id}/profile`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result: unknown = await response.json();
      if (!response.ok) throw new Error(typeof result === "object" && result !== null && "error" in result && typeof result.error === "string" ? result.error : "Profil kaydedilemedi.");
      setMessage("Profil yayınlandı ve güncellendi.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Profil kaydedilemedi."); }
    finally { setSaving(false); }
  }

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Artist channel studio</p><h1 className="mt-2 text-3xl font-semibold">{artist.name} profilini yönet</h1><p className="mt-2 text-sm text-muted">Profiliniz yayınlandığında radarune.com, site içi arama ve Google üzerinden bulunabilir.</p></div><Link className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background" href={`/artist/${values.slug}`}>Public kanalı aç ↗</Link></div>
    <form className="grid gap-5" onSubmit={submit}>
      <section className="panel grid gap-4 p-5 md:p-7"><div><h2 className="text-lg font-semibold">Kanal görünümü</h2><p className="mt-1 text-sm text-muted">YouTube kanalındaki kapak, avatar ve kanal açıklaması gibi düşünün.</p></div><label className="grid gap-2 text-sm font-semibold">Sanatçı adı<input className="h-11 rounded-xl border border-line bg-transparent px-3 font-normal" value={values.name ?? ""} onChange={(e) => set("name", e.target.value)} required /></label><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Profil görseli URL<input className="h-11 rounded-xl border border-line bg-transparent px-3 font-normal" placeholder="https://..." type="url" value={values.profileImageUrl ?? ""} onChange={(e) => set("profileImageUrl", e.target.value)} /></label><label className="grid gap-2 text-sm font-semibold">Kanal kapak görseli URL<input className="h-11 rounded-xl border border-line bg-transparent px-3 font-normal" placeholder="https://..." type="url" value={values.coverImageUrl ?? ""} onChange={(e) => set("coverImageUrl", e.target.value)} /></label></div><label className="grid gap-2 text-sm font-semibold">Kanal URL slug<input className="h-11 rounded-xl border border-line bg-transparent px-3 font-normal" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={values.slug ?? ""} onChange={(e) => set("slug", e.target.value)} required /></label><label className="grid gap-2 text-sm font-semibold">Kısa açıklama<textarea className="min-h-24 rounded-xl border border-line bg-transparent p-3 font-normal" maxLength={500} value={values.shortBiography ?? ""} onChange={(e) => set("shortBiography", e.target.value)} /></label><label className="grid gap-2 text-sm font-semibold">Kanal hakkında<textarea className="min-h-36 rounded-xl border border-line bg-transparent p-3 font-normal" value={values.biography ?? ""} onChange={(e) => set("biography", e.target.value)} /></label></section>
      <section className="panel grid gap-4 p-5 md:p-7"><div><h2 className="text-lg font-semibold">Sanatçı bilgileri</h2><p className="mt-1 text-sm text-muted">Arama ve profil keşfi için yapılandırılmış bilgiler.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{([["country", "Ülke"], ["city", "Şehir"], ["genre", "Tür"], ["subgenre", "Alt tür"], ["language", "Dil"], ["foundedYear", "Kuruluş yılı"]] as Array<[string, string]>).map(([key, label]) => <label className="grid gap-2 text-sm font-semibold" key={key}>{label}<input className="h-11 rounded-xl border border-line bg-transparent px-3 font-normal" type={key === "foundedYear" ? "number" : "text"} value={values[key] ?? ""} onChange={(e) => set(key, e.target.value)} /></label>)}</div></section>
      <section className="panel grid gap-4 p-5 md:p-7"><div><h2 className="text-lg font-semibold">Platform ve sosyal bağlantılar</h2><p className="mt-1 text-sm text-muted">Kanal sayfanızdaki bağlantılar burada görünür.</p></div>{socialFields.map(([key, label, placeholder]) => <label className="grid gap-2 text-sm font-semibold" key={key}>{label}<input className="h-11 rounded-xl border border-line bg-transparent px-3 font-normal" placeholder={placeholder} type="url" value={values[key] ?? ""} onChange={(e) => set(key, e.target.value)} /></label>)}<label className="grid gap-2 text-sm font-semibold">Web sitesi<input className="h-11 rounded-xl border border-line bg-transparent px-3 font-normal" placeholder="https://..." type="url" value={values.websiteUrl ?? ""} onChange={(e) => set("websiteUrl", e.target.value)} /></label></section>
      <section className="panel grid gap-4 p-5 md:p-7"><div><h2 className="text-lg font-semibold">Google görünümü</h2><p className="mt-1 text-sm text-muted">Google arama sonucu ve sosyal paylaşım kartı için özel metinler.</p></div><label className="grid gap-2 text-sm font-semibold">SEO başlığı<input className="h-11 rounded-xl border border-line bg-transparent px-3 font-normal" maxLength={160} value={values.seoTitle ?? ""} onChange={(e) => set("seoTitle", e.target.value)} /></label><label className="grid gap-2 text-sm font-semibold">SEO açıklaması<textarea className="min-h-24 rounded-xl border border-line bg-transparent p-3 font-normal" maxLength={320} value={values.seoDescription ?? ""} onChange={(e) => set("seoDescription", e.target.value)} /></label><label className="grid gap-2 text-sm font-semibold">Paylaşım görseli URL<input className="h-11 rounded-xl border border-line bg-transparent px-3 font-normal" type="url" value={values.ogImageUrl ?? ""} onChange={(e) => set("ogImageUrl", e.target.value)} /></label></section>
      {error ? <p className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}{message ? <p className="rounded-xl border border-accent/30 bg-accent/10 p-3 text-sm text-accent">{message}</p> : null}<button className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50" disabled={saving} type="submit">{saving ? "Yayınlanıyor…" : "Profili yayınla ve kaydet"}</button>
    </form>
  </main>;
}
