"use client";

import { Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type ArtistMedia = {
  id: string;
  provider: string;
  title: string;
  externalUrl: string;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  trackId: string | null;
};

export function ArtistMediaPlayer({ items }: { items: ArtistMedia[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const active = items.find((item) => item.id === activeId) ?? null;
  const isLocal = Boolean(active?.trackId);

  useEffect(() => {
    if (!audioRef.current || !isLocal) return;
    if (playing) void audioRef.current.play().catch(() => setPlaying(false));
    else audioRef.current.pause();
  }, [isLocal, playing]);

  if (!items.length) return null;

  function select(item: ArtistMedia) {
    if (activeId !== item.id) {
      setActiveId(item.id);
      setPlaying(true);
    } else {
      setPlaying((value) => !value);
    }
  }

  return (
    <section aria-label="Sanatçı yayın oynatıcı" className="mt-8">
      <div className="mb-4"><h2 className="text-xl font-semibold">Radarune içinde dinle</h2><p className="mt-1 text-sm text-muted">YouTube ve Spotify içerikleri sanatçı sayfasından ayrılmadan oynatılır.</p></div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="grid gap-2">{items.map((item) => <button className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${activeId === item.id ? "border-accent bg-accent/10" : "border-line bg-surface-strong hover:border-accent/50"}`} key={item.id} onClick={() => select(item)} type="button">{item.thumbnailUrl ? <span className="size-14 shrink-0 rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${item.thumbnailUrl})` }} /> : <span className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Volume2 className="size-5" /></span>}<span className="min-w-0 flex-1"><span className="block truncate font-semibold">{item.title}</span><span className="mt-1 block text-xs text-muted">{item.provider === "YOUTUBE" ? "YouTube" : "Spotify"}{item.trackId ? " · Radarune audio" : " · site içi embed"}</span></span>{activeId === item.id && playing ? <Pause className="size-4 shrink-0 text-accent" /> : <Play className="size-4 shrink-0 text-accent" />}</button>)}</div>
        <div className="relative min-h-56 overflow-hidden rounded-3xl border border-line bg-[#101817]">{active ? <>{active.embedUrl && !isLocal ? <iframe allow="autoplay; encrypted-media; picture-in-picture" className="absolute inset-0 size-full" src={`${active.embedUrl}${active.embedUrl.includes("?") ? "&" : "?"}autoplay=${playing ? "1" : "0"}`} title={active.title} /> : active.thumbnailUrl ? <div className="absolute inset-0 bg-cover bg-center opacity-70" style={{ backgroundImage: `url(${active.thumbnailUrl})` }} /> : null}{isLocal && active.trackId ? <audio className="absolute inset-x-4 bottom-4 z-10 w-[calc(100%-2rem)]" controls onEnded={() => setPlaying(false)} preload="none" ref={audioRef} src={`/api/public/v1/tracks/${active.trackId}/stream`} /> : null}<div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between"><span className="rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">{playing ? "Oynatılıyor" : "Hazır"}</span><button aria-label={playing ? "Durdur" : "Oynat"} className="flex size-10 items-center justify-center rounded-full bg-white text-black" onClick={() => setPlaying((value) => !value)} type="button">{playing ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}</button></div><div className="absolute inset-x-4 bottom-16 z-10"><p className="truncate text-lg font-bold text-white drop-shadow">{active.title}</p><p className="mt-1 text-xs text-white/65">{active.provider === "YOUTUBE" ? "YouTube" : "Spotify"} · Radarune player</p></div></> : <div className="flex h-full min-h-56 items-center justify-center px-6 text-center text-sm text-white/50">Bir yayın seç; oynatma burada başlayacak.</div>}</div>
      </div>
    </section>
  );
}
