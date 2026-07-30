"use client";

import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import type { PlayerItem } from "@/features/player/domain/player-source";

type GlobalPlayerProps = {
  item: PlayerItem | null;
  queue: PlayerItem[];
  index: number;
  playing: boolean;
  position: number;
  duration: number;
  error: string | null;
  toggle: () => Promise<void>;
  next: () => void;
  previous: () => void;
  seek: (value: number) => void;
  close: () => void;
};

function playerEmbedUrl(url: string, playing: boolean) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("autoplay", playing ? "1" : "0");
    return parsed.toString();
  } catch {
    return url;
  }
}

/** Persistent playback dock rendered by the root layout. */
export function GlobalPlayer({ item, queue, index, playing, position, duration, error, toggle, next, previous, seek, close }: GlobalPlayerProps) {
  if (!item) {
    return (
      <div className="pointer-events-auto fixed inset-x-3 bottom-3 z-[2147483647] rounded-2xl border border-white/15 bg-[#111827] px-4 py-3 text-white shadow-[0_-12px_40px_rgba(0,0,0,0.4)] sm:inset-x-5">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-3">
          <p className="text-xs text-white/70 sm:text-sm">Web player hazır — keşfet akışından bir şarkı seçin.</p>
          <div className="flex shrink-0 items-center gap-2 opacity-50">
            <button aria-label="Önceki şarkı" className="rounded-full border border-white/20 p-2" disabled type="button"><SkipBack className="size-4" /></button>
            <button aria-label="Oynat" className="rounded-full bg-white/20 p-2.5" disabled type="button"><Play className="size-4 fill-current" /></button>
            <button aria-label="Sonraki şarkı" className="rounded-full border border-white/20 p-2" disabled type="button"><SkipForward className="size-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  const hasPlayableSource = Boolean(item.playbackUrl || item.embedUrl);
  const dock = (
    <div className="pointer-events-auto fixed inset-x-3 bottom-3 z-[2147483647] rounded-2xl border border-white/15 bg-[#111827] px-3 py-2.5 text-white shadow-[0_-12px_40px_rgba(0,0,0,0.4)] sm:inset-x-5 sm:px-5">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2.5 sm:flex-nowrap sm:gap-4">
        <div className="min-w-0 flex-1 basis-[calc(100%-2.75rem)] sm:basis-auto">
          <p className="truncate text-sm font-semibold">{item.title}</p>
          <p className="truncate text-xs text-white/60">{item.artistName} · {item.sourceLabel} · {index + 1}/{queue.length || 1}</p>
          {error ? <p className="truncate text-[11px] text-red-400" role="status">{error}</p> : null}
        </div>
        <button aria-label="Playerı kapat" className="order-1 rounded-full p-2 text-white/70 hover:text-white sm:order-none" onClick={close} type="button"><X className="size-4" /></button>
        <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto sm:shrink-0 sm:justify-start">
          {item.embedUrl ? (
            <iframe
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              className="h-12 min-w-0 flex-1 rounded-lg border border-white/15 sm:h-14 sm:w-44 sm:flex-none"
              key={`${item.id}-${playing ? "playing" : "paused"}`}
              src={playerEmbedUrl(item.embedUrl, playing)}
              title={`${item.title} oynatıcı`}
            />
          ) : null}
          <button aria-label="Önceki şarkı" className="shrink-0 rounded-full border border-white/20 p-2" onClick={previous} type="button"><SkipBack className="size-4" /></button>
          <button aria-label={playing ? "Duraklat" : "Oynat"} className="shrink-0 rounded-full bg-foreground p-3 text-white disabled:opacity-40" disabled={!hasPlayableSource} onClick={() => void toggle()} type="button">{playing ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}</button>
          <button aria-label="Sonraki şarkı" className="shrink-0 rounded-full border border-white/20 p-2" onClick={next} type="button"><SkipForward className="size-4" /></button>
          {item.playbackUrl ? <input aria-label="Şarkı konumu" className="hidden w-28 accent-[var(--accent)] md:block" max={duration || 0} min="0" onChange={(event) => seek(Number(event.target.value))} type="range" value={Math.min(position, duration || 0)} /> : null}
        </div>
      </div>
    </div>
  );
  return dock;
}
