"use client";

import { AlertCircle, Disc3, Pause, Play } from "lucide-react";
import { useRef, useState } from "react";

type ReleaseTrackRowProps = {
  number: number;
  title: string;
  artists: string;
  isrc: string | null;
  audioUploadId: string | null;
};

export function ReleaseTrackRow({ number, title, artists, isrc, audioUploadId }: ReleaseTrackRowProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  async function togglePlayback() {
    if (!audioRef.current || !audioUploadId) {
      setError(true);
      return;
    }

    setError(false);
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setError(true);
      setPlaying(false);
    }
  }

  return (
    <article className="group grid gap-4 px-4 py-4 transition hover:bg-accent/[0.04] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent/10 text-sm font-bold text-accent">{number}</span>
        <button aria-label={playing ? `${title} parçasını duraklat` : `${title} parçasını oynat`} className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40" disabled={!audioUploadId} onClick={() => void togglePlayback()} type="button">
          {playing ? <Pause className="size-4" fill="currentColor" /> : <Play className="ml-0.5 size-4" fill="currentColor" />}
        </button>
      </div>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2"><Disc3 className="size-4 shrink-0 text-accent" /><p className="truncate font-semibold">{title}</p></div>
        <p className="mt-1 truncate text-xs text-muted">{artists || "Sanatçı belirtilmedi"}</p>
        {error ? <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-danger"><AlertCircle className="size-3.5" />Ses dosyası bu ortamda oynatılamadı.</p> : !audioUploadId ? <p className="mt-2 text-xs text-muted">Ses dosyası henüz yüklenmedi.</p> : null}
      </div>
      <div className="flex items-center gap-2 sm:justify-end"><span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">{isrc ?? "ISRC bekleniyor"}</span></div>
      <audio className="hidden" onEnded={() => setPlaying(false)} onError={() => { setError(true); setPlaying(false); }} preload="metadata" ref={audioRef} src={audioUploadId ? `/api/storage/private/${audioUploadId}` : undefined} />
    </article>
  );
}
