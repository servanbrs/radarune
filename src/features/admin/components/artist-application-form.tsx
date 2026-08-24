"use client";
/* eslint-disable @next/next/no-img-element -- Provider artist images are arbitrary remote URLs. */

import Link from "next/link";
import { BadgeCheck, LoaderCircle, Search } from "lucide-react";
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
  const [artistMode, setArtistMode] = useState<"EXISTING" | "NEW">("NEW");
  const [verificationComplete, setVerificationComplete] = useState(false);

  useEffect(() => {
    if (selectedArtist || stageName.trim().length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      setVerificationComplete(false);
      try {
        const endpoint = provider === "spotify" ? "/api/integrations/spotify/artists" : "/api/integrations/artists/search";
        const response = await fetch(`${endpoint}?query=${encodeURIComponent(stageName.trim())}${provider === "spotify" ? "" : `&provider=${provider}`}`, { cache: "no-store", signal: controller.signal });
        const payload = (await response.json()) as { items?: ExternalArtist[]; error?: string; code?: string };
        if (!response.ok) throw new Error(payload.error ?? "Spotify sanatçıları aranamadı.");
        setResults(payload.items ?? []);
      } catch (error) {
        if (!controller.signal.aborted) setSearchError(error instanceof Error ? error.message : "Spotify sanatçıları aranamadı.");
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
          setVerificationComplete(true);
        }
      }
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [selectedArtist, stageName, provider]);

  async function submit(formData: FormData) {
    setPending(true);
    setMessage(null);
    try {
      const values = Object.fromEntries(formData.entries());
      // The hidden fields contain a selected provider profile. Manual
      // Deezer/iTunes URLs are only a fallback and must not overwrite a
      // selected result with an empty visible input.
      if (!values.deezerArtistUrl && values.deezerArtistUrlManual) {
        values.deezerArtistUrl = values.deezerArtistUrlManual;
      }
      if (!values.itunesArtistUrl && values.itunesArtistUrlManual) {
        values.itunesArtistUrl = values.itunesArtistUrlManual;
      }
      delete values.deezerArtistUrlManual;
      delete values.itunesArtistUrlManual;

      const response = await fetch("/api/artist-applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(values) });
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
    setArtistMode("EXISTING");
    setVerificationComplete(true);
  }

  return (
    <form action={submit} className="mt-8 grid gap-4">
      <div className="grid gap-2 text-sm font-medium">
        <label htmlFor="artist-stage-name">Sanatçı adı</label>
        <div className="grid gap-2 rounded-2xl border border-line bg-surface p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Sanatçı kaynağı
          </p>
          <div className="flex flex-wrap gap-2" aria-label="Sanatçı kaynağı">
            <button
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${artistMode === "EXISTING" ? "border-accent bg-accent/10 text-accent" : "border-line text-muted"}`}
              onClick={() => {
                setArtistMode("EXISTING");
                setSelectedArtist(null);
                setVerificationComplete(false);
              }}
              type="button"
            >
              <Search className="size-3.5" /> Mevcut profili ara
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${artistMode === "NEW" ? "border-accent bg-accent/10 text-accent" : "border-line text-muted"}`}
              onClick={() => {
                setArtistMode("NEW");
                setSelectedArtist(null);
                setResults([]);
                setVerificationComplete(false);
              }}
              type="button"
            >
              Yeni sanatçı oluştur
            </button>
          </div>
          <p className="text-xs font-normal text-muted">
            Kayıtlı bir sanatçı seçerseniz kanal o profile bağlanır. Yeni sanatçı
            seçeneğinde yasal kimlik ve doğrulama kanıtı zorunludur.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Sanatçı platformu">
          {[ ["spotify", "Spotify"], ["deezer", "Deezer"], ["itunes", "iTunes"] ].map(([value, label]) => <button className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${provider === value ? "border-accent bg-accent/10 text-accent" : "border-line text-muted"}`} key={value} onClick={() => { setProvider(value as typeof provider); setSelectedArtist(null); setResults([]); setVerificationComplete(false); }} type="button">{label}</button>)}
        </div>
        <input id="artist-stage-name" className="rounded-xl border border-line bg-white px-4 py-3" name="stageName" onChange={(event) => { setStageName(event.target.value); setSelectedArtist(null); setResults([]); setVerificationComplete(false); }} placeholder="Sanatçı adını yazın" required value={stageName} />
        <p className="text-xs font-normal text-muted">Spotify’da kayıtlıysa yazarken eşleşen profili seçin. Bulunmuyorsa sıfırdan oluşturabilirsiniz.</p>
        <input name="artistMode" type="hidden" value={artistMode} />
        {searching ? <div aria-live="polite" className="flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 p-3 text-xs font-semibold text-accent"><LoaderCircle className="size-4 animate-spin" /> Platform profilleri kontrol ediliyor<span className="animate-pulse">…</span></div> : null}
        {results.length ? <div className="grid gap-2 rounded-2xl border border-line bg-surface p-2">{results.map((artist) => <button className="flex items-center gap-3 rounded-xl p-2 text-left hover:bg-surface-strong" key={`${artist.provider}-${artist.id}`} onClick={() => chooseArtist(artist)} type="button">{artist.imageUrl ? <img alt="" className="size-10 rounded-full object-cover" src={artist.imageUrl} /> : <span className="grid size-10 place-items-center rounded-full bg-accent/10 text-accent">♪</span>}<span className="min-w-0 flex-1"><span className="block truncate font-semibold">{artist.name}</span><span className="block text-xs text-muted">{artist.provider}</span></span><BadgeCheck className="size-4 shrink-0 text-accent" /></button>)}</div> : null}
        {searchError ? <p className="rounded-xl border border-amber-300/40 bg-amber-50 p-3 text-xs font-normal text-amber-900">{searchError} Spotify bağlantısı yoksa sanatçı adını manuel girerek devam edebilirsiniz.</p> : null}
        {selectedArtist ? <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs"><span><strong>{selectedArtist.name}</strong> {selectedArtist.provider} profili seçildi ve mevcut kanala bağlanacak.</span><button className="font-semibold text-accent" onClick={() => { setSelectedArtist(null); setArtistMode("NEW"); setVerificationComplete(false); }} type="button">Değiştir</button></div> : stageName.trim().length >= 2 && verificationComplete && !searching && !results.length && !searchError ? <div aria-live="polite" className="grid gap-2 rounded-xl border border-dashed border-accent/40 bg-accent/5 p-3 text-xs"><span className="font-semibold text-accent">Bu ad için doğrulanabilir bir platform profili bulunamadı.</span><span>Yeni sanatçı olarak devam edebilirsiniz. Başvuruda yasal adınızı ve gerçek sanatçı/yetkili olduğunuzu doğrulayan belge veya resmi profil bağlantısını paylaşın.</span><Link className="font-semibold text-accent" href="/dashboard/support?subject=Sanat%C3%A7%C4%B1%20profili%20ekleme">Destek ekibine yaz</Link></div> : null}
        <input name="spotifyArtistUrl" type="hidden" value={selectedArtist?.provider === "SPOTIFY" ? selectedArtist.url : ""} />
        <input name="deezerArtistUrl" type="hidden" value={selectedArtist?.provider === "DEEZER" ? selectedArtist.url : ""} />
        <input name="itunesArtistUrl" type="hidden" value={selectedArtist?.provider === "ITUNES" ? selectedArtist.url : ""} />
      </div>
      <label className="grid gap-2 text-sm font-medium">Yasal ad<input className="rounded-xl border border-line bg-white px-4 py-3" name="legalName" required /></label>
      <label className="grid gap-2 text-sm font-medium">Biyografi<textarea className="min-h-32 rounded-xl border border-line bg-white px-4 py-3" name="biography" required /></label>
      {artistMode === "NEW" ? <label className="flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent/5 p-4 text-sm"><input className="mt-0.5 size-4 accent-accent" name="identityConfirmation" type="checkbox" value="true" required /><span><strong>Gerçek sanatçı / yetkili onayı</strong><span className="mt-1 block text-xs font-normal text-muted">Bu başvurunun sanatçıya veya yetkili temsilcisine ait olduğunu, verdiğim bilgilerin doğru olduğunu onaylıyorum.</span></span></label> : <input name="identityConfirmation" type="hidden" value="false" />}
      <label className="grid gap-2 text-sm font-medium">Apple Music linki<input className="rounded-xl border border-line bg-white px-4 py-3" name="appleMusicArtistUrl" type="url" /></label>
      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4">
        <p className="text-sm font-semibold">Diğer platform profilleri</p>
        <p className="text-xs font-normal text-muted">Spotify aramasında bulamadıysanız Deezer veya iTunes profil bağlantısını ekleyebilirsiniz. Yeni profil için alanları boş bırakıp başvuruyu gönderebilirsiniz.</p>
        <label className="grid gap-2 text-sm font-medium">Deezer sanatçı linki<input className="rounded-xl border border-line bg-white px-4 py-3" name="deezerArtistUrlManual" placeholder="https://www.deezer.com/artist/..." type="url" /></label>
        <label className="grid gap-2 text-sm font-medium">iTunes / Apple Music sanatçı linki<input className="rounded-xl border border-line bg-white px-4 py-3" name="itunesArtistUrlManual" placeholder="https://music.apple.com/..." type="url" /></label>
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
