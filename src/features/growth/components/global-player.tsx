"use client";

import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { useGlobalPlayer } from "@/features/growth/components/global-player-provider";

/** Persistent playback dock rendered by the root layout. */
export function GlobalPlayer() {
  const { item, queue, index, playing, position, duration, toggle, next, previous, seek, close } = useGlobalPlayer();
  if (!item || (!item.playbackUrl && !item.embedUrl)) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-surface/95 px-3 py-2.5 text-foreground shadow-[0_-12px_40px_rgba(0,0,0,0.16)] backdrop-blur-xl sm:px-5">
      <div className="mx-auto flex max-w-[1500px] items-center gap-2.5 sm:gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{item.title}</p>
          <p className="truncate text-xs text-muted">{item.artistName} · {item.sourceLabel} · {index + 1}/{queue.length || 1}</p>
        </div>
        {item.embedUrl ? (
          <iframe
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="hidden h-14 w-28 rounded-lg border border-line sm:block sm:w-44"
            src={item.embedUrl}
            title={`${item.title} oynatıcı`}
          />
        ) : null}
        <button aria-label="Önceki şarkı" className="rounded-full border border-line p-2" onClick={previous} type="button"><SkipBack className="size-4" /></button>
        <button aria-label={playing ? "Duraklat" : "Oynat"} className="rounded-full bg-foreground p-3 text-white" onClick={() => void toggle()} type="button">{playing ? <Pause className="size-4" /> : <Play className="size-4 fill-current" />}</button>
        <button aria-label="Sonraki şarkı" className="rounded-full border border-line p-2" onClick={next} type="button"><SkipForward className="size-4" /></button>
        {item.playbackUrl ? <input aria-label="Şarkı konumu" className="hidden w-28 accent-[var(--accent)] md:block" max={duration || 0} min="0" onChange={(event) => seek(Number(event.target.value))} type="range" value={Math.min(position, duration || 0)} /> : null}
        <button aria-label="Playerı kapat" className="rounded-full p-2 text-muted hover:text-foreground" onClick={close} type="button"><X className="size-4" /></button>
      </div>
    </div>
  );
}
