"use client";

import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";

type TrackPlayButtonProps = {
  trackId: string;
  label?: string;
  className?: string;
};

export function TrackPlayButton({
  trackId,
  label = "Radarune içinde oynat",
  className = "",
}: TrackPlayButtonProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  async function toggle() {
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
    <>
      <audio
        className="hidden"
        onEnded={() => setPlaying(false)}
        preload="none"
        ref={audioRef}
        src={`/api/public/v1/tracks/${trackId}/stream`}
      />
      <button
        aria-label={label}
        className={`inline-flex items-center justify-center rounded-full transition ${className}`}
        onClick={toggle}
        type="button"
      >
        {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
      </button>
    </>
  );
}
