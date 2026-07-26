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

  if (!item || !item.playbackUrl) return null;

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
    <div className="fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-line bg-white/90 p-4 shadow-xl backdrop-blur md:inset-x-auto md:right-6 md:w-96">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">Radarune Player</p>
          <p className="mt-1 text-sm font-semibold">{item.title}</p>
          <p className="mt-1 text-xs text-muted">{item.artistName} · {item.sourceLabel}</p>
        </div>
        <button
          className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-white"
          onClick={() => void togglePlayback()}
          type="button"
        >
          {playing ? "Duraklat" : "Oynat"}
        </button>
      </div>
    </div>
  );
}
