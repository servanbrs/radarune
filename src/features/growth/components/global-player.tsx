"use client";

import { useEffect, useRef, useState } from "react";
import type { PlayerItem } from "@/features/player/domain/player-source";

export function GlobalPlayer({ item }: { item?: PlayerItem }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!item?.playbackUrl) return;
    audioRef.current = new Audio(item.playbackUrl);
    const audio = audioRef.current;
    const onEnded = () => setPlaying(false);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener("ended", onEnded);
      audioRef.current = null;
    };
  }, [item?.playbackUrl]);

  if (!item || (!item.playbackUrl && !item.embedUrl)) return null;

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 overflow-hidden rounded-3xl border border-line bg-surface/95 p-4 text-foreground shadow-xl backdrop-blur md:inset-x-auto md:right-6 md:w-96">
      {item.embedUrl ? (
        <iframe
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className={item.source === "SPOTIFY_EMBED" ? "mb-3 h-[152px] w-full rounded-2xl" : "mb-3 aspect-video w-full rounded-2xl"}
          src={item.embedUrl}
          title={`${item.title} oynatıcı`}
        />
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Radarune Player</p>
          <p className="mt-1 text-sm font-semibold">{item.title}</p>
          <p className="mt-1 text-xs text-muted">{item.artistName} · {item.sourceLabel}</p>
        </div>
        {item.playbackUrl ? (
          <button
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-white"
            onClick={() => void togglePlayback()}
            type="button"
          >
            {playing ? "Duraklat" : "Oynat"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
