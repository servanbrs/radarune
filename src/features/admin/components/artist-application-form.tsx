"use client";
/* eslint-disable @next/next/no-img-element -- Provider artist images are arbitrary remote URLs. */

import Link from "next/link";
import { useEffect, useState } from "react";

type ExternalArtist = { id: string; name: string; url: string; imageUrl: string | null; provider: "SPOTIFY" | "DEEZER" | "ITUNES"; followers?: number; popularity?: number };

export function ArtistApplicationForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [stageName, setStageName] = useState("");
  const [provider, setProvider] = useState<"spotify" | "deezer" | "itunes">("spotify");
  const [selectedArtist, setSelectedArtist] = useState<ExternalArtist | null>(null);
  const [results, setResults] = useState<ExternalArtist[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedArtist || stageName.trim().length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const endpoint = provider === "spotify" ? "/api/integrations/spotify/artists" : "/api/integrations/artists/search";
        const response = await fetch(`${endpoint}?query=${encodeURIComponent(stageName.trim())}${provider === "spotify" ? "" : `&provider=${provider}`}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { items?: ExternalArtist[]; error?: string; code?: string };
        if (!response.ok) throw new Error(payload.error ?? "Spotify sanatçıları aranamadı.");
        setResults(payload.items ?? []);
      } catch (error) {
        if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : "Spotify sanatçıları aranamadı.");
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [selectedArtist, stageName, provider]);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch("/api/artist-applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData.entries())) });
      const payload = (await response.json()) as { error?: string; message?: string; success?: boolean };
      if (!response.ok) throw new Error(payload.error ?? payload.message ?? "Başvuru gönderilemedi.");
      setMessage("Başvurunuz alındı. Admin incelemesi tamamlandığında bildirim alacaksınız.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Başvuru gönderilemedi.");
    } finally {
      setPending(false);
    }
  }

  function chooseArtist(artist: ExternalArtist) {
    setStageName(artist.name);
    setSelectedArtist(artist);
    setResults([]);
  }

  return (
    <form action={submit} className="mt-8 grid gap-4">
      <div className="grid gap-2 text-sm font-medium">
        <label htmlFor="artist-stage-name">Sanatçı adı</label>
        <div className="flex flex-wrap gap-2" aria-label="Sanatçı platformu">
          {[ ["spotify", "Spotify"], ["deezer", "Deezer"], ["itunes", "iTunes"] ].map(([value, label]) => <button className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${provider === value ? "border-accent bg-accent/10 text-accent" : "border-line text-muted"}`} key={value} onClick={() => { setProvider(value as typeof provider); setSelectedArtist(null); }} type="button">{label}</button>)}
        </div>
        <input id="artist-stage-name" className="rounded-xl border border-line bg-white px-4 py-3" name="stageName" onChange={(event) => { setStageName(event.target.value); setSelectedArtist(null); }} placeholder="Sanatçı adını yazın" required value={stageName} />
        <p className="text-xs font-normal text-muted">Spotify’da kayıtlıysa yazarken eşleşen profili seçin. Bulunmuyorsa sıfırdan oluşturabilirsiniz.</p>
        {searching ? <p className="text-xs font-normal text-muted">Spotify sanatçıları aranıyor…</p> : null}
        {results.length ? <div className="grid gap-2 rounded-2xl border border-line bg-surface p-2">{results.map((artist) => <button className="flex items-center gap-3 rounded-xl p-2 text-left hover:bg-surface-strong" key={`${artist.provider}-${artist.id}`} onClick={() => chooseArtist(artist)} type="button">{artist.imageUrl ? <img alt="" className="size-10 rounded-full object-cover" src={artist.imageUrl} /> : <span className="grid size-10 place-items-center rounded-full bg-accent/10 text-accent">♪</span>}<span className="min-w-0 flex-1"><span className="block truncate font-semibold">{artist.name}</span><span className="block text-xs text-muted">{artist.provider}</span></span></button>)}</div> : null}
        {searchError ? <p className="rounded-xl border border-amber-300/40 bg-amber-50 p-3 text-xs font-normal text-amber-900">{searchError} Spotify bağlantısı yoksa sanatçı adını manuel girerek devam edebilirsiniz.</p> : null}
        {selectedArtist ? <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs"><span><strong>{selectedArtist.name}</strong> {selectedArtist.provider} profili seçildi.</span><button className="font-semibold text-accent" onClick={() => setSelectedArtist(null)} type="button">Değiştir</button></div> : stageName.trim().length >= 2 && !searching && !results.length && !searchError ? <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-line p-3 text-xs"><span>{provider} üzerinde eşleşme yok. Yeni sanatçı olarak devam edebilirsiniz.</span><Link className="font-semibold text-accent" href="/dashboard/support?subject=Sanat%C3%A7%C4%B1%20profili%20ekleme">Destek ekibine yaz</Link></div> : null}
        <input name="spotifyArtistUrl" type="hidden" value={selectedArtist?.provider === "SPOTIFY" ? selectedArtist.url : ""} />
        <input name="deezerArtistUrl" type="hidden" value={selectedArtist?.provider === "DEEZER" ? selectedArtist.url : ""} />
        <input name="itunesArtistUrl" type="hidden" value={selectedArtist?.provider === "ITUNES" ? selectedArtist.url : ""} />
      </div>
      <label className="grid gap-2 text-sm font-medium">Yasal ad<input className="rounded-xl border border-line bg-white px-4 py-3" name="legalName" required /></label>
      <label className="grid gap-2 text-sm font-medium">Biyografi<textarea className="min-h-32 rounded-xl border border-line bg-white px-4 py-3" name="biography" required /></label>
      <label className="grid gap-2 text-sm font-medium">Apple Music linki<input className="rounded-xl border border-line bg-white px-4 py-3" name="appleMusicArtistUrl" type="url" /></label>
      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-semibold">Diğer platform profilleri</p>
        <p className="text-xs font-normal text-muted">Spotify aramasında bulamadıysanız Deezer veya iTunes profil bağlantısını ekleyebilirsiniz. Yeni profil için alanları boş bırakıp başvuruyu gönderebilirsiniz.</p>
        <label className="grid gap-2 text-sm font-medium">Deezer sanatçı linki<input className="rounded-xl border border-line bg-white px-4 py-3" name="deezerArtistUrl" placeholder="https://www.deezer.com/artist/..." type="url" /></label>
        <label className="grid gap-2 text-sm font-medium">iTunes / Apple Music sanatçı linki<input className="rounded-xl border border-line bg-white px-4 py-3" name="itunesArtistUrl" placeholder="https://music.apple.com/..." type="url" /></label>
      </div>
      <label className="grid gap-2 text-sm font-medium">YouTube kanalı<input className="rounded-xl border border-line bg-white px-4 py-3" name="youtubeChannelUrl" type="url" /></label>
      <label className="grid gap-2 text-sm font-medium">
        Doğrulama kanıtı bağlantısı
        <input className="rounded-xl border border-line bg-white px-4 py-3" name="documentReference" placeholder="https://resmi-siteniz.com veya belge bağlantısı" type="url" />
        <span className="text-xs font-normal text-muted">En az bir Spotify, Deezer, Apple Music, YouTube veya resmi site/belge bağlantısı ekleyin. İsim beyanı tek başına sanatçı doğrulaması sayılmaz.</span>
      </label>
      <button className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? "Gönderiliyor…" : "Sanatçı başvurusu gönder"}</button>
      {message ? <p className="rounded-xl border border-line bg-surface p-3 text-sm">{message}</p> : null}
    </form>
  );
}
