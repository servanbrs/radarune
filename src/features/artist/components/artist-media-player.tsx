"use client";

import { ExternalLink, Play, Volume2 } from "lucide-react";
import { useState } from "react";
import { PublicTrackPlayer } from "@/features/growth/components/public-track-player";

type ArtistMedia = {
  id: string;
  provider: string;
  title: string;
  externalUrl: string;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  trackId: string | null;
};

function providerName(provider: string) {
  return provider === "YOUTUBE" ? "YouTube" : provider === "SPOTIFY" ? "Spotify" : provider;
}

export function ArtistMediaPlayer({ items }: { items: ArtistMedia[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const active = items.find((item) => item.id === activeId) ?? null;
  const isLocal = Boolean(active?.trackId);

  if (!items.length) return null;

  function select(item: ArtistMedia) {
    if (activeId !== item.id) {
      setActiveId(item.id);
    }
  }

  return (
    <section aria-label="Sanatçı medya oynatıcı" className="mt-8">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Radarune içinde dinle</h2>
          <p className="mt-1 text-sm text-muted">Videoyu veya sesi sanatçı sayfasından ayrılmadan oynat.</p>
        </div>
        <span className="text-xs font-medium text-muted">{items.length} içerik</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)]">
        <div className="max-h-[34rem] space-y-2 overflow-y-auto rounded-3xl border border-line bg-surface p-2">
          {items.map((item) => {
            const selected = activeId === item.id;
            return (
              <button
                className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition ${selected ? "border-accent bg-accent/10 shadow-sm" : "border-transparent bg-surface-strong hover:border-line hover:bg-background"}`}
                key={item.id}
                onClick={() => select(item)}
                type="button"
              >
                {item.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- provider thumbnails are arbitrary remote URLs.
                  <img alt="" className="size-12 shrink-0 rounded-xl object-cover" src={item.thumbnailUrl} />
                ) : (
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent/10 text-accent"><Volume2 className="size-5" /></span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{item.title}</span>
                  <span className="mt-1 block text-xs text-muted">{providerName(item.provider)}{item.trackId ? " · Radarune ses" : " · video embed"}</span>
                </span>
                {selected && item.trackId ? <span className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background"><Play className="size-3.5 fill-current" /></span> : null}
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-3xl border border-line bg-[#101817] shadow-sm">
          {active ? (
            <>
              <div className="aspect-video w-full bg-black">
                {active.embedUrl && !isLocal ? (
                  <iframe allow="autoplay; encrypted-media; picture-in-picture; fullscreen" className="size-full" src={active.embedUrl} title={active.title} />
                ) : active.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- provider thumbnails are arbitrary remote URLs.
                  <img alt="" className="size-full object-cover opacity-80" src={active.thumbnailUrl} />
                ) : (
                  <div className="grid size-full place-items-center text-white/60"><Volume2 className="size-8" /></div>
                )}
              </div>
              <div className="space-y-3 p-4 text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{active.title}</p>
                    <p className="mt-1 text-xs text-white/55">{providerName(active.provider)} · Radarune player</p>
                  </div>
                  <a aria-label={`${active.title} kaynağını aç`} className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20" href={active.externalUrl} rel="noreferrer" target="_blank"><ExternalLink className="size-4" /></a>
                </div>
                {isLocal && active.trackId ? <PublicTrackPlayer compact title={active.title} trackId={active.trackId} /> : <p className="text-xs text-white/55">Ses, oynatıcının kendi kontrol çubuğundan açılıp kapatılabilir.</p>}
              </div>
            </>
          ) : (
            <div className="grid aspect-video place-items-center px-6 text-center text-sm text-white/55">Bir içerik seç; oynatma burada başlayacak.</div>
          )}
        </div>
      </div>
    </section>
  );
}
