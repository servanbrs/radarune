"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

type ExternalMedia = {
  provider: string;
  externalUrl: string;
  embedUrl: string | null;
  title: string;
  embeddable: boolean;
};

export function PublicTrackPlayer({ trackId, title, compact = false, onPlay, externalMedia, hasUploadedAudio = true }: { trackId: string; title: string; compact?: boolean; onPlay?: () => void; externalMedia?: ExternalMedia | null; hasUploadedAudio?: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const lastVolumeRef = useRef(1);
  const [error, setError] = useState(false);
  const [useExternalPlayer, setUseExternalPlayer] = useState(!hasUploadedAudio && Boolean(externalMedia?.embedUrl));
  const externalEmbedUrl = externalMedia?.embedUrl;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 1;
    const sync = () => setCurrentTime(audio.currentTime);
    const loaded = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setError(false);
    };
    const ended = () => setPlaying(false);
    const failed = () => {
      setPlaying(false);
      if (externalEmbedUrl) setUseExternalPlayer(true);
      else setError(true);
    };
    audio.addEventListener("timeupdate", sync);
    audio.addEventListener("loadedmetadata", loaded);
    audio.addEventListener("durationchange", loaded);
    audio.addEventListener("ended", ended);
    audio.addEventListener("error", failed);
    return () => {
      audio.removeEventListener("timeupdate", sync);
      audio.removeEventListener("loadedmetadata", loaded);
      audio.removeEventListener("durationchange", loaded);
      audio.removeEventListener("ended", ended);
      audio.removeEventListener("error", failed);
    };
  }, [externalEmbedUrl]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().then(() => {
        setPlaying(true);
        onPlay?.();
      }).catch(() => setError(true));
    } else {
      audio.pause();
      setPlaying(false);
    }
  }

  function seek(value: number) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  }

  function changeVolume(value: number) {
    const next = Math.min(1, Math.max(0, value));
    if (next > 0) lastVolumeRef.current = next;
    setVolume(next);
    if (audioRef.current) audioRef.current.volume = next;
  }

  function toggleMute() {
    changeVolume(volume > 0 ? 0 : lastVolumeRef.current || 1);
  }

  return (
    <div className={`w-full min-w-0 rounded-2xl border border-black/[0.08] bg-[#f8f5ef] shadow-sm ${compact ? "p-2" : "p-3"}`} aria-label={`${title} oynatıcı`}>
      {useExternalPlayer && externalMedia?.embedUrl ? (
        <div className="overflow-hidden rounded-xl bg-black">
          <iframe
            allow="autoplay; encrypted-media; picture-in-picture"
            className="aspect-video w-full border-0"
            loading="lazy"
            src={`${externalMedia.embedUrl}${externalMedia.embedUrl.includes("?") ? "&" : "?"}playsinline=1&rel=0`}
            title={`${title} dış oynatıcı`}
          />
          <a className="block px-3 py-2 text-center text-xs font-semibold text-white/75 hover:text-white" href={externalMedia.externalUrl} rel="noreferrer" target="_blank">Sağlayıcıda aç</a>
        </div>
      ) : null}
      <audio ref={audioRef} preload="metadata" src={useExternalPlayer ? undefined : `/api/public/v1/tracks/${trackId}/stream`} />
      {!useExternalPlayer ? <div className="flex items-center gap-3">
        <button aria-label={playing ? `${title} duraklat` : `${title} oynat`} className={`grid shrink-0 place-items-center rounded-full bg-[#101817] text-white transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${compact ? "size-9" : "size-11"}`} onClick={toggle} type="button">
          {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
        </button>
        <div className="min-w-0 flex-1">
          <input aria-label={`${title} ilerleme`} className="h-1.5 w-full cursor-pointer accent-emerald-600" max={duration || 0} min="0" onChange={(event) => seek(Number(event.target.value))} step="0.1" type="range" value={Math.min(currentTime, duration || 0)} />
          <div className="mt-1 flex justify-between text-[11px] font-medium text-[#65706e]"><span>{formatTime(currentTime)}</span><span>{formatTime(duration)}</span></div>
        </div>
        {!compact ? <input aria-label={`${title} ses seviyesi`} className="hidden w-20 cursor-pointer accent-emerald-600 sm:block" max="1" min="0" onChange={(event) => changeVolume(Number(event.target.value))} step="0.05" type="range" value={volume} /> : null}
        <button aria-label={volume ? "Sesi kapat" : "Sesi aç"} className="grid size-9 shrink-0 place-items-center rounded-full text-[#52605d] hover:bg-black/[0.06]" onClick={toggleMute} type="button">
          {volume ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
        </button>
      </div> : null}
      {!hasUploadedAudio && externalMedia?.embedUrl && !useExternalPlayer ? <button className="mt-2 text-xs font-semibold text-emerald-700 underline" onClick={() => setUseExternalPlayer(true)} type="button">Dış sağlayıcı oynatıcısını kullan</button> : null}
      {error ? <p className="mt-2 text-xs font-medium text-red-700">Bu parça şu anda oynatılamıyor. Lütfen biraz sonra tekrar deneyin.</p> : null}
    </div>
  );
}
